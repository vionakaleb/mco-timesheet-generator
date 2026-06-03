import { dayTotal, sumHours } from "../lib/defaults";
import { monthLabel } from "../lib/calendar";
import { identitySpans } from "../lib/layout";
import { typeColor, TYPE_HEX, TYPE_LABEL, LEGEND_TYPES } from "../lib/dayTypes";
import { LOGO_DATA_URI } from "../assets/logo";

const LOGO_SPAN = 7;

export default function TimesheetPreview({
  form,
  calendar,
  activities,
  hours,
  dayTypes,
  onHourChange,
}) {
  const grandTotal = sumHours(hours);
  const span = Math.max(activities.length, 1);
  const totalColumns = calendar.length + 5;
  const ids = identitySpans(calendar.length);
  const dayBg = (day) => ({ background: typeColor(dayTypes[day]) });

  return (
    <section className="panel preview">
      <div className="preview-head">
        <h2 className="panel-title">Preview</h2>
      </div>

      <div className="table-scroll">
        <table className="sheet">
          <thead>
            <tr className="logo-row">
              <td colSpan={LOGO_SPAN} className="logo-cell">
                <img
                  src={LOGO_DATA_URI}
                  alt="mandiri mco"
                  className="logo-img"
                />
              </td>
              {/* {Array.from(
                { length: Math.max(totalColumns - LOGO_SPAN, 0) },
                (_, i) => (
                  <td key={`logo-pad-${i}`} />
                ),
              )} */}
            </tr>
            <tr className="identity">
              <th colSpan={ids.role}>Role</th>
              <th colSpan={ids.name}>Name</th>
              <th colSpan={ids.empSignature}>Signature</th>
              <th colSpan={ids.month}>Month</th>
              <th colSpan={ids.year}>Year</th>
              <th colSpan={ids.departmentHead}>Department Head</th>
              <th colSpan={ids.deptSignature}>Signature</th>
            </tr>
            <tr className="identity">
              <td colSpan={ids.role}>{form.role}</td>
              <td colSpan={ids.name}>{form.name}</td>
              <td colSpan={ids.empSignature} className="sig-cell">
                {form.signatureImage ? (
                  <img
                    src={form.signatureImage}
                    alt="employee signature"
                    className="sig-img"
                  />
                ) : null}
              </td>
              <td colSpan={ids.month}>{monthLabel(Number(form.month))}</td>
              <td colSpan={ids.year}>{form.year}</td>
              <td colSpan={ids.departmentHead}>{form.departmentHead}</td>
              <td colSpan={ids.deptSignature} />
            </tr>
            <tr className="spacer">
              <td colSpan={totalColumns} />
            </tr>
            <tr>
              <th rowSpan={2} className="col-no">
                No
              </th>
              <th rowSpan={2} className="col-desc">
                Project Name
                <br />
                Activity Description
              </th>
              {calendar.map((d) => (
                <th key={d.day} className="day" style={dayBg(d.day)}>
                  {d.day}
                </th>
              ))}
              <th rowSpan={2} className="col-sum">
                Sum (hours)
              </th>
              <th rowSpan={2}>Counter Sign Name</th>
              <th rowSpan={2}>Signature</th>
            </tr>
            <tr>
              {calendar.map((d) => (
                <th key={d.day} className="day" style={dayBg(d.day)}>
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="empty">
                  Add general activities or a ticket list to build the sheet.
                </td>
              </tr>
            ) : (
              activities.map((desc, i) => (
                <tr key={`${i}-${desc.slice(0, 12)}`}>
                  <td className="col-no">{i + 1}</td>
                  <td className="col-desc">{desc}</td>
                  {i === 0 &&
                    calendar.map((d) => (
                      <td
                        key={d.day}
                        rowSpan={span}
                        className="day"
                        style={dayBg(d.day)}
                      >
                        <input
                          className="hour-input"
                          value={hours[d.day] ?? ""}
                          onChange={(e) => onHourChange(d.day, e.target.value)}
                        />
                      </td>
                    ))}
                  {i === 0 && (
                    <td rowSpan={span} className="col-sum strong">
                      {grandTotal}
                    </td>
                  )}
                  {i === 0 && <td rowSpan={span}>{form.counterSign}</td>}
                  {i === 0 && <td rowSpan={span} />}
                </tr>
              ))
            )}
            <tr className="total-row">
              <td colSpan={2}>TOTAL</td>
              {calendar.map((d) => (
                <td key={d.day} className="day">
                  {dayTotal(hours[d.day])}
                </td>
              ))}
              <td className="col-sum strong">{grandTotal}</td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="legend">
        <span className="legend-title">Legends:</span>
        {LEGEND_TYPES.map((t) => (
          <span key={t} className="legend-item">
            <span
              className="legend-swatch"
              style={{ background: `#${TYPE_HEX[t]}` }}
            />
            {TYPE_LABEL[t]}
          </span>
        ))}
      </div>
    </section>
  );
}
