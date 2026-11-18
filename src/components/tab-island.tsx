// Floating tab island with a sliding pill.
// The pill's two edges are separate springs: the edge leading the move is stiffer than the trailing one,
// so the pill stretches while travelling and settles with a slight overshoot (damping ratio about 0.55).
// No fixed heights: the island fits icon + label, then floats above the home indicator.
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F } from "@/lib/theme";
import { Icon, type IconName } from "./icon";

export type IslandTab = { name: string; title: string; icon: IconName };

const web = Platform.OS === "web";
const PAD = 6;           // island inner padding; pill radius = island radius - PAD (nested radius rule)
const RADIUS = 30;
const LEAD = { stiffness: 260, damping: 18 };  // zeta = 18 / (2 * sqrt(260)) ~ 0.56
const TRAIL = { stiffness: 140, damping: 13 }; // zeta ~ 0.55, slower: produces the stretch

/** Space screens leave at the bottom so content never hides under the island. */
export const ISLAND_CLEARANCE = 112;

let reduce = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { reduce = v; }).catch(() => {});

export function TabIsland({ state, emitter, navigateToTab, tabs }: {
  state: any; emitter: any; navigateToTab: (key: string) => void; tabs: IslandTab[];
}) {
  const insets = useSafeAreaInsets();
  const routes: any[] = state.routes.filter((r: any) => tabs.some((t) => t.name === r.name));
  const active = Math.max(0, routes.findIndex((r) => r.key === state.routes[state.index]?.key));
  const [w, setW] = useState(0);
  const itemW = w ? (w - PAD * 2) / routes.length : 0;
  const left = useRef(new Animated.Value(0)).current;
  const right = useRef(new Animated.Value(0)).current;
  const prev = useRef(active);
  const placed = useRef(false);

  useEffect(() => {
    if (!itemW) return;
    const toL = PAD + active * itemW, toR = PAD + (active + 1) * itemW;
    if (!placed.current || reduce) {
      left.setValue(toL); right.setValue(toR); placed.current = true; prev.current = active; return;
    }
    const goingRight = active > prev.current;
    prev.current = active;
    Animated.parallel([
      Animated.spring(left, { toValue: toL, ...(goingRight ? TRAIL : LEAD), mass: 1, useNativeDriver: false }),
      Animated.spring(right, { toValue: toR, ...(goingRight ? LEAD : TRAIL), mass: 1, useNativeDriver: false }),
    ]).start();
  }, [active, itemW]);

  const bottom = web ? ("calc(12px + env(safe-area-inset-bottom))" as any) : 12 + insets.bottom;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom, alignItems: "center", paddingHorizontal: 14 }}>
      <View accessibilityRole="tablist" onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={[{ width: "100%", maxWidth: 460, flexDirection: "row", padding: PAD, borderRadius: RADIUS,
          backgroundColor: "rgba(247,248,238,0.86)", borderWidth: 1, borderColor: C.line },
          web ? ({ backdropFilter: "blur(18px) saturate(150%)", WebkitBackdropFilter: "blur(18px) saturate(150%)",
            boxShadow: "0 18px 40px -18px rgba(23,33,19,0.45), 0 2px 6px rgba(23,33,19,0.08)" } as any)
            : { shadowColor: "#17210f", shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 }]}>
        {/* sliding pill */}
        {itemW ? (
          <Animated.View pointerEvents="none" style={{ position: "absolute", top: PAD, bottom: PAD, left,
            width: Animated.subtract(right, left), borderRadius: RADIUS - PAD, backgroundColor: C.deep }} />
        ) : null}
        {routes.map((route, i) => {
          const t = tabs.find((x) => x.name === route.name)!;
          const focused = i === active;
          const color = focused ? C.paper : C.muted;
          return (
            <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={t.title}
              onPress={() => {
                const e = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !e?.defaultPrevented) navigateToTab(route.key);
              }}
              style={(st: any) => ({ flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 8, minHeight: 54,
                borderRadius: RADIUS - PAD, transform: [{ scale: st.pressed ? 0.92 : 1 }],
                ...(web ? { transitionProperty: "transform", transitionDuration: "180ms", cursor: "pointer" } : {}) })}>
              <Icon name={t.icon} color={color} size={22} weight={focused ? "fill" : "regular"} />
              <Text numberOfLines={1} style={[{ fontFamily: focused ? F.semi : F.medium, fontSize: 11.5, lineHeight: 15, color },
                web ? ({ transitionProperty: "color", transitionDuration: "200ms" } as any) : null]}>{t.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
