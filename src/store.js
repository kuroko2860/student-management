import { useEffect, useState } from "react";
import { supabase } from "./supabase";

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

export function useStudents(uid, cid) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!uid || !cid) {
      setRows([]);
      return;
    }

    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", uid)
        .eq("class_id", cid)
        .order("order", { ascending: true });

      if (error) console.error("Error fetching students:", error);
      else setRows(data || []);
    };

    fetchStudents();

    // Setup realtime subscription
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
            } else if (payload.eventType === "INSERT") {
              return [...prev, payload.new].sort((a, b) => a.order - b.order);
            } else if (payload.eventType === "UPDATE") {
              return prev.map((s) =>
                s.id === payload.new.id ? payload.new : s,
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
  }, [uid, cid]);

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
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    if (!uid) return;

    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("schedule_slots")
        .eq("user_id", uid)
        .eq("setting_type", "schedule")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching schedule:", error);
      }

      setSchedule(data?.schedule_slots || {});
    };

    fetchSchedule();

    // Setup realtime subscription
    const subscription = supabase
      .channel(`schedule:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_settings",
          filter: `user_id=eq.${uid},setting_type=eq.schedule`,
        },
        (payload) => {
          setSchedule(payload.new.schedule_slots || {});
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
    .insert([{ user_id: uid, class_id: cid, name, order, note: "" }])
    .select();

  if (error) console.error("Error adding student:", error);
  return data?.[0];
};

export const updateStudent = async (uid, cid, sid, data) => {
  const { error } = await supabase
    .from("students")
    .update(data)
    .eq("id", sid)
    .eq("user_id", uid)
    .eq("class_id", cid);

  if (error) console.error("Error updating student:", error);
};

export const removeStudent = async (uid, cid, sid) => {
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", sid)
    .eq("user_id", uid)
    .eq("class_id", cid);

  if (error) console.error("Error removing student:", error);
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

export const saveSchedule = async (uid, slots) => {
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: uid,
      setting_type: "schedule",
      schedule_slots: slots,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,setting_type" },
  );

  if (error) console.error("Error saving schedule:", error);
};
