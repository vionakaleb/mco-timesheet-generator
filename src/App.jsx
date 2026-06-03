import { useEffect, useMemo, useState } from "react";
import ControlPanel, { Field } from "./components/ControlPanel.jsx";
import TimesheetPreview from "./components/TimesheetPreview.jsx";
import { buildCalendar } from "./lib/calendar";
import { parseTickets } from "./lib/parseTickets";
import { DEFAULT_GENERAL_ACTIVITIES } from "./lib/defaults";
import { parseDays, buildDayTypes, buildHours } from "./lib/dayTypes";
import { exportTimesheet } from "./lib/exportExcel";
import { loadForm, saveForm, defaultPeriod } from "./lib/storage";

const now = new Date();

const initialForm = {
  name: "",
  role: "Software Engineer",
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  defaultHours: "9",
  departmentHead: "",
  counterSign: "",
  cutiBersama: "",
  cutiPribadi: "",
  signatureImage: "",
  signatureWidth: 0,
  signatureHeight: 0,
  generalActivities: DEFAULT_GENERAL_ACTIVITIES.join("\n"),
  ticketsJson: "",
};

function createInitialForm() {
  const { month, year } = defaultPeriod();
  return { ...initialForm, ...loadForm(), month, year };
}

export default function App() {
  const [form, setForm] = useState(createInitialForm);
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

  const dayTypes = useMemo(
    () =>
      buildDayTypes(
        calendar,
        parseDays(form.cutiBersama),
        parseDays(form.cutiPribadi),
      ),
    [calendar, form.cutiBersama, form.cutiPribadi],
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
    setHours(buildHours(calendar, form.defaultHours, dayTypes));
  }, [calendar, form.defaultHours, dayTypes]);

  useEffect(() => {
    saveForm(form);
  }, [form]);

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleHourChange = (day, value) =>
    setHours((prev) => ({ ...prev, [day]: value }));

  const handleSignature = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result;
      const image = new Image();
      image.onload = () =>
        setForm((prev) => ({
          ...prev,
          signatureImage: dataUri,
          signatureWidth: image.naturalWidth,
          signatureHeight: image.naturalHeight,
        }));
      image.src = dataUri;
    };
    reader.readAsDataURL(file);
  };

  const clearSignature = () =>
    setForm((prev) => ({
      ...prev,
      signatureImage: "",
      signatureWidth: 0,
      signatureHeight: 0,
    }));

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
        dayTypes,
        signature: form.signatureImage
          ? {
              dataUri: form.signatureImage,
              width: form.signatureWidth,
              height: form.signatureHeight,
            }
          : null,
      });
    } catch (error) {
      setExportError(error.message);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>MCO Timesheet Generator</h1>
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
          onSignature={handleSignature}
          onClearSignature={clearSignature}
          ticketError={tickets.error}
        />
        <TimesheetPreview
          form={form}
          calendar={calendar}
          activities={activities}
          hours={hours}
          dayTypes={dayTypes}
          onHourChange={handleHourChange}
        />
      </div>

      <footer className="footer-container">
        <a
          href="https://viona-kaleb.vercel.app/"
          className="field-label"
          target="_blank"
        >
          <div className="field-label">© Viona Z. A. Kaleb</div>
        </a>
      </footer>
    </div>
  );
}
