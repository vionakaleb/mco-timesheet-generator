import { buildOvertimeRows, describeOvertime } from "../lib/overtime";

export default function OvertimePreview({ form, calendar, hours, dayTypes }) {
  const rows = buildOvertimeRows({
    calendar,
    hours,
    dayTypes,
    defaultHours: form.defaultHours,
    month: Number(form.month),
    year: Number(form.year),
  });

  const totalDays = rows.length;

  return (
    <section className="panel preview">
      <div className="preview-head">
        <h2 className="panel-title">Overtime Preview</h2>
        <span className="subtitle">{totalDays} overtime day(s)</span>
      </div>

      {/* <div className="overtime-intro">
        <p>
          Sehubung dengan adanya tugas pekerjaan dan/atau kegiatan kedinasan
          yang tidak dapat ditunda/ditangguhkan, sehingga membutuhkan
          penyelesaian dengan segera dengan ini, kami memerintahkan kepada
          pegawai yang tercantum dalam daftar dibawah ini yang menyelesaikan
          kerja lembur.
        </p>
      </div> */}

      <div className="table-scroll">
        <table className="sheet overtime-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Hari/Tanggal</th>
              <th>Unit Kerja</th>
              <th>Waktu Lembur</th>
              <th>Total Lembur (Jam)</th>
              <th>Pekerjaan yang harus dikerjakan</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  No overtime hours detected. Weekdays must be more than{" "}
                  {form.defaultHours} Hours. Holidays must be more than 0 hours.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.day}>
                  {i === 0 && <td rowSpan={rows.length}>{form.name}</td>}
                  <td style={{ textAlign: "left" }}>{row.date}</td>
                  {i === 0 && <td rowSpan={rows.length}>{form.unitKerja}</td>}
                  <td>{row.time}</td>
                  <td>{row.totalHours} Jam</td>
                  <td>
                    {describeOvertime(
                      row,
                      form.weekdayOvertimeDesc,
                      form.holidayOvertimeDesc,
                    )}
                  </td>
                </tr>
              ))
            )}
            <tr className="total-row">
              <td colSpan={4} style={{ textAlign: "center" }}>
                <strong>Total</strong>
              </td>
              <td colSpan={2}>
                <strong>{totalDays} hari</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
