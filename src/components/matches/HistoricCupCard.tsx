import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { getTeamInitials } from "@/lib/team-visuals";
import type { MatchStatus } from "@/types/match";

export interface HistoricCupItem {
  id: string;
  hostCountry?: string;
  hostFlagUrl?: string | null;
  editionLabel: string;
  dateLabel: string;
  homeCode: string;
  awayCode: string;
  homeFlagUrl?: string | null;
  awayFlagUrl?: string | null;
  homePlayer?: string;
  awayPlayer?: string;
  scoreTop: string;
  scoreBottom?: string;
  stadium: string;
  city: string;
  status?: MatchStatus;
}

interface HistoricCupCardProps {
  item: HistoricCupItem;
  onPress?: () => void;
  compact?: boolean;
}

const statusAccent: Record<MatchStatus, string> = {
  pending: "#E8A01B",
  in_progress: "#2F9BFF",
  finished: "#22B866",
};

function FlagTile({
  imageUrl,
  fallbackLabel,
  variant = "team",
  small = false,
}: {
  imageUrl?: string | null;
  fallbackLabel: string;
  variant?: "host" | "team";
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const isHost = variant === "host";
  const tileWidth = isHost ? 54 : small ? 44 : 62;
  const tileHeight = isHost ? 34 : small ? 30 : 42;
  const innerScale = isHost ? "88%" : "84%";

  return (
    <View
      style={{
        width: tileWidth,
        height: tileHeight,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: isHost ? 10 : 14,
        backgroundColor: isHost ? "#F4F4F4" : "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: isHost ? "rgba(17,17,17,0.08)" : "rgba(255,255,255,0.12)",
        overflow: "hidden",
      }}
    >
      {imageUrl && !failed ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: innerScale, height: innerScale }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text
          style={{
            color: isHost ? "#111111" : "#FFFFFF",
            fontSize: isHost ? 11 : small ? 10 : 14,
            fontWeight: "900",
            letterSpacing: 1,
          }}
        >
          {getTeamInitials(fallbackLabel)}
        </Text>
      )}
    </View>
  );
}

function ScoreBlock({ top, bottom, compact = false }: { top: string; bottom?: string; compact?: boolean }) {
  const scoreFontSize = compact
    ? bottom ? 16 : top === "VS" ? 18 : 17
    : bottom ? 24 : top === "VS" ? 28 : 26;

  return (
    <View
      style={{
        minWidth: compact ? 44 : 68,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: scoreFontSize,
          fontWeight: "300",
          lineHeight: compact ? (bottom ? 20 : 22) : (bottom ? 28 : 30),
        }}
      >
        {top}
      </Text>
      {bottom ? (
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: compact ? 16 : 24,
            fontWeight: "300",
            lineHeight: compact ? 20 : 28,
          }}
        >
          {bottom}
        </Text>
      ) : null}
    </View>
  );
}

function TeamColumn({
  code,
  flagUrl,
  player,
  compact = false,
}: {
  code: string;
  flagUrl?: string | null;
  player?: string;
  compact?: boolean;
}) {
  return (
    <View
      style={{
        flex: compact ? 1 : undefined,
        width: compact ? undefined : 82,
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <FlagTile imageUrl={flagUrl} fallbackLabel={code} small={compact} />
      <Text
        numberOfLines={1}
        style={{
          marginTop: compact ? 5 : 8,
          color: "#FFFFFF",
          fontSize: compact ? 10 : 13,
          fontWeight: "800",
          textTransform: "uppercase",
        }}
      >
        {code}
      </Text>
      {player ? (
        <Text
          numberOfLines={1}
          style={{
            marginTop: 2,
            color: "rgba(255,255,255,0.74)",
            fontSize: compact ? 9 : 11,
            lineHeight: compact ? 11 : 13,
            textAlign: "center",
          }}
        >
          {player}
        </Text>
      ) : null}
    </View>
  );
}

export function HistoricCupCard({ item, onPress, compact = false }: HistoricCupCardProps) {
  const accent = statusAccent[item.status ?? "pending"];
  const borderAccent =
    item.status === "finished" ? "emerald" : item.status === "in_progress" ? "blue" : "gold";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="active:opacity-95 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]"
    >
      <LiveBorderCard
        accent={borderAccent}
        radius={14}
        padding={1.2}
        backgroundColor="#343434"
      >
        <View
          style={{
            minHeight: compact ? 180 : 228,
            backgroundColor: "#343434",
          }}
        >
          <View style={{ paddingHorizontal: compact ? 8 : 14, paddingTop: compact ? 8 : 14, paddingBottom: compact ? 10 : 16 }}>
            <Text
              style={{
                textAlign: "center",
                color: "#FFFFFF",
                fontSize: compact ? 10 : 13,
                marginBottom: compact ? 8 : 14,
              }}
            >
              {item.dateLabel}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <TeamColumn code={item.homeCode} flagUrl={item.homeFlagUrl} player={item.homePlayer} compact={compact} />
              <ScoreBlock top={item.scoreTop} bottom={item.scoreBottom} compact={compact} />
              <TeamColumn code={item.awayCode} flagUrl={item.awayFlagUrl} player={item.awayPlayer} compact={compact} />
            </View>

            <View style={{ marginTop: compact ? 8 : 14 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: "#FFFFFF",
                  fontSize: compact ? 10 : 12,
                  lineHeight: compact ? 13 : 16,
                  textAlign: "center",
                }}
              >
                {item.stadium}
              </Text>
              {item.city ? (
                <Text
                  numberOfLines={2}
                  style={{
                    color: "#FFFFFF",
                    fontSize: compact ? 10 : 12,
                    lineHeight: compact ? 13 : 16,
                    textAlign: "center",
                  }}
                >
                  {item.city}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </LiveBorderCard>
    </Pressable>
  );
}
