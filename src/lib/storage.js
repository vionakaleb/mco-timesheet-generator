const STORAGE_KEY = "timesheet-generator:form";

const PERSIST_KEYS = [
  "name",
  "role",
  "defaultHours",
  "departmentHead",
  "counterSign",
  "signatureImage",
  "signatureWidth",
  "signatureHeight",
  "generalActivities",
];

export function loadForm() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveForm(form) {
  try {
    const subset = {};
    for (const key of PERSIST_KEYS) {
      if (form[key] !== undefined) subset[key] = form[key];
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subset));
  } catch {
    /* storage unavailable (private mode or quota) */
  }
}

export function defaultPeriod(today = new Date()) {
  let month = today.getMonth() + 1;
  let year = today.getFullYear();
  if (today.getDate() <= 5) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }
  return { month, year };
}
