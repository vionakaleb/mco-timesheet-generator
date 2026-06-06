import {
  buildOvertimeRows,
  describeOvertime,
  parseDateList,
} from "../lib/overtime";
import { LOGO_EXTENSION, LOGO_OVERTIME_BASE64 } from "../assets/logo";

const DEFAULT_LOGO = `data:image/${LOGO_EXTENSION};base64,${LOGO_OVERTIME_BASE64}`;

const INTRO_TEXT =
  "Sehubung dengan adanya tugas pekerjaan dan/atau kegiatan kedinasan yang tidak dapat ditunda/ditangguhkan, sehingga membutuhkan penyelesaian dengan segera dengan ini, kami memerintahkan kepada pegawai yang tercantum dalam daftar dibawah ini yang menyelesaikan kerja lembur.";

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
  const logoSrc = form.overtimeLogoImage || DEFAULT_LOGO;

  return (
    <section className="panel preview overtime-preview">
      <div className="overtime-doc">
        <div className="overtime-doc-header">
          <img
            className="overtime-doc-logo"
            src={logoSrc}
            alt="overtime logo"
          />
        </div>

        <h1 className="overtime-doc-title">SURAT PERINTAH KERJA LEMBUR</h1>

        <p className="overtime-doc-intro">{INTRO_TEXT}</p>

        <table className="overtime-doc-table">
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
                  No overtime hours detected. Add dates under "Default Overtime
                  Dates" or set weekday hours above {form.defaultHours}.
                </td>
              </tr>
            ) : (
              <>
                {rows.map((row, i) => (
                  <tr key={row.day}>
                    {i === 0 && (
                      <td rowSpan={rows.length} className="merged-cell">
                        {form.name || "-"}
                      </td>
                    )}
                    <td>{row.date}</td>
                    {i === 0 && (
                      <td rowSpan={rows.length} className="merged-cell">
                        {form.unitKerja || "-"}
                      </td>
                    )}
                    <td>{row.time}</td>
                    <td>{row.totalHours} Jam</td>
                    <td className="job-cell">
                      {describeOvertime(
                        row,
                        form.weekdayOvertimeDesc,
                        form.holidayOvertimeDesc,
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={4}>
                    <strong>Total</strong>
                  </td>
                  <td colSpan={2}>
                    <strong>{totalDays} hari</strong>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <div className="overtime-doc-footer">
          <div className="footer-col">
            <div className="footer-label">Pemohon</div>
            <div className="footer-sig">
              {form.signatureImage ? (
                <img src={form.signatureImage} alt="signature" />
              ) : null}
            </div>
            <div className="footer-name">Nama : {form.name || "-"}</div>
            <div className="footer-name">
              Role&nbsp;&nbsp;: {form.role || "-"}
            </div>
          </div>
          <div className="footer-col">
            <div className="footer-label">Disetujui Oleh</div>
            <div className="footer-sig"></div>
            <div className="footer-name">Nama : {form.counterSign || "-"}</div>
            <div className="footer-name">
              Role&nbsp;&nbsp;: {form.approverRole || "-"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
