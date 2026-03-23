import { Text, View } from "react-native";

interface BadgeProps {
  label: string;
  tone?: "neon" | "gold" | "muted";
}

export function Badge({ label, tone = "muted" }: BadgeProps) {
  const styles = {
    neon: {
      borderColor: "#C4C9CF",
      backgroundColor: "#F2F4F6",
      text: "#4F555D",
    },
    gold: {
      borderColor: "#BDC2C8",
      backgroundColor: "#EEF1F3",
      text: "#4F555D",
    },
    muted: {
      borderColor: "#D6DADE",
      backgroundColor: "#FFFFFF",
      text: "#5C6269",
    },
  }[tone];

  return (
    <View
      className="self-start rounded-full border px-3 py-1"
      style={{
        borderColor: styles.borderColor,
        backgroundColor: styles.backgroundColor,
      }}
    >
      <Text
        className="text-sm font-semibold uppercase tracking-[2px]"
        style={{ color: styles.text }}
      >
        {label}
      </Text>
    </View>
  );
}
