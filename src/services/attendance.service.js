import { supabase } from "@/lib/supabase";

import { ATTENDANCE_STATUS } from "@/constants/attendance";

export async function getAttendances(lessonId) {
  const { data, error } = await supabase
    .from("attendances")
    .select(
      `
            *,
            students (
                id,
                name
            )
        `,
    )
    .eq("lesson_id", lessonId)
    .order("student_id");

  if (error) throw error;

  return data;
}

export async function createDefaultAttendances(lessonId, students) {
  const rows = students.map((student) => ({
    lesson_id: lessonId,
    student_id: student.id,
    status: ATTENDANCE_STATUS.PRESENT,
  }));

  const { error } = await supabase.from("attendances").insert(rows);

  if (error) throw error;
}

export async function saveAttendances(lessonId, attendances) {
  const rows = attendances.map((item) => ({
    lesson_id: lessonId,

    student_id: item.student_id,

    status: item.status,

    note: item.note ?? "",
  }));

  const { error } = await supabase.from("attendances").upsert(rows, {
    onConflict: "lesson_id,student_id",
  });

  if (error) throw error;
}

export function nextAttendanceStatus(status) {
  switch (status) {
    case ATTENDANCE_STATUS.PRESENT:
      return ATTENDANCE_STATUS.ABSENT;

    case ATTENDANCE_STATUS.ABSENT:
      return ATTENDANCE_STATUS.EXCUSED;

    default:
      return ATTENDANCE_STATUS.PRESENT;
  }
}

// export async function initializeAttendances(
//     schedule,
//     lessonDate
// ) {
//     lesson,
//     attendances,
// }
