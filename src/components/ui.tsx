// CareBridge UI kit. Sage paper surfaces, double-bezel cards, deep-olive pills with a nested icon "island",
// Phosphor light icons, Geist text and Anton display. One radius system: pills for controls, 28/22 for cards.
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo, ActivityIndicator, Animated, Easing, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F } from "@/lib/theme";
import { initials } from "@/lib/format";
import { Icon, type IconName } from "./icon";

export type { IconName };
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const web = Platform.OS === "web";

// ---------- motion ----------
let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { reduceMotion = v; }).catch(() => {});

/** Fade-up on first view (IntersectionObserver on web, on mount on native). Honors reduced motion. */
export function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const ref = useRef<any>(null);
  useEffect(() => {
    if (reduceMotion) return;
    const run = () => Animated.timing(v, { toValue: 1, duration: 750, delay, easing: EASE, useNativeDriver: !web }).start();
    const node = ref.current as unknown as Element | null;
    if (web && node && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.15 });
      io.observe(node);
      return () => io.disconnect();
    }
    run();
  }, []);
  return (
    <Animated.View ref={ref} style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// ---------- layout ----------
export function Screen({ children, scroll = true, onRefresh, refreshing = false, style }: {
  children: ReactNode; scroll?: boolean; onRefresh?: () => void; refreshing?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const inner = <View style={[s.screenInner, style]}>{children}</View>;
  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 64 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.deep} /> : undefined}
        >
          {inner}
        </ScrollView>
      ) : inner}
    </SafeAreaView>
  );
}

export function Row({ children, style, gap = 12 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export const Divider = () => <View style={{ height: 1, backgroundColor: C.line, marginVertical: 12 }} />;

// ---------- type ----------
type TV = "display" | "h1" | "h2" | "h3" | "body" | "small" | "label" | "strong";
export function T({ children, v = "body", style, numberOfLines, color, role }: {
  children: ReactNode; v?: TV; style?: StyleProp<TextStyle>; numberOfLines?: number; color?: string; role?: "heading";
}) {
  const heading = role ?? (v === "display" || v === "h1" || v === "h2" ? "heading" : undefined);
  // A fontSize override without a lineHeight would inherit the variant's (too small) lineHeight.
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const lh = flat?.fontSize && !flat.lineHeight ? { lineHeight: Math.round(flat.fontSize * (flat.fontFamily === F.display ? 1.08 : 1.35)) } : null;
  return (
    <Text numberOfLines={numberOfLines} accessibilityRole={heading === "heading" ? "header" : undefined}
      style={[s[v], color ? { color } : null, style, lh]}>
      {children}
    </Text>
  );
}

/** Small pill label. Use sparingly: at most one per few sections. */
export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <View style={[s.eyebrow, tone === "dark" && { backgroundColor: "rgba(229,232,206,0.12)", borderColor: "rgba(229,232,206,0.2)" }]}>
      <Text style={[s.eyebrowText, tone === "dark" && { color: C.bg }]}>{children}</Text>
    </View>
  );
}

// ---------- controls ----------
export function Button({ title, onPress, variant = "solid", icon = "arrow-right", disabled, loading, small, style, label }: {
  title: string; onPress?: () => void; variant?: "solid" | "outline" | "ghost" | "danger"; icon?: IconName | null;
  disabled?: boolean; loading?: boolean; small?: boolean; style?: StyleProp<ViewStyle>; label?: string;
}) {
  const solid = variant === "solid" || variant === "danger";
  const fg = solid ? C.paper : C.ink;
  const island = solid ? "rgba(247,248,238,0.16)" : "rgba(43,54,40,0.07)";
  const iconOnly = !title;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label ?? (title || undefined)}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={(st: any) => [
        s.btn, small && s.btnSmall, iconOnly && { paddingHorizontal: 6, paddingRight: 6 },
        variant === "solid" && { backgroundColor: st.hovered ? "#344F31" : C.deep },
        variant === "danger" && { backgroundColor: C.danger },
        variant === "outline" && { borderWidth: 1.2, borderColor: st.hovered ? C.ink : "rgba(43,54,40,0.35)", backgroundColor: st.hovered ? "rgba(43,54,40,0.04)" : "transparent" },
        variant === "ghost" && st.hovered && { backgroundColor: "rgba(43,54,40,0.05)" },
        st.focused && s.focus,
        { transform: [{ scale: st.pressed ? 0.98 : 1 }] },
        disabled && { opacity: 0.45 },
        web && ({ transitionProperty: "background-color, border-color, transform", transitionDuration: "260ms", transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)", cursor: disabled ? "not-allowed" : "pointer" } as any),
        style,
      ]}
    >
      {(st: any) => loading ? <ActivityIndicator color={fg} /> : (
        <>
          {title ? <Text numberOfLines={1} style={[s.btnText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text> : null}
          {icon ? (
            <View style={[s.island, small && { width: 26, height: 26 }, { backgroundColor: variant === "ghost" ? "transparent" : island },
              { transform: [{ translateX: st.hovered ? 2 : 0 }, { translateY: st.hovered && icon === "arrow-right" ? -1 : 0 }] },
              web && ({ transitionProperty: "transform", transitionDuration: "320ms", transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" } as any)]}>
              <Icon name={icon} size={small ? 14 : 16} color={fg} weight="regular" />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }}
      style={(st: any) => [s.chip, st.hovered && !active && { borderColor: C.sage }, active && { backgroundColor: C.deep, borderColor: C.deep },
        st.focused && s.focus, { transform: [{ scale: st.pressed ? 0.97 : 1 }] }]}>
      <Text style={[s.chipText, active && { color: C.paper }]}>{label}</Text>
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}

export function Input({ label, style, hint, ...p }: TextInputProps & { label?: string; hint?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={s.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#7C8675"
        accessibilityLabel={label ?? p.placeholder}
        {...p}
        onFocus={(e) => { setFocus(true); p.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); p.onBlur?.(e); }}
        style={[s.input, focus && { borderColor: C.deep, boxShadow: "0 0 0 3px rgba(120,149,117,0.28)" } as any,
          p.multiline && { minHeight: 96, textAlignVertical: "top" }, web && ({ outlineStyle: "none" } as any), style]}
      />
      {hint ? <Text style={[s.small, { fontSize: 13 }]}>{hint}</Text> : null}
    </View>
  );
}

// ---------- surfaces ----------
/** Double-bezel card: a hairline tray with an inner core. */
export function Card({ children, style, onPress, tone = "card", label }: {
  children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; tone?: "card" | "paper" | "deep" | "alert"; label?: string;
}) {
  const core = { card: C.card, paper: C.paper, deep: C.deep, alert: "#F3DCD2" }[tone];
  const shell = tone === "deep" ? "rgba(62,90,59,0.22)" : "rgba(43,54,40,0.045)";
  // Outer-layout props belong on the shell, everything else on the core.
  const { flex, flexGrow, flexBasis, flexShrink, alignSelf, width, minWidth, maxWidth, marginTop, marginBottom, ...coreStyle } =
    (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const outer = { flex, flexGrow, flexBasis, flexShrink, alignSelf, width, minWidth, maxWidth, marginTop, marginBottom };
  const inner = () => (
    <View style={[s.cardCore, { backgroundColor: core }, tone === "deep" && { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" } as any,
      flex != null || flexGrow != null ? { flexGrow: 1 } : null, coreStyle]}>
      {children}
    </View>
  );
  if (!onPress) return <View style={[s.cardShell, { backgroundColor: shell }, outer]}>{inner()}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={(st: any) => [s.cardShell, { backgroundColor: shell }, outer,
        st.hovered && { boxShadow: "0 24px 48px -28px rgba(62,90,59,0.45)" } as any,
        st.focused && s.focus, { transform: [{ scale: st.pressed ? 0.99 : 1 }, { translateY: st.hovered ? -2 : 0 }] },
        web && ({ transitionProperty: "transform, box-shadow", transitionDuration: "420ms", transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)", cursor: "pointer" } as any)]}>
      {inner()}
    </Pressable>
  );
}

export function Badge({ label, tone = "neutral", icon }: { label: string; tone?: "neutral" | "ok" | "warn" | "danger" | "sage"; icon?: IconName }) {
  const [bg, fg] = {
    neutral: ["rgba(43,54,40,0.07)", C.ink], ok: ["#D6E4CC", "#3B6237"], warn: ["#F1E4C3", "#7E5A16"],
    danger: ["#F2D6CB", "#8E3D28"], sage: [C.sage, C.paper],
  }[tone];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={12} color={fg} weight="bold" /> : null}
      <Text style={[s.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function IconCircle({ name, size = 46, color = C.deep }: { name: IconName; size?: number; color?: string }) {
  return (
    <View style={[s.iconCircle, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Icon name={name} size={size * 0.46} color={color} />
    </View>
  );
}

export function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  return (
    <View accessibilityLabel={name} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.sage, alignItems: "center", justifyContent: "center",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" } as any}>
      <Text style={{ fontFamily: F.display, color: C.paper, fontSize: size * 0.38, letterSpacing: 0.5 }}>{initials(name)}</Text>
    </View>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: 14, marginTop: 32 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <T v="h3" role="heading">{title}</T>
        {action}
      </Row>
      {children}
    </View>
  );
}

export function Empty({ icon = "leaf", text }: { icon?: IconName; text: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 32, paddingHorizontal: 20, gap: 12, borderRadius: 24, borderWidth: 1, borderStyle: "dashed", borderColor: C.line }}>
      <IconCircle name={icon} color={C.sage} />
      <T v="small" style={{ textAlign: "center", maxWidth: 320 }}>{text}</T>
    </View>
  );
}

/** Skeleton shaped like a list of cards; nicer than a bare spinner. */
export function Loading({ rows = 3 }: { rows?: number }) {
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 700, easing: EASE, useNativeDriver: !web }),
      Animated.timing(v, { toValue: 0.5, duration: 700, easing: EASE, useNativeDriver: !web }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: 72, gap: 14, width: "100%", maxWidth: 980, alignSelf: "center" }}
      accessibilityLabel="Loading…" accessibilityRole="progressbar">
      <Animated.View style={{ opacity: v, gap: 14 }}>
        <View style={{ height: 34, width: "55%", borderRadius: 12, backgroundColor: C.bgDeep }} />
        {Array.from({ length: rows }).map((_, i) => <View key={i} style={{ height: 96, borderRadius: 26, backgroundColor: C.bgDeep }} />)}
      </Animated.View>
    </View>
  );
}

export function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <Reveal>
      <Row style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, marginTop: 8 }}>
        <View style={{ flex: 1, gap: 10, minWidth: 0 }}>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <T v="h1">{title}</T>
        </View>
        {right}
      </Row>
    </Reveal>
  );
}

export function KV({ k, v }: { k: string; v?: ReactNode }) {
  return (
    <Row style={{ justifyContent: "space-between", paddingVertical: 7 }}>
      <T v="small">{k}</T>
      <T v="strong" style={{ flexShrink: 1, textAlign: "right", fontVariant: ["tabular-nums"] }}>{v ?? "Not set"}</T>
    </Row>
  );
}

export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <Row gap={4}>
      <Icon name="star" size={14} color={C.warn} weight="fill" />
      <T v="strong" style={{ fontSize: 14, fontVariant: ["tabular-nums"] }}>{Number(value).toFixed(1)}</T>
      {count != null ? <T v="small">({count})</T> : null}
    </Row>
  );
}

export function alertMsg(title: string, msg?: string) {
  if (web) window.alert(msg ? `${title}\n\n${msg}` : title);
  else require("react-native").Alert.alert(title, msg);
}

export async function confirmMsg(title: string, msg: string): Promise<boolean> {
  if (web) return window.confirm(`${title}\n\n${msg}`);
  return new Promise((res) =>
    require("react-native").Alert.alert(title, msg, [
      { text: "Cancel", style: "cancel", onPress: () => res(false) },
      { text: "OK", onPress: () => res(true) },
    ]));
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  screenInner: { paddingHorizontal: 20, paddingTop: 12, width: "100%", maxWidth: 980, alignSelf: "center" },
  display: { fontFamily: F.display, fontSize: 60, lineHeight: 62, color: C.sage, textTransform: "uppercase", letterSpacing: -0.5 },
  h1: { fontFamily: F.regular, fontSize: 34, lineHeight: 40, color: C.ink, letterSpacing: -1 },
  h2: { fontFamily: F.medium, fontSize: 22, lineHeight: 28, color: C.ink, letterSpacing: -0.4 },
  h3: { fontFamily: F.semi, fontSize: 18, lineHeight: 24, color: C.ink, letterSpacing: -0.2 },
  body: { fontFamily: F.regular, fontSize: 16, lineHeight: 25, color: C.ink },
  strong: { fontFamily: F.semi, fontSize: 16, lineHeight: 22, color: C.ink },
  small: { fontFamily: F.regular, fontSize: 14, lineHeight: 21, color: C.muted },
  label: { fontFamily: F.semi, fontSize: 11, letterSpacing: 2, color: C.ink, textTransform: "uppercase" },
  eyebrow: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: "rgba(43,54,40,0.05)", borderWidth: 1, borderColor: "rgba(43,54,40,0.1)" },
  eyebrowText: { fontFamily: F.medium, fontSize: 10.5, letterSpacing: 2.2, textTransform: "uppercase", color: C.ink },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 999, paddingLeft: 24, paddingRight: 8, minHeight: 52, alignSelf: "flex-start" },
  btnSmall: { minHeight: 40, paddingLeft: 16, paddingRight: 6, gap: 8 },
  btnText: { fontFamily: F.medium, fontSize: 16, letterSpacing: -0.1 },
  island: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  focus: { outlineWidth: 2, outlineStyle: "solid", outlineColor: C.sage, outlineOffset: 2 } as any,
  cardShell: { borderRadius: 28, padding: 5, borderWidth: 1, borderColor: "rgba(43,54,40,0.07)" },
  cardCore: { borderRadius: 23, padding: 18, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" } as any,
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { fontFamily: F.medium, fontSize: 12.5 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingHorizontal: 15, paddingVertical: 9, backgroundColor: C.paper, minHeight: 40, justifyContent: "center" },
  chipText: { fontFamily: F.medium, fontSize: 14, color: C.ink },
  inputLabel: { fontFamily: F.medium, fontSize: 14, color: C.ink },
  input: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, fontFamily: F.regular, color: C.ink },
  iconCircle: { borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
