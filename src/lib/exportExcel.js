import ExcelJS from "exceljs/dist/exceljs.min.js";
import { monthLabel } from "./calendar";
import { dayTotal, sumHours } from "./defaults";
import { identityRanges } from "./layout";
import { clampToLines } from "./text";
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

const LOGO_SPAN = 7;
const LOGO_BAND_ROWS = 3;
const LOGO_PIXEL_HEIGHT = 60;

const DESC_COL_WIDTH = 58;
const DESC_CHARS_PER_LINE = Math.round(DESC_COL_WIDTH * 1.1);
const DESC_MAX_LINES = 2;

function paint(ws, row, col, value, font, align) {
  const cell = ws.getCell(row + 1, col + 1);
  if (value !== undefined) cell.value = value;
  cell.font = font ?? FONT;
  cell.alignment = align ?? CENTER;
  cell.border = box;
  return cell;
}

function paintMerged(ws, top, left, bottom, right, value, font, align) {
  for (let r = top; r <= bottom; r += 1) {
    for (let c = left; c <= right; c += 1) {
      paint(ws, r, c, r === top && c === left ? value : "", font, align);
    }
  }
  if (bottom > top || right > left) {
    ws.mergeCells(top + 1, left + 1, bottom + 1, right + 1);
  }
}

function isNumeric(value) {
  return value !== "" && Number.isFinite(Number(value));
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
}) {
  if (calendar.length === 0) {
    throw new Error("Pick a valid month and year before exporting.");
  }
  if (activities.length === 0) {
    throw new Error("Add at least one activity before exporting.");
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(monthLabel(month));

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

  paintMerged(ws, 0, 0, LOGO_BAND_ROWS - 1, LOGO_SPAN - 1, "", FONT, CENTER);
  for (let r = 0; r < LOGO_BAND_ROWS; r += 1) {
    for (let c = LOGO_SPAN; c <= signCol; c += 1) {
      paint(ws, r, c, "", FONT, CENTER);
    }
  }

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
    paint(ws, headerRow, dayStart + i, d.day, FONT_BOLD, CENTER);
    paint(ws, weekdayRow, dayStart + i, d.label, FONT_BOLD, CENTER);
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
    paintMerged(
      ws,
      firstActivity,
      dayStart + i,
      lastActivity,
      dayStart + i,
      cellValue,
      FONT,
      CENTER,
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

  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = DESC_COL_WIDTH;
  for (let i = 0; i < dayCount; i += 1)
    ws.getColumn(dayStart + i + 1).width = 5;
  ws.getColumn(sumCol + 1).width = 12;
  ws.getColumn(counterCol + 1).width = 18;
  ws.getColumn(signCol + 1).width = 14;

  for (let r = 0; r < LOGO_BAND_ROWS; r += 1) ws.getRow(r + 1).height = 22;
  ws.getRow(idLabelRow + 1).height = 20;
  ws.getRow(idValueRow + 1).height = 24;
  ws.getRow(spacerRow + 1).height = 8;
  for (let r = firstActivity; r <= lastActivity; r += 1)
    ws.getRow(r + 1).height = 30;

  const logoWidth = Math.round((LOGO_PIXEL_HEIGHT * LOGO_WIDTH) / LOGO_HEIGHT);
  const imageId = wb.addImage({
    base64: LOGO_BASE64,
    extension: LOGO_EXTENSION,
  });
  ws.addImage(imageId, {
    tl: { col: 0.2, row: 0.3 },
    ext: { width: logoWidth, height: LOGO_PIXEL_HEIGHT },
  });

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
