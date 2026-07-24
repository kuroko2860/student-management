import { useEffect, useState } from 'react'
import { buildMessage, money } from '../lib'
import { vietQrUrl, transferNote } from '../vietqr'

export default function MessageDialog({ info, onClose }) {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (info) setText(buildMessage(info.payment?.msgTemplate, info))
    setCopied(false)
  }, [info])

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!info) return null
  const { row, month, payment } = info
  const qr = vietQrUrl(payment || {}, row.amount, transferNote(row.student.name, month), 'compact')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      alert('Trình duyệt không cho phép sao chép tự động. Hãy bôi đen và copy thủ công.')
    }
  }

  const share = () =>
    navigator.share({ text }).catch(() => {})

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="dialog wide" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <p className="eyebrow">Nhắn phụ huynh</p>
        <h3>{row.student.name}</h3>
        <p className="hint">{row.attended}/{row.total} buổi · {money(row.amount)}</p>

        <textarea rows={7} value={text} onChange={(e) => { setText(e.target.value); setCopied(false) }} />

        {qr && (
          <details className="qr-block">
            <summary>Mã QR chuyển khoản của em này</summary>
            <img className="qr-preview" src={qr} alt={`Mã QR chuyển khoản ${money(row.amount)}`} />
            <p className="hint">Lưu ảnh rồi gửi kèm tin nhắn, hoặc in trong phiếu báo.</p>
          </details>
        )}

        <div className="dialog-actions">
          <button className="btn btn-solid" onClick={copy}>{copied ? 'Đã sao chép ✓' : 'Sao chép tin nhắn'}</button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button className="btn" onClick={share}>Chia sẻ qua Zalo…</button>
          )}
          <div className="spacer" />
          <button className="btn btn-quiet" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  )
}
