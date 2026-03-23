import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { WhatsAppButton } from "@/components/match/WhatsAppButton";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { sampleMatches, sampleParticipants, sampleTournament } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = sampleMatches.find((item) => item.id === id) ?? sampleMatches[0];
  const home = sampleParticipants.find((item) => item.id === match.homeParticipantId);
  const away = sampleParticipants.find((item) => item.id === match.awayParticipantId);
  const [showScoreEditor, setShowScoreEditor] = useState(false);
  const [homeGoals, setHomeGoals] = useState(match.homeGoals ?? 0);
  const [awayGoals, setAwayGoals] = useState(match.awayGoals ?? 0);

  function updateScore(currentValue: number, delta: number, setter: (value: number) => void) {
    setter(Math.max(0, currentValue + delta));
  }

  function handleSaveScore() {
    setShowScoreEditor(false);
    Alert.alert("Placar adicionado", `${home?.teamName ?? "Mandante"} ${homeGoals} x ${awayGoals} ${away?.teamName ?? "Visitante"}`);
  }

  return (
    <Screen scroll className="px-6">
      <View className="gap-6 py-8">
        <SectionHeader
          eyebrow="Partida"
          title={`${home?.teamName ?? "Time da casa"} x ${away?.teamName ?? "Time visitante"}`}
          subtitle={`${home?.displayName ?? "Jogador da casa"} x ${away?.displayName ?? "Jogador visitante"}. Tela base do confronto com mando de campo, prazo e chamada via WhatsApp.`}
        />

        <GlassCard className="gap-4">
          <ScrollRow>
            <Badge label={`Rodada ${match.round}`} tone="neon" />
            <Badge label={match.phase} />
          </ScrollRow>
          <Text className="text-sm leading-6 text-arena-muted">
            {home?.displayName} joga em casa e deve criar a sala. Prazo final: {formatDate(match.deadlineAt)}.
          </Text>
        </GlassCard>

        <WhatsAppButton
          phone="+55 11 99999-0000"
          round={match.round}
          tournamentName={sampleTournament.name}
          isHomePlayerRoomCreator
        />

        <PrimaryButton
          label={showScoreEditor ? "Ocultar placar" : "Adicionar placar"}
          onPress={() => setShowScoreEditor((current) => !current)}
        />

        {showScoreEditor ? (
          <GlassCard className="gap-5">
            <View className="gap-2">
              <Text className="text-xs uppercase tracking-[3px] text-arena-neon">Lancamento de placar</Text>
              <Text className="text-lg font-semibold text-arena-text">Defina o resultado da partida</Text>
              <Text className="text-sm leading-6 text-arena-muted">
                Ajuste os gols de cada lado e salve o placar antes de enviar o resultado.
              </Text>
            </View>

            <View className="flex-row items-stretch gap-4">
              <View className="flex-1 gap-3 rounded-2xl border border-arena-line bg-arena-surface px-4 py-4">
                <Text className="text-xs uppercase tracking-[2px] text-arena-neon">Mandante</Text>
                <Text className="text-lg font-semibold text-arena-text">{home?.teamName ?? "Time da casa"}</Text>
                <Text className="text-xs text-arena-muted">{home?.displayName ?? "Jogador da casa"}</Text>
                <View className="flex-row items-center justify-between rounded-2xl border border-arena-line bg-arena-card px-3 py-3">
                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-xl border border-arena-line bg-arena-card"
                    onPress={() => updateScore(homeGoals, -1, setHomeGoals)}
                  >
                    <Text className="text-2xl font-bold text-arena-text">-</Text>
                  </Pressable>
                  <Text className="text-4xl font-bold text-arena-neon">{homeGoals}</Text>
                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-xl border border-arena-neon bg-arena-neon"
                    onPress={() => updateScore(homeGoals, 1, setHomeGoals)}
                  >
                    <Text className="text-2xl font-bold text-arena-bg">+</Text>
                  </Pressable>
                </View>
              </View>

              <View className="flex-1 gap-3 rounded-2xl border border-arena-line bg-arena-surface px-4 py-4">
                <Text className="text-xs uppercase tracking-[2px] text-arena-neon">Visitante</Text>
                <Text className="text-lg font-semibold text-arena-text">{away?.teamName ?? "Time visitante"}</Text>
                <Text className="text-xs text-arena-muted">{away?.displayName ?? "Jogador visitante"}</Text>
                <View className="flex-row items-center justify-between rounded-2xl border border-arena-line bg-arena-card px-3 py-3">
                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-xl border border-arena-line bg-arena-card"
                    onPress={() => updateScore(awayGoals, -1, setAwayGoals)}
                  >
                    <Text className="text-2xl font-bold text-arena-text">-</Text>
                  </Pressable>
                  <Text className="text-4xl font-bold text-arena-neon">{awayGoals}</Text>
                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-xl border border-arena-neon bg-arena-neon"
                    onPress={() => updateScore(awayGoals, 1, setAwayGoals)}
                  >
                    <Text className="text-2xl font-bold text-arena-bg">+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View className="rounded-2xl border border-arena-line bg-arena-card px-4 py-4">
              <Text className="text-xs uppercase tracking-[2px] text-arena-neon">Placar atual</Text>
              <Text className="mt-2 text-xl font-semibold text-arena-text">
                {home?.teamName ?? "Mandante"} {homeGoals} x {awayGoals} {away?.teamName ?? "Visitante"}
              </Text>
              <Text className="mt-1 text-sm text-arena-muted">
                {home?.displayName ?? "Jogador da casa"} x {away?.displayName ?? "Jogador visitante"}
              </Text>
            </View>

            <View className="gap-3">
              <PrimaryButton label="Salvar placar" onPress={handleSaveScore} />
              <PrimaryButton
                label="Cancelar"
                variant="secondary"
                onPress={() => setShowScoreEditor(false)}
              />
            </View>
          </GlassCard>
        ) : null}
      </View>
    </Screen>
  );
}
