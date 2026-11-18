// Sign in / sign up: Google, or email + password (with password reset).
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { supabase } from "@/lib/supabase";
import { homeFor, useAuth } from "@/lib/auth";
import { savePending, sendPasswordReset, signInWithGoogle } from "@/lib/auth-actions";
import { C, CITIES, F, R } from "@/lib/theme";
import { Avatar, Button, Card, Check, Eyebrow, Input, Row, Screen, Segmented, T, alertMsg } from "@/components/ui";
import { Logo } from "@/components/logo";

// Seeded demo accounts (see supabase/seed.sql).
const DEMO_PASSWORD = "carebridge123";
const DEMOS = [
  { email: "anita@carebridge.demo", who: "Anita, daughter in Dubai", role: "Family" },
  { email: "rahul@carebridge.demo", who: "Rahul, son in Bengaluru", role: "Family" },
  { email: "meera@carebridge.demo", who: "Meera, nurse in Kochi", role: "Caregiver" },
  { email: "arjun@carebridge.demo", who: "Arjun, physio in Bengaluru", role: "Caregiver" },
  { email: "admin@carebridge.demo", who: "Platform admin", role: "Admin" },
];

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function Login() {
  const { session, profile } = useAuth();
  const params = useLocalSearchParams<{ forgot?: string }>();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [forgot, setForgot] = useState(params.forgot === "1");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"family" | "caregiver">("family");
  const [city, setCity] = useState("Kochi");
  const [busy, setBusy] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (session && profile) return <Redirect href={homeFor(profile.role) as any} />;

  const up = mode === "up";
  // DPDP Act: explicit, informed consent before creating an account that will hold health data.
  const needConsent = () => {
    if (up && !agree) { alertMsg("Please accept the Terms and Privacy Policy", "Tick the consent box to create your account."); return true; }
    if (up && !name.trim()) { alertMsg("Enter your full name"); return true; }
    return false;
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e: any) { alertMsg("Something went wrong", `${e?.message ?? e}. Please try again.`); }
    setBusy(null);
  };

  const signIn = (em: string, pw: string) => run(em, async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: em.trim(), password: pw });
    if (error) alertMsg("Couldn't sign in", error.message === "Invalid login credentials" ? "That email and password don't match. Try again, or reset your password." : error.message);
  });

  const signUpPassword = () => {
    if (needConsent()) return;
    if (!emailOk(email) || password.length < 8) return alertMsg("Enter a valid email and a password of at least 8 characters");
    return run("up", async () => {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name, role, city } } });
      if (error) return alertMsg("Couldn't create your account", error.message);
      if (!data.session) setNotice(`We sent a confirmation link to ${email.trim()}. Open it to finish creating your account.`);
    });
  };

  const google = () => {
    if (needConsent()) return;
    return run("google", async () => {
      if (up) await savePending({ role, city });
      await signInWithGoogle();
    });
  };

  const reset = () => {
    if (!emailOk(email)) return alertMsg("Enter the email you signed up with");
    return run("reset", async () => {
      const { error } = await sendPasswordReset(email);
      if (error) return alertMsg("Couldn't send the reset email", error.message);
      setNotice(`If an account exists for ${email.trim()}, a reset link is on its way. It expires in an hour.`);
      setForgot(false);
    });
  };

  return (
    <Screen>
      <Row style={{ justifyContent: "space-between" }}>
        <Logo height={26} href="/" />
        <Button title="Home" variant="ghost" small icon={null} onPress={() => router.replace("/")} />
      </Row>
      {/* One centred column: heading, form, then the demo accounts. */}
      <View style={{ alignItems: "center", width: "100%" }}>
      <View style={{ width: "100%", maxWidth: 520 }}>
      <View style={{ marginTop: 24, marginBottom: 24 }}>
        <T v="display" style={{ fontSize: 56, lineHeight: 56 }}>{forgot ? "Reset password" : up ? "Join CareBridge" : "Welcome back"}</T>
        <T v="small" style={{ fontSize: 16, marginTop: 8 }}>Elder care for the people who raised you.</T>
      </View>

      {notice ? (
        <Card variant="ticket" tone="paper" accent={C.ok} style={{ marginBottom: 16, gap: 6 }}>
          <T v="strong">Check your inbox</T>
          <T v="small" style={{ color: C.ink }}>{notice}</T>
        </Card>
      ) : null}

      <View>
        {forgot ? (
          <Card style={{ gap: 14 }}>
            <T v="small" style={{ color: C.ink }}>Enter your email and we'll send you a link to choose a new password.</T>
            <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" inputMode="email" placeholder="you@example.com" />
            <Button title="Send Reset Link" style={{ alignSelf: "stretch" }} icon="arrow-right" loading={busy === "reset"} onPress={reset} />
            <Button title="Back to Sign In" variant="ghost" icon={null} onPress={() => setForgot(false)} />
          </Card>
        ) : (
          <Card style={{ gap: 14 }}>
            {up ? (
              <>
                <Input label="Full name" value={name} onChangeText={setName} autoComplete="name" placeholder="Anita Menon" />
                <View style={{ gap: 6 }}>
                  <T v="small" style={{ fontFamily: F.semi, color: C.ink }}>I am a</T>
                  <Segmented label="Account type" value={role} onChange={setRole}
                    options={[{ value: "family", label: "Family member", icon: "home" }, { value: "caregiver", label: "Caregiver / nurse", icon: "stethoscope" }]} />
                </View>
                <View style={{ gap: 6 }}>
                  <T v="small" style={{ fontFamily: F.semi, color: C.ink }}>City</T>
                  <Segmented label="City" value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c, label: c }))} />
                </View>
                <Check checked={agree} onChange={setAgree}>
                  <T v="small" style={{ color: C.ink }}>
                    I agree to the <LegalLink href="/terms">Terms of Service</LegalLink> and{" "}
                    <LegalLink href="/privacy">Privacy Policy</LegalLink>, and consent to CareBridge processing the personal and health information I add, including about a relative I am entitled to act for, for the purposes described there.
                  </T>
                </Check>
              </>
            ) : null}

            <GoogleButton loading={busy === "google"} onPress={google} />

            <Row gap={12}>
              <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
              <T v="small">or with email</T>
              <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
            </Row>

            <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email"
              keyboardType="email-address" inputMode="email" placeholder="you@example.com" />

              <View style={{ gap: 6 }}>
                <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={up ? "new-password" : "current-password"}
                  placeholder={up ? "At least 8 characters…" : "Your password…"} onSubmitEditing={() => (up ? signUpPassword() : signIn(email, password))} />
                {!up ? (
                  <Pressable onPress={() => setForgot(true)} accessibilityRole="button" style={{ alignSelf: "flex-end", paddingVertical: 4 }}>
                    <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.deep, textDecorationLine: "underline" }}>Forgot password?</Text>
                  </Pressable>
                ) : null}
              </View>
              <Button title={up ? "Create Account" : "Sign In"} style={{ alignSelf: "stretch" }} loading={busy === email || busy === "up"}
                onPress={() => (up ? signUpPassword() : signIn(email, password))} />

            {!up ? (
              <T v="small" style={{ fontSize: 13 }}>
                By continuing you agree to the <LegalLink href="/terms">Terms</LegalLink> and <LegalLink href="/privacy">Privacy Policy</LegalLink>.
              </T>
            ) : null}

            <Button title={up ? "Have an account? Sign in" : "New here? Create an account"} variant="ghost" icon={null} style={{ alignSelf: "center" }}
              onPress={() => { setMode(up ? "in" : "up"); setNotice(null); }} />
          </Card>
        )}
      </View>
      </View>

      <View style={{ width: "100%", maxWidth: 520, marginTop: 32, gap: 12 }}>
        <Eyebrow>One-tap demo accounts</Eyebrow>
        {DEMOS.map((d) => (
          <Card key={d.email} variant="ticket" tone="paper" accent={d.role === "Family" ? C.sage : d.role === "Caregiver" ? C.deep : C.warn}
            onPress={() => signIn(d.email, DEMO_PASSWORD)} label={`Sign in as ${d.who}`} style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Avatar name={d.who.split(",")[0]!} size={40} />
              <View style={{ flex: 1 }}>
                <T v="strong">{d.who}</T>
                <T v="small">{d.email}</T>
              </View>
              <T v="label" color={C.sage}>{busy === d.email ? "…" : d.role}</T>
            </Row>
          </Card>
        ))}
      </View>
      </View>

      <Row gap={18} style={{ marginTop: 36, justifyContent: "center", flexWrap: "wrap" }}>
        <LegalLink href="/privacy">Privacy Policy</LegalLink>
        <LegalLink href="/terms">Terms of Service</LegalLink>
      </Row>
    </Screen>
  );
}

/** Google's branded button: white surface, official multicolour "G". */
function GoogleButton({ onPress, loading }: { onPress: () => void; loading?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={loading} accessibilityRole="button" accessibilityLabel="Continue with Google"
      style={(st: any) => [{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 52, borderRadius: R.pill,
        backgroundColor: "#fff", borderWidth: 1, borderColor: st.hovered ? C.lineStrong : C.line, opacity: loading ? 0.6 : 1,
        transform: [{ scale: st.pressed ? 0.98 : 1 }], boxShadow: st.hovered ? "0 8px 20px -12px rgba(23,33,19,0.35)" : "0 1px 2px rgba(23,33,19,0.08)" } as any]}>
      <Svg width={20} height={20} viewBox="0 0 48 48" accessibilityElementsHidden>
        <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </Svg>
      <Text style={{ fontFamily: F.medium, fontSize: 16, color: "#1f1f1f" }}>{loading ? "Opening Google…" : "Continue with Google"}</Text>
    </Pressable>
  );
}

function LegalLink({ href, children }: { href: "/privacy" | "/terms"; children: string }) {
  return (
    <T v="small" style={{ color: C.deep, fontFamily: F.semi, textDecorationLine: "underline" }}>
      <Text accessibilityRole="link" onPress={() => router.push(href)}>{children}</Text>
    </T>
  );
}
