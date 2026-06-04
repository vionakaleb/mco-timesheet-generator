import { monthLabel } from "../lib/calendar";
import { useState } from "react";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export default function ControlPanel({
  form,
  onChange,
  onSignature,
  onClearSignature,
  onLogo,
  onClearLogo,
  ticketError,
}) {
  const [showHelp, setShowHelp] = useState(false);

  const update = (key) => (event) => onChange(key, event.target.value);

  return (
    <section className="panel control">
      <h2 className="panel-title">Timesheet</h2>

      <div className="grid-two">
        <Field label="Employee Name">
          <input
            value={form.name}
            onChange={update("name")}
            placeholder="Full name"
          />
        </Field>
        <Field label="Role">
          <input
            value={form.role}
            onChange={update("role")}
            placeholder="e.g. Software Engineer"
          />
        </Field>
      </div>

      <div className="grid-two">
        <Field label="Month">
          <select value={form.month} onChange={update("month")}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Year">
          <input
            type="number"
            min="2000"
            max="2100"
            value={form.year}
            onChange={update("year")}
          />
        </Field>
      </div>

      <div className="grid-two">
        <Field label="Normal Hours">
          <input
            value={form.defaultHours}
            onChange={update("defaultHours")}
            placeholder="e.g. 9"
          />
        </Field>
        <Field label="Limit Rows">
          <input
            type="number"
            min="1"
            value={form.limitRows}
            onChange={update("limitRows")}
            placeholder="e.g. 20"
          />
        </Field>
      </div>

      <div className="grid-two">
        <Field label="Department Head">
          <input
            value={form.departmentHead}
            onChange={update("departmentHead")}
            placeholder="Department head name"
          />
        </Field>
        <Field label="Counter Sign Name">
          <input
            value={form.counterSign}
            onChange={update("counterSign")}
            placeholder="Counter signer name"
          />
        </Field>
      </div>

      <div className="grid-two">
        <Field label="Cuti Bersama Date ">
          <input
            value={form.cutiBersama}
            onChange={update("cutiBersama")}
            placeholder="e.g. 3, 10"
          />
        </Field>
        <Field label="Cuti Pribadi Date">
          <input
            value={form.cutiPribadi}
            onChange={update("cutiPribadi")}
            placeholder="e.g. 13, 20"
          />
        </Field>
      </div>

      <h2 className="panel-title">Activities</h2>

      <Field label="General Activities (one per line)">
        <textarea
          className="tall"
          value={form.generalActivities}
          onChange={update("generalActivities")}
          spellCheck={false}
        />
      </Field>

      <Field label="Jira Ticket List (JSON)">
        <button
          type="button"
          className="toggle-help"
          onClick={() => setShowHelp((v) => !v)}
        >
          {showHelp ? "Hide instructions" : "How to get ticket list"}
        </button>
        {showHelp && (
          <div className="help-box">
            <p className="help-step">
              <strong>1. Filter Issues:</strong>
            </p>
            <pre className="help-code">
              {`project = "{project_name}" AND (assignee in ({user_ad}) OR Developer in ({user_ad}) OR cf[11927] in ({user_ad}) OR cf[16812] in ({user_ad}) OR cf[17011] in ({user_ad})) AND (created >= {start_date} AND created <= {end_date} OR updated >= {start_date} AND updated <= {end_date}) ORDER BY created ASC, updated DESC`}
            </pre>
            <p className="help-step">
              <strong>2. Check Network:</strong>{" "}
              <code>{"API POST {jira_web}/rest/issueNav/1/issueTable"}</code>
            </p>
            <p className="help-step">
              <strong>3. Copy JSON:</strong> response list{" "}
              <code>issueTable.table</code>
            </p>
            {/* <p className="help-step">Example:</p>
            <pre className="help-code">
              {`{
                "key": "EDBS-111111",
                "summary": "Issue",
                ...
            }`}
            </pre> */}
          </div>
        )}
        <textarea
          className="taller"
          value={form.ticketsJson}
          onChange={update("ticketsJson")}
          spellCheck={false}
          placeholder='[{"key": "EDBS-111111", "summary": "Issue"}]'
        />
      </Field>
      {ticketError ? <p className="error">{ticketError}</p> : null}

      <h2 className="panel-title">Overtime</h2>

      <div className="grid-two">
        <Field label="Unit Kerja">
          <input
            value={form.unitKerja}
            onChange={update("unitKerja")}
            placeholder="e.g. IT DIGITAL CHANNEL DELIVERY GROUP"
          />
        </Field>
        <Field label="Approver Role">
          <input
            value={form.approverRole}
            onChange={update("approverRole")}
            placeholder="e.g. Team Leader FE"
          />
        </Field>
      </div>

      <Field label="Weekdays Description">
        <input
          value={form.weekdayOvertimeDesc}
          onChange={update("weekdayOvertimeDesc")}
          placeholder="e.g. Tracing & Bugfixing NBDS"
        />
      </Field>

      <Field label="Holidays Description">
        <input
          value={form.holidayOvertimeDesc}
          onChange={update("holidayOvertimeDesc")}
          placeholder="e.g. Rollout/Activated Weekend NBDS"
        />
      </Field>

      <h2 className="panel-title">Images</h2>

      <Field label="Employee Signature">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onSignature(event.target.files?.[0])}
        />
      </Field>
      {form.signatureImage ? (
        <div className="sig-preview">
          <img src={form.signatureImage} alt="employee signature" />
          <button type="button" className="link-btn" onClick={onClearSignature}>
            Remove
          </button>
        </div>
      ) : null}

      <Field label="Timesheet Logo (optional)">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onLogo(event.target.files?.[0])}
        />
        <span className="field-hint">
          Default Mandiri MCO, replace if you are from other company.
        </span>
      </Field>
      {form.logoImage ? (
        <div className="sig-preview">
          <img src={form.logoImage} alt="custom logo" />
          <button type="button" className="link-btn" onClick={onClearLogo}>
            Remove
          </button>
        </div>
      ) : null}
    </section>
  );
}
