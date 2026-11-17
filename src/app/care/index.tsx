// Caregiver "Today": active assignments, quick check-in, upcoming requests, updates.
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { supabase, type Booking, type Caregiver } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { day, inr, time } from "@/lib/format";
import { C } from "@/lib/theme";
import { Avatar, Badge, Button, Card, Empty, Header, Reveal, Row, Screen, Section, T } from "@/components/ui";
import { NotificationsFeed, SignOut } from "@/components/blocks";

type B = Booking & {
  // null until the family pays: RLS hides the record, so fall back to the label stored on the booking.
  patients: { name: string; city: string; address: string | null; needs: string[] } | null;
  patient_label: string | null; patient_city: string | null;
  visits: { id: string; check_out_at: string | null; check_in_at: string }[];
};

const who = (b: B) => b.patients?.name ?? b.patient_label ?? "Patient";

export default function Today() {
  const { profile } = useAuth();
  const [me, setMe] = useState<Caregiver | null>(null);
  const [active, setActive] = useState<B[] | null>(null);
  const [upcoming, setUpcoming] = useState<B[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [c, b] = await Promise.all([
      supabase.from("caregivers").select("*").eq("id", profile!.id).single(),
      supabase.from("bookings").select("*, patients(name, city, address, needs), visits(id, check_in_at, check_out_at)")
        .eq("caregiver_id", profile!.id).in("status", ["confirmed", "pending"]).order("start_at"),
    ]);
    setMe(c.data as Caregiver);
    const all = (b.data as B[]) ?? [];
    const soon = Date.now() + 864e5;
    setActive(all.filter((x) => x.status === "confirmed" && new Date(x.start_at).getTime() <= soon));
    setUpcoming(all.filter((x) => x.status === "pending" || new Date(x.start_at).getTime() > soon));
  }, [profile]);
  useEffect(() => { load(); }, [load]);

  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <Screen onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} refreshing={refreshing}>
      <Header eyebrow={today} title={`Hi, ${profile?.name.split(" ")[0]}`} right={<SignOut />} />

      {me && !me.verified ? (
        <Card tone="alert" style={{ gap: 8, marginTop: 8 }}>
          <T v="strong">Verification pending</T>
          <T v="small" style={{ color: C.ink }}>Add your qualifications. An admin verifies you before families can find you.</T>
          <Button small title="Complete Profile" onPress={() => router.push("/care/profile")} />
        </Card>
      ) : null}

      <Section title="Today's care">
        {active === null ? <View style={{ height: 140, borderRadius: 26, backgroundColor: C.bgDeep }} /> : active.length ? active.map((b, i) => {
          const open = b.visits.find((v) => !v.check_out_at);
          const doneToday = b.visits.some((v) => v.check_out_at && new Date(v.check_in_at).toDateString() === new Date().toDateString());
          return (
            <Reveal key={b.id} delay={i * 80}>
              <Card tone={open ? "deep" : "card"} style={{ gap: 14 }}>
                <Row>
                  <Avatar name={who(b)} size={50} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T v="strong" color={open ? C.paper : C.ink}>{who(b)}</T>
                    <T v="small" color={open ? "#C9D3B4" : C.muted} numberOfLines={1}>{b.patients?.address ?? b.patients?.city ?? b.patient_city}</T>
                  </View>
                  {open ? <Badge label={`In since ${time(open.check_in_at)}`} tone="ok" /> : doneToday ? <Badge label="Done today" tone="sage" /> : null}
                </Row>
                <Row style={{ flexWrap: "wrap" }}>
                  <Button small title={open ? "Continue Visit" : "Start Visit"} icon={open ? "edit" : "pin"}
                    variant={open ? "outline" : "solid"} style={open ? { borderColor: "rgba(247,248,238,0.4)" } : undefined}
                    onPress={() => router.push(`/visit/${b.id}`)} />
                  {!open ? <Button small variant="ghost" title="Patient Info" icon="file" onPress={() => router.push(`/patient/${b.patient_id}`)} /> : null}
                </Row>
              </Card>
            </Reveal>
          );
        }) : <Empty icon="sun" text="No visits scheduled today. New bookings show up here." />}
      </Section>

      <Section title="Upcoming and requests">
        {upcoming.length ? upcoming.map((b) => (
          <Card key={b.id} style={{ gap: 6 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <T v="strong">{who(b)}</T>
              <Badge label={b.status === "pending" ? "Awaiting payment" : "Confirmed"} tone={b.status === "pending" ? "warn" : "ok"} />
            </Row>
            <T v="small">{day(b.start_at)}, {time(b.start_at)}. {b.units} × {b.plan}, {inr(b.amount_inr)}</T>
            {b.notes ? <T v="small" style={{ color: C.ink }}>“{b.notes}”</T> : null}
            {!b.patients ? <T v="small">Care details are shared with you once the family confirms and pays.</T> : null}
          </Card>
        )) : <Empty icon="calendar" text="Nothing upcoming yet." />}
      </Section>

      <Section title="Updates">{profile ? <NotificationsFeed userId={profile.id} onEvent={load} /> : null}</Section>
    </Screen>
  );
}
