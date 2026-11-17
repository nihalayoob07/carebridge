// Sign-in helpers: Google OAuth, email one-time codes and password reset (all PKCE).
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();
const web = Platform.OS === "web";

/** Absolute URL the auth provider should send people back to (https on web, carebridge:// in the app). */
export const redirectTo = (path: string) => (web ? `${window.location.origin}${path}` : Linking.createURL(path));

type Pending = { role: "family" | "caregiver"; city: string };
const KEY = "cb_pending_signup";
/** Remember the role/city chosen before a Google sign-up so the callback can apply it. */
export const savePending = (p: Pending) => AsyncStorage.setItem(KEY, JSON.stringify(p));
export async function takePending(): Promise<Pending | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) await AsyncStorage.removeItem(KEY);
  try { return raw ? (JSON.parse(raw) as Pending) : null; } catch { return null; }
}

export async function signInWithGoogle() {
  const to = redirectTo("/auth/callback");
  if (web) {
    // Full-page redirect to Google; supabase-js finishes the PKCE exchange when we land back.
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: to } });
    if (error) throw error;
    return;
  }
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: to, skipBrowserRedirect: true } });
  if (error) throw error;
  const res = await WebBrowser.openAuthSessionAsync(data.url, to);
  if (res.type !== "success") return;
  const code = new URL(res.url).searchParams.get("code");
  if (code) {
    const { error: e } = await supabase.auth.exchangeCodeForSession(code);
    if (e) throw e;
  }
}

/** Email a one-time code. For sign-ups, `meta` creates the account with name/role/city. */
export function sendEmailCode(email: string, meta?: { name: string; role: string; city: string }) {
  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: !!meta, data: meta, emailRedirectTo: redirectTo("/auth/callback") },
  });
}

export function verifyEmailCode(email: string, token: string) {
  return supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: "email" });
}

export function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo("/reset") });
}
