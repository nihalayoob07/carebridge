// Shared layout for legal documents: reading-progress bar, contents list (sticky column on desktop),
// numbered sections, and back-to-top. Text sizes favour older readers.
import { router } from "expo-router";
import Head from "expo-router/head";
import { Fragment, useRef, type ReactNode } from "react";
import { Animated, Linking, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { C, F, R } from "@/lib/theme";
import { Backdrop } from "./backdrop";
import { Icon } from "./icon";
import { Reveal, Row } from "./ui";

export type LegalSection = { id: string; title: string; body: ReactNode };

export const P = ({ children }: { children: ReactNode }) => (
  <Text style={{ fontFamily: F.regular, fontSize: 16, lineHeight: 26, color: C.ink, maxWidth: 720 }}>{children}</Text>
);
export const B = ({ children }: { children: ReactNode }) => <Text style={{ fontFamily: F.semi }}>{children}</Text>;
export const Mail = ({ to }: { to: string }) => (
  <Text accessibilityRole="link" onPress={() => Linking.openURL(`mailto:${to}`)} style={{ fontFamily: F.medium, color: C.deep, textDecorationLine: "underline" }}>{to}</Text>
);
export const Ul = ({ items }: { items: ReactNode[] }) => (
  <View style={{ gap: 8, maxWidth: 720 }}>
    {items.map((it, i) => (
      <Row key={i} gap={12} style={{ alignItems: "flex-start" }}>
        <View style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: C.sage, marginTop: 10 }} />
        <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 16, lineHeight: 26, color: C.ink }}>{it}</Text>
      </Row>
    ))}
  </View>
);
/** Two-column definition table (what / why) that stacks on phones. */
export const Table = ({ rows, head }: { rows: [ReactNode, ReactNode][]; head: [string, string] }) => {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  return (
    <View style={{ borderRadius: R.md, borderWidth: 1, borderColor: C.line, overflow: "hidden", maxWidth: 760, backgroundColor: "rgba(255,255,255,0.35)" }}>
      {wide ? (
        <Row gap={0} style={{ backgroundColor: C.tint }}>
          {head.map((h) => <Text key={h} style={{ flex: 1, padding: 12, fontFamily: F.semi, fontSize: 13, letterSpacing: 0.4, color: C.muted, textTransform: "uppercase" }}>{h}</Text>)}
        </Row>
      ) : null}
      {rows.map(([a, b], i) => (
        <View key={i} style={{ flexDirection: wide ? "row" : "column", borderTopWidth: i || wide ? 1 : 0, borderColor: C.lineSoft }}>
          <Text style={{ flex: 1, padding: 12, paddingBottom: wide ? 12 : 2, fontFamily: F.semi, fontSize: 15, lineHeight: 22, color: C.ink }}>{a}</Text>
          <Text style={{ flex: 1, padding: 12, paddingTop: wide ? 12 : 2, fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.ink }}>{b}</Text>
        </View>
      ))}
    </View>
  );
};

export function LegalPage({ title, kicker, updated, intro, sections, other }: {
  title: string; kicker: string; updated: string; intro: ReactNode; sections: LegalSection[]; other: { href: string; label: string };
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const scroll = useRef<any>(null);
  const y = useRef(new Animated.Value(0)).current;
  const contentH = useRef(1);
  const viewH = useRef(1);
  const offsets = useRef<Record<string, number>>({});
  const rowY = useRef(0);
  const colY = useRef(0);
  const progress = useRef(new Animated.Value(0)).current;

  // Section y is relative to its column; add the column and row offsets to get a scroll position.
  const jump = (id: string) => scroll.current?.scrollTo({ y: Math.max(0, rowY.current + colY.current + (offsets.current[id] ?? 0) - 24), animated: true });

  const toc = (
    <View style={{ gap: 2 }}>
      <Text style={{ fontFamily: F.semi, fontSize: 12, letterSpacing: 1.6, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Contents</Text>
      {sections.map((s, i) => (
        <Pressable key={s.id} onPress={() => jump(s.id)} accessibilityRole="link"
          style={(st: any) => [{ flexDirection: "row", gap: 10, paddingVertical: 7, paddingHorizontal: 10, borderRadius: R.sm },
            st.hovered && { backgroundColor: C.tint }]}>
          <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.sage, width: 20, fontVariant: ["tabular-nums"] }}>{i + 1}</Text>
          <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 14, lineHeight: 20, color: C.ink }}>{s.title}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Head>
        <title>{`${title} | CareBridge`}</title>
        <meta name="description" content={`${title} for CareBridge, an elder-care platform for families and caregivers in India.`} />
      </Head>
      <Backdrop variant="quiet" />
      {/* reading progress */}
      <Animated.View style={{ position: Platform.OS === "web" ? ("fixed" as any) : "absolute", top: 0, left: 0, height: 3, zIndex: 10, backgroundColor: C.deep,
        width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"], extrapolate: "clamp" }) }} />
      <ScrollView ref={scroll} scrollEventThrottle={16}
        onLayout={(e) => { viewH.current = e.nativeEvent.layout.height; }}
        onContentSizeChange={(_, h) => { contentH.current = h; }}
        onScroll={(e) => {
          const off = e.nativeEvent.contentOffset.y;
          y.setValue(off);
          progress.setValue(off / Math.max(1, contentH.current - viewH.current));
        }}>
        <View style={{ width: "100%", maxWidth: 1120, alignSelf: "center", paddingHorizontal: wide ? 40 : 18, paddingTop: 20, paddingBottom: 96 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 36 }}>
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} accessibilityRole="button" accessibilityLabel="Go back"
              style={(st: any) => [{ flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 14, paddingLeft: 4, paddingVertical: 4, borderRadius: R.pill }, st.hovered && { backgroundColor: C.tint }]}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" }}>
                <Icon name="arrow-left" size={16} color={C.ink} weight="regular" />
              </View>
              <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>Back</Text>
            </Pressable>
            <Pressable onPress={() => router.replace(other.href as any)} accessibilityRole="link" style={(st: any) => ({ opacity: st.hovered ? 0.7 : 1 })}>
              <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.deep, textDecorationLine: "underline" }}>{other.label}</Text>
            </Pressable>
          </Row>

          <Reveal style={{ gap: 14, marginBottom: 40, maxWidth: 820 }}>
            <Text style={{ fontFamily: F.medium, fontSize: 12, letterSpacing: 2.2, color: C.sage, textTransform: "uppercase" }}>{kicker}</Text>
            <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: wide ? 80 : 52, lineHeight: wide ? 82 : 54, color: C.deep, textTransform: "uppercase" }}>{title}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.muted }}>Last updated {updated}</Text>
            <View style={{ marginTop: 6 }}>{intro}</View>
          </Reveal>

          <View onLayout={(e) => { rowY.current = e.nativeEvent.layout.y; }} style={{ flexDirection: wide ? "row" : "column", gap: wide ? 56 : 28, alignItems: "flex-start" }}>
            <View style={[{ width: wide ? 260 : "100%", padding: 14, borderRadius: R.lg, backgroundColor: "rgba(255,255,255,0.4)", borderWidth: 1, borderColor: C.lineSoft },
              wide && Platform.OS === "web" && ({ position: "sticky", top: 24 } as any)]}>
              {toc}
            </View>
            <View onLayout={(e) => { colY.current = e.nativeEvent.layout.y; }} style={{ flex: 1, gap: 44, width: "100%" }}>
              {sections.map((s, i) => (
                <View key={s.id} nativeID={s.id} onLayout={(e) => { offsets.current[s.id] = e.nativeEvent.layout.y; }}>
                  <Reveal style={{ gap: 14 }}>
                    <Row gap={14} style={{ alignItems: "baseline" }}>
                      <Text style={{ fontFamily: F.display, fontSize: 28, color: C.sage, fontVariant: ["tabular-nums"] }}>{String(i + 1).padStart(2, "0")}</Text>
                      <Text accessibilityRole="header" style={{ flex: 1, fontFamily: F.semi, fontSize: 22, lineHeight: 28, color: C.ink, letterSpacing: -0.3 }}>{s.title}</Text>
                    </Row>
                    <View style={{ gap: 14, paddingLeft: wide ? 48 : 0 }}>
                      {Array.isArray(s.body) ? s.body.map((b, j) => <Fragment key={j}>{b}</Fragment>) : s.body}
                    </View>
                  </Reveal>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      {/* back to top */}
      <Animated.View pointerEvents="box-none" style={{ position: Platform.OS === "web" ? ("fixed" as any) : "absolute", right: 20, bottom: 24,
        opacity: y.interpolate({ inputRange: [400, 700], outputRange: [0, 1], extrapolate: "clamp" }) }}>
        <Pressable onPress={() => scroll.current?.scrollTo({ y: 0, animated: true })} accessibilityRole="button" accessibilityLabel="Back to top"
          style={(st: any) => ({ width: 48, height: 48, borderRadius: 24, backgroundColor: C.deep, alignItems: "center", justifyContent: "center",
            transform: [{ scale: st.pressed ? 0.92 : st.hovered ? 1.06 : 1 }] })}>
          <Icon name="arrow-up" size={20} color={C.paper} weight="regular" />
        </Pressable>
      </Animated.View>
    </View>
  );
}
