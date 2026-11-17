// Web: marketing site. Native: straight into the app.
import { Redirect, router } from "expo-router";
import Head from "expo-router/head";
import { Image, Linking, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { homeFor, useAuth } from "@/lib/auth";
import { C, F } from "@/lib/theme";
import { Button, Eyebrow, IconCircle, Loading, Reveal, Row, T, type IconName } from "@/components/ui";
import { HealthIdCard } from "@/components/blocks";
import { Icon } from "@/components/icon";

const APK_URL = process.env.EXPO_PUBLIC_APK_URL;
const HERO = require("../../assets/images/hero.webp");
const CARE = require("../../assets/images/care.jpg");
const FAMILY = require("../../assets/images/family.jpg");

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
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const mid = width >= 768;
  const pad = mid ? 48 : 16;
  const huge = wide ? Math.min(width * 0.15, 200) : mid ? 128 : Math.max(width * 0.19, 60);
  const go = () => router.push((signedIn ? home : "/login") as any);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ minHeight: "100%" }}>
      <Head>
        <title>CareBridge: Trusted Elder Care at Home</title>
        <meta name="description" content="Find verified caregivers and nurses for your parents in India, organise their medical records with AI, and follow every visit live." />
        <meta name="theme-color" content={C.bg} />
      </Head>

      {/* floating island nav */}
      <View style={{ paddingHorizontal: pad, paddingTop: mid ? 20 : 12, alignItems: "center", zIndex: 10 }}>
        <View style={{ width: "100%", maxWidth: 1280, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          height: 64, paddingLeft: 18, paddingRight: 8, borderRadius: 999, backgroundColor: "rgba(247,248,238,0.6)",
          borderWidth: 1, borderColor: "rgba(43,54,40,0.08)", boxShadow: "0 12px 40px -24px rgba(62,90,59,0.4)" } as any}>
          <Row gap={10}>
            <View accessibilityElementsHidden style={{ width: 26, height: 26, flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {[0, 1, 2, 3].map((i) => <View key={i} style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: C.deep }} />)}
            </View>
            <Text style={{ fontFamily: F.display, fontSize: 20, color: C.deep, letterSpacing: 1 }}>CAREBRIDGE</Text>
          </Row>
          {wide ? (
            <Row gap={36}>
              {[["Families", "/login"], ["Caregivers", "/login"], ["Health ID", "/scan"]].map(([l, href]) => (
                <Pressable key={l} accessibilityRole="link" onPress={() => router.push(href as any)}
                  style={(st: any) => ({ opacity: st.hovered ? 0.65 : 1 })}>
                  <Text style={{ fontFamily: F.medium, fontSize: 14.5, color: C.ink }}>{l}</Text>
                </Pressable>
              ))}
            </Row>
          ) : null}
          <Button title={signedIn ? "Dashboard" : "Sign In"} variant="outline" small onPress={go} />
        </View>
      </View>

      {/* hero */}
      <View style={{ paddingHorizontal: pad, paddingTop: mid ? 40 : 28, paddingBottom: mid ? 40 : 24, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 1280, flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "stretch", gap: wide ? 16 : 28 }}>
          <Reveal style={{ width: wide ? 290 : "100%", gap: 18, zIndex: 3 }}>
            <Eyebrow>Elder care, India</Eyebrow>
            <T role="heading" style={{ fontFamily: F.regular, fontSize: wide ? 48 : 40, lineHeight: wide ? 52 : 44, color: C.ink, letterSpacing: -1.6 }}>
              Trusted{"\n"}Elder Care
            </T>
            <T style={{ fontSize: 18, lineHeight: 27, color: C.muted, maxWidth: 420 }}>
              Verified caregivers and nurses for the people who raised you, with every visit shared live.
            </T>
            <Button title="Get Started" onPress={go} />
          </Reveal>

          <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", minHeight: wide ? 600 : undefined }}>
            <Reveal delay={120} style={{ alignItems: "center" }}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {["CARE THAT", "COMES", "HOME"].map((w) => (
                  <Text key={w} style={{ fontFamily: F.display, fontSize: huge, lineHeight: huge * 0.96, color: C.sage, textAlign: "center", letterSpacing: -1 }}>{w}</Text>
                ))}
              </View>
            </Reveal>
            <Reveal delay={260} style={{ position: "absolute", bottom: wide ? 0 : -8, alignItems: "center" }}>
              <Image source={HERO} accessibilityLabel="An elderly woman in a saree walking arm in arm with her nurse"
                style={{ width: huge * 1.75, height: huge * 1.75 * (858 / 654) }} resizeMode="contain" />
            </Reveal>
          </View>

          <Reveal delay={200} style={{ width: wide ? 210 : "100%", flexDirection: wide ? "column" : "row", justifyContent: "space-between", marginTop: wide ? 0 : huge * 1.2 }}>
            {PILLARS.map((p, i) => (
              <View key={p.a} style={{ flexDirection: wide ? "row" : "column", alignItems: "center", gap: 14, paddingVertical: 20,
                borderTopWidth: wide && i ? 1 : 0, borderColor: C.line, flex: wide ? undefined : 1 }}>
                <IconCircle name={p.icon} size={wide ? 52 : 46} />
                <Text style={{ fontFamily: F.regular, fontSize: 16, lineHeight: 21, color: C.ink, textAlign: wide ? "left" : "center" }}>{p.a}{"\n"}{p.b}</Text>
              </View>
            ))}
          </Reveal>
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
          <Reveal style={{ width: mid ? "42%" : "100%" }}>
            <Bezel>
              <Image source={FAMILY} accessibilityLabel="A daughter living abroad reading an update about her mother on her phone"
                style={{ width: "100%", aspectRatio: 4 / 5, borderRadius: 26 }} resizeMode="cover" />
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
            {APK_URL ? <Button title="Android App" variant="outline" icon="android" onPress={() => Linking.openURL(APK_URL)} /> : null}
          </Row>
        </Reveal>
      </View>

      <View style={{ paddingHorizontal: pad, paddingVertical: 28, alignItems: "center" }}>
        <Row style={{ width: "100%", maxWidth: 1280, justifyContent: "space-between", flexWrap: "wrap" }}>
          <T v="small">© 2026 CareBridge. Made in India for families everywhere.</T>
          <Pressable accessibilityRole="link" onPress={() => router.push("/scan")} style={(st: any) => ({ opacity: st.hovered ? 0.65 : 1 })}>
            <Row gap={8}><Icon name="qr" size={16} color={C.muted} /><T v="small">Scan a Health ID</T></Row>
          </Pressable>
        </Row>
      </View>
    </ScrollView>
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
