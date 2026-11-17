import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { supabase, type Caregiver } from "@/lib/supabase";
import { CAREGIVER_TYPES } from "@/lib/theme";
import { Avatar, Badge, Button, Card, Chip, Chips, Empty, Header, Row, Screen, T, alertMsg } from "@/components/ui";

export default function Verify() {
  const [list, setList] = useState<Caregiver[]>([]);
  const [show, setShow] = useState<"pending" | "all">("pending");

  const load = useCallback(() => {
    let q = supabase.from("caregivers").select("*, profiles(name, phone)").order("years_exp", { ascending: false });
    if (show === "pending") q = q.eq("verified", false);
    q.limit(60).then(({ data }) => setList((data as Caregiver[]) ?? []));
  }, [show]);
  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, ok: boolean) => {
    const { error } = await supabase.rpc("admin_verify", { cid: id, ok });
    if (error) alertMsg("Couldn't update", error.message); else load();
  };

  return (
    <Screen>
      <Header title="Caregiver verification" />
      <Chips>
        <Chip label="Pending" active={show === "pending"} onPress={() => setShow("pending")} />
        <Chip label="Everyone" active={show === "all"} onPress={() => setShow("all")} />
      </Chips>
      <View style={{ gap: 12, marginTop: 20 }}>
        {list.map((c) => (
          <Card key={c.id} style={{ gap: 12 }}>
            <Row style={{ alignItems: "flex-start" }}>
              <Avatar name={c.profiles?.name ?? "?"} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="strong">{c.profiles?.name}</T>
                <T v="small">{CAREGIVER_TYPES[c.type]}, {c.years_exp} yrs, {c.city}</T>
                <T v="small">{c.profiles?.phone ?? "No phone on file"}</T>
              </View>
              <Badge label={c.verified ? "Verified" : c.bg_check === "failed" ? "Rejected" : "Pending"} tone={c.verified ? "ok" : c.bg_check === "failed" ? "danger" : "warn"} />
            </Row>
            <View style={{ gap: 4 }}>
              {c.certifications.length ? c.certifications.map((q) => <T key={q.name} v="small" style={{ color: "#2B3628" }}>{q.name}, {q.issuer}</T>)
                : <T v="small">No qualifications uploaded</T>}
            </View>
            <Row style={{ flexWrap: "wrap" }}>
              {!c.verified ? <Button small title="Approve" icon="check" onPress={() => decide(c.id, true)} /> : null}
              <Button small variant="outline" title={c.verified ? "Revoke" : "Reject"} icon="close" onPress={() => decide(c.id, false)} />
              <Button small variant="ghost" title="Profile" onPress={() => router.push(`/caregiver/${c.id}`)} />
            </Row>
          </Card>
        ))}
        {!list.length ? <Empty icon="shield" text="Nobody is waiting for verification." /> : null}
      </View>
    </Screen>
  );
}
