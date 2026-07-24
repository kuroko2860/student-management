import { saveSchedule } from '../store'
import { SLOTS, DAYS, slotKey } from '../lib'

export default function SchedulePanel({ uid, classes, schedule }) {
  const set = (key, value) => saveSchedule(uid, { ...schedule, [key]: value })

  return (
    <div className="schedule-wrap">
      <div className="schedule-grid">
        <div className="cell head">Buổi</div>
        {DAYS.map((d) => (
          <div key={d} className="cell head">{d}</div>
        ))}

        {SLOTS.map((s) => (
          <Row key={s.key} slot={s} classes={classes} schedule={schedule} set={set} />
        ))}
      </div>
      <p className="hint" style={{ marginTop: 12 }}>
        Lịch này quyết định số buổi học của mỗi lớp trong tháng. Sửa ở đây, bảng điểm danh tự cập nhật.
      </p>
    </div>
  )
}

function Row({ slot, classes, schedule, set }) {
  return (
    <>
      <div className="cell slot">{slot.label}</div>
      {DAYS.map((_, i) => {
        const key = slotKey(slot.key, i)
        const value = schedule[key] || ''
        return (
          <div key={key} className="cell">
            <select
              className={value ? 'filled' : ''}
              value={value}
              onChange={(e) => set(key, e.target.value)}
            >
              <option value="">—</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )
      })}
    </>
  )
}
