// Book a caregiver: patient, plan, duration, start date → booking row → payment.
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { supabase, type Caregiver, type Patient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { day, endDate, inr, PLAN_UNIT, price } from "@/lib/format";
import { C, F } from "@/lib/theme";
import { Button, Card, Chip, Chips, Input, KV, Loading, Row, Screen, Section, T, alertMsg, Segmented } from "@/components/ui";
import { BackHeader } from "@/components/blocks";

const nextDays = () => Array.from({ length: 10 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i + 1); d.setHours(0, 0, 0, 0); return d;
});

export default function Book() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [c, setC] = useState<Caregiver | null>(null);
  const [workdays, setWorkdays] = useState<number[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [plan, setPlan] = useState("daily");
  const [units, setUnits] = useState(1);
  const [date, setDate] = useState<Date>(nextDays()[0]!);
  const [hour, setHour] = useState(9);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("caregivers").select("*, profiles(name)").eq("id", id).single().then(({ data }) => setC(data as Caregiver));
    supabase.from("availability").select("weekday").eq("caregiver_id", id).then(({ data }) => setWorkdays((data ?? []).map((a) => a.weekday)));
    supabase.from("patients").select("*").eq("family_id", profile!.id).then(({ data }) => {
      setPatients((data as Patient[]) ?? []); if (data?.[0]) setPatientId(data[0].id);
    });
  }, [id, profile]);

  const start = useMemo(() => { const d = new Date(date); d.setHours(hour); return d.toISOString(); }, [date, hour]);
  const total = c ? price(plan, units, c.hourly_rate, c.daily_rate) : 0;

  if (!c) return <Loading />;

  const confirm = async () => {
    if (!patientId) return alertMsg("Add a patient profile first");
    setSaving(true);
    const { data, error } = await supabase.from("bookings").insert({
      patient_id: patientId, caregiver_id: c.id, family_id: profile!.id, plan, units,
      start_at: start, end_at: endDate(start, plan, units), notes: notes || null, amount_inr: total,
    }).select().single();
    setSaving(false);
    if (error) return alertMsg("Couldn't book", error.message);
    router.replace(`/pay/${data.id}`);
  };

  return (
    <Screen>
      <BackHeader title={`Book ${c.profiles?.name}`} />

      <Section title="Who needs care?">
        {patients.length ? <Segmented label="Patient" value={patientId} onChange={setPatientId} options={patients.map((p) => ({ value: p.id, label: p.name }))} />
          : <Button title="Add a patient first" variant="outline" onPress={() => router.push("/family/patients")} />}
      </Section>

      <Section title="Plan">
        <Segmented label="Plan" value={plan} onChange={(p) => { setPlan(p); setUnits(p === "hourly" ? 4 : 1); }}
          options={[{ value: "hourly", label: "Hourly", icon: "clock" }, { value: "daily", label: "Daily", icon: "sun" }, { value: "weekly", label: "Weekly", icon: "calendar" }, { value: "monthly", label: "Monthly", icon: "calendar" }]} />
        <Row>
          <Button small variant="outline" title="−" label="Fewer" icon={null} style={{ alignSelf: "center" }} onPress={() => setUnits(Math.max(1, units - 1))} />
          <T style={{ fontFamily: F.display, fontSize: 32, color: C.deep, minWidth: 50, textAlign: "center" }}>{units}</T>
          <Button small variant="outline" title="+" label="More" icon={null} style={{ alignSelf: "center" }} onPress={() => setUnits(units + 1)} />
          <T v="strong">{PLAN_UNIT[plan]!.label}</T>
        </Row>
      </Section>

      <Section title="Start">
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          {nextDays().map((d) => {
            const works = workdays.includes(d.getDay());
            const active = d.toDateString() === date.toDateString();
            return (
              <Chip key={d.toISOString()} label={`${d.toLocaleDateString("en-IN", { weekday: "short" })} ${d.getDate()}${works ? "" : " ·off"}`}
                active={active} onPress={() => (works ? setDate(d) : alertMsg(`${c.profiles?.name} doesn't usually work on this day`))} />
            );
          })}
        </Row>
        <Chips>{[7, 8, 9, 10, 14, 18, 20].map((h) => <Chip key={h} label={`${h > 12 ? h - 12 : h}:00 ${h >= 12 ? "pm" : "am"}`} active={hour === h} onPress={() => setHour(h)} />)}</Chips>
      </Section>

      <Section title="Notes for the caregiver">
        <Input value={notes} onChangeText={setNotes} placeholder="Please check sugar before lunch…" multiline />
      </Section>

      <Card style={{ marginTop: 24, gap: 4, backgroundColor: C.paper }}>
        <KV k="Caregiver" v={c.profiles?.name} />
        <KV k="Starts" v={`${day(start)}, ${new Date(start).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`} />
        <KV k="Ends" v={day(endDate(start, plan, units))} />
        <KV k="Plan" v={`${units} × ${plan}`} />
        {plan === "weekly" || plan === "monthly" ? <KV k="Discount" v={plan === "weekly" ? "10%" : "20%"} /> : null}
        <View style={{ height: 1, backgroundColor: C.line, marginVertical: 8 }} />
        <Row style={{ justifyContent: "space-between" }}>
          <T v="h3">Total</T>
          <T style={{ fontFamily: F.display, fontSize: 32, color: C.deep }}>{inr(total)}</T>
        </Row>
      </Card>
      <Button title="Continue to payment" icon="lock" style={{ marginTop: 16 }} loading={saving} onPress={confirm} />
    </Screen>
  );
}
