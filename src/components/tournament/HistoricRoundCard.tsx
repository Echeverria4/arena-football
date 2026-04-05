import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { getTeamInitials, resolveTeamVisualByName } from "@/lib/team-visuals";
import type { MatchStatus } from "@/types/match";

interface HistoricRoundCardProps {
  headerLabel: string;
  hostLabel: string;
  dateLabel: string;
  homeTeam: string;
  awayTeam: string;
  homePlayer: string;
  awayPlayer: string;
  scoreLabel: string;
  locationLabel: string;
  cityLabel: string;
  status: MatchStatus;
  onOpen?: () => void;
}

const statusPalette: Record<
  MatchStatus,
  { label: string; text: string; border: string; background: string; accent: string }
> = {
  pending: {
    label: "Aguardando",
    text: "#FFCD75",
    border: "rgba(255,205,117,0.22)",
    background: "rgba(255,205,117,0.14)",
    accent: "#F3A521",
  },
  in_progress: {
    label: "Em andamento",
    text: "#90D5FF",
    border: "rgba(144,213,255,0.22)",
    background: "rgba(144,213,255,0.14)",
    accent: "#41A9E8",
  },
  finished: {
    label: "Finalizado",
    text: "#A6F0C5",
    border: "rgba(166,240,197,0.22)",
    background: "rgba(166,240,197,0.14)",
    accent: "#34C274",
  },
};

function TeamBadge({ teamName }: { teamName: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = resolveTeamVisualByName(teamName);

  return (
    <View
      style={{
        width: 62,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#2A2430",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {imageUrl && !imageFailed ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 46, height: 28 }}
          resizeMode="contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: "900",
            letterSpacing: 1.2,
          }}
        >
          {getTeamInitials(teamName)}
        </Text>
      )}
    </View>
  );
}

function getScoreDisplay(scoreLabel: string) {
  const normalized = (scoreLabel ?? "").trim();

  if (!normalized || normalized.toUpperCase() === "VS") {
    return { home: null, away: null, pending: true };
  }

  const parts = normalized.split("-").map((part) => part.trim());

  if (parts.length === 2) {
    return {
      home: parts[0] ?? "0",
      away: parts[1] ?? "0",
      pending: false,
    };
  }

  return { home: null, away: null, pending: true };
}

export function HistoricRoundCard({
  headerLabel,
  hostLabel,
  dateLabel,
  homeTeam,
  awayTeam,
  homePlayer,
  awayPlayer,
  scoreLabel,
  locationLabel,
  cityLabel,
  status,
  onOpen,
}: HistoricRoundCardProps) {
  const palette = statusPalette[status];
  const { width } = useWindowDimensions();
  const isPhone = width < 480;
  const score = getScoreDisplay(scoreLabel);
  const actionLabel = status === "finished" ? "Ver detalhes" : "Entrar na partida";

  return (
    <View
      style={{
        borderRadius: 24,
        backgroundColor: "#201A23",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        shadowColor: "#000000",
        shadowOpacity: 0.26,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: palette.accent,
        }}
      />

      <View
        className="flex-row items-center justify-between gap-3"
        style={{
          paddingHorizontal: 18,
          paddingVertical: 16,
          backgroundColor: "#2A2230",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <View className="gap-1">
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            {headerLabel}
          </Text>
          <Text
            style={{
              color: "#D4C8D1",
              fontSize: 13,
            }}
          >
            {hostLabel}
          </Text>
        </View>

        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
            backgroundColor: palette.background,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Text
            style={{
              color: palette.text,
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {palette.label}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onOpen}
        disabled={!onOpen}
        style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 }}
        className="active:opacity-95 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.01]"
      >
        <Text
          style={{
            color: "#F0DCE5",
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 1.6,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {dateLabel}
        </Text>

        <View
          className="flex-row items-center gap-3"
          style={{
            marginTop: 14,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            backgroundColor: "#171217",
            padding: 16,
          }}
        >
          <View className="flex-1 items-center gap-2">
            <TeamBadge teamName={homeTeam} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: isPhone ? 14 : 15,
                fontWeight: "900",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {homeTeam}
            </Text>
            <Text
              style={{
                color: "#C0B3BC",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {homePlayer}
            </Text>
          </View>

          <LinearGradient
            colors={["#700626", "#BF1857", "#7E123A"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              minWidth: isPhone ? 86 : 102,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              paddingHorizontal: 12,
              paddingVertical: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {score.pending ? (
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: isPhone ? 22 : 26,
                  fontWeight: "900",
                  letterSpacing: 2,
                }}
              >
                VS
              </Text>
            ) : (
              <View className="flex-row items-center">
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: isPhone ? 22 : 28,
                    fontWeight: "900",
                  }}
                >
                  {score.home}
                </Text>
                <Text
                  style={{
                    color: "#FFD6E6",
                    fontSize: isPhone ? 18 : 22,
                    fontWeight: "900",
                    marginHorizontal: 5,
                  }}
                >
                  :
                </Text>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: isPhone ? 22 : 28,
                    fontWeight: "900",
                  }}
                >
                  {score.away}
                </Text>
              </View>
            )}

            <Text
              style={{
                color: "#FFD6E6",
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 1.4,
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Partida
            </Text>
          </LinearGradient>

          <View className="flex-1 items-center gap-2">
            <TeamBadge teamName={awayTeam} />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: isPhone ? 14 : 15,
                fontWeight: "900",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {awayTeam}
            </Text>
            <Text
              style={{
                color: "#C0B3BC",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {awayPlayer}
            </Text>
          </View>
        </View>

        <View
          className="gap-1"
          style={{
            marginTop: 14,
            borderRadius: 16,
            backgroundColor: "#171217",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            {locationLabel}
          </Text>
          <Text
            style={{
              color: "#C0B3BC",
              fontSize: 12,
              lineHeight: 18,
              textAlign: "center",
            }}
          >
            {cityLabel}
          </Text>
        </View>

        <PrimaryButton
          label={actionLabel}
          onPress={onOpen}
          variant="secondary"
          className="mt-5 w-full rounded-[16px] py-3"
        />
      </Pressable>
    </View>
  );
}
