import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import StandingsTableExact, { type StandingRow } from "@/components/standings/StandingsTableExact";
import { BackButton } from "@/components/ui/BackButton";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";
import { isTournamentAccessLocked, resolveTournamentAccessMode } from "@/lib/tournament-access";
import { getTournamentBundle } from "@/lib/tournament-display";
import {
  getLatestFinishedRound,
  recomputeCampeonatoClassificacaoUntilRound,
} from "@/lib/tournament-results";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

type RecentFormResult = "win" | "draw" | "loss" | "empty";

export default function TournamentStandingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const videos = useVideoStore((state) => state.videos);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const hydrated = useTournamentDataHydrated();
  const { contentMaxWidth } = usePanelGrid();
  const tournamentMissing = Boolean(hydrated && (!id || !campeonatos.some((campeonato) => campeonato.id === id)));

  if (!hydrated) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View className="w-full self-center py-8" style={{ maxWidth: contentMaxWidth }}>
          <ScreenState
            title="Carregando classificacao"
            description="Buscando tabela real, pontos, saldo e leitura completa da temporada."
          />
        </View>
      </Screen>
    );
  }

  if (tournamentMissing) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato nao encontrado"
            description="A classificacao solicitada nao pertence mais a uma temporada valida."
          />
        </View>
      </Screen>
    );
  }

  const bundle = id ? getTournamentBundle(id, campeonatos, videos) : null;

  if (!bundle) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato nao encontrado"
            description="A classificacao solicitada nao pertence mais a uma temporada valida."
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

    router.replace({ pathname: "/tournament/standings", params: { id: currentTournamentId } });
  }, [bundle.campeonato.id, currentTournamentId, lockToActiveTournament]);

  const [groupedView, setGroupedView] = useState(true);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const supportsGroupedStandings =
    bundle.tournament.format === "groups" || bundle.tournament.format === "groups_knockout";
  const effectiveGroupedView = supportsGroupedStandings ? groupedView : false;

  const sortedStandings = useMemo(
    () =>
      [...bundle.standings].sort((current, next) => {
        if (next.points !== current.points) return next.points - current.points;
        if (next.goalDifference !== current.goalDifference) return next.goalDifference - current.goalDifference;
        return next.goalsFor - current.goalsFor;
      }),
    [bundle.standings],
  );
  const latestFinishedRound = useMemo(
    () => getLatestFinishedRound(bundle.campeonato),
    [bundle.campeonato],
  );
  const previousRoundStandings = useMemo(
    () =>
      latestFinishedRound > 1
        ? recomputeCampeonatoClassificacaoUntilRound(bundle.campeonato, latestFinishedRound - 1)
        : [],
    [bundle.campeonato, latestFinishedRound],
  );
  const previousGlobalPositionById = useMemo(
    () =>
      new Map(
        previousRoundStandings.map((entry, index) => [entry.participanteId, index + 1]),
      ),
    [previousRoundStandings],
  );
  const recentFormByParticipantId = useMemo(() => {
    const formMap = new Map<string, RecentFormResult[]>();

    bundle.participants.forEach((participant) => {
      formMap.set(participant.id, []);
    });

    bundle.matches
      .map((match, index) => ({ match, index }))
      .filter(
        ({ match }) =>
          match.status === "finished" &&
          match.homeGoals != null &&
          match.awayGoals != null,
      )
      .sort(
        (current, next) =>
          next.match.round - current.match.round || next.index - current.index,
      )
      .forEach(({ match }) => {
        const homeGoals = match.homeGoals ?? 0;
        const awayGoals = match.awayGoals ?? 0;
        const homeResult: RecentFormResult =
          homeGoals > awayGoals ? "win" : homeGoals < awayGoals ? "loss" : "draw";
        const awayResult: RecentFormResult =
          awayGoals > homeGoals ? "win" : awayGoals < homeGoals ? "loss" : "draw";

        const homeForm = formMap.get(match.homeParticipantId) ?? [];
        const awayForm = formMap.get(match.awayParticipantId) ?? [];

        if (homeForm.length < 5) {
          homeForm.push(homeResult);
          formMap.set(match.homeParticipantId, homeForm);
        }

        if (awayForm.length < 5) {
          awayForm.push(awayResult);
          formMap.set(match.awayParticipantId, awayForm);
        }
      });

    bundle.participants.forEach((participant) => {
      const currentForm = formMap.get(participant.id) ?? [];
      const paddedForm = [...currentForm];

      while (paddedForm.length < 5) {
        paddedForm.push("empty");
      }

      formMap.set(participant.id, paddedForm.slice(0, 5));
    });

    return formMap;
  }, [bundle.matches, bundle.participants]);

  const groupedStandings = useMemo(() => {
    if (!effectiveGroupedView) {
      return [{ label: "Classificacao geral", entries: sortedStandings }];
    }

    const map = new Map<string, typeof sortedStandings>();

    sortedStandings.forEach((entry) => {
      const participant = bundle.participants.find((item) => item.id === entry.participantId);
      const groupName = participant?.groupName ?? "Liga principal";
      const current = map.get(groupName) ?? [];
      map.set(groupName, [...current, entry]);
    });

    return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }));
  }, [bundle.participants, effectiveGroupedView, sortedStandings]);

  const groupedRows = useMemo(
    () =>
      groupedStandings.map((group) => ({
        label: group.label,
        rows: group.entries.map((entry, index): StandingRow => {
          const participant = bundle.participants.find((item) => item.id === entry.participantId);
          const teamName = normalizeTeamDisplayName(participant?.teamName ?? "Time");
          const previousGroupEntries = effectiveGroupedView
            ? previousRoundStandings.filter((previousEntry) => {
                const previousParticipant = bundle.participants.find(
                  (item) => item.id === previousEntry.participanteId,
                );
                return (previousParticipant?.groupName ?? "Liga principal") === group.label;
              })
            : [];
          const previousPosition = effectiveGroupedView
            ? previousGroupEntries.findIndex(
                (previousEntry) => previousEntry.participanteId === entry.participantId,
              ) + 1
            : previousGlobalPositionById.get(entry.participantId);

          return {
            id: entry.participantId,
            position: index + 1,
            name: teamName,
            crest: participant?.teamBadgeUrl ?? resolveTeamVisualByName(teamName) ?? undefined,
            points: entry.points,
            played: entry.played,
            wins: entry.wins,
            draws: entry.draws,
            losses: entry.losses,
            goalsFor: entry.goalsFor,
            goalsAgainst: entry.goalsAgainst,
            goalDifference: entry.goalDifference,
            recentForm: recentFormByParticipantId.get(entry.participantId) ?? [
              "empty",
              "empty",
              "empty",
              "empty",
              "empty",
            ],
            previousPosition:
              previousPosition && previousPosition > 0 ? previousPosition : undefined,
          };
        }),
      })),
    [
      bundle.participants,
      effectiveGroupedView,
      groupedStandings,
      previousGlobalPositionById,
      previousRoundStandings,
      recentFormByParticipantId,
    ],
  );

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />

        <SectionHeader
          eyebrow="Classificacao"
          title={bundle.tournament.name}
          subtitle="Tabela oficial da temporada com leitura limpa de pontuacao, saldo, movimento e ultimas cinco partidas."
        />

        <ScrollRow>
          <ChoiceChip
            label="Painel"
            onPress={() => router.push({ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } })}
          />
          <ChoiceChip label="Classificacao" active />
          <ChoiceChip
            label="Estatisticas"
            onPress={() =>
              router.push({ pathname: "/tournament/statistics", params: { id: bundle.campeonato.id } })
            }
          />
          <ChoiceChip
            label="Videos"
            onPress={() => router.push({ pathname: "/tournament/videos", params: { id: bundle.campeonato.id } })}
          />
        </ScrollRow>

        {supportsGroupedStandings ? (
          <RevealOnScroll delay={60}>
            <LiveBorderCard accent="blue" radius={16} padding={1.3} backgroundColor="#09121C">
              <View className="gap-4 p-4">
                <View className="gap-1">
                  <Text className="text-xs font-black uppercase tracking-[2px] text-[#D7E5FF]">
                    Modo de leitura
                  </Text>
                  <Text className="text-sm leading-6 text-[#AEBBDA]">
                    Alterne entre grupos e tabela geral sem perder a leitura visual da campanha.
                  </Text>
                </View>

                <View className="flex-row flex-wrap gap-3">
                  <ChoiceChip
                    label="Por grupo"
                    active={groupedView}
                    onPress={() => setGroupedView(true)}
                  />
                  <ChoiceChip
                    label="Geral"
                    active={!groupedView}
                    onPress={() => setGroupedView(false)}
                  />
                </View>
              </View>
            </LiveBorderCard>
          </RevealOnScroll>
        ) : null}

        {groupedRows.some((group) => group.rows.length > 0) ? (
          groupedRows.map((group, groupIndex) => (
            <RevealOnScroll key={group.label} delay={groupIndex * 70}>
              <StandingsTableExact
                title={bundle.tournament.name}
                phaseLabel={
                  !supportsGroupedStandings && bundle.tournament.format === "league"
                    ? "Pontos corridos"
                    : group.label
                }
                data={group.rows}
                selectedId={selectedId}
                showTitle={groupIndex === 0}
                onSelect={(item) => setSelectedId(item.id)}
              />
            </RevealOnScroll>
          ))
        ) : (
          <ScreenState
            title="Tabela indisponivel"
            description="Este campeonato ainda nao tem participantes ou jogos suficientes para montar uma classificacao confiavel."
          />
        )}

        <View className="items-start">
          <PrimaryButton
            label="Abrir estatisticas"
            icon="stats-chart-outline"
            variant="light"
            onPress={() =>
              router.replace({ pathname: "/tournament/statistics", params: { id: bundle.campeonato.id } })
            }
            className="self-start"
          />
        </View>
      </View>
    </Screen>
  );
}
