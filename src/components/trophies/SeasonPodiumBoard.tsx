import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { CardFlameLayer } from "@/components/ui/CardFlameLayer";
import { getTeamInitials, normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";

type PodiumEntry = {
  id: string;
  position: 1 | 2 | 3;
  teamName: string;
  playerName: string;
  points: number;
  wins: number;
  goalDifference: number;
  played: number;
};

type Props = {
  title: string;
  subtitle?: string;
  entries: PodiumEntry[];
};

const stepPalette = {
  1: {
    accent: "#FFD76A",
    surface: "rgba(20, 12, 12, 0.88)",
    border: "rgba(255, 199, 94, 0.42)",
    text: "#FFF7D4",
    icon: "trophy-outline" as const,
  },
  2: {
    accent: "#DFE7F6",
    surface: "rgba(18, 13, 15, 0.88)",
    border: "rgba(223, 231, 246, 0.32)",
    text: "#F5F8FF",
    icon: "ribbon-outline" as const,
  },
  3: {
    accent: "#E8A56E",
    surface: "rgba(20, 12, 12, 0.88)",
    border: "rgba(232, 165, 110, 0.34)",
    text: "#FFF2E7",
    icon: "medal-outline" as const,
  },
} as const;

function PodiumStep({
  entry,
  compact,
}: {
  entry: PodiumEntry;
  compact: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const palette = stepPalette[entry.position];
  const crest = resolveTeamVisualByName(normalizeTeamDisplayName(entry.teamName));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: hovered ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hovered, progress]);

  const frontOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const backOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const orderedHeight = entry.position === 1 ? (compact ? 188 : 220) : entry.position === 2 ? (compact ? 156 : 184) : compact ? 138 : 166;
  const safeTeamName = normalizeTeamDisplayName(entry.teamName);

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setHovered(true)}
      onPressOut={() => setHovered(false)}
      className="active:opacity-95"
      style={{ flex: 1 }}
    >
      <View
        style={{
          minHeight: orderedHeight + (compact ? 20 : 28),
          justifyContent: "flex-end",
        }}
      >
        <CardFlameLayer
          tone={entry.position === 1 ? "gold" : entry.position === 2 ? "silver" : "bronze"}
          compact={compact}
        />

        <View
          style={{
            minHeight: orderedHeight,
            borderRadius: 18,
            paddingHorizontal: compact ? 10 : 14,
            paddingVertical: compact ? 12 : 14,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.border,
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              right: 6,
              bottom: 6,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 12,
              right: 12,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.18)",
            }}
          />

          <Animated.View
            pointerEvents="none"
            style={{
              opacity: frontOpacity,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -14],
                  }),
                },
              ],
            }}
          >
            <View className="items-center gap-3">
              <Text
                style={{
                  color: palette.accent,
                  fontSize: compact ? 48 : 68,
                  fontWeight: "900",
                  lineHeight: compact ? 50 : 72,
                  textShadowColor: "rgba(255,120,12,0.26)",
                  textShadowOffset: { width: 0, height: 6 },
                  textShadowRadius: 16,
                }}
              >
                {entry.position}
              </Text>

              <View
                style={{
                  width: compact ? 68 : 80,
                  height: compact ? 68 : 80,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              >
                <Ionicons name={palette.icon} size={compact ? 26 : 32} color={palette.accent} />
              </View>

              <Text
                numberOfLines={2}
                style={{
                  color: palette.text,
                  fontSize: compact ? 14 : 16,
                  fontWeight: "900",
                  textAlign: "center",
                }}
              >
                {entry.playerName}
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              paddingHorizontal: compact ? 10 : 14,
              paddingVertical: compact ? 12 : 14,
              opacity: backOpacity,
              justifyContent: "center",
            }}
          >
            <View className="items-center gap-3">
              <View
                style={{
                  width: compact ? 58 : 70,
                  height: compact ? 58 : 70,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: palette.border,
                  overflow: "hidden",
                }}
              >
                {crest ? (
                  <Image source={{ uri: crest }} style={{ width: "72%", height: "72%" }} resizeMode="contain" />
                ) : (
                  <Text
                    style={{
                      color: palette.text,
                      fontSize: 18,
                      fontWeight: "900",
                      letterSpacing: 1.2,
                    }}
                  >
                    {getTeamInitials(safeTeamName)}
                  </Text>
                )}
              </View>

              <Text
                numberOfLines={2}
                style={{
                  color: palette.text,
                  fontSize: compact ? 13 : 15,
                  fontWeight: "900",
                  textAlign: "center",
                }}
              >
                {safeTeamName}
              </Text>

              <Text
                style={{
                  color: "#D8DEEB",
                  fontSize: compact ? 11 : 12,
                  lineHeight: compact ? 16 : 18,
                  textAlign: "center",
                }}
              >
                {entry.points} pts • {entry.wins} vit. • saldo {entry.goalDifference >= 0 ? "+" : ""}
                {entry.goalDifference}
              </Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

export function SeasonPodiumBoard({ title, subtitle, entries }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const normalizedEntries = useMemo(() => {
    const seeded: PodiumEntry[] = [1, 2, 3].map((position) => {
      const current = entries.find((item) => item.position === position);

      return (
        current ?? {
          id: `placeholder-${position}`,
          position: position as 1 | 2 | 3,
          teamName: "A definir",
          playerName: "Sem resultado",
          points: 0,
          wins: 0,
          goalDifference: 0,
          played: 0,
        }
      );
    });

    return [
      seeded.find((item) => item.position === 2)!,
      seeded.find((item) => item.position === 1)!,
      seeded.find((item) => item.position === 3)!,
    ];
  }, [entries]);

  return (
    <LiveBorderCard
      accent="gold"
      radius={18}
      padding={1.4}
      backgroundColor="#0A1018"
      contentStyle={{ paddingHorizontal: compact ? 16 : 20, paddingVertical: compact ? 18 : 22 }}
    >
      <View className="gap-5">
        <View className="gap-2">
          <Text
            style={{
              color: "#FFD76A",
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 2.8,
              textTransform: "uppercase",
            }}
          >
            Ranking da temporada
          </Text>
          <Text
            style={{
              color: "#FFF8E8",
              fontSize: compact ? 26 : 30,
              fontWeight: "900",
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                color: "#DCCFA8",
                fontSize: 15,
                lineHeight: 24,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View
          className="flex-row items-end gap-3"
          style={{
            minHeight: compact ? 190 : 230,
          }}
        >
          {normalizedEntries.map((entry) => (
            <PodiumStep key={entry.id} entry={entry} compact={compact} />
          ))}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14 }}>👆</Text>
          <Text
            style={{
              color: "#DCCFA8",
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.6,
              flex: 1,
            }}
          >
            Segure qualquer card do pódio para revelar o time e as estatísticas da posição.
          </Text>
        </View>
      </View>
    </LiveBorderCard>
  );
}
