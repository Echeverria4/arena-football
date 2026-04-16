import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";

import { HistoricCupGrid } from "@/components/matches/HistoricCupGrid";
import { WhatsAppButton } from "@/components/match/WhatsAppButton";
import { RoundDeadlineCountdownCard } from "@/components/tournament/RoundDeadlineCountdownCard";
import type { HistoricCupItem } from "@/components/matches/HistoricCupCard";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
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
  const tournamentMissing = Boolean(hydrated && (!id || !campeonatos.some((campeonato) => campeonato.id === id)));

  // Derivados calculados antes de qualquer return para não violar a regra dos hooks
  const bundle = hydrated && id ? getTournamentBundle(id, campeonatos, videos) : null;
  const activeTournamentAccessMode = resolveTournamentAccessMode(tournamentAccess, currentTournamentId);
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);

  // Todos os useEffect e useMemo DEVEM ficar antes de qualquer return condicional
  useEffect(() => {
    if (!lockToActiveTournament || !currentTournamentId || !bundle || bundle.campeonato.id === currentTournamentId) {
      return;
    }

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
      if (!grouped.has(match.round)) {
        grouped.set(match.round, []);
      }

      grouped.get(match.round)!.push(match);
    }

    return Array.from(grouped.entries()).sort((current, next) => current[0] - next[0]);
  }, [bundle?.matches]);

  function formatDate(value?: string | null) {
    if (!value) return "Prazo a configurar";
    return new Date(value).toLocaleDateString("pt-BR");
  }

  function getShortPlayerName(value?: string | null) {
    const safeValue = (value ?? "").trim();

    if (!safeValue) {
      return "jogador";
    }

    return safeValue.split(/\s+/)[0] ?? safeValue;
  }

  function getScoreTop(homeGoals?: number | null, awayGoals?: number | null) {
    if (homeGoals == null || awayGoals == null) {
      return "VS";
    }

    return `${homeGoals}-${awayGoals}`;
  }

  function getTeamCode(teamName?: string | null) {
    const safeName = normalizeTeamDisplayName(teamName ?? "");

    if (!safeName) {
      return "SEM";
    }

    const words = safeName
      .split(/\s+/)
      .map((word) => word.replace(/[^A-Za-zÀ-ÿ0-9]/g, ""))
      .filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 3).toUpperCase();
    }

    return words
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase())
      .join("");
  }

  function getHistoricItems(roundMatches: typeof bundle.matches): HistoricCupItem[] {
    return roundMatches.map((match) => {
      const home = bundle.participants.find((item) => item.id === match.homeParticipantId);
      const away = bundle.participants.find((item) => item.id === match.awayParticipantId);
      const homeTeamName = normalizeTeamDisplayName(home?.teamName ?? "");
      const awayTeamName = normalizeTeamDisplayName(away?.teamName ?? "");

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
        scoreTop: getScoreTop(match.homeGoals, match.awayGoals),
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
  const selectedMatch = useMemo(
    () => (bundle?.matches ?? []).find((match) => match.id === selectedMatchId) ?? null,
    [bundle?.matches, selectedMatchId],
  );

  const selectedMatchContext = useMemo(() => {
    if (!bundle || !selectedMatch) {
      return null;
    }

    const homeParticipant = bundle.participants.find(
      (participant) => participant.id === selectedMatch.homeParticipantId,
    );
    const awayParticipant = bundle.participants.find(
      (participant) => participant.id === selectedMatch.awayParticipantId,
    );
    const rawHomeParticipant = bundle.campeonato.participantes.find(
      (participant) => participant.id === selectedMatch.homeParticipantId,
    );
    const rawAwayParticipant = bundle.campeonato.participantes.find(
      (participant) => participant.id === selectedMatch.awayParticipantId,
    );
    return {
      matchId: selectedMatch.id,
      round: selectedMatch.round,
      homeGoals: selectedMatch.homeGoals ?? 0,
      awayGoals: selectedMatch.awayGoals ?? 0,
      dateLabel: formatDate(selectedMatch.deadlineAt),
      homeTeamName: normalizeTeamDisplayName(homeParticipant?.teamName ?? rawHomeParticipant?.time ?? "Mandante"),
      awayTeamName: normalizeTeamDisplayName(awayParticipant?.teamName ?? rawAwayParticipant?.time ?? "Visitante"),
      homePlayerName: rawHomeParticipant?.nome ?? homeParticipant?.displayName ?? "Mandante",
      awayPlayerName: rawAwayParticipant?.nome ?? awayParticipant?.displayName ?? "Visitante",
      homePhone: rawHomeParticipant?.whatsapp ?? null,
      awayPhone: rawAwayParticipant?.whatsapp ?? null,
    };
  }, [bundle, selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) {
      return;
    }

    setQuickHomeGoals(selectedMatch.homeGoals ?? 0);
    setQuickAwayGoals(selectedMatch.awayGoals ?? 0);
  }, [selectedMatchId]);

  if (!hydrated) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <ScreenState
          title="Carregando rodadas"
          description="Sincronizando confrontos, prazos e placares salvos da temporada."
        />
      </Screen>
    );
  }

  if (tournamentMissing || !bundle) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato não encontrado"
            description="Não existe uma temporada válida para abrir essas rodadas."
          />
        </View>
      </Screen>
    );
  }

  const seasonLabel = bundle.campeonato.temporada ?? "Temporada 01";
  const roundsStarted = Boolean(bundle.campeonato.inicioEm && bundle.campeonato.prazoRodadaDias);
  const currentOpenRound = getCurrentOpenRound(bundle.campeonato);
  const activeRoundCountdown =
    currentOpenRound != null
      ? getRoundDeadlineCountdown(bundle.campeonato, currentOpenRound, new Date(now))
      : null;

  function closeQuickActions() {
    setSelectedMatchId(null);
  }

  function updateQuickScore(
    delta: number,
    setter: (value: number | ((currentValue: number) => number)) => void,
  ) {
    setter((currentValue) => Math.max(0, currentValue + delta));
  }

  function handleSaveQuickScore() {
    if (!selectedMatchContext) {
      return;
    }

    salvarPlacarJogo(
      bundle.campeonato.id,
      selectedMatchContext.matchId,
      quickHomeGoals,
      quickAwayGoals,
    );

    Alert.alert(
      "Placar salvo",
      `${selectedMatchContext.homeTeamName} ${quickHomeGoals} x ${quickAwayGoals} ${selectedMatchContext.awayTeamName}.`,
    );

    closeQuickActions();
  }

  function handleAdjustRoundExtraTime(deltaMs: number) {
    if (currentOpenRound == null) {
      return;
    }

    ajustarTempoExtraRodada(bundle.campeonato.id, currentOpenRound, deltaMs);
  }

  return (
    <Screen
      scroll
      ambientDiamond
      className="px-6"
      overlay={
        <Modal transparent visible={Boolean(selectedMatchContext)} animationType="fade" onRequestClose={closeQuickActions}>
          <Pressable
            onPress={closeQuickActions}
            style={{
              flex: 1,
              justifyContent: "center",
              paddingHorizontal: 24,
              backgroundColor: "rgba(4,8,18,0.54)",
            }}
          >
            {selectedMatchContext ? (
              <Pressable
                onPress={(event) => event.stopPropagation()}
                style={{
                  position: "relative",
                  zIndex: 2,
                  alignSelf: "center",
                  width: "100%",
                  maxWidth: 440,
                  borderRadius: 20,
                  padding: 20,
                  backgroundColor: "rgba(8,15,28,0.74)",
                  borderWidth: 1,
                  borderColor: "rgba(154,184,255,0.18)",
                }}
              >
                <View className="gap-2">
                  <Text
                    style={{
                      color: "#9AB8FF",
                      fontSize: 11,
                      fontWeight: "800",
                      letterSpacing: 1.8,
                      textTransform: "uppercase",
                    }}
                  >
                    Menu da partida
                  </Text>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 24,
                      fontWeight: "900",
                    }}
                  >
                    {selectedMatchContext.homeTeamName} x {selectedMatchContext.awayTeamName}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.72)",
                      fontSize: 15,
                      lineHeight: 24,
                    }}
                  >
                    Rodada {selectedMatchContext.round} • {selectedMatchContext.dateLabel}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.72)",
                      fontSize: 14,
                      lineHeight: 22,
                    }}
                  >
                    {selectedMatchContext.homePlayerName} enfrenta {selectedMatchContext.awayPlayerName}.{" "}
                    {canManageMatch
                      ? "Use as ações abaixo para lançar o placar e chamar cada jogador direto no número informado."
                      : "Modo visualização: você pode chamar qualquer jogador no WhatsApp, mas não editar o placar."}
                  </Text>
                </View>

                <View className="mt-5 gap-3">
                  {canManageMatch ? (
                    <>
                      <View
                        className="gap-3 rounded-[18px] px-4 py-4"
                        style={{
                          borderWidth: 1,
                          borderColor: "rgba(154,184,255,0.16)",
                          backgroundColor: "rgba(255,255,255,0.05)",
                        }}
                      >
                        <Text
                          style={{
                            color: "#9AB8FF",
                            fontSize: 11,
                            fontWeight: "800",
                            letterSpacing: 1.6,
                            textTransform: "uppercase",
                          }}
                        >
                          Lançar placar
                        </Text>

                        <View className="flex-row gap-3">
                          <View
                            style={{
                              flex: 1,
                              borderRadius: 16,
                              paddingHorizontal: 12,
                              paddingVertical: 12,
                              backgroundColor: "rgba(7,13,24,0.68)",
                              borderWidth: 1,
                              borderColor: "rgba(255,255,255,0.10)",
                            }}
                          >
                            <Text
                              numberOfLines={1}
                              style={{
                                color: "#FFFFFF",
                                fontSize: 14,
                                fontWeight: "800",
                                textAlign: "center",
                              }}
                            >
                              {selectedMatchContext.homeTeamName}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={{
                                marginTop: 4,
                                color: "#AEBBDA",
                                fontSize: 12,
                                textAlign: "center",
                              }}
                            >
                              {selectedMatchContext.homePlayerName}
                            </Text>
                            <View className="mt-3 flex-row items-center justify-between">
                              <Pressable
                                className="h-11 w-11 items-center justify-center rounded-xl"
                                style={{
                                  borderWidth: 1,
                                  borderColor: "rgba(255,255,255,0.10)",
                                  backgroundColor: "#171F2B",
                                }}
                                onPress={(event) => {
                                  event.stopPropagation();
                                  updateQuickScore(-1, setQuickHomeGoals);
                                }}
                              >
                                <Text className="text-2xl font-bold text-white">-</Text>
                              </Pressable>

                              <Text style={{ color: "#FFFFFF", fontSize: 34, fontWeight: "900" }}>
                                {quickHomeGoals}
                              </Text>

                              <Pressable
                                className="h-11 w-11 items-center justify-center rounded-xl"
                                style={{
                                  borderWidth: 1,
                                  borderColor: "rgba(154,184,255,0.30)",
                                  backgroundColor: "#9AB8FF",
                                }}
                                onPress={(event) => {
                                  event.stopPropagation();
                                  updateQuickScore(1, setQuickHomeGoals);
                                }}
                              >
                                <Text className="text-2xl font-bold text-[#0B1328]">+</Text>
                              </Pressable>
                            </View>

                            <View className="mt-3">
                              <WhatsAppButton
                                compact
                                label={`Chamar ${getShortPlayerName(selectedMatchContext.homePlayerName)}`}
                                phone={selectedMatchContext.homePhone}
                                round={selectedMatchContext.round}
                                tournamentName={bundle.tournament.name}
                                recipientIsHomePlayer
                              />
                            </View>
                          </View>

                          <View
                            style={{
                              flex: 1,
                              borderRadius: 16,
                              paddingHorizontal: 12,
                              paddingVertical: 12,
                              backgroundColor: "rgba(7,13,24,0.68)",
                              borderWidth: 1,
                              borderColor: "rgba(255,255,255,0.10)",
                            }}
                          >
                            <Text
                              numberOfLines={1}
                              style={{
                                color: "#FFFFFF",
                                fontSize: 14,
                                fontWeight: "800",
                                textAlign: "center",
                              }}
                            >
                              {selectedMatchContext.awayTeamName}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={{
                                marginTop: 4,
                                color: "#AEBBDA",
                                fontSize: 12,
                                textAlign: "center",
                              }}
                            >
                              {selectedMatchContext.awayPlayerName}
                            </Text>
                            <View className="mt-3 flex-row items-center justify-between">
                              <Pressable
                                className="h-11 w-11 items-center justify-center rounded-xl"
                                style={{
                                  borderWidth: 1,
                                  borderColor: "rgba(255,255,255,0.10)",
                                  backgroundColor: "#171F2B",
                                }}
                                onPress={(event) => {
                                  event.stopPropagation();
                                  updateQuickScore(-1, setQuickAwayGoals);
                                }}
                              >
                                <Text className="text-2xl font-bold text-white">-</Text>
                              </Pressable>

                              <Text style={{ color: "#FFFFFF", fontSize: 34, fontWeight: "900" }}>
                                {quickAwayGoals}
                              </Text>

                              <Pressable
                                className="h-11 w-11 items-center justify-center rounded-xl"
                                style={{
                                  borderWidth: 1,
                                  borderColor: "rgba(154,184,255,0.30)",
                                  backgroundColor: "#9AB8FF",
                                }}
                                onPress={(event) => {
                                  event.stopPropagation();
                                  updateQuickScore(1, setQuickAwayGoals);
                                }}
                              >
                                <Text className="text-2xl font-bold text-[#0B1328]">+</Text>
                              </Pressable>
                            </View>

                            <View className="mt-3">
                              <WhatsAppButton
                                compact
                                label={`Chamar ${getShortPlayerName(selectedMatchContext.awayPlayerName)}`}
                                phone={selectedMatchContext.awayPhone}
                                round={selectedMatchContext.round}
                                tournamentName={bundle.tournament.name}
                                recipientIsHomePlayer={false}
                              />
                            </View>
                          </View>
                        </View>

                      </View>

                      <PrimaryButton label="Salvar placar" onPress={handleSaveQuickScore} />
                    </>
                  ) : (
                    <>
                      <View
                        className="rounded-[18px] border px-4 py-4"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.05)",
                          borderColor: "rgba(233,179,52,0.24)",
                        }}
                      >
                        <Text
                          style={{
                            color: "#F3F7FF",
                            fontSize: 16,
                            fontWeight: "800",
                          }}
                        >
                          Somente visualização
                        </Text>
                        <Text
                          style={{
                            marginTop: 6,
                            color: "#AEBBDA",
                            fontSize: 14,
                            lineHeight: 22,
                          }}
                        >
                          Este acesso permite acompanhar a rodada e chamar os jogadores no WhatsApp, mas não editar placar.
                        </Text>
                      </View>

                      <View className="flex-row gap-3">
                        <View
                          style={{
                            flex: 1,
                            borderRadius: 16,
                            paddingHorizontal: 12,
                            paddingVertical: 14,
                            backgroundColor: "rgba(7,13,24,0.68)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.10)",
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            style={{
                              color: "#FFFFFF",
                              fontSize: 14,
                              fontWeight: "800",
                              textAlign: "center",
                            }}
                          >
                            {selectedMatchContext.homeTeamName}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              marginTop: 4,
                              color: "#AEBBDA",
                              fontSize: 12,
                              textAlign: "center",
                            }}
                          >
                            {selectedMatchContext.homePlayerName}
                          </Text>
                          <View className="mt-3">
                            <WhatsAppButton
                              compact
                              label={`Chamar ${getShortPlayerName(selectedMatchContext.homePlayerName)}`}
                              phone={selectedMatchContext.homePhone}
                              round={selectedMatchContext.round}
                              tournamentName={bundle.tournament.name}
                              recipientIsHomePlayer
                            />
                          </View>
                        </View>

                        <View
                          style={{
                            flex: 1,
                            borderRadius: 16,
                            paddingHorizontal: 12,
                            paddingVertical: 14,
                            backgroundColor: "rgba(7,13,24,0.68)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.10)",
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            style={{
                              color: "#FFFFFF",
                              fontSize: 14,
                              fontWeight: "800",
                              textAlign: "center",
                            }}
                          >
                            {selectedMatchContext.awayTeamName}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              marginTop: 4,
                              color: "#AEBBDA",
                              fontSize: 12,
                              textAlign: "center",
                            }}
                          >
                            {selectedMatchContext.awayPlayerName}
                          </Text>
                          <View className="mt-3">
                            <WhatsAppButton
                              compact
                              label={`Chamar ${getShortPlayerName(selectedMatchContext.awayPlayerName)}`}
                              phone={selectedMatchContext.awayPhone}
                              round={selectedMatchContext.round}
                              tournamentName={bundle.tournament.name}
                              recipientIsHomePlayer={false}
                            />
                          </View>
                        </View>
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
      <View className="gap-6 py-8">
        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />

        <RevealOnScroll delay={0}>
          <View
            className="gap-4 rounded-[24px] p-5"
            style={{
              backgroundColor: "rgba(9,16,30,0.62)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
            }}
          >
            <View className="gap-2">
              <Text
                style={{
                  color: "#9AB8FF",
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Rodadas
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "900" }}>
                Prazo fixo da temporada
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, lineHeight: 28 }}>
                {roundsStarted
                  ? `Cada rodada desta temporada usa ${formatRoundDeadlineDays(bundle.campeonato.prazoRodadaDias).toLowerCase()}. Quando o cronômetro zera, partidas pendentes desta rodada são fechadas automaticamente como empate por 0 x 0.`
                  : "O prazo ainda não foi definido na tela principal do campeonato."}
              </Text>
            </View>

            <RoundDeadlineCountdownCard
              countdown={activeRoundCountdown}
              tone="dark"
              canAdjust={canManageMatch && roundsStarted && currentOpenRound != null}
              onDecreaseHour={() => handleAdjustRoundExtraTime(-HOUR_MS)}
              onIncreaseHour={() => handleAdjustRoundExtraTime(HOUR_MS)}
            />

          </View>
        </RevealOnScroll>

        <View className="gap-5">
          {groupedMatches.length > 0 ? (
            groupedMatches.map(([round, matches], roundIndex) => (
              <RevealOnScroll key={`round-${round}`} delay={roundIndex * 70}>
                <View className="gap-4">
                  {roundIndex > 0 ? (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "rgba(255,255,255,0.08)",
                      }}
                    />
                  ) : null}

                  <View className="items-center gap-2">
                    <View
                      className="rounded-full border px-5 py-2"
                      style={{
                        borderColor: "rgba(154,184,255,0.20)",
                        backgroundColor: "rgba(12,20,36,0.64)",
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 28,
                          fontWeight: "900",
                          textAlign: "center",
                        }}
                      >
                        Rodada {round}
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: "rgba(255,255,255,0.72)",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      {matches.length} {matches.length === 1 ? "jogo" : "jogos"}
                    </Text>
                  </View>

                  <HistoricCupGrid
                    items={getHistoricItems(matches)}
                    onPressItem={(item) => setSelectedMatchId(item.id)}
                  />
                </View>
              </RevealOnScroll>
            ))
          ) : (
            <ScreenState
              title="Partidas indisponíveis"
              description={
                bundle.participants.length === 0
                  ? "Este campeonato foi salvo sem participantes vinculados. Sem jogadores, o app não consegue montar rodadas nem confrontos."
                  : "Ainda não existe uma grade de confrontos para esta temporada. O campeonato precisa de rodadas estruturadas para listar as partidas."
              }
            />
          )}
        </View>
      </View>
    </Screen>
  );
}
