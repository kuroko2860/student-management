import { useState } from "react";
import { addStudent, removeStudent, updateStudent, saveSheet } from "../store";
import { summarize, money, dateShort, DAYS_SHORT, buildMessage } from "../lib";
import { exportExcel, printSlips } from "../export";
import AbsenceDialog from "./AbsenceDialog";
import MessageDialog from "./MessageDialog";

export default function AttendanceSheet({
  uid,
  cls,
  students,
  sessions,
  sheet,
  month,
  teacher,
  payment,
}) {
  const [newName, setNewName] = useState("");
  const [dialog, setDialog] = useState(null);
  const [msg, setMsg] = useState(null);
  const { rows, grandTotal, collected } = summarize(
    students,
    sessions,
    sheet,
    cls.fee,
  );

  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine if a session is in the past, present, or future
  const getSessionStatus = (session) => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate < today) return "past";
    if (sessionDate.getTime() === today.getTime()) return "current";
    return "future";
  };

  // Count past attendance dates for this student in the current month
  const countPastAttendances = (studentId) => {
    return sessions.filter((s) => {
      const status = getSessionStatus(s);
      const isAbsent = (sheet?.absences?.[studentId] || []).includes(s.id);
      return status === "past" && !isAbsent;
    }).length;
  };

  // Count total past dates (attended + absent)
  const countTotalPastDates = () => {
    return sessions.filter((s) => getSessionStatus(s) === "past").length;
  };

  const setAbsent = (sid, sessionId) => {
    const list = new Set(sheet?.absences?.[sid] || []);
    list.add(sessionId);
    saveSheet(uid, cls.id, month, {
      absences: { ...(sheet?.absences || {}), [sid]: [...list] },
    });
  };

  const removeAbsent = (sid, sessionId) => {
    const list = new Set(sheet?.absences?.[sid] || []);
    list.delete(sessionId);
    saveSheet(uid, cls.id, month, {
      absences: { ...(sheet?.absences || {}), [sid]: [...list] },
    });
  };

  /** Click cell: if attending → mark absent, if absent → unmark (remove absence) */
  const tapCell = (student, session) => {
    const isAbsent = (sheet?.absences?.[student.id] || []).includes(session.id);
    if (!isAbsent) {
      // Mark as absent with confirmation
      setDialog({ student, session, isAbsent: false });
    } else {
      // Unmark as absent (no confirmation needed)
      removeAbsent(student.id, session.id);
    }
  };

  const togglePaid = (sid) =>
    saveSheet(uid, cls.id, month, {
      paid: { ...(sheet?.paid || {}), [sid]: !sheet?.paid?.[sid] },
    });

  const dropSession = (id) =>
    saveSheet(uid, cls.id, month, {
      removedSessions: [...(sheet?.removedSessions || []), id],
      extraSessions: (sheet?.extraSessions || []).filter((e) => e.id !== id),
    });

  const addSession = () => {
    const date = prompt(
      "Thêm buổi dạy bù — nhập ngày (YYYY-MM-DD):",
      `${month}-01`,
    );
    if (!date || !date.startsWith(month)) return;
    const id = `${date}_bu`;
    saveSheet(uid, cls.id, month, {
      extraSessions: [
        ...(sheet?.extraSessions || []),
        { id, date, slot: "bu" },
      ],
      removedSessions: (sheet?.removedSessions || []).filter((r) => r !== id),
    });
  };

  const add = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    addStudent(uid, cls.id, name, students.length);
    setNewName("");
  };

  const payload = { cls, students, sessions, sheet, month, teacher, payment };

  const openMessage = (row) =>
    setMsg({ row, cls, month, sessions, sheet, payment });

  const copyAllMessages = async () => {
    const all = rows
      .filter((r) => !r.paid)
      .map((r) =>
        buildMessage(payment?.msgTemplate, {
          row: r,
          cls,
          month,
          sessions,
          sheet,
          payment,
        }),
      )
      .join("\n\n———\n\n");
    if (!all) return alert("Cả lớp đã thanh toán, không còn tin nào cần gửi.");
    try {
      await navigator.clipboard.writeText(all);
      alert(
        `Đã sao chép tin nhắn của ${rows.filter((r) => !r.paid).length} học sinh chưa thanh toán.`,
      );
    } catch {
      alert("Trình duyệt không cho phép sao chép tự động.");
    }
  };

  const totalPastDates = countTotalPastDates();

  return (
    <>
      <div className="sheet-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th>STT</th>
              <th className="name-col">Học sinh</th>
              {sessions.map((s) => {
                const status = getSessionStatus(s);
                const statusClass =
                  status === "past"
                    ? "past"
                    : status === "current"
                      ? "current"
                      : "future";
                return (
                  <th
                    key={s.id}
                    className={`date-col`}
                    title={
                      status === "past"
                        ? "Ngày đã qua"
                        : status === "current"
                          ? "Ngày hôm nay"
                          : "Ngày sắp tới"
                    }
                  >
                    <button
                      className="col-drop"
                      onClick={() => dropSession(s.id)}
                    >
                      {dateShort(s.date)}
                    </button>
                    <small>{s.slot === "bu" ? "bù" : DAYS_SHORT[s.day]}</small>
                  </th>
                );
              })}
              <th>Đã học</th>
              <th>Buổi</th>
              <th>Nghỉ</th>
              <th>Học</th>
              <th>Tiền học</th>
              <th>Đã thu</th>
              <th aria-label="Thao tác" />
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={r.student.id}>
                <td>{i + 1}</td>
                <td className="name-col">
                  <input
                    className="name-edit"
                    defaultValue={r.student.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== r.student.name)
                        updateStudent(uid, cls.id, r.student.id, { name: v });
                    }}
                  />
                </td>
                {sessions.map((s) => {
                  const isAbsent = (
                    sheet?.absences?.[r.student.id] || []
                  ).includes(s.id);
                  const status = getSessionStatus(s);
                  const statusClass =
                    status === "past"
                      ? "past"
                      : status === "current"
                        ? "current"
                        : "future";

                  return (
                    <td key={s.id} className={`date-col ${statusClass}`}>
                      <button
                        className={`mark ${isAbsent ? "off" : ""}`}
                        onClick={() => tapCell(r.student, s)}
                        title={
                          isAbsent
                            ? "Đã đánh dấu nghỉ — bấm để bỏ đánh dấu"
                            : "Bấm để đánh dấu nghỉ"
                        }
                      >
                        {isAbsent ? "✕" : "•"}
                      </button>
                    </td>
                  );
                })}
                <td className="num sum-col">
                  {countPastAttendances(r.student.id)}
                </td>
                <td className="num sum-col">{r.total}</td>
                <td
                  className="num sum-col"
                  style={{ color: r.off ? "var(--pen)" : "inherit" }}
                >
                  {r.off || ""}
                </td>
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
                    onClick={() =>
                      printSlips({ ...payload, only: r.student.id })
                    }
                  >
                    ⎙
                  </button>
                  <button
                    className="row-btn del"
                    title="Xoá học sinh"
                    onClick={() => {
                      if (
                        confirm(`Xoá ${r.student.name} khỏi lớp ${cls.name}?`)
                      )
                        removeStudent(uid, cls.id, r.student.id);
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={sessions.length + 8} className="empty">
                  Lớp chưa có học sinh. Thêm tên bên dưới để bắt đầu điểm danh.
                </td>
              </tr>
            )}
          </tbody>

          {rows.length > 0 && (
            <tfoot>
              <tr>
                <td className="name-col">Tổng lớp</td>
                {sessions.map((s) => (
                  <td key={s.id} />
                ))}
                <td colSpan={4} />
                <td className="amount">{money(grandTotal)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="toolbar">
        <form onSubmit={add} style={{ display: "flex", gap: 8 }}>
          <input
            className="btn"
            style={{ minWidth: 190 }}
            placeholder="Tên học sinh mới"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn btn-solid" type="submit">
            Thêm học sinh
          </button>
        </form>
        <button className="btn btn-quiet" onClick={addSession}>
          Thêm buổi dạy bù
        </button>
        <div className="spacer" />
        <button className="btn" onClick={copyAllMessages}>
          Copy tin nhắn cả lớp
        </button>
        <button className="btn" onClick={() => exportExcel(payload)}>
          Xuất Excel
        </button>
        <button className="btn" onClick={() => printSlips(payload)}>
          In phiếu báo / PDF
        </button>
      </div>

      <p className="hint" style={{ padding: "0 16px" }}>
        Bấm ô để đánh dấu nghỉ · bấm lần nữa để bỏ đánh dấu
      </p>

      <div
        style={{
          padding: "0 16px",
          display: "flex",
          gap: 16,
          fontSize: "0.9em",
          marginTop: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: "var(--bg-past)",
              border: "1px solid #ccc",
            }}
          />
          <span>Ngày đã qua</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: "var(--bg-current)",
              border: "1px solid #ccc",
            }}
          />
          <span>Hôm nay</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: "var(--bg-future)",
              border: "1px solid #ccc",
            }}
          />
          <span>Ngày sắp tới</span>
        </div>
      </div>

      <dl className="totals">
        <div>
          <dt>Ngày đã qua</dt>
          <dd>{totalPastDates}</dd>
        </div>
        <div>
          <dt>Số buổi trong tháng</dt>
          <dd>{sessions.length}</dd>
        </div>
        <div>
          <dt>Học phí mỗi buổi</dt>
          <dd>{money(cls.fee)}</dd>
        </div>
        <div>
          <dt>Tổng thu dự kiến</dt>
          <dd>{money(grandTotal)}</dd>
        </div>
        <div>
          <dt>Đã thu</dt>
          <dd className="ok">{money(collected)}</dd>
        </div>
        <div>
          <dt>Còn lại</dt>
          <dd className="pen">{money(grandTotal - collected)}</dd>
        </div>
      </dl>

      <MessageDialog info={msg} onClose={() => setMsg(null)} />

      <AbsenceDialog
        info={dialog}
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setAbsent(dialog.student.id, dialog.session.id);
          setDialog(null);
        }}
      />
    </>
  );
}
