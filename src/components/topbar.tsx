// Desktop navigation: a floating island bar with a menu button that morphs into an X and opens
// a dropdown of the role's sections. Replaces the bottom tab bar on wide screens.
import { router, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { C, F, R, nest } from "@/lib/theme";
import { Icon, type IconName } from "./icon";
import { Avatar, EASE } from "./ui";
import { Logo } from "./logo";

export type NavItem = { name: string; title: string; icon: IconName };
const web = Platform.OS === "web";
const tx = (p: string, ms = 220) => (web ? ({ transitionProperty: p, transitionDuration: `${ms}ms`, transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" } as any) : null);

export function TopBar({ base, items }: { base: string; items: NavItem[] }) {
  const path = usePathname();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: open ? 1 : 0, duration: 320, easing: EASE, useNativeDriver: false }).start(); }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!web || !open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const hrefOf = (n: string) => (n === "index" ? base : `${base}/${n}`);
  const active = items.find((t) => hrefOf(t.name) === path) ?? items[0]!;
  const go = (href: string) => { setOpen(false); router.push(href as any); };

  const links: { key: string; label: string; icon: IconName; onPress: () => void; on?: boolean }[] = [
    ...items.map((t) => ({ key: t.name, label: t.title, icon: t.icon, on: t.name === active.name, onPress: () => go(hrefOf(t.name)) })),
  ];
  const extra: typeof links = [
    { key: "app", label: "Get the App", icon: "download" as IconName, onPress: () => go("/download") },
    { key: "privacy", label: "Privacy Policy", icon: "lock" as IconName, onPress: () => go("/privacy") },
    { key: "terms", label: "Terms of Service", icon: "scales" as IconName, onPress: () => go("/terms") },
    { key: "out", label: "Sign Out", icon: "sign-out" as IconName, onPress: async () => { setOpen(false); await supabase.auth.signOut(); router.replace("/login"); } },
  ];

  const BAR = R.pill, PANEL = R.lg, PANEL_PAD = 6;

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4, zIndex: 50, backgroundColor: "transparent" }}>
      {open ? (
        <Pressable accessibilityLabel="Close menu" onPress={() => setOpen(false)}
          style={{ position: web ? ("fixed" as any) : "absolute", top: 0, left: 0, right: 0, bottom: 0, height: web ? undefined : 4000, zIndex: 1 }} />
      ) : null}
      <View style={{ width: "100%", maxWidth: 1040, alignSelf: "center", zIndex: 2 }}>
        <View style={[{ height: 60, borderRadius: BAR, flexDirection: "row", alignItems: "center", paddingLeft: 18, paddingRight: 6, gap: 14,
          backgroundColor: "rgba(247,248,238,0.78)", borderWidth: 1, borderColor: C.lineSoft },
          web && ({ backdropFilter: "blur(16px) saturate(140%)", WebkitBackdropFilter: "blur(16px) saturate(140%)", boxShadow: "0 14px 40px -26px rgba(46,70,43,0.5)" } as any)]}>
          <Logo height={26} href={base} />
          <View style={{ width: 1, height: 22, backgroundColor: C.line }} />
          <Icon name={active.icon} size={18} color={C.muted} />
          <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>{active.title}</Text>
          <View style={{ flex: 1 }} />
          {profile ? <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.muted }}>{profile.name}</Text> : null}
          <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityLabel={open ? "Close menu" : "Open menu"}
            accessibilityState={{ expanded: open }}
            style={(st: any) => [{ flexDirection: "row", alignItems: "center", gap: 10, height: 46, paddingLeft: 6, paddingRight: 16, borderRadius: BAR,
              backgroundColor: open ? C.deep : st.hovered ? C.tintStrong : C.tint }, { transform: [{ scale: st.pressed ? 0.96 : 1 }] }, tx("background-color, transform")]}>
            {profile ? <Avatar name={profile.name} size={34} /> : null}
            <View style={{ width: 20, height: 20 }}>
              <Animated.View style={{ position: "absolute", opacity: a.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ rotate: a.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] }) }] }}>
                <Icon name="menu" size={20} color={C.ink} weight="regular" />
              </Animated.View>
              <Animated.View style={{ position: "absolute", opacity: a, transform: [{ rotate: a.interpolate({ inputRange: [0, 1], outputRange: ["-90deg", "0deg"] }) }] }}>
                <Icon name="close" size={20} color={C.paper} weight="regular" />
              </Animated.View>
            </View>
          </Pressable>
        </View>

        {/* dropdown: tray radius 20, padding 6, item radius 14 */}
        <Animated.View pointerEvents={open ? "auto" : "none"}
          style={[{ position: "absolute", top: 68, right: 0, width: 300, padding: PANEL_PAD, borderRadius: PANEL, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line,
            opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }, { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] },
            web && ({ boxShadow: "0 30px 60px -30px rgba(23,33,19,0.45), 0 2px 6px rgba(23,33,19,0.06)", transformOrigin: "top right" } as any)]}>
          {[...links, null, ...extra].map((l, i) => l === null ? (
            <View key="div" style={{ height: 1, backgroundColor: C.lineSoft, marginVertical: 6, marginHorizontal: 8 }} />
          ) : (
            <Animated.View key={l.key} style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [6 + i * 3, 0] }) }] }}>
              <Pressable onPress={l.onPress} accessibilityRole="menuitem"
                style={(st: any) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: nest(PANEL, PANEL_PAD) },
                  l.on ? { backgroundColor: C.tintStrong } : st.hovered && { backgroundColor: C.tint }, tx("background-color")]}>
                {(st: any) => (
                  <>
                    <Icon name={l.icon} size={18} color={l.on ? C.deep : C.ink} weight={l.on ? "fill" : "light"} />
                    <Text style={{ flex: 1, fontFamily: l.on ? F.semi : F.medium, fontSize: 15, color: C.ink }}>{l.label}</Text>
                    <View style={[{ opacity: st.hovered || l.on ? 1 : 0, transform: [{ translateX: st.hovered ? 0 : -4 }] }, tx("opacity, transform")]}>
                      <Icon name="arrow-right" size={14} color={C.muted} />
                    </View>
                  </>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}
