// CareBridge UI kit.
// Rules: OKLCH palette (lib/theme), alpha borders, one radius scale where nested radius = outer - padding,
// Phosphor light icons, Geist text + Anton display, motion on transform/opacity only, reduced-motion aware.
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo, ActivityIndicator, Animated, Easing, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F, R, nest } from "@/lib/theme";
import { initials } from "@/lib/format";
import { Backdrop } from "./backdrop";
import { Icon, type IconName } from "./icon";

export type { IconName };
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const web = Platform.OS === "web";
const SPRING = "cubic-bezier(0.32,0.72,0,1)";
/** Web-only CSS transition on specific properties (never `all`). */
const tx = (props: string, ms = 260) =>
  web ? ({ transitionProperty: props, transitionDuration: `${ms}ms`, transitionTimingFunction: SPRING } as any) : null;

// ---------- motion ----------
let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { reduceMotion = v; }).catch(() => {});

/** Fade-up when first scrolled into view (IntersectionObserver on web, on mount on native). */
export function Reveal({ children, delay = 0, style, distance = 24 }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle>; distance?: number }) {
  const v = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const ref = useRef<any>(null);
  useEffect(() => {
    if (reduceMotion) return;
    const run = () => Animated.timing(v, { toValue: 1, duration: 700, delay: Math.min(delay, 600), easing: EASE, useNativeDriver: !web }).start();
    const node = ref.current as unknown as Element | null;
    if (web && node && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.1 });
      io.observe(node);
      return () => io.disconnect();
    }
    run();
  }, []);
  return (
    <Animated.View ref={ref} style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// ---------- layout ----------
export function Screen({ children, scroll = true, onRefresh, refreshing = false, style, backdrop = "app" }: {
  children: ReactNode; scroll?: boolean; onRefresh?: () => void; refreshing?: boolean; style?: StyleProp<ViewStyle>; backdrop?: "app" | "quiet" | "none";
}) {
  // Every screen fades up on enter: a cheap page transition that works on web and native.
  const inner = <Reveal distance={14} style={[s.screenInner, style]}>{children}</Reveal>;
  return (
    <View style={s.screen}>
      {backdrop !== "none" ? <Backdrop variant={backdrop} /> : null}
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 72 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.deep} /> : undefined}
          >
            {inner}
          </ScrollView>
        ) : inner}
      </SafeAreaView>
    </View>
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

/** Small label above a heading. Use sparingly. */
export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <Row gap={8}>
      <View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: tone === "dark" ? C.bg : C.sage }} />
      <Text style={[s.eyebrowText, tone === "dark" && { color: C.bg }]}>{children}</Text>
    </Row>
  );
}

// ---------- controls ----------
export function Button({ title, onPress, variant = "solid", icon = "arrow-right", disabled, loading, small, style, label }: {
  title: string; onPress?: () => void; variant?: "solid" | "outline" | "ghost" | "danger"; icon?: IconName | null;
  disabled?: boolean; loading?: boolean; small?: boolean; style?: StyleProp<ViewStyle>; label?: string;
}) {
  const solid = variant === "solid" || variant === "danger";
  const fg = solid ? C.paper : C.ink;
  const island = solid ? "rgba(255,255,255,0.16)" : C.tint;
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
        !icon && !iconOnly && { paddingRight: small ? 16 : 24 }, // no trailing island: keep the label centred
        variant === "solid" && { backgroundColor: st.hovered ? C.deepHover : C.deep, boxShadow: st.hovered ? "0 10px 24px -12px rgba(46,70,43,0.55)" : "0 1px 0 rgba(255,255,255,0.12) inset" },
        variant === "danger" && { backgroundColor: C.danger },
        variant === "outline" && { borderWidth: 1, borderColor: st.hovered ? C.lineStrong : C.line, backgroundColor: st.hovered ? C.tint : "rgba(255,255,255,0.35)" },
        variant === "ghost" && st.hovered && { backgroundColor: C.tint },
        st.focused && s.focus,
        { transform: [{ scale: st.pressed ? 0.97 : 1 }, { translateY: st.hovered && !st.pressed && solid ? -1 : 0 }] },
        disabled && { opacity: 0.45 },
        tx("background-color, border-color, transform, box-shadow"),
        web && ({ cursor: disabled ? "not-allowed" : "pointer" } as any),
        style,
      ]}
    >
      {(st: any) => (
        <>
          {loading ? <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={fg} /></View> : null}
          {title ? <Text numberOfLines={1} style={[s.btnText, small && { fontSize: 14 }, { color: fg }, loading && { opacity: 0 }]}>{title}</Text> : null}
          {icon ? (
            <View style={[s.island, small && { width: 26, height: 26 }, { backgroundColor: variant === "ghost" ? "transparent" : island }, loading && { opacity: 0 },
              { transform: [{ translateX: st.hovered ? 3 : 0 }, { rotate: st.hovered && icon === "arrow-right" ? "-12deg" : "0deg" }] }, tx("transform", 380)]}>
              <Icon name={icon} size={small ? 14 : 16} color={fg} weight="regular" />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

/** Multi-select filter tag: squared corners, check mark when on. */
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: !!active }}
      style={(st: any) => [s.chip,
        st.hovered && !active && { backgroundColor: "rgba(255,255,255,0.75)", borderColor: C.lineStrong },
        active && { backgroundColor: C.deep, borderColor: C.deep },
        st.focused && s.focus, { transform: [{ scale: st.pressed ? 0.95 : 1 }] },
        tx("background-color, border-color, transform", 220), web && ({ cursor: "pointer" } as any)]}>
      {active ? <Icon name="check" size={13} color={C.paper} weight="bold" /> : null}
      <Text style={[s.chipText, active && { color: C.paper }]}>{label}</Text>
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}

/** Single-choice segmented control: a tray with a raised selection (tray radius 14, padding 4, segment 10). */
export function Segmented<V extends string>({ options, value, onChange, label }: {
  options: { value: V; label: string; icon?: IconName }[]; value: V | null; onChange: (v: V) => void; label?: string;
}) {
  const TRAY = R.md, PAD = 4;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label}
      style={{ flexDirection: "row", flexWrap: "wrap", alignSelf: "flex-start", maxWidth: "100%", padding: PAD, gap: 2,
        borderRadius: TRAY, backgroundColor: C.tint, borderWidth: 1, borderColor: C.lineSoft }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="radio" accessibilityState={{ checked: on }}
            style={(st: any) => [{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, minHeight: 38,
              borderRadius: nest(TRAY, PAD) },
              on ? { backgroundColor: C.paper, boxShadow: "0 1px 2px rgba(23,33,19,0.12), 0 4px 12px -6px rgba(23,33,19,0.25)" } as any
                : st.hovered && { backgroundColor: "rgba(255,255,255,0.45)" },
              st.focused && s.focus, { transform: [{ scale: st.pressed ? 0.96 : 1 }] },
              tx("background-color, box-shadow, transform", 240), web && ({ cursor: "pointer" } as any)]}>
            {o.icon ? <Icon name={o.icon} size={15} color={on ? C.deep : C.muted} weight={on ? "fill" : "regular"} /> : null}
            <Text style={{ fontFamily: on ? F.semi : F.medium, fontSize: 14, color: on ? C.ink : C.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Input({ label, style, hint, ...p }: TextInputProps & { label?: string; hint?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={s.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={C.muted}
        accessibilityLabel={label ?? p.placeholder}
        {...p}
        onFocus={(e) => { setFocus(true); p.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); p.onBlur?.(e); }}
        style={[s.input, focus && ({ borderColor: C.sage, boxShadow: "0 0 0 4px rgba(120,149,117,0.22)", backgroundColor: "#fff" } as any),
          p.multiline && { minHeight: 96, textAlignVertical: "top" }, web && ({ outlineStyle: "none" } as any), tx("border-color, box-shadow, background-color", 200), style]}
      />
      {hint ? <Text style={[s.small, { fontSize: 13 }]}>{hint}</Text> : null}
    </View>
  );
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }}
      style={(st: any) => [{ flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 4 }, st.focused && s.focus, web && ({ cursor: "pointer" } as any)]}>
      <View style={[{ width: 22, height: 22, borderRadius: R.xs, borderWidth: 1.5, borderColor: checked ? C.deep : C.lineStrong, marginTop: 1,
        backgroundColor: checked ? C.deep : "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" }, tx("background-color, border-color", 160)]}>
        {checked ? <Icon name="check" size={14} color={C.paper} weight="bold" /> : null}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

// ---------- surfaces ----------
type CardTone = "card" | "paper" | "deep" | "alert" | "glass";
/**
 * Card variants keep pages from becoming a wall of identical boxes:
 *  - bezel (default): hairline tray + inner core, inner radius = outer radius - tray padding
 *  - ticket: flat sheet with a coloured status rail on the left
 *  - plain: borderless tinted area for grouping controls
 */
export function Card({ children, style, onPress, tone = "card", label, variant = "bezel", accent }: {
  children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; tone?: CardTone; label?: string;
  variant?: "bezel" | "ticket" | "plain"; accent?: string;
}) {
  const core = { card: C.card, paper: C.paper, deep: C.deep, alert: C.dangerBg, glass: "rgba(255,255,255,0.55)" }[tone];
  const { flex, flexGrow, flexBasis, flexShrink, alignSelf, width, minWidth, maxWidth, marginTop, marginBottom, ...coreStyle } =
    (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const outer = { flex, flexGrow, flexBasis, flexShrink, alignSelf, width, minWidth, maxWidth, marginTop, marginBottom };
  const grow = flex != null || flexGrow != null ? { flexGrow: 1 } : null;

  const OUT = R.xl, PAD = 4;
  const shellStyle: any[] = variant === "bezel"
    ? [{ borderRadius: OUT, padding: PAD, borderWidth: 1, borderColor: C.lineSoft, backgroundColor: tone === "deep" ? "rgba(62,90,59,0.2)" : "rgba(255,255,255,0.28)" }]
    : variant === "ticket"
      ? [{ borderRadius: R.lg, backgroundColor: core, borderWidth: 1, borderColor: C.lineSoft, overflow: "hidden", flexDirection: "row" }]
      : [{ borderRadius: R.lg, backgroundColor: C.tint }];
  const body = variant === "bezel"
    ? <View style={[s.cardCore, { borderRadius: nest(OUT, PAD), backgroundColor: core }, tone === "deep" && ({ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" } as any), grow, coreStyle]}>{children}</View>
    : variant === "ticket"
      ? <>
          <View style={{ width: 5, backgroundColor: accent ?? C.sage }} />
          <View style={[{ flex: 1, padding: 18 }, grow, coreStyle]}>{children}</View>
        </>
      : <View style={[{ padding: 18 }, grow, coreStyle]}>{children}</View>;

  if (!onPress) return <View style={[...shellStyle, outer]}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={(st: any) => [...shellStyle, outer,
        st.hovered && ({ boxShadow: "0 22px 40px -26px rgba(46,70,43,0.55)", borderColor: C.line } as any),
        st.focused && s.focus, { transform: [{ scale: st.pressed ? 0.985 : 1 }, { translateY: st.hovered && !st.pressed ? -3 : 0 }] },
        tx("transform, box-shadow, border-color", 420), web && ({ cursor: "pointer" } as any)]}>
      {body}
    </Pressable>
  );
}

/** Status pill (tinted fill + icon) or a quiet outlined tag for descriptive labels. */
export function Badge({ label, tone = "neutral", icon }: { label: string; tone?: "neutral" | "ok" | "warn" | "danger" | "sage"; icon?: IconName }) {
  if (tone === "neutral") {
    return (
      <View style={[s.tag]}>
        <Text style={s.tagText}>{label}</Text>
      </View>
    );
  }
  const [bg, fg] = { ok: [C.okBg, C.ok], warn: [C.warnBg, C.warn], danger: [C.dangerBg, C.danger], sage: [C.sageSoft, C.deep] }[tone];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={12} color={fg} weight="bold" /> : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} />}
      <Text style={[s.badgeText, { color: fg }]}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
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

// Avatars get one of four tones from the name so lists don't look cloned.
const AV = [["#789575", "#F7F8EE"], ["#3E5A3B", "#E5E8CE"], ["#C9D3A8", "#2F3C2C"], ["#A9B98F", "#24311F"]];
export function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  const [bg, fg] = AV[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length]!;
  return (
    <View accessibilityLabel={name} style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: "center", justifyContent: "center",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" } as any}>
      <Text style={{ fontFamily: F.display, color: fg, fontSize: size * 0.38, letterSpacing: 0.5 }}>{initials(name)}</Text>
    </View>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Reveal style={{ gap: 14, marginTop: 34 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Row gap={10}>
          <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: C.sage }} />
          <T v="h3" role="heading">{title}</T>
        </Row>
        {action ? <View style={{ alignSelf: "center" }}>{action}</View> : null}
      </Row>
      {children}
    </Reveal>
  );
}

export function Empty({ icon = "leaf", text }: { icon?: IconName; text: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 32, paddingHorizontal: 20, gap: 12, borderRadius: R.lg, borderWidth: 1, borderStyle: "dashed", borderColor: C.line, backgroundColor: "rgba(255,255,255,0.25)" }}>
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
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop variant="quiet" />
      <View style={{ padding: 20, paddingTop: 72, gap: 14, width: "100%", maxWidth: 980, alignSelf: "center" }} accessibilityLabel="Loading…" accessibilityRole="progressbar">
        <Animated.View style={{ opacity: v, gap: 14 }}>
          <View style={{ height: 34, width: "55%", borderRadius: R.sm, backgroundColor: C.bgDeep }} />
          {Array.from({ length: rows }).map((_, i) => <View key={i} style={{ height: 96, borderRadius: R.xl, backgroundColor: C.bgDeep }} />)}
        </Animated.View>
      </View>
    </View>
  );
}

export function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <Row style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, marginTop: 8 }}>
      <View style={{ flex: 1, gap: 10, minWidth: 0 }}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <T v="h1">{title}</T>
      </View>
      {right ? <View style={{ alignSelf: "center" }}>{right}</View> : null}
    </Row>
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
      <Icon name="star" size={14} color={C.star} weight="fill" />
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
  screenInner: { paddingHorizontal: 20, paddingTop: 12, width: "100%", maxWidth: 1040, alignSelf: "center" },
  display: { fontFamily: F.display, fontSize: 60, lineHeight: 62, color: C.sage, textTransform: "uppercase", letterSpacing: -0.5 },
  h1: { fontFamily: F.regular, fontSize: 34, lineHeight: 40, color: C.ink, letterSpacing: -1 },
  h2: { fontFamily: F.medium, fontSize: 22, lineHeight: 28, color: C.ink, letterSpacing: -0.4 },
  h3: { fontFamily: F.semi, fontSize: 18, lineHeight: 24, color: C.ink, letterSpacing: -0.2 },
  body: { fontFamily: F.regular, fontSize: 16, lineHeight: 25, color: C.ink },
  strong: { fontFamily: F.semi, fontSize: 16, lineHeight: 22, color: C.ink },
  small: { fontFamily: F.regular, fontSize: 14, lineHeight: 21, color: C.muted },
  label: { fontFamily: F.semi, fontSize: 11, letterSpacing: 2, color: C.ink, textTransform: "uppercase" },
  eyebrowText: { fontFamily: F.medium, fontSize: 11, letterSpacing: 2.2, textTransform: "uppercase", color: C.ink },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: R.pill, paddingLeft: 24, paddingRight: 8, minHeight: 52, alignSelf: "flex-start" },
  btnSmall: { minHeight: 40, paddingLeft: 16, paddingRight: 6, gap: 8 },
  btnText: { fontFamily: F.medium, fontSize: 16, letterSpacing: -0.1 },
  island: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  focus: { outlineWidth: 2, outlineStyle: "solid", outlineColor: C.sage, outlineOffset: 2 } as any,
  cardCore: { padding: 18, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" } as any,
  badge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: R.xs, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { fontFamily: F.semi, fontSize: 12, letterSpacing: 0.2 },
  tag: { borderRadius: R.xs, borderWidth: 1, borderColor: C.line, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.35)" },
  tagText: { fontFamily: F.medium, fontSize: 12.5, color: C.ink },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: R.sm, borderWidth: 1, borderColor: C.line, paddingHorizontal: 13, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.5)", minHeight: 38 },
  chipText: { fontFamily: F.medium, fontSize: 14, color: C.ink },
  inputLabel: { fontFamily: F.medium, fontSize: 14, color: C.ink },
  input: { backgroundColor: "rgba(255,255,255,0.6)", borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, fontFamily: F.regular, color: C.ink },
  iconCircle: { borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
