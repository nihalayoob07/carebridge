// Get the app page: Android APK + iPhone web-app instructions (shared cards with the homepage).
import { Redirect, router } from "expo-router";
import Head from "expo-router/head";
import { Platform, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { C, F } from "@/lib/theme";
import { Backdrop } from "@/components/backdrop";
import { GetAppCards } from "@/components/get-app";
import { Logo } from "@/components/logo";
import { Button, Reveal, Row, T } from "@/components/ui";

export default function Download() {
  // Inside the native app there's nothing to download.
  if (Platform.OS !== "web") return <Redirect href="/" />;
  return <DownloadPage />;
}

function DownloadPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Head>
        <title>Get the app | CareBridge</title>
        <meta name="description" content="Download CareBridge for Android, or add it to your iPhone Home Screen." />
      </Head>
      <Backdrop variant="quiet" />
      <ScrollView style={{ flex: 1 }}>
        <View style={{ width: "100%", maxWidth: 1080, alignSelf: "center", paddingHorizontal: wide ? 40 : 18, paddingTop: 20, paddingBottom: 80 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 40 }}>
            <Logo height={28} href="/" />
            <Button title="Open Web App" variant="outline" small onPress={() => router.push("/login")} />
          </Row>
          <Reveal style={{ gap: 12, marginBottom: 36, maxWidth: 720 }}>
            <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: wide ? 88 : 56, lineHeight: wide ? 88 : 58, color: C.deep, textTransform: "uppercase" }}>
              Get CareBridge
            </Text>
            <T style={{ fontSize: 18, lineHeight: 27, color: C.muted }}>
              The same CareBridge on every phone. Install the app on Android, or add the web app to your iPhone's Home Screen.
            </T>
          </Reveal>
          <GetAppCards />
        </View>
      </ScrollView>
    </View>
  );
}
