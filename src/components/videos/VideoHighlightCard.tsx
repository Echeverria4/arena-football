import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card3D } from "@/components/ui/Card3D";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { normalizeTeamDisplayName } from "@/lib/team-visuals";
import type { VideoHighlight } from "@/types/video";

interface VideoHighlightCardProps {
  video: VideoHighlight;
  openLabel?: string;
  statusNote?: string;
  voteLabel?: string;
  voteLocked?: boolean;
  favoriteLabel?: string;
  onOpen?: () => void;
  onVote?: () => void;
  onFavorite?: () => void;
}

export function VideoHighlightCard({
  video,
  openLabel = "Ver video",
  statusNote,
  voteLabel,
  voteLocked = false,
  favoriteLabel = "Favorito",
  onOpen,
  onVote,
  onFavorite,
}: VideoHighlightCardProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const isSmallPhone = width < 420;
  const teamName = video.teamName ? normalizeTeamDisplayName(video.teamName) : null;

  return (
    <Card3D
      accent="obsidian"
      eyebrow="Video highlight"
      title={video.title}
      subtitle={video.description ?? undefined}
      floatingNode={
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: isPhone ? 72 : 78,
            height: isPhone ? 72 : 78,
            backgroundColor: "rgba(255,255,255,0.10)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.16)",
          }}
        >
          <Ionicons name="play" size={isPhone ? 32 : 36} color="#FFFFFF" />
        </View>
      }
      heroNode={
        <View
          style={{
            width: "100%",
            height: isSmallPhone ? 218 : isPhone ? 248 : 286,
            borderRadius: 28,
            overflow: "hidden",
            backgroundColor: "#080B12",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            justifyContent: "flex-end",
            padding: 18,
          }}
        >
          <View className="items-start gap-3">
            {video.isGoalAwardWinner ? (
              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  backgroundColor: "rgba(233,179,52,0.16)",
                  borderWidth: 1,
                  borderColor: "rgba(233,179,52,0.28)",
                }}
              >
                <Text
                  style={{
                    color: "#FFE6A3",
                    fontSize: 11,
                    fontWeight: "800",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  Gol mais bonito
                </Text>
              </View>
            ) : null}

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: isPhone ? 24 : 28,
                fontWeight: "900",
                maxWidth: "80%",
              }}
            >
              {video.title}
            </Text>

            {teamName ? (
              <Text
                style={{
                  color: "#FFD77A",
                  fontSize: isSmallPhone ? 14 : 15,
                  fontWeight: "800",
                  letterSpacing: 0.4,
                }}
              >
                {teamName}
              </Text>
            ) : null}

            {video.description ? (
              <Text
                style={{
                  color: "#AEBBDA",
                  fontSize: isSmallPhone ? 14 : 15,
                  lineHeight: isSmallPhone ? 22 : 24,
                  maxWidth: "76%",
                }}
              >
                {video.description}
              </Text>
            ) : null}
          </View>
        </View>
      }
      content={
        <View className="gap-4">
          <ScrollRow>
            {teamName ? <Badge label={teamName} tone="neon" /> : null}
            {video.tournamentName ? <Badge label={video.tournamentName} tone="royal" /> : null}
            {video.fileName ? <Badge label="arquivo importado" tone="muted" /> : null}
            {video.isGoalAwardWinner ? <Badge label="gol vencedor" tone="gold" /> : null}
            <Badge label={`${video.viewsCount ?? 0} visualizações`} tone="muted" />
            <Badge label={`${video.votesCount} votos`} tone="royal" />
          </ScrollRow>

          {video.fileName ? (
            <Text className="text-sm leading-6 text-[#AEBBDA]">
              Arquivo vinculado: {video.fileName}
            </Text>
          ) : null}

          {statusNote ? (
            <Text className="text-sm leading-6 text-[#AEBBDA]">{statusNote}</Text>
          ) : null}

          <View className="flex-row flex-wrap gap-3">
            {onOpen ? (
              <PrimaryButton
                label={openLabel}
                onPress={onOpen}
                variant="secondary"
                className={`${isPhone ? "w-full" : "flex-1"} rounded-[18px] py-3`}
              />
            ) : null}

            {onVote ? (
              <PrimaryButton
                label={voteLabel ?? "Votar"}
                onPress={onVote}
                disabled={voteLocked}
                variant={voteLocked ? "secondary" : "primary"}
                className={`${isPhone ? "w-full" : "flex-1"} rounded-[18px] py-3`}
              />
            ) : null}

            {onFavorite ? (
              <Pressable
                onPress={onFavorite}
                className="items-center justify-center rounded-[18px] border px-5 py-3 active:opacity-80"
                style={{
                  minWidth: isPhone ? "100%" as never : 150,
                  borderColor: "rgba(255,255,255,0.12)",
                  backgroundColor: "#171E2B",
                }}
              >
                <Text
                  style={{
                    color: "#E3EBFF",
                    fontSize: 15,
                    fontWeight: "800",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  {favoriteLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      }
    />
  );
}
