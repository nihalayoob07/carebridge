// Set a new password after following the reset link.
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { homeFor, useAuth } from "@/lib/auth";
import { C, F } from "@/lib/theme";
import { Button, Card, Input, Screen, T, alertMsg } from "@/components/ui";

export default function ResetPassword() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const { session, profile, refresh } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(!!params.error_description);

  useEffect(() => {
    if (Platform.OS !== "web" && params.code) {
      supabase.auth.exchangeCodeForSession(params.code).then(({ error }) => error && setExpired(true));
    }
    const t = setTimeout(() => supabase.auth.getSession().then(({ data }) => !data.session && setExpired(true)), 6000);
    return () => clearTimeout(t);
  }, []);

  const save = async () => {
    if (pw.length < 8) return alertMsg("Use at least 8 characters");
    if (pw !== pw2) return alertMsg("The passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return alertMsg("Couldn't update your password", `${error.message}. Request a new reset link and try again.`);
    await refresh();
    alertMsg("Password updated", "You're signed in.");
    router.replace((profile ? homeFor(profile.role) : "/login") as any);
  };

  return (
    <Screen>
      <View style={{ marginTop: 48, width: "100%", maxWidth: 460, alignSelf: "center", gap: 20 }}>
        <T style={{ fontFamily: F.display, fontSize: 48, lineHeight: 50, color: C.sage, textTransform: "uppercase" }}>New password</T>
        {expired && !session ? (
          <Card style={{ gap: 12 }}>
            <T v="strong">This reset link has expired or was already used.</T>
            <Button title="Request a New Link" onPress={() => router.replace("/login?forgot=1")} />
          </Card>
        ) : (
          <Card style={{ gap: 14 }}>
            <T v="small" style={{ color: C.ink }}>Choose a new password for your CareBridge account.</T>
            <Input label="New password" value={pw} onChangeText={setPw} secureTextEntry autoComplete="new-password" placeholder="At least 8 characters…" />
            <Input label="Confirm password" value={pw2} onChangeText={setPw2} secureTextEntry autoComplete="new-password" placeholder="Type it again…" />
            <Button title="Save Password" loading={busy} disabled={!session} onPress={save} />
            {!session ? <T v="small">Checking your reset link…</T> : null}
          </Card>
        )}
      </View>
    </Screen>
  );
}
