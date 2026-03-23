import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface FeatureCardProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  description: string;
  meta: string;
  width?: number | string;
  onPress?: () => void;
  accent?: "red" | "gold" | "blue";
}

const accentMap = {
  red: {
    borderColor: "#C9CDD2",
    backgroundColor: "#F2F4F6",
    icon: "#5E646C",
    meta: "#464B52",
  },
  gold: {
    borderColor: "#C1C6CC",
    backgroundColor: "#EEF1F3",
    icon: "#666C74",
    meta: "#464B52",
  },
  blue: {
    borderColor: "#CDD1D6",
    backgroundColor: "#F4F6F8",
    icon: "#707780",
    meta: "#464B52",
  },
} as const;

export function FeatureCard({
  icon,
  title,
  subtitle,
  description,
  meta,
  width = "100%",
  onPress,
  accent = "red",
}: FeatureCardProps) {
  const styles = accentMap[accent];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="rounded-[24px] border p-6 active:opacity-90 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.018]"
      style={{
        width,
        minHeight: 236,
        borderColor: "#D3D7DC",
        backgroundColor: "#FAFAFA",
        shadowColor: "#A3A8AF",
        shadowOpacity: 0.12,
        shadowRadius: 18,
      }}
    >
      <View className="mb-4 flex-row items-center gap-3">
        <View
          className="h-12 w-12 items-center justify-center rounded-full border-2"
          style={{
            borderColor: styles.borderColor,
            backgroundColor: styles.backgroundColor,
          }}
        >
          <Ionicons name={icon} size={22} color={styles.icon} />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-semibold text-[#3F454C]">{title}</Text>
          <Text className="text-base text-[#777D85]">{subtitle}</Text>
        </View>
      </View>

      <Text className="mb-4 text-base leading-7 text-[#777D85]">{description}</Text>

      <View className="mt-auto flex-row items-center gap-2">
        <Ionicons name="flash-outline" size={14} color={styles.icon} />
        <Text
          className="text-sm font-semibold uppercase tracking-[2px]"
          style={{ color: styles.meta }}
        >
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}
