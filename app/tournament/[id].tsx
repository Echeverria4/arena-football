import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { sampleParticipants, sampleTournament } from "@/lib/constants";

export default function TournamentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scroll className="px-6">
      <View className="gap-6 py-8">
        <SectionHeader
          eyebrow="Campeonato"
          title={sampleTournament.name}
          subtitle={`ID da rota: ${id}. Tela base com visao geral, organizador, status e navegacao interna.`}
        />

        <GlassCard className="gap-4">
          <ScrollRow>
            <Badge label={sampleTournament.status.replace("_", " ")} tone="neon" />
            <Badge label={sampleTournament.format.replace("_", " ")} />
            <Badge label="criador confirmado" tone="gold" />
          </ScrollRow>
          <Text className="text-sm leading-6 text-arena-muted">{sampleTournament.rules}</Text>
          <Text className="text-sm text-arena-muted">
            Organizador: {sampleParticipants.find((item) => item.isOrganizer)?.displayName}
          </Text>
        </GlassCard>

        <View className="gap-3">
          <PrimaryButton
            label="Acompanhar campeonato"
            onPress={() => router.push({ pathname: "/tournament/matches", params: { id } })}
          />
          <PrimaryButton
            label="Classificacao"
            variant="secondary"
            onPress={() => router.push({ pathname: "/tournament/standings", params: { id } })}
          />
          <PrimaryButton
            label="Estatisticas"
            variant="secondary"
            onPress={() => router.push({ pathname: "/tournament/statistics", params: { id } })}
          />
          <PrimaryButton
            label="Participantes"
            variant="secondary"
            onPress={() => router.push({ pathname: "/tournament/participants", params: { id } })}
          />
          <PrimaryButton
            label="Videos"
            variant="secondary"
            onPress={() => router.push({ pathname: "/tournament/videos", params: { id } })}
          />
        </View>
      </View>
    </Screen>
  );
}
