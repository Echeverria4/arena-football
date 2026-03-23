import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { VideoHighlightCard } from "@/components/videos/VideoHighlightCard";
import { sampleVideos } from "@/lib/constants";

export default function TournamentVideosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scroll className="px-6">
      <View className="gap-6 py-8">
        <SectionHeader
          eyebrow="Videos do campeonato"
          title={`Galeria do torneio ${id}`}
          subtitle="Pronto para uploads, aprovacao do organizador, finalistas e selo do gol mais bonito."
        />
        {sampleVideos.map((video) => (
          <VideoHighlightCard key={video.id} video={video} />
        ))}
      </View>
    </Screen>
  );
}
