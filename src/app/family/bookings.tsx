import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { supabase, type Booking } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { day, inr, time } from "@/lib/format";
import { C } from "@/lib/theme";
import { Badge, Button, Card, Chip, Chips, Empty, Header, Input, Row, Screen, T, alertMsg, confirmMsg } from "@/components/ui";

const TONE: Record<string, "ok" | "warn" | "danger" | "neutral" | "sage"> = { confirmed: "ok", pending: "warn", cancelled: "danger", completed: "sage" };

export default function Bookings() {
  const { profile } = useAuth();
  const [list, setList] = useState<(Booking & { reviews: { id: string } | { id: string }[] | null })[]>([]);
  // reviews.booking_id is unique, so PostgREST embeds a single object (or null), not an array.
  const hasReview = (b: { reviews: unknown }) => (Array.isArray(b.reviews) ? b.reviews.length > 0 : !!b.reviews);
  const [filter, setFilter] = useState("all");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const load = useCallback(() =>
    supabase.from("bookings").select("*, patients(name), caregivers(type, profiles(name)), reviews(id)")
      .eq("family_id", profile!.id).order("start_at", { ascending: false })
      .then(({ data }) => setList((data as any) ?? [])), [profile]);
  useEffect(() => { load(); }, [load]);

  const cancel = async (id: string) => {
    if (!(await confirmMsg("Cancel booking?", "The caregiver will be notified."))) return;
    const { error } = await supabase.rpc("set_booking_status", { bid: id, new_status: "cancelled" });
    if (error) alertMsg("Couldn't cancel", error.message); else load();
  };

  const submitReview = async (b: Booking) => {
    const { error } = await supabase.from("reviews").insert({
      booking_id: b.id, caregiver_id: b.caregiver_id, author_id: profile!.id,
      author_name: profile!.name.split(" ")[0] + " " + (profile!.name.split(" ")[1]?.[0] ?? "") + ".", rating, comment,
    });
    if (error) return alertMsg("Couldn't save review", error.code === "23505" ? "You have already reviewed this booking." : `${error.message}. Try again in a moment.`);
    setReviewing(null); setComment(""); load();
  };

  const shown = list.filter((b) => filter === "all" || b.status === filter);

  return (
    <Screen>
      <Header eyebrow="Scheduling" title="Bookings" />
      <Chips>{["all", "pending", "confirmed", "completed", "cancelled"].map((s) => <Chip key={s} label={s} active={filter === s} onPress={() => setFilter(s)} />)}</Chips>
      <View style={{ gap: 12, marginTop: 16 }}>
        {shown.length ? shown.map((b) => (
          <Card key={b.id} style={{ gap: 10 }}>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <T v="strong">{b.caregivers?.profiles.name} for {b.patients?.name}</T>
                <T v="small">{day(b.start_at)} {time(b.start_at)} → {day(b.end_at)} · {b.units} × {b.plan}</T>
              </View>
              <Badge label={b.status} tone={TONE[b.status]} />
            </Row>
            <Row style={{ justifyContent: "space-between" }}>
              <T v="h3">{inr(b.amount_inr)}</T>
              <Badge label={b.payment_status} tone={b.payment_status === "paid" ? "ok" : "warn"} icon={b.payment_status === "paid" ? "check" : "clock"} />
            </Row>
            <Row style={{ flexWrap: "wrap" }}>
              {b.status === "pending" && b.payment_status === "unpaid" ? <Button small title="Pay now" icon="card" onPress={() => router.push(`/pay/${b.id}`)} /> : null}
              {["pending", "confirmed"].includes(b.status) ? <Button small variant="outline" title="Cancel" icon="close" onPress={() => cancel(b.id)} /> : null}
              {["confirmed", "completed"].includes(b.status) && !hasReview(b) ? <Button small variant="outline" title="Review" icon="star" onPress={() => setReviewing(b.id)} /> : null}
              <Button small variant="ghost" title="Caregiver" onPress={() => router.push(`/caregiver/${b.caregiver_id}`)} />
            </Row>
            {reviewing === b.id ? (
              <View style={{ gap: 10, backgroundColor: C.paper, padding: 12, borderRadius: 14 }}>
                <Chips>{[1, 2, 3, 4, 5].map((n) => <Chip key={n} label={"★".repeat(n)} active={rating === n} onPress={() => setRating(n)} />)}</Chips>
                <Input value={comment} onChangeText={setComment} placeholder="How was the care?" multiline />
                <Button small title="Submit review" onPress={() => submitReview(b)} />
              </View>
            ) : null}
          </Card>
        )) : <Empty icon="calendar" text="No bookings here." />}
      </View>
    </Screen>
  );
}
