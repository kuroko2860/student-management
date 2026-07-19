import { supabase } from "@/lib/supabase";

export async function getClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  return data;
}

export async function getClass(id) {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function createClass(classData) {
  const { error } = await supabase.from("classes").insert(classData);

  if (error) throw error;
}

export async function updateClass(id, classData) {
  const { error } = await supabase
    .from("classes")
    .update(classData)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteClass(id) {
  const { error } = await supabase.from("classes").delete().eq("id", id);

  if (error) throw error;
}
