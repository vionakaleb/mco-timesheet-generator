import { useEffect, useMemo, useState } from "react";
import ControlPanel from "./components/ControlPanel.jsx";
import TimesheetPreview from "./components/TimesheetPreview.jsx";
import { buildCalendar } from "./lib/calendar";
import { parseTickets } from "./lib/parseTickets";
import { DEFAULT_GENERAL_ACTIVITIES, buildHours } from "./lib/defaults";
import { exportTimesheet } from "./lib/exportExcel";

const now = new Date();

const initialForm = {
  name: "",
  role: "Software Engineer",
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  defaultHours: "9",
  departmentHead: "",
  counterSign: "",
  generalActivities: DEFAULT_GENERAL_ACTIVITIES.join("\n"),
  ticketsJson: "",
};

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [hours, setHours] = useState({});
  const [exportError, setExportError] = useState("");

  const year = Number(form.year);
  const month = Number(form.month);

  const calendar = useMemo(
    () => (year && month ? buildCalendar(year, month) : []),
    [year, month],
  );

  const tickets = useMemo(
    () => parseTickets(form.ticketsJson),
    [form.ticketsJson],
  );

  const generalList = useMemo(
    () =>
      form.generalActivities
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [form.generalActivities],
  );

  const activities = useMemo(
    () => [...generalList, ...tickets.items],
    [generalList, tickets.items],
  );

  useEffect(() => {
    setHours(buildHours(calendar, form.defaultHours));
  }, [calendar, form.defaultHours]);

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleHourChange = (day, value) =>
    setHours((prev) => ({ ...prev, [day]: value }));

  const handleExport = async () => {
    setExportError("");
    try {
      await exportTimesheet({
        role: form.role,
        name: form.name,
        month,
        year,
        departmentHead: form.departmentHead,
        counterSign: form.counterSign,
        calendar,
        activities,
        hours,
      });
    } catch (error) {
      setExportError(error.message);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Timesheet Generator</h1>
          <p className="subtitle">
            {activities.length} activities · {calendar.length} days
          </p>
        </div>
        <button
          className="export"
          onClick={handleExport}
          disabled={activities.length === 0}
        >
          Export to Excel
        </button>
      </header>

      {exportError ? <p className="error banner">{exportError}</p> : null}

      <div className="layout">
        <ControlPanel
          form={form}
          onChange={handleChange}
          ticketError={tickets.error}
        />
        <TimesheetPreview
          form={form}
          calendar={calendar}
          activities={activities}
          hours={hours}
          onHourChange={handleHourChange}
        />
      </div>
    </div>
  );
}
