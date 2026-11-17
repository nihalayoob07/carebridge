import { Icon } from "@/components/icon";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { supabase, type Caregiver } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { day, inr } from "@/lib/format";
import { C, CAREGIVER_TYPES, F } from "@/lib/theme";
import { Avatar, Badge, Button, Card, Chips, Empty, Loading, Row, Screen, Section, Stars, T } from "@/components/ui";
import { BackHeader } from "@/components/blocks";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type Review = { id: string; author_name: string; rating: number; comment: string; created_at: string };

export default function CaregiverProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [c, setC] = useState<Caregiver | null>(null);
  const [avail, setAvail] = useState<{ weekday: number; start_time: string; end_time: string }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    supabase.from("caregivers").select("*, profiles(name, phone)").eq("id", id).single().then(({ data }) => setC(data as Caregiver));
    supabase.from("availability").select("*").eq("caregiver_id", id).order("weekday").then(({ data }) => setAvail(data ?? []));
    supabase.from("reviews").select("*").eq("caregiver_id", id).order("created_at", { ascending: false }).then(({ data }) => setReviews((data as Review[]) ?? []));
  }, [id]);

  if (!c) return <Loading />;
  const name = c.profiles?.name ?? "Caregiver";

  return (
    <Screen>
      <BackHeader />
      <Row style={{ alignItems: "flex-start", gap: 16 }}>
        <Avatar name={name} size={84} />
        <View style={{ flex: 1, gap: 4 }}>
          <T v="h1">{name}</T>
          <T v="small">{CAREGIVER_TYPES[c.type]} in {c.city}, {c.years_exp} years experience</T>
          <Row gap={8} style={{ flexWrap: "wrap" }}>
            <Stars value={c.rating_avg} count={c.rating_count} />
            {c.verified ? <Badge label="Verified" tone="ok" icon="shield" /> : <Badge label="Verification pending" tone="warn" />}
            {c.bg_check === "cleared" ? <Badge label="Background checked" tone="ok" icon="fingerprint" /> : null}
          </Row>
        </View>
      </Row>

      <Card style={{ marginTop: 20, flexDirection: "row", justifyContent: "space-around", backgroundColor: C.paper }}>
        {[["Per hour", inr(c.hourly_rate)], ["Per day", inr(c.daily_rate)], ["Weekly", "10% off"], ["Monthly", "20% off"]].map(([k, v]) => (
          <View key={k} style={{ alignItems: "center" }}>
            <T style={{ fontFamily: F.display, fontSize: 24, color: C.deep }}>{v}</T>
            <T v="small">{k}</T>
          </View>
        ))}
      </Card>

      {profile?.role === "family" ? (
        <Button title="Book this caregiver" style={{ marginTop: 16 }} onPress={() => router.push(`/book/${c.id}`)} />
      ) : null}

      <Section title="About">
        <T>{c.bio}</T>
      </Section>
      <Section title="Specialisations">
        <Chips>{c.skills.map((s) => <Badge key={s} label={s} tone="sage" />)}</Chips>
      </Section>
      <Section title="Languages">
        <Chips>{c.languages.map((l) => <Badge key={l} label={l} />)}</Chips>
      </Section>
      <Section title="Qualifications">
        {c.certifications.map((q) => (
          <Row key={q.name} gap={10}>
            <Icon name="certificate" size={20} color={C.sage} />
            <View><T v="strong">{q.name}</T><T v="small">{q.issuer}</T></View>
          </Row>
        ))}
      </Section>
      <Section title="Weekly availability">
        <Row gap={6} style={{ flexWrap: "wrap" }}>
          {DAYS.map((d, i) => {
            const a = avail.find((x) => x.weekday === i);
            return (
              <View key={d} style={{ alignItems: "center", padding: 10, borderRadius: 14, minWidth: 64, backgroundColor: a ? C.deep : C.bgDeep }}>
                <T v="strong" color={a ? C.paper : C.muted} style={{ fontSize: 14 }}>{d}</T>
                <T v="small" color={a ? "#C9D3B4" : C.muted} style={{ fontSize: 11 }}>{a ? `${a.start_time.slice(0, 5)}-${a.end_time.slice(0, 5)}` : "off"}</T>
              </View>
            );
          })}
        </Row>
      </Section>
      <Section title={`Reviews (${reviews.length})`}>
        {reviews.length ? reviews.map((r) => (
          <Card key={r.id} style={{ gap: 6 }}>
            <Row style={{ justifyContent: "space-between" }}><T v="strong">{r.author_name}</T><Stars value={r.rating} /></Row>
            <T>{r.comment}</T>
            <T v="small">{day(r.created_at)}</T>
          </Card>
        )) : <Empty icon="star" text="No reviews yet." />}
      </Section>
    </Screen>
  );
}
