// Where Google sign-in and email links land. Finishes the session, applies a pending role choice,
// then sends the person to their home screen.
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { homeFor, useAuth } from "@/lib/auth";
import { takePending } from "@/lib/auth-actions";
import { C } from "@/lib/theme";
import { Button, Card, Loading, Screen, T } from "@/components/ui";

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const { session, profile, refresh } = useAuth();
  const [error, setError] = useState<string | null>(params.error_description ?? null);
  const [ready, setReady] = useState(false);

  // In the Android app the deep link may arrive here with ?code=; web exchanges it automatically.
  useEffect(() => {
    if (Platform.OS === "web" || !params.code) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) return;
      const { error: e } = await supabase.auth.exchangeCodeForSession(params.code!);
      if (e) setError(e.message);
    });
  }, [params.code]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const pending = await takePending();
      if (pending) {
        await supabase.rpc("finish_signup", { r: pending.role, c: pending.city });
        await refresh();
      }
      setReady(true);
    })();
  }, [session]);

  // If nothing happens within a few seconds the link was probably used or expired.
  useEffect(() => {
    const t = setTimeout(() => { if (!session) setError((e) => e ?? "This sign-in link has expired or was already used."); }, 8000);
    return () => clearTimeout(t);
  }, [session]);

  if (error) {
    return (
      <Screen>
        <View style={{ marginTop: 80, alignItems: "center" }}>
          <Card style={{ gap: 12, maxWidth: 420, alignItems: "center" }}>
            <T v="h2">Couldn't sign you in</T>
            <T v="small" style={{ textAlign: "center", color: C.ink }}>{error}</T>
            <Button title="Back to Sign In" style={{ alignSelf: "center" }} onPress={() => router.replace("/login")} />
          </Card>
        </View>
      </Screen>
    );
  }
  if (ready && profile) return <Redirect href={homeFor(profile.role) as any} />;
  return <Loading />;
}
