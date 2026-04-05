import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View, useWindowDimensions } from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { getTeamInitials, normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";

interface RankingBarCardProps {
  rank: number;
  teamName: string;
  playerName: string;
  value: number;
  maxValue: number;
  unit?: string;
  accent?: "blue" | "gold" | "mint";
  subtitle?: string;
}

const rankPalettes = {
  blue: {
    accent: "#3B5BFF",
    fill: ["#8FB5FF", "#3B5BFF"],
    glow: "rgba(59,91,255,0.16)",
    surface: "#F4F8FF",
    border: "rgba(59,91,255,0.16)",
    softText: "#2447A6",
    text: "#1C2B4A",
    subtext: "#6B7EA3",
  },
  gold: {
    accent: "#D6A11D",
    fill: ["#FFE9A6", "#E9B334"],
    glow: "rgba(233,179,52,0.18)",
    surface: "#FFF8E8",
    border: "rgba(214,161,29,0.18)",
    softText: "#9A6A06",
    text: "#4D3410",
    subtext: "#8C6E3B",
  },
  mint: {
    accent: "#1EB980",
    fill: ["#86F0CA", "#1EB980"],
    glow: "rgba(30,185,128,0.16)",
    surface: "#F0FCF7",
    border: "rgba(30,185,128,0.16)",
    softText: "#157A57",
    text: "#173A34",
    subtext: "#5A7B74",
  },
} as const;

function resolveMedal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function getRankLabel(rank: number) {
  return `${rank}°`;
}

export function RankingBarCard({
  rank,
  teamName,
  playerName,
  value,
  maxValue,
  unit = "pts",
  accent = "blue",
  subtitle,
}: RankingBarCardProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const palette = rankPalettes[accent];
  const normalizedTeamName = normalizeTeamDisplayName(teamName);
  const teamVisual = resolveTeamVisualByName(normalizedTeamName);
  const initials = getTeamInitials(normalizedTeamName || playerName || teamName);
  const hasProgress = maxValue > 0;
  const rawProgress = hasProgress ? Math.min(1, value / Math.max(maxValue, 1)) : 0;
  const progress = rawProgress > 0 ? Math.max(0.12, rawProgress) : 0;
  const metricLabel = hasProgress ? `Lider com ${maxValue} ${unit}` : "Sem marca registrada";
  const displayUnit = unit.length <= 4 ? unit.toUpperCase() : unit;

  return (
    <GlassCard
      className="gap-4"
      style={{
        position: "relative",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: "#FFFFFF",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -38,
          right: -26,
          width: 144,
          height: 144,
          borderRadius: 999,
          backgroundColor: palette.glow,
          opacity: 0.9,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: palette.surface,
          opacity: 0.72,
        }}
      />

      <View className="flex-row items-center gap-3">
        <View style={{ position: "relative" }}>
          <View
            className="items-center justify-center rounded-2xl"
            style={{
              width: isPhone ? 56 : 62,
              height: isPhone ? 56 : 62,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: palette.accent,
              overflow: "hidden",
            }}
          >
            {teamVisual ? (
              <Image
                source={{ uri: teamVisual }}
                resizeMode="cover"
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <View
                className="items-center justify-center"
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: palette.glow,
                }}
              >
                <Text
                  style={{
                    color: palette.softText,
                    fontSize: isPhone ? 16 : 18,
                    fontWeight: "900",
                    letterSpacing: 0.8,
                  }}
                >
                  {initials}
                </Text>
              </View>
            )}
          </View>

          <View
            className="items-center justify-center rounded-full"
            style={{
              position: "absolute",
              right: -6,
              bottom: -6,
              minWidth: 28,
              height: 28,
              paddingHorizontal: 6,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: palette.accent,
            }}
          >
            <Text style={{ fontSize: 15 }}>{resolveMedal(rank)}</Text>
          </View>
        </View>

        <View className="flex-1 gap-1">
          <Text
            numberOfLines={1}
            style={{
              color: palette.text,
              fontSize: isPhone ? 18 : 20,
              fontWeight: "800",
            }}
          >
            {normalizedTeamName}
          </Text>
          <Text numberOfLines={1} style={{ color: palette.subtext, fontSize: 14, fontWeight: "700" }}>
            {playerName}
          </Text>
          {subtitle ? (
            <Text numberOfLines={2} style={{ color: palette.subtext, fontSize: 13, lineHeight: 18 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View
          className="items-center justify-center rounded-2xl"
          style={{
            minWidth: isPhone ? 68 : 74,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Text
            style={{
              color: palette.accent,
              fontSize: isPhone ? 24 : 28,
              fontWeight: "900",
              lineHeight: isPhone ? 28 : 32,
            }}
          >
            {value}
          </Text>
          <Text
            style={{
              color: palette.softText,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {displayUnit}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <View
          className="rounded-full"
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: palette.glow,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Text
            style={{
              color: palette.softText,
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {getRankLabel(rank)}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            color: palette.subtext,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {metricLabel}
        </Text>
      </View>

      <View
        style={{
          height: isPhone ? 16 : 18,
          borderRadius: 999,
          backgroundColor: "#EFF3FB",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(59,91,255,0.10)",
          justifyContent: "center",
        }}
      >
        {progress > 0 ? (
          <LinearGradient
            colors={palette.fill}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: 999,
            }}
          />
        ) : null}

        {!hasProgress ? (
          <Text
            style={{
              position: "absolute",
              alignSelf: "center",
              color: palette.subtext,
              fontSize: 10,
              fontWeight: "800",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Sem pontuacao ainda
          </Text>
        ) : null}
      </View>
    </GlassCard>
  );
}
