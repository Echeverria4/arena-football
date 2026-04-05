import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type DimensionValue,
} from "react-native";

import { CardFlameLayer } from "@/components/ui/CardFlameLayer";
import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { getTeamInitials, normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";

type Accent = "blue" | "gold" | "emerald";

type Props = {
  seasonLabel: string;
  tournamentName: string;
  championLabel: string;
  teamName: string;
  playerName: string;
  summary: string;
  statusLabel: string;
  statLine: Array<{ label: string; value: string }>;
  width?: DimensionValue;
  accent?: Accent;
  onPress?: () => void;
  actionLabel?: string;
};

const paletteMap = {
  blue: {
    frame: "blue" as const,
    fireTone: "silver" as const,
    shellGradient: ["#061220", "#102447", "#1A090A"] as const,
    accent: "#9AB8FF",
    text: "#FFF6EF",
    muted: "#D5DDF2",
    seasonBg: "rgba(96,142,255,0.18)",
    seasonBorder: "rgba(96,142,255,0.28)",
    seasonText: "#9AB8FF",
    statusBg: "rgba(255,255,255,0.06)",
    statusBorder: "rgba(255,255,255,0.10)",
    statusText: "#BFD0F7",
    iconGlow: "rgba(92,134,255,0.18)",
    iconBorder: "rgba(154,184,255,0.32)",
    statBorder: "rgba(132,170,255,0.22)",
    bottomGlow: "rgba(255,102,18,0.16)",
    veil: "rgba(7,12,18,0.74)",
  },
  gold: {
    frame: "gold" as const,
    fireTone: "gold" as const,
    shellGradient: ["#120606", "#261109", "#090405"] as const,
    accent: "#FFD76A",
    text: "#FFF6E8",
    muted: "#E6CDA7",
    seasonBg: "rgba(255,216,115,0.18)",
    seasonBorder: "rgba(255,216,115,0.28)",
    seasonText: "#FFD76A",
    statusBg: "rgba(255,255,255,0.06)",
    statusBorder: "rgba(255,255,255,0.10)",
    statusText: "#F0DFC4",
    iconGlow: "rgba(255,175,74,0.18)",
    iconBorder: "rgba(255,215,106,0.34)",
    statBorder: "rgba(255,182,88,0.20)",
    bottomGlow: "rgba(255,122,20,0.22)",
    veil: "rgba(16,8,10,0.76)",
  },
  emerald: {
    frame: "emerald" as const,
    fireTone: "bronze" as const,
    shellGradient: ["#07120F", "#12231A", "#150807"] as const,
    accent: "#8DFFD1",
    text: "#FFF7EF",
    muted: "#D6D1C8",
    seasonBg: "rgba(87,255,124,0.14)",
    seasonBorder: "rgba(87,255,124,0.22)",
    seasonText: "#8DFFD1",
    statusBg: "rgba(255,255,255,0.06)",
    statusBorder: "rgba(255,255,255,0.10)",
    statusText: "#CDE7DA",
    iconGlow: "rgba(255,152,66,0.16)",
    iconBorder: "rgba(141,255,209,0.28)",
    statBorder: "rgba(255,182,88,0.18)",
    bottomGlow: "rgba(255,110,18,0.18)",
    veil: "rgba(9,12,11,0.76)",
  },
} as const;

export function ChampionShowcaseCard({
  seasonLabel,
  tournamentName,
  championLabel,
  teamName,
  playerName,
  summary,
  statusLabel,
  statLine,
  width = "100%",
  accent = "gold",
  onPress,
  actionLabel = "Abrir pódio",
}: Props) {
  const [hovered, setHovered] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const { width: viewportWidth } = useWindowDimensions();
  const isPhone = viewportWidth < 768;
  const palette = paletteMap[accent];
  const safeTeamName = normalizeTeamDisplayName(teamName);
  const crest = resolveTeamVisualByName(safeTeamName);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: hovered ? 1 : 0,
      duration: 280,
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
  const frontTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const backTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });
  const footerOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const footerTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setHovered(true)}
      onPressOut={() => setHovered(false)}
      className="active:opacity-95"
      style={{ width }}
    >
      <LiveBorderCard
        accent={palette.frame}
        radius={24}
        padding={1.6}
        backgroundColor="#070304"
      >
        <View
          style={{
            position: "relative",
            minHeight: isPhone ? 446 : 494,
            backgroundColor: "#080304",
          }}
        >
          <LinearGradient
            colors={[...palette.shellGradient]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{
              position: "absolute",
              inset: 0,
            }}
          />

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -44,
              left: -28,
              width: isPhone ? 180 : 240,
              height: isPhone ? 180 : 240,
              borderRadius: 999,
              backgroundColor: "rgba(255,118,20,0.16)",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: -36,
              bottom: -84,
              width: isPhone ? 220 : 280,
              height: isPhone ? 220 : 280,
              borderRadius: 999,
              backgroundColor: palette.bottomGlow,
            }}
          />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(255,130,24,0.00)", "rgba(255,90,0,0.08)", "rgba(255,173,78,0.16)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: "absolute",
              left: "8%",
              right: "8%",
              bottom: 0,
              height: "44%",
              borderTopLeftRadius: 999,
              borderTopRightRadius: 999,
            }}
          />

          <CardFlameLayer tone={palette.fireTone} intensity="wild" />

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 10,
              borderRadius: 22,
              backgroundColor: palette.veil,
              borderWidth: 1,
              borderColor: "rgba(255,171,90,0.18)",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          />

          <View
            style={{
              position: "relative",
              paddingHorizontal: isPhone ? 18 : 22,
              paddingVertical: isPhone ? 18 : 22,
            }}
          >
            <View className="flex-row items-start justify-between gap-3">
              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: palette.seasonBg,
                  borderWidth: 1,
                  borderColor: palette.seasonBorder,
                }}
              >
                <Text
                  style={{
                    color: palette.seasonText,
                    fontSize: 11,
                    fontWeight: "800",
                    letterSpacing: 1.8,
                    textTransform: "uppercase",
                  }}
                >
                  {seasonLabel}
                </Text>
              </View>

              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: palette.statusBg,
                  borderWidth: 1,
                  borderColor: palette.statusBorder,
                }}
              >
                <Text
                  style={{
                    color: palette.statusText,
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                  }}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>

            <View
              style={{
                marginTop: 18,
                minHeight: isPhone ? 284 : 320,
                justifyContent: "center",
              }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  opacity: frontOpacity,
                  transform: [{ translateY: frontTranslate }],
                }}
              >
                <View className="items-center gap-5">
                  <View
                    style={{
                      width: isPhone ? 110 : 128,
                      height: isPhone ? 110 : 128,
                      borderRadius: 30,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(18,10,12,0.80)",
                      borderWidth: 1,
                      borderColor: palette.iconBorder,
                      shadowColor: palette.iconGlow,
                      shadowOpacity: 0.34,
                      shadowRadius: 20,
                      shadowOffset: { width: 0, height: 8 },
                      overflow: "hidden",
                    }}
                  >
                    {crest ? (
                      <Image source={{ uri: crest }} style={{ width: "72%", height: "72%" }} resizeMode="contain" />
                    ) : (
                      <Ionicons
                        name={championLabel.toLowerCase().includes("líder") ? "flame-outline" : "trophy-outline"}
                        size={isPhone ? 46 : 56}
                        color={palette.accent}
                      />
                    )}
                  </View>

                  <View className="items-center gap-2">
                    <Text
                      style={{
                        color: palette.accent,
                        fontSize: 12,
                        fontWeight: "800",
                        letterSpacing: 2.4,
                        textTransform: "uppercase",
                        textAlign: "center",
                      }}
                    >
                      {championLabel}
                    </Text>
                    <Text
                      style={{
                        color: palette.text,
                        fontSize: isPhone ? 28 : 36,
                        fontWeight: "900",
                        textAlign: "center",
                      }}
                    >
                      {playerName}
                    </Text>
                    <Text
                      style={{
                        color: palette.muted,
                        fontSize: isPhone ? 17 : 19,
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    >
                      {safeTeamName}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: "72%",
                      height: 1,
                      backgroundColor: "rgba(255,183,106,0.16)",
                    }}
                  />
                </View>
              </Animated.View>

              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: backOpacity,
                  transform: [{ translateY: backTranslate }],
                }}
              >
                <View className="items-center gap-4">
                  <View
                    style={{
                      width: isPhone ? 98 : 112,
                      height: isPhone ? 98 : 112,
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(255,192,120,0.18)",
                      overflow: "hidden",
                    }}
                  >
                    {crest ? (
                      <Image source={{ uri: crest }} style={{ width: "72%", height: "72%" }} resizeMode="contain" />
                    ) : (
                      <Text
                        style={{
                          color: palette.text,
                          fontSize: 28,
                          fontWeight: "900",
                          letterSpacing: 1.8,
                        }}
                      >
                        {getTeamInitials(safeTeamName)}
                      </Text>
                    )}
                  </View>

                  <View className="items-center gap-1">
                    <Text
                      style={{
                        color: palette.text,
                        fontSize: isPhone ? 24 : 28,
                        fontWeight: "900",
                        textAlign: "center",
                      }}
                    >
                      {safeTeamName}
                    </Text>
                    <Text
                      style={{
                        color: palette.muted,
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      {tournamentName}
                    </Text>
                  </View>

                  <View className="w-full flex-row flex-wrap gap-3">
                    {statLine.map((stat) => (
                      <View
                        key={stat.label}
                        style={{
                          minWidth: 110,
                          flex: 1,
                          borderRadius: 16,
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          backgroundColor: "rgba(255,255,255,0.05)",
                          borderWidth: 1,
                          borderColor: palette.statBorder,
                        }}
                      >
                        <Text
                          style={{
                            color: palette.muted,
                            fontSize: 10,
                            fontWeight: "800",
                            letterSpacing: 1.6,
                            textTransform: "uppercase",
                          }}
                        >
                          {stat.label}
                        </Text>
                        <Text
                          style={{
                            marginTop: 6,
                            color: palette.text,
                            fontSize: 24,
                            fontWeight: "900",
                          }}
                        >
                          {stat.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            </View>

            <Animated.View
              className="gap-3"
              style={{
                opacity: footerOpacity,
                transform: [{ translateY: footerTranslate }],
              }}
            >
              <View
                style={{
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(255,171,90,0.14)",
                }}
              >
                <Text
                  style={{
                    color: palette.muted,
                    fontSize: 15,
                    lineHeight: 24,
                  }}
                >
                  {summary}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text
                  style={{
                    color: palette.muted,
                    fontSize: 11,
                    fontWeight: "800",
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                  }}
                >
                  Passe o mouse para alternar
                </Text>

                {onPress ? (
                  <Text
                    style={{
                      color: palette.accent,
                      fontSize: 11,
                      fontWeight: "900",
                      letterSpacing: 1.8,
                      textTransform: "uppercase",
                    }}
                  >
                    {actionLabel}
                  </Text>
                ) : null}
              </View>
            </Animated.View>
          </View>
        </View>
      </LiveBorderCard>
    </Pressable>
  );
}
