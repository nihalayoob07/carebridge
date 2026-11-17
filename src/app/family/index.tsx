// Family dashboard: who's with Amma right now, latest reports, updates.
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { supabase, type Booking, type Patient, type Visit } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { age, day, time } from "@/lib/format";
import { C, F } from "@/lib/theme";
import { Avatar, Badge, Button, Card, Empty, Header, Row, Screen, Section, T } from "@/components/ui";
import { NotificationsFeed, SignOut } from "@/components/blocks";
import { VisitReport } from "@/components/visit-report";

type V = Visit & { bookings: Booking & { patients: { name: string }; caregivers: { profiles: { name: string } } } };

export default function FamilyHome() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<V[]>([]);
  const [active, setActive] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [p, v, b] = await Promise.all([
      supabase.from("patients").select("*").eq("family_id", profile!.id).order("created_at"),
      supabase.from("visits").select("*, bookings!inner(*, patients(name), caregivers(profiles(name)))")
        .eq("bookings.family_id", profile!.id).order("check_in_at", { ascending: false }).limit(6),
      supabase.from("bookings").select("*, patients(name), caregivers(type, profiles(name))")
        .eq("family_id", profile!.id).eq("status", "confirmed").order("start_at"),
    ]);
    setPatients((p.data as Patient[]) ?? []);
    setVisits((v.data as V[]) ?? []);
    setActive((b.data as Booking[]) ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const live = visits.filter((v) => !v.check_out_at);
  const reports = visits.filter((v) => v.check_out_at);

  return (
    <Screen onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} refreshing={refreshing}>
      <Header eyebrow="Family dashboard" title={`Hello, ${profile?.name.split(" ")[0]}`} right={<SignOut />} />

      {live.map((v) => (
        <Card key={v.id} style={{ backgroundColor: C.deep, borderColor: C.deep, marginTop: 12, gap: 6 }}>
          <Row gap={8}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#9FE08A" }} /><T v="label" color={C.bg}>Live now</T></Row>
          <T v="h2" color={C.paper}>{v.bookings.caregivers.profiles.name} is with {v.bookings.patients.name.split(" ")[0]}</T>
          <T v="small" color="#C9D3B4">Checked in at {time(v.check_in_at)}{v.in_lat ? " · location verified" : ""}</T>
        </Card>
      ))}

      <Section title="Your family" action={<Button title="Add" small variant="outline" icon="add" onPress={() => router.push("/family/patients")} />}>
        {patients.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {patients.map((p) => (
              <View key={p.id} style={{ flexGrow: 1, flexBasis: 260 }}>
              <Card onPress={() => router.push(`/patient/${p.id}`)} label={`Open ${p.name}'s profile`} style={{ gap: 10 }}>
                <Row>
                  <Avatar name={p.name} size={44} />
                  <View style={{ flex: 1 }}>
                    <T v="strong">{p.name}</T>
                    <T v="small">{age(p.dob)} yrs · {p.city}</T>
                  </View>
                  <T style={{ fontFamily: F.display, color: C.sage, fontSize: 18 }}>{p.blood_group}</T>
                </Row>
                <Row gap={6} style={{ flexWrap: "wrap" }}>{p.conditions.slice(0, 3).map((c) => <Badge key={c} label={c} />)}</Row>
              </Card>
              </View>
            ))}
          </View>
        ) : <Empty text="Add your parent's profile to get started." />}
      </Section>

      <Section title="Active care">
        {active.length ? active.map((b) => (
          <Card key={b.id} onPress={() => router.push("/family/bookings")}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <T v="strong">{b.caregivers?.profiles.name} → {b.patients?.name}</T>
                <T v="small">{day(b.start_at)} to {day(b.end_at)}, {b.plan}</T>
              </View>
              <Badge label="Confirmed" tone="ok" icon="check" />
            </Row>
          </Card>
        )) : <Empty icon="calendar" text="No active bookings. Find a caregiver to begin." />}
      </Section>

      <Section title="Updates">
        {profile ? <NotificationsFeed userId={profile.id} onEvent={load} /> : null}
      </Section>

      <Section title="Daily care reports">
        {reports.length ? reports.slice(0, 3).map((v) => <VisitReport key={v.id} v={v} who={`${v.bookings.caregivers.profiles.name} · ${v.bookings.patients.name}`} />)
          : <Empty icon="file" text="Reports appear here after each visit." />}
      </Section>
    </Screen>
  );
}
