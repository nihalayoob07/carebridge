// Scan a CareBridge Health ID QR code (or paste the link).
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { C } from "@/lib/theme";
import { Button, Card, Input, Screen, Section, T, alertMsg } from "@/components/ui";
import { BackHeader } from "@/components/blocks";

const tokenFrom = (s: string) => s.match(/\/h\/([a-f0-9]{16,})/i)?.[1] ?? (/^[a-f0-9]{32}$/i.test(s.trim()) ? s.trim() : null);

export default function Scan() {
  const [perm, request] = useCameraPermissions();
  const [done, setDone] = useState(false);
  const [text, setText] = useState("");

  const go = (raw: string) => {
    const t = tokenFrom(raw);
    if (!t) return alertMsg("Not a CareBridge Health ID");
    setDone(true);
    router.replace(`/h/${t}`);
  };

  return (
    <Screen>
      <BackHeader title="Scan Health ID" />
      {perm?.granted ? (
        <View style={{ borderRadius: 24, overflow: "hidden", height: 360, backgroundColor: C.ink }}>
          <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={done ? undefined : ({ data }) => go(data)} />
        </View>
      ) : (
        <Card style={{ gap: 10, alignItems: "center", paddingVertical: 32 }}>
          <T v="strong">Camera access needed to scan</T>
          <Button title="Allow camera" icon="camera" onPress={request} />
        </Card>
      )}
      <Section title="Or paste the link">
        <Input value={text} onChangeText={setText} placeholder="https://…/h/…" autoCapitalize="none" />
        <Button title="Open" variant="outline" onPress={() => go(text)} />
      </Section>
    </Screen>
  );
}
