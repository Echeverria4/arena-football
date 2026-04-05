import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, type ComponentProps } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type DimensionValue,
} from "react-native";

import { getTeamInitials } from "@/lib/team-visuals";

type Accent = "gold" | "royal" | "crimson" | "emerald";

interface WorldCupEditionCardProps {
  seasonLabel: string;
  detailLabel?: string;
  host: string;
  label?: string;
  title: string;
  headline: string;
  support: string;
  accent?: Accent;
  imageUrl?: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  footerNote?: string;
  width?: DimensionValue;
  onPress?: () => void;
}

const palettes: Record<
  Accent,
  {
    outer: [string, string, string];
    border: string;
    glow: string;
    panel: string;
    text: string;
    muted: string;
    pillBg: string;
    pillText: string;
  }
> = {
  gold: {
    outer: ["#8F5E07", "#D7A131", "#B97E16"],
    border: "rgba(255,231,163,0.44)",
    glow: "rgba(255,210,108,0.30)",
    panel: "rgba(255,248,232,0.16)",
    text: "#FFF8E8",
    muted: "#F2DCAA",
    pillBg: "rgba(255,248,232,0.16)",
    pillText: "#FFF3D4",
  },
  royal: {
    outer: ["#103B8A", "#2D6FD8", "#1A4FAF"],
    border: "rgba(173,214,255,0.42)",
    glow: "rgba(89,200,255,0.28)",
    panel: "rgba(241,251,255,0.14)",
    text: "#F1FBFF",
    muted: "#B8E7F8",
    pillBg: "rgba(241,251,255,0.14)",
    pillText: "#DFF6FF",
  },
  crimson: {
    outer: ["#7C2836", "#B24558", "#98384A"],
    border: "rgba(255,217,223,0.42)",
    glow: "rgba(255,120,140,0.26)",
    panel: "rgba(255,245,246,0.12)",
    text: "#FFF5F6",
    muted: "#FFD6DD",
    pillBg: "rgba(255,245,246,0.12)",
    pillText: "#FFF0F2",
  },
  emerald: {
    outer: ["#0F4D34", "#1C7E56", "#115B3E"],
    border: "rgba(215,255,229,0.42)",
    glow: "rgba(101,255,166,0.22)",
    panel: "rgba(240,255,247,0.12)",
    text: "#F0FFF7",
    muted: "#CCF7E1",
    pillBg: "rgba(240,255,247,0.12)",
    pillText: "#E5FFEF",
  },
};

export function WorldCupEditionCard({
  seasonLabel,
  detailLabel = "Ativa",
  host,
  label = "Featured",
  title,
  headline,
  support,
  accent = "gold",
  imageUrl,
  icon = "shield-outline",
  footerNote,
  width = "100%",
  onPress,
}: WorldCupEditionCardProps) {
  const palette = palettes[accent];
  const { width: viewportWidth } = useWindowDimensions();
  const isPhone = viewportWidth < 768;
  const [hover, setHover] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        width,
        transform: [{ translateY: hover ? -6 : 0 }, { scale: hover ? 1.02 : 1 }],
      }}
      className="active:opacity-95"
    >
      <LinearGradient
        colors={palette.outer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          minHeight: isPhone ? 470 : 520,
          borderRadius: 30,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: palette.border,
          shadowColor: "#000000",
          shadowOpacity: 0.24,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 18 },
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 18,
            right: -24,
            width: 132,
            height: 132,
            borderRadius: 999,
            backgroundColor: palette.glow,
          }}
        />

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: -18,
            bottom: -18,
            width: 118,
            height: 118,
            borderRadius: 999,
            backgroundColor: palette.glow,
            opacity: 0.72,
          }}
        />

        <View
          style={{
            flex: 1,
            margin: 10,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.panel,
            paddingHorizontal: isPhone ? 18 : 22,
            paddingVertical: isPhone ? 18 : 20,
            justifyContent: "space-between",
          }}
        >
          <View className="flex-row items-center justify-between gap-3">
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: palette.pillBg,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Text
                style={{
                  color: palette.pillText,
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </Text>
            </View>

            <Text
              style={{
                color: palette.muted,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.8,
                textTransform: "uppercase",
              }}
            >
              {host}
            </Text>
          </View>

          <View className="items-center gap-5">
            <View
              style={{
                width: isPhone ? 136 : 156,
                height: isPhone ? 164 : 188,
                borderRadius: 24,
                backgroundColor: "rgba(255,255,255,0.10)",
                borderWidth: 1,
                borderColor: palette.border,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000000",
                shadowOpacity: 0.18,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 10 },
              }}
            >
              {imageUrl && !imageFailed ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: "68%", height: "68%" }}
                  resizeMode="contain"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <View
                  className="items-center justify-center rounded-[20px]"
                  style={{
                    width: isPhone ? 88 : 96,
                    height: isPhone ? 88 : 96,
                    backgroundColor: "rgba(255,255,255,0.14)",
                    borderWidth: 1,
                    borderColor: palette.border,
                  }}
                >
                  {imageUrl ? (
                    <Text
                      style={{
                        color: palette.text,
                        fontSize: 28,
                        fontWeight: "900",
                        letterSpacing: 2,
                      }}
                    >
                      {getTeamInitials(headline)}
                    </Text>
                  ) : (
                    <Ionicons name={icon} size={isPhone ? 38 : 44} color={palette.text} />
                  )}
                </View>
              )}
            </View>

            <View className="items-center gap-2">
              <Text
                style={{
                  color: palette.text,
                  fontSize: isPhone ? 28 : 34,
                  fontWeight: "300",
                  fontStyle: "italic",
                  letterSpacing: 0.8,
                  textAlign: "center",
                }}
              >
                {title}
              </Text>

              <Text
                style={{
                  color: palette.text,
                  fontSize: isPhone ? 22 : 26,
                  fontWeight: "900",
                  textAlign: "center",
                }}
              >
                {headline}
              </Text>

              <Text
                style={{
                  color: palette.muted,
                  fontSize: isPhone ? 14 : 15,
                  lineHeight: isPhone ? 22 : 24,
                  textAlign: "center",
                }}
              >
                {support}
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row items-end justify-center gap-10">
              <View className="items-center">
                <Text
                  style={{
                    color: palette.muted,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1.8,
                    textTransform: "uppercase",
                  }}
                >
                  Temporada
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    color: palette.text,
                    fontSize: isPhone ? 28 : 34,
                    fontWeight: "300",
                  }}
                >
                  {seasonLabel}
                </Text>
              </View>

              <View className="items-center">
                <Text
                  style={{
                    color: palette.muted,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1.8,
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    color: palette.text,
                    fontSize: isPhone ? 28 : 34,
                    fontWeight: "300",
                  }}
                >
                  {detailLabel}
                </Text>
              </View>
            </View>

            <View
              className="items-center justify-center"
              style={{
                borderRadius: 14,
                paddingVertical: 10,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Text
                style={{
                  color: palette.pillText,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                }}
              >
                {footerNote ?? "Arena competitive collection"}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
