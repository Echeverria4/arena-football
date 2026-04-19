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
import { ElectricBorderLayer } from "@/components/ui/ElectricBorderLayer";
import { CardLightningLayer } from "@/components/ui/CardLightningLayer";
import { getTeamInitials, normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";
import type { TitleLeaderboardEntry } from "@/lib/championship-history";

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
  titleLeaders?: TitleLeaderboardEntry[];
};

const stepPalette = {
  1: {
    accent: "#FFD76A",
    surface: "rgba(20, 12, 12, 0.88)",
    border: "rgba(255, 199, 94, 0.28)",
    text: "#FFF7D4",
    icon: "trophy-outline" as const,
    electricAccent: "gold" as const,
  },
  2: {
    accent: "#C8D8F8",
    surface: "rgba(18, 13, 15, 0.88)",
    border: "rgba(180, 210, 255, 0.28)",
    text: "#F5F8FF",
    icon: "ribbon-outline" as const,
    electricAccent: "silver" as const,
  },
  3: {
    accent: "#CD7838",
    surface: "rgba(20, 12, 12, 0.88)",
    border: "rgba(205, 125, 55, 0.28)",
    text: "#FFF2E7",
    icon: "medal-outline" as const,
    electricAccent: "bronze" as const,
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
  const flipBackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const palette = stepPalette[entry.position];
  const crest = resolveTeamVisualByName(normalizeTeamDisplayName(entry.teamName));

  function showBack() {
    if (flipBackTimer.current) clearTimeout(flipBackTimer.current);
    setHovered(true);
  }
  function hideBackDelayed() {
    if (flipBackTimer.current) clearTimeout(flipBackTimer.current);
    flipBackTimer.current = setTimeout(() => setHovered(false), 4000);
  }
  function hideBackNow() {
    if (flipBackTimer.current) clearTimeout(flipBackTimer.current);
    setHovered(false);
  }

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
      onHoverIn={showBack}
      onHoverOut={hideBackNow}
      onPressIn={showBack}
      onPressOut={hideBackDelayed}
      className="active:opacity-95"
      style={{ flex: 1 }}
    >
      <View
        style={{
          minHeight: orderedHeight + (compact ? 20 : 28),
          justifyContent: "flex-end",
        }}
      >
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
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: palette.border,
                  overflow: "hidden",
                }}
              >
                {crest ? (
                  <Image source={{ uri: crest }} style={{ width: "90%", height: "90%" }} resizeMode="contain" />
                ) : (
                  <Ionicons name={palette.icon} size={compact ? 26 : 32} color={palette.accent} />
                )}
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
                  <Image source={{ uri: crest }} style={{ width: "90%", height: "90%" }} resizeMode="contain" />
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

              <View style={{ alignItems: "center", gap: 2 }}>
                {[
                  { label: "Pontos", value: `${entry.points}` },
                  { label: "Vitórias", value: `${entry.wins}` },
                  { label: "Saldo", value: `${entry.goalDifference >= 0 ? "+" : ""}${entry.goalDifference}` },
                ].map(({ label, value }) => (
                  <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ color: "rgba(216,222,235,0.50)", fontSize: compact ? 9 : 10, fontWeight: "700", letterSpacing: 0.5 }}>
                      {label}
                    </Text>
                    <Text style={{ color: "#D8DEEB", fontSize: compact ? 11 : 12, fontWeight: "800" }}>
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Electric border — 1st place only */}
          {entry.position === 1 ? <ElectricBorderLayer accent={palette.electricAccent} radius={18} inset={0} /> : null}

          {/* Lightning bolts — 1st place only, also contained within card */}
          {entry.position === 1 ? <CardLightningLayer compact={compact} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function SeasonPodiumBoard({ title, subtitle, entries, titleLeaders }: Props) {
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

        {titleLeaders && titleLeaders.length > 0 ? (
          <View style={{ gap: 8 }}>
            <View style={{ height: 1, backgroundColor: "rgba(255,215,106,0.18)" }} />
            <Text
              style={{
                color: "#FFD76A",
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 2.2,
                textTransform: "uppercase",
              }}
            >
              Histórico de campeões
            </Text>
            {titleLeaders.map((leader, index) => (
              <View
                key={leader.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: index === 0 ? "rgba(255,215,106,0.07)" : "rgba(255,255,255,0.03)",
                  borderWidth: 1,
                  borderColor: index === 0 ? "rgba(255,215,106,0.20)" : "rgba(255,255,255,0.06)",
                }}
              >
                <Text style={{ fontSize: compact ? 16 : 18, minWidth: 22, textAlign: "center" }}>
                  {["🥇", "🥈", "🥉"][index] ?? "🏅"}
                </Text>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: index === 0 ? "#FFD76A" : "#F3F7FF",
                      fontSize: compact ? 13 : 14,
                      fontWeight: "900",
                    }}
                  >
                    {leader.label}
                  </Text>
                  {leader.phone ? (
                    <Text
                      style={{
                        color: "rgba(216,222,235,0.45)",
                        fontSize: compact ? 10 : 11,
                        fontWeight: "600",
                        letterSpacing: 0.4,
                      }}
                    >
                      {leader.phone}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={{
                    borderRadius: 8,
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    backgroundColor: index === 0 ? "rgba(255,215,106,0.14)" : "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor: index === 0 ? "rgba(255,215,106,0.28)" : "rgba(255,255,255,0.08)",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: index === 0 ? "#FFD76A" : "#94A3B8",
                      fontSize: compact ? 15 : 17,
                      fontWeight: "900",
                      lineHeight: compact ? 18 : 20,
                    }}
                  >
                    {leader.titles}
                  </Text>
                  <Text
                    style={{
                      color: index === 0 ? "#C8941A" : "#4B5E7A",
                      fontSize: 8,
                      fontWeight: "800",
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    {leader.titles === 1 ? "título" : "títulos"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </LiveBorderCard>
  );
}
