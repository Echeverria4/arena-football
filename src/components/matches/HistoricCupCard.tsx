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
}: {
  imageUrl?: string | null;
  fallbackLabel: string;
  variant?: "host" | "team";
}) {
  const [failed, setFailed] = useState(false);
  const isHost = variant === "host";
  const tileWidth = isHost ? 54 : 62;
  const tileHeight = isHost ? 34 : 42;
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
        <View
          style={{
            width: innerScale,
            height: innerScale,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
            onError={() => setFailed(true)}
          />
        </View>
      ) : (
        <Text
          style={{
            color: isHost ? "#111111" : "#FFFFFF",
            fontSize: isHost ? 11 : 14,
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

function ScoreBlock({ top, bottom }: { top: string; bottom?: string }) {
  const scoreFontSize = bottom ? 24 : top === "VS" ? 28 : 26;

  return (
    <View
      style={{
        minWidth: 68,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: scoreFontSize,
          fontWeight: "300",
          lineHeight: bottom ? 28 : 30,
        }}
      >
        {top}
      </Text>
      {bottom ? (
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            fontWeight: "300",
            lineHeight: 28,
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
}: {
  code: string;
  flagUrl?: string | null;
  player?: string;
}) {
  return (
    <View
      style={{
        width: 82,
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <FlagTile imageUrl={flagUrl} fallbackLabel={code} />
      <Text
        numberOfLines={1}
        style={{
          marginTop: 8,
          color: "#FFFFFF",
          fontSize: 13,
          fontWeight: "800",
          textTransform: "uppercase",
        }}
      >
        {code}
      </Text>
      {player ? (
        <Text
          numberOfLines={2}
          style={{
            marginTop: 3,
            color: "rgba(255,255,255,0.74)",
            fontSize: 11,
            lineHeight: 13,
            textAlign: "center",
          }}
        >
          {player}
        </Text>
      ) : null}
    </View>
  );
}

export function HistoricCupCard({ item, onPress }: HistoricCupCardProps) {
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
            minHeight: 228,
            backgroundColor: "#343434",
          }}
        >
        <View
          style={{
            minHeight: 38,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F0F0F0",
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderLeftWidth: 4,
            borderLeftColor: accent,
            position: "relative",
          }}
        >
          {item.hostFlagUrl ? (
            <View
              style={{
                position: "absolute",
                left: 10,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}
            >
              <FlagTile
                imageUrl={item.hostFlagUrl}
                fallbackLabel={item.hostCountry ?? item.editionLabel}
                variant="host"
              />
            </View>
          ) : null}

          <Text
            numberOfLines={1}
            style={{
              color: "#111111",
              fontSize: 12,
              fontWeight: "700",
              textAlign: "center",
              paddingHorizontal: item.hostFlagUrl ? 56 : 0,
            }}
          >
            {item.editionLabel}
          </Text>
        </View>

          <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 16 }}>
            <Text
              style={{
                textAlign: "center",
                color: "#FFFFFF",
                fontSize: 13,
                marginBottom: 14,
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
              <TeamColumn code={item.homeCode} flagUrl={item.homeFlagUrl} player={item.homePlayer} />
              <ScoreBlock top={item.scoreTop} bottom={item.scoreBottom} />
              <TeamColumn code={item.awayCode} flagUrl={item.awayFlagUrl} player={item.awayPlayer} />
            </View>

            <View style={{ marginTop: 14 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: "#FFFFFF",
                  fontSize: 12,
                  lineHeight: 16,
                  textAlign: "center",
                }}
              >
                {item.stadium}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  color: "#FFFFFF",
                  fontSize: 12,
                  lineHeight: 16,
                  textAlign: "center",
                }}
              >
                {item.city}
              </Text>
            </View>
          </View>
        </View>
      </LiveBorderCard>
    </Pressable>
  );
}
