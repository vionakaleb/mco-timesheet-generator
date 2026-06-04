const WEEKDAY_START_HOUR = 18;
const HOLIDAY_START_HOUR = 9;

const DAY_NAMES_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const MONTH_LABELS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function monthLabel(month) {
  return MONTH_LABELS_ID[month - 1] ?? "";
}

function isHoliday(dayType) {
  return dayType === "weekend" || dayType === "cutiBersama";
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatHour(hour) {
  const normalized = ((hour % 24) + 24) % 24;
  return `${String(normalized).padStart(2, "0")}.00`;
}

function buildTimeRange(startHour, totalHours) {
  const endHour = startHour + totalHours;
  return `${formatHour(startHour)}–${formatHour(endHour)}`;
}

function formatDate(day, month, year) {
  const dayName = DAY_NAMES_ID[new Date(year, month - 1, day).getDay()];
  return `${dayName}, ${day} ${monthLabel(month)} ${year}`;
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
        time: buildTimeRange(HOLIDAY_START_HOUR, loggedHours),
        totalHours: loggedHours,
        isHoliday: true,
      });
      return;
    }

    if (dayType === "cutiPribadi") return;

    if (loggedHours > threshold) {
      const overtimeHours = loggedHours - threshold;
      rows.push({
        day: entry.day,
        date: formatDate(entry.day, month, year),
        time: buildTimeRange(WEEKDAY_START_HOUR, overtimeHours),
        totalHours: overtimeHours,
        isHoliday: false,
      });
    }
  });

  return rows;
}

export function describeOvertime(row, weekdayDesc, holidayDesc) {
  return row.isHoliday ? holidayDesc : weekdayDesc;
}
