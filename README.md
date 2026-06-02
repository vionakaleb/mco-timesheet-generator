# Timesheet Generator

A React + Vite app that builds a monthly timesheet from a JSON ticket list and a chosen month/year. Day numbers, weekday labels, and weekends are computed from the date, so the calendar is always correct for the selected month. Exports a styled `.xlsx`.

## Requirements

- Node.js 18 or newer

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## How to use

1. Fill in name, role, month, year, default weekday hours, and the counter sign name.
2. Edit the general activities (one per line) if needed.
3. Paste the ticket list as a JSON array. Each item needs a `key` and a `summary`. They become `KEY - summary` rows after the general activities.
4. Adjust any daily hours directly in the preview. Weekends default to "Weekend".
5. Click **Export to Excel**.

## Project structure

```
timesheet-generator/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── components/
    │   ├── ControlPanel.jsx
    │   └── TimesheetPreview.jsx
    └── lib/
        ├── calendar.js
        ├── parseTickets.js
        ├── defaults.js
        └── exportExcel.js
```
