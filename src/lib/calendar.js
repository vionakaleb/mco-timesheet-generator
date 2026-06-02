const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function monthLabel(month) {
  return MONTH_LABELS[month - 1] ?? '';
}

export function buildCalendar(year, month) {
  const total = daysInMonth(year, month);
  const days = [];
  for (let day = 1; day <= total; day += 1) {
    const weekday = new Date(year, month - 1, day).getDay();
    days.push({
      day,
      weekday,
      label: WEEKDAY_LABELS[weekday],
      weekend: weekday === 0 || weekday === 6,
    });
  }
  return days;
}
