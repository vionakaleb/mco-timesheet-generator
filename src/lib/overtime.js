import { monthLabel } from "./calendar";

const WEEKDAY_TIME = "18.00–21.00";
const HOLIDAY_TIME = "09.00–15.00";

function isHoliday(dayType) {
  return dayType === "weekend" || dayType === "cutiBersama";
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildOvertimeRows({
  calendar,
  hours,
  dayTypes,
  defaultHours,
  month,
  year,
}) {
  const threshold = toNumber(defaultHours);
  const rows = [];

  calendar.forEach((entry) => {
    const dayType = dayTypes[entry.day];
    const loggedHours = toNumber(hours[entry.day]);
    const holiday = isHoliday(dayType);

    if (holiday) {
      if (loggedHours <= 0) return;
      rows.push({
        day: entry.day,
        date: formatDate(entry.day, month, year),
        time: HOLIDAY_TIME,
        totalHours: loggedHours,
        isHoliday: true,
      });
      return;
    }

    if (dayType === "cutiPribadi") return;

    if (loggedHours > threshold) {
      rows.push({
        day: entry.day,
        date: formatDate(entry.day, month, year),
        time: WEEKDAY_TIME,
        totalHours: loggedHours - threshold,
        isHoliday: false,
      });
    }
  });

  return rows;
}

function formatDate(day, month, year) {
  return `${day} ${monthLabel(month)} ${year}`;
}

export function describeOvertime(row, weekdayDesc, holidayDesc) {
  return row.isHoliday ? holidayDesc : weekdayDesc;
}
