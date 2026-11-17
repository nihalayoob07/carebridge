// Caregiver discovery: AI match for a patient, plus filterable search.
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { fn, supabase, type Caregiver, type Patient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { C, CAREGIVER_TYPES, CITIES, LANGUAGES, SKILLS } from "@/lib/theme";
import { Button, Card, Chip, Chips, Empty, Header, Input, Row, Screen, Section, T, alertMsg, Segmented, Grid } from "@/components/ui";
import { CaregiverCard } from "@/components/blocks";

type Match = Caregiver & { name: string; reason: string; score: number | null };

export default function Find() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [forPatient, setForPatient] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [matching, setMatching] = useState(false);

  const [city, setCity] = useState<string | null>(profile?.city ?? null);
  const [type, setType] = useState<string | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [maxRate, setMaxRate] = useState("");
  const [q, setQ] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [results, setResults] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("patients").select("*").eq("family_id", profile!.id).then(({ data }) => {
      setPatients((data as Patient[]) ?? []);
      if (data?.[0]) setForPatient(data[0].id);
    });
  }, [profile]);

  useEffect(() => {
    setLoading(true);
    let query = supabase.from("caregivers").select("*, profiles!inner(name)").order("rating_avg", { ascending: false }).limit(40);
    if (city) query = query.eq("city", city);
    if (type) query = query.eq("type", type);
    if (lang) query = query.contains("languages", [lang]);
    if (skill) query = query.contains("skills", [skill]);
    if (verifiedOnly) query = query.eq("verified", true);
    if (+maxRate > 0) query = query.lte("hourly_rate", +maxRate);
    if (q.trim()) query = query.ilike("profiles.name", `%${q.trim()}%`);
    query.then(({ data }) => { setResults((data as Caregiver[]) ?? []); setLoading(false); });
  }, [city, type, lang, skill, verifiedOnly, maxRate, q]);

  const runMatch = async () => {
    if (!forPatient) return;
    setMatching(true);
    try {
      const r = await fn<{ matches: Match[] }>("match-caregivers", { patient_id: forPatient, max_rate: +maxRate > 0 ? +maxRate : null });
      setMatches(r.matches);
    } catch (e: any) { alertMsg("Matching failed", e.message); }
    setMatching(false);
  };

  return (
    <Screen>
      <Header eyebrow="Caregiver discovery" title="Find care" />

      {patients.length ? (
        <Card style={{ gap: 12, marginTop: 8, backgroundColor: C.paper }}>
          <T v="label">AI match for</T>
          <Segmented label="Patient" value={forPatient} onChange={(id) => { setForPatient(id); setMatches(null); }} options={patients.map((p) => ({ value: p.id, label: p.name }))} />
          <T v="small">Ranks verified caregivers against {patients.find((p) => p.id === forPatient)?.name.split(" ")[0]}'s conditions and care needs from their medical records.</T>
          <Button title="Match with AI" icon="sparkle" loading={matching} onPress={runMatch} />
        </Card>
      ) : null}

      {matches ? (
        <Section title="Best matches" action={<Button title="Clear" small variant="ghost" icon="close" onPress={() => setMatches(null)} />}>
          {matches.length ? <Grid min={380}>{matches.map((m) => <CaregiverCard key={m.id} c={m} reason={m.reason} score={m.score} />)}</Grid>
            : <Empty text="No verified caregivers match in this city yet. Try the search below." />}
        </Section>
      ) : null}

      <Section title="Search">
        <Input value={q} onChangeText={setQ} placeholder="Search by name" />
        <T v="label">City</T>
        <Chips>{CITIES.map((c) => <Chip key={c} label={c} active={city === c} onPress={() => setCity(city === c ? null : c)} />)}</Chips>
        <T v="label">Type</T>
        <Chips>{Object.entries(CAREGIVER_TYPES).map(([k, v]) => <Chip key={k} label={v} active={type === k} onPress={() => setType(type === k ? null : k)} />)}</Chips>
        <T v="label">Speaks</T>
        <Chips>{LANGUAGES.slice(0, 6).map((l) => <Chip key={l} label={l} active={lang === l} onPress={() => setLang(lang === l ? null : l)} />)}</Chips>
        <T v="label">Specialisation</T>
        <Chips>{SKILLS.slice(0, 10).map((s) => <Chip key={s} label={s} active={skill === s} onPress={() => setSkill(skill === s ? null : s)} />)}</Chips>
        <Row style={{ alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}><Input label="Max ₹ per hour" value={maxRate} onChangeText={setMaxRate} keyboardType="numeric" placeholder="Any" /></View>
          <Chip label="Verified only" active={verifiedOnly} onPress={() => setVerifiedOnly(!verifiedOnly)} />
        </Row>
      </Section>

      <Section title={`${results.length} caregivers`}>
        {loading ? <ActivityIndicator color={C.deep} /> : results.length
          ? <Grid min={380}>{results.map((c) => <CaregiverCard key={c.id} c={c} />)}</Grid>
          : <Empty icon="search" text="No one matches these filters." />}
      </Section>
    </Screen>
  );
}
