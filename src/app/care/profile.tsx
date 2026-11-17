// Caregiver professional profile editor. Verification fields are admin-only (column grants in the DB).
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { supabase, type Caregiver } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { CAREGIVER_TYPES, CITIES, LANGUAGES, SKILLS } from "@/lib/theme";
import { Badge, Button, Card, Chip, Chips, Header, Input, Loading, Row, Screen, Section, T, alertMsg, Segmented } from "@/components/ui";
import { SignOut } from "@/components/blocks";

export default function CareProfile() {
  const { profile } = useAuth();
  const [c, setC] = useState<Caregiver | null>(null);
  const [cert, setCert] = useState({ name: "", issuer: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("caregivers").select("*").eq("id", profile!.id).single().then(({ data }) => setC(data as Caregiver));
  }, [profile]);
  if (!c) return <Loading />;

  const toggle = (k: "skills" | "languages", v: string) =>
    setC({ ...c, [k]: c[k].includes(v) ? c[k].filter((x) => x !== v) : [...c[k], v] });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("caregivers").update({
      type: c.type, bio: c.bio, years_exp: +c.years_exp || 0, hourly_rate: +c.hourly_rate || 0, daily_rate: +c.daily_rate || 0,
      languages: c.languages, skills: c.skills, certifications: c.certifications, city: c.city,
    }).eq("id", c.id);
    setSaving(false);
    alertMsg(error ? "Couldn't save your profile" : "Profile saved", error ? `${error.message}. Check your connection and try again.` : undefined);
  };

  return (
    <Screen>
      <Header title={profile!.name} right={<SignOut />} />
      <Row gap={8} style={{ flexWrap: "wrap", marginTop: 4 }}>
        {c.verified ? <Badge label="Verified" tone="ok" icon="shield" /> : <Badge label="Verification pending" tone="warn" />}
        <Badge label={`Background ${c.bg_check}`} tone={c.bg_check === "cleared" ? "ok" : "warn"} />
        <Button small variant="ghost" title="Public View" icon="eye" onPress={() => router.push(`/caregiver/${c.id}`)} />
      </Row>

      <Section title="Role">
        <Segmented label="Role" value={c.type} onChange={(k) => setC({ ...c, type: k })} options={Object.entries(CAREGIVER_TYPES).map(([k, v]) => ({ value: k, label: v }))} />
      </Section>
      <Section title="City">
        <Segmented label="City" value={c.city} onChange={(x) => setC({ ...c, city: x })} options={CITIES.map((x) => ({ value: x, label: x }))} />
      </Section>
      <Section title="About you">
        <Input label="Bio" value={c.bio ?? ""} onChangeText={(bio) => setC({ ...c, bio })} multiline placeholder="Hospitals you've worked at, what families love about you…" />
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <Input label="Years" value={String(c.years_exp)} onChangeText={(v) => setC({ ...c, years_exp: +v || 0 })} keyboardType="numeric" inputMode="numeric" style={{ width: 90 }} />
          <Input label="₹ per hour" value={String(c.hourly_rate)} onChangeText={(v) => setC({ ...c, hourly_rate: +v || 0 })} keyboardType="numeric" inputMode="numeric" style={{ width: 120 }} />
          <Input label="₹ per day" value={String(c.daily_rate)} onChangeText={(v) => setC({ ...c, daily_rate: +v || 0 })} keyboardType="numeric" inputMode="numeric" style={{ width: 120 }} />
        </View>
      </Section>
      <Section title="Specialisations">
        <Chips>{SKILLS.map((s) => <Chip key={s} label={s} active={c.skills.includes(s)} onPress={() => toggle("skills", s)} />)}</Chips>
      </Section>
      <Section title="Languages">
        <Chips>{LANGUAGES.map((l) => <Chip key={l} label={l} active={c.languages.includes(l)} onPress={() => toggle("languages", l)} />)}</Chips>
      </Section>
      <Section title="Qualifications">
        {c.certifications.map((q, i) => (
          <Card key={i} style={{ paddingVertical: 10 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1, minWidth: 0 }}><T v="strong">{q.name}</T><T v="small">{q.issuer}</T></View>
              <Button small variant="ghost" title="" label={`Remove ${q.name}`} icon="trash"
                onPress={() => setC({ ...c, certifications: c.certifications.filter((_, j) => j !== i) })} />
            </Row>
          </Card>
        ))}
        <Card tone="paper" style={{ gap: 10 }}>
          <Input label="Qualification" value={cert.name} onChangeText={(name) => setCert({ ...cert, name })} placeholder="GNM Nursing…" />
          <Input label="Issued by" value={cert.issuer} onChangeText={(issuer) => setCert({ ...cert, issuer })} placeholder="Kerala Nursing Council…" />
          <Button small variant="outline" title="Add Qualification" icon="add" onPress={() => {
            if (!cert.name.trim()) return alertMsg("Enter the qualification name first");
            setC({ ...c, certifications: [...c.certifications, cert] }); setCert({ name: "", issuer: "" });
          }} />
        </Card>
      </Section>
      <Button title="Save Profile" style={{ marginTop: 28 }} loading={saving} onPress={save} />
    </Screen>
  );
}
