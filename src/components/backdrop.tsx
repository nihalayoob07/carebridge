// Background artwork: soft colour fields plus hand-drawn-feeling topographic contour lines.
// Static and pointer-transparent; fixed on web so it doesn't repaint while scrolling.
import { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from "react-native-svg";
import { oklch } from "@/lib/theme";

/** A closed, gently wobbling ring. Deterministic so it renders the same every time. */
function ring(cx: number, cy: number, r: number, seed: number) {
  const pts: string[] = [];
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const wob = 1 + 0.07 * Math.sin(3 * t + seed) + 0.045 * Math.sin(5 * t - seed * 1.7) + 0.025 * Math.sin(9 * t + seed * 0.6);
    const x = cx + Math.cos(t) * r * wob * 1.18;
    const y = cy + Math.sin(t) * r * wob * 0.86;
    pts.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(" ") + "Z";
}

const CONTOURS = [
  ...Array.from({ length: 9 }, (_, i) => ring(860, 140, 60 + i * 46, 1.3 + i * 0.35)),
  ...Array.from({ length: 7 }, (_, i) => ring(90, 880, 50 + i * 52, 4.1 + i * 0.4)),
];

export const Backdrop = memo(function Backdrop({ variant = "app" }: { variant?: "app" | "quiet" }) {
  const lineAlpha = variant === "quiet" ? 0.05 : 0.075;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, Platform.OS === "web" && ({ position: "fixed" } as any)]}>
      <Svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="g1" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={oklch(0.82, 0.06, 142)} stopOpacity={0.55} />
            <Stop offset="1" stopColor={oklch(0.82, 0.06, 142)} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g2" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={oklch(0.95, 0.05, 95)} stopOpacity={0.7} />
            <Stop offset="1" stopColor={oklch(0.95, 0.05, 95)} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="880" cy="120" rx="420" ry="360" fill="url(#g1)" />
        <Ellipse cx="80" cy="900" rx="460" ry="380" fill="url(#g1)" />
        <Ellipse cx="420" cy="420" rx="520" ry="420" fill="url(#g2)" />
        {CONTOURS.map((d, i) => (
          <Path key={i} d={d} fill="none" stroke={`rgba(46,70,43,${lineAlpha})`} strokeWidth={1.4} />
        ))}
      </Svg>
    </View>
  );
});
