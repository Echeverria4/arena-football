import { router } from "expo-router";
import { useEffect } from "react";
import { Alert, Text, View } from "react-native";

import { FloatingWhatsAppLauncher } from "@/components/match/FloatingWhatsAppLauncher";
import { RankingBarCard } from "@/components/tournament/RankingBarCard";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { WorldCupEditionCard } from "@/components/tournament/WorldCupEditionCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import {
  getCampeonatoLeader,
  getCurrentOrLatestCampeonato,
} from "@/lib/season-tournaments";
import { normalizeTeamDisplayName, resolveTeamVisualByName, slugify } from "@/lib/team-visuals";
import { getTournamentBundle } from "@/lib/tournament-display";
import { buildMatchMessage, openWhatsAppConversation } from "@/lib/whatsapp";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useArenaDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const setCurrentTournamentId = useAppStore((state) => state.setCurrentTournamentId);
  const videos = useVideoStore((state) => state.videos);
  const { cardWidth, contentMaxWidth } = usePanelGrid();
  const hydrated = useArenaDataHydrated();

  // Derivados calculados antes de qualquer return para não violar a regra dos hooks
  const campeonatoAtivo =
    hydrated && campeonatos.length > 0
      ? getCurrentOrLatestCampeonato(campeonatos, currentTournamentId)
      : null;
  const tournamentBundle = campeonatoAtivo
    ? getTournamentBundle(campeonatoAtivo.id, campeonatos, videos)
    : null;

  // useEffect DEVE ficar antes de qualquer return condicional
  useEffect(() => {
    if (campeonatoAtivo && campeonatoAtivo.id !== currentTournamentId) {
      setCurrentTournamentId(campeonatoAtivo.id);
    }
  }, [campeonatoAtivo?.id, currentTournamentId, setCurrentTournamentId]);

  if (!hydrated) {
    return (
      <Screen scroll className="px-6">
        <View className="w-full self-center" style={{ maxWidth: contentMaxWidth }}>
          <ScreenState
            title="Carregando painel"
            description="Buscando campeonato ativo, rodada atual e ranking salvo."
          />
        </View>
      </Screen>
    );
  }

  if (!campeonatos.length) {
    return (
      <Screen scroll className="px-6">
        <View className="w-full self-center gap-8 py-8" style={{ maxWidth: contentMaxWidth }}>
          <SectionHeader
            eyebrow="Dashboard"
            title={`Painel do ${user?.name ?? "Organizador"}`}
            subtitle="Crie o primeiro campeonato para liberar rodadas, classificação, vídeos e Hall da Fama reais."
          />

          <ScreenState
            title="Nenhum campeonato criado"
            description="O painel principal só entra em operação com uma temporada real criada no app."
          />

          <FeatureCard
            icon="add-circle-outline"
            title="Criar primeiro campeonato"
            subtitle="Fluxo real"
            description="Abra o wizard para definir regra de times, participantes, formato e iniciar a primeira temporada."
            meta="Criar agora"
            width={cardWidth}
            accent="blue"
            onPress={() => router.push("/tournament/create")}
          />
        </View>
      </Screen>
    );
  }

  if (!campeonatoAtivo || !tournamentBundle) {
    return (
      <Screen scroll className="px-6">
        <View className="w-full self-center gap-8 py-8" style={{ maxWidth: contentMaxWidth }}>
          <SectionHeader
            eyebrow="Dashboard"
            title="Painel principal"
            subtitle="Não foi possível localizar uma temporada válida para montar o dashboard."
          />
          <ScreenState
            title="Campeonato atual indisponível"
            description="Selecione ou crie uma temporada válida para reconstruir o painel."
          />
        </View>
      </Screen>
    );
  }

  const bundle = tournamentBundle;

  const nextMatch = bundle.matches[0];
  const homeParticipant =
    bundle.participants.find((item) => item.id === nextMatch?.homeParticipantId) ??
    bundle.participants[0];
  const awayParticipant =
    bundle.participants.find((item) => item.id === nextMatch?.awayParticipantId) ??
    bundle.participants[1];
  const rawHomeParticipant =
    bundle.campeonato.participantes.find((item) => item.id === nextMatch?.homeParticipantId) ??
    bundle.campeonato.participantes[0];
  const rawAwayParticipant =
    bundle.campeonato.participantes.find((item) => item.id === nextMatch?.awayParticipantId) ??
    bundle.campeonato.participantes[1];
  const isHomePlayerRoomCreator =
    slugify(user?.name ?? "") === slugify(rawHomeParticipant?.nome ?? "");
  const opponentWhatsapp =
    (isHomePlayerRoomCreator ? rawAwayParticipant?.whatsapp : rawHomeParticipant?.whatsapp) ??
    rawAwayParticipant?.whatsapp ??
    rawHomeParticipant?.whatsapp ??
    null;
  const leader = getCampeonatoLeader(bundle.campeonato);
  const ranking = [...bundle.standings].sort((current, next) => next.points - current.points).slice(0, 3);
  const maxPoints = ranking[0]?.points ?? 1;
  const seasonLabel = campeonatoAtivo.temporada ?? "Temporada 01";
  const leaderTeamName = normalizeTeamDisplayName(
    leader.participante?.time ?? bundle.tournament.name,
  );
  const homeTeamName = normalizeTeamDisplayName(homeParticipant?.teamName ?? "Time A");
  const awayTeamName = normalizeTeamDisplayName(awayParticipant?.teamName ?? "Time B");

  async function handleOpenWhatsApp() {
    if (!opponentWhatsapp) {
      Alert.alert("WhatsApp indisponivel", "O adversário ainda não informou um número na inscrição.");
      return;
    }

    await openWhatsAppConversation(
      opponentWhatsapp,
      buildMatchMessage({
        round: nextMatch?.round ?? 1,
        tournamentName: bundle.tournament.name,
        isHomePlayerRoomCreator,
      }),
    );
  }

  return (
    <Screen
      scroll
      className="px-6"
      overlay={
        <FloatingWhatsAppLauncher
          phone={opponentWhatsapp}
          round={nextMatch?.round ?? 1}
          tournamentName={bundle.tournament.name}
          isHomePlayerRoomCreator={isHomePlayerRoomCreator}
        />
      }
    >
      <View className="w-full self-center gap-8 py-8" style={{ maxWidth: contentMaxWidth }}>
        <SectionHeader
          eyebrow="Dashboard"
          title={`Painel do ${user?.name ?? "Organizador"}`}
          subtitle="Visão geral da temporada ativa, com monitoramento por rodada e acesso rápido aos fluxos principais."
        />

        <View className="flex-row flex-wrap gap-5">
          <RevealOnScroll delay={0} style={{ width: cardWidth }}>
            <WorldCupEditionCard
              accent="royal"
              seasonLabel={seasonLabel}
              detailLabel={campeonatoAtivo.status === "ativo" ? "Ativa" : "Encerrada"}
              host={bundle.tournament.name}
              label="Campeonato ativo"
              title="Season"
              headline={leaderTeamName}
              support={`${leader.participante?.nome ?? "Lider da temporada"} • ${bundle.participants.length} jogadores`}
              imageUrl={resolveTeamVisualByName(leaderTeamName)}
              icon="flame-outline"
              footerNote={bundle.tournament.name}
              onPress={() => router.push(`/tournament/${bundle.campeonato.id}`)}
            />
          </RevealOnScroll>

          <RevealOnScroll delay={90} style={{ width: cardWidth }}>
            <TournamentCard
              tournament={bundle.campeonato}
              primaryAction={{
                label: "Entrar no campeonato",
                onPress: () => router.push(`/tournament/${bundle.campeonato.id}`),
              }}
              secondaryAction={{
                label: "Abrir rodadas",
                onPress: () =>
                  router.push({ pathname: "/tournament/matches", params: { id: bundle.campeonato.id } }),
                variant: "secondary",
              }}
            />
          </RevealOnScroll>
        </View>

        <View className="gap-4">
          <SectionHeader
            eyebrow="Proximos jogos"
            title="Rodada em destaque"
            subtitle="Partida mais próxima com acesso rápido para sala, leitura do confronto e contato oficial."
          />

          <View className="flex-row flex-wrap gap-5">
            <RevealOnScroll delay={0}>
              <FeatureCard
              icon="football-outline"
                title={
                  nextMatch ? `${homeTeamName} x ${awayTeamName}` : "Rodadas prontas para acompanhar"
                }
                subtitle={nextMatch ? `Rodada ${nextMatch.round}` : "Sem partida em destaque"}
                description={
                  nextMatch
                    ? `${homeParticipant?.displayName ?? "Jogador A"} enfrenta ${awayParticipant?.displayName ?? "Jogador B"} na temporada ativa.`
                    : "Abra a lista completa de rodadas para acompanhar os confrontos reais desta temporada."
                }
                meta={nextMatch ? "Entrar na partida" : "Abrir rodadas"}
                width={cardWidth}
                accent="gold"
                onPress={() =>
                  nextMatch
                    ? router.push(`/match/${nextMatch.id}?tournamentId=${bundle.campeonato.id}`)
                    : router.push({
                        pathname: "/tournament/matches",
                        params: { id: bundle.campeonato.id },
                      })
                }
              />
            </RevealOnScroll>

            <RevealOnScroll delay={80}>
              <FeatureCard
                icon="logo-whatsapp"
                title="WhatsApp da rodada"
                subtitle="Contato oficial"
                description="Abra a conversa da rodada para combinar horário, sala e confirmar a partida sem sair do painel."
                meta="Chamar agora"
                width={cardWidth}
                accent="blue"
                onPress={handleOpenWhatsApp}
              />
            </RevealOnScroll>
          </View>
        </View>

        <View className="gap-4">
          <SectionHeader
            eyebrow="Cards de campeonatos"
            title="Acesso rapido"
            subtitle="Entradas imediatas para o campeonato, ranking, jogos e Hall da Fama."
          />

          <View className="flex-row flex-wrap gap-5">
            <RevealOnScroll delay={0}>
              <FeatureCard
                icon="trophy-outline"
                title="Campeonato"
                subtitle={bundle.tournament.name}
                description="Tela principal com status, header premium e navegação interna por jogos, classificação, estatísticas e vídeos."
                meta="Entrar"
                width={cardWidth}
                onPress={() => router.push(`/tournament/${bundle.campeonato.id}`)}
              />
            </RevealOnScroll>
            <RevealOnScroll delay={80}>
              <FeatureCard
                icon="git-network-outline"
                title="Jogos"
                subtitle="Agenda + confrontos"
                description="Lista de rodadas no formato histórico, com confronto central e entrada rápida para a partida."
                meta="Abrir jogos"
                width={cardWidth}
                onPress={() =>
                  router.push({ pathname: "/tournament/matches", params: { id: bundle.campeonato.id } })
                }
              />
            </RevealOnScroll>
            <RevealOnScroll delay={160}>
              <FeatureCard
                icon="podium-outline"
                title="Classificacao"
                subtitle="Top 3 + grupos"
                description="Ranking visual tipo game, barras de pontos, destaque para líderes e leitura rápida da campanha."
                meta="Ver ranking"
                width={cardWidth}
                onPress={() =>
                  router.push({ pathname: "/tournament/standings", params: { id: bundle.campeonato.id } })
                }
              />
            </RevealOnScroll>
            <RevealOnScroll delay={240}>
              <FeatureCard
                icon="play-circle-outline"
                title="Hall da Fama"
                subtitle="Videos + premiacao"
                description="Acompanhe os vídeos com maior votação, o melhor gol e a galeria histórica da temporada."
                meta={`${bundle.videos.length} videos`}
                width={cardWidth}
                accent="gold"
                onPress={() => router.push("/hall-of-fame")}
              />
            </RevealOnScroll>
          </View>
        </View>

        <View className="gap-4">
          <SectionHeader
            eyebrow="Ranking rapido"
            title="Top 3 da temporada"
            subtitle="Leitura instantânea dos líderes atuais com barra forte, pontuação e destaque para o pódio."
          />

          <View className="gap-4">
            {ranking.map((entry, index) => {
              const participant = bundle.participants.find((item) => item.id === entry.participantId);

              return (
                <RevealOnScroll key={entry.participantId} delay={index * 80}>
                  <RankingBarCard
                    rank={index + 1}
                    teamName={normalizeTeamDisplayName(participant?.teamName ?? "Time")}
                    playerName={participant?.displayName ?? "Jogador"}
                    value={entry.points}
                    maxValue={maxPoints}
                    unit="pts"
                    accent={index === 0 ? "gold" : index === 1 ? "blue" : "mint"}
                    subtitle={`${entry.wins}V • ${entry.draws}E • ${entry.losses}D`}
                  />
                </RevealOnScroll>
              );
            })}
          </View>
        </View>
      </View>
    </Screen>
  );
}
