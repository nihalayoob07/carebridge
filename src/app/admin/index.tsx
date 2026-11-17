// Admin insights: platform totals and de-identified aggregates (the research-data layer).
import { useEffect, useState } from "react";
import { View } from "react-native";
import { supabase } from "@/lib/supabase";
import { inr, cap } from "@/lib/format";
import { C, F } from "@/lib/theme";
import { Card, Header, Loading, Reveal, Row, Screen, Section, T } from "@/components/ui";
import { SignOut } from "@/components/blocks";

type Stats = {
  families: number; caregivers: number; verified: number; pending_verification: number; patients: number;
  bookings: number; revenue_inr: number; visits: number; documents_processed: number;
  by_city: Record<string, number>; top_conditions: { condition: string; patients: number }[]; age_bands: Record<string, number>;
};

export default function Insights() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { supabase.rpc("platform_stats").then(({ data }) => setS(data as Stats)); }, []);
  if (!s) return <Loading rows={4} />;

  const tiles: [string, string][] = [
    ["Families", String(s.families)], ["Patients", String(s.patients)], ["Caregivers", `${s.verified}/${s.caregivers}`],
    ["Bookings", String(s.bookings)], ["Visits logged", String(s.visits)], ["Revenue", inr(s.revenue_inr)],
  ];
  const maxCity = Math.max(...Object.values(s.by_city), 1);
  const maxCond = Math.max(...s.top_conditions.map((c) => c.patients), 1);

  return (
    <Screen>
      <Header eyebrow="Admin" title="Platform insights" right={<SignOut />} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
        {tiles.map(([k, v], i) => (
          <Reveal key={k} delay={i * 50} style={{ flexGrow: 1, flexBasis: 150 }}>
            <Card tone={i === 0 ? "deep" : "card"}>
              <T style={{ fontFamily: F.display, fontSize: 38, lineHeight: 42, color: i === 0 ? C.paper : C.deep, fontVariant: ["tabular-nums"] }}>{v}</T>
              <T v="small" color={i === 0 ? "#C9D3B4" : C.muted}>{k}</T>
            </Card>
          </Reveal>
        ))}
      </View>

      <Section title="Caregivers by city">
        <Card style={{ gap: 12 }}>
          {Object.entries(s.by_city).sort((a, b) => b[1] - a[1]).map(([city, n]) => (
            <Row key={city}>
              <T style={{ width: 96 }}>{city}</T>
              <View style={{ flex: 1, height: 10, borderRadius: 5 }}>
                <View style={{ width: `${(n / maxCity) * 100}%`, height: 10, borderRadius: 5, backgroundColor: C.sage }} />
              </View>
              <T v="strong" style={{ width: 32, textAlign: "right", fontVariant: ["tabular-nums"] }}>{n}</T>
            </Row>
          ))}
        </Card>
      </Section>

      <Section title="Research view: common conditions">
        <T v="small">De-identified counts only. No names, IDs or documents leave the platform.</T>
        <Card style={{ gap: 12 }}>
          {s.top_conditions.map((c) => (
            <Row key={c.condition}>
              <T style={{ flex: 1 }} numberOfLines={1}>{cap(c.condition)}</T>
              <View style={{ width: 120, height: 10 }}>
                <View style={{ width: `${(c.patients / maxCond) * 100}%`, height: 10, borderRadius: 5, backgroundColor: C.deep }} />
              </View>
              <T v="strong" style={{ width: 28, textAlign: "right", fontVariant: ["tabular-nums"] }}>{c.patients}</T>
            </Row>
          ))}
        </Card>
        <Row gap={10} style={{ flexWrap: "wrap" }}>
          {Object.entries(s.age_bands).sort().map(([band, n]) => (
            <Card key={band} tone="paper" style={{ alignItems: "center", minWidth: 96 }}>
              <T style={{ fontFamily: F.display, fontSize: 28, color: C.sage }}>{n}</T>
              <T v="small">aged {band}</T>
            </Card>
          ))}
        </Row>
      </Section>

      <Section title="Pipeline">
        <Card>
          <Row style={{ justifyContent: "space-between" }}><T>Awaiting verification</T><T v="strong">{s.pending_verification}</T></Row>
          <Row style={{ justifyContent: "space-between", marginTop: 10 }}><T>Documents read by AI</T><T v="strong">{s.documents_processed}</T></Row>
        </Card>
      </Section>
    </Screen>
  );
}
