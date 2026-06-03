import { useEffect, useMemo, useState } from "react";
import ControlPanel, { Field } from "./components/ControlPanel.jsx";
import TimesheetPreview from "./components/TimesheetPreview.jsx";
import { buildCalendar } from "./lib/calendar";
import { parseTickets } from "./lib/parseTickets";
import { DEFAULT_GENERAL_ACTIVITIES } from "./lib/defaults";
import { parseDays, buildDayTypes, buildHours } from "./lib/dayTypes";
import { exportTimesheet } from "./lib/exportExcel";
import { exportTimesheetPDF } from "./lib/exportPdf.js";
import { loadForm, saveForm, defaultPeriod } from "./lib/storage";
import OvertimePreview from "./components/OvertimePreview.jsx";
import { exportOvertimePDF } from "./lib/exportOvertimePdf";

const now = new Date();

const initialForm = {
  name: "",
  role: "Software Engineer",
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  limitRows: 20,
  defaultHours: "9",
  departmentHead: "",
  counterSign: "",
  cutiBersama: "",
  cutiPribadi: "",
  signatureImage: "",
  signatureWidth: 0,
  signatureHeight: 0,
  logoImage: "",
  logoWidth: 0,
  logoHeight: 0,
  generalActivities: DEFAULT_GENERAL_ACTIVITIES.join("\n"),
  ticketsJson: "",
  unitKerja: "IT DIGITAL CHANNEL DELIVERY GROUP",
  approverRole: "",
  weekdayOvertimeDesc: "Support Development & Bugfixing",
  holidayOvertimeDesc: "Rollout/Activated Weekend",
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

  const activities = useMemo(() => {
    const combined = [...generalList, ...tickets.items];
    const limit = Number(form.limitRows) || 20;
    return combined.length > limit ? combined.slice(0, limit) : combined;
  }, [generalList, tickets.items, form.limitRows]);

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

  const readImageFile = (file, fieldMap) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result;
      const image = new Image();
      image.onload = () =>
        setForm((prev) => ({
          ...prev,
          [fieldMap.image]: dataUri,
          [fieldMap.width]: image.naturalWidth,
          [fieldMap.height]: image.naturalHeight,
        }));
      image.src = dataUri;
    };
    reader.readAsDataURL(file);
  };

  const handleSignature = (file) =>
    readImageFile(file, {
      image: "signatureImage",
      width: "signatureWidth",
      height: "signatureHeight",
    });

  const clearSignature = () =>
    setForm((prev) => ({
      ...prev,
      signatureImage: "",
      signatureWidth: 0,
      signatureHeight: 0,
    }));

  const handleLogo = (file) =>
    readImageFile(file, {
      image: "logoImage",
      width: "logoWidth",
      height: "logoHeight",
    });

  const clearLogo = () =>
    setForm((prev) => ({
      ...prev,
      logoImage: "",
      logoWidth: 0,
      logoHeight: 0,
    }));

  const buildExportPayload = () => ({
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
    logo: form.logoImage
      ? {
          dataUri: form.logoImage,
          width: form.logoWidth,
          height: form.logoHeight,
        }
      : null,
  });

  const handleExport = async () => {
    setExportError("");
    try {
      await exportTimesheet(buildExportPayload());
    } catch (error) {
      setExportError(error.message);
    }
  };

  const handleExportPDF = async () => {
    setExportError("");
    try {
      await exportTimesheetPDF(buildExportPayload());
    } catch (error) {
      setExportError(error.message);
    }
  };

  const handleExportOvertimePDF = async () => {
    setExportError("");
    try {
      await exportOvertimePDF({
        form,
        calendar,
        hours,
        dayTypes,
        signature: form.signatureImage
          ? {
              dataUri: form.signatureImage,
              width: form.signatureWidth,
              height: form.signatureHeight,
            }
          : null,
        logo: form.logoImage
          ? {
              dataUri: form.logoImage,
              width: form.logoWidth,
              height: form.logoHeight,
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
        <div className="export-actions">
          {/* <button
            className="export"
            onClick={handleExport}
            disabled={activities.length === 0}
          >
            ✏️ Export Timesheet Excel
          </button> */}
          <button
            className="export"
            onClick={handleExportPDF}
            disabled={activities.length === 0}
          >
            📄 Export Timesheet PDF
          </button>
          <button
            className="export"
            onClick={handleExportOvertimePDF}
            disabled={activities.length === 0}
          >
            🕒 Export Overtime PDF
          </button>
        </div>
      </header>

      {exportError ? <p className="error banner">{exportError}</p> : null}

      <div className="layout">
        <ControlPanel
          form={form}
          onChange={handleChange}
          onSignature={handleSignature}
          onClearSignature={clearSignature}
          onLogo={handleLogo}
          onClearLogo={clearLogo}
          ticketError={tickets.error}
        />
        <div className="preview-container">
          <TimesheetPreview
            form={form}
            calendar={calendar}
            activities={activities}
            hours={hours}
            dayTypes={dayTypes}
            onHourChange={handleHourChange}
          />
          <OvertimePreview
            form={form}
            calendar={calendar}
            hours={hours}
            dayTypes={dayTypes}
          />
        </div>
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
