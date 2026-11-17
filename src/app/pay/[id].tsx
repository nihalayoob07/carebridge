// Razorpay Payment Link in the browser, then confirm. Demo mode when no Razorpay keys are configured.
import { Icon } from "@/components/icon";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { fn, supabase, type Booking } from "@/lib/supabase";
import { day, inr } from "@/lib/format";
import { C, F } from "@/lib/theme";
import { Button, Card, KV, Loading, Screen, T, alertMsg } from "@/components/ui";
import { BackHeader } from "@/components/blocks";

export default function Pay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [b, setB] = useState<Booking | null>(null);
  const [demo, setDemo] = useState(false);
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    supabase.from("bookings").select("*, patients(name), caregivers(type, profiles(name))").eq("id", id).single()
      .then(({ data }) => { setB(data as Booking); setPaid(data?.payment_status === "paid"); });
  }, [id]);

  if (!b) return <Loading />;

  const open = async () => {
    setBusy(true);
    try {
      const r = await fn<{ url?: string; demo?: boolean; paid?: boolean }>("payment", { action: "create", booking_id: b.id });
      if (r.paid) setPaid(true);
      else if (r.demo) setDemo(true);
      else if (r.url) { setOpened(true); await WebBrowser.openBrowserAsync(r.url); }
    } catch (e: any) { alertMsg("Payment error", e.message); }
    setBusy(false);
  };

  const check = async () => {
    setBusy(true);
    try {
      const r = await fn<{ paid: boolean }>("payment", { action: "check", booking_id: b.id });
      if (r.paid) setPaid(true); else alertMsg("Not paid yet", "Finish the payment in the Razorpay window, then tap again.");
    } catch (e: any) { alertMsg("Payment error", e.message); }
    setBusy(false);
  };

  if (paid) {
    return (
      <Screen>
        <View style={{ alignItems: "center", gap: 16, marginTop: 60 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={56} color={C.bg} />
          </View>
          <T v="display" style={{ textAlign: "center" }}>Booked</T>
          <T style={{ textAlign: "center" }}>{b.caregivers?.profiles.name} will care for {b.patients?.name} from {day(b.start_at)}.
            They can now see {b.patients?.name.split(" ")[0]}'s care summary. You can change access anytime from the patient profile.</T>
          <Button title="Go to Dashboard" style={{ alignSelf: "center" }} onPress={() => router.replace("/family")} />
          <Button title="Sharing Settings" style={{ alignSelf: "center" }} variant="outline" icon="lock" onPress={() => router.replace(`/patient/${b.patient_id}?tab=sharing`)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackHeader title="Payment" />
      <Card style={{ gap: 4, backgroundColor: C.paper }}>
        <KV k="Caregiver" v={b.caregivers?.profiles.name} />
        <KV k="Patient" v={b.patients?.name} />
        <KV k="Dates" v={`${day(b.start_at)} to ${day(b.end_at)}`} />
        <KV k="Plan" v={`${b.units} × ${b.plan}`} />
        <T style={{ fontFamily: F.display, fontSize: 48, color: C.deep, marginTop: 8 }}>{inr(b.amount_inr)}</T>
        <T v="small">UPI, cards and netbanking via Razorpay</T>
      </Card>

      {demo ? (
        <Card style={{ marginTop: 16, gap: 10, borderColor: C.warn }}>
          <T v="strong">Demo payment mode</T>
          <T v="small">Razorpay test keys aren't configured on this server, so payment is simulated.</T>
          <Button title={`Simulate UPI payment of ${inr(b.amount_inr)}`} icon="phone" loading={busy} onPress={check} />
        </Card>
      ) : (
        <View style={{ gap: 12, marginTop: 16 }}>
          <Button title={opened ? "Open payment page again" : "Pay with Razorpay"} icon="card" variant={opened ? "outline" : "solid"} loading={busy && !opened} onPress={open} />
          {opened ? <Button title="Confirm Payment" icon="check" loading={busy} onPress={check} /> : null}
          <T v="small" style={{ textAlign: "center" }}>Test mode: use UPI ID success@razorpay or card 4111 1111 1111 1111.</T>
        </View>
      )}
    </Screen>
  );
}
