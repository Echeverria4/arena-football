import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, Text, View, useWindowDimensions } from "react-native";

import { WhatsAppButton } from "@/components/match/WhatsAppButton";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatDate } from "@/lib/formatters";
import { getRoundDeadline } from "@/lib/season-tournaments";
import { canEditTournament, useTournamentAccessMode } from "@/lib/tournament-access";
import {
  getTeamInitials,
  normalizeTeamDisplayName,
  resolveTeamVisualByName,
} from "@/lib/team-visuals";
import { useMatchDataHydrated } from "@/stores/use-arena-hydration";
import { useTournamentStore } from "@/stores/tournament-store";

function TeamVisual({
  teamName,
  playerName,
  align = "center",
}: {
  teamName: string;
  playerName: string;
  align?: "left" | "right" | "center";
}) {
  const [failed, setFailed] = useState(false);
  const safeTeamName = normalizeTeamDisplayName(teamName);
  const visual = resolveTeamVisualByName(safeTeamName);
  const textAlign = align === "left" ? "left" : align === "right" ? "right" : "center";

  return (
    <View className="items-center gap-3" style={{ flex: 1 }}>
      <View
        style={{
          width: 86,
          height: 86,
          borderRadius: 28,
          backgroundColor: "#151B25",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {visual && !failed ? (
          <Image
            source={{ uri: visual }}
            style={{ width: 56, height: 56 }}
            resizeMode="contain"
            onError={() => setFailed(true)}
          />
        ) : (
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: "900",
              letterSpacing: 1.2,
            }}
          >
            {getTeamInitials(safeTeamName)}
          </Text>
        )}
      </View>

      <View className="gap-1">
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 20,
            fontWeight: "800",
            textAlign,
          }}
        >
          {safeTeamName}
        </Text>
        <Text
          style={{
            color: "#AEBBDA",
            fontSize: 14,
            textAlign,
          }}
        >
          {playerName}
        </Text>
      </View>
    </View>
  );
}

function getShortPlayerName(value?: string | null) {
  const safeValue = (value ?? "").trim();

  if (!safeValue) {
    return "jogador";
  }

  return safeValue.split(/\s+/)[0] ?? safeValue;
}

export default function MatchDetailsScreen() {
  const { id, tournamentId } = useLocalSearchParams<{ id: string; tournamentId?: string }>();
  const { width } = useWindowDimensions();
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const salvarPlacarJogo = useTournamentStore((state) => state.salvarPlacarJogo);
  const hydrated = useMatchDataHydrated();
  const persistedCampeonato =
    (tournamentId
      ? campeonatos.find((item) => item.id === tournamentId)
      : campeonatos.find((item) =>
          item.rodadas.some((rodada) => rodada.some((jogo) => jogo.id === id)),
        )) ?? null;
  const persistedJogo = persistedCampeonato?.rodadas.flat().find((item) => item.id === id) ?? null;
  const requestedTournamentMissing = Boolean(hydrated && !persistedCampeonato);
  const requestedMatchMissing = Boolean(hydrated && persistedCampeonato && !persistedJogo);

  if (!hydrated) {
    return (
      <Screen scroll className="px-6" backgroundVariant="none" style={{ backgroundColor: "#0B1018" }}>
        <ScreenState
          title="Carregando partida"
          description="Sincronizando campeonato, rodada e placar salvo."
        />
      </Screen>
    );
  }

  if (requestedTournamentMissing || requestedMatchMissing) {
    return (
      <Screen scroll className="px-6" backgroundVariant="none" style={{ backgroundColor: "#0B1018" }}>
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Partida nao encontrada"
            description="Esse link nao corresponde mais a um jogo valido do campeonato ativo."
          />
        </View>
      </Screen>
    );
  }

  if (!persistedCampeonato || !persistedJogo) {
    return null;
  }

  const campeonato = persistedCampeonato;
  const jogo = persistedJogo;
  const accessMode = useTournamentAccessMode(campeonato.id);
  const canManageMatch = canEditTournament(accessMode);
  const home = campeonato.participantes.find((item) => item.id === jogo.mandanteId);
  const away = campeonato.participantes.find((item) => item.id === jogo.visitanteId);
  const deadlineAt = getRoundDeadline(campeonato, jogo.rodada);
  const isPhone = width < 768;
  const hasSavedScore = jogo.placarMandante != null && jogo.placarVisitante != null;
  const homeTeamName = normalizeTeamDisplayName(home?.time ?? "Time da casa");
  const awayTeamName = normalizeTeamDisplayName(away?.time ?? "Time visitante");
  const homePhone = home?.whatsapp ?? null;
  const awayPhone = away?.whatsapp ?? null;
  const [showScoreEditor, setShowScoreEditor] = useState(false);
  const [homeGoals, setHomeGoals] = useState(jogo.placarMandante ?? 0);
  const [awayGoals, setAwayGoals] = useState(jogo.placarVisitante ?? 0);

  useEffect(() => {
    setHomeGoals(jogo.placarMandante ?? 0);
    setAwayGoals(jogo.placarVisitante ?? 0);
  }, [jogo.id, jogo.placarMandante, jogo.placarVisitante]);

  function updateScore(currentValue: number, delta: number, setter: (value: number) => void) {
    setter(Math.max(0, currentValue + delta));
  }

  function handleSaveScore() {
    salvarPlacarJogo(campeonato.id, jogo.id, homeGoals, awayGoals);
    setShowScoreEditor(false);
    Alert.alert(
      "Placar salvo",
      `${homeTeamName} ${homeGoals} x ${awayGoals} ${awayTeamName}. A classificação do campeonato foi atualizada.`,
    );
  }

  return (
    <Screen scroll className="px-6" backgroundVariant="none" style={{ backgroundColor: "#0B1018" }}>
      <View className="gap-6 py-8" style={{ backgroundColor: "#0B1018" }}>
        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: campeonato.id } }} />

        <SectionHeader
          eyebrow="Partida"
          title={`${homeTeamName} x ${awayTeamName}`}
          subtitle={`${home?.nome ?? "Jogador da casa"} x ${away?.nome ?? "Jogador visitante"}. Partida com mando definido, prazo da rodada e placar conectado ao ranking real do campeonato.`}
        />

        <View
          className="gap-4 rounded-[28px] p-5"
          style={{
            backgroundColor: "#121924",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <ScrollRow>
            <Badge label={`Rodada ${jogo.rodada}`} tone="neon" />
            <Badge label={campeonato.modoConfronto === "home_away" ? "Casa e\u00A0fora" : "Jogo único"} />
            <Badge label={hasSavedScore ? "Placar salvo" : "Aguardando resultado"} />
          </ScrollRow>

          <View
            className={isPhone ? "gap-5" : "flex-row items-center gap-5"}
            style={{
              paddingVertical: 10,
            }}
          >
            <TeamVisual
              teamName={homeTeamName}
              playerName={home?.nome ?? "Jogador da casa"}
              align={isPhone ? "center" : "left"}
            />

            <View
              style={{
                minWidth: isPhone ? 0 : 148,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 24,
                paddingHorizontal: 18,
                paddingVertical: 18,
                backgroundColor: "#1A2230",
                borderWidth: 1,
                borderColor: "rgba(90,136,255,0.20)",
              }}
            >
              <Text
                style={{
                  color: "#9AB8FF",
                  fontSize: 12,
                  fontWeight: "800",
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                }}
              >
                {hasSavedScore ? "Resultado" : "Confronto"}
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  color: "#FFFFFF",
                  fontSize: hasSavedScore ? 42 : 34,
                  fontWeight: "900",
                  letterSpacing: 1.2,
                }}
              >
                {hasSavedScore ? `${jogo.placarMandante}-${jogo.placarVisitante}` : "VS"}
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  color: "#AEBBDA",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {hasSavedScore ? "Classificação atualizada" : "Aguardando envio do placar"}
              </Text>
            </View>

            <TeamVisual
              teamName={awayTeamName}
              playerName={away?.nome ?? "Jogador visitante"}
              align={isPhone ? "center" : "right"}
            />
          </View>

          <View className="gap-3">
            <View
              className="rounded-[20px] px-4 py-4"
              style={{
                backgroundColor: "#171F2B",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text className="text-xs uppercase tracking-[2px] text-[#9AB8FF]">Mando e prazo</Text>
              <Text className="mt-2 text-base font-semibold text-white">
                {home?.nome} joga em casa e deve criar a sala.
              </Text>
              <Text className="mt-1 text-sm leading-6 text-[#AEBBDA]">
                Final do prazo: {formatDate(deadlineAt)}.
              </Text>
            </View>

            <View
              className="rounded-[20px] px-4 py-4"
              style={{
                backgroundColor: "#171F2B",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text className="text-xs uppercase tracking-[2px] text-[#9AB8FF]">Status da partida</Text>
              <Text className="mt-2 text-base font-semibold text-white">
                {hasSavedScore ? "Resultado registrado com sucesso" : "Placar ainda não enviado"}
              </Text>
              <Text className="mt-1 text-sm leading-6 text-[#AEBBDA]">
                {hasSavedScore
                  ? "O resultado já foi salvo e o ranking do campeonato foi recalculado."
                  : "Assim que o placar for salvo, a tabela e as estatísticas serão atualizadas."}
              </Text>
            </View>
          </View>
        </View>

        <GlassCard className="gap-4">
          <Text
            style={{
              color: "#22314F",
              fontSize: 14,
              lineHeight: 22,
              fontWeight: "700",
            }}
          >
            {canManageMatch
              ? "Use os botões abaixo para chamar qualquer jogador direto no número informado na inscrição."
              : "Modo visualização ativo. Os contatos continuam disponíveis, mas a edição do placar fica bloqueada."}
          </Text>
        </GlassCard>

        <View className={isPhone ? "gap-3" : "flex-row gap-3"}>
          <View
            className="flex-1 rounded-[24px] px-4 py-4"
            style={{
              backgroundColor: "#121924",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text className="text-xs uppercase tracking-[2px] text-[#9AB8FF]">Mandante</Text>
            <Text className="mt-2 text-base font-semibold text-white">{homeTeamName}</Text>
            <Text className="mt-1 text-sm text-[#AEBBDA]">{home?.nome ?? "Jogador da casa"}</Text>
            <View className="mt-4">
              <WhatsAppButton
                compact
                label={`Chamar ${getShortPlayerName(home?.nome)}`}
                phone={homePhone}
                round={jogo.rodada}
                tournamentName={campeonato.nome}
                recipientIsHomePlayer
              />
            </View>
          </View>

          <View
            className="flex-1 rounded-[24px] px-4 py-4"
            style={{
              backgroundColor: "#121924",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text className="text-xs uppercase tracking-[2px] text-[#9AB8FF]">Visitante</Text>
            <Text className="mt-2 text-base font-semibold text-white">{awayTeamName}</Text>
            <Text className="mt-1 text-sm text-[#AEBBDA]">{away?.nome ?? "Jogador visitante"}</Text>
            <View className="mt-4">
              <WhatsAppButton
                compact
                label={`Chamar ${getShortPlayerName(away?.nome)}`}
                phone={awayPhone}
                round={jogo.rodada}
                tournamentName={campeonato.nome}
                recipientIsHomePlayer={false}
              />
            </View>
          </View>
        </View>

        {canManageMatch ? (
          <PrimaryButton
            label={showScoreEditor ? "Ocultar editor de placar" : hasSavedScore ? "Editar placar" : "Adicionar placar"}
            onPress={() => setShowScoreEditor((current) => !current)}
          />
        ) : null}

        {canManageMatch && showScoreEditor ? (
          <View
            className="gap-5 rounded-[28px] p-5"
            style={{
              backgroundColor: "#121924",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <View className="gap-2">
              <Text className="text-xs uppercase tracking-[3px] text-[#9AB8FF]">Lançamento de placar</Text>
              <Text className="text-lg font-semibold text-white">Defina o resultado da partida</Text>
              <Text className="text-sm leading-6 text-[#AEBBDA]">
                O resultado salvo entra no campeonato imediatamente e atualiza classificação e estatísticas.
              </Text>
            </View>

            <View className="flex-row items-stretch gap-4">
              <View
                className="flex-1 gap-3 rounded-2xl px-4 py-4"
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  backgroundColor: "#171F2B",
                }}
              >
                <Text className="text-xs uppercase tracking-[2px] text-[#9AB8FF]">Mandante</Text>
                <Text className="text-lg font-semibold text-white">{homeTeamName}</Text>
                <Text className="text-xs text-[#AEBBDA]">{home?.nome ?? "Jogador da casa"}</Text>
                <View
                  className="flex-row items-center justify-between rounded-2xl px-3 py-3"
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                    backgroundColor: "#0F151F",
                  }}
                >
                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.10)",
                      backgroundColor: "#171F2B",
                    }}
                    onPress={() => updateScore(homeGoals, -1, setHomeGoals)}
                  >
                    <Text className="text-2xl font-bold text-white">-</Text>
                  </Pressable>
                  <Text className="text-4xl font-bold text-[#9AB8FF]">{homeGoals}</Text>
                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      borderWidth: 1,
                      borderColor: "rgba(154,184,255,0.35)",
                      backgroundColor: "#9AB8FF",
                    }}
                    onPress={() => updateScore(homeGoals, 1, setHomeGoals)}
                  >
                    <Text className="text-2xl font-bold text-[#0B1018]">+</Text>
                  </Pressable>
                </View>
              </View>

              <View
                className="flex-1 gap-3 rounded-2xl px-4 py-4"
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  backgroundColor: "#171F2B",
                }}
              >
                <Text className="text-xs uppercase tracking-[2px] text-[#9AB8FF]">Visitante</Text>
                <Text className="text-lg font-semibold text-white">{awayTeamName}</Text>
                <Text className="text-xs text-[#AEBBDA]">{away?.nome ?? "Jogador visitante"}</Text>
                <View
                  className="flex-row items-center justify-between rounded-2xl px-3 py-3"
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                    backgroundColor: "#0F151F",
                  }}
                >
                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.10)",
                      backgroundColor: "#171F2B",
                    }}
                    onPress={() => updateScore(awayGoals, -1, setAwayGoals)}
                  >
                    <Text className="text-2xl font-bold text-white">-</Text>
                  </Pressable>
                  <Text className="text-4xl font-bold text-[#9AB8FF]">{awayGoals}</Text>
                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      borderWidth: 1,
                      borderColor: "rgba(154,184,255,0.35)",
                      backgroundColor: "#9AB8FF",
                    }}
                    onPress={() => updateScore(awayGoals, 1, setAwayGoals)}
                  >
                    <Text className="text-2xl font-bold text-[#0B1018]">+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View
              className="rounded-2xl px-4 py-4"
              style={{
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "#171F2B",
              }}
            >
              <Text className="text-xs uppercase tracking-[2px] text-[#9AB8FF]">Prévia do placar</Text>
              <Text className="mt-2 text-xl font-semibold text-white">
                {homeTeamName} {homeGoals} x {awayGoals} {awayTeamName}
              </Text>
              <Text className="mt-1 text-sm text-[#AEBBDA]">
                {home?.nome ?? "Jogador da casa"} x {away?.nome ?? "Jogador visitante"}
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
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
