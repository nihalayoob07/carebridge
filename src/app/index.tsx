// Web: marketing site. Native: straight into the app.
import { Redirect, router } from "expo-router";
import Head from "expo-router/head";
import { useRef } from "react";
import { Animated, Image, Linking, Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { Backdrop } from "@/components/backdrop";
import { homeFor, useAuth } from "@/lib/auth";
import { C, F } from "@/lib/theme";
import { Button, Eyebrow, IconCircle, Loading, Reveal, Row, T, type IconName } from "@/components/ui";
import { HealthIdCard } from "@/components/blocks";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/logo";
import { GetAppCards } from "@/components/get-app";

const APK_URL = process.env.EXPO_PUBLIC_APK_URL;
const HERO = require("../../assets/images/hero.webp");
const CARE = require("../../assets/images/care.jpg");
const FAMILY = require("../../assets/images/family-wide.jpg");

export default function Index() {
  const { session, profile, loading } = useAuth();
  if (Platform.OS !== "web") {
    if (loading) return <Loading />;
    return <Redirect href={session && profile ? (homeFor(profile.role) as any) : "/login"} />;
  }
  return <Landing signedIn={!!session && !!profile} home={homeFor(profile?.role)} />;
}

const PILLARS: { icon: IconName; a: string; b: string }[] = [
  { icon: "shield", a: "Verified", b: "Caregivers" },
  { icon: "sparkle", a: "AI Medical", b: "Records" },
  { icon: "pulse", a: "Live Care", b: "Updates" },
];

const STEPS: { verb: string; d: string }[] = [
  { verb: "Create", d: "a profile for your parent in two minutes." },
  { verb: "Upload", d: "prescriptions and reports. AI organises them." },
  { verb: "Match", d: "with caregivers ranked against real medical needs." },
  { verb: "Book", d: "by the hour, day, week or month." },
  { verb: "Pay", d: "securely with UPI, cards or netbanking." },
  { verb: "Follow", d: "every check-in and daily report, from anywhere." },
];

function Landing({ signedIn, home }: { signedIn: boolean; home: string }) {
  const { width, height } = useWindowDimensions();
  const wide = width >= 1024;
  const mid = width >= 768;
  // Desktop: edge-to-edge gutters, side columns that scale with the window, and display type sized to
  // whichever runs out first, the free width or the screen height (3 lines at 0.96 line-height).
  const pad = wide ? Math.round(Math.max(32, width * 0.035)) : mid ? 48 : 16;
  const textCol = wide ? Math.round(Math.min(420, Math.max(300, width * 0.22))) : 0;
  const sideCol = wide ? Math.round(Math.min(280, Math.max(220, width * 0.15))) : 0;
  const huge = wide
    ? Math.floor(Math.min((width - pad * 2 - textCol * 2 - 120) / 3.95, (height - 200) / 2.9))
    : mid ? 128 : Math.max(width * 0.23, 64);
  const headline = wide ? Math.round(Math.min(76, Math.max(50, width * 0.036))) : 40;
  const go = () => router.push((signedIn ? home : "/login") as any);
  // Scroll-linked parallax: the type drifts up faster than the figures, giving the hero depth.
  const y = useRef(new Animated.Value(0)).current;
  const typeShift = y.interpolate({ inputRange: [0, 700], outputRange: [0, -120], extrapolate: "clamp" });
  const peopleShift = y.interpolate({ inputRange: [0, 700], outputRange: [0, -40], extrapolate: "clamp" });

  const heroText = (
            <Reveal style={{ width: wide ? textCol : "100%", gap: wide ? 24 : 18, zIndex: 3 }}>
              <Eyebrow>Elder care, India</Eyebrow>
              <T role="heading" style={{ fontFamily: F.regular, fontSize: headline, lineHeight: Math.round(headline * 1.06), color: C.ink, letterSpacing: -1.6 }}>
                Trusted{"\n"}Elder Care
              </T>
              <T style={{ fontSize: wide ? 20 : 18, lineHeight: wide ? 30 : 27, color: C.muted, maxWidth: 440 }}>
                Verified caregivers and nurses for the people who raised you, with every visit shared live.
              </T>
              <Button title="Get Started" onPress={go} />
            </Reveal>
  );
  const heroVisual = (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", alignSelf: wide ? "stretch" : undefined, paddingBottom: wide ? 0 : 8 }}>
              <Animated.View style={{ transform: [{ translateY: typeShift }] }}>
              <Reveal delay={120} style={{ alignItems: "center" }}>
                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {["CARE THAT", "COMES", "HOME"].map((w) => (
                    <Text key={w} style={{ fontFamily: F.display, fontSize: huge, lineHeight: huge * 0.96, color: C.sage, textAlign: "center", letterSpacing: -1 }}>{w}</Text>
                  ))}
                </View>
              </Reveal>
              </Animated.View>
              <Reveal delay={260} style={{ position: "absolute", bottom: wide ? Math.max(0, (height - 210 - huge * 2.9) / 2) - 6 : -8, alignItems: "center" }}>
                <Animated.Image source={HERO} accessibilityLabel="An elderly woman in a saree walking arm in arm with her nurse"
                  style={{ width: huge * 1.9, height: huge * 1.9 * (858 / 654), transform: [{ translateY: peopleShift }] }} resizeMode="contain" />
              </Reveal>
            </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
    <Backdrop />
    <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ minHeight: "100%" }} scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], { useNativeDriver: false })}>
      <Head>
        <title>CareBridge: Trusted Elder Care at Home</title>
        <meta name="description" content="Find verified caregivers and nurses for your parents in India, organise their medical records with AI, and follow every visit live." />
        <meta name="theme-color" content={C.bg} />
      </Head>

      <View style={wide ? { minHeight: height } : undefined}>
      {/* floating island nav */}
      <View style={{ paddingHorizontal: pad, paddingTop: mid ? 20 : 12, alignItems: "center", zIndex: 10 }}>
        <View style={{ width: "100%", maxWidth: wide ? undefined : 1280, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          height: 64, paddingLeft: 18, paddingRight: 8, borderRadius: 999, backgroundColor: "rgba(247,248,238,0.6)",
          borderWidth: 1, borderColor: "rgba(43,54,40,0.08)", boxShadow: "0 12px 40px -24px rgba(62,90,59,0.4)" } as any}>
          <Logo height={mid ? 30 : 24} />
          {wide ? (
            <Row gap={36}>
              {[["Families", "/login"], ["Caregivers", "/login"], ["Health ID", "/scan"], ["Get the App", "/download"]].map(([l, href]) => (
                <Pressable key={l} accessibilityRole="link" onPress={() => router.push(href as any)}
                  style={(st: any) => ({ opacity: st.hovered ? 0.65 : 1 })}>
                  <Text style={{ fontFamily: F.medium, fontSize: 14.5, color: C.ink }}>{l}</Text>
                </Pressable>
              ))}
            </Row>
          ) : null}
          <Button title={signedIn ? "Dashboard" : "Sign In"} variant="outline" small onPress={go} style={{ alignSelf: "center" }} />
        </View>
      </View>

      {/* hero */}
      <View style={{ paddingHorizontal: pad, paddingTop: wide ? 24 : mid ? 40 : 28, paddingBottom: wide ? 32 : mid ? 40 : 24, alignItems: "center", flex: wide ? 1 : undefined }}>
        <View style={{ width: "100%", maxWidth: wide ? undefined : 1280, flex: wide ? 1 : undefined, flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "stretch", gap: wide ? 32 : 28 }}>
          {wide ? heroText : heroVisual}
          {wide ? heroVisual : heroText}

          <Reveal delay={200} style={{ width: wide ? textCol : "100%", paddingLeft: wide ? textCol - sideCol : 0, flexDirection: wide ? "column" : "row", justifyContent: "space-between", marginTop: wide ? 0 : 4 }}>
            {PILLARS.map((p, i) => (
              <View key={p.a} style={{ flexDirection: wide ? "row" : "column", alignItems: "center", gap: 14, paddingVertical: 20,
                borderTopWidth: wide && i ? 1 : 0, borderColor: C.line, flex: wide ? undefined : 1 }}>
                <IconCircle name={p.icon} size={wide ? 58 : 46} />
                <Text style={{ fontFamily: F.regular, fontSize: wide ? 18 : 16, lineHeight: wide ? 24 : 21, color: C.ink, textAlign: wide ? "left" : "center" }}>{p.a}{"\n"}{p.b}</Text>
              </View>
            ))}
          </Reveal>
        </View>
      </View>
      </View>

      {/* bento: what's inside */}
      <View style={{ paddingHorizontal: pad, paddingVertical: mid ? 112 : 64, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 1280, gap: 40 }}>
          <Reveal>
            <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: mid ? 72 : 46, lineHeight: mid ? 72 : 48, color: C.deep, textTransform: "uppercase", maxWidth: 820 }}>
              Everything care needs, in one place
            </Text>
          </Reveal>
          <View style={{ flexDirection: wide ? "row" : "column", gap: 16 }}>
            <Reveal style={{ flex: wide ? 1.15 : undefined }}>
              <Bezel>
                <View style={{ borderRadius: 26, overflow: "hidden", backgroundColor: C.deep, minHeight: wide ? 640 : 460, justifyContent: "flex-end" }}>
                  <Image source={CARE} accessibilityLabel="A caregiver checking an elderly man's blood pressure at home"
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }} resizeMode="cover" />
                  <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(31,45,29,0.25)" }} />
                  <View style={{ margin: 14, borderRadius: 22, padding: 22, gap: 8, backgroundColor: "rgba(247,248,238,0.94)" }}>
                    <Row gap={10}><Icon name="shield" size={22} color={C.deep} weight="regular" /><T v="h2">Verified caregivers</T></Row>
                    <T v="small" style={{ fontSize: 15, color: C.ink }}>Nurses, physios and care assistants with checked qualifications, background checks and reviews from real families.</T>
                  </View>
                </View>
              </Bezel>
            </Reveal>
            <View style={{ flex: 1, gap: 16 }}>
              <View style={{ flexDirection: mid ? "row" : "column", gap: 16 }}>
                <Reveal delay={80} style={{ flex: 1 }}>
                  <Bezel core={C.deep}>
                    <View style={{ padding: 26, gap: 14, minHeight: 300 }}>
                      <IconCircle name="sparkle" color={C.bg} />
                      <Text style={{ fontFamily: F.medium, fontSize: 24, lineHeight: 29, color: C.paper, letterSpacing: -0.5 }}>AI reads the paperwork</Text>
                      <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 23, color: "#C9D3B4" }}>Upload a prescription or blood report. Medicines, allergies and lab values are pulled out and explained in plain English.</Text>
                    </View>
                  </Bezel>
                </Reveal>
                <Reveal delay={140} style={{ flex: 1 }}>
                  <Bezel>
                    <View style={{ padding: 26, gap: 14, minHeight: 300 }}>
                      <IconCircle name="compare" />
                      <T style={{ fontFamily: F.medium, fontSize: 24, lineHeight: 29, letterSpacing: -0.5 }}>Matched to real needs</T>
                      <T v="small" style={{ fontSize: 15, lineHeight: 23 }}>Caregivers are ranked against your parent's conditions, language and budget, with a clear reason for every match.</T>
                    </View>
                  </Bezel>
                </Reveal>
              </View>
              <Reveal delay={200}>
                <Bezel core={C.bgDeep}>
                  <View style={{ padding: mid ? 26 : 18, gap: 24, flexDirection: width >= 1200 || (mid && !wide) ? "row" : "column", alignItems: "center" }}>
                    <View style={{ flex: 1, gap: 12 }}>
                      <IconCircle name="qr" />
                      <T style={{ fontFamily: F.medium, fontSize: 24, lineHeight: 29, letterSpacing: -0.5 }}>A health ID for the wallet</T>
                      <T v="small" style={{ fontSize: 15, lineHeight: 23 }}>In an emergency, anyone can scan it to see allergies, medicines and who to call. Full records stay private, and you choose who sees them.</T>
                    </View>
                    <View style={{ transform: [{ rotate: mid ? "-3deg" : "0deg" }] }}>
                      <HealthIdCard compact p={{ name: "Saraswathi Menon", dob: "1947-03-12", blood_group: "B+", health_id: "CB-7K3P-91QX", health_token: "demo", allergies: ["Penicillin"] }} />
                    </View>
                  </View>
                </Bezel>
              </Reveal>
            </View>
          </View>
        </View>
      </View>

      {/* steps: editorial list */}
      <View style={{ paddingHorizontal: pad, paddingBottom: mid ? 112 : 64, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 1280, flexDirection: wide ? "row" : "column", gap: wide ? 64 : 28 }}>
          <Reveal style={{ width: wide ? "38%" : "100%" }}>
            <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: mid ? 72 : 46, lineHeight: mid ? 72 : 48, color: C.sage, textTransform: "uppercase" }}>
              Six moves to peace of mind
            </Text>
          </Reveal>
          <View style={{ flex: 1 }}>
            {STEPS.map((s, i) => (
              <Reveal key={s.verb} delay={i * 60}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: mid ? 28 : 16, paddingVertical: mid ? 20 : 16, borderTopWidth: i ? 1 : 0, borderColor: C.line }}>
                  <Text style={{ fontFamily: F.display, fontSize: mid ? 44 : 32, color: C.deep, width: mid ? 150 : 104, textTransform: "uppercase" }}>{s.verb}</Text>
                  <Text style={{ flex: 1, fontFamily: F.regular, fontSize: mid ? 19 : 16, lineHeight: mid ? 28 : 23, color: C.ink }}>{s.d}</Text>
                </View>
              </Reveal>
            ))}
          </View>
        </View>
      </View>

      {/* family story: image + quote */}
      <View style={{ paddingHorizontal: pad, paddingBottom: mid ? 112 : 64, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 1280, flexDirection: mid ? "row" : "column", gap: mid ? 56 : 24, alignItems: "center" }}>
          <Reveal style={{ width: mid ? 420 : "100%", maxWidth: "100%" }}>
            <Bezel>
              <Image source={FAMILY} accessibilityLabel="A daughter living abroad reading an update about her mother on her phone"
                style={{ width: "100%", height: mid ? 262 : 210, borderRadius: 26 }} resizeMode="cover" />
            </Bezel>
          </Reveal>
          <Reveal delay={120} style={{ flex: 1, gap: 24 }}>
            <Text style={{ fontFamily: F.regular, fontSize: mid ? 34 : 26, lineHeight: mid ? 44 : 34, color: C.ink, letterSpacing: -0.8 }}>
              “I live in Dubai. Every evening I see Amma's sugar, BP and what she ate, and I sleep better.”
            </Text>
            <View>
              <T v="strong">Anita Menon</T>
              <T v="small">Daughter of Saraswathi, 79, Kochi</T>
            </View>
          </Reveal>
        </View>
      </View>

      {/* get the app */}
      <View nativeID="get-app" style={{ paddingHorizontal: pad, paddingBottom: mid ? 112 : 64, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 1080, gap: 28 }}>
          <Reveal style={{ gap: 12 }}>
            <Eyebrow>Android and iPhone</Eyebrow>
            <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: mid ? 72 : 46, lineHeight: mid ? 72 : 48, color: C.deep, textTransform: "uppercase" }}>
              Get the app
            </Text>
            <T style={{ color: C.muted, maxWidth: 560, fontSize: 17 }}>
              Install CareBridge on Android, or add it to your iPhone's Home Screen. It takes under a minute.
            </T>
          </Reveal>
          <GetAppCards />
        </View>
      </View>

      {/* closing manifesto */}
      <View style={{ paddingHorizontal: pad, paddingVertical: mid ? 120 : 72, alignItems: "center", backgroundColor: C.bgDeep }}>
        <Reveal style={{ alignItems: "center", gap: 24 }}>
          <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: mid ? 112 : 58, lineHeight: mid ? 108 : 58, color: C.deep, textAlign: "center", textTransform: "uppercase" }}>
            Bring care closer
          </Text>
          <T style={{ textAlign: "center", color: C.muted, maxWidth: 520, fontSize: 17 }}>
            Install the Android app, or on iPhone open CareBridge in Safari and add it to your Home Screen.
          </T>
          <Row gap={12} style={{ flexWrap: "wrap", justifyContent: "center" }}>
            <Button title="Get Started" onPress={go} />
            <Button title="Get the App" variant="outline" icon="download" onPress={() => router.push("/download")} />
          </Row>
        </Reveal>
      </View>

      <View style={{ paddingHorizontal: pad, paddingVertical: 28, alignItems: "center" }}>
        <Row style={{ width: "100%", maxWidth: 1280, justifyContent: "space-between", flexWrap: "wrap" }}>
          <T v="small">© 2026 CareBridge. Made in India for families everywhere.</T>
          <Row gap={22} style={{ flexWrap: "wrap" }}>
            {([["/download", "Get the App", "download"], ["/privacy", "Privacy Policy", "lock"], ["/terms", "Terms of Service", "scales"], ["/scan", "Scan a Health ID", "qr"]] as const).map(([href, label, icon]) => (
              <Pressable key={href} accessibilityRole="link" onPress={() => router.push(href)} style={(st: any) => ({ opacity: st.hovered ? 0.6 : 1 })}>
                <Row gap={8}><Icon name={icon} size={16} color={C.muted} /><T v="small">{label}</T></Row>
              </Pressable>
            ))}
          </Row>
        </Row>
      </View>
    </Animated.ScrollView>
    </View>
  );
}

/** Landing-page double bezel: hairline tray + inner core. */
function Bezel({ children, core = C.card }: { children: React.ReactNode; core?: string }) {
  return (
    <View style={{ borderRadius: 32, padding: 6, backgroundColor: "rgba(43,54,40,0.045)", borderWidth: 1, borderColor: "rgba(43,54,40,0.07)" }}>
      <View style={{ borderRadius: 26, backgroundColor: core, overflow: "hidden", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)" } as any}>{children}</View>
    </View>
  );
}
