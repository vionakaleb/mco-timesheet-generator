import { monthLabel } from '../lib/calendar';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export default function ControlPanel({ form, onChange, ticketError }) {
  const update = (key) => (event) => onChange(key, event.target.value);

  return (
    <section className="panel">
      <h2 className="panel-title">Details</h2>

      <div className="grid-two">
        <Field label="Employee name">
          <input value={form.name} onChange={update('name')} placeholder="Full name" />
        </Field>
        <Field label="Role">
          <input value={form.role} onChange={update('role')} placeholder="e.g. Software Engineer" />
        </Field>
      </div>

      <div className="grid-three">
        <Field label="Month">
          <select value={form.month} onChange={update('month')}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Year">
          <input type="number" min="2000" max="2100" value={form.year} onChange={update('year')} />
        </Field>
        <Field label="Default hours">
          <input value={form.defaultHours} onChange={update('defaultHours')} placeholder="e.g. 8" />
        </Field>
      </div>

      <div className="grid-two">
        <Field label="Department Head">
          <input value={form.departmentHead} onChange={update('departmentHead')} placeholder="Department head name" />
        </Field>
        <Field label="Counter Sign Name">
          <input value={form.counterSign} onChange={update('counterSign')} placeholder="Counter signer name" />
        </Field>
      </div>

      <Field label="General activities (one per line)">
        <textarea
          className="tall"
          value={form.generalActivities}
          onChange={update('generalActivities')}
          spellCheck={false}
        />
      </Field>

      <Field label="Ticket list (JSON array with key and summary)">
        <textarea
          className="taller"
          value={form.ticketsJson}
          onChange={update('ticketsJson')}
          spellCheck={false}
          placeholder='[{"key": "EDBS-1", "summary": "..."}]'
        />
      </Field>
      {ticketError ? <p className="error">{ticketError}</p> : null}
    </section>
  );
}
