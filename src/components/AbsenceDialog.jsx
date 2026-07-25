import { useEffect } from "react";
import { dateShort, DAYS_SHORT } from "../lib";

export default function AbsenceDialog({ info, onConfirm, onCancel }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancel]);

  if (!info) return null;
  const { student, session } = info;

  return (
    <div className="backdrop" onMouseDown={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="eyebrow">Xác nhận đánh dấu nghỉ</p>
        <h3>{student.name}</h3>
        <p className="hint">
          Ngày {dateShort(session.date)}
          {session.slot === "bu"
            ? " · buổi dạy bù"
            : ` · ${DAYS_SHORT[session.day]}`}
        </p>

        <div className="dialog-actions">
          <button className="btn" onClick={onCancel}>
            Huỷ
          </button>
          <div className="spacer" />
          <button className="btn btn-solid" onClick={onConfirm}>
            Xác nhận nghỉ
          </button>
        </div>
      </div>
    </div>
  );
}
