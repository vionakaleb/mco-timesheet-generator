import { monthLabel } from "../lib/calendar";

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
  ticketError,
}) {
  const update = (key) => (event) => onChange(key, event.target.value);

  return (
    <section className="panel">
      <h2 className="panel-title">Details</h2>

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

      <div className="grid-three">
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
        <Field label="Default Hours">
          <input
            value={form.defaultHours}
            onChange={update("defaultHours")}
            placeholder="e.g. 9"
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

      <Field label="Employee Signature (image)">
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

      <Field label="General Activities (one per line)">
        <textarea
          className="tall"
          value={form.generalActivities}
          onChange={update("generalActivities")}
          spellCheck={false}
        />
      </Field>

      <Field label="Ticket List (JSON array with key and summary)">
        <Field label="Get Jira API issueTable.table" />
        <textarea
          className="taller"
          value={form.ticketsJson}
          onChange={update("ticketsJson")}
          spellCheck={false}
          placeholder='[{"key": "EDBS-1", "summary": "..."}]'
        />
      </Field>
      {ticketError ? <p className="error">{ticketError}</p> : null}
    </section>
  );
}
