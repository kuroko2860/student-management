import { saveSchedule } from "../store";
import { SLOTS, DAYS, slotKey, monthKey, scheduleForMonth } from "../lib";

export default function SchedulePanel({ uid, classes, schedule }) {
  const currentMonth = monthKey();

  // Get the schedule currently effective for this month.
  const currentSlots = scheduleForMonth(schedule || [], currentMonth);

  const set = (key, value) => {
    const nextSlots = {
      ...currentSlots,
      [key]: value,
    };

    // Save a new schedule version effective from the current month.
    saveSchedule(uid, currentMonth, nextSlots);
  };

  return (
    <div className="schedule-wrap">
      <div className="schedule-grid">
        <div className="cell head">Buổi</div>

        {DAYS.map((d) => (
          <div key={d} className="cell head">
            {d}
          </div>
        ))}

        {SLOTS.map((s) => (
          <Row
            key={s.key}
            slot={s}
            classes={classes}
            schedule={currentSlots}
            set={set}
          />
        ))}
      </div>

      <p className="hint" style={{ marginTop: 12 }}>
        Lịch thay đổi từ tháng hiện tại trở đi. Các tháng đã qua không bị thay
        đổi.
      </p>
    </div>
  );
}

function Row({ slot, classes, schedule, set }) {
  return (
    <>
      <div className="cell slot">{slot.label}</div>

      {DAYS.map((_, i) => {
        const key = slotKey(slot.key, i);
        const value = schedule[key] || "";

        return (
          <div key={key} className="cell">
            <select
              className={value ? "filled" : ""}
              value={value}
              onChange={(e) => set(key, e.target.value)}
            >
              <option value="">—</option>

              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </>
  );
}
