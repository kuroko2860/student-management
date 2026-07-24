import { useEffect, useState } from 'react'
import { REASON_PRESETS, dateShort, DAYS_SHORT } from '../lib'

export default function AbsenceDialog({ info, onSave, onPresent, onClose }) {
  const [text, setText] = useState('')

  useEffect(() => setText(info?.reason || ''), [info])
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!info) return null
  const { student, session } = info

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <p className="eyebrow">Buổi nghỉ</p>
        <h3>{student.name}</h3>
        <p className="hint">
          Ngày {dateShort(session.date)}
          {session.slot === 'bu' ? ' · buổi dạy bù' : ` · ${DAYS_SHORT[session.day]}`}
        </p>

        <div className="chips">
          {REASON_PRESETS.map((r) => (
            <button
              key={r}
              className={'chip' + (text === r ? ' on' : '')}
              onClick={() => setText(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <input
          className="btn"
          style={{ width: '100%', marginTop: 10 }}
          placeholder="Lý do nghỉ (tự nhập)"
          value={text}
          autoFocus
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSave(text.trim())}
        />

        <div className="dialog-actions">
          <button className="btn btn-quiet" onClick={onPresent}>Bỏ nghỉ, đánh dấu có học</button>
          <div className="spacer" />
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-solid" onClick={() => onSave(text.trim())}>Lưu lý do</button>
        </div>
      </div>
    </div>
  )
}
