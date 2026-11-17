// Scan a CareBridge Health ID QR code. Native: expo-camera's built-in scanner. Web (incl. iPhone Safari):
// live jsQR decoding of the in-page preview, with a shutter button that reads the current frame.
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, View } from "react-native";
import { C } from "@/lib/theme";
import { Button, Card, Input, Screen, Section, T, alertMsg } from "@/components/ui";
import { BackHeader } from "@/components/blocks";
import { WebQrScanner } from "@/components/web-qr";

const tokenFrom = (s: string) => s.match(/\/h\/([a-f0-9]{16,})/i)?.[1] ?? (/^[a-f0-9]{32}$/i.test(s.trim()) ? s.trim() : null);
const web = Platform.OS === "web";

export default function Scan() {
  const [perm, request] = useCameraPermissions();
  const [done, setDone] = useState(false);
  const [text, setText] = useState("");

  const go = (raw: string) => {
    if (done) return;
    const t = tokenFrom(raw);
    if (!t) return alertMsg("That isn't a CareBridge Health ID", "Scan the QR code on the CareBridge card, or paste its link.");
    setDone(true);
    router.replace(`/h/${t}`);
  };

  return (
    <Screen>
      <BackHeader title="Scan Health ID" />
      {web ? (
        <WebQrScanner onResult={go} />
      ) : perm?.granted ? (
        <View style={{ borderRadius: 24, overflow: "hidden", height: 360, backgroundColor: C.ink }}>
          <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={done ? undefined : ({ data }) => go(data)} />
        </View>
      ) : (
        <Card style={{ gap: 12, alignItems: "center", paddingVertical: 32 }}>
          <T v="strong">Camera access is needed to scan</T>
          <Button title="Allow Camera" icon="camera" style={{ alignSelf: "center" }} onPress={request} />
        </Card>
      )}

      <Section title="Or paste the link">
        <Input label="Health ID link" value={text} onChangeText={setText} placeholder="https://…/h/…" autoCapitalize="none" autoCorrect={false} />
        <Button title="Open" variant="outline" onPress={() => go(text)} />
      </Section>
    </Screen>
  );
}
