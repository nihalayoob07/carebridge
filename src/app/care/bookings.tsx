import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { supabase, type Booking } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { day, inr, time } from "@/lib/format";
import { C } from "@/lib/theme";
import { Badge, Button, Card, Chip, Chips, Empty, Header, Row, Screen, T, alertMsg, confirmMsg, Segmented, Grid } from "@/components/ui";

const TONE: Record<string, "ok" | "warn" | "danger" | "sage"> = { confirmed: "ok", pending: "warn", cancelled: "danger", completed: "sage" };
const RAIL: Record<string, string> = { confirmed: C.ok, pending: C.warn, cancelled: C.danger, completed: C.sage };

export default function CareBookings() {
  const { profile } = useAuth();
  const [list, setList] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() =>
    supabase.from("bookings").select("*, patients(name)").eq("caregiver_id", profile!.id).order("start_at", { ascending: false })
      .then(({ data }) => setList((data as Booking[]) ?? [])), [profile]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, s: string) => {
    if (!(await confirmMsg(s === "completed" ? "Mark care as completed?" : "Cancel this booking?", "The family will be notified."))) return;
    const { error } = await supabase.rpc("set_booking_status", { bid: id, new_status: s });
    if (error) alertMsg("That change isn't allowed", `${error.message}. Refresh and try again.`); else load();
  };

  const earned = list.filter((b) => b.payment_status === "paid" && b.status !== "cancelled").reduce((a, b) => a + b.amount_inr, 0);
  const shown = list.filter((b) => filter === "all" || b.status === filter);

  return (
    <Screen>
      <Header eyebrow={`Earned ${inr(earned)}`} title="Bookings" />
      <Segmented label="Filter" value={filter} onChange={setFilter} options={["all", "pending", "confirmed", "completed", "cancelled"].map((s) => ({ value: s, label: s[0]!.toUpperCase() + s.slice(1) }))} />
      <Grid min={400} style={{ marginTop: 20 }}>
        {shown.map((b) => (
          <Card key={b.id} variant="ticket" tone="paper" accent={RAIL[b.status]} style={{ gap: 10 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <T v="strong">{b.patients?.name ?? (b as any).patient_label ?? "Patient"}</T>
              <Badge label={b.status} tone={TONE[b.status]} />
            </Row>
            <T v="small">{day(b.start_at)}, {time(b.start_at)} to {day(b.end_at)}. {b.units} × {b.plan}, {inr(b.amount_inr)}</T>
            {b.status === "confirmed" ? (
              <Row style={{ flexWrap: "wrap" }}>
                <Button small title="Visit" icon="pin" onPress={() => router.push(`/visit/${b.id}`)} />
                <Button small variant="outline" title="Complete" icon="checks" onPress={() => setStatus(b.id, "completed")} />
                <Button small variant="ghost" title="Cancel" icon="close" onPress={() => setStatus(b.id, "cancelled")} />
              </Row>
            ) : b.status === "pending" ? (
              <Button small variant="ghost" title="Decline" icon="close" onPress={() => setStatus(b.id, "cancelled")} />
            ) : null}
          </Card>
        ))}
        {!shown.length ? <Empty icon="calendar" text="No bookings in this view." /> : null}
      </Grid>
    </Screen>
  );
}
