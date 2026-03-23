import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { ScrollRow } from "@/components/ui/ScrollRow";
import type { VideoHighlight } from "@/types/video";

interface VideoHighlightCardProps {
  video: VideoHighlight;
}

export function VideoHighlightCard({ video }: VideoHighlightCardProps) {
  return (
    <View
      className="gap-4 rounded-[24px] border p-6 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.01]"
      style={{
        borderColor: "#D3D7DC",
        backgroundColor: "#FAFAFA",
        shadowColor: "#A3A8AF",
        shadowOpacity: 0.12,
        shadowRadius: 18,
      }}
    >
      <View className="h-40 items-center justify-center rounded-[20px] border border-[#D7DBE0] bg-[#F3F5F7]">
        <Ionicons name="play-circle-outline" size={42} color="#707780" />
      </View>
      <View className="gap-2">
        <Text className="text-xl font-semibold text-[#3F454C]">{video.title}</Text>
        <Text className="text-base leading-7 text-[#777D85]">{video.description}</Text>
      </View>
      <ScrollRow>
        <Badge label={video.approvalStatus} tone="neon" />
        <Badge label={`${video.votesCount} votos`} tone="gold" />
      </ScrollRow>
    </View>
  );
}
