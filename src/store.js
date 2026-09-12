import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { monthKey } from "./lib";

/* ---------- Realtime subscriptions ---------- */
export function useClasses(uid) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("user_id", uid)
        .order("order", { ascending: true });

      if (error) console.error("Error fetching classes:", error);
      else setRows(data || []);
      setLoading(false);
    };

    fetchClasses();

    // Setup realtime subscription
    const subscription = supabase
      .channel(`classes:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "classes",
          filter: `user_id=eq.${uid}`,
        },
        (payload) => {
          setRows((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((c) => c.id !== payload.old.id);
            } else if (payload.eventType === "INSERT") {
              return [...prev, payload.new].sort((a, b) => a.order - b.order);
            } else if (payload.eventType === "UPDATE") {
              return prev.map((c) =>
                c.id === payload.new.id ? payload.new : c,
              );
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [uid]);

  return { classes: rows, loadingClasses: loading };
}

export function useStudents(uid, cid, month) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!uid || !cid || !month) {
      setRows([]);
      return;
    }

    const currentMonth = monthKey();
    const isPastMonth = month < currentMonth;

    const fetchStudents = async () => {
      if (isPastMonth) {
        // Historical month:
        // get the latest roster that was effective at that month.
        const { data, error } = await supabase
          .from("student_history")
          .select("students")
          .eq("user_id", uid)
          .eq("class_id", cid)
          .lte("effective_month", `${month}-01`)
          .order("effective_month", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching student history:", error);
          setRows([]);
          return;
        }

        setRows(data?.students || []);
        return;
      }

      // Current/future month:
      // use the live students table.
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", uid)
        .eq("class_id", cid)
        .order("order", { ascending: true });

      if (error) {
        console.error("Error fetching students:", error);
      } else {
        setRows(data || []);
      }
    };

    fetchStudents();

    // Historical months are immutable from the UI,
    // so realtime updates from students are not relevant.
    if (isPastMonth) return;

    const subscription = supabase
      .channel(`students:${uid}:${cid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
          filter: `user_id=eq.${uid},class_id=eq.${cid}`,
        },
        (payload) => {
          setRows((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((s) => s.id !== payload.old.id);
            }

            if (payload.eventType === "INSERT") {
              return [...prev, payload.new].sort((a, b) => a.order - b.order);
            }

            if (payload.eventType === "UPDATE") {
              return prev
                .map((s) => (s.id === payload.new.id ? payload.new : s))
                .sort((a, b) => a.order - b.order);
            }

            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [uid, cid, month]);

  return rows;
}

/** Attendance sheet for a class in a given month. */
export function useSheet(uid, cid, month) {
  const [sheet, setSheet] = useState(null);

  useEffect(() => {
    if (!uid || !cid || !month) {
      setSheet(null);
      return;
    }

    const fetchSheet = async () => {
      const sheetId = `${cid}__${month}`;
      const { data, error } = await supabase
        .from("attendance_sheets")
        .select("*")
        .eq("user_id", uid)
        .eq("id", sheetId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching sheet:", error);
      }

      // Return existing sheet or default structure
      setSheet(
        data
          ? {
              id: data.id,
              absences: data.absences || {},
              paid: data.paid || {},
              extraSessions: data.extra_sessions || [],
              removedSessions: data.removed_sessions || [],
            }
          : {
              absences: {},
              paid: {},
              extraSessions: [],
              removedSessions: [],
            },
      );
    };

    fetchSheet();

    // Setup realtime subscription
    const sheetId = `${cid}__${month}`;
    const subscription = supabase
      .channel(`sheet:${uid}:${sheetId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_sheets",
          filter: `user_id=eq.${uid},id=eq.${sheetId}`,
        },
        (payload) => {
          setSheet({
            id: payload.new.id,
            absences: payload.new.absences || {},
            paid: payload.new.paid || {},
            extraSessions: payload.new.extra_sessions || [],
            removedSessions: payload.new.removed_sessions || [],
          });
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [uid, cid, month]);

  return sheet;
}

export function useSchedule(uid) {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    if (!uid) {
      setSchedule([]);
      return;
    }

    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from("schedule_history")
        .select("id, effective_month, schedule_slots, created_at")
        .eq("user_id", uid)
        .order("effective_month", { ascending: true });

      if (error) {
        console.error("Error fetching schedule history:", error);
        return;
      }

      setSchedule(data || []);
    };

    fetchSchedule();

    const subscription = supabase
      .channel(`schedule-history:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "schedule_history",
          filter: `user_id=eq.${uid}`,
        },
        () => {
          // Re-fetch instead of trying to manually merge INSERT/UPDATE.
          // Schedule history is small and this keeps the state simple.
          fetchSchedule();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [uid]);

  return schedule;
}

/** Payment info and message template for parents. */
export function usePayment(uid) {
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (!uid) return;

    const fetchPayment = async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", uid)
        .eq("setting_type", "payment")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching payment:", error);
      }

      setPayment(data || {});
    };

    fetchPayment();

    // Setup realtime subscription
    const subscription = supabase
      .channel(`payment:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_settings",
          filter: `user_id=eq.${uid},setting_type=eq.payment`,
        },
        (payload) => {
          setPayment(payload.new);
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [uid]);

  return payment;
}

/* ---------- Operations ---------- */
export const addClass = async (uid, name, fee, order) => {
  const { data, error } = await supabase
    .from("classes")
    .insert([
      { user_id: uid, name, fee, order, created_at: new Date().toISOString() },
    ])
    .select();

  if (error) console.error("Error adding class:", error);
  return data?.[0];
};

export const updateClass = async (uid, cid, data) => {
  const { error } = await supabase
    .from("classes")
    .update(data)
    .eq("id", cid)
    .eq("user_id", uid);

  if (error) console.error("Error updating class:", error);
};

export const removeClass = async (uid, cid) => {
  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", cid)
    .eq("user_id", uid);

  if (error) console.error("Error removing class:", error);
};

export const addStudent = async (uid, cid, name, order) => {
  const { data, error } = await supabase
    .from("students")
    .insert([
      {
        user_id: uid,
        class_id: cid,
        name,
        order,
        note: "",
      },
    ])
    .select();

  if (error) {
    console.error("Error adding student:", error);
    return;
  }

  await saveStudentHistory(uid, cid, monthKey());

  return data?.[0];
};

export const updateStudent = async (uid, cid, sid, data) => {
  const { error } = await supabase
    .from("students")
    .update(data)
    .eq("id", sid)
    .eq("user_id", uid)
    .eq("class_id", cid);

  if (error) {
    console.error("Error updating student:", error);
    return;
  }

  await saveStudentHistory(uid, cid, monthKey());
};

export const removeStudent = async (uid, cid, sid) => {
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", sid)
    .eq("user_id", uid)
    .eq("class_id", cid);

  if (error) {
    console.error("Error removing student:", error);
    return;
  }

  await saveStudentHistory(uid, cid, monthKey());
};

export const saveSheet = async (uid, cid, month, data) => {
  const sheetId = `${cid}__${month}`;
  const { error } = await supabase.from("attendance_sheets").upsert({
    id: sheetId,
    user_id: uid,
    class_id: cid,
    month,
    absences: data.absences || {},
    paid: data.paid || {},
    extra_sessions: data.extraSessions || [],
    removed_sessions: data.removedSessions || [],
    updated_at: new Date().toISOString(),
  });

  if (error) console.error("Error saving sheet:", error);
};

export const savePayment = async (uid, data) => {
  const { error } = await supabase.from("user_settings").upsert({
    user_id: uid,
    setting_type: "payment",
    ...data,
    updated_at: new Date().toISOString(),
  });

  if (error) console.error("Error saving payment:", error);
};

export const saveSchedule = async (uid, month, slots) => {
  // effective_month is always the first day of the month.
  const effectiveMonth = `${month}-01`;

  const { error } = await supabase.from("schedule_history").upsert(
    {
      user_id: uid,
      effective_month: effectiveMonth,
      schedule_slots: slots,
    },
    {
      onConflict: "user_id,effective_month",
    },
  );

  if (error) {
    console.error("Error saving schedule:", error);
  }
};

const saveStudentHistory = async (uid, cid, effectiveMonth) => {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", uid)
    .eq("class_id", cid)
    .order("order", { ascending: true });

  if (error) {
    console.error("Error reading students for history:", error);
    return;
  }

  const { error: historyError } = await supabase
    .from("student_history")
    .insert({
      user_id: uid,
      class_id: cid,
      effective_month: `${effectiveMonth}-01`,
      students: data || [],
    });

  if (historyError) {
    console.error("Error saving student history:", historyError);
  }
};
