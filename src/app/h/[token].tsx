// Public emergency card behind the QR code. Shows only the emergency subset (health_card RPC).
import { Icon } from "@/components/icon";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { supabase, type Med } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { C, F } from "@/lib/theme";
import { Badge, Button, Card, Chips, Empty, Loading, Row, Screen, Section, T } from "@/components/ui";

type CardData = {
  patient_id: string; health_id: string; name: string; age: number | null; gender: string | null; blood_group: string | null;
  allergies: string[]; conditions: string[]; medications: Med[]; emergency_contact: { name?: string; relation?: string; phone?: string };
};

export default function EmergencyCard() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { session } = useAuth();
  const [d, setD] = useState<CardData | null | undefined>(undefined);
  const [canOpen, setCanOpen] = useState(false);

  useEffect(() => {
    supabase.rpc("health_card", { token }).then(({ data }) => setD((data as CardData) ?? null));
  }, [token]);
  useEffect(() => {
    if (session && d) supabase.rpc("patient_scope", { pid: d.patient_id }).then(({ data }) => setCanOpen(!!data));
  }, [session, d]);

  if (d === undefined) return <Loading />;
  if (!d) return <Screen><Empty icon="alert" text="This health ID is not valid." /></Screen>;

  const phone = d.emergency_contact?.phone;
  return (
    <Screen>
      <Row gap={8}><Icon name="medkit" size={18} color={C.danger} /><T v="label" color={C.danger}>Emergency medical information</T></Row>
      <T v="display" style={{ marginTop: 10, color: C.deep }}>{d.name}</T>
      <T v="strong" style={{ marginTop: 4 }}>{[d.age && `${d.age} years`, d.gender, d.health_id].filter(Boolean).join(", ")}</T>

      <Row style={{ marginTop: 20, gap: 12 }}>
        <Card style={{ flex: 1, alignItems: "center", backgroundColor: C.deep, borderColor: C.deep }}>
          <T v="label" color={C.bg}>Blood</T>
          <T style={{ fontFamily: F.display, fontSize: 48, lineHeight: 56, color: C.paper }}>{d.blood_group ?? "?"}</T>
        </Card>
        <Card style={{ flex: 2, backgroundColor: "#F3D9CF", borderColor: C.danger, gap: 6 }}>
          <T v="label" color={C.danger}>Allergies</T>
          <T v="h2" color={C.danger}>{d.allergies.length ? d.allergies.join(", ") : "None known"}</T>
        </Card>
      </Row>

      <Section title="Current medicines">
        {d.medications.length ? d.medications.map((m, i) => (
          <T key={i}>• <T v="strong">{m.name}</T>{[m.dose, m.frequency].filter(Boolean).map((x) => ` ${x}`).join(",")}</T>
        )) : <T v="small">None recorded</T>}
      </Section>
      <Section title="Conditions">
        <Chips>{d.conditions.map((c) => <Badge key={c} label={c} />)}</Chips>
      </Section>
      <Section title="Emergency contact">
        <Card style={{ gap: 4 }}>
          <T v="h3">{d.emergency_contact?.name}</T>
          <T v="small">{d.emergency_contact?.relation}</T>
          {phone ? <Button title={`Call ${phone}`} icon="call" style={{ marginTop: 8 }} onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`)} /> : null}
        </Card>
      </Section>

      <View style={{ marginTop: 24 }}>
        {canOpen ? <Button title="Open full record" variant="outline" icon="unlock" onPress={() => router.push(`/patient/${d.patient_id}`)} />
          : <T v="small" style={{ textAlign: "center" }}>Full medical records are private. Authorised caregivers and doctors can sign in to CareBridge to view them.</T>}
      </View>
    </Screen>
  );
}
