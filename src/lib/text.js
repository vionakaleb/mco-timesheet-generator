function wrapLines(text, charsPerLine) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  const hardWrap = (word) => {
    let rest = word;
    while (rest.length > charsPerLine) {
      lines.push(rest.slice(0, charsPerLine));
      rest = rest.slice(charsPerLine);
    }
    return rest;
  };

  for (const word of words) {
    if (!line) {
      line = word.length > charsPerLine ? hardWrap(word) : word;
    } else if (line.length + 1 + word.length <= charsPerLine) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word.length > charsPerLine ? hardWrap(word) : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function clampToLines(
  doc,
  text,
  maxWidthPt,
  maxLines = 2,
  ellipsis = "...",
) {
  const value = (text ?? "").trim();
  if (!value) return value;

  const lines = doc.splitTextToSize(value, maxWidthPt);
  if (lines.length <= maxLines) return lines.join("\n");

  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncateToFit(
    doc,
    kept[maxLines - 1],
    maxWidthPt,
    ellipsis,
  );

  return kept.join("\n");
}

function truncateToFit(doc, line, maxWidthPt, ellipsis) {
  let truncated = line;
  while (
    truncated.length > 0 &&
    doc.getTextWidth(truncated + ellipsis) > maxWidthPt
  ) {
    truncated = truncated.slice(0, -1).trimEnd();
  }
  return `${truncated}${ellipsis}`;
}
