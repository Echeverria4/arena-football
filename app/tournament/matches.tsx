import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { HistoricCupGrid } from "@/components/matches/HistoricCupGrid";
import type { HistoricCupItem } from "@/components/matches/HistoricCupCard";
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

export default function TournamentMatchesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 420;
  const isPhone = width < 768;

  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const ajustarTempoExtraRodada = useTournamentStore((state) => state.ajustarTempoExtraRodada);
  const salvarPlacarJogo = useTournamentStore((state) => state.salvarPlacarJogo);
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
  const [now, setNow] = useState(() => Date.now());
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [countdownExpanded, setCountdownExpanded] = useState(false);

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
              : "Sala do mandante",
        city:
          match.status === "finished"
            ? "Arquivo oficial da temporada"
            : `${home?.displayName ?? "Mandante"} organiza a sala`,
        status: match.status,
      };
    });
  }

  function closeQuickActions() {
    setSelectedMatchId(null);
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
    <Screen
      ambientDiamond
      overlay={
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
                <View className="gap-2">
                  <Text style={{ color: "#9AB8FF", fontSize: 11, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase" }}>
                    Menu da partida
                  </Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "900" }}>
                    {selectedMatchContext.homeTeamName} x {selectedMatchContext.awayTeamName}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 22 }}>
                    Rodada {selectedMatchContext.round} • {selectedMatchContext.dateLabel}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, lineHeight: 20 }}>
                    {selectedMatchContext.homePlayerName} enfrenta {selectedMatchContext.awayPlayerName}.{" "}
                    {canManageMatch
                      ? "Use as ações abaixo para lançar o placar."
                      : "Modo visualização: você pode chamar os jogadores no WhatsApp."}
                  </Text>
                </View>

                <View className="mt-5 gap-3">
                  {canManageMatch ? (
                    <>
                      <View className="gap-3 rounded-[18px] px-4 py-4" style={{ borderWidth: 1, borderColor: "rgba(154,184,255,0.16)", backgroundColor: "rgba(255,255,255,0.05)" }}>
                        <Text style={{ color: "#9AB8FF", fontSize: 11, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase" }}>
                          Lançar placar
                        </Text>

                        <View className="flex-row gap-3">
                          {[
                            { label: selectedMatchContext.homeTeamName, player: selectedMatchContext.homePlayerName, goals: quickHomeGoals, setter: setQuickHomeGoals, phone: selectedMatchContext.homePhone, isHome: true },
                            { label: selectedMatchContext.awayTeamName, player: selectedMatchContext.awayPlayerName, goals: quickAwayGoals, setter: setQuickAwayGoals, phone: selectedMatchContext.awayPhone, isHome: false },
                          ].map(({ label, player, goals, setter, phone, isHome }) => (
                            <View
                              key={isHome ? "home" : "away"}
                              style={{ flex: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "rgba(7,13,24,0.68)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" }}
                            >
                              <Text numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800", textAlign: "center" }}>{label}</Text>
                              <Text numberOfLines={1} style={{ marginTop: 4, color: "#AEBBDA", fontSize: 12, textAlign: "center" }}>{player}</Text>
                              <View className="mt-3 flex-row items-center justify-between">
                                <Pressable
                                  className="h-11 w-11 items-center justify-center rounded-xl"
                                  style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "#171F2B" }}
                                  onPress={(e) => { e.stopPropagation(); updateQuickScore(-1, setter); }}
                                >
                                  <Text className="text-2xl font-bold text-white">-</Text>
                                </Pressable>
                                <Text style={{ color: "#FFFFFF", fontSize: 34, fontWeight: "900" }}>{goals}</Text>
                                <Pressable
                                  className="h-11 w-11 items-center justify-center rounded-xl"
                                  style={{ borderWidth: 1, borderColor: "rgba(154,184,255,0.30)", backgroundColor: "#9AB8FF" }}
                                  onPress={(e) => { e.stopPropagation(); updateQuickScore(1, setter); }}
                                >
                                  <Text className="text-2xl font-bold text-[#0B1328]">+</Text>
                                </Pressable>
                              </View>
                              <View className="mt-3">
                                <WhatsAppButton
                                  compact
                                  label={`Chamar ${getShortPlayerName(player)}`}
                                  phone={phone}
                                  round={selectedMatchContext.round}
                                  tournamentName={bundle.tournament.name}
                                  recipientIsHomePlayer={isHome}
                                />
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                      <PrimaryButton label="Salvar placar" onPress={handleSaveQuickScore} />
                    </>
                  ) : (
                    <>
                      <View className="rounded-[18px] border px-4 py-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(233,179,52,0.24)" }}>
                        <Text style={{ color: "#F3F7FF", fontSize: 16, fontWeight: "800" }}>Somente visualização</Text>
                        <Text style={{ marginTop: 6, color: "#AEBBDA", fontSize: 14, lineHeight: 22 }}>
                          Este acesso permite acompanhar a rodada e chamar os jogadores no WhatsApp, mas não editar placar.
                        </Text>
                      </View>
                      <View className="flex-row gap-3">
                        {[
                          { label: selectedMatchContext.homeTeamName, player: selectedMatchContext.homePlayerName, phone: selectedMatchContext.homePhone, isHome: true },
                          { label: selectedMatchContext.awayTeamName, player: selectedMatchContext.awayPlayerName, phone: selectedMatchContext.awayPhone, isHome: false },
                        ].map(({ label, player, phone, isHome }) => (
                          <View key={isHome ? "home" : "away"} style={{ flex: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 14, backgroundColor: "rgba(7,13,24,0.68)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" }}>
                            <Text numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800", textAlign: "center" }}>{label}</Text>
                            <Text numberOfLines={1} style={{ marginTop: 4, color: "#AEBBDA", fontSize: 12, textAlign: "center" }}>{player}</Text>
                            <View className="mt-3">
                              <WhatsAppButton compact label={`Chamar ${getShortPlayerName(player)}`} phone={phone} round={selectedMatchContext.round} tournamentName={bundle.tournament.name} recipientIsHomePlayer={isHome} />
                            </View>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                  <PrimaryButton label="Fechar" variant="secondary" onPress={closeQuickActions} />
                </View>
              </Pressable>
            ) : null}
          </Pressable>
        </Modal>
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
          backgroundColor: "rgba(3,5,11,0.72)",
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

      {/* ── Round tab selector (fixed) ── */}
      {groupedMatches.length > 0 && (
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.08)",
            backgroundColor: "rgba(3,5,11,0.60)",
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

              return (
                <Pressable key={round} onPress={() => setSelectedRound(round)}>
                  <View
                    style={{
                      paddingHorizontal: isSmallPhone ? 14 : 18,
                      paddingVertical: isSmallPhone ? 8 : 10,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: isActive
                        ? "#8B5CF6"
                        : isOpen
                          ? "rgba(59,130,246,0.45)"
                          : "rgba(255,255,255,0.12)",
                      backgroundColor: isActive
                        ? "rgba(139,92,246,0.22)"
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
                        color: isActive ? "#E9D5FF" : isOpen ? "#93C5FD" : "rgba(255,255,255,0.65)",
                        fontSize: isSmallPhone ? 12 : 13,
                        fontWeight: isActive ? "900" : "700",
                        letterSpacing: 0.4,
                      }}
                    >
                      R{round}
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

      {/* ── Scrollable match content ── */}
      <ScrollView
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
        {roundsStarted && countdownExpanded && (
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
            <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 22, marginBottom: 12 }}>
              Cada rodada usa {formatRoundDeadlineDays(bundle.campeonato.prazoRodadaDias).toLowerCase()}. Quando zera, partidas pendentes são encerradas como 0 x 0.
            </Text>
            <RoundDeadlineCountdownCard
              countdown={activeRoundCountdown}
              tone="dark"
              canAdjust={canManageMatch && roundsStarted && currentOpenRound != null}
              onDecreaseHour={() => handleAdjustRoundExtraTime(-HOUR_MS)}
              onIncreaseHour={() => handleAdjustRoundExtraTime(HOUR_MS)}
            />
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
      </ScrollView>
    </Screen>
  );
}
