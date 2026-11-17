import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { supabase, type Patient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { age } from "@/lib/format";
import { C, CITIES, F } from "@/lib/theme";
import { Avatar, Badge, Button, Card, Chip, Chips, Empty, Header, Input, Row, Screen, Section, T, alertMsg } from "@/components/ui";

const BLOOD = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function Patients() {
  const { profile } = useAuth();
  const [list, setList] = useState<Patient[]>([]);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", dob: "", gender: "female", blood_group: "B+", city: profile?.city ?? "Kochi", address: "", allergies: "", conditions: "", ec_name: profile?.name ?? "", ec_phone: profile?.phone ?? "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() =>
    supabase.from("patients").select("*").eq("family_id", profile!.id).order("created_at").then(({ data }) => setList((data as Patient[]) ?? [])), [profile]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!f.name.trim()) return alertMsg("Name is required");
    if (f.dob && !/^\d{4}-\d{2}-\d{2}$/.test(f.dob)) return alertMsg("Date of birth must be YYYY-MM-DD");
    setSaving(true);
    const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const { data, error } = await supabase.from("patients").insert({
      family_id: profile!.id, name: f.name.trim(), dob: f.dob || null, gender: f.gender, blood_group: f.blood_group,
      city: f.city, address: f.address || null, allergies: split(f.allergies), conditions: split(f.conditions),
      emergency_contact: { name: f.ec_name, relation: "Family", phone: f.ec_phone },
    }).select().single();
    setSaving(false);
    if (error) return alertMsg("Couldn't save", error.message);
    setAdding(false);
    router.push(`/patient/${data.id}`);
  };

  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  return (
    <Screen>
      <Header eyebrow="Patient profiles" title="Your family" right={!adding ? <Button title="Add" small icon="add" onPress={() => setAdding(true)} /> : null} />

      {adding ? (
        <Card style={{ gap: 12, marginTop: 8 }}>
          <T v="h3">New patient</T>
          <Input label="Full name" value={f.name} onChangeText={set("name")} placeholder="Saraswathi Menon" />
          <Input label="Date of birth (YYYY-MM-DD)" value={f.dob} onChangeText={set("dob")} placeholder="1947-03-12" />
          <T v="label">Gender</T>
          <Chips>{["female", "male", "other"].map((g) => <Chip key={g} label={g} active={f.gender === g} onPress={() => set("gender")(g)} />)}</Chips>
          <T v="label">Blood group</T>
          <Chips>{BLOOD.map((b) => <Chip key={b} label={b} active={f.blood_group === b} onPress={() => set("blood_group")(b)} />)}</Chips>
          <T v="label">City</T>
          <Chips>{CITIES.map((c) => <Chip key={c} label={c} active={f.city === c} onPress={() => set("city")(c)} />)}</Chips>
          <Input label="Address" value={f.address} onChangeText={set("address")} placeholder="House, street, area" />
          <Input label="Known allergies (comma separated)" value={f.allergies} onChangeText={set("allergies")} placeholder="Penicillin, peanuts" />
          <Input label="Conditions (comma separated)" value={f.conditions} onChangeText={set("conditions")} placeholder="Diabetes, hypertension" />
          <T v="small">Not sure of the conditions? Skip them. Upload prescriptions on the next screen and AI fills them in.</T>
          <Input label="Emergency contact name" value={f.ec_name} onChangeText={set("ec_name")} />
          <Input label="Emergency contact phone" value={f.ec_phone} onChangeText={set("ec_phone")} keyboardType="phone-pad" />
          <Row><Button title="Save" loading={saving} onPress={save} style={{ flex: 1 }} /><Button title="Cancel" variant="outline" icon={null} onPress={() => setAdding(false)} /></Row>
        </Card>
      ) : null}

      <Section title={`${list.length} profiles`}>
        {list.length ? list.map((p) => (
          <Card key={p.id} onPress={() => router.push(`/patient/${p.id}`)} style={{ gap: 10 }}>
            <Row>
              <Avatar name={p.name} />
              <View style={{ flex: 1 }}>
                <T v="strong">{p.name}</T>
                <T v="small">{age(p.dob)} yrs, {p.gender}, {p.city}. ID {p.health_id}</T>
              </View>
              <T style={{ fontFamily: F.display, color: C.sage, fontSize: 20 }}>{p.blood_group}</T>
            </Row>
            <Chips>
              {p.allergies.map((a) => <Badge key={a} label={`Allergy: ${a}`} tone="danger" />)}
              {p.conditions.map((c) => <Badge key={c} label={c} />)}
            </Chips>
          </Card>
        )) : !adding ? <Empty text="No patients yet. Add your parent to start." /> : null}
      </Section>
    </Screen>
  );
}
