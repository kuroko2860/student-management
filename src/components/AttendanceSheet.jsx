import { useState } from 'react'
import { addStudent, removeStudent, updateStudent, saveSheet } from '../store'
import { summarize, money, dateShort, DAYS_SHORT, buildMessage } from '../lib'
import { exportExcel, printSlips } from '../export'
import AbsenceDialog from './AbsenceDialog'
import MessageDialog from './MessageDialog'

export default function AttendanceSheet({ uid, cls, students, sessions, sheet, month, teacher, payment }) {
  const [newName, setNewName] = useState('')
  const [dialog, setDialog] = useState(null)
  const [msg, setMsg] = useState(null)
  const { rows, grandTotal, collected } = summarize(students, sessions, sheet, cls.fee)

  const setAbsent = (sid, sessionId, absent) => {
    const list = new Set(sheet?.absences?.[sid] || [])
    absent ? list.add(sessionId) : list.delete(sessionId)
    const reasons = { ...(sheet?.reasons?.[sid] || {}) }
    if (!absent) delete reasons[sessionId]
    saveSheet(uid, cls.id, month, {
      absences: { ...(sheet?.absences || {}), [sid]: [...list] },
      reasons: { ...(sheet?.reasons || {}), [sid]: reasons }
    })
  }

  const saveReason = (sid, sessionId, reason) => {
    const reasons = { ...(sheet?.reasons?.[sid] || {}) }
    reason ? (reasons[sessionId] = reason) : delete reasons[sessionId]
    saveSheet(uid, cls.id, month, { reasons: { ...(sheet?.reasons || {}), [sid]: reasons } })
  }

  /** Bấm ô: đang học thì đánh dấu nghỉ ngay, đang nghỉ thì mở ô ghi lý do. */
  const tapCell = (student, session) => {
    const off = (sheet?.absences?.[student.id] || []).includes(session.id)
    if (!off) return setAbsent(student.id, session.id, true)
    setDialog({ student, session, reason: sheet?.reasons?.[student.id]?.[session.id] || '' })
  }

  const togglePaid = (sid) =>
    saveSheet(uid, cls.id, month, {
      paid: { ...(sheet?.paid || {}), [sid]: !sheet?.paid?.[sid] }
    })

  const dropSession = (id) =>
    saveSheet(uid, cls.id, month, {
      removedSessions: [...(sheet?.removedSessions || []), id],
      extraSessions: (sheet?.extraSessions || []).filter((e) => e.id !== id)
    })

  const addSession = () => {
    const date = prompt('Thêm buổi dạy bù — nhập ngày (YYYY-MM-DD):', `${month}-01`)
    if (!date || !date.startsWith(month)) return
    const id = `${date}_bu`
    saveSheet(uid, cls.id, month, {
      extraSessions: [...(sheet?.extraSessions || []), { id, date, slot: 'bu' }],
      removedSessions: (sheet?.removedSessions || []).filter((r) => r !== id)
    })
  }

  const add = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    addStudent(uid, cls.id, name, students.length)
    setNewName('')
  }

  const payload = { cls, students, sessions, sheet, month, teacher, payment }

  const openMessage = (row) => setMsg({ row, cls, month, sessions, sheet, payment })

  const copyAllMessages = async () => {
    const all = rows
      .filter((r) => !r.paid)
      .map((r) => buildMessage(payment?.msgTemplate, { row: r, cls, month, sessions, sheet, payment }))
      .join('\n\n———\n\n')
    if (!all) return alert('Cả lớp đã thanh toán, không còn tin nào cần gửi.')
    try {
      await navigator.clipboard.writeText(all)
      alert(`Đã sao chép tin nhắn của ${rows.filter((r) => !r.paid).length} học sinh chưa thanh toán.`)
    } catch {
      alert('Trình duyệt không cho phép sao chép tự động.')
    }
  }

  return (
    <>
      <div className="sheet-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th className="name-col">Học sinh</th>
              {sessions.map((s) => (
                <th key={s.id} className="date-col" title="Bấm để bỏ buổi này khỏi tháng">
                  <button className="col-drop" onClick={() => dropSession(s.id)}>
                    {dateShort(s.date)}
                  </button>
                  <small>{s.slot === 'bu' ? 'bù' : DAYS_SHORT[s.day]}</small>
                </th>
              ))}
              <th>Buổi</th>
              <th>Nghỉ</th>
              <th>Học</th>
              <th>Tiền học</th>
              <th>Đã thu</th>
              <th aria-label="Thao tác" />
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.student.id}>
                <td className="name-col">
                  <input
                    className="name-edit"
                    defaultValue={r.student.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v && v !== r.student.name) updateStudent(uid, cls.id, r.student.id, { name: v })
                    }}
                  />
                </td>
                {sessions.map((s) => {
                  const off = (sheet?.absences?.[r.student.id] || []).includes(s.id)
                  const reason = sheet?.reasons?.[r.student.id]?.[s.id] || ''
                  return (
                    <td key={s.id} className="date-col">
                      <button
                        className={'mark' + (off ? ' off' : '') + (reason ? ' noted' : '')}
                        onClick={() => tapCell(r.student, s)}
                        title={
                          off
                            ? (reason ? `Nghỉ — ${reason}` : 'Nghỉ — bấm để ghi lý do')
                            : 'Có học — bấm để đánh dấu nghỉ'
                        }
                      >
                        {off ? '✕' : '•'}
                      </button>
                    </td>
                  )
                })}
                <td className="num sum-col">{r.total}</td>
                <td className="num sum-col" style={{ color: r.off ? 'var(--pen)' : 'inherit' }}>{r.off || ''}</td>
                <td className="num sum-col">{r.attended}</td>
                <td className="amount sum-col">{money(r.amount)}</td>
                <td className="sum-col">
                  <input
                    type="checkbox"
                    className="paid-box"
                    checked={r.paid}
                    onChange={() => togglePaid(r.student.id)}
                  />
                </td>
                <td className="ops">
                  <button
                    className="row-btn"
                    title="Soạn tin nhắn gửi phụ huynh"
                    onClick={() => openMessage(r)}
                  >
                    ✉
                  </button>
                  <button
                    className="row-btn"
                    title="In phiếu báo của học sinh này"
                    onClick={() => printSlips({ ...payload, only: r.student.id })}
                  >
                    ⎙
                  </button>
                  <button
                    className="row-btn del"
                    title="Xoá học sinh"
                    onClick={() => {
                      if (confirm(`Xoá ${r.student.name} khỏi lớp ${cls.name}?`))
                        removeStudent(uid, cls.id, r.student.id)
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={sessions.length + 7} className="empty">
                  Lớp chưa có học sinh. Thêm tên bên dưới để bắt đầu điểm danh.
                </td>
              </tr>
            )}
          </tbody>

          {rows.length > 0 && (
            <tfoot>
              <tr>
                <td className="name-col">Tổng lớp</td>
                {sessions.map((s) => <td key={s.id} />)}
                <td colSpan={3} />
                <td className="amount">{money(grandTotal)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="toolbar">
        <form onSubmit={add} style={{ display: 'flex', gap: 8 }}>
          <input
            className="btn"
            style={{ minWidth: 190 }}
            placeholder="Tên học sinh mới"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn btn-solid" type="submit">Thêm học sinh</button>
        </form>
        <button className="btn btn-quiet" onClick={addSession}>Thêm buổi dạy bù</button>
        <div className="spacer" />
        <button className="btn" onClick={copyAllMessages}>Copy tin nhắn cả lớp</button>
        <button className="btn" onClick={() => exportExcel(payload)}>Xuất Excel</button>
        <button className="btn" onClick={() => printSlips(payload)}>In phiếu báo / PDF</button>
      </div>

      <p className="hint" style={{ padding: '0 16px' }}>
        Bấm ô để đánh dấu nghỉ · bấm lần nữa vào ô đỏ để ghi lý do · ô có gạch chân là đã ghi lý do
      </p>

      <dl className="totals">
        <div><dt>Số buổi trong tháng</dt><dd>{sessions.length}</dd></div>
        <div><dt>Học phí mỗi buổi</dt><dd>{money(cls.fee)}</dd></div>
        <div><dt>Tổng thu dự kiến</dt><dd>{money(grandTotal)}</dd></div>
        <div><dt>Đã thu</dt><dd className="ok">{money(collected)}</dd></div>
        <div><dt>Còn lại</dt><dd className="pen">{money(grandTotal - collected)}</dd></div>
      </dl>

      <MessageDialog info={msg} onClose={() => setMsg(null)} />

      <AbsenceDialog
        info={dialog}
        onClose={() => setDialog(null)}
        onSave={(text) => {
          saveReason(dialog.student.id, dialog.session.id, text)
          setDialog(null)
        }}
        onPresent={() => {
          setAbsent(dialog.student.id, dialog.session.id, false)
          setDialog(null)
        }}
      />
    </>
  )
}
