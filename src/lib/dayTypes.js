export const LEGEND_TYPES = ["weekend", "bersama", "pribadi"];

export const TYPE_HEX = {
  weekend: "4BACC6",
  bersama: "8064A1",
  pribadi: "F79646",
};

export const TYPE_LABEL = {
  weekend: "Weekend",
  bersama: "Cuti Bersama",
  pribadi: "Cuti Pribadi",
};

const TYPE_DEFAULT_TEXT = {
  weekend: "Weekend",
  bersama: "Cuti Bersama",
  pribadi: "Cuti Pribadi",
};

export function parseDays(input) {
  const days = new Set();
  for (const token of (input ?? "").split(/[\s,]+/)) {
    const value = Number.parseInt(token, 10);
    if (Number.isInteger(value)) days.add(value);
  }
  return days;
}

export function buildDayTypes(calendar, bersamaDays, pribadiDays) {
  const types = {};
  for (const entry of calendar) {
    if (pribadiDays.has(entry.day)) types[entry.day] = "pribadi";
    else if (bersamaDays.has(entry.day)) types[entry.day] = "bersama";
    else if (entry.weekend) types[entry.day] = "weekend";
    else types[entry.day] = "work";
  }
  return types;
}

export function buildHours(calendar, defaultWeekdayHours, dayTypes) {
  const hours = {};
  for (const entry of calendar) {
    const type = dayTypes[entry.day];
    hours[entry.day] =
      type === "work" ? defaultWeekdayHours : TYPE_DEFAULT_TEXT[type];
  }
  return hours;
}

export function typeColor(type) {
  return TYPE_HEX[type] ? `#${TYPE_HEX[type]}` : "transparent";
}
