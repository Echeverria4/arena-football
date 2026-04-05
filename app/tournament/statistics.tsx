import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { BackButton } from "@/components/ui/BackButton";
import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { isTournamentAccessLocked, resolveTournamentAccessMode } from "@/lib/tournament-access";
import { normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";
import { getTournamentBundle } from "@/lib/tournament-display";
import { calculateVictoryRate } from "@/lib/tournament-results";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

function StatSummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <LiveBorderCard accent="blue" radius={16} padding={1.2} backgroundColor="#F8FAFC" style={{ minWidth: 180, flex: 1 }}>
      <View className="px-4 py-4">
        <Text
          style={{
            color: "#4B5E93",
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            marginTop: 10,
            color: "#1E2B5C",
            fontSize: 28,
            fontWeight: "900",
          }}
        >
          {value}
        </Text>
        <Text
          style={{
            marginTop: 4,
            color: "#5E6E91",
            fontSize: 13,
            lineHeight: 18,
          }}
        >
          {helper}
        </Text>
      </View>
    </LiveBorderCard>
  );
}

function StatisticRow({
  rank,
  teamName,
  playerName,
  crest,
  metricLabel,
  metricValue,
  helper,
}: {
  rank: number;
  teamName: string;
  playerName: string;
  crest?: string | null;
  metricLabel: string;
  metricValue: string;
  helper: string;
}) {
  return (
    <View
      className="flex-row items-center gap-3 rounded-[18px] px-3 py-3"
      style={{
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E6EBF2",
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: rank === 1 ? "rgba(244,197,66,0.18)" : "#EDF2F7",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "#1E2B5C",
            fontSize: 15,
            fontWeight: "900",
          }}
        >
          {rank}
        </Text>
      </View>

      {crest ? (
        <Image source={{ uri: crest }} style={{ width: 36, height: 36 }} resizeMode="contain" />
      ) : (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#DBE4F0",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#223C7B", fontSize: 11, fontWeight: "800" }}>
            {teamName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1 gap-1">
        <Text
          numberOfLines={1}
          style={{
            color: "#1E2B5C",
            fontSize: 16,
            fontWeight: "800",
          }}
        >
          {teamName}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: "#64748B",
            fontSize: 12,
          }}
        >
          {playerName}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: "#667085",
            fontSize: 12,
          }}
        >
          {helper}
        </Text>
      </View>

      <View className="items-end">
        <Text
          style={{
            color: "#223C7B",
            fontSize: 22,
            fontWeight: "900",
          }}
        >
          {metricValue}
        </Text>
        <Text
          style={{
            color: "#64748B",
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {metricLabel}
        </Text>
      </View>
    </View>
  );
}

function StatisticSection({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Array<{
    id: string;
    teamName: string;
    playerName: string;
    crest?: string | null;
    metricLabel: string;
    metricValue: string;
    helper: string;
  }>;
}) {
  return (
    <LiveBorderCard accent="blue" radius={18} padding={1.3} backgroundColor="#F8FAFC">
      <View className="gap-4 p-4">
        <View className="gap-1">
          <Text
            style={{
              color: "#1E2B5C",
              fontSize: 22,
              fontWeight: "800",
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: "#64748B",
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {subtitle}
          </Text>
        </View>

        <View className="gap-3">
          {rows.map((row, index) => (
            <StatisticRow
              key={row.id}
              rank={index + 1}
              teamName={row.teamName}
              playerName={row.playerName}
              crest={row.crest}
              metricLabel={row.metricLabel}
              metricValue={row.metricValue}
              helper={row.helper}
            />
          ))}
        </View>
      </View>
    </LiveBorderCard>
  );
}

export default function TournamentStatisticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const videos = useVideoStore((state) => state.videos);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const hydrated = useTournamentDataHydrated();
  const tournamentMissing = Boolean(hydrated && (!id || !campeonatos.some((campeonato) => campeonato.id === id)));

  if (!hydrated) {
    return (
      <Screen
        scroll
        className="px-6"
        backgroundVariant="none"
        style={{ backgroundColor: "#0a1220" }}
      >
        <ScreenState
          title="Carregando estatisticas"
          description="Sincronizando gols, defesa e percentual de vitorias da temporada."
        />
      </Screen>
    );
  }

  if (tournamentMissing) {
    return (
      <Screen
        scroll
        className="px-6"
        backgroundVariant="none"
        style={{ backgroundColor: "#0a1220" }}
      >
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato nao encontrado"
            description="Esse painel estatistico nao corresponde mais a um campeonato ativo."
          />
        </View>
      </Screen>
    );
  }

  const bundle = id ? getTournamentBundle(id, campeonatos, videos) : null;

  if (!bundle) {
    return (
      <Screen
        scroll
        className="px-6"
        backgroundVariant="none"
        style={{ backgroundColor: "#0a1220" }}
      >
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato nao encontrado"
            description="Esse painel estatistico nao corresponde mais a um campeonato ativo."
          />
        </View>
      </Screen>
    );
  }

  const activeTournamentAccessMode = resolveTournamentAccessMode(
    tournamentAccess,
    currentTournamentId,
  );
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);

  useEffect(() => {
    if (!lockToActiveTournament || !currentTournamentId || bundle.campeonato.id === currentTournamentId) {
      return;
    }

    router.replace({ pathname: "/tournament/statistics", params: { id: currentTournamentId } });
  }, [bundle.campeonato.id, currentTournamentId, lockToActiveTournament]);

  if (bundle.standings.length === 0) {
    return (
      <Screen
        scroll
        className="px-6"
        backgroundVariant="none"
        style={{ backgroundColor: "#0a1220" }}
      >
        <View className="gap-6 py-8">
          <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />
          <ScreenState
            title="Estatisticas indisponiveis"
            description="Sem participantes, rodadas ou classificacao consistente, o painel estatistico nao consegue calcular ataque, defesa e aproveitamento."
          />
        </View>
      </Screen>
    );
  }

  const attackRanking = [...bundle.standings].sort((current, next) => next.goalsFor - current.goalsFor);
  const defenseRanking = [...bundle.standings].sort((current, next) => {
    if (current.goalsAgainst !== next.goalsAgainst) {
      return current.goalsAgainst - next.goalsAgainst;
    }

    return next.points - current.points;
  });
  const winRateRanking = [...bundle.standings].sort((current, next) => {
    const nextRate = calculateVictoryRate(next.wins, next.played);
    const currentRate = calculateVictoryRate(current.wins, current.played);

    if (nextRate !== currentRate) {
      return nextRate - currentRate;
    }

    return next.points - current.points;
  });

  const attackLeader = attackRanking[0];
  const defenseLeader = defenseRanking[0];
  const winRateLeader = winRateRanking[0];

  const attackLeaderParticipant = bundle.participants.find((item) => item.id === attackLeader?.participantId);
  const defenseLeaderParticipant = bundle.participants.find((item) => item.id === defenseLeader?.participantId);
  const winRateLeaderParticipant = bundle.participants.find((item) => item.id === winRateLeader?.participantId);

  const attackRows = attackRanking.slice(0, 5).map((entry) => {
    const participant = bundle.participants.find((item) => item.id === entry.participantId);
    const teamName = normalizeTeamDisplayName(participant?.teamName ?? "Equipe");

    return {
      id: entry.participantId,
      teamName,
      playerName: participant?.displayName ?? "Jogador",
      crest: participant?.teamBadgeUrl ?? resolveTeamVisualByName(teamName) ?? undefined,
      metricLabel: "gols",
      metricValue: String(entry.goalsFor),
      helper: `${entry.points} pts • ${entry.wins} vitórias • saldo ${entry.goalDifference >= 0 ? "+" : ""}${entry.goalDifference}`,
    };
  });

  const defenseRows = defenseRanking.slice(0, 5).map((entry) => {
    const participant = bundle.participants.find((item) => item.id === entry.participantId);
    const teamName = normalizeTeamDisplayName(participant?.teamName ?? "Equipe");

    return {
      id: entry.participantId,
      teamName,
      playerName: participant?.displayName ?? "Jogador",
      crest: participant?.teamBadgeUrl ?? resolveTeamVisualByName(teamName) ?? undefined,
      metricLabel: "sofr.",
      metricValue: String(entry.goalsAgainst),
      helper: `${entry.played} jogos • ${entry.points} pts • defesa mais segura`,
    };
  });

  const winRateRows = winRateRanking.slice(0, 5).map((entry) => {
    const participant = bundle.participants.find((item) => item.id === entry.participantId);
    const winRate = calculateVictoryRate(entry.wins, entry.played);
    const teamName = normalizeTeamDisplayName(participant?.teamName ?? "Equipe");

    return {
      id: entry.participantId,
      teamName,
      playerName: participant?.displayName ?? "Jogador",
      crest: participant?.teamBadgeUrl ?? resolveTeamVisualByName(teamName) ?? undefined,
      metricLabel: "% vit.",
      metricValue: `${Math.round(winRate)}%`,
      helper: `${entry.wins} vitórias em ${entry.played} jogos • ${entry.points} pts`,
    };
  });

  return (
    <Screen
      scroll
      className="px-6"
      backgroundVariant="none"
      style={{ backgroundColor: "#0a1220" }}
    >
      <View className="gap-6 py-8" style={{ backgroundColor: "#0a1220" }}>
        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />

        <View className="gap-2">
          <Text
            style={{
              color: "#F3F7FF",
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Estatísticas
          </Text>
          <Text
            style={{
              color: "#F8FAFC",
              fontSize: 30,
              fontWeight: "800",
            }}
          >
            {bundle.tournament.name}
          </Text>
          <Text
            style={{
              color: "#AEBBDA",
              fontSize: 16,
              lineHeight: 28,
            }}
          >
            Painel estatístico da temporada com ataque, defesa e aproveitamento de vitórias atualizados pelo placar salvo.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-4">
          <StatSummaryCard
            label="Melhor ataque"
            value={`${attackLeader?.goalsFor ?? 0}`}
            helper={`${normalizeTeamDisplayName(attackLeaderParticipant?.teamName ?? "Equipe líder")} lidera em gols marcados.`}
          />
          <StatSummaryCard
            label="Melhor defesa"
            value={`${defenseLeader?.goalsAgainst ?? 0}`}
            helper={`${normalizeTeamDisplayName(defenseLeaderParticipant?.teamName ?? "Equipe líder")} sofreu menos gols até aqui.`}
          />
          <StatSummaryCard
            label="% de vitórias"
            value={`${Math.round(calculateVictoryRate(winRateLeader?.wins ?? 0, winRateLeader?.played ?? 0))}%`}
            helper={`${normalizeTeamDisplayName(winRateLeaderParticipant?.teamName ?? "Equipe líder")} tem o melhor aproveitamento de vitórias.`}
          />
        </View>

        <RevealOnScroll delay={0}>
          <StatisticSection
            title="Classificação por ataque"
            subtitle="Ranking ofensivo com base em gols marcados na temporada."
            rows={attackRows}
          />
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <StatisticSection
            title="Classificação por defesa"
            subtitle="Ranking defensivo ordenado por menos gols sofridos."
            rows={defenseRows}
          />
        </RevealOnScroll>

        <RevealOnScroll delay={160}>
          <StatisticSection
            title="Classificação por % de vitórias"
            subtitle="Aproveitamento calculado sobre vitórias em relação ao total de jogos."
            rows={winRateRows}
          />
        </RevealOnScroll>

        <Pressable
          onPress={() =>
            router.replace({ pathname: "/tournament/standings", params: { id: bundle.campeonato.id } })
          }
          style={{
            alignSelf: "flex-start",
            borderRadius: 18,
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#d7dce5",
            paddingHorizontal: 18,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              color: "#223c7b",
              fontSize: 15,
              fontWeight: "800",
            }}
          >
            Voltar para classificação
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
