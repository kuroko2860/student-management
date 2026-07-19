import { supabase } from "@/lib/supabase";

/**
 * Lấy lesson theo schedule + ngày
 */
export async function getLesson(scheduleId, lessonDate) {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("lesson_date", lessonDate)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Tạo lesson
 */
export async function createLesson(scheduleId, lessonDate) {
  const { data, error } = await supabase
    .from("lessons")
    .insert({
      schedule_id: scheduleId,
      lesson_date: lessonDate,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Lấy lesson, nếu chưa có thì tạo mới
 */
export async function getOrCreateLesson(scheduleId, lessonDate) {
  let lesson = await getLesson(scheduleId, lessonDate);

  if (lesson) {
    return lesson;
  }

  lesson = await createLesson(scheduleId, lessonDate);

  return lesson;
}

/**
 * Xóa lesson
 */
export async function deleteLesson(id) {
  const { error } = await supabase.from("lessons").delete().eq("id", id);

  if (error) throw error;
}
