// Caregiver visit: GPS check-in, task checklist, vitals, mood, notes, check-out. Family sees it live.
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { supabase, type Patient, type Visit } from "@/lib/supabase";
import { time } from "@/lib/format";
import { C, F } from "@/lib/theme";
import { Badge, Button, Card, Chip, Chips, Input, Loading, Row, Screen, Section, T, alertMsg, confirmMsg, Empty } from "@/components/ui";
import { BackHeader } from "@/components/blocks";
import { Icon } from "@/components/icon";
import { VisitReport } from "@/components/visit-report";

const MOODS = ["Cheerful", "Calm", "Tired", "Anxious", "Confused", "In pain"];

/** Starting checklist from the patient's medicines and care needs. */
function defaultTasks(p: Patient) {
  const t = p.medications.slice(0, 4).map((m) => `Give ${m.name}${m.dose ? ` ${m.dose}` : ""}`);
  const needs: Record<string, string> = {
    "diabetes management": "Check blood sugar", "hypertension monitoring": "Check blood pressure",
    physiotherapy: "Physio exercises", "mobility assistance": "Assisted walk", "dementia care": "Memory activity and conversation",
    "post-operative care": "Check wound / dressing", "fall prevention": "Clear walkways, check footwear",
    "respiratory care": "Inhaler and breathing exercises", "parkinsons care": "Medicine on time, gait practice",
    "elderly companionship": "Conversation and outdoor time", "personal hygiene": "Bath and grooming", "meal preparation": "Prepare meals and fluids",
  };
  p.needs.forEach((n) => needs[n] && t.push(needs[n]!));
  t.push("Meals and fluids");
  return [...new Set(t)].map((label) => ({ label, done: false }));
}

async function getCoords() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch { return null; }
}

export default function VisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [open, setOpen] = useState<Visit | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");

  const load = useCallback(async () => {
    const { data: b } = await supabase.from("bookings").select("patient_id, status").eq("id", id).single();
    if (!b) return;
    const [{ data: p }, { data: v }] = await Promise.all([
      supabase.from("patients").select("*").eq("id", b.patient_id).maybeSingle(),
      supabase.from("visits").select("*").eq("booking_id", id).order("check_in_at", { ascending: false }),
    ]);
    setPatient((p as Patient) ?? null);
    const list = (v as Visit[]) ?? [];
    setVisits(list.filter((x) => x.check_out_at));
    setOpen(list.find((x) => !x.check_out_at) ?? null);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (patient === undefined) return <Loading />;
  if (patient === null) {
    return (
      <Screen>
        <BackHeader title="Visit" />
        <Empty icon="lock" text="You no longer have access to this patient. The family may have changed sharing settings." />
      </Screen>
    );
  }

  const checkIn = async () => {
    setBusy("in");
    const c = await getCoords();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("visits").insert({
      booking_id: id, caregiver_id: user!.id, in_lat: c?.lat ?? null, in_lng: c?.lng ?? null, tasks: defaultTasks(patient),
    }).select().single();
    setBusy(null);
    if (error) return alertMsg("Couldn't check in", `${error.message}. Make sure the booking is confirmed.`);
    setOpen(data as Visit);
  };

  const save = async (patch: Partial<Visit>) => {
    if (!open) return;
    const next = { ...open, ...patch };
    setOpen(next);
    await supabase.from("visits").update(patch).eq("id", open.id);
  };

  const checkOut = async () => {
    if (!open) return;
    if (!open.mood || !open.notes) {
      const go = await confirmMsg("Report looks incomplete", "Add a mood and a short note so the family knows how the day went. Check out anyway?");
      if (!go) return;
    }
    setBusy("out");
    const c = await getCoords();
    await supabase.from("visits").update({ check_out_at: new Date().toISOString(), out_lat: c?.lat ?? null, out_lng: c?.lng ?? null }).eq("id", open.id);
    setBusy(null);
    alertMsg("Checked out", "The family has your daily report.");
    load();
  };

  const vital = (k: string) => (v: string) => save({ vitals: { ...open!.vitals, [k]: v } });

  return (
    <Screen>
      <BackHeader title={patient.name} right={open ? <Badge label={`Checked in ${time(open.check_in_at)}`} tone="ok" icon="pin" /> : null} />

      <Card tone="deep" style={{ gap: 10 }}>
        <Row gap={8}><Icon name="sparkle" size={16} color={C.bg} weight="fill" /><T v="label" color={C.bg}>Care summary</T></Row>
        <T color={C.paper} style={{ fontSize: 16, lineHeight: 24 }}>{patient.ai_summary ?? `${patient.name}. Conditions: ${patient.conditions.join(", ") || "none recorded"}.`}</T>
        {patient.allergies.length ? <Badge label={`Allergies: ${patient.allergies.join(", ")}`} tone="danger" icon="warning" /> : null}
        <Button small variant="outline" title="Full Profile" icon="file" style={{ borderColor: "rgba(247,248,238,0.4)" }}
          onPress={() => router.push(`/patient/${patient.id}`)} />
      </Card>

      {!open ? (
        <View style={{ marginTop: 28, alignItems: "center", gap: 14 }}>
          <Pressable onPress={checkIn} disabled={!!busy} accessibilityRole="button" accessibilityLabel="Check in"
            style={(st: any) => ({ width: 190, height: 190, borderRadius: 95, backgroundColor: C.deep, alignItems: "center", justifyContent: "center", gap: 8,
              transform: [{ scale: st.pressed ? 0.97 : 1 }], boxShadow: "0 30px 60px -30px rgba(62,90,59,0.7)" } as any)}>
            <Icon name="pin" size={42} color={C.bg} />
            <T style={{ fontFamily: F.display, fontSize: 28, color: C.paper }}>{busy === "in" ? "LOCATING…" : "CHECK IN"}</T>
          </Pressable>
          <T v="small" style={{ textAlign: "center", maxWidth: 300 }}>Your location is saved with the check-in so the family knows you arrived.</T>
        </View>
      ) : (
        <>
          <Section title="Tasks">
            <Card style={{ paddingVertical: 4 }}>
              {open.tasks.map((t, i) => (
                <Pressable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: t.done }}
                  onPress={() => save({ tasks: open.tasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderColor: "rgba(43,54,40,0.08)", minHeight: 48 }}>
                  <Icon name={t.done ? "check-circle" : "circle"} size={24} color={t.done ? C.ok : C.muted} weight={t.done ? "fill" : "light"} />
                  <T style={{ flex: 1, textDecorationLine: t.done ? "line-through" : "none", color: t.done ? C.muted : C.ink }}>{t.label}</T>
                </Pressable>
              ))}
            </Card>
            <Row style={{ alignItems: "flex-end" }}>
              <View style={{ flex: 1 }}><Input label="Add a task" value={newTask} onChangeText={setNewTask} placeholder="Evening walk…" /></View>
              <Button small title="Add" icon="add" onPress={() => { if (newTask.trim()) { save({ tasks: [...open.tasks, { label: newTask.trim(), done: false }] }); setNewTask(""); } }} />
            </Row>
          </Section>

          <Section title="Vitals">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {[["bp", "BP", "120/80"], ["sugar_fasting", "Sugar mg/dL", "110"], ["pulse", "Pulse", "72"], ["temp_c", "Temp °C", "36.8"]].map(([k, l, ph]) => (
                <View key={k} style={{ width: 140 }}>
                  <Input label={l} defaultValue={String(open.vitals?.[k!] ?? "")} onEndEditing={(e) => vital(k!)(e.nativeEvent.text)}
                    onBlur={(e: any) => vital(k!)(e?.target?.value ?? e?.nativeEvent?.text ?? "")} placeholder={`${ph}…`} inputMode="decimal" />
                </View>
              ))}
            </View>
          </Section>

          <Section title="Mood">
            <Chips>{MOODS.map((m) => <Chip key={m} label={m} active={open.mood === m} onPress={() => save({ mood: m })} />)}</Chips>
          </Section>

          <Section title="Notes for the family">
            <Input label="How was the day?" defaultValue={open.notes ?? ""} multiline placeholder="Ate well, walked in the garden…"
              onEndEditing={(e) => save({ notes: e.nativeEvent.text })} onBlur={(e: any) => save({ notes: e?.target?.value ?? e?.nativeEvent?.text ?? open.notes })} />
          </Section>

          <Button title="Check Out and Send Report" icon="sign-out" style={{ marginTop: 28, alignSelf: "stretch" }} loading={busy === "out"} onPress={checkOut} />
        </>
      )}

      {visits.length ? (
        <Section title="Previous reports">
          {visits.slice(0, 5).map((v) => <VisitReport key={v.id} v={v} />)}
        </Section>
      ) : null}
    </Screen>
  );
}
