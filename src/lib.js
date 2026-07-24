export const SLOTS = [
  { key: 'sang', label: 'Sáng' },
  { key: 'chieu', label: 'Chiều' },
  { key: 'toi', label: 'Tối' }
]

// 0 = Thứ Hai ... 6 = Chủ Nhật
export const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
export const DAYS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export const slotKey = (slot, dayIdx) => `${slot}_${dayIdx}`

export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export const monthLabel = (m) => {
  const [y, mm] = m.split('-')
  return `Tháng ${Number(mm)}/${y}`
}

export const shiftMonth = (m, delta) => {
  const [y, mm] = m.split('-').map(Number)
  const d = new Date(y, mm - 1 + delta, 1)
  return monthKey(d)
}

/** Thứ trong tuần theo chuẩn 0 = Thứ Hai. */
const dayIndex = (date) => (date.getDay() + 6) % 7

/**
 * Sinh danh sách buổi học của một lớp trong tháng, dựa trên lịch dạy cố định.
 * Kết quả đã cộng buổi dạy bù và trừ buổi đã huỷ trong sheet.
 */
export function buildSessions(month, classId, schedule = {}, sheet) {
  const [y, mm] = month.split('-').map(Number)
  const last = new Date(y, mm, 0).getDate()
  const out = []
  for (let day = 1; day <= last; day++) {
    const date = new Date(y, mm - 1, day)
    const di = dayIndex(date)
    for (const s of SLOTS) {
      if (schedule[slotKey(s.key, di)] === classId) {
        const iso = `${month}-${String(day).padStart(2, '0')}`
        out.push({ id: `${iso}_${s.key}`, date: iso, slot: s.key, day: di })
      }
    }
  }
  const extra = (sheet?.extraSessions || []).map((e) => ({
    ...e,
    day: dayIndex(new Date(e.date))
  }))
  const removed = new Set(sheet?.removedSessions || [])
  return [...out, ...extra]
    .filter((s) => !removed.has(s.id))
    .sort((a, b) => (a.id < b.id ? -1 : 1))
}

/** Thống kê từng học sinh: đi học, nghỉ, thành tiền. */
export function summarize(students, sessions, sheet, fee) {
  const absences = sheet?.absences || {}
  const paid = sheet?.paid || {}
  const rows = students.map((st) => {
    const off = (absences[st.id] || []).filter((id) => sessions.some((s) => s.id === id)).length
    const attended = sessions.length - off
    return {
      student: st,
      total: sessions.length,
      off,
      attended,
      amount: attended * (fee || 0),
      paid: !!paid[st.id]
    }
  })
  return {
    rows,
    grandTotal: rows.reduce((a, r) => a + r.amount, 0),
    collected: rows.filter((r) => r.paid).reduce((a, r) => a + r.amount, 0)
  }
}

/** Danh sách buổi nghỉ của một học sinh kèm lý do đã ghi. */
export function absenceDetails(studentId, sessions, sheet) {
  const off = new Set(sheet?.absences?.[studentId] || [])
  const reasons = sheet?.reasons?.[studentId] || {}
  return sessions
    .filter((s) => off.has(s.id))
    .map((s) => ({ ...s, reason: reasons[s.id] || '' }))
}

export const REASON_PRESETS = ['Ốm', 'Việc gia đình', 'Nghỉ lễ', 'Trùng lịch học', 'Không báo trước']

export const money = (n) => (n || 0).toLocaleString('vi-VN') + '\u00a0₫'

export const dateShort = (iso) => {
  const [, m, d] = iso.split('-')
  return `${Number(d)}/${Number(m)}`
}

/* ---------------- tin nhắn gửi phụ huynh ---------------- */

export const DEFAULT_TEMPLATE =
  'Chào anh/chị, {thang} em {ten} ({lop}) đi học {dihoc}/{sobuoi} buổi, nghỉ {nghi} buổi{chitietnghi}. ' +
  'Học phí tháng này: {hocphi}.\n{chuyenkhoan}\nCảm ơn anh/chị ạ.'

/** Ghép tin nhắn từ mẫu và số liệu của một học sinh. */
export function buildMessage(template, { row, cls, month, sessions, sheet, payment }) {
  const details = absenceDetails(row.student.id, sessions, sheet)
  const chitiet = details.length
    ? ' (' + details.map((d) => `${dateShort(d.date)}${d.reason ? ' - ' + d.reason.toLowerCase() : ''}`).join(', ') + ')'
    : ''
  const ck = payment?.accountNo
    ? `Chuyển khoản: ${payment.accountNo} - ${payment.accountName || ''} (${payment.bankName || ''}), nội dung ghi tên con.`
    : ''
  const map = {
    ten: row.student.name,
    lop: cls.name,
    thang: monthLabel(month).toLowerCase(),
    sobuoi: row.total,
    dihoc: row.attended,
    nghi: row.off,
    chitietnghi: chitiet,
    hocphi: money(row.amount),
    chuyenkhoan: ck
  }
  return (template || DEFAULT_TEMPLATE)
    .replace(/\{(\w+)\}/g, (m, k) => (k in map ? String(map[k]) : m))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
