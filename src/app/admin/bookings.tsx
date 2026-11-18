import { useEffect, useState } from "react";
import { View } from "react-native";
import { supabase, type Booking } from "@/lib/supabase";
import { day, inr } from "@/lib/format";
import { C } from "@/lib/theme";
import { Badge, Card, Empty, Header, Row, Screen, T, Grid } from "@/components/ui";

const TONE: Record<string, "ok" | "warn" | "danger" | "sage"> = { confirmed: "ok", pending: "warn", cancelled: "danger", completed: "sage" };
const RAIL: Record<string, string> = { confirmed: C.ok, pending: C.warn, cancelled: C.danger, completed: C.sage };

export default function AdminBookings() {
  const [list, setList] = useState<(Booking & { profiles: { name: string } })[]>([]);
  useEffect(() => {
    supabase.from("bookings").select("*, patients(name), caregivers(type, profiles(name)), profiles!bookings_family_id_fkey(name)")
      .order("created_at", { ascending: false }).limit(100).then(({ data }) => setList((data as any) ?? []));
  }, []);
  return (
    <Screen>
      <Header title="All bookings" />
      <Grid min={400} style={{ marginTop: 12 }}>
        {list.map((b) => (
          <Card key={b.id} variant="ticket" tone="paper" accent={RAIL[b.status]} style={{ gap: 6 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <T v="strong" style={{ flex: 1 }} numberOfLines={1}>{b.caregivers?.profiles.name} for {b.patients?.name ?? (b as any).patient_label ?? "a patient"}</T>
              <Badge label={b.status} tone={TONE[b.status]} />
            </Row>
            <T v="small">Booked by {b.profiles?.name}. {day(b.start_at)}, {b.units} × {b.plan}</T>
            <Row style={{ justifyContent: "space-between" }}>
              <T v="strong" style={{ fontVariant: ["tabular-nums"] }}>{inr(b.amount_inr)}</T>
              <Badge label={b.payment_status} tone={b.payment_status === "paid" ? "ok" : "warn"} />
            </Row>
          </Card>
        ))}
        {!list.length ? <Empty icon="calendar" text="No bookings yet." /> : null}
      </Grid>
    </Screen>
  );
}
