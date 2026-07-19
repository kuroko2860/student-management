import { supabase } from "@/lib/supabase";

export async function getSchedules() {
  const { data, error } = await supabase
    .from("schedules")
    .select(
      `
            *,
            classes (
                id,
                name,
                color
            )
        `,
    )
    .order("weekday")
    .order("session");

  if (error) throw error;

  return data;
}

export async function getSchedule(id) {
  const { data, error } = await supabase
    .from("schedules")
    .select(
      `
            *,
            classes (
                id,
                name,
                color
            )
        `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function createSchedule(schedule) {
  const { error } = await supabase.from("schedules").insert(schedule);

  if (error) throw error;
}

export async function updateSchedule(id, schedule) {
  const { error } = await supabase
    .from("schedules")
    .update(schedule)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteSchedule(id) {
  const { error } = await supabase.from("schedules").delete().eq("id", id);

  if (error) throw error;
}

export async function getSchedulesByWeekday(weekday) {
  return supabase
    .from("schedules")
    .select(
      `
        *,
        classes(
            id,
            name,
            color
        )
    `,
    )
    .eq("weekday", weekday)
    .order("session");
}
