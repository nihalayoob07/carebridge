// "Get the app" cards: Android APK download + install steps, and iPhone "Add to Home Screen" steps.
// Used on the homepage and on /download. Puts the visitor's own platform first.
import { useEffect, useState, type ReactNode } from "react";
import { Linking, Platform, Text, useWindowDimensions, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { C, F, R } from "@/lib/theme";
import { Icon, type IconName } from "./icon";
import { Badge, Button, Reveal, Row, T } from "./ui";

type ApkInfo = { version: string; versionCode: number; sizeMB: number; date: string; url: string };
export type Device = "android" | "ios" | "desktop";

export function detectDevice(): Device {
  if (Platform.OS !== "web") return "android";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

export function GetAppCards({ showQr = true }: { showQr?: boolean }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [device, setDevice] = useState<Device>("desktop");
  const [apk, setApk] = useState<ApkInfo | null | undefined>(undefined);
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    setDevice(detectDevice());
    setStandalone((navigator as any).standalone === true || matchMedia("(display-mode: standalone)").matches);
    fetch("/apk.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then(setApk).catch(() => setApk(null));
  }, []);

  const android = (
    <PlatformCard highlight={device === "android"} icon="android" title="Android" subtitle="Install the CareBridge app">
      {apk === null ? (
        <Note icon="clock"><B>The Android app is being built.</B> It will be available here shortly. Meanwhile, use CareBridge in your browser.</Note>
      ) : (
        <>
          <Button title="Download APK" icon="download" style={{ alignSelf: "stretch" }} disabled={!apk}
            onPress={() => apk && Linking.openURL(apk.url)} />
          <T v="small" style={{ textAlign: "center" }}>
            {apk ? `Version ${apk.version} (build ${apk.versionCode}), ${apk.sizeMB} MB, updated ${apk.date}` : "Checking the latest version…"}
          </T>
        </>
      )}
      <Steps items={[
        ["download", "Tap Download APK above."],
        ["file", "Open the downloaded file from the notification or your Downloads folder."],
        ["toggle", "If Android asks, allow your browser to install unknown apps, then go back."],
        ["check-circle", "Tap Install, then Open."],
      ]} />
      <Note icon="arrow-up">
        <B>Updating?</B> Download the new APK and tap Install. It installs over the old version and keeps you signed in. No need to uninstall.
      </Note>
    </PlatformCard>
  );

  const ios = (
    <PlatformCard highlight={device === "ios"} icon="apple" title="iPhone" subtitle="Add the web app to your Home Screen">
      {standalone ? <Note icon="check-circle"><B>You're already using the web app.</B> Nothing else to do.</Note> : null}
      <Steps items={[
        ["compass", "Open CareBridge in Safari."],
        ["export", "Tap the Share button (the square with an arrow pointing up)."],
        ["plus-square", "Scroll down and tap Add to Home Screen."],
        ["toggle", "Keep Open as Web App switched on."],
        ["check-circle", "Tap Add. CareBridge opens full screen from your Home Screen, like an app."],
      ]} />
      <Note icon="arrow-up"><B>Updating?</B> Nothing to do. The web app always loads the latest version.</Note>
    </PlatformCard>
  );

  const cards = device === "ios" ? [ios, android] : [android, ios];
  const pageUrl = typeof window !== "undefined" && window.location ? `${window.location.origin}/download` : "/download";

  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: wide ? "row" : "column", gap: 18, alignItems: "stretch" }}>
        {cards.map((c, i) => <Reveal key={i} delay={i * 100} style={{ flex: wide ? 1 : undefined }}>{c}</Reveal>)}
      </View>
      {showQr && device === "desktop" ? (
        <Reveal delay={200}>
          <View style={{ flexDirection: wide ? "row" : "column", alignItems: "center", gap: 24, padding: 24, borderRadius: R.xl,
            backgroundColor: "rgba(255,255,255,0.45)", borderWidth: 1, borderColor: C.lineSoft }}>
            <View style={{ padding: 10, backgroundColor: C.paper, borderRadius: R.md, borderWidth: 1, borderColor: C.line }}>
              <QRCode value={pageUrl} size={132} color={C.ink} backgroundColor={C.paper} />
            </View>
            <View style={{ flex: wide ? 1 : undefined, gap: 6 }}>
              <T v="h3">On a computer?</T>
              <T v="small" style={{ fontSize: 15 }}>Scan this code with your phone's camera to open the install page there.</T>
            </View>
          </View>
        </Reveal>
      ) : null}
    </View>
  );
}

function PlatformCard({ highlight, icon, title, subtitle, children }: { highlight: boolean; icon: IconName; title: string; subtitle: string; children: ReactNode }) {
  // Double bezel: tray radius 26, padding 5, core radius 21.
  return (
    <View style={{ flex: 1, borderRadius: R.xl, padding: 5, borderWidth: 1, borderColor: highlight ? C.sage : C.lineSoft,
      backgroundColor: highlight ? "rgba(120,149,117,0.18)" : "rgba(255,255,255,0.28)" }}>
      <View style={{ flex: 1, borderRadius: R.xl - 5, backgroundColor: C.card, padding: 22, gap: 16, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" } as any}>
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Row gap={14}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" }}>
              <Icon name={icon} size={28} color={C.paper} weight="fill" />
            </View>
            <View>
              <T v="h2">{title}</T>
              <T v="small">{subtitle}</T>
            </View>
          </Row>
          {highlight ? <Badge label="Your device" tone="sage" icon="check" /> : null}
        </Row>
        {children}
      </View>
    </View>
  );
}

function Steps({ items }: { items: [IconName, string][] }) {
  return (
    <View style={{ gap: 2 }}>
      {items.map(([icon, text], i) => (
        <Row key={i} gap={14} style={{ alignItems: "flex-start", paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: C.lineSoft }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center", backgroundColor: C.paper }}>
            <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.deep }}>{i + 1}</Text>
          </View>
          <Icon name={icon} size={20} color={C.sage} style={{ marginTop: 5 }} />
          <T style={{ flex: 1, fontSize: 15.5, lineHeight: 23 }}>{text}</T>
        </Row>
      ))}
    </View>
  );
}

const B = ({ children }: { children: ReactNode }) => <Text style={{ fontFamily: F.semi, color: C.ink }}>{children}</Text>;

function Note({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <Row gap={10} style={{ alignItems: "flex-start", padding: 14, borderRadius: R.md, backgroundColor: C.tint }}>
      <Icon name={icon} size={18} color={C.deep} style={{ marginTop: 2 }} />
      <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 14.5, lineHeight: 21, color: C.ink }}>{children}</Text>
    </Row>
  );
}
