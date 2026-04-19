import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type LiveBorderAccent = "blue" | "gold" | "emerald" | "crimson" | "silver" | "bronze";

type Props = {
  children: ReactNode;
  accent?: LiveBorderAccent;
  radius?: number;
  padding?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

const accentPalette: Record<
  LiveBorderAccent,
  { border: [string, string, string]; frame: string; glow: string }
> = {
  blue:    { border: ["rgba(69,115,255,0.0)", "rgba(88,142,255,0.95)", "rgba(69,115,255,0.0)"],  frame: "rgba(59,91,255,0.16)",   glow: "rgba(59,91,255,0.18)" },
  gold:    { border: ["rgba(255,205,86,0.0)", "rgba(255,203,102,0.96)", "rgba(255,205,86,0.0)"], frame: "rgba(233,179,52,0.18)",  glow: "rgba(233,179,52,0.18)" },
  emerald: { border: ["rgba(87,255,124,0.0)", "rgba(118,255,169,0.94)", "rgba(87,255,124,0.0)"], frame: "rgba(87,255,124,0.18)",  glow: "rgba(87,255,124,0.16)" },
  crimson: { border: ["rgba(236,88,124,0.0)", "rgba(255,112,148,0.95)", "rgba(236,88,124,0.0)"], frame: "rgba(212,79,98,0.20)",   glow: "rgba(212,79,98,0.14)" },
  silver:  { border: ["rgba(136,170,204,0.0)", "rgba(180,210,255,0.94)", "rgba(136,170,204,0.0)"], frame: "rgba(136,170,204,0.18)", glow: "rgba(136,170,204,0.16)" },
  bronze:  { border: ["rgba(176,104,40,0.0)", "rgba(210,140,70,0.94)", "rgba(176,104,40,0.0)"],  frame: "rgba(176,104,40,0.18)",  glow: "rgba(176,104,40,0.16)" },
};

export function LiveBorderCard({
  children,
  accent = "blue",
  radius = 18,
  padding = 1.5,
  backgroundColor = "#FFFFFF",
  style,
  contentStyle,
}: Props) {
  const palette = accentPalette[accent];

  return (
    <View
      style={[
        {
          position: "relative",
          borderRadius: radius,
          padding,
          overflow: "hidden",
          backgroundColor: palette.frame,
          shadowColor: palette.glow,
          shadowOpacity: 0.16,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={palette.border}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0, opacity: 0.32 }}
        pointerEvents="none"
      />

      <View
        style={{ position: "absolute", inset: 0, borderRadius: radius, backgroundColor: palette.glow, opacity: 0.04 }}
        pointerEvents="none"
      />

      <View
        style={[
          { borderRadius: Math.max(radius - padding, 0), overflow: "hidden", backgroundColor, borderWidth: 1, borderColor: palette.frame },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
