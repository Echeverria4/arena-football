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
import { computeQualProbs, countPendingRounds } from "@/lib/classification-probability";
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

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, entries]) => ({ label, entries }));
  }, [bundle.participants, effectiveGroupedView, sortedStandings]);

  // ── Qualification probability ──────────────────────────────────────────────
  const qualProbMap = useMemo<Map<string, number>>(() => {
    const fmt = bundle.campeonato.formato ?? "league";
    const allMatches = bundle.campeonato.rodadas.flat();

    if (fmt === "groups_knockout") {
      const numGrpRounds = bundle.campeonato.numRodadasGrupos ?? 0;
      if (numGrpRounds === 0) return new Map();

      const advMode = bundle.campeonato.gruposClassificacaoModo ?? "top_two";
      const qualifyingPositions =
        advMode === "first_only" ? 1
        : advMode === "top_two" ? 2
        : advMode === "first_direct_second_playoff" ? 2
        : 3; // first_direct_second_vs_third_playoff

      const combined = new Map<string, number>();
      const groupMap = new Map<string, string[]>();
      for (const p of bundle.campeonato.participantes) {
        const g = p.grupo ?? "Grupo A";
        const arr = groupMap.get(g) ?? [];
        arr.push(p.id);
        groupMap.set(g, arr);
      }

      for (const [, ids] of groupMap) {
        const groupIdSet = new Set(ids);
        const groupMatches = allMatches.filter(
          (m) => m.rodada <= numGrpRounds && groupIdSet.has(m.mandanteId) && groupIdSet.has(m.visitanteId),
        );
        const groupPending = countPendingRounds(groupMatches, numGrpRounds);

        if (groupPending === 0) {
          if (groupMatches.length === 0) continue;
          // Group finished — directly classify top qualifyingPositions as 100%
          const groupStandings = sortedStandings
            .filter((e) => ids.includes(e.participantId))
            .sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
              return b.goalsFor - a.goalsFor;
            });
          groupStandings.slice(0, qualifyingPositions).forEach((e) => combined.set(e.participantId, 100));
          continue;
        }

        if (groupPending > 2) continue;

        const probs = computeQualProbs(ids, allMatches, numGrpRounds, qualifyingPositions);

        // Only keep non-zero probabilities (0% = already eliminated, no badge needed)
        for (const [id, p] of probs) {
          if (p > 0) combined.set(id, p);
        }
      }

      return combined;
    }

    if (fmt === "league") {
      // Show probabilities when ≤ 5 rounds remain, only for top-4 players
      const pending = countPendingRounds(allMatches, Infinity);
      if (pending === 0 || pending > 5) return new Map();

      const allIds = bundle.campeonato.participantes.map((p) => p.id);
      const top4Ids = sortedStandings.slice(0, 4).map((e) => e.participantId);
      const probs = computeQualProbs(allIds, allMatches, Infinity, 4);

      // Only expose probabilities for the top-4 players
      const filtered = new Map<string, number>();
      for (const id of top4Ids) {
        const p = probs.get(id);
        if (p != null) filtered.set(id, p);
      }
      return filtered;
    }

    return new Map();
  }, [bundle.campeonato, bundle.campeonato.participantes, sortedStandings]);

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
            qualProb: qualProbMap.get(entry.participantId),
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
      qualProbMap,
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
          <ChoiceChip
            label="Músicas"
            onPress={() => router.push({ pathname: "/tournament/musicas", params: { id: bundle.campeonato.id } })}
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
                advancementMode={
                  bundle.campeonato.formato === "groups_knockout"
                    ? bundle.campeonato.gruposClassificacaoModo ?? "top_two"
                    : null
                }
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
