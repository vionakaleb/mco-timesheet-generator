import ExcelJS from "exceljs/dist/exceljs.min.js";
import { monthLabel } from "./calendar";
import { dayTotal, sumHours } from "./defaults";
import { identityRanges } from "./layout";
import { clampToLines } from "./text";
import { TYPE_HEX, TYPE_LABEL, LEGEND_TYPES } from "./dayTypes";
import {
  LOGO_BASE64,
  LOGO_EXTENSION,
  LOGO_WIDTH,
  LOGO_HEIGHT,
} from "../assets/logo";

const BORDER = "FF333333";
const thin = { style: "thin", color: { argb: BORDER } };
const box = { top: thin, left: thin, bottom: thin, right: thin };
const FONT = { name: "IBM Plex Sans", size: 10 };
const FONT_BOLD = { name: "IBM Plex Sans", size: 10, bold: true };
const CENTER = { vertical: "middle", horizontal: "center", wrapText: true };
const LEFT = { vertical: "middle", horizontal: "left", wrapText: true };

const LOGO_BAND_ROWS = 3;
const LOGO_PIXEL_HEIGHT = 60;

const ROLE_COL_WIDTH = 12;
const IDVALUE_ROW_PT = 36;
const DAY_COL_PX = 36;

const DESC_COL_WIDTH = 58;
const DESC_CHARS_PER_LINE = Math.round(DESC_COL_WIDTH * 1.1);
const DESC_MAX_LINES = 2;

const SIGNATURE_MAX_WIDTH = 150;
const SIGNATURE_MAX_HEIGHT = 40;

function paint(ws, row, col, value, font, align, fillHex) {
  const cell = ws.getCell(row + 1, col + 1);
  if (value !== undefined) cell.value = value;
  cell.font = font ?? FONT;
  cell.alignment = align ?? CENTER;
  cell.border = box;
  if (fillHex) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${fillHex}` },
    };
  }
  return cell;
}

function paintMerged(
  ws,
  top,
  left,
  bottom,
  right,
  value,
  font,
  align,
  fillHex,
) {
  for (let r = top; r <= bottom; r += 1) {
    for (let c = left; c <= right; c += 1) {
      paint(
        ws,
        r,
        c,
        r === top && c === left ? value : "",
        font,
        align,
        fillHex,
      );
    }
  }
  if (bottom > top || right > left) {
    ws.mergeCells(top + 1, left + 1, bottom + 1, right + 1);
  }
}

function isNumeric(value) {
  return value !== "" && Number.isFinite(Number(value));
}

function signatureExtension(dataUri) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,/.exec(dataUri ?? "");
  const mime = match ? match[1] : "image/png";
  if (mime === "image/jpeg") return "jpeg";
  if (mime === "image/gif") return "gif";
  return "png";
}

function buildLegendSheet(wb) {
  const legend = wb.addWorksheet("Legend");
  paintMerged(legend, 0, 0, 0, 1, "Legend:", FONT_BOLD, CENTER);
  LEGEND_TYPES.forEach((type, i) => {
    paint(legend, 1 + i, 0, "", FONT, CENTER, TYPE_HEX[type]);
    paint(legend, 1 + i, 1, TYPE_LABEL[type], FONT, LEFT);
  });
  legend.getColumn(1).width = 10;
  legend.getColumn(2).width = 18;
  for (let r = 0; r <= LEGEND_TYPES.length; r += 1)
    legend.getRow(r + 1).height = 20;
}

function addSignature(ws, wb, signature, range, rowIndex) {
  const natW = signature.width || SIGNATURE_MAX_WIDTH;
  const natH = signature.height || SIGNATURE_MAX_HEIGHT;
  const scale = Math.min(
    SIGNATURE_MAX_WIDTH / natW,
    SIGNATURE_MAX_HEIGHT / natH,
    1,
  );
  const imgW = Math.round(natW * scale);
  const imgH = Math.round(natH * scale);

  const rowPx = Math.round((IDVALUE_ROW_PT * 4) / 3);
  const cellWidthPx = range.span * DAY_COL_PX;
  const offsetX = Math.max((cellWidthPx - imgW) / 2, 0);
  const offsetY = Math.max((rowPx - imgH) / 2, 0);
  const colsIn = Math.floor(offsetX / DAY_COL_PX);

  const imageId = wb.addImage({
    base64: signature.dataUri.split(",")[1],
    extension: signatureExtension(signature.dataUri),
  });
  ws.addImage(imageId, {
    tl: {
      col: range.start + colsIn + (offsetX - colsIn * DAY_COL_PX) / DAY_COL_PX,
      row: rowIndex + offsetY / rowPx,
    },
    ext: { width: imgW, height: imgH },
  });
}

export async function exportTimesheet({
  role,
  name,
  month,
  year,
  departmentHead,
  counterSign,
  calendar,
  activities,
  hours,
  dayTypes,
  signature,
}) {
  if (calendar.length === 0) {
    throw new Error("Pick a valid month and year before exporting.");
  }
  if (activities.length === 0) {
    throw new Error("Add at least one activity before exporting.");
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(monthLabel(month));
  ws.views = [{ showGridLines: false }];

  const dayCount = calendar.length;
  const dayStart = 2;
  const sumCol = 2 + dayCount;
  const counterCol = 3 + dayCount;
  const signCol = 4 + dayCount;
  const ids = identityRanges(dayCount);

  const idLabelRow = LOGO_BAND_ROWS;
  const idValueRow = idLabelRow + 1;
  const spacerRow = idValueRow + 1;
  const headerRow = spacerRow + 1;
  const weekdayRow = headerRow + 1;
  const firstActivity = weekdayRow + 1;
  const lastActivity = firstActivity + activities.length - 1;
  const totalRow = lastActivity + 1;

  const group = (range, row, value, font) =>
    paintMerged(ws, row, range.start, row, range.end, value, font, CENTER);

  group(ids.role, idLabelRow, "Role", FONT_BOLD);
  group(ids.name, idLabelRow, "Name", FONT_BOLD);
  group(ids.empSignature, idLabelRow, "Signature", FONT_BOLD);
  group(ids.month, idLabelRow, "Month", FONT_BOLD);
  group(ids.year, idLabelRow, "Year", FONT_BOLD);
  group(ids.departmentHead, idLabelRow, "Department Head", FONT_BOLD);
  group(ids.deptSignature, idLabelRow, "Signature", FONT_BOLD);

  group(ids.role, idValueRow, role, FONT);
  group(ids.name, idValueRow, name, FONT);
  group(ids.empSignature, idValueRow, "", FONT);
  group(ids.month, idValueRow, monthLabel(month), FONT);
  group(ids.year, idValueRow, String(year), FONT);
  group(ids.departmentHead, idValueRow, departmentHead, FONT);
  group(ids.deptSignature, idValueRow, "", FONT);

  paintMerged(ws, spacerRow, 0, spacerRow, signCol, "", FONT, CENTER);

  paintMerged(ws, headerRow, 0, weekdayRow, 0, "No", FONT_BOLD, CENTER);
  paintMerged(
    ws,
    headerRow,
    1,
    weekdayRow,
    1,
    "Project Name\nActivity Description",
    FONT_BOLD,
    CENTER,
  );
  paintMerged(
    ws,
    headerRow,
    sumCol,
    weekdayRow,
    sumCol,
    "Sum (hours)",
    FONT_BOLD,
    CENTER,
  );
  paintMerged(
    ws,
    headerRow,
    counterCol,
    weekdayRow,
    counterCol,
    "Counter Sign Name",
    FONT_BOLD,
    CENTER,
  );
  paintMerged(
    ws,
    headerRow,
    signCol,
    weekdayRow,
    signCol,
    "Signature",
    FONT_BOLD,
    CENTER,
  );
  calendar.forEach((d, i) => {
    const fill = TYPE_HEX[dayTypes[d.day]];
    paint(ws, headerRow, dayStart + i, d.day, FONT_BOLD, CENTER, fill);
    paint(ws, weekdayRow, dayStart + i, d.label, FONT_BOLD, CENTER, fill);
  });

  activities.forEach((desc, i) => {
    paint(ws, firstActivity + i, 0, i + 1, FONT, CENTER);
    paint(
      ws,
      firstActivity + i,
      1,
      clampToLines(desc, DESC_CHARS_PER_LINE, DESC_MAX_LINES),
      FONT,
      LEFT,
    );
  });

  calendar.forEach((d, i) => {
    const value = hours[d.day];
    const cellValue = isNumeric(value) ? Number(value) : value;
    const fill = TYPE_HEX[dayTypes[d.day]];
    paintMerged(
      ws,
      firstActivity,
      dayStart + i,
      lastActivity,
      dayStart + i,
      cellValue,
      FONT,
      CENTER,
      fill,
    );
  });
  paintMerged(
    ws,
    firstActivity,
    sumCol,
    lastActivity,
    sumCol,
    sumHours(hours),
    FONT_BOLD,
    CENTER,
  );
  paintMerged(
    ws,
    firstActivity,
    counterCol,
    lastActivity,
    counterCol,
    counterSign,
    FONT,
    CENTER,
  );
  paintMerged(
    ws,
    firstActivity,
    signCol,
    lastActivity,
    signCol,
    "",
    FONT,
    CENTER,
  );

  paintMerged(ws, totalRow, 0, totalRow, 1, "TOTAL", FONT_BOLD, CENTER);
  calendar.forEach((d, i) =>
    paint(
      ws,
      totalRow,
      dayStart + i,
      dayTotal(hours[d.day]),
      FONT_BOLD,
      CENTER,
    ),
  );
  paint(ws, totalRow, sumCol, sumHours(hours), FONT_BOLD, CENTER);
  paint(ws, totalRow, counterCol, "", FONT, CENTER);
  paint(ws, totalRow, signCol, "", FONT, CENTER);

  ws.getColumn(1).width = ROLE_COL_WIDTH;
  ws.getColumn(2).width = DESC_COL_WIDTH;
  for (let i = 0; i < dayCount; i += 1)
    ws.getColumn(dayStart + i + 1).width = 5;
  ws.getColumn(sumCol + 1).width = 12;
  ws.getColumn(counterCol + 1).width = 18;
  ws.getColumn(signCol + 1).width = 14;

  for (let r = 0; r < LOGO_BAND_ROWS; r += 1) ws.getRow(r + 1).height = 22;
  ws.getRow(idLabelRow + 1).height = 20;
  ws.getRow(idValueRow + 1).height = IDVALUE_ROW_PT;
  ws.getRow(spacerRow + 1).height = 8;
  for (let r = firstActivity; r <= lastActivity; r += 1)
    ws.getRow(r + 1).height = 30;

  const logoWidth = Math.round((LOGO_PIXEL_HEIGHT * LOGO_WIDTH) / LOGO_HEIGHT);
  const logoId = wb.addImage({
    base64: LOGO_BASE64,
    extension: LOGO_EXTENSION,
  });
  ws.addImage(logoId, {
    tl: { col: 0.2, row: 0.3 },
    ext: { width: logoWidth, height: LOGO_PIXEL_HEIGHT },
  });

  if (signature && signature.dataUri) {
    addSignature(ws, wb, signature, ids.empSignature, idValueRow);
  }

  buildLegendSheet(wb);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Timesheet_${monthLabel(month)}_${year}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
