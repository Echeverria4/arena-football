import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { sampleMatches, sampleParticipants } from "@/lib/constants";

export default function TournamentMatchesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showAllRounds, setShowAllRounds] = useState(false);
  const match = sampleMatches[0];
  const home = sampleParticipants.find((item) => item.id === match.homeParticipantId);
  const away = sampleParticipants.find((item) => item.id === match.awayParticipantId);
  const phases = ["1a fase", "mata-mata", "final"];
  const rounds = ["1a rodada", "2a rodada", "3a rodada", "4a rodada", "5a rodada", "6a rodada"];
  const visibleRounds = showAllRounds ? rounds : rounds.slice(0, 3);
  const hasMoreRounds = rounds.length > 3;
  const matchCards = [
    {
      id: `${match.id}-1`,
      homeTeam: home?.teamName ?? "Time da casa",
      awayTeam: away?.teamName ?? "Time visitante",
      homePlayer: home?.displayName ?? "Mandante",
      awayPlayer: away?.displayName ?? "Visitante",
    },
    {
      id: `${match.id}-2`,
      homeTeam: away?.teamName ?? "Time da casa",
      awayTeam: home?.teamName ?? "Time visitante",
      homePlayer: away?.displayName ?? "Mandante",
      awayPlayer: home?.displayName ?? "Visitante",
    },
  ];

  return (
    <Screen scroll className="px-6">
      <View className="gap-6 py-8">
        <SectionHeader
          eyebrow="Jogos"
          title={`Tabela do campeonato ${id}`}
          subtitle="Acompanhe por fase e rodada, visualize os confrontos liberados e entre direto na partida."
        />

        <GlassCard className="gap-5">
          <View className="gap-3">
            <Text className="text-sm uppercase tracking-[4px] text-arena-text">Navegacao do campeonato</Text>
            <View className="gap-3">
              <Pressable className="flex-row items-center justify-between rounded-2xl border border-arena-line bg-arena-card px-4 py-4">
                <Text className="text-xl font-semibold text-arena-text">1a Fase</Text>
                <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
              </Pressable>

              <ScrollRow>
                {visibleRounds.map((roundLabel, index) => (
                  <View
                    key={roundLabel}
                    className={`rounded-full border px-4 py-3 ${
                      index === 0 ? "border-arena-neon bg-arena-neon/18" : "border-arena-line bg-arena-card"
                    }`}
                  >
                    <Text className="text-base font-semibold text-arena-text">{roundLabel}</Text>
                  </View>
                ))}
                {hasMoreRounds ? (
                  <Pressable
                    className="flex-row items-center gap-2 rounded-full border border-arena-line bg-arena-card px-4 py-3"
                    onPress={() => setShowAllRounds((current) => !current)}
                  >
                    <Text className="text-base font-semibold text-arena-text">
                      {showAllRounds ? "Mostrar menos" : "Mais rodadas"}
                    </Text>
                    <Ionicons
                      name={showAllRounds ? "chevron-back" : "chevron-forward"}
                      size={16}
                      color="#FFFFFF"
                    />
                  </Pressable>
                ) : null}
              </ScrollRow>
            </View>
          </View>

          <ScrollRow>
            {phases.map((phase, index) => (
              <Badge key={phase} label={phase} tone={index === 0 ? "neon" : "muted"} />
            ))}
            <Badge label={match.status} tone="gold" />
          </ScrollRow>
        </GlassCard>

        <View className="gap-4">
          {matchCards.map((currentMatch, index) => (
            <GlassCard key={currentMatch.id} className="gap-5 border-arena-line bg-[#0D1812]">
              <View className="items-center">
                <View className="rounded-b-[26px] rounded-t-[18px] bg-arena-neon/18 px-7 py-2">
                  <Text className="text-xl font-bold text-arena-text">+</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 items-center gap-3">
                  <View className="h-16 w-16 items-center justify-center rounded-2xl bg-arena-card">
                    <Ionicons name="trophy-outline" size={30} color="#9AE2B2" />
                  </View>
                  <Text className="text-lg font-semibold text-arena-text">{currentMatch.homeTeam}</Text>
                  <Text className="text-sm text-arena-muted">{currentMatch.homePlayer}</Text>
                </View>

                <View className="items-center gap-3">
                  <View className="h-3 w-3 rounded-full bg-arena-line" />
                  <View className="h-3 w-3 rounded-full bg-arena-line" />
                </View>

                <View className="flex-1 items-center gap-3">
                  <View className="h-16 w-16 items-center justify-center rounded-2xl bg-arena-card">
                    <Ionicons name="trophy-outline" size={30} color="#9AE2B2" />
                  </View>
                  <Text className="text-lg font-semibold text-arena-text">{currentMatch.awayTeam}</Text>
                  <Text className="text-sm text-arena-muted">{currentMatch.awayPlayer}</Text>
                </View>
              </View>

              {index === 0 ? (
                <PrimaryButton label="Abrir partida" onPress={() => router.push(`/match/${match.id}`)} />
              ) : (
                <PrimaryButton label="Partida aguardando liberacao" variant="secondary" onPress={() => {}} />
              )}
            </GlassCard>
          ))}
        </View>

        <GlassCard className="gap-4">
          <View className="flex-row items-center justify-between">
            <Badge label={`Rodada ${match.round}`} tone="neon" />
            <Badge label="mandante cria a sala" tone="gold" />
          </View>
          <Text className="text-xl font-semibold text-arena-text">
            {home?.teamName ?? "Time da casa"} x {away?.teamName ?? "Time visitante"}
          </Text>
          <Text className="text-sm text-arena-muted">
            {home?.displayName ?? "Jogador da casa"} x {away?.displayName ?? "Jogador visitante"}
          </Text>
          <Text className="text-base text-arena-muted">
            O acompanhamento fica centralizado aqui: fase atual, rodada liberada e acesso rapido ao confronto.
          </Text>
        </GlassCard>
      </View>
    </Screen>
  );
}
