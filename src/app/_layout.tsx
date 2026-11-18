import { Stack, router } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Anton_400Regular } from "@expo-google-fonts/anton/400Regular";
// Deep imports: only the weights we use get bundled.
import { Geist_400Regular } from "@expo-google-fonts/geist/400Regular";
import { Geist_500Medium } from "@expo-google-fonts/geist/500Medium";
import { Geist_600SemiBold } from "@expo-google-fonts/geist/600SemiBold";
import { Geist_700Bold } from "@expo-google-fonts/geist/700Bold";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/lib/auth";
import { Loading } from "@/components/ui";
import { C } from "@/lib/theme";

// Any screen that throws shows this instead of a blank page.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 }}>
      <Text style={{ fontSize: 22, color: C.ink, fontWeight: "600" }}>Something went wrong</Text>
      <Text style={{ fontSize: 15, color: C.muted, textAlign: "center", maxWidth: 420 }}>{error.message}</Text>
      <Pressable onPress={retry} accessibilityRole="button" style={{ backgroundColor: C.deep, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12 }}>
        <Text style={{ color: C.paper, fontSize: 16 }}>Try Again</Text>
      </Pressable>
      <Pressable onPress={() => router.replace("/")} accessibilityRole="link"><Text style={{ color: C.deep, textDecorationLine: "underline" }}>Go to home</Text></Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ Anton_400Regular, Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold });
  // Web paints immediately with fallback fonts and swaps when they arrive (faster first paint); native waits.
  if (!loaded && Platform.OS !== "web") return <Loading />;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
