import { Text, View, useWindowDimensions } from "react-native";

interface BadgeProps {
  label: string;
  tone?: "neon" | "gold" | "muted" | "royal";
}

export function Badge({ label, tone = "muted" }: BadgeProps) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 420;

  const styles = {
    neon: {
      borderColor: "rgba(59,91,255,0.35)",
      backgroundColor: "rgba(59,91,255,0.12)",
      text: "#9AB8FF",
    },
    gold: {
      borderColor: "rgba(255,215,120,0.35)",
      backgroundColor: "rgba(255,215,120,0.12)",
      text: "#FFD77A",
    },
    muted: {
      borderColor: "rgba(255,255,255,0.15)",
      backgroundColor: "rgba(255,255,255,0.05)",
      text: "#AEBBDA",
    },
    royal: {
      borderColor: "rgba(154,184,255,0.32)",
      backgroundColor: "rgba(154,184,255,0.14)",
      text: "#E3EDFF",
    },
  }[tone];

  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: styles.borderColor,
        backgroundColor: styles.backgroundColor,
        paddingHorizontal: isSmallPhone ? 10 : 12,
        paddingVertical: isSmallPhone ? 5 : 6,
      }}
    >
      <Text
        style={{
          color: styles.text,
          fontSize: isSmallPhone ? 11 : 12,
          fontWeight: "700",
          letterSpacing: isSmallPhone ? 1.2 : 1.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
