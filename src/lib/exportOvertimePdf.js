import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { monthLabel } from "./calendar";
import { buildOvertimeRows, describeOvertime } from "./overtime";
import { LOGO_EXTENSION, LOGO_OVERTIME_BASE64 } from "../assets/logo";
import { clampToLines } from "./text";

const PAGE_MARGIN = 40;
const FONT_FAMILY = "helvetica";
const TEXT_COLOR = [51, 51, 51];
const BORDER_COLOR = [51, 51, 51];
const LOGO_HEIGHT_PT = 40;
const LOGO_WIDTH = 274;
const LOGO_HEIGHT = 110;

const CELL_PADDING = 4;
const CELL_BORDER_WIDTH = 0.5;
const DESCRIPTION_MAX_LINES = 1;

const COLUMN_WIDTHS = {
  name: 65,
  date: 95,
  unit: 70,
  time: 70,
  totalHours: 50,
};

const INTRO_TEXT =
  "Sehubung dengan adanya tugas pekerjaan dan/atau kegiatan kedinasan yang tidak dapat ditunda/ditangguhkan, sehingga membutuhkan penyelesaian dengan segera dengan ini, kami memerintahkan kepada pegawai yang tercantum dalam daftar dibawah ini yang menyelesaikan kerja lembur.";

function descriptionColumnWidth(pageWidth) {
  const tableWidth = pageWidth - PAGE_MARGIN * 2;
  const fixedColumnsWidth = Object.values(COLUMN_WIDTHS).reduce(
    (a, b) => a + b,
    0,
  );
  const autoColumnWidth = tableWidth - fixedColumnsWidth;
  return autoColumnWidth - CELL_PADDING * 2 - CELL_BORDER_WIDTH * 2;
}

function dataUriExtension(dataUri) {
  const match = /^data:image\/([a-zA-Z+]+);base64,/.exec(dataUri ?? "");
  const subtype = match ? match[1].toLowerCase() : "png";
  if (subtype === "jpeg" || subtype === "jpg") return "JPEG";
  if (subtype === "gif") return "GIF";
  return "PNG";
}

function resolveLogo(customLogo) {
  if (customLogo && customLogo.dataUri) {
    return {
      source: customLogo.dataUri,
      format: dataUriExtension(customLogo.dataUri),
      width: customLogo.width || LOGO_WIDTH,
      height: customLogo.height || LOGO_HEIGHT,
    };
  }
  return {
    source: `data:image/${LOGO_EXTENSION};base64,${LOGO_OVERTIME_BASE64}`,
    format: LOGO_EXTENSION.toUpperCase(),
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  };
}

function drawLogo(doc, customLogo, pageWidth) {
  const activeLogo = resolveLogo(customLogo);
  const logoWidthPt = (LOGO_HEIGHT_PT * activeLogo.width) / activeLogo.height;
  const x = pageWidth - PAGE_MARGIN - logoWidthPt;
  try {
    doc.addImage(
      activeLogo.source,
      activeLogo.format,
      x,
      PAGE_MARGIN,
      logoWidthPt,
      LOGO_HEIGHT_PT,
    );
  } catch (err) {
    // Ignore unsupported logo format.
  }
}

function drawTitle(doc, pageWidth, y) {
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_COLOR);
  doc.text("SURAT PERINTAH KERJA LEMBUR", pageWidth / 2, y, {
    align: "center",
  });
}

function drawIntro(doc, pageWidth, y) {
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_COLOR);
  const maxWidth = pageWidth - PAGE_MARGIN * 2;
  const lines = doc.splitTextToSize(INTRO_TEXT, maxWidth);
  doc.text(lines, PAGE_MARGIN, y);
  return y + lines.length * 12;
}

function drawFooter(doc, pageWidth, startY, form, signature) {
  const columnWidth = (pageWidth - PAGE_MARGIN * 2) / 2;
  const leftX = PAGE_MARGIN;
  const rightX = PAGE_MARGIN + columnWidth;

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_COLOR);

  doc.text("Pemohon", leftX, startY);
  doc.text("Disetujui Oleh", rightX, startY);

  let signatureY = startY + 20;
  const signatureMaxHeight = 50;

  if (signature && signature.dataUri) {
    const natW = signature.width || 100;
    const natH = signature.height || 50;
    const scale = Math.min(100 / natW, signatureMaxHeight / natH, 1);
    const imgW = natW * scale;
    const imgH = natH * scale;
    try {
      doc.addImage(
        signature.dataUri,
        dataUriExtension(signature.dataUri),
        leftX,
        signatureY,
        imgW,
        imgH,
      );
    } catch (err) {
      // Ignore unsupported signature.
    }
  }

  const namesY = startY + 20 + signatureMaxHeight + 16;

  doc.text(`Nama : ${form.name || "-"}`, leftX, namesY);
  doc.text(`Role  : ${form.role || "-"}`, leftX, namesY + 14);

  doc.text(`Nama : ${form.counterSign || "-"}`, rightX, namesY);
  doc.text(`Role  : ${form.approverRole || "-"}`, rightX, namesY + 14);
}

function buildTableBody(doc, maxDescriptionWidthPt, rows, form) {
  if (rows.length === 0) return [];

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);

  return rows.map((row, i) => {
    const cells = [];

    if (i === 0) {
      cells.push({
        content: form.name || "-",
        rowSpan: rows.length,
        styles: { valign: "middle", halign: "center" },
      });
    }

    cells.push({ content: row.date });

    if (i === 0) {
      cells.push({
        content: form.unitKerja || "-",
        rowSpan: rows.length,
        styles: { valign: "middle", halign: "center" },
      });
    }

    cells.push({ content: row.time });
    cells.push({ content: `${row.totalHours} Jam` });

    const description = describeOvertime(
      row,
      form.weekdayOvertimeDesc || "-",
      form.holidayOvertimeDesc || "-",
    );
    cells.push({
      content: clampToLines(
        doc,
        description,
        maxDescriptionWidthPt,
        DESCRIPTION_MAX_LINES,
      ),
      styles: { halign: "left" },
    });

    return cells;
  });
}

function buildTotalRow(rows) {
  return [
    {
      content: "Total",
      colSpan: 4,
      styles: { halign: "center", fontStyle: "bold" },
    },
    {
      content: `${rows.length} hari`,
      colSpan: 2,
      styles: { halign: "center", fontStyle: "bold" },
    },
  ];
}

export async function exportOvertimePDF({
  form,
  calendar,
  hours,
  dayTypes,
  signature,
  logo,
}) {
  const rows = buildOvertimeRows({
    calendar,
    hours,
    dayTypes,
    defaultHours: form.defaultHours,
    month: Number(form.month),
    year: Number(form.year),
  });

  if (rows.length === 0) {
    throw new Error(
      "No overtime hours detected. Weekdays must be more than Normal Hours (e.g. 9). For Holidays must be more than 0 Hours",
    );
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  drawLogo(doc, logo, pageWidth);
  drawTitle(doc, pageWidth, PAGE_MARGIN + 70);
  const introEndY = drawIntro(doc, pageWidth, PAGE_MARGIN + 100);

  const maxDescriptionWidthPt = descriptionColumnWidth(pageWidth);
  const body = buildTableBody(doc, maxDescriptionWidthPt, rows, form);
  body.push(buildTotalRow(rows));

  autoTable(doc, {
    head: [
      [
        "Nama",
        "Hari/Tanggal",
        "Unit Kerja",
        "Waktu Lembur",
        "Total Lembur (Jam)",
        "Pekerjaan yang harus dikerjakan",
      ],
    ],
    body,
    startY: introEndY + 10,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: "grid",
    styles: {
      font: FONT_FAMILY,
      fontSize: 9,
      cellPadding: CELL_PADDING,
      lineColor: BORDER_COLOR,
      lineWidth: CELL_BORDER_WIDTH,
      textColor: TEXT_COLOR,
      valign: "middle",
      halign: "center",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: TEXT_COLOR,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: COLUMN_WIDTHS.name },
      1: { cellWidth: COLUMN_WIDTHS.date },
      2: { cellWidth: COLUMN_WIDTHS.unit },
      3: { cellWidth: COLUMN_WIDTHS.time },
      4: { cellWidth: COLUMN_WIDTHS.totalHours },
      5: { cellWidth: "auto", halign: "left" },
    },
  });

  const FOOTER_HEIGHT = 130;
  const availableSpace = pageHeight - doc.lastAutoTable.finalY - 40;
  let footerStartY;

  if (availableSpace >= FOOTER_HEIGHT) {
    footerStartY = doc.lastAutoTable.finalY + 40;
  } else {
    doc.addPage();
    footerStartY = PAGE_MARGIN;
  }

  drawFooter(doc, pageWidth, footerStartY, form, signature);

  doc.save(
    `Overtime - ${form.name} - ${monthLabel(Number(form.month))} ${form.year}.pdf`,
  );
}
