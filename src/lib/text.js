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
  text,
  charsPerLine,
  maxLines = 2,
  ellipsis = "...",
) {
  const value = (text ?? "").trim();
  if (!value) return value;

  const lines = wrapLines(value, charsPerLine);
  if (lines.length <= maxLines) return value;

  const kept = lines.slice(0, maxLines);
  let last = kept[kept.length - 1];
  if (last.length + ellipsis.length > charsPerLine) {
    last = last.slice(0, Math.max(0, charsPerLine - ellipsis.length)).trimEnd();
  }
  kept[kept.length - 1] = `${last}${ellipsis}`;
  return kept.join(" ");
}
