export const DEFAULT_GENERAL_ACTIVITIES = [
  "Support development, tracing & bugfixing for squad 6.",
  "Code review pull requests in WBA, E-Form, QR E-Form"
];

export function sumHours(hours) {
  return Object.values(hours).reduce((total, value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && value !== "" ? total + numeric : total;
  }, 0);
}

export function dayTotal(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && value !== "" ? numeric : 0;
}
