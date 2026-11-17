// Patient profile. What you see depends on your access scope (owner / full / summary), enforced by RLS.
import { Icon } from "@/components/icon";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Share, View } from "react-native";
import { fn, supabase, type Patient, type Visit } from "@/lib/supabase";
import { age, ago, cap, day } from "@/lib/format";
import { C, F } from "@/lib/theme";
import { Avatar, Badge, Button, Card, Chip, Chips, Empty, KV, Loading, Row, Screen, Section, T, alertMsg, confirmMsg } from "@/components/ui";
import { BackHeader, HealthIdCard, webBase } from "@/components/blocks";
import { VisitReport } from "@/components/visit-report";

type Doc = { id: string; title: string; kind: string; storage_path: string; mime: string | null; ai_status: string; ai_summary: string | null; ai_extracted: any; created_at: string };
type Grant = { id: string; grantee_id: string; scope: string; revoked_at: string | null; created_at: string; profiles: { name: string } };

export default function PatientScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const [p, setP] = useState<Patient | null>(null);
  const [scope, setScope] = useState<string | null>(null);
  const [tab, setTab] = useState(initialTab ?? "overview");

  const load = useCallback(async () => {
    const [{ data }, { data: sc }] = await Promise.all([
      supabase.from("patients").select("*").eq("id", id).maybeSingle(),
      supabase.rpc("patient_scope", { pid: id }),
    ]);
    setP(data as Patient); setScope(sc as string | null);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (scope === null && p === null) return <Loading />;
  if (!p) {
    return (
      <Screen>
        <BackHeader />
        <Empty icon="lock" text="You don't have access to this patient. The family may have revoked it." />
      </Screen>
    );
  }

  const owner = scope === "owner";
  const canDocs = owner || scope === "full" || scope === "admin";
  const tabs = [
    ["overview", "Overview"], ...(canDocs ? [["records", "Records"]] : []), ...(owner ? [["sharing", "Sharing"]] : []),
    ["id", "Health ID"], ["log", "Care log"],
  ];

  return (
    <Screen>
      <BackHeader right={!owner ? <Badge label={`${scope} access`} tone="sage" icon="unlock" /> : null} />
      <Row style={{ gap: 16 }}>
        <Avatar name={p.name} size={72} />
        <View style={{ flex: 1 }}>
          <T v="h1">{p.name}</T>
          <T v="small">{age(p.dob)} yrs, {p.gender}, {p.city}. ID {p.health_id}</T>
        </View>
        <T style={{ fontFamily: F.display, color: C.sage, fontSize: 34 }}>{p.blood_group}</T>
      </Row>

      <View style={{ marginTop: 16 }}>
        <Chips>{tabs.map(([k, l]) => <Chip key={k} label={l!} active={tab === k} onPress={() => setTab(k!)} />)}</Chips>
      </View>

      {tab === "overview" ? <Overview p={p} /> : null}
      {tab === "records" && canDocs ? <Records p={p} owner={owner} onChange={load} /> : null}
      {tab === "sharing" && owner ? <Sharing p={p} /> : null}
      {tab === "id" ? <HealthId p={p} /> : null}
      {tab === "log" ? <CareLog p={p} /> : null}
    </Screen>
  );
}

function Overview({ p }: { p: Patient }) {
  return (
    <>
      {p.ai_summary ? (
        <Card style={{ marginTop: 20, backgroundColor: C.deep, borderColor: C.deep, gap: 8 }}>
          <Row gap={8}><Icon name="sparkle" size={16} color={C.bg} /><T v="label" color={C.bg}>AI care summary</T></Row>
          <T color={C.paper} style={{ fontSize: 17, lineHeight: 26 }}>{p.ai_summary}</T>
        </Card>
      ) : (
        <Card style={{ marginTop: 20, gap: 6 }}>
          <T v="strong">No AI summary yet</T>
          <T v="small">Upload a prescription or report in Records and CareBridge will build one.</T>
        </Card>
      )}
      <Section title="Allergies">
        {p.allergies.length ? <Chips>{p.allergies.map((a) => <Badge key={a} label={a} tone="danger" icon="warning" />)}</Chips> : <T v="small">None recorded</T>}
      </Section>
      <Section title="Conditions">
        {p.conditions.length ? <Chips>{p.conditions.map((c) => <Badge key={c} label={c} />)}</Chips> : <T v="small">None recorded</T>}
      </Section>
      <Section title="Medications">
        {p.medications.length ? (
          <Card style={{ paddingVertical: 4 }}>
            {p.medications.map((m, i) => (
              <Row key={i} style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: C.line, alignItems: "flex-start" }}>
                <Icon name="pill" size={18} color={C.sage} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <T v="strong">{m.name} {m.dose ? <T v="small">{m.dose}</T> : null}</T>
                  {m.frequency ? <T v="small">{m.frequency}</T> : null}
                </View>
              </Row>
            ))}
          </Card>
        ) : <T v="small">None recorded</T>}
      </Section>
      <Section title="Care needs">
        {p.needs.length ? <Chips>{p.needs.map((n) => <Badge key={n} label={n} tone="sage" />)}</Chips> : <T v="small">Not identified yet</T>}
      </Section>
      <Section title="Emergency contact">
        <Card>
          <KV k="Name" v={p.emergency_contact?.name} />
          <KV k="Relation" v={p.emergency_contact?.relation} />
          <KV k="Phone" v={p.emergency_contact?.phone} />
          {p.address ? <KV k="Address" v={p.address} /> : null}
        </Card>
      </Section>
    </>
  );
}

function Records({ p, owner, onChange }: { p: Patient; owner: boolean; onChange: () => void }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() =>
    supabase.from("documents").select("*").eq("patient_id", p.id).order("created_at", { ascending: false })
      .then(({ data }) => setDocs((data as Doc[]) ?? [])), [p.id]);
  useEffect(() => { load(); }, [load]);

  const upload = async (from: "file" | "camera" | "library") => {
    let uri: string, name: string, mime: string;
    if (from === "file") {
      const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
      if (r.canceled) return;
      ({ uri, name } = r.assets[0]!); mime = r.assets[0]!.mimeType ?? "application/pdf";
    } else {
      if (from === "camera") await ImagePicker.requestCameraPermissionsAsync();
      const r = from === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
      if (r.canceled) return;
      uri = r.assets[0]!.uri; name = r.assets[0]!.fileName ?? `photo-${Date.now()}.jpg`; mime = r.assets[0]!.mimeType ?? "image/jpeg";
    }
    setBusy("Uploading…");
    try {
      const body = await fetch(uri).then((r) => r.arrayBuffer());
      const path = `${p.id}/${Date.now()}-${name.replace(/[^\w.-]+/g, "_")}`;
      const up = await supabase.storage.from("medical-docs").upload(path, body, { contentType: mime });
      if (up.error) throw up.error;
      const { data: doc, error } = await supabase.from("documents")
        .insert({ patient_id: p.id, title: name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), storage_path: path, mime }).select().single();
      if (error) throw error;
      await load();
      setBusy("AI is reading the document…");
      await fn("process-document", { document_id: doc.id });
      setOpen(doc.id);
    } catch (e: any) { alertMsg("Upload problem", e.message); }
    setBusy(null); load(); onChange();
  };

  const view = async (d: Doc) => {
    const { data, error } = await supabase.storage.from("medical-docs").createSignedUrl(d.storage_path, 300);
    if (error) return alertMsg("Can't open", error.message);
    WebBrowser.openBrowserAsync(data.signedUrl);
  };

  const remove = async (d: Doc) => {
    if (!(await confirmMsg("Delete document?", d.title))) return;
    await supabase.storage.from("medical-docs").remove([d.storage_path]);
    await supabase.from("documents").delete().eq("id", d.id);
    load();
  };

  return (
    <>
      {owner ? (
        <Card style={{ marginTop: 20, gap: 12, backgroundColor: C.paper }}>
          <T v="strong">Add prescription, blood report or discharge summary</T>
          <T v="small">AI extracts medicines, allergies, lab values and care needs, then updates {p.name.split(" ")[0]}'s profile.</T>
          {busy ? <Row><ActivityIndicator color={C.deep} /><T v="strong">{busy}</T></Row> : (
            <Row style={{ flexWrap: "wrap" }}>
              <Button small title="PDF / file" icon="attach" onPress={() => upload("file")} />
              {Platform.OS !== "web" ? <Button small variant="outline" title="Camera" icon="camera" onPress={() => upload("camera")} /> : null}
              <Button small variant="outline" title="Photo" icon="image" onPress={() => upload("library")} />
            </Row>
          )}
        </Card>
      ) : null}
      <Section title={`${docs.length} documents`}>
        {docs.length ? docs.map((d) => (
          <Card key={d.id} style={{ gap: 8 }} onPress={() => setOpen(open === d.id ? null : d.id)}>
            <Row style={{ alignItems: "flex-start" }}>
              <Icon name={d.mime?.includes("pdf") ? "file" : "image"} size={24} color={C.sage} />
              <View style={{ flex: 1 }}>
                <T v="strong">{cap(d.title)}</T>
                <T v="small">{cap(d.kind)} · {ago(d.created_at)}</T>
              </View>
              <Badge label={d.ai_status === "done" ? "AI read" : d.ai_status} tone={d.ai_status === "done" ? "ok" : d.ai_status === "failed" ? "danger" : "warn"} />
            </Row>
            {d.ai_summary ? <T v="small" style={{ color: C.ink }}>{d.ai_summary}</T> : null}
            {open === d.id && d.ai_extracted ? <Extracted x={d.ai_extracted} /> : null}
            <Row>
              <Button small variant="outline" title="Open file" icon="external" onPress={() => view(d)} />
              {owner ? <Button small variant="ghost" title="Delete" icon="trash" onPress={() => remove(d)} /> : null}
            </Row>
          </Card>
        )) : <Empty icon="folder" text="No documents yet." />}
      </Section>
    </>
  );
}

function Extracted({ x }: { x: any }) {
  return (
    <View style={{ gap: 8, backgroundColor: C.paper, borderRadius: 14, padding: 12 }}>
      {x.diagnoses?.length ? <><T v="label">Diagnoses</T><Chips>{x.diagnoses.map((d: string) => <Badge key={d} label={d} />)}</Chips></> : null}
      {x.medications?.length ? <><T v="label">Medicines</T>{x.medications.map((m: any, i: number) => <T key={i} v="small" style={{ color: C.ink }}>• {m.name} {m.dose}, {m.frequency}</T>)}</> : null}
      {x.lab_values?.length ? <><T v="label">Lab values</T>
        <Chips>{x.lab_values.map((l: any, i: number) => <Badge key={i} label={`${l.test}: ${l.value}`} tone={l.flag === "normal" ? "ok" : "warn"} />)}</Chips></> : null}
      {x.caregiver_notes?.length ? <><T v="label">For the caregiver</T>{x.caregiver_notes.map((n: string, i: number) => <T key={i} v="small" style={{ color: C.ink }}>• {n}</T>)}</> : null}
    </View>
  );
}

function Sharing({ p }: { p: Patient }) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [candidates, setCandidates] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("access_grants").select("*, profiles!access_grants_grantee_id_fkey(name)")
      .eq("patient_id", p.id).order("created_at", { ascending: false });
    setGrants((data as Grant[]) ?? []);
    const { data: bk } = await supabase.from("bookings").select("caregiver_id, caregivers(profiles(name))").eq("patient_id", p.id);
    const active = new Set((data ?? []).filter((g: any) => !g.revoked_at).map((g: any) => g.grantee_id));
    const seen = new Map<string, string>();
    (bk ?? []).forEach((b: any) => { if (!active.has(b.caregiver_id)) seen.set(b.caregiver_id, b.caregivers?.profiles?.name); });
    setCandidates([...seen].map(([id, name]) => ({ id, name })));
  }, [p.id]);
  useEffect(() => { load(); }, [load]);

  const setScope = async (g: Grant, scope: string) => { await supabase.from("access_grants").update({ scope }).eq("id", g.id); load(); };
  const revoke = async (g: Grant) => {
    if (!(await confirmMsg("Revoke access?", `${g.profiles.name} will immediately lose access to ${p.name}'s records.`))) return;
    await supabase.from("access_grants").update({ revoked_at: new Date().toISOString() }).eq("id", g.id); load();
  };
  const grant = async (cid: string) => {
    const { error } = await supabase.from("access_grants").insert({ patient_id: p.id, grantee_id: cid, scope: "summary" });
    if (error) alertMsg("Couldn't grant", error.message); load();
  };

  const active = grants.filter((g) => !g.revoked_at);
  const past = grants.filter((g) => g.revoked_at);

  return (
    <>
      <Card style={{ marginTop: 20, gap: 6, backgroundColor: C.paper }}>
        <Row gap={8}><Icon name="lock" size={16} color={C.deep} /><T v="strong">You decide who sees what</T></Row>
        <T v="small"><T v="small" style={{ fontFamily: F.semi, color: C.ink }}>Summary</T>: AI summary, allergies, medicines, needs. <T v="small" style={{ fontFamily: F.semi, color: C.ink }}>Full</T>: also every uploaded document. Booked caregivers get Summary automatically.</T>
      </Card>
      <Section title="Who has access">
        {active.length ? active.map((g) => (
          <Card key={g.id} style={{ gap: 10 }}>
            <Row>
              <Avatar name={g.profiles.name} size={40} />
              <View style={{ flex: 1 }}><T v="strong">{g.profiles.name}</T><T v="small">since {day(g.created_at)}</T></View>
              <Badge label={g.scope} tone={g.scope === "full" ? "warn" : "sage"} />
            </Row>
            <Row style={{ flexWrap: "wrap" }}>
              <Chip label="Summary" active={g.scope === "summary"} onPress={() => setScope(g, "summary")} />
              <Chip label="Full records" active={g.scope === "full"} onPress={() => setScope(g, "full")} />
              <Button small variant="danger" title="Revoke" icon="x-circle" onPress={() => revoke(g)} />
            </Row>
          </Card>
        )) : <Empty icon="lock" text="Nobody else can see these records." />}
      </Section>
      {candidates.length ? (
        <Section title="Give access">
          {candidates.map((c) => (
            <Card key={c.id}><Row style={{ justifyContent: "space-between" }}><T v="strong">{c.name}</T><Button small title="Grant summary" icon="add" onPress={() => grant(c.id)} /></Row></Card>
          ))}
        </Section>
      ) : null}
      {past.length ? (
        <Section title="Revoked">
          {past.map((g) => <T key={g.id} v="small">{g.profiles.name} · revoked {day(g.revoked_at!)}</T>)}
        </Section>
      ) : null}
    </>
  );
}

function HealthId({ p }: { p: Patient }) {
  const url = `${webBase()}/h/${p.health_token}`;
  return (
    <View style={{ marginTop: 20, gap: 16, alignItems: "center" }}>
      <HealthIdCard p={p} />
      <T v="small" style={{ textAlign: "center", maxWidth: 380 }}>
        Print it or keep it in the wallet. Scanning shows emergency info only: allergies, medicines, conditions and contacts. Full records stay private.
      </T>
      <Row style={{ flexWrap: "wrap", justifyContent: "center" }}>
        <Button small title="Share link" icon="share" onPress={() => Share.share({ message: `${p.name}'s CareBridge emergency card: ${url}` })} />
        <Button small variant="outline" title="Preview emergency view" icon="eye" onPress={() => router.push(`/h/${p.health_token}`)} />
      </Row>
    </View>
  );
}

function CareLog({ p }: { p: Patient }) {
  const [visits, setVisits] = useState<(Visit & { bookings: { caregivers: { profiles: { name: string } } } })[] | null>(null);
  useEffect(() => {
    supabase.from("visits").select("*, bookings!inner(patient_id, caregivers(profiles(name)))").eq("bookings.patient_id", p.id)
      .order("check_in_at", { ascending: false }).then(({ data }) => setVisits((data as any) ?? []));
  }, [p.id]);
  if (!visits) return <ActivityIndicator color={C.deep} style={{ marginTop: 20 }} />;
  return (
    <Section title={`${visits.length} visits`}>
      {visits.length ? visits.map((v) => <VisitReport key={v.id} v={v} who={v.bookings.caregivers.profiles.name} />)
        : <Empty icon="file" text="No visits yet." />}
    </Section>
  );
}
