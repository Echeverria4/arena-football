import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { STADIUM_BG } from "../../assets/images/stadium-bg";
import { HistoricCupGrid } from "@/components/matches/HistoricCupGrid";
import type { HistoricCupItem } from "@/components/matches/HistoricCupCard";
import { KnockoutBracket } from "@/components/matches/KnockoutBracket";
import { WhatsAppButton } from "@/components/match/WhatsAppButton";
import { RoundDeadlineCountdownCard } from "@/components/tournament/RoundDeadlineCountdownCard";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { formatRoundDeadlineDays } from "@/lib/season-tournaments";
import { getCurrentOpenRound, getRoundDeadlineCountdown, HOUR_MS } from "@/lib/tournament-deadlines";
import {
  canEditTournament,
  isTournamentAccessLocked,
  resolveTournamentAccessMode,
  useTournamentAccessMode,
} from "@/lib/tournament-access";
import {
  getTeamInitials,
  normalizeTeamDisplayName,
  resolveTeamVisualByName,
} from "@/lib/team-visuals";
import { getTournamentBundle } from "@/lib/tournament-display";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

function SmallCrest({ teamName }: { teamName: string }) {
  const [failed, setFailed] = useState(false);
  const visual = resolveTeamVisualByName(teamName);
  return (
    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#0A1220", borderWidth: 1, borderColor: "rgba(154,184,255,0.18)", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {visual && !failed ? (
        <Image source={{ uri: visual }} style={{ width: 26, height: 26 }} resizeMode="contain" onError={() => setFailed(true)} />
      ) : (
        <Text style={{ color: "#9AB8FF", fontSize: 10, fontWeight: "900" }}>{getTeamInitials(teamName)}</Text>
      )}
    </View>
  );
}

function MatchCrest({ teamName, onPress }: { teamName: string; onPress: () => void }) {
  const [failed, setFailed] = useState(false);
  const visual = resolveTeamVisualByName(teamName);
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", gap: 3 }}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#0E1520", borderWidth: 1, borderColor: "rgba(154,184,255,0.24)", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {visual && !failed ? (
          <Image source={{ uri: visual }} style={{ width: 32, height: 32 }} resizeMode="contain" onError={() => setFailed(true)} />
        ) : (
          <Text style={{ color: "#9AB8FF", fontSize: 13, fontWeight: "900" }}>{getTeamInitials(teamName)}</Text>
        )}
      </View>
      <Text style={{ color: "#4A6490", fontSize: 9, fontWeight: "700", letterSpacing: 0.4 }}>ver jogos</Text>
    </Pressable>
  );
}

export default function TournamentMatchesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 420;
  const isPhone = width < 768;

  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const ajustarTempoExtraRodada = useTournamentStore((state) => state.ajustarTempoExtraRodada);
  const salvarPlacarJogo = useTournamentStore((state) => state.salvarPlacarJogo);
  const definirRodasComPrazo = useTournamentStore((state) => state.definirRodasComPrazo);
  const resetarJogo = useTournamentStore((state) => state.resetarJogo);
  const gerarFaseMataMataCampeonato = useTournamentStore((state) => state.gerarFaseMataMataCampeonato);
  const gerarProximaFaseMataMata = useTournamentStore((state) => state.gerarProximaFaseMataMata);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const setCurrentTournamentId = useAppStore((state) => state.setCurrentTournamentId);
  const videos = useVideoStore((state) => state.videos);
  const hydrated = useTournamentDataHydrated();
  const accessMode = useTournamentAccessMode(id);
  const canManageMatch = canEditTournament(accessMode);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [quickHomeGoals, setQuickHomeGoals] = useState(0);
  const [quickAwayGoals, setQuickAwayGoals] = useState(0);
  const [teamMatchesFor, setTeamMatchesFor] = useState<"home" | "away" | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [countdownExpanded, setCountdownExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"rounds" | "bracket">("rounds");
  const [showRoundsModal, setShowRoundsModal] = useState(false);
  const [pendingActiveRounds, setPendingActiveRounds] = useState<number[] | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const roundTabsRef = useRef<ScrollView>(null);
  const tournamentMissing = Boolean(hydrated && (!id || !campeonatos.some((c) => c.id === id)));

  const bundle = hydrated && id ? getTournamentBundle(id, campeonatos, videos) : null;
  const activeTournamentAccessMode = resolveTournamentAccessMode(tournamentAccess, currentTournamentId);
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);

  useEffect(() => {
    if (!lockToActiveTournament || !currentTournamentId || !bundle || bundle.campeonato.id === currentTournamentId) return;
    router.replace({ pathname: "/tournament/matches", params: { id: currentTournamentId } });
  }, [bundle?.campeonato.id, currentTournamentId, lockToActiveTournament]);

  useEffect(() => {
    if (bundle && bundle.campeonato.id !== currentTournamentId) {
      setCurrentTournamentId(bundle.campeonato.id);
    }
  }, [bundle?.campeonato.id, currentTournamentId, setCurrentTournamentId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const groupedMatches = useMemo(() => {
    const matches = bundle?.matches ?? [];
    const grouped = new Map<number, typeof matches>();
    for (const match of matches) {
      if (!grouped.has(match.round)) grouped.set(match.round, []);
      grouped.get(match.round)!.push(match);
    }
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
  }, [bundle?.matches]);

  const currentOpenRound = bundle ? getCurrentOpenRound(bundle.campeonato) : null;

  // ── Grupos + Mata-mata state ──────────────────────────────────────────────
  const isGroupsKnockout = bundle?.campeonato.formato === "groups_knockout";
  const numRodadasGrupos = bundle?.campeonato.numRodadasGrupos ?? 0;
  const totalRounds = bundle?.campeonato.rodadas.length ?? 0;
  const hasKnockoutRounds = isGroupsKnockout && totalRounds > numRodadasGrupos;

  const groupStageAllDone = isGroupsKnockout && numRodadasGrupos > 0 && (() => {
    const groupRounds = bundle?.campeonato.rodadas.slice(0, numRodadasGrupos) ?? [];
    return groupRounds.flat().every((m) => m.status === "finalizado");
  })();

  const showGerarMataMataBt = canManageMatch && groupStageAllDone && !hasKnockoutRounds;

  const isPureKnockout = bundle?.campeonato.formato === "knockout";
  const showBracketToggle =
    (isPureKnockout && (bundle?.campeonato.rodadas.length ?? 0) > 0) ||
    (isGroupsKnockout && hasKnockoutRounds);

  const showGerarProximaFaseBt = canManageMatch && hasKnockoutRounds && (() => {
    const knockoutRounds = bundle?.campeonato.rodadas.slice(numRodadasGrupos) ?? [];
    if (knockoutRounds.length === 0) return false;
    const modoMata = bundle?.campeonato.modoConfrontoMataMata ?? "single_game";
    const lastRounds = modoMata === "home_away" && knockoutRounds.length >= 2
      ? knockoutRounds.slice(-2)
      : [knockoutRounds[knockoutRounds.length - 1]!];
    const allDone = lastRounds.every((r) => r.every((m) => m.status === "finalizado"));
    const totalWinners = lastRounds[0]?.length ?? 0;
    return allDone && totalWinners >= 2;
  })();

  // Auto-generate first knockout round when group stage is complete
  useEffect(() => {
    if (showGerarMataMataBt && bundle && canManageMatch) {
      gerarFaseMataMataCampeonato(bundle.campeonato.id);
      setSelectedRound(null);
      setViewMode("bracket");
    }
  }, [showGerarMataMataBt]);

  // Auto-advance knockout bracket when all matches in current phase are done
  useEffect(() => {
    if (showGerarProximaFaseBt && bundle && canManageMatch) {
      gerarProximaFaseMataMata(bundle.campeonato.id);
      setSelectedRound(null);
      setViewMode("bracket");
    }
  }, [showGerarProximaFaseBt]);

  // Auto-select: open round, or last round with finished matches, or first round
  useEffect(() => {
    if (!bundle || groupedMatches.length === 0) return;
    if (selectedRound != null) return;

    if (currentOpenRound != null) {
      setSelectedRound(currentOpenRound);
      return;
    }

    const lastFinishedRound = [...groupedMatches]
      .reverse()
      .find(([, matches]) => matches.some((m) => m.status === "finished"));

    setSelectedRound(lastFinishedRound?.[0] ?? groupedMatches[0]?.[0] ?? null);
  }, [groupedMatches, currentOpenRound, bundle, selectedRound]);

  function formatDate(value?: string | null) {
    if (!value) return "Sem prazo";
    return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  function getShortPlayerName(value?: string | null) {
    const safe = (value ?? "").trim();
    return safe ? (safe.split(/\s+/)[0] ?? safe) : "jogador";
  }

  function getTeamCode(teamName?: string | null) {
    const name = normalizeTeamDisplayName(teamName ?? "");
    if (!name) return "SEM";
    const words = name.split(/\s+/).map((w) => w.replace(/[^A-Za-zÀ-ÿ0-9]/g, "")).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.slice(0, 3).map((w) => w[0]?.toUpperCase()).join("");
  }

  const selectedMatch = useMemo(
    () => (bundle?.matches ?? []).find((m) => m.id === selectedMatchId) ?? null,
    [bundle?.matches, selectedMatchId],
  );

  const selectedMatchContext = useMemo(() => {
    if (!bundle || !selectedMatch) return null;
    const homeParticipant = bundle.participants.find((p) => p.id === selectedMatch.homeParticipantId);
    const awayParticipant = bundle.participants.find((p) => p.id === selectedMatch.awayParticipantId);
    const rawHome = bundle.campeonato.participantes.find((p) => p.id === selectedMatch.homeParticipantId);
    const rawAway = bundle.campeonato.participantes.find((p) => p.id === selectedMatch.awayParticipantId);
    return {
      matchId: selectedMatch.id,
      round: selectedMatch.round,
      homeGoals: selectedMatch.homeGoals ?? 0,
      awayGoals: selectedMatch.awayGoals ?? 0,
      dateLabel: formatDate(selectedMatch.deadlineAt),
      homeTeamName: normalizeTeamDisplayName(homeParticipant?.teamName ?? rawHome?.time ?? "Mandante"),
      awayTeamName: normalizeTeamDisplayName(awayParticipant?.teamName ?? rawAway?.time ?? "Visitante"),
      homePlayerName: rawHome?.nome ?? homeParticipant?.displayName ?? "Mandante",
      awayPlayerName: rawAway?.nome ?? awayParticipant?.displayName ?? "Visitante",
      homePhone: rawHome?.whatsapp ?? null,
      awayPhone: rawAway?.whatsapp ?? null,
      homeParticipantId: selectedMatch.homeParticipantId,
      awayParticipantId: selectedMatch.awayParticipantId,
    };
  }, [bundle, selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) return;
    setQuickHomeGoals(selectedMatch.homeGoals ?? 0);
    setQuickAwayGoals(selectedMatch.awayGoals ?? 0);
  }, [selectedMatchId]);

  if (!hydrated) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <ScreenState title="Carregando rodadas" description="Sincronizando confrontos, prazos e placares salvos." />
      </Screen>
    );
  }

  if (tournamentMissing || !bundle) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/tournaments" />
          <ScreenState title="Campeonato não encontrado" description="Não existe uma temporada válida para abrir essas rodadas." />
        </View>
      </Screen>
    );
  }

  const seasonLabel = bundle.campeonato.temporada ?? "Temporada 01";
  const roundsStarted = Boolean(bundle.campeonato.inicioEm && bundle.campeonato.prazoRodadaDias);
  const activeRoundCountdown =
    currentOpenRound != null
      ? getRoundDeadlineCountdown(bundle.campeonato, currentOpenRound, new Date(now))
      : null;

  const selectedRoundMatches = groupedMatches.find(([r]) => r === selectedRound)?.[1] ?? [];

  function getHistoricItems(roundMatches: typeof selectedRoundMatches): HistoricCupItem[] {
    return roundMatches.map((match) => {
      const home = bundle!.participants.find((p) => p.id === match.homeParticipantId);
      const away = bundle!.participants.find((p) => p.id === match.awayParticipantId);
      const homeTeamName = normalizeTeamDisplayName(home?.teamName ?? "");
      const awayTeamName = normalizeTeamDisplayName(away?.teamName ?? "");
      const homeGoals = match.homeGoals;
      const awayGoals = match.awayGoals;
      return {
        id: match.id,
        editionLabel: seasonLabel,
        dateLabel: formatDate(match.deadlineAt),
        homeCode: getTeamCode(homeTeamName),
        awayCode: getTeamCode(awayTeamName),
        homeFlagUrl: resolveTeamVisualByName(homeTeamName) ?? undefined,
        awayFlagUrl: resolveTeamVisualByName(awayTeamName) ?? undefined,
        homePlayer: home?.displayName ?? getTeamInitials(homeTeamName || "Mandante"),
        awayPlayer: away?.displayName ?? getTeamInitials(awayTeamName || "Visitante"),
        scoreTop:
          homeGoals != null && awayGoals != null ? `${homeGoals}-${awayGoals}` : "VS",
        stadium:
          match.status === "finished"
            ? "Resultado validado"
            : match.status === "in_progress"
              ? "Partida em andamento"
              : `${home?.displayName ?? "Mandante"} organiza a sala`,
        city:
          match.status === "finished"
            ? "Arquivo oficial da temporada"
            : "",
        status: match.status,
      };
    });
  }

  function closeQuickActions() {
    setSelectedMatchId(null);
    setTeamMatchesFor(null);
    setShowResetConfirm(false);
  }

  function updateQuickScore(
    delta: number,
    setter: (value: number | ((v: number) => number)) => void,
  ) {
    setter((v) => Math.max(0, v + delta));
  }

  function handleSaveQuickScore() {
    if (!selectedMatchContext || !bundle) return;
    salvarPlacarJogo(bundle.campeonato.id, selectedMatchContext.matchId, quickHomeGoals, quickAwayGoals);
    Alert.alert(
      "Placar salvo",
      `${selectedMatchContext.homeTeamName} ${quickHomeGoals} x ${quickAwayGoals} ${selectedMatchContext.awayTeamName}.`,
    );
    closeQuickActions();
  }

  function handleAdjustRoundExtraTime(deltaMs: number) {
    if (currentOpenRound == null || !bundle) return;
    ajustarTempoExtraRodada(bundle.campeonato.id, currentOpenRound, deltaMs);
  }

  const baseBottomPadding = isSmallPhone ? 108 : isPhone ? 118 : 132;

  return (
    <View style={{ flex: 1 }}>
      {STADIUM_BG ? (
        <ImageBackground
          source={STADIUM_BG}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
          imageStyle={{ width: "100%", height: "100%" }}
        >
          {/* Base dark tint so image doesn't blow out in bright screens */}
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(3,5,11,0.28)" }} />
          {/* Gradient: dark top (header legibility) → transparent middle (field visible) → dark bottom (tab bar) */}
          <LinearGradient
            colors={[
              "rgba(3,5,11,0.78)",
              "rgba(3,5,11,0.35)",
              "rgba(3,5,11,0.10)",
              "rgba(3,5,11,0.35)",
              "rgba(3,5,11,0.72)",
            ]}
            locations={[0, 0.22, 0.50, 0.78, 1]}
            style={{ flex: 1 }}
          />
        </ImageBackground>
      ) : null}
    <Screen
      backgroundVariant="none"
      style={{ backgroundColor: "transparent" }}
      overlay={
        <>
        <Modal transparent visible={Boolean(selectedMatchContext)} animationType="fade" onRequestClose={closeQuickActions}>
          <Pressable
            onPress={closeQuickActions}
            style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, backgroundColor: "rgba(4,8,18,0.54)" }}
          >
            {selectedMatchContext ? (
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{
                  position: "relative",
                  zIndex: 2,
                  alignSelf: "center",
                  width: "100%",
                  maxWidth: 440,
                  borderRadius: 20,
                  padding: 20,
                  backgroundColor: "rgba(8,15,28,0.90)",
                  borderWidth: 1,
                  borderColor: "rgba(154,184,255,0.18)",
                }}
              >
                {/* ── Team matches inline view ── */}
                {teamMatchesFor ? (() => {
                  const tmTeamName = teamMatchesFor === "home" ? selectedMatchContext.homeTeamName : selectedMatchContext.awayTeamName;
                  const tmParticipantId = teamMatchesFor === "home" ? selectedMatchContext.homeParticipantId : selectedMatchContext.awayParticipantId;
                  const tmMatches = bundle.campeonato.rodadas.flat().filter(
                    (m) => m.mandanteId === tmParticipantId || m.visitanteId === tmParticipantId,
                  );
                  return (
                    <View style={{ gap: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Pressable onPress={(e) => { e.stopPropagation(); setTeamMatchesFor(null); }} style={{ padding: 6 }}>
                          <Text style={{ color: "#9AB8FF", fontSize: 20 }}>←</Text>
                        </Pressable>
                        <SmallCrest teamName={tmTeamName} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "#9AB8FF", fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" }}>Jogos do time</Text>
                          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }} numberOfLines={1}>{tmTeamName}</Text>
                        </View>
                      </View>

                      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {tmMatches.map((m) => {
                          const isHome = m.mandanteId === tmParticipantId;
                          const oppId = isHome ? m.visitanteId : m.mandanteId;
                          const opp = bundle.campeonato.participantes.find((p) => p.id === oppId);
                          const hasScore = m.placarMandante != null && m.placarVisitante != null;
                          const myG = isHome ? (m.placarMandante ?? 0) : (m.placarVisitante ?? 0);
                          const oppG = isHome ? (m.placarVisitante ?? 0) : (m.placarMandante ?? 0);
                          const rc = !hasScore ? "#AEBBDA" : myG > oppG ? "#57FF7C" : myG < oppG ? "#FF6B7A" : "#FFD77A";
                          const oppTeamName = normalizeTeamDisplayName(opp?.time ?? "");
                          return (
                            <View key={m.id} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 12, paddingVertical: 10, gap: 10 }}>
                              {/* Round badge */}
                              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(154,184,255,0.10)", alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ color: "#9AB8FF", fontSize: 10, fontWeight: "800" }}>R{m.rodada}</Text>
                              </View>

                              {/* Opponent crest + team name */}
                              <SmallCrest teamName={oppTeamName || "?"} />
                              <Text style={{ flex: 1, color: "#F3F7FF", fontSize: 13, fontWeight: "700" }} numberOfLines={1}>
                                {oppTeamName || "Adversário"}
                              </Text>

                              {/* Result */}
                              <View style={{ alignItems: "flex-end", gap: 1 }}>
                                {hasScore ? (
                                  <>
                                    <Text style={{ color: rc, fontSize: 16, fontWeight: "900" }}>{myG}–{oppG}</Text>
                                    <Text style={{ color: rc, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 }}>{myG > oppG ? "VITÓRIA" : myG < oppG ? "DERROTA" : "EMPATE"}</Text>
                                  </>
                                ) : (
                                  <Text style={{ color: "#4A6490", fontSize: 11, fontWeight: "700" }}>Pendente</Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </ScrollView>

                      <PrimaryButton label="Fechar" variant="secondary" onPress={closeQuickActions} />
                    </View>
                  );
                })() : (
                  <>
                    <View style={{ gap: 4 }}>
                      <Text style={{ color: "#9AB8FF", fontSize: 11, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase" }}>
                        Menu da partida
                      </Text>
                      <Text style={{ color: "#FFFFFF", fontSize: isSmallPhone ? 18 : 21, fontWeight: "900" }}>
                        {selectedMatchContext.homeTeamName} x {selectedMatchContext.awayTeamName}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 20 }}>
                        Rodada {selectedMatchContext.round} • {selectedMatchContext.dateLabel}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.50)", fontSize: 12, lineHeight: 18 }}>
                        {selectedMatchContext.homePlayerName} enfrenta {selectedMatchContext.awayPlayerName}.
                      </Text>
                    </View>

                    <View style={{ marginTop: 14, gap: 10 }}>
                      {canManageMatch ? (
                        <>
                          <View style={{ gap: 10, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: "rgba(154,184,255,0.16)", backgroundColor: "rgba(255,255,255,0.04)" }}>
                            <Text style={{ color: "#9AB8FF", fontSize: 10, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase" }}>
                              Lançar placar
                            </Text>

                            <View style={{ flexDirection: "row", gap: 8 }}>
                              {[
                                { label: selectedMatchContext.homeTeamName, player: selectedMatchContext.homePlayerName, goals: quickHomeGoals, setter: setQuickHomeGoals, phone: selectedMatchContext.homePhone, isHome: true },
                                { label: selectedMatchContext.awayTeamName, player: selectedMatchContext.awayPlayerName, goals: quickAwayGoals, setter: setQuickAwayGoals, phone: selectedMatchContext.awayPhone, isHome: false },
                              ].map(({ label, player, goals, setter, phone, isHome }) => (
                                  <View key={isHome ? "home" : "away"} style={{ flex: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "rgba(7,13,24,0.70)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", gap: 8 }}>
                                    <Text numberOfLines={1} style={{ color: "#FFFFFF", fontSize: isSmallPhone ? 12 : 13, fontWeight: "800", textAlign: "center" }}>{label}</Text>

                                    <MatchCrest
                                      teamName={label}
                                      onPress={() => setTeamMatchesFor(isHome ? "home" : "away")}
                                    />

                                    <Text numberOfLines={1} style={{ color: "#AEBBDA", fontSize: 11, textAlign: "center" }}>{player}</Text>

                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                      <Pressable
                                        style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "#171F2B" }}
                                        onPress={(e) => { e.stopPropagation(); updateQuickScore(-1, setter); }}
                                      >
                                        <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700" }}>-</Text>
                                      </Pressable>
                                      <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "900" }}>{goals}</Text>
                                      <Pressable
                                        style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(154,184,255,0.30)", backgroundColor: "#9AB8FF" }}
                                        onPress={(e) => { e.stopPropagation(); updateQuickScore(1, setter); }}
                                      >
                                        <Text style={{ color: "#0B1328", fontSize: 20, fontWeight: "700" }}>+</Text>
                                      </Pressable>
                                    </View>

                                    <WhatsAppButton
                                      compact
                                      label={`Chamar ${getShortPlayerName(player)}`}
                                      phone={phone}
                                      round={selectedMatchContext.round}
                                      tournamentName={bundle.tournament.name}
                                      recipientIsHomePlayer={isHome}
                                    />
                                  </View>
                              ))}
                            </View>
                          </View>
                          <PrimaryButton label="Salvar placar" onPress={handleSaveQuickScore} />
                          {selectedMatch?.status === "finished" && !showResetConfirm && (
                            <Pressable
                              onPress={() => setShowResetConfirm(true)}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                paddingVertical: 11,
                                borderRadius: 14,
                                borderWidth: 1,
                                borderColor: "rgba(220,60,60,0.30)",
                                backgroundColor: "rgba(220,60,60,0.08)",
                              }}
                            >
                              <Text style={{ color: "#DC4040", fontSize: 13, fontWeight: "800" }}>Resetar jogo</Text>
                            </Pressable>
                          )}
                          {showResetConfirm && (
                            <View
                              style={{
                                borderRadius: 14,
                                borderWidth: 1,
                                borderColor: "rgba(220,60,60,0.35)",
                                backgroundColor: "rgba(220,60,60,0.10)",
                                padding: 14,
                                gap: 10,
                              }}
                            >
                              <Text style={{ color: "#F3F7FF", fontSize: 13, fontWeight: "800" }}>
                                Resetar jogo?
                              </Text>
                              <Text style={{ color: "rgba(255,255,255,0.60)", fontSize: 12, lineHeight: 18 }}>
                                O placar será apagado e o jogo voltará para Pendente.
                              </Text>
                              <View style={{ flexDirection: "row", gap: 8 }}>
                                <Pressable
                                  onPress={() => setShowResetConfirm(false)}
                                  style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: "rgba(154,184,255,0.20)",
                                  }}
                                >
                                  <Text style={{ color: "#9AB8FF", fontSize: 13, fontWeight: "800" }}>Cancelar</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() => {
                                    if (!bundle || !selectedMatchContext) return;
                                    resetarJogo(bundle.campeonato.id, selectedMatchContext.matchId);
                                    closeQuickActions();
                                  }}
                                  style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    alignItems: "center",
                                    backgroundColor: "#DC4040",
                                  }}
                                >
                                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900" }}>Confirmar</Text>
                                </Pressable>
                              </View>
                            </View>
                          )}
                        </>
                      ) : (
                        <>
                          <View style={{ borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(233,179,52,0.22)" }}>
                            <Text style={{ color: "#F3F7FF", fontSize: 14, fontWeight: "800" }}>Somente visualização</Text>
                            <Text style={{ marginTop: 4, color: "#AEBBDA", fontSize: 13, lineHeight: 20 }}>
                              Você pode chamar os jogadores no WhatsApp, mas não editar o placar.
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            {[
                              { label: selectedMatchContext.homeTeamName, player: selectedMatchContext.homePlayerName, phone: selectedMatchContext.homePhone, isHome: true },
                              { label: selectedMatchContext.awayTeamName, player: selectedMatchContext.awayPlayerName, phone: selectedMatchContext.awayPhone, isHome: false },
                            ].map(({ label, player, phone, isHome }) => (
                                <View key={isHome ? "home" : "away"} style={{ flex: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "rgba(7,13,24,0.70)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", gap: 8 }}>
                                  <Text numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800", textAlign: "center" }}>{label}</Text>
                                  <MatchCrest teamName={label} onPress={() => setTeamMatchesFor(isHome ? "home" : "away")} />
                                  <Text numberOfLines={1} style={{ color: "#AEBBDA", fontSize: 11, textAlign: "center" }}>{player}</Text>
                                  <WhatsAppButton compact label={`Chamar ${getShortPlayerName(player)}`} phone={phone} round={selectedMatchContext.round} tournamentName={bundle.tournament.name} recipientIsHomePlayer={isHome} />
                                </View>
                            ))}
                          </View>
                        </>
                      )}
                      <PrimaryButton label="Fechar" variant="secondary" onPress={closeQuickActions} />
                    </View>
                  </>
                )}
              </Pressable>
            ) : null}
          </Pressable>
        </Modal>

        {/* ── Round deadline selector modal ── */}
        <Modal
          transparent
          visible={showRoundsModal}
          animationType="fade"
          onRequestClose={() => setShowRoundsModal(false)}
        >
          <Pressable
            onPress={() => setShowRoundsModal(false)}
            style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(4,8,18,0.60)" }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
                backgroundColor: "rgba(8,15,28,0.97)",
                borderWidth: 1,
                borderColor: "rgba(154,184,255,0.14)",
                gap: 16,
              }}
            >
              <Text style={{ color: "#9AB8FF", fontSize: 11, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" }}>
                Configurar prazo
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900" }}>
                Rodadas com prazo ativo
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 20 }}>
                Selecione quais rodadas terão prazo. Deixe todas selecionadas para aplicar o prazo a todas as rodadas.
              </Text>

              {/* "Todas as rodadas" toggle */}
              <Pressable
                onPress={() => setPendingActiveRounds([])}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: (!pendingActiveRounds || pendingActiveRounds.length === 0)
                    ? "rgba(59,130,246,0.55)"
                    : "rgba(255,255,255,0.12)",
                  backgroundColor: (!pendingActiveRounds || pendingActiveRounds.length === 0)
                    ? "rgba(59,130,246,0.14)"
                    : "transparent",
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    borderWidth: 1.5,
                    borderColor: (!pendingActiveRounds || pendingActiveRounds.length === 0)
                      ? "#3B82F6"
                      : "rgba(255,255,255,0.30)",
                    backgroundColor: (!pendingActiveRounds || pendingActiveRounds.length === 0)
                      ? "#3B82F6"
                      : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {(!pendingActiveRounds || pendingActiveRounds.length === 0) && (
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "900" }}>✓</Text>
                  )}
                </View>
                <Text style={{ color: "#F3F7FF", fontSize: 14, fontWeight: "800" }}>Todas as rodadas</Text>
              </Pressable>

              {/* Individual round pills */}
              {bundle && (
                <ScrollView
                  style={{ maxHeight: 200 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {groupedMatches.map(([round]) => {
                    const isKO = isGroupsKnockout && round > numRodadasGrupos;
                    const label = isKO ? `MM${round - numRodadasGrupos}` : `R${round}`;
                    const isSelected = pendingActiveRounds && pendingActiveRounds.length > 0
                      ? pendingActiveRounds.includes(round)
                      : false;
                    return (
                      <Pressable
                        key={round}
                        onPress={() => {
                          if (!pendingActiveRounds || pendingActiveRounds.length === 0) {
                            // switching from "all" mode → select only this round
                            setPendingActiveRounds([round]);
                          } else if (isSelected) {
                            const next = pendingActiveRounds.filter((r) => r !== round);
                            setPendingActiveRounds(next.length > 0 ? next : []);
                          } else {
                            setPendingActiveRounds([...pendingActiveRounds, round]);
                          }
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 9,
                          borderRadius: 999,
                          borderWidth: 1.5,
                          borderColor: isSelected
                            ? "rgba(59,130,246,0.55)"
                            : "rgba(255,255,255,0.14)",
                          backgroundColor: isSelected
                            ? "rgba(59,130,246,0.18)"
                            : "rgba(255,255,255,0.04)",
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected ? "#93C5FD" : "rgba(255,255,255,0.60)",
                            fontSize: 13,
                            fontWeight: "800",
                          }}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setShowRoundsModal(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(154,184,255,0.18)",
                  }}
                >
                  <Text style={{ color: "#9AB8FF", fontSize: 14, fontWeight: "800" }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!bundle) return;
                    definirRodasComPrazo(bundle.campeonato.id, pendingActiveRounds ?? []);
                    setShowRoundsModal(false);
                  }}
                  style={{
                    flex: 2,
                    paddingVertical: 13,
                    borderRadius: 14,
                    alignItems: "center",
                    backgroundColor: "#2447A6",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "900" }}>Salvar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
        </>
      }
    >
      {/* ── Fixed header ── */}
      <View
        style={{
          paddingTop: isSmallPhone ? 10 : 14,
          paddingHorizontal: isSmallPhone ? 14 : 20,
          paddingBottom: 10,
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.07)",
          backgroundColor: "rgba(3,5,11,0.42)",
        }}
      >
        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />

        <View className="flex-row items-center justify-between">
          <View style={{ gap: 2 }}>
            <Text style={{ color: "#9AB8FF", fontSize: 11, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" }}>
              {seasonLabel}
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: isSmallPhone ? 18 : 22, fontWeight: "900" }}>
              Rodadas
            </Text>
          </View>

          {activeRoundCountdown && (
            <Pressable
              onPress={() => setCountdownExpanded((v) => !v)}
              style={{
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 7,
                backgroundColor: "rgba(59,130,246,0.14)",
                borderWidth: 1,
                borderColor: "rgba(59,130,246,0.28)",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#60A5FA", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Rodada {currentOpenRound} • Prazo
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900", letterSpacing: 0.5 }}>
                {activeRoundCountdown.days}d {activeRoundCountdown.hours}h {activeRoundCountdown.minutes}m
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── View mode toggle (bracket / rounds) ── */}
      {showBracketToggle && (
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: isSmallPhone ? 14 : 20,
            paddingVertical: 8,
            gap: 8,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.06)",
            backgroundColor: "rgba(3,5,11,0.35)",
          }}
        >
          {(["rounds", "bracket"] as const).map((mode) => {
            const isActive = viewMode === mode;
            const label = mode === "rounds" ? "Rodadas" : "Chaveamento";
            return (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: isActive ? "rgba(245,158,11,0.65)" : "rgba(255,255,255,0.12)",
                  backgroundColor: isActive ? "rgba(245,158,11,0.14)" : "transparent",
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#FDE68A" : "rgba(255,255,255,0.55)",
                    fontSize: 12,
                    fontWeight: "900",
                    letterSpacing: 0.4,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── Round tab selector (fixed) ── */}
      {viewMode === "rounds" && groupedMatches.length > 0 && (
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.08)",
            backgroundColor: "rgba(3,5,11,0.35)",
          }}
        >
          <ScrollView
            ref={roundTabsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: isSmallPhone ? 12 : 16,
              paddingVertical: 10,
              gap: 8,
            }}
          >
            {groupedMatches.map(([round, rMatches]) => {
              const isActive = round === selectedRound;
              const isOpen = round === currentOpenRound;
              const finishedCount = rMatches.filter((m) => m.status === "finished").length;
              const allDone = finishedCount === rMatches.length && rMatches.length > 0;
              const isKnockoutRound = isGroupsKnockout && round > numRodadasGrupos;
              const knockoutRoundIndex = isKnockoutRound ? round - numRodadasGrupos : 0;

              return (
                <Pressable key={round} onPress={() => setSelectedRound(round)}>
                  <View
                    style={{
                      paddingHorizontal: isSmallPhone ? 14 : 18,
                      paddingVertical: isSmallPhone ? 8 : 10,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: isActive
                        ? (isKnockoutRound ? "#F59E0B" : "#8B5CF6")
                        : isOpen
                          ? "rgba(59,130,246,0.45)"
                          : "rgba(255,255,255,0.12)",
                      backgroundColor: isActive
                        ? (isKnockoutRound ? "rgba(245,158,11,0.20)" : "rgba(139,92,246,0.22)")
                        : isOpen
                          ? "rgba(59,130,246,0.10)"
                          : "transparent",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {isOpen && !isActive && (
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 999,
                          backgroundColor: "#3B82F6",
                        }}
                      />
                    )}
                    <Text
                      style={{
                        color: isActive
                          ? (isKnockoutRound ? "#FDE68A" : "#E9D5FF")
                          : isOpen ? "#93C5FD" : "rgba(255,255,255,0.65)",
                        fontSize: isSmallPhone ? 12 : 13,
                        fontWeight: isActive ? "900" : "700",
                        letterSpacing: 0.4,
                      }}
                    >
                      {isKnockoutRound ? `MM${knockoutRoundIndex}` : `R${round}`}
                    </Text>
                    {allDone && (
                      <Text style={{ color: "#10B981", fontSize: 10, fontWeight: "900" }}>✓</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Bracket view ── */}
      {viewMode === "bracket" && showBracketToggle && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: baseBottomPadding }}>
          <KnockoutBracket
            campeonato={bundle.campeonato}
            participantes={bundle.campeonato.participantes}
            onPressMatch={(matchId) => setSelectedMatchId(matchId)}
          />

          {/* Gerar mata-mata / próxima fase inside bracket view too */}
          {showGerarMataMataBt && (
            <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(139,92,246,0.10)", padding: 16, gap: 12 }}>
              <Text style={{ color: "#C4B5FD", fontSize: 11, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" }}>Fase de grupos concluída</Text>
              <Text style={{ color: "#E9D5FF", fontSize: 18, fontWeight: "900" }}>Gerar mata-mata</Text>
              <Pressable onPress={() => { gerarFaseMataMataCampeonato(bundle.campeonato.id); setSelectedRound(null); }} style={{ borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#8B5CF6" }}>
                <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900" }}>Gerar fase eliminatória</Text>
              </Pressable>
            </View>
          )}
          {showGerarProximaFaseBt && (
            <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(59,130,246,0.35)", backgroundColor: "rgba(59,130,246,0.08)", padding: 16, gap: 12 }}>
              <Text style={{ color: "#93C5FD", fontSize: 11, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" }}>Fase eliminatória</Text>
              <Text style={{ color: "#DBEAFE", fontSize: 18, fontWeight: "900" }}>Avançar para próxima fase</Text>
              <Pressable onPress={() => { gerarProximaFaseMataMata(bundle.campeonato.id); setSelectedRound(null); }} style={{ borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#3B82F6" }}>
                <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900" }}>Gerar próxima fase</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Scrollable match content (rounds view) ── */}
      {viewMode === "rounds" && <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: isSmallPhone ? 12 : 16,
          paddingTop: 16,
          paddingBottom: baseBottomPadding,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Countdown card - expanded on tap */}
        {countdownExpanded && activeRoundCountdown && (
          <View
            style={{
              borderRadius: 16,
              padding: 16,
              backgroundColor: "rgba(9,16,30,0.72)",
              borderWidth: 1,
              borderColor: "rgba(59,130,246,0.20)",
              marginBottom: 6,
            }}
          >
            <Text style={{ color: "#9AB8FF", fontSize: 11, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              Prazo da rodada
            </Text>
            {roundsStarted && (
              <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 22, marginBottom: 12 }}>
                Cada rodada usa {formatRoundDeadlineDays(bundle.campeonato.prazoRodadaDias).toLowerCase()}. Quando zera, partidas pendentes são encerradas como 0 x 0.
              </Text>
            )}
            <RoundDeadlineCountdownCard
              countdown={activeRoundCountdown}
              tone="dark"
              canAdjust={canManageMatch && roundsStarted && currentOpenRound != null}
              onDecreaseHour={() => handleAdjustRoundExtraTime(-HOUR_MS)}
              onIncreaseHour={() => handleAdjustRoundExtraTime(HOUR_MS)}
            />
            {canManageMatch && roundsStarted && (
              <Pressable
                onPress={() => {
                  setPendingActiveRounds(bundle.campeonato.prazoRodasAtivas ?? []);
                  setShowRoundsModal(true);
                }}
                style={{
                  marginTop: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "flex-start",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "rgba(59,130,246,0.30)",
                  backgroundColor: "rgba(59,130,246,0.08)",
                }}
              >
                <Text style={{ color: "#93C5FD", fontSize: 12, fontWeight: "800" }}>
                  {bundle.campeonato.prazoRodasAtivas && bundle.campeonato.prazoRodasAtivas.length > 0
                    ? `Prazo em ${bundle.campeonato.prazoRodasAtivas.length} rodada${bundle.campeonato.prazoRodasAtivas.length > 1 ? "s" : ""}`
                    : "Todas as rodadas"}
                </Text>
                <Text style={{ color: "#60A5FA", fontSize: 11, fontWeight: "900" }}>✎ Configurar</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Round header */}
        {selectedRound != null && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>
              Rodada {selectedRound}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "700" }}>
              {selectedRoundMatches.length} {selectedRoundMatches.length === 1 ? "jogo" : "jogos"}
            </Text>
          </View>
        )}

        {/* Match cards */}
        {selectedRoundMatches.length > 0 ? (
          <HistoricCupGrid
            compact={isPhone}
            items={getHistoricItems(selectedRoundMatches)}
            onPressItem={(item) => setSelectedMatchId(item.id)}
          />
        ) : groupedMatches.length === 0 ? (
          <ScreenState
            title="Partidas indisponíveis"
            description={
              bundle.participants.length === 0
                ? "Este campeonato foi salvo sem participantes vinculados."
                : "Ainda não existe uma grade de confrontos para esta temporada."
            }
          />
        ) : (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
              Selecione uma rodada acima
            </Text>
          </View>
        )}

        {/* Gerar fase mata-mata */}
        {showGerarMataMataBt && (
          <View
            style={{
              marginTop: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(139,92,246,0.35)",
              backgroundColor: "rgba(139,92,246,0.10)",
              padding: 16,
              gap: 12,
            }}
          >
            <Text style={{ color: "#C4B5FD", fontSize: 11, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" }}>
              Fase de grupos concluída
            </Text>
            <Text style={{ color: "#E9D5FF", fontSize: 18, fontWeight: "900" }}>
              Gerar mata-mata
            </Text>
            <Text style={{ color: "rgba(233,213,255,0.72)", fontSize: 13, lineHeight: 20 }}>
              Os classificados de cada grupo foram definidos. O chaveamento estilo Copa do Mundo está pronto para ser gerado (1º do Grupo A x 2º do Grupo B, etc.).
            </Text>
            <Pressable
              onPress={() => {
                gerarFaseMataMataCampeonato(bundle.campeonato.id);
                setSelectedRound(null);
                setViewMode("bracket");
              }}
              style={{
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                backgroundColor: "#8B5CF6",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900" }}>
                Gerar fase eliminatória
              </Text>
            </Pressable>
          </View>
        )}

        {/* Gerar próxima fase do mata-mata */}
        {showGerarProximaFaseBt && (
          <View
            style={{
              marginTop: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(59,130,246,0.35)",
              backgroundColor: "rgba(59,130,246,0.08)",
              padding: 16,
              gap: 12,
            }}
          >
            <Text style={{ color: "#93C5FD", fontSize: 11, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" }}>
              Fase eliminatória
            </Text>
            <Text style={{ color: "#DBEAFE", fontSize: 18, fontWeight: "900" }}>
              Avançar para próxima fase
            </Text>
            <Text style={{ color: "rgba(219,234,254,0.72)", fontSize: 13, lineHeight: 20 }}>
              Todos os jogos desta fase foram concluídos. Os vencedores avançam para o próximo confronto.
            </Text>
            <Pressable
              onPress={() => {
                gerarProximaFaseMataMata(bundle.campeonato.id);
                setSelectedRound(null);
                setViewMode("bracket");
              }}
              style={{
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                backgroundColor: "#3B82F6",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900" }}>
                Gerar próxima fase
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>}
    </Screen>
    </View>
  );
}
