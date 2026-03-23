import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { sampleParticipants } from "@/lib/constants";

export default function TournamentParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scroll className="px-6">
      <View className="gap-6 py-8">
        <SectionHeader
          eyebrow="Participantes"
          title={`Jogadores do campeonato ${id}`}
          subtitle="Lista base com selo do organizador, clube escolhido e espaco para perfil publico."
        />
        {sampleParticipants.map((participant) => (
          <GlassCard key={participant.id} className="gap-2">
            <View className="flex-row flex-wrap gap-2">
              {participant.isOrganizer ? <Badge label="organizador" tone="gold" /> : null}
              <Badge label={participant.groupName ?? "sem grupo"} />
            </View>
            <Text className="text-lg font-semibold text-arena-text">{participant.teamName}</Text>
            <Text className="text-xs text-arena-muted">{participant.displayName}</Text>
          </GlassCard>
        ))}
      </View>
    </Screen>
  );
}
