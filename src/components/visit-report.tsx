import { Icon } from "@/components/icon";
import { View } from "react-native";
import type { Visit } from "@/lib/supabase";
import { cap, day, time } from "@/lib/format";
import { C } from "@/lib/theme";
import { Badge, Card, Chips, Row, T } from "./ui";

export function VisitReport({ v, who }: { v: Visit; who?: string }) {
  const done = v.tasks.filter((t) => t.done).length;
  const hours = v.check_out_at ? ((new Date(v.check_out_at).getTime() - new Date(v.check_in_at).getTime()) / 36e5).toFixed(1) : null;
  return (
    <Card variant="ticket" tone="paper" accent={C.sageSoft} style={{ gap: 10 }}>
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <T v="strong">{day(v.check_in_at)}</T>
          <T v="small">{who ? `${who}, ` : ""}{time(v.check_in_at)} to {v.check_out_at ? time(v.check_out_at) : "ongoing"}{hours ? ` (${hours} h)` : ""}</T>
        </View>
        {v.mood ? <Badge label={v.mood} tone="sage" /> : null}
      </Row>
      {Object.keys(v.vitals ?? {}).length ? (
        <Chips>
          {Object.entries(v.vitals).filter(([, val]) => val !== "" && val != null).map(([k, val]) =>
            <Badge key={k} label={`${cap(k.replace("_0_10", " /10").replace("_c", " °C"))}: ${val}`} />)}
        </Chips>
      ) : null}
      {v.tasks.length ? (
        <View style={{ gap: 4 }}>
          <T v="small" style={{ color: C.ink }}>{done}/{v.tasks.length} tasks done</T>
          {v.tasks.map((t, i) => (
            <Row key={i} gap={8}>
              <Icon name={t.done ? "check-circle" : "circle"} size={16} color={t.done ? C.ok : C.muted} />
              <T v="small" style={{ color: t.done ? C.ink : C.muted, flex: 1 }}>{t.label}</T>
            </Row>
          ))}
        </View>
      ) : null}
      {v.notes ? <T style={{ fontStyle: "italic", fontSize: 15 }}>“{v.notes}”</T> : null}
    </Card>
  );
}
