import { createClient } from "@supabase/supabase-js";

const URL  = import.meta.env.VITE_SUPABASE_URL;
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;
const UID_KEY = "ppl_uid";

// Returns null if env vars not set yet
export const supabase = (URL && KEY && !URL.startsWith("your_"))
  ? createClient(URL, KEY)
  : null;

export function getDeviceId() {
  let id = localStorage.getItem(UID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(UID_KEY, id);
  }
  return id;
}

export function setDeviceId(newId) {
  localStorage.setItem(UID_KEY, newId.trim());
}

// Load remote data. Returns { workout, nutrition } or null on failure.
export async function remoteLoad() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("ppl_data")
      .select("workout, nutrition")
      .eq("id", getDeviceId())
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// Upsert current state to Supabase.
export async function remoteSave(workout, nutrition) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("ppl_data")
      .upsert({ id: getDeviceId(), workout, nutrition, updated_at: new Date().toISOString() });
    return !error;
  } catch {
    return false;
  }
}
