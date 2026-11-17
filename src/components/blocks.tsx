// Larger shared pieces: caregiver card, notifications feed, QR health card, role tab bar, back header.
import { router, Tabs } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase, type Caregiver, type Patient } from "@/lib/supabase";
import { ago, age, inr } from "@/lib/format";
import { C, CAREGIVER_TYPES, F } from "@/lib/theme";
import { Icon, type IconName } from "./icon";
import { Avatar, Badge, Card, Chips, Empty, Reveal, Row, Stars, T } from "./ui";

export const webBase = () =>
  process.env.EXPO_PUBLIC_SITE_URL ?? (typeof window !== "undefined" && window.location ? window.location.origin : "https://carebridge.vercel.app");

export function BackHeader({ title, right }: { title?: string; right?: ReactNode }) {
  return (
    <Row style={{ justifyContent: "space-between", marginBottom: 16 }}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={12}
        accessibilityRole="button" accessibilityLabel="Go back"
        style={(st: any) => [{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 999, paddingRight: 14, paddingLeft: 4, paddingVertical: 4 },
          st.hovered && { backgroundColor: "rgba(43,54,40,0.05)" }]}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(43,54,40,0.07)", alignItems: "center", justifyContent: "center" }}>
          <Icon name="arrow-left" size={16} color={C.ink} weight="regular" />
        </View>
        <T v="strong" style={{ fontSize: 15 }}>{title ?? "Back"}</T>
      </Pressable>
      {right}
    </Row>
  );
}

export function CaregiverCard({ c, reason, score, onPress }: { c: Caregiver & { name?: string }; reason?: string; score?: number | null; onPress?: () => void }) {
  const name = c.name ?? c.profiles?.name ?? "Caregiver";
  return (
    <Reveal>
      <Card onPress={onPress ?? (() => router.push(`/caregiver/${c.id}`))} label={`${name}, ${CAREGIVER_TYPES[c.type]}`} style={{ gap: 12 }}>
        <Row style={{ alignItems: "flex-start" }}>
          <Avatar name={name} />
          <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
            <Row gap={6}>
              <T v="strong" numberOfLines={1} style={{ flexShrink: 1 }}>{name}</T>
              {c.verified ? <Icon name="shield" size={16} color={C.ok} weight="fill" /> : null}
            </Row>
            <T v="small" numberOfLines={1}>{CAREGIVER_TYPES[c.type]}, {c.years_exp} yrs in {c.city}</T>
            <Row gap={12} style={{ flexWrap: "wrap" }}>
              <Stars value={c.rating_avg} count={c.rating_count} />
              <T v="small" style={{ color: C.ink, fontVariant: ["tabular-nums"] }}>{inr(c.hourly_rate)}/hr</T>
            </Row>
          </View>
          {score != null ? (
            <View style={{ alignItems: "center", minWidth: 48 }}>
              <T style={{ fontFamily: F.display, fontSize: 30, lineHeight: 32, color: C.sage }}>{score}</T>
              <T v="small" style={{ fontSize: 11 }}>match</T>
            </View>
          ) : null}
        </Row>
        {reason ? (
          <Row gap={10} style={{ backgroundColor: C.paper, borderRadius: 16, padding: 12, alignItems: "flex-start" }}>
            <Icon name="sparkle" size={16} color={C.sage} weight="fill" />
            <T v="small" style={{ flex: 1, color: C.ink }}>{reason}</T>
          </Row>
        ) : null}
        <Chips>{c.skills.slice(0, 4).map((sk) => <Badge key={sk} label={sk} />)}</Chips>
      </Card>
    </Reveal>
  );
}

type Note = { id: number; title: string; body: string | null; link: string | null; read: boolean; created_at: string };

export function NotificationsFeed({ userId, limit = 6, onEvent }: { userId: string; limit?: number; onEvent?: () => void }) {
  const [items, setItems] = useState<Note[] | null>(null);
  useEffect(() => {
    const load = () => supabase.from("notifications").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(limit).then(({ data }) => setItems((data as Note[]) ?? []));
    load();
    const ch = supabase.channel(`notes-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => { load(); onEvent?.(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  if (!items) return <View style={{ height: 120, borderRadius: 26, backgroundColor: C.bgDeep }} />;
  if (!items.length) return <Empty icon="bell" text="Updates about visits, bookings and records will appear here." />;
  return (
    <Card style={{ paddingVertical: 6 }}>
      <View accessibilityLiveRegion="polite">
        {items.map((n, i) => (
          <Row key={n.id} style={{ paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderColor: "rgba(43,54,40,0.08)", alignItems: "flex-start" }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: i === 0 ? C.deep : "rgba(43,54,40,0.06)", alignItems: "center", justifyContent: "center" }}>
              <Icon name={noteIcon(n.title)} size={16} color={i === 0 ? C.paper : C.ink} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="strong" style={{ fontSize: 15 }}>{n.title}</T>
              {n.body ? <T v="small">{n.body}</T> : null}
            </View>
            <T v="small" style={{ fontSize: 12 }}>{ago(n.created_at)}</T>
          </Row>
        ))}
      </View>
    </Card>
  );
}

const noteIcon = (t: string): IconName =>
  /checked in/i.test(t) ? "pin" : /checked out|report/i.test(t) ? "file" : /AI/.test(t) ? "sparkle"
    : /cancel/i.test(t) ? "x-circle" : /verif/i.test(t) ? "shield" : /booking|care/i.test(t) ? "calendar" : "bell";

export function HealthIdCard({ p, compact }: { p: Pick<Patient, "name" | "dob" | "blood_group" | "health_id" | "health_token" | "allergies">; compact?: boolean }) {
  const url = `${webBase()}/h/${p.health_token}`;
  return (
    <View style={{ borderRadius: 34, padding: 6, backgroundColor: "rgba(62,90,59,0.18)", width: "100%", maxWidth: 400 }}>
      <View accessibilityLabel={`Health ID card for ${p.name}`}
        style={{ backgroundColor: C.deep, borderRadius: 28, padding: 22, gap: 16, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)" } as any}>
        <Row style={{ justifyContent: "space-between" }}>
          <Row gap={8}>
            <Icon name="medkit" size={18} color={C.bg} />
            <Text style={{ fontFamily: F.medium, fontSize: 11, letterSpacing: 2.2, color: C.bg, textTransform: "uppercase" }}>CareBridge Health ID</Text>
          </Row>
          <Text style={{ fontFamily: F.display, color: C.bg, fontSize: 18 }}>{p.blood_group ?? ""}</Text>
        </Row>
        <Row style={{ alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
            <Text style={{ fontFamily: F.display, color: C.bg, fontSize: compact ? 26 : 32, lineHeight: compact ? 30 : 36, textTransform: "uppercase" }}>{p.name}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 13, color: "#C9D3B4" }}>{age(p.dob) ? `${age(p.dob)} yrs, ` : ""}{p.health_id}</Text>
            {p.allergies?.length ? (
              <View style={{ marginTop: 10, alignSelf: "flex-start", backgroundColor: "rgba(232,201,160,0.16)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ fontFamily: F.medium, fontSize: 10, letterSpacing: 1.8, color: "#EBCB9F", textTransform: "uppercase" }}>Allergies</Text>
                <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.paper }}>{p.allergies.join(", ")}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ backgroundColor: C.paper, padding: 9, borderRadius: 16 }}>
            <QRCode value={url} size={compact ? 84 : 108} color={C.ink} backgroundColor={C.paper} />
          </View>
        </Row>
        {!compact ? <Text style={{ fontFamily: F.regular, fontSize: 12.5, color: "#C9D3B4" }}>Scan in an emergency to see allergies, medicines and contacts.</Text> : null}
      </View>
    </View>
  );
}

type TabDef = { name: string; title: string; icon: IconName };
export function RoleTabs({ tabs }: { tabs: TabDef[] }) {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.deep,
        tabBarInactiveTintColor: "#6F7968",
        // Height grows with the home-indicator inset so labels never clip.
        tabBarStyle: { backgroundColor: C.paper, borderTopColor: "rgba(43,54,40,0.08)", height: 72 + insets.bottom, paddingTop: 8, paddingBottom: 12 + insets.bottom },
        tabBarLabelStyle: { fontFamily: F.medium, fontSize: 12, lineHeight: 16, marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen key={t.name} name={t.name}
          options={{ title: t.title, tabBarIcon: ({ color, focused }) => <Icon name={t.icon} color={color as string} size={23} weight={focused ? "fill" : "light"} /> }} />
      ))}
    </Tabs>
  );
}

export function SignOut() {
  return (
    <Pressable onPress={async () => { await supabase.auth.signOut(); router.replace("/login"); }} hitSlop={10}
      accessibilityRole="button" accessibilityLabel="Sign out"
      style={(st: any) => [{ borderWidth: 1, borderColor: st.hovered ? C.ink : "rgba(43,54,40,0.3)", borderRadius: 999, paddingLeft: 14, paddingRight: 6, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 8 }]}>
      <T v="small" color={C.ink} style={{ fontFamily: F.medium }}>Sign Out</T>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(43,54,40,0.07)", alignItems: "center", justifyContent: "center" }}>
        <Icon name="sign-out" size={14} color={C.ink} weight="regular" />
      </View>
    </Pressable>
  );
}
