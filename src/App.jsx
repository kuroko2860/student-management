import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import {
  useClasses,
  useStudents,
  useSheet,
  useSchedule,
  usePayment,
  addClass,
  updateClass,
  removeClass,
} from "./store";
import { buildSessions, monthKey, monthLabel, shiftMonth, money } from "./lib";
import AttendanceSheet from "./components/AttendanceSheet";
import SchedulePanel from "./components/SchedulePanel";
import SettingsPanel from "./components/SettingsPanel";

export default function App() {
  const [user, setUser] = useState(undefined);
  const [view, setView] = useState("sheet");
  const [activeId, setActiveId] = useState(null);
  const [month, setMonth] = useState(monthKey());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // Stops full page refresh
    console.log("Submitted Data:", { email, password });
    supabase.auth.signInWithPassword({ email, password });
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const uid = user?.id;
  const { classes, loadingClasses } = useClasses(uid);
  const active = classes.find((c) => c.id === activeId) || classes[0] || null;
  const students = useStudents(uid, active?.id);
  const sheet = useSheet(uid, active?.id, month);
  const schedule = useSchedule(uid);
  const payment = usePayment(uid);

  useEffect(() => {
    if (!activeId && classes.length) setActiveId(classes[0].id);
  }, [classes, activeId]);

  const sessions = useMemo(
    () =>
      active && schedule
        ? buildSessions(month, active.id, schedule, sheet)
        : [],
    [active, schedule, month, sheet],
  );

  if (user === undefined)
    return (
      <div className="center">
        <p>Đang mở sổ…</p>
      </div>
    );

  if (!user)
    return (
      <div className="app">
        <div className="center">
          <div>
            <h2>Sổ lớp học</h2>
            <p>
              Điểm danh, tính học phí và theo dõi lịch dạy của tất cả các lớp
              trong một chỗ.
            </p>
            {/* create email/password form to login*/}
            <form
              onSubmit={handleSubmit}
              style={{ maxWidth: "300px", margin: "20px" }}
            >
              <h2>Sign In</h2>

              <div>
                <label>Email: </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginTop: "10px" }}>
                <label>Password: </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" style={{ marginTop: "15px" }}>
                Submit
              </button>
            </form>

            <button
              className="btn btn-solid"
              onClick={() =>
                supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: window.location.origin,
                  },
                })
              }
            >
              Đăng nhập bằng Google
            </button>
            <div className="or">Hoặc</div>
            <button
              className="btn btn-solid"
              onClick={() =>
                supabase.auth.signInWithOAuth({
                  provider: "github",
                  options: {
                    redirectTo: window.location.origin,
                  },
                })
              }
            >
              Đăng nhập bằng Github
            </button>
          </div>
        </div>
      </div>
    );

  const createClass = async () => {
    const name = prompt("Tên lớp (ví dụ: Lớp 12):");
    if (!name) return;
    const fee = Number(prompt("Học phí mỗi buổi (VNĐ):", "150000")) || 0;
    await addClass(uid, name.trim(), fee, classes.length);
  };

  const editClass = async () => {
    if (!active) return;
    const name = prompt("Đổi tên lớp:", active.name);
    if (name === null) return;
    const fee = Number(
      prompt("Học phí mỗi buổi (VNĐ):", String(active.fee || 0)),
    );
    await updateClass(uid, active.id, {
      name: name.trim() || active.name,
      fee: isNaN(fee) ? active.fee : fee,
    });
  };

  const deleteClass = async () => {
    if (!active) return;
    if (
      confirm(`Xoá lớp ${active.name}? Học sinh và điểm danh của lớp sẽ mất.`)
    ) {
      await removeClass(uid, active.id);
      setActiveId(null);
    }
  };

  return (
    <div className="app">
      <header className="masthead">
        <h1>Sổ lớp học</h1>
        {active && view === "sheet" && (
          <span className="hint">
            {active.name} · {money(active.fee)}/buổi
          </span>
        )}
        <div className="who">
          <span>{user.user_metadata?.full_name || user.email}</span>
          <button
            className="btn btn-quiet btn-sm"
            onClick={() => supabase.auth.signOut()}
          >
            Thoát
          </button>
        </div>
      </header>

      <div className="tabs" role="tablist">
        {classes.map((c) => (
          <button
            key={c.id}
            role="tab"
            className="tab"
            aria-selected={active?.id === c.id && view === "sheet"}
            onClick={() => {
              setActiveId(c.id);
              setView("sheet");
            }}
          >
            {c.name}
          </button>
        ))}
        <button className="tab tab-add" onClick={createClass}>
          + Lớp mới
        </button>
        <button
          role="tab"
          className="tab"
          aria-selected={view === "schedule"}
          style={{ marginLeft: "auto" }}
          onClick={() => setView("schedule")}
        >
          Lịch dạy
        </button>
        <button
          role="tab"
          className="tab"
          aria-selected={view === "settings"}
          onClick={() => setView("settings")}
        >
          Cài đặt
        </button>
      </div>

      {view === "settings" ? (
        <SettingsPanel uid={uid} payment={payment} />
      ) : view === "schedule" ? (
        <SchedulePanel uid={uid} classes={classes} schedule={schedule || {}} />
      ) : !active ? (
        <div className="empty">
          {loadingClasses
            ? "Đang tải…"
            : 'Chưa có lớp nào. Bấm "+ Lớp mới" để mở lớp đầu tiên.'}
        </div>
      ) : (
        <>
          <div className="toolbar">
            <div className="month">
              <button
                onClick={() => setMonth(shiftMonth(month, -1))}
                aria-label="Tháng trước"
              >
                ‹
              </button>
              <span>{monthLabel(month)}</span>
              <button
                onClick={() => setMonth(shiftMonth(month, 1))}
                aria-label="Tháng sau"
              >
                ›
              </button>
            </div>
            <button
              className="btn btn-quiet btn-sm"
              onClick={() => setMonth(monthKey())}
            >
              Tháng này
            </button>
            <div className="spacer" />
            <button className="btn btn-sm" onClick={editClass}>
              Sửa lớp
            </button>
            <button className="btn btn-sm btn-danger" onClick={deleteClass}>
              Xoá lớp
            </button>
          </div>

          <AttendanceSheet
            uid={uid}
            cls={active}
            students={students}
            sessions={sessions}
            sheet={sheet}
            month={month}
            teacher={user.user_metadata?.full_name || user.email}
            payment={payment}
          />
        </>
      )}
    </div>
  );
}
