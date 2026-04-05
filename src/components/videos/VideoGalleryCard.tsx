import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, Text, View } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { formatVideoVoterPhone } from "@/lib/video-panel";
import { buildYouTubeThumbnailUrl, isRemoteVideoUrl } from "@/lib/video-links";
import type { VideoHighlight } from "@/types/video";

interface VideoGalleryCardProps {
  video: VideoHighlight;
  statusNote?: string;
  voteLabel?: string;
  voteLocked?: boolean;
  onOpen: () => void;
  shareLabel?: string;
  adminLabel?: string;
  onShare?: () => void;
  onVote?: () => void;
  onAdminAction?: () => void;
}

export function VideoGalleryCard({
  video,
  statusNote,
  voteLabel = "Votar",
  voteLocked = false,
  onOpen,
  shareLabel = "Compartilhar",
  adminLabel,
  onShare,
  onVote,
  onAdminAction,
}: VideoGalleryCardProps) {
  const thumbnailUrl = buildYouTubeThumbnailUrl(video.videoUrl);
  const shareableOutsideCurrentDevice = isRemoteVideoUrl(video.videoUrl);

  return (
    <View
      style={{
        overflow: "hidden",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(7,12,22,0.84)",
      }}
    >
      <Pressable onPress={onOpen} className="active:opacity-90">
        <View
          style={{
            position: "relative",
            aspectRatio: 16 / 9,
            overflow: "hidden",
            backgroundColor: "#090D16",
          }}
        >
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              resizeMode="cover"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          ) : null}

          <LinearGradient
            colors={["rgba(5,8,14,0.08)", "rgba(5,8,14,0.22)", "rgba(5,8,14,0.92)"]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              justifyContent: "space-between",
              padding: 16,
            }}
          >
            <View className="flex-row items-start justify-between gap-3">
              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: "rgba(0,0,0,0.56)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                }}
              >
                <Text
                  style={{
                    color: "#F4F7FF",
                    fontSize: 11,
                    fontWeight: "900",
                    letterSpacing: 1.3,
                    textTransform: "uppercase",
                  }}
                >
                  Vídeo
                </Text>
              </View>

              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: "rgba(0,0,0,0.56)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                }}
              >
                <Text
                  style={{
                    color: shareableOutsideCurrentDevice ? "#8CFFAC" : "#FFD39C",
                    fontSize: 11,
                    fontWeight: "900",
                    letterSpacing: 1.3,
                    textTransform: "uppercase",
                  }}
                >
                  {shareableOutsideCurrentDevice ? "Link público" : "Somente local"}
                </Text>
              </View>
            </View>

            <View className="items-center justify-center">
              <View
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.18)",
                }}
              >
                <Ionicons name="play" size={34} color="#FFFFFF" />
              </View>
            </View>

            <View className="flex-row items-end justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text
                  numberOfLines={2}
                  style={{
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: "900",
                  }}
                >
                  {video.title}
                </Text>
                {video.description ? (
                  <Text
                    numberOfLines={2}
                    style={{
                      color: "#CED8EF",
                      fontSize: 13,
                      lineHeight: 20,
                    }}
                  >
                    {video.description}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  backgroundColor: "rgba(0,0,0,0.52)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <Text
                  style={{
                    color: "#E7EEFF",
                    fontSize: 11,
                    fontWeight: "800",
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                  }}
                >
                  {video.viewsCount ?? 0} views
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Pressable>

      <View className="gap-4 px-4 py-4">
        <View className="flex-row flex-wrap gap-2">
          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text
              style={{
                color: "#DDE7FF",
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {video.votesCount} votos
            </Text>
          </View>

          {video.teamName ? (
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "rgba(90,124,255,0.12)",
                borderWidth: 1,
                borderColor: "rgba(90,124,255,0.22)",
              }}
            >
              <Text
                style={{
                  color: "#BFD0FF",
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {video.teamName}
              </Text>
            </View>
          ) : null}

          {video.playerPhone ? (
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "rgba(87,255,124,0.10)",
                borderWidth: 1,
                borderColor: "rgba(87,255,124,0.22)",
              }}
            >
              <Text
                style={{
                  color: "#CFFFD9",
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1.1,
                }}
              >
                {formatVideoVoterPhone(video.playerPhone)}
              </Text>
            </View>
          ) : null}
        </View>

        {statusNote ? (
          <Text style={{ color: "#AEBBDA", fontSize: 13, lineHeight: 21 }}>
            {statusNote}
          </Text>
        ) : null}

        <View className="gap-3">
          <View className="flex-row flex-wrap gap-3">
            <PrimaryButton
              label="Assistir"
              onPress={onOpen}
              variant="secondary"
              size="sm"
              className="flex-1"
            />
            {onShare ? (
              <PrimaryButton
                label={shareLabel}
                onPress={onShare}
                variant="light"
                size="sm"
                className="flex-1"
              />
            ) : null}
          </View>

          {onVote ? (
            <PrimaryButton
              label={voteLabel}
              onPress={onVote}
              disabled={voteLocked}
              variant={voteLocked ? "secondary" : "primary"}
              size="sm"
            />
          ) : null}

          {onAdminAction ? (
            <PrimaryButton
              label={adminLabel ?? "Definir vencedor"}
              onPress={onAdminAction}
              variant="gold"
              size="sm"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
