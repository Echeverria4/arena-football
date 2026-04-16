import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, useWindowDimensions, type DimensionValue } from "react-native";

import { LiveBorderCard } from "@/components/ui/LiveBorderCard";

interface FeatureCardProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  description: string;
  meta: string;
  width?: DimensionValue;
  onPress?: () => void;
  accent?: "red" | "gold" | "blue";
}

const accentMap = {
  red: {
    icon: "#4A70E8",
    iconBg: "#EFF4FF",
    frame: "rgba(59,91,255,0.16)",
    meta: "#4E6BC1",
    cardGlow: "#3B5BFF",
    borderAccent: "blue",
  },
  gold: {
    icon: "#C38C10",
    iconBg: "#FFF5D8",
    frame: "rgba(233,179,52,0.18)",
    meta: "#A87507",
    cardGlow: "#E5B746",
    borderAccent: "gold",
  },
  blue: {
    icon: "#0F93C9",
    iconBg: "#EAF8FF",
    frame: "rgba(89,200,255,0.18)",
    meta: "#0E7CAB",
    cardGlow: "#59C8FF",
    borderAccent: "emerald",
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
  const { width: viewportWidth } = useWindowDimensions();
  const isPhone = viewportWidth < 768;
  const isSmallPhone = viewportWidth < 420;
  const styles = accentMap[accent];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="active:opacity-95 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]"
      style={{ width }}
    >
      <LiveBorderCard
        accent={styles.borderAccent}
        radius={18}
        padding={1.3}
        backgroundColor="#FFFFFF"
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: 999,
            backgroundColor: styles.frame,
            top: -56,
            right: -32,
          }}
        />

        <View
          className="gap-4"
          style={{
            minHeight: isSmallPhone ? 160 : isPhone ? 196 : 236,
            padding: isSmallPhone ? 14 : isPhone ? 18 : 24,
          }}
        >
          <View className="mb-2 flex-row items-center gap-3">
            <View
              className="items-center justify-center rounded-[20px]"
              style={{
                width: isSmallPhone ? 40 : isPhone ? 48 : 54,
                height: isSmallPhone ? 40 : isPhone ? 48 : 54,
                backgroundColor: styles.iconBg,
                borderWidth: 1,
                borderColor: styles.frame,
              }}
            >
              <Ionicons name={icon} size={isSmallPhone ? 18 : isPhone ? 22 : 26} color={styles.icon} />
            </View>

            <View className="flex-1">
              <Text
                style={{
                  fontSize: isSmallPhone ? 15 : isPhone ? 18 : 20,
                  color: "#1C2B4A",
                  fontWeight: "800",
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontSize: isSmallPhone ? 12 : isPhone ? 14 : 15,
                  color: "#6B7EA3",
                }}
              >
                {subtitle}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: "#5E7197",
              fontSize: isSmallPhone ? 13 : isPhone ? 14 : 16,
              lineHeight: isSmallPhone ? 20 : isPhone ? 22 : 27,
            }}
          >
            {description}
          </Text>

          <View className="mt-auto flex-row items-center gap-2">
            <Ionicons name="flash-outline" size={14} color={styles.meta} />
            <Text
              style={{
                color: styles.meta,
                fontSize: isSmallPhone ? 11 : 12,
                fontWeight: "800",
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              {meta}
            </Text>
          </View>
        </View>
      </LiveBorderCard>
    </Pressable>
  );
}
