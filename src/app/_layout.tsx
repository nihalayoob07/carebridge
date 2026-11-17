import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Anton_400Regular } from "@expo-google-fonts/anton";
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from "@expo-google-fonts/geist";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/lib/auth";
import { Loading } from "@/components/ui";
import { C } from "@/lib/theme";

export default function RootLayout() {
  const [loaded] = useFonts({ Anton_400Regular, Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold });
  if (!loaded) return <Loading />;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
