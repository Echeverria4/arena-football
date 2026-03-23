import { Pressable, Text } from "react-native";

interface ChoiceChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: "neon" | "gold";
}

export function ChoiceChip({ label, active = false, onPress, tone = "neon" }: ChoiceChipProps) {
  const palette =
    tone === "gold"
      ? {
          activeBorder: "#BCC1C7",
          activeBackground: "#EEF1F3",
          inactiveBorder: "#D7DBE0",
          inactiveBackground: "#FFFFFF",
        }
      : {
          activeBorder: "#C3C8CE",
          activeBackground: "#F1F4F6",
          inactiveBorder: "#D7DBE0",
          inactiveBackground: "#FFFFFF",
        };

  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-4 py-3"
      style={{
        borderColor: active ? palette.activeBorder : palette.inactiveBorder,
        backgroundColor: active ? palette.activeBackground : palette.inactiveBackground,
      }}
    >
      <Text
        className="text-base font-semibold"
        style={{ color: active ? "#50565D" : "#6F757C" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
