import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { homeFor, useAuth } from "@/lib/auth";
import { C, CITIES, F } from "@/lib/theme";
import { Button, Card, Check, Input, Row, Screen, T, alertMsg, Eyebrow, Segmented, Avatar } from "@/components/ui";

// Seeded demo accounts (see supabase/seed.sql).
const DEMO_PASSWORD = "carebridge123";
const DEMOS = [
  { email: "anita@carebridge.demo", who: "Anita, daughter in Dubai", role: "Family" },
  { email: "rahul@carebridge.demo", who: "Rahul, son in Bengaluru", role: "Family" },
  { email: "meera@carebridge.demo", who: "Meera, nurse in Kochi", role: "Caregiver" },
  { email: "arjun@carebridge.demo", who: "Arjun, physio in Bengaluru", role: "Caregiver" },
  { email: "admin@carebridge.demo", who: "Platform admin", role: "Admin" },
];

export default function Login() {
  const { session, profile } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"family" | "caregiver">("family");
  const [city, setCity] = useState("Kochi");
  const [busy, setBusy] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);

  if (session && profile) return <Redirect href={homeFor(profile.role) as any} />;

  const signIn = async (em: string, pw: string) => {
    setBusy(em);
    const { error } = await supabase.auth.signInWithPassword({ email: em.trim(), password: pw });
    setBusy(null);
    if (error) alertMsg("Couldn't sign in", error.message);
  };

  const signUp = async () => {
    if (!name || !email || password.length < 6) return alertMsg("Fill in name, email and a 6+ character password");
    // DPDP Act: explicit, informed consent before we process anyone's (health) data.
    if (!agree) return alertMsg("Please accept the Terms and Privacy Policy", "Tick the consent box to create your account.");
    setBusy("up");
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name, role, city } } });
    setBusy(null);
    if (error) return alertMsg("Couldn't sign up", error.message);
    if (!data.session) alertMsg("Check your email", "Confirm your address, then sign in.");
  };

  return (
    <Screen>
      <Row style={{ justifyContent: "space-between" }}>
        <T style={{ fontFamily: F.display, fontSize: 22, color: C.deep, letterSpacing: 1 }} >CAREBRIDGE</T>
        <Button title="Home" variant="ghost" small icon={null} onPress={() => router.replace("/")} />
      </Row>
      <View style={{ marginTop: 24, marginBottom: 24 }}>
        <T v="display" style={{ fontSize: 56, lineHeight: 56 }}>{mode === "in" ? "Welcome back" : "Join CareBridge"}</T>
        <T v="small" style={{ fontSize: 16, marginTop: 8 }}>Elder care for the people who raised you.</T>
      </View>

      <Card style={{ gap: 14 }}>
        {mode === "up" ? (
          <>
            <Input label="Full name" value={name} onChangeText={setName} placeholder="Anita Menon" />
            <View style={{ gap: 6 }}>
              <T v="small" style={{ fontFamily: F.semi, color: C.ink }}>I am a</T>
              <Segmented label="Account type" value={role} onChange={setRole}
                options={[{ value: "family", label: "Family member", icon: "home" }, { value: "caregiver", label: "Caregiver / nurse", icon: "stethoscope" }]} />
            </View>
            <View style={{ gap: 6 }}>
              <T v="small" style={{ fontFamily: F.semi, color: C.ink }}>City</T>
              <Segmented label="City" value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c, label: c }))} />
            </View>
          </>
        ) : null}
        <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        {mode === "up" ? (
          <Check checked={agree} onChange={setAgree}>
            <T v="small" style={{ color: C.ink }}>
              I agree to the <LegalLink href="/terms">Terms of Service</LegalLink> and{" "}
              <LegalLink href="/privacy">Privacy Policy</LegalLink>, and consent to CareBridge processing the personal and health information I add, including about a relative I am entitled to act for, for the purposes described there.
            </T>
          </Check>
        ) : null}
        <Button title={mode === "in" ? "Sign In" : "Create Account"} loading={busy === email || busy === "up"}
          onPress={() => (mode === "in" ? signIn(email, password) : signUp())} />
        <Button title={mode === "in" ? "New here? Create an account" : "Have an account? Sign in"} variant="ghost" icon={null}
          onPress={() => setMode(mode === "in" ? "up" : "in")} />
      </Card>

      <View style={{ marginTop: 28, gap: 12 }}>
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

      <Row gap={18} style={{ marginTop: 36, justifyContent: "center", flexWrap: "wrap" }}>
        <LegalLink href="/privacy">Privacy Policy</LegalLink>
        <LegalLink href="/terms">Terms of Service</LegalLink>
      </Row>
    </Screen>
  );
}

function LegalLink({ href, children }: { href: "/privacy" | "/terms"; children: string }) {
  return (
    <T v="small" style={{ color: C.deep, fontFamily: F.semi, textDecorationLine: "underline" }}>
      <Text accessibilityRole="link" onPress={() => router.push(href)}>{children}</Text>
    </T>
  );
}
