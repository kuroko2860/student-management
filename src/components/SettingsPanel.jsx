import { useEffect, useState } from 'react'
import { savePayment } from '../store'
import { loadBanks, vietQrUrl, transferNote } from '../vietqr'
import { DEFAULT_TEMPLATE, monthKey } from '../lib'

const FIELDS = [
  ['{ten}', 'tên học sinh'],
  ['{lop}', 'tên lớp'],
  ['{thang}', 'tháng 7/2026'],
  ['{sobuoi}', 'số buổi trong tháng'],
  ['{dihoc}', 'số buổi đi học'],
  ['{nghi}', 'số buổi nghỉ'],
  ['{chitietnghi}', 'ngày nghỉ kèm lý do'],
  ['{hocphi}', 'thành tiền'],
  ['{chuyenkhoan}', 'dòng thông tin tài khoản']
]

export default function SettingsPanel({ uid, payment }) {
  const [banks, setBanks] = useState([])
  const [form, setForm] = useState({
    bankBin: '', bankName: '', accountNo: '', accountName: '', msgTemplate: DEFAULT_TEMPLATE
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadBanks().then(setBanks) }, [])
  useEffect(() => {
    if (payment) setForm((f) => ({ ...f, ...payment, msgTemplate: payment.msgTemplate || DEFAULT_TEMPLATE }))
  }, [payment])

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setSaved(false) }

  const pickBank = (e) => {
    const b = banks.find((x) => x.bin === e.target.value)
    setForm({ ...form, bankBin: b?.bin || '', bankName: b?.shortName || '' })
    setSaved(false)
  }

  const submit = (e) => {
    e.preventDefault()
    savePayment(uid, form).then(() => setSaved(true))
  }

  const preview = vietQrUrl(form, 750000, transferNote('Nguyễn Văn Khánh', monthKey()), 'compact')

  return (
    <div className="settings">
      <form onSubmit={submit} className="panel">
        <h2>Tài khoản nhận học phí</h2>
        <p className="hint">
          Điền một lần. Mỗi phiếu báo in ra sẽ kèm mã QR đúng số tiền và nội dung của từng em,
          phụ huynh quét là chuyển được ngay.
        </p>

        <label>
          Ngân hàng
          <select value={form.bankBin} onChange={pickBank}>
            <option value="">— Chọn ngân hàng —</option>
            {banks.map((b) => (
              <option key={b.bin} value={b.bin}>{b.shortName} — {b.name}</option>
            ))}
          </select>
        </label>

        <label>
          Số tài khoản
          <input value={form.accountNo || ''} onChange={set('accountNo')} inputMode="numeric" placeholder="0123456789" />
        </label>

        <label>
          Tên chủ tài khoản
          <input value={form.accountName || ''} onChange={set('accountName')} placeholder="NGUYEN VAN A" />
        </label>

        <h2 style={{ marginTop: 26 }}>Mẫu tin nhắn gửi phụ huynh</h2>
        <textarea rows={6} value={form.msgTemplate} onChange={set('msgTemplate')} />
        <div className="chips" style={{ marginTop: 8 }}>
          {FIELDS.map(([tag, desc]) => (
            <button
              type="button"
              key={tag}
              className="chip"
              title={desc}
              onClick={() => { setForm({ ...form, msgTemplate: form.msgTemplate + tag }); setSaved(false) }}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="dialog-actions">
          <button className="btn btn-solid" type="submit">Lưu cài đặt</button>
          {saved && <span className="hint" style={{ color: 'var(--paid)' }}>Đã lưu</span>}
          <div className="spacer" />
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => { setForm({ ...form, msgTemplate: DEFAULT_TEMPLATE }); setSaved(false) }}
          >
            Về mẫu mặc định
          </button>
        </div>
      </form>

      <aside className="panel">
        <h2>Xem thử mã QR</h2>
        {preview ? (
          <>
            <img className="qr-preview" src={preview} alt="Mã QR chuyển khoản mẫu" />
            <p className="hint">Ví dụ với học phí 750.000 ₫ của một học sinh tên Khánh.</p>
          </>
        ) : (
          <p className="hint">Chọn ngân hàng và nhập số tài khoản để xem mã QR.</p>
        )}
      </aside>
    </div>
  )
}
