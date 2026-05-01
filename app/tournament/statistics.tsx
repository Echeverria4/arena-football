import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Image, Text, View } from "react-native";

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
import { isTournamentAccessLocked, resolveTournamentAccessMode } from "@/lib/tournament-access";
import { normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";
import { getTournamentBundle } from "@/lib/tournament-display";
import { calculateVictoryRate } from "@/lib/tournament-results";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

type StatAccent = "neon" | "cyan" | "emerald";

const ACCENT: Record<StatAccent, { text: string; border: string; bg: string; label: string }> = {
  neon:    { text: "#C4B5FD", border: "rgba(167,139,250,0.38)", bg: "rgba(139,92,246,0.12)", label: "#7B9EC8" },
  cyan:    { text: "#67E8F9", border: "rgba(34,211,238,0.36)",  bg: "rgba(34,211,238,0.10)",  label: "#5B9EC8" },
  emerald: { text: "#C6F8D6", border: "rgba(87,255,124,0.34)",  bg: "rgba(87,255,124,0.10)",  label: "#5BA87C" },
};

function StatSummaryCard({
  label,
  value,
  helper,
  accent = "neon",
}: {
  label: string;
  value: string;
  helper: string;
  accent?: StatAccent;
}) {
  const p = ACCENT[accent];
  return (
    <View
      style={{
        minWidth: 100,
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: p.border,
        backgroundColor: p.bg,
        paddingHorizontal: 14,
        paddingVertical: 16,
        minHeight: 110,
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <Text
        style={{
          color: p.label,
          fontSize: 9,
          fontWeight: "900",
          letterSpacing: 1.8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text style={{ color: p.text, fontSize: 26, fontWeight: "900" }}>{value}</Text>
      <Text style={{ color: "#5B7FC4", fontSize: 11, lineHeight: 16 }}>{helper}</Text>
    </View>
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
  const isTop = rank === 1;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: isTop ? "rgba(139,92,246,0.10)" : "rgba(7,13,24,0.70)",
        borderWidth: 1,
        borderColor: isTop ? "rgba(167,139,250,0.30)" : "rgba(59,91,255,0.12)",
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          flexShrink: 0,
          backgroundColor: isTop ? "rgba(196,181,253,0.22)" : "rgba(59,91,255,0.12)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: isTop ? "#C4B5FD" : "#5B7FC4",
            fontSize: 12,
            fontWeight: "900",
          }}
        >
          {rank}
        </Text>
      </View>

      {crest ? (
        <Image source={{ uri: crest }} style={{ width: 28, height: 28, flexShrink: 0 }} resizeMode="contain" />
      ) : (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            flexShrink: 0,
            backgroundColor: "rgba(59,91,255,0.14)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#7B9EC8", fontSize: 9, fontWeight: "900" }}>
            {teamName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, gap: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: "#D7E5FF", fontSize: 12, fontWeight: "800" }}>{teamName}</Text>
        <Text numberOfLines={1} style={{ color: "#5B7FC4", fontSize: 10 }}>{playerName}</Text>
        <Text numberOfLines={1} style={{ color: "#3D5680", fontSize: 10 }}>{helper}</Text>
      </View>

      <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
        <Text style={{ color: "#F3F7FF", fontSize: 18, fontWeight: "900" }}>{metricValue}</Text>
        <Text
          style={{
            color: "#5B7FC4",
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 1,
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
  accent,
  rows,
}: {
  title: string;
  subtitle: string;
  accent: StatAccent;
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
  const p = ACCENT[accent];
  return (
    <LiveBorderCard accent="blue" radius={18} padding={1.3} backgroundColor="#060D18">
      <View style={{ gap: 14, padding: 16 }}>
        <View style={{ gap: 4 }}>
          <Text
            style={{
              color: p.text,
              fontSize: 10,
              fontWeight: "900",
              letterSpacing: 1.8,
              textTransform: "uppercase",
            }}
          >
            {title}
          </Text>
          <Text style={{ color: "#5B7FC4", fontSize: 12, lineHeight: 18 }}>{subtitle}</Text>
        </View>
        <View style={{ gap: 8 }}>
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
  const { contentMaxWidth } = usePanelGrid();

  const bundle = hydrated && id ? getTournamentBundle(id, campeonatos, videos) : null;
  const activeTournamentAccessMode = resolveTournamentAccessMode(tournamentAccess, currentTournamentId);
  const lockToActiveTournament = Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);

  useEffect(() => {
    if (!lockToActiveTournament || !currentTournamentId || !bundle || bundle.campeonato.id === currentTournamentId) {
      return;
    }
    router.replace({ pathname: "/tournament/statistics", params: { id: currentTournamentId } });
  }, [bundle?.campeonato.id, currentTournamentId, lockToActiveTournament]);

  if (!hydrated) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View style={{ maxWidth: contentMaxWidth, width: "100%", alignSelf: "center", paddingVertical: 32 }}>
          <ScreenState title="Carregando estatísticas" description="Sincronizando gols, defesa e aproveitamento da temporada." />
        </View>
      </Screen>
    );
  }

  if (!bundle) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View style={{ maxWidth: contentMaxWidth, width: "100%", alignSelf: "center", gap: 24, paddingVertical: 32 }}>
          <BackButton fallbackHref="/tournaments" />
          <ScreenState title="Campeonato não encontrado" description="Este painel de estatísticas não corresponde a um campeonato ativo." />
        </View>
      </Screen>
    );
  }

  if (bundle.standings.length === 0) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View style={{ maxWidth: contentMaxWidth, width: "100%", alignSelf: "center", gap: 24, paddingVertical: 32 }}>
          <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />
          <ScreenState
            title="Estatísticas indisponíveis"
            description="Sem participantes ou rodadas suficientes, o painel de ataque, defesa e aproveitamento ainda não pode ser calculado."
          />
        </View>
      </Screen>
    );
  }

  const attackRanking = [...bundle.standings].sort((a, b) => b.goalsFor - a.goalsFor);
  const defenseRanking = [...bundle.standings].sort((a, b) => {
    if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
    return b.points - a.points;
  });
  const winRateRanking = [...bundle.standings].sort((a, b) => {
    const diff = calculateVictoryRate(b.wins, b.played) - calculateVictoryRate(a.wins, a.played);
    return diff !== 0 ? diff : b.points - a.points;
  });

  const attackLeader = attackRanking[0];
  const defenseLeader = defenseRanking[0];
  const winRateLeader = winRateRanking[0];

  const attackLeaderParticipant = bundle.participants.find((p) => p.id === attackLeader?.participantId);
  const defenseLeaderParticipant = bundle.participants.find((p) => p.id === defenseLeader?.participantId);
  const winRateLeaderParticipant = bundle.participants.find((p) => p.id === winRateLeader?.participantId);

  const attackRows = attackRanking.slice(0, 5).map((entry) => {
    const participant = bundle.participants.find((p) => p.id === entry.participantId);
    const teamName = normalizeTeamDisplayName(participant?.teamName ?? "Equipe");
    return {
      id: entry.participantId,
      teamName,
      playerName: participant?.displayName ?? "Jogador",
      crest: participant?.teamBadgeUrl ?? resolveTeamVisualByName(teamName) ?? undefined,
      metricLabel: "gols",
      metricValue: String(entry.goalsFor),
      helper: `${entry.points} pts · ${entry.wins} vitórias · saldo ${entry.goalDifference >= 0 ? "+" : ""}${entry.goalDifference}`,
    };
  });

  const defenseRows = defenseRanking.slice(0, 5).map((entry) => {
    const participant = bundle.participants.find((p) => p.id === entry.participantId);
    const teamName = normalizeTeamDisplayName(participant?.teamName ?? "Equipe");
    return {
      id: entry.participantId,
      teamName,
      playerName: participant?.displayName ?? "Jogador",
      crest: participant?.teamBadgeUrl ?? resolveTeamVisualByName(teamName) ?? undefined,
      metricLabel: "sofr.",
      metricValue: String(entry.goalsAgainst),
      helper: `${entry.played} jogos · ${entry.points} pts`,
    };
  });

  const winRateRows = winRateRanking.slice(0, 5).map((entry) => {
    const participant = bundle.participants.find((p) => p.id === entry.participantId);
    const winRate = calculateVictoryRate(entry.wins, entry.played);
    const teamName = normalizeTeamDisplayName(participant?.teamName ?? "Equipe");
    return {
      id: entry.participantId,
      teamName,
      playerName: participant?.displayName ?? "Jogador",
      crest: participant?.teamBadgeUrl ?? resolveTeamVisualByName(teamName) ?? undefined,
      metricLabel: "% vit.",
      metricValue: `${Math.round(winRate)}%`,
      helper: `${entry.wins} vitórias em ${entry.played} jogos · ${entry.points} pts`,
    };
  });

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View
        style={{
          maxWidth: contentMaxWidth,
          width: "100%",
          alignSelf: "center",
          gap: 24,
          paddingVertical: 32,
        }}
      >
        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />

        <SectionHeader
          eyebrow="Estatísticas"
          title={bundle.tournament.name}
          subtitle="Ranking ofensivo, defensivo e aproveitamento por vitórias de cada participante na temporada."
        />

        <ScrollRow>
          <ChoiceChip
            label="Painel"
            onPress={() => router.push({ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } })}
          />
          <ChoiceChip
            label="Classificação"
            onPress={() => router.push({ pathname: "/tournament/standings", params: { id: bundle.campeonato.id } })}
          />
          <ChoiceChip label="Estatísticas" active />
          <ChoiceChip
            label="Vídeos"
            onPress={() => router.push({ pathname: "/tournament/videos", params: { id: bundle.campeonato.id } })}
          />
        </ScrollRow>

        {/* Summary tiles */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <StatSummaryCard
            label="Melhor ataque"
            value={String(attackLeader?.goalsFor ?? 0)}
            helper={`${normalizeTeamDisplayName(attackLeaderParticipant?.teamName ?? "Líder")} lidera em gols.`}
            accent="neon"
          />
          <StatSummaryCard
            label="Melhor defesa"
            value={String(defenseLeader?.goalsAgainst ?? 0)}
            helper={`${normalizeTeamDisplayName(defenseLeaderParticipant?.teamName ?? "Líder")} sofreu menos.`}
            accent="cyan"
          />
          <StatSummaryCard
            label="% de vitórias"
            value={`${Math.round(calculateVictoryRate(winRateLeader?.wins ?? 0, winRateLeader?.played ?? 0))}%`}
            helper={`${normalizeTeamDisplayName(winRateLeaderParticipant?.teamName ?? "Líder")} melhor aproveitamento.`}
            accent="emerald"
          />
        </View>

        <RevealOnScroll delay={0}>
          <StatisticSection
            title="Classificação por ataque"
            subtitle="Ranking ofensivo com base em gols marcados na temporada."
            accent="neon"
            rows={attackRows}
          />
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <StatisticSection
            title="Classificação por defesa"
            subtitle="Ranking defensivo ordenado por menos gols sofridos."
            accent="cyan"
            rows={defenseRows}
          />
        </RevealOnScroll>

        <RevealOnScroll delay={160}>
          <StatisticSection
            title="Aproveitamento por vitórias"
            subtitle="Percentual de vitórias em relação ao total de jogos disputados."
            accent="emerald"
            rows={winRateRows}
          />
        </RevealOnScroll>

        <PrimaryButton
          label="Ver classificação"
          icon="podium-outline"
          variant="light"
          onPress={() => router.replace({ pathname: "/tournament/standings", params: { id: bundle.campeonato.id } })}
          className="self-start"
        />
      </View>
    </Screen>
  );
}
