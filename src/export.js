import { summarize, absenceDetails, money, dateShort, DAYS_SHORT, monthLabel } from './lib'
import { vietQrUrl, transferNote } from './vietqr'

const slotName = { sang: 'Sáng', chieu: 'Chiều', toi: 'Tối', bu: 'Dạy bù' }

const sessionLabel = (s) =>
  `${dateShort(s.date)} (${s.slot === 'bu' ? 'bù' : DAYS_SHORT[s.day]})`

/* ------------------------------------------------------------------ Excel */

export async function exportExcel({ cls, students, sessions, sheet, month }) {
  const XLSX = await import('xlsx') // tải thư viện khi thực sự cần, giữ bundle nhẹ
  const { rows, grandTotal, collected } = summarize(students, sessions, sheet, cls.fee)

  const header = [
    'Học sinh',
    ...sessions.map(sessionLabel),
    'Số buổi',
    'Nghỉ',
    'Đi học',
    'Tiền học (₫)',
    'Đã thu',
    'Lý do nghỉ'
  ]

  const body = rows.map((r) => {
    const details = absenceDetails(r.student.id, sessions, sheet)
    const offIds = new Set(details.map((d) => d.id))
    return [
      r.student.name,
      ...sessions.map((s) => (offIds.has(s.id) ? 'N' : 'x')),
      r.total,
      r.off,
      r.attended,
      r.amount,
      r.paid ? 'Rồi' : '',
      details.map((d) => `${dateShort(d.date)}: ${d.reason || 'không ghi'}`).join('; ')
    ]
  })

  const aoa = [
    [`Bảng điểm danh lớp ${cls.name} — ${monthLabel(month)}`],
    [`Học phí ${money(cls.fee)} / buổi`, '', `x = có học, N = nghỉ`],
    [],
    header,
    ...body,
    [],
    ['Tổng thu dự kiến', '', grandTotal],
    ['Đã thu', '', collected],
    ['Còn lại', '', grandTotal - collected]
  ]

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [
    { wch: 18 },
    ...sessions.map(() => ({ wch: 11 })),
    { wch: 8 }, { wch: 7 }, { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 40 }
  ]
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Điểm danh')

  // Sheet phụ: nhật ký nghỉ học
  const log = [['Học sinh', 'Ngày', 'Buổi', 'Lý do']]
  rows.forEach((r) =>
    absenceDetails(r.student.id, sessions, sheet).forEach((d) =>
      log.push([r.student.name, d.date, slotName[d.slot] || '', d.reason || ''])
    )
  )
  const wsLog = XLSX.utils.aoa_to_sheet(log)
  wsLog['!cols'] = [{ wch: 18 }, { wch: 13 }, { wch: 10 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsLog, 'Lý do nghỉ')

  XLSX.writeFile(wb, `DiemDanh_${slug(cls.name)}_${month}.xlsx`)
}

const slug = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^\w]+/g, '')

/* -------------------------------------------------------------------- PDF */

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/**
 * Mở cửa sổ in với bảng tổng lớp + phiếu báo học phí riêng từng học sinh.
 * Trong hộp thoại in, chọn "Lưu thành PDF" để gửi phụ huynh.
 * @param only  chỉ in phiếu của một học sinh (tuỳ chọn)
 */
export function printSlips({ cls, students, sessions, sheet, month, teacher, payment, only }) {
  const { rows, grandTotal, collected } = summarize(students, sessions, sheet, cls.fee)
  const picked = only ? rows.filter((r) => r.student.id === only) : rows
  if (!picked.length) return alert('Chưa có học sinh để in.')

  const summary = only
    ? ''
    : `<section class="page">
        <h1>Lớp ${esc(cls.name)}</h1>
        <p class="sub">${esc(monthLabel(month))} · ${sessions.length} buổi · ${esc(money(cls.fee))}/buổi</p>
        <table>
          <thead><tr><th>Học sinh</th><th>Đi học</th><th>Nghỉ</th><th>Tiền học</th><th>Đã thu</th></tr></thead>
          <tbody>
            ${rows.map((r) => `<tr>
              <td class="l">${esc(r.student.name)}</td>
              <td>${r.attended}</td>
              <td>${r.off || ''}</td>
              <td class="r">${esc(money(r.amount))}</td>
              <td>${r.paid ? '✓' : ''}</td>
            </tr>`).join('')}
          </tbody>
          <tfoot><tr>
            <td class="l">Tổng</td><td colspan="2"></td>
            <td class="r">${esc(money(grandTotal))}</td>
            <td>${esc(money(collected))} đã thu</td>
          </tr></tfoot>
        </table>
      </section>`

  const slips = picked.map((r) => {
    const details = absenceDetails(r.student.id, sessions, sheet)
    return `<section class="page slip">
      <header>
        <p class="eyebrow">Phiếu báo học phí</p>
        <h1>${esc(r.student.name)}</h1>
        <p class="sub">Lớp ${esc(cls.name)} · ${esc(monthLabel(month))}</p>
      </header>
      <table class="kv">
        <tr><td>Số buổi trong tháng</td><td class="r">${r.total}</td></tr>
        <tr><td>Số buổi nghỉ</td><td class="r">${r.off}</td></tr>
        <tr><td>Số buổi đi học</td><td class="r">${r.attended}</td></tr>
        <tr><td>Học phí mỗi buổi</td><td class="r">${esc(money(cls.fee))}</td></tr>
        <tr class="total"><td>Thành tiền</td><td class="r">${esc(money(r.amount))}</td></tr>
        <tr><td>Tình trạng</td><td class="r">${r.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</td></tr>
      </table>
      ${details.length
        ? `<h2>Các buổi nghỉ</h2>
           <table class="log">
             <thead><tr><th>Ngày</th><th>Buổi</th><th>Lý do</th></tr></thead>
             <tbody>${details.map((d) => `<tr>
                <td>${esc(dateShort(d.date))}</td>
                <td>${esc(slotName[d.slot] || '')}</td>
                <td class="l">${esc(d.reason || '—')}</td>
              </tr>`).join('')}</tbody>
           </table>`
        : '<p class="note">Học sinh đi học đầy đủ trong tháng.</p>'}
      ${qrBlock(payment, r, month)}
      <footer>
        <span>Ngày lập: ${new Date().toLocaleDateString('vi-VN')}</span>
        <span>Giáo viên: ${esc(teacher || '')}</span>
      </footer>
    </section>`
  }).join('')

  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
    <title>Phieu_${slug(cls.name)}_${month}</title>
    <style>
      @page { size: A4; margin: 16mm; }
      * { box-sizing: border-box; }
      body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #16233a; margin: 0; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      .eyebrow { text-transform: uppercase; letter-spacing: .16em; font-size: 10px; color: #6b7280; margin: 0 0 6px; }
      h1 { font-size: 24px; margin: 0 0 4px; }
      h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; margin: 22px 0 8px; color: #6b7280; }
      .sub { color: #6b7280; margin: 0 0 18px; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border-bottom: 1px solid #e0dacb; padding: 7px 8px; text-align: center; }
      th { background: #16233a; color: #fff; font-size: 11px; }
      td.l, th.l { text-align: left; }
      td.r { text-align: right; font-variant-numeric: tabular-nums; }
      tfoot td { font-weight: 700; border-top: 2px solid #16233a; }
      .kv td { text-align: left; }
      .kv td.r { text-align: right; }
      .kv tr.total td { font-weight: 700; font-size: 16px; border-top: 2px solid #16233a; border-bottom: 2px solid #16233a; }
      .note { font-size: 13px; color: #2e6f4e; margin-top: 20px; }
      footer { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; color: #6b7280; }
      .qr { margin-top: 26px; border-top: 1px dashed #b8b0a0; padding-top: 16px; display: flex; gap: 16px; align-items: center; }
      .qr img { width: 150px; height: auto; border: 1px solid #e0dacb; }
      .qr-text { font-size: 12px; line-height: 1.7; }
      .qr-text b { font-size: 14px; }
      .qr-text .amount { font-size: 17px; font-weight: 700; }
      @media screen { body { background: #f3efe4; padding: 20px; }
        .page { background: #fff; padding: 26mm 20mm; max-width: 210mm; margin: 0 auto 18px; box-shadow: 0 1px 4px rgba(0,0,0,.15); } }
    </style></head><body>${summary}${slips}
    <script>window.addEventListener('load', function () { setTimeout(function () { window.print() }, 250) })<\/script>
    </body></html>`

  const w = window.open('', '_blank')
  if (!w) return alert('Trình duyệt đã chặn cửa sổ in. Hãy cho phép pop-up cho trang này.')
  w.document.write(html)
  w.document.close()
  w.focus()
}

/** Khối mã QR chuyển khoản in kèm phiếu, bỏ qua nếu chưa cấu hình hoặc đã thu tiền. */
function qrBlock(payment, r, month) {
  if (!payment?.accountNo || !payment?.bankBin || r.paid || r.amount <= 0) return ''
  const note = transferNote(r.student.name, month)
  const url = vietQrUrl(payment, r.amount, note, 'qr_only')
  return `<div class="qr">
    <img src="${esc(url)}" alt="Ma QR chuyen khoan">
    <div class="qr-text">
      <b>Quét mã để chuyển khoản</b><br>
      ${esc(payment.bankName || '')} · ${esc(payment.accountNo)}<br>
      ${esc(payment.accountName || '')}<br>
      Nội dung: ${esc(note)}<br>
      <span class="amount">${esc(money(r.amount))}</span>
    </div>
  </div>`
}
