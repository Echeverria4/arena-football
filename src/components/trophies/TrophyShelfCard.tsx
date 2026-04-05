import { Ionicons } from "@expo/vector-icons";
import { Text, View, useWindowDimensions } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { NeonFrame } from "@/components/ui/NeonFrame";
import { ScrollRow } from "@/components/ui/ScrollRow";
import type { VideoHighlight } from "@/types/video";

interface VideoHighlightCardProps {
  video: VideoHighlight;
}

export function VideoHighlightCard({ video }: VideoHighlightCardProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const isSmallPhone = width < 420;

  return (
    <NeonFrame radius={24} backgroundColor="#FFFFFF">
      <View
        className="gap-4"
        style={{
          padding: isSmallPhone ? 18 : 24,
          backgroundColor: "#FFFFFF",
        }}
      >
        <View
          className="items-center justify-center rounded-[20px]"
          style={{
            height: isPhone ? 144 : 160,
            borderWidth: 1,
            borderColor: "rgba(59,91,255,0.18)",
            backgroundColor: "#F8FAFF",
            shadowColor: "#3B5BFF",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 110,
              height: 110,
              borderRadius: 999,
              backgroundColor: "rgba(59,91,255,0.08)",
              top: -24,
              right: -18,
            }}
          />

          <Ionicons
            name="play-circle-outline"
            size={isPhone ? 42 : 48}
            color="#5A78D1"
          />
        </View>

        <View className="gap-2">
          <Text
            className="font-semibold"
            style={{
              fontSize: isPhone ? 18 : 20,
              color: "#1C2B4A",
            }}
          >
            {video.title}
          </Text>

          <Text
            style={{
              fontSize: isSmallPhone ? 14 : 16,
              lineHeight: isSmallPhone ? 24 : 28,
              color: "#6B7EA3",
            }}
          >
            {video.description}
          </Text>
        </View>

        <ScrollRow>
          <Badge label={video.approvalStatus} tone="neon" />
          <Badge label={`${video.votesCount} votos`} tone="gold" />
        </ScrollRow>
      </View>
    </NeonFrame>
  );
}

