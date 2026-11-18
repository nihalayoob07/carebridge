// Diagnostic page: what this device reports for viewport size and safe areas. Open /viewport and screenshot it.
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F } from "@/lib/theme";
import { Screen, T } from "@/components/ui";

function measureEnv() {
  if (Platform.OS !== "web") return null;
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;top:0;left:0;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);height:100dvh;width:1px";
  document.body.appendChild(el);
  const cs = getComputedStyle(el);
  const out = { top: cs.paddingTop, bottom: cs.paddingBottom, dvh: `${el.getBoundingClientRect().height}px` };
  el.remove();
  return out;
}

export default function Viewport() {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<[string, string][]>([]);
  useEffect(() => {
    const read = () => {
      if (Platform.OS !== "web") return;
      const env = measureEnv()!;
      setRows([
        ["window.innerHeight", `${window.innerHeight}px`],
        ["visualViewport.height", `${Math.round(window.visualViewport?.height ?? 0)}px`],
        ["100dvh", env.dvh],
        ["--app-h (used for layout)", getComputedStyle(document.documentElement).getPropertyValue("--app-h") || "not set"],
        ["#root height", `${Math.round(document.getElementById("root")!.getBoundingClientRect().height)}px`],
        ["screen.height", `${window.screen.height}px`],
        ["env(safe-area-inset-top)", env.top],
        ["env(safe-area-inset-bottom)", env.bottom],
        ["insets (app)", `top ${insets.top}, bottom ${insets.bottom}`],
        ["home-screen web app", String((navigator as any).standalone === true || matchMedia("(display-mode: standalone)").matches)],
        ["text-size-adjust", getComputedStyle(document.documentElement).getPropertyValue("-webkit-text-size-adjust") || "n/a"],
      ]);
    };
    read();
    addEventListener("resize", read);
    return () => removeEventListener("resize", read);
  }, [insets.top, insets.bottom]);

  return (
    <Screen backdrop="none">
      <T v="h1">Viewport check</T>
      <T v="small" style={{ marginBottom: 16 }}>Screenshot this page and send it over.</T>
      <View style={{ borderWidth: 1, borderColor: C.line, borderRadius: 14, overflow: "hidden" }}>
        {rows.map(([k, v], i) => (
          <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: i % 2 ? "transparent" : C.tint }}>
            <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.ink }}>{k}</Text>
            <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.deep }}>{v}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
