import { useState } from "react";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";

import { getTeamInitials } from "@/lib/team-visuals";
import type { MatchStatus } from "@/types/match";

export interface MatchCardItem {
  id: string;
  homeCode: string;
  awayCode: string;
  homeFlagUrl?: string | null;
  awayFlagUrl?: string | null;
  homePlayer?: string;
  awayPlayer?: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  dateLabel: string;
  status?: MatchStatus;
}

const STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; bg: string }> = {
  pending: {
    label: "Aguardando",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
  },
  in_progress: {
    label: "Em andamento",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
  },
  finished: {
    label: "Finalizado",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
  },
};

function TeamCrest({
  flagUrl,
  code,
  size = 36,
}: {
  flagUrl?: string | null;
  code: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
      }}
    >
      {flagUrl && !failed ? (
        <Image
          source={{ uri: flagUrl }}
          style={{ width: "86%", height: "86%" }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ color: "#AEBBDA", fontSize: size * 0.3, fontWeight: "900" }}>
          {getTeamInitials(code)}
        </Text>
      )}
    </View>
  );
}

export function MatchCard({ item, onPress }: { item: MatchCardItem; onPress?: () => void }) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 420;
  const statusCfg = STATUS_CONFIG[item.status ?? "pending"];
  const hasScore =
    item.homeGoals != null && item.awayGoals != null && item.status === "finished";
  const isLive = item.status === "in_progress";
  const scoreText = hasScore ? `${item.homeGoals} – ${item.awayGoals}` : isLive ? "x" : "VS";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="active:opacity-90"
    >
      <View
        style={{
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "rgba(10,16,30,0.72)",
          borderWidth: 1,
          borderColor: "rgba(154,184,255,0.12)",
        }}
      >
        {/* Status bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 14,
            paddingVertical: 7,
            backgroundColor: statusCfg.bg,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.06)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                backgroundColor: statusCfg.color,
              }}
            />
            <Text
              style={{
                color: statusCfg.color,
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {statusCfg.label}
            </Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "600" }}>
            {item.dateLabel}
          </Text>
        </View>

        {/* Match content */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: isSmallPhone ? 12 : 16,
            paddingVertical: 14,
            gap: 8,
          }}
        >
          {/* Home team */}
          <View style={{ flex: 1, alignItems: "flex-start", gap: 6 }}>
            <TeamCrest flagUrl={item.homeFlagUrl} code={item.homeCode} size={isSmallPhone ? 32 : 38} />
            <Text
              numberOfLines={1}
              style={{
                color: "#FFFFFF",
                fontSize: isSmallPhone ? 12 : 13,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {item.homeCode}
            </Text>
            {item.homePlayer ? (
              <Text
                numberOfLines={1}
                style={{
                  color: "rgba(255,255,255,0.52)",
                  fontSize: 11,
                  lineHeight: 14,
                }}
              >
                {item.homePlayer}
              </Text>
            ) : null}
          </View>

          {/* Score */}
          <View
            style={{
              minWidth: isSmallPhone ? 62 : 72,
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text
              style={{
                color: hasScore ? "#FFFFFF" : "rgba(255,255,255,0.40)",
                fontSize: hasScore ? (isSmallPhone ? 22 : 26) : isSmallPhone ? 16 : 18,
                fontWeight: hasScore ? "900" : "600",
                letterSpacing: 1,
              }}
            >
              {scoreText}
            </Text>
            {isLive ? (
              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  backgroundColor: "rgba(59,130,246,0.24)",
                  borderWidth: 1,
                  borderColor: "rgba(59,130,246,0.4)",
                }}
              >
                <Text style={{ color: "#60A5FA", fontSize: 9, fontWeight: "900", letterSpacing: 1 }}>
                  AO VIVO
                </Text>
              </View>
            ) : null}
          </View>

          {/* Away team */}
          <View style={{ flex: 1, alignItems: "flex-end", gap: 6 }}>
            <TeamCrest flagUrl={item.awayFlagUrl} code={item.awayCode} size={isSmallPhone ? 32 : 38} />
            <Text
              numberOfLines={1}
              style={{
                color: "#FFFFFF",
                fontSize: isSmallPhone ? 12 : 13,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {item.awayCode}
            </Text>
            {item.awayPlayer ? (
              <Text
                numberOfLines={1}
                style={{
                  color: "rgba(255,255,255,0.52)",
                  fontSize: 11,
                  lineHeight: 14,
                  textAlign: "right",
                }}
              >
                {item.awayPlayer}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
