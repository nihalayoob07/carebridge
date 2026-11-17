// Palette built in OKLCH so equal lightness reads as equal lightness across hues.
// Converted to sRGB once at load (React Native has no native oklch() support).
export function oklch(L: number, C: number, h: number, alpha = 1) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr), b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const [r, g, bl] = lin.map((x) => {
    const v = Math.min(1, Math.max(0, x));
    return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
  });
  return alpha < 1 ? `rgba(${r},${g},${bl},${alpha})` : `#${[r, g, bl].map((n) => n!.toString(16).padStart(2, "0")).join("")}`;
}

// Brand hues: paper 112, sage 142 (from #E5E8CE and #789575).
const P = 112, S = 142;

export const C = {
  bg: "#E5E8CE",                       // brand paper  = oklch(0.922 0.035 112)
  bgDeep: oklch(0.885, 0.04, P),
  card: oklch(0.95, 0.024, P),
  paper: oklch(0.975, 0.012, P),
  sage: "#789575",                     // brand green  = oklch(0.639 0.057 142)
  sageSoft: oklch(0.86, 0.045, S),
  deep: oklch(0.436, 0.06, S),         // = #3E5A3B
  deepHover: oklch(0.39, 0.06, S),
  ink: oklch(0.3, 0.028, 139),
  muted: oklch(0.5, 0.025, 130),

  // Status pairs share one lightness so none shouts louder than another.
  ok: oklch(0.45, 0.09, 145), okBg: oklch(0.9, 0.05, 145),
  warn: oklch(0.45, 0.09, 75), warnBg: oklch(0.9, 0.06, 85),
  danger: oklch(0.45, 0.12, 35), dangerBg: oklch(0.9, 0.04, 35),
  star: oklch(0.68, 0.14, 75),

  // Alpha borders blend into whatever sits underneath.
  line: "rgba(23,33,19,0.12)",
  lineSoft: "rgba(23,33,19,0.07)",
  lineStrong: "rgba(23,33,19,0.22)",
  tint: "rgba(62,90,59,0.08)",         // hover / selected wash
  tintStrong: "rgba(62,90,59,0.14)",
  onDeepMuted: oklch(0.83, 0.04, S),
};

// One radius scale. Nested shapes use inner = outer - padding.
export const R = { pill: 999, xl: 26, lg: 20, md: 14, sm: 10, xs: 6 };
export const nest = (outer: number, padding: number) => Math.max(outer - padding, 2);

export const F = {
  display: "Anton_400Regular",
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semi: "Geist_600SemiBold",
  bold: "Geist_700Bold",
};

export const CAREGIVER_TYPES: Record<string, string> = {
  nurse: "Nurse",
  care_assistant: "Care assistant",
  physio: "Physiotherapist",
  attendant: "Attendant",
};
export const CITIES = ["Kochi", "Bengaluru", "Chennai", "Mumbai", "Delhi"];
export const LANGUAGES = ["Malayalam", "Tamil", "Kannada", "Hindi", "English", "Marathi", "Telugu", "Punjabi"];
export const SKILLS = [
  "medication management", "wound care", "diabetes management", "hypertension monitoring", "post-operative care",
  "catheter care", "palliative care", "respiratory care", "elderly companionship", "mobility assistance",
  "dementia care", "personal hygiene", "meal preparation", "physiotherapy", "stroke rehabilitation",
  "parkinsons care", "fall prevention", "night care",
];
