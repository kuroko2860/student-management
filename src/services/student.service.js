import { supabase } from "@/lib/supabase";

export async function getStudents() {
  const { data, error } = await supabase
    .from("students")
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
    .order("name");

  if (error) throw error;

  return data;
}

export async function getStudent(id) {
  const { data, error } = await supabase
    .from("students")
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

export async function createStudent(student) {
  const { error } = await supabase.from("students").insert(student);

  if (error) throw error;
}

export async function updateStudent(id, student) {
  const { error } = await supabase
    .from("students")
    .update(student)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteStudent(id) {
  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) throw error;
}

export async function getClassOptions() {
  const { data, error } = await supabase
    .from("classes")
    .select("id,name")
    .order("name");

  if (error) throw error;

  return data;
}

export async function getStudentsByClass(classId) {
  const { data, error } = await supabase
    .from("students")
    .select(
      `
            id,
            name
        `,
    )
    .eq("class_id", classId)
    .order("name");

  if (error) throw error;

  return data;
}
