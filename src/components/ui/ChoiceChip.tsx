import { Pressable, Text, View, useWindowDimensions } from "react-native";

interface ChoiceChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: "neon" | "gold";
  surface?: "dark" | "light";
  compact?: boolean;
}

export function ChoiceChip({
  label,
  active = false,
  onPress,
  tone = "neon",
  surface = "dark",
  compact = false,
}: ChoiceChipProps) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 420;
  const safeLabel = label.replace("Casa e fora", "Casa e\u00A0fora");

  const palette =
    surface === "light"
      ? tone === "gold"
        ? {
            activeBorder: "rgba(214,161,29,0.30)",
            activeBackground: "#FFF5D6",
            activeInner: "#FFF9E9",
            activeText: "#845A00",
            inactiveBorder: "rgba(59,91,255,0.12)",
            inactiveBackground: "#F8FAFF",
            inactiveInner: "#FFFFFF",
            inactiveText: "#42557D",
          }
        : {
            activeBorder: "rgba(59,91,255,0.24)",
            activeBackground: "#EAF1FF",
            activeInner: "#F7FAFF",
            activeText: "#2447A6",
            inactiveBorder: "rgba(59,91,255,0.12)",
            inactiveBackground: "#F8FAFF",
            inactiveInner: "#FFFFFF",
            inactiveText: "#42557D",
          }
      : tone === "gold"
        ? {
            activeBorder: "rgba(255,215,120,0.42)",
            activeBackground: "rgba(255,215,120,0.12)",
            activeInner: "rgba(255,244,216,0.08)",
            activeText: "#FFE6A3",
            inactiveBorder: "rgba(255,255,255,0.14)",
            inactiveBackground: "rgba(10,17,34,0.92)",
            inactiveInner: "rgba(255,255,255,0.02)",
            inactiveText: "#AEBBDA",
          }
        : {
            activeBorder: "rgba(59,91,255,0.40)",
            activeBackground: "rgba(59,91,255,0.18)",
            activeInner: "rgba(255,255,255,0.06)",
            activeText: "#D7E5FF",
            inactiveBorder: "rgba(255,255,255,0.14)",
            inactiveBackground: "rgba(10,17,34,0.92)",
            inactiveInner: "rgba(255,255,255,0.02)",
            inactiveText: "#AEBBDA",
          };

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-full border active:opacity-85"
      style={{
        borderColor: active ? palette.activeBorder : palette.inactiveBorder,
        backgroundColor: active ? palette.activeBackground : palette.inactiveBackground,
      }}
    >
      <View
        className="flex-row items-center gap-2 rounded-full px-4 py-3"
        style={{
          backgroundColor: active ? palette.activeInner : palette.inactiveInner,
          paddingHorizontal: compact ? 10 : isSmallPhone ? 14 : 16,
          paddingVertical: compact ? 7 : isSmallPhone ? 10 : 12,
        }}
      >
        {active ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: tone === "gold" ? "#E9B334" : "#3B5BFF",
            }}
          />
        ) : null}

        <Text
          numberOfLines={1}
          className="font-semibold"
          style={
            {
              color: active ? palette.activeText : palette.inactiveText,
              fontSize: compact ? 13 : isSmallPhone ? 14 : 15,
              flexShrink: 0,
              whiteSpace: "nowrap",
              wordBreak: "keep-all",
            } as any
          }
        >
          {safeLabel}
        </Text>
      </View>
    </Pressable>
  );
}
