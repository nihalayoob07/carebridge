// Scan a CareBridge Health ID QR code. Native: expo-camera's built-in scanner. Web (incl. iPhone Safari):
// live jsQR decoding, plus a Take Photo button that decodes a captured picture.
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, View } from "react-native";
import { C } from "@/lib/theme";
import { Button, Card, Input, Row, Screen, Section, T, alertMsg } from "@/components/ui";
import { BackHeader } from "@/components/blocks";
import { WebQrScanner, decodeImageUri } from "@/components/web-qr";

const tokenFrom = (s: string) => s.match(/\/h\/([a-f0-9]{16,})/i)?.[1] ?? (/^[a-f0-9]{32}$/i.test(s.trim()) ? s.trim() : null);
const web = Platform.OS === "web";

export default function Scan() {
  const [perm, request] = useCameraPermissions();
  const [done, setDone] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const go = (raw: string) => {
    if (done) return;
    const t = tokenFrom(raw);
    if (!t) return alertMsg("That isn't a CareBridge Health ID", "Scan the QR code on the CareBridge card, or paste its link.");
    setDone(true);
    router.replace(`/h/${t}`);
  };

  const takePhoto = async () => {
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (r.canceled) return;
    setBusy(true);
    const found = await decodeImageUri(r.assets[0]!.uri);
    setBusy(false);
    if (found) go(found);
    else alertMsg("No QR code found", "Hold the phone steady with the whole code in frame, then try again.");
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

      {web ? (
        <Row style={{ marginTop: 16, justifyContent: "center" }}>
          <Button title="Take Photo" icon="camera" loading={busy} onPress={takePhoto} />
        </Row>
      ) : null}

      <Section title="Or paste the link">
        <Input label="Health ID link" value={text} onChangeText={setText} placeholder="https://…/h/…" autoCapitalize="none" autoCorrect={false} />
        <Button title="Open" variant="outline" onPress={() => go(text)} />
      </Section>
    </Screen>
  );
}
