import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { monthLabel } from "./calendar";
import { dayTotal, sumHours } from "./defaults";
import { clampToLines } from "./text";
import { TYPE_HEX, TYPE_LABEL, LEGEND_TYPES } from "./dayTypes";
import {
  LOGO_BASE64,
  LOGO_EXTENSION,
  LOGO_WIDTH,
  LOGO_HEIGHT,
} from "../assets/logo";

const PAGE_MARGIN = 24;
const FONT_FAMILY = "helvetica";
const TEXT_COLOR = [51, 51, 51];
const BORDER_COLOR = [51, 51, 51];

const DESC_CHARS_PER_LINE = 60;
const DESC_MAX_LINES = 2;

const SIGNATURE_MAX_WIDTH = 90;
const SIGNATURE_MAX_HEIGHT = 36;
const IDENTITY_ROW_HEIGHT = 44;
const IDENTITY_LABEL_HEIGHT = 16;

function hexToRgb(hex) {
  if (!hex) return null;
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function dataUriExtension(dataUri) {
  const match = /^data:image\/([a-zA-Z+]+);base64,/.exec(dataUri ?? "");
  const subtype = match ? match[1].toLowerCase() : "png";
  if (subtype === "jpeg" || subtype === "jpg") return "JPEG";
  if (subtype === "gif") return "GIF";
  return "PNG";
}

function drawIdentityHeader(doc, params, pageWidth) {
  const { role, name, month, year, departmentHead, signature } = params;

  const startY = PAGE_MARGIN + 50;
  const rowHeight = IDENTITY_ROW_HEIGHT;
  const labelHeight = IDENTITY_LABEL_HEIGHT;

  const columns = [
    { label: "Role", value: role },
    { label: "Name", value: name },
    { label: "Signature", value: "", isSignature: true },
    { label: "Month", value: monthLabel(month) },
    { label: "Year", value: String(year) },
    { label: "Department Head", value: departmentHead },
    { label: "Signature", value: "" },
  ];

  const usableWidth = pageWidth - PAGE_MARGIN * 2;
  const colWidth = usableWidth / columns.length;

  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);

  columns.forEach((col, i) => {
    const x = PAGE_MARGIN + i * colWidth;
    doc.setFillColor(245, 245, 245);
    doc.rect(x, startY, colWidth, labelHeight, "FD");
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_COLOR);
    doc.text(col.label, x + colWidth / 2, startY + labelHeight / 2 + 3, {
      align: "center",
    });

    doc.rect(x, startY + labelHeight, colWidth, rowHeight);
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(9);

    if (col.isSignature && signature && signature.dataUri) {
      const natW = signature.width || SIGNATURE_MAX_WIDTH;
      const natH = signature.height || SIGNATURE_MAX_HEIGHT;
      const scale = Math.min(
        SIGNATURE_MAX_WIDTH / natW,
        SIGNATURE_MAX_HEIGHT / natH,
        1,
      );
      const imgW = natW * scale;
      const imgH = natH * scale;
      const imgX = x + (colWidth - imgW) / 2;
      const imgY = startY + labelHeight + (rowHeight - imgH) / 2;
      try {
        doc.addImage(
          signature.dataUri,
          dataUriExtension(signature.dataUri),
          imgX,
          imgY,
          imgW,
          imgH,
        );
      } catch (err) {
        // If the image format is not supported, fail silently.
      }
    } else if (col.value) {
      doc.text(
        String(col.value),
        x + colWidth / 2,
        startY + labelHeight + rowHeight / 2 + 3,
        { align: "center" },
      );
    }
  });

  return startY + labelHeight + rowHeight + 10;
}

function drawLogo(doc) {
  const logoHeightPt = 36;
  const logoWidthPt = (logoHeightPt * LOGO_WIDTH) / LOGO_HEIGHT;
  const ext = LOGO_EXTENSION.toUpperCase();
  try {
    doc.addImage(
      `data:image/${LOGO_EXTENSION};base64,${LOGO_BASE64}`,
      ext,
      PAGE_MARGIN,
      PAGE_MARGIN,
      logoWidthPt,
      logoHeightPt,
    );
  } catch (err) {
    // Skip the logo if format is unsupported.
  }
}

function buildTableBody(activities, calendar, hours) {
  return activities.map((desc, i) => {
    const row = [
      { content: String(i + 1) },
      {
        content: clampToLines(desc, DESC_CHARS_PER_LINE, DESC_MAX_LINES),
        styles: { halign: "left" },
      },
    ];

    // The day cells are merged across all rows, so only the first row holds the value.
    // jspdf-autotable does not support row-spanning across body rows the way Excel
    // merges do, so we put the hour value in every row but only show it on the first.
    calendar.forEach((d) => {
      if (i === 0) {
        row.push({
          content: hours[d.day] ?? "",
          rowSpan: activities.length,
        });
      }
    });

    if (i === 0) {
      row.push({ content: sumHours(hours), rowSpan: activities.length });
      row.push({ content: "", rowSpan: activities.length });
      row.push({ content: "", rowSpan: activities.length });
    }

    return row;
  });
}

function buildTotalRow(calendar, hours) {
  const row = [
    {
      content: "TOTAL",
      colSpan: 2,
      styles: { fontStyle: "bold", halign: "center" },
    },
  ];
  calendar.forEach((d) => {
    row.push({
      content: String(dayTotal(hours[d.day])),
      styles: { fontStyle: "bold" },
    });
  });
  row.push({
    content: String(sumHours(hours)),
    styles: { fontStyle: "bold" },
  });
  row.push({ content: "" });
  row.push({ content: "" });
  return row;
}

function buildHeadRows(calendar, dayTypes) {
  const top = [
    { content: "No", rowSpan: 2 },
    { content: "Project \n Activity Description", rowSpan: 2 },
    ...calendar.map((d) => ({
      content: String(d.day),
      styles: {
        fillColor: hexToRgb(TYPE_HEX[dayTypes[d.day]]) || [255, 255, 255],
      },
    })),
    { content: "Sum", rowSpan: 2 },
    { content: "Counter Sign Name", rowSpan: 2 },
    { content: "Signature", rowSpan: 2 },
  ];

  const bottom = calendar.map((d) => ({
    content: d.label,
    styles: {
      fillColor: hexToRgb(TYPE_HEX[dayTypes[d.day]]) || [255, 255, 255],
    },
  }));

  return [top, bottom];
}

function drawLegend(doc, startY, pageWidth) {
  const boxSize = 10;
  const gap = 6;
  const itemPadding = 14;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_COLOR);
  doc.text("Legend:", PAGE_MARGIN, startY + 8);

  let x = PAGE_MARGIN + 40;
  const y = startY;

  doc.setFont(FONT_FAMILY, "normal");
  LEGEND_TYPES.forEach((type) => {
    const rgb = hexToRgb(TYPE_HEX[type]) || [255, 255, 255];
    doc.setFillColor(...rgb);
    doc.setDrawColor(...BORDER_COLOR);
    doc.rect(x, y, boxSize, boxSize, "FD");
    doc.text(TYPE_LABEL[type], x + boxSize + 4, y + 8);
    const labelWidth = doc.getTextWidth(TYPE_LABEL[type]);
    x += boxSize + 4 + labelWidth + itemPadding;

    if (x > pageWidth - PAGE_MARGIN - 100) {
      // Stop placing items if we run out of room.
      x = pageWidth;
    }
  });
}

export async function exportTimesheetPDF({
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

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a3",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  drawLogo(doc);

  const tableStartY = drawIdentityHeader(
    doc,
    {
      role,
      name,
      month,
      year,
      departmentHead,
      signature,
    },
    pageWidth,
  );

  const head = buildHeadRows(calendar, dayTypes);
  const body = buildTableBody(activities, calendar, hours);
  body.push(buildTotalRow(calendar, hours));

  // The counter sign value goes into the second-to-last column of the first body row.
  if (counterSign && body.length > 1) {
    const firstRow = body[0];
    // Find the counter-sign cell (it has rowSpan and is the second from end among the spanned cells).
    const spannedCells = firstRow.filter((c) => c.rowSpan);
    if (spannedCells.length >= 2) {
      spannedCells[spannedCells.length - 2].content = counterSign;
    }
  }

  const usableWidth = pageWidth - PAGE_MARGIN * 2;

  // Allocate fixed columns first, then split the rest evenly across day columns.
  const noColumnWidth = 24;
  const sumColumnWidth = 36;
  const counterSignWidth = 70;
  const signatureWidth = 70;
  const fixedColumnsTotal =
    noColumnWidth + sumColumnWidth + counterSignWidth + signatureWidth;

  // Description column takes a share of what's left, with day columns filling the rest.
  // Cap description at a reasonable width and let day columns expand if there's room.
  const remainingAfterFixed = usableWidth - fixedColumnsTotal;
  const minDayWidth = 14;
  const idealDescWidth = 140;

  let descColumnWidth = idealDescWidth;
  let dayColumnWidth =
    (remainingAfterFixed - descColumnWidth) / calendar.length;

  if (dayColumnWidth < minDayWidth) {
    // Shrink the description column to give day columns enough room.
    dayColumnWidth = minDayWidth;
    descColumnWidth = remainingAfterFixed - dayColumnWidth * calendar.length;
  }

  const columnStyles = {
    0: { cellWidth: noColumnWidth, halign: "center" },
    1: { cellWidth: descColumnWidth, halign: "left" },
  };
  calendar.forEach((d, i) => {
    columnStyles[2 + i] = {
      cellWidth: dayColumnWidth,
      halign: "center",
      fillColor: hexToRgb(TYPE_HEX[dayTypes[d.day]]) || [255, 255, 255],
    };
  });
  const sumIndex = 2 + calendar.length;
  columnStyles[sumIndex] = { cellWidth: sumColumnWidth, halign: "center" };
  columnStyles[sumIndex + 1] = {
    cellWidth: counterSignWidth,
    halign: "center",
  };
  columnStyles[sumIndex + 2] = {
    cellWidth: signatureWidth,
    halign: "center",
  };

  autoTable(doc, {
    head,
    body,
    startY: tableStartY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 50 },
    theme: "grid",
    tableWidth: usableWidth,
    styles: {
      font: FONT_FAMILY,
      fontSize: 8,
      cellPadding: 3,
      lineColor: BORDER_COLOR,
      lineWidth: 0.5,
      textColor: TEXT_COLOR,
      valign: "middle",
      halign: "center",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: TEXT_COLOR,
      fontStyle: "bold",
    },
    columnStyles,
  });

  const legendY = doc.lastAutoTable.finalY + 12;
  if (legendY < pageHeight - 30) {
    drawLegend(doc, legendY, pageWidth);
  }

  doc.save(`Timesheet MCO - ${name} - ${monthLabel(month)} ${year}.pdf`);
}
