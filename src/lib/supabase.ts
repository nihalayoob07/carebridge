import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

export const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_KEY!, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage, // web uses localStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Call an edge function; throws with the server's error message. */
export async function fn<T = any>(name: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let msg = error.message;
    try { msg = (await (error as any).context.json()).error ?? msg; } catch {}
    throw new Error(msg);
  }
  return data as T;
}

export type Role = "family" | "caregiver" | "admin";
export type Profile = { id: string; role: Role; name: string; phone: string | null; city: string | null };
export type Med = { name: string; dose?: string; frequency?: string };
export type Patient = {
  id: string; family_id: string; name: string; dob: string | null; gender: string | null; blood_group: string | null;
  city: string | null; address: string | null; allergies: string[]; conditions: string[]; medications: Med[];
  needs: string[]; emergency_contact: { name?: string; relation?: string; phone?: string }; ai_summary: string | null;
  health_token: string; health_id: string;
};
export type Caregiver = {
  id: string; type: string; gender: string | null; bio: string | null; years_exp: number; hourly_rate: number; daily_rate: number;
  languages: string[]; skills: string[]; certifications: { name: string; issuer: string }[]; city: string | null;
  verified: boolean; bg_check: string; rating_avg: number; rating_count: number; photo_url: string | null;
  profiles?: { name: string; phone?: string | null };
};
export type Booking = {
  id: string; patient_id: string; caregiver_id: string; family_id: string; plan: string; units: number;
  start_at: string; end_at: string; notes: string | null; status: string; amount_inr: number; payment_status: string;
  patients?: { name: string }; caregivers?: { profiles: { name: string }; type: string };
};
export type Visit = {
  id: string; booking_id: string; caregiver_id: string; check_in_at: string; check_out_at: string | null;
  in_lat: number | null; in_lng: number | null; tasks: { label: string; done: boolean }[];
  vitals: Record<string, string | number>; mood: string | null; notes: string | null;
};
