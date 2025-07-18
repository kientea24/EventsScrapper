import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper functions for future image storage
export const uploadImage = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) throw error;
  return data;
};

export const getImageUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
};

// Helper functions for future event storage (commented out until events table is created)
// export const insertEvent = async (event: any) => {
//   const { data, error } = await supabase.from("events").insert(event).select();
//
//   if (error) throw error;
//   return data;
// };
//
// export const getEvents = async () => {
//   const { data, error } = await supabase
//     .from("events")
//     .select("*")
//     .order("created_at", { ascending: false });
//
//   if (error) throw error;
//   return data;
// };
//
// export const updateEvent = async (id: string, updates: any) => {
//   const { data, error } = await supabase
//     .from("events")
//     .update(updates)
//     .eq("id", id)
//     .select();
//
//   if (error) throw error;
//   return data;
// };
//
// export const deleteEvent = async (id: string) => {
//   const { error } = await supabase.from("events").delete().eq("id", id);
//
//   if (error) throw error;
// };
