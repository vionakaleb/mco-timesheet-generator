export function identitySpans(dayCount) {
  const fixed = {
    role: 1,
    name: 1,
    empSignature: 5,
    month: 4,
    year: 3,
    deptSignature: 2,
  };
  const totalColumns = dayCount + 5;
  const used = fixed.role + fixed.name + fixed.empSignature + fixed.month + fixed.year + fixed.deptSignature;
  return { ...fixed, departmentHead: Math.max(1, totalColumns - used) };
}

export function identityRanges(dayCount) {
  const spans = identitySpans(dayCount);
  const order = ['role', 'name', 'empSignature', 'month', 'year', 'departmentHead', 'deptSignature'];
  const ranges = {};
  let cursor = 0;
  for (const key of order) {
    const span = spans[key];
    ranges[key] = { start: cursor, end: cursor + span - 1, span };
    cursor += span;
  }
  return ranges;
}
