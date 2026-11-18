// CareBridge logo (heart + bridge mark with wordmark). `mark` shows the heart only.
import { Image, Pressable } from "react-native";
import { router } from "expo-router";

const LOGO = require("../../assets/images/logo.png"); // 1152 x 172
const MARK = require("../../assets/images/mark.png"); // 184 x 172

export function Logo({ height = 28, mark = false, href }: { height?: number; mark?: boolean; href?: string }) {
  const img = (
    <Image source={mark ? MARK : LOGO} accessibilityLabel="CareBridge" resizeMode="contain"
      style={{ height, width: height * (mark ? 184 / 172 : 1152 / 172) }} />
  );
  if (!href) return img;
  return (
    <Pressable onPress={() => router.push(href as any)} accessibilityRole="link" accessibilityLabel="CareBridge home"
      style={(st: any) => ({ opacity: st.hovered ? 0.8 : 1 })}>
      {img}
    </Pressable>
  );
}
