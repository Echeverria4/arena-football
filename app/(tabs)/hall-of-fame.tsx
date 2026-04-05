import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { ChampionShowcaseCard } from "@/components/trophies/ChampionShowcaseCard";
import { SeasonPodiumBoard } from "@/components/trophies/SeasonPodiumBoard";
import { RankingBarCard } from "@/components/tournament/RankingBarCard";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { VideoHighlightCard } from "@/components/videos/VideoHighlightCard";
import {
  getFinishedChampionshipHistory,
  getPlayerTitleLeaderboard,
  getTeamTitleLeaderboard,
} from "@/lib/championship-history";
import {
  getCampeonatoLeader,
  getCampeonatoPodium,
  getCurrentOrLatestCampeonato,
  getSeasonStatus,
} from "@/lib/season-tournaments";
import { normalizeTeamDisplayName } from "@/lib/team-visuals";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useArenaDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

type SubView = "overview" | "podium" | "video-gallery";

export default function HallOfFameScreen() {
  const user = useAuthStore((state) => state.user);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const setCurrentTournamentId = useAppStore((state) => state.setCurrentTournamentId);
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const videos = useVideoStore((state) => state.videos);
  const voteVideo = useVideoStore((state) => state.voteVideo);
  const userVotes = useVideoStore((state) => state.userVotes);
  const { contentMaxWidth } = usePanelGrid();
  const [subView, setSubView] = useState<SubView>("overview");
  const hydrated = useArenaDataHydrated();
  const voterId = user?.id ?? user?.email ?? "funcionario-dispositivo";
  const hasCurrentUserVoted = Boolean(userVotes[voterId]);
  const featuredCampeonato = getCurrentOrLatestCampeonato(campeonatos, currentTournamentId);

  useEffect(() => {
    if (featuredCampeonato && featuredCampeonato.id !== currentTournamentId) {
      setCurrentTournamentId(featuredCampeonato.id);
    }
  }, [featuredCampeonato, currentTournamentId, setCurrentTournamentId]);
  const tournamentVideos = useMemo(() => {
    if (!featuredCampeonato) {
      return videos;
    }

    const filtered = videos.filter((video) => video.tournamentId === featuredCampeonato.id);
    return filtered.length ? filtered : videos;
  }, [featuredCampeonato, videos]);
  const orderedVideos = useMemo(
    () => [...tournamentVideos].sort((current, next) => next.votesCount - current.votesCount),
    [tournamentVideos],
  );
  const finishedHistory = useMemo(
    () => getFinishedChampionshipHistory(campeonatos, videos),
    [campeonatos, videos],
  );
  const playerTitleLeaders = useMemo(
    () => getPlayerTitleLeaderboard(campeonatos).slice(0, 3),
    [campeonatos],
  );
  const teamTitleLeaders = useMemo(
    () => getTeamTitleLeaderboard(campeonatos).slice(0, 3),
    [campeonatos],
  );

  if (!hydrated) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View className="w-full self-center" style={{ maxWidth: contentMaxWidth }}>
          <ScreenState
            title="Carregando hall da fama"
            description="Sincronizando campeão, pódio e vídeos reais da temporada."
          />
        </View>
      </Screen>
    );
  }

  if (!campeonatos.length) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
          <SectionHeader
            eyebrow="Hall da Fama"
            title="Hall da Fama"
            subtitle="O pódio aparece assim que a primeira temporada tiver classificação real."
          />
          <ScreenState
            title="Sem temporadas ainda"
            description="Crie um campeonato, salve os placares e o Hall da Fama passa a mostrar campeão, time e top 3 da temporada."
          />
          <PrimaryButton
            label="Criar campeonato"
            onPress={() => router.push("/tournament/create")}
          />
        </View>
      </Screen>
    );
  }

  if (!featuredCampeonato) {
    return null;
  }

  const leader = getCampeonatoLeader(featuredCampeonato);
  const podium = getCampeonatoPodium(featuredCampeonato, 3);
  const championClassificacao = leader.classificacao;
  const championParticipant = leader.participante;
  const championTeam = normalizeTeamDisplayName(
    championParticipant?.time ?? championClassificacao?.time ?? featuredCampeonato.nome,
  );

  const podiumEntries = podium.map((entry, index) => {
    const participant = featuredCampeonato.participantes.find(
      (item) => item.id === entry.participanteId,
    );

    return {
      id: entry.participanteId,
      position: (index + 1) as 1 | 2 | 3,
      teamName: normalizeTeamDisplayName(participant?.time ?? entry.time),
      playerName: participant?.nome ?? entry.nome,
      points: entry.pontos,
      wins: entry.vitorias,
      goalDifference: entry.saldo,
      played: entry.jogos,
    };
  });

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
        {subView === "overview" ? (
          <>
            <SectionHeader
              eyebrow="Hall da Fama"
              title="Campeão em destaque"
              subtitle="O card principal mostra o campeão ou líder atual. Passe o mouse para virar e clique para abrir o pódio da temporada."
            />

            <RevealOnScroll delay={0}>
              <ChampionShowcaseCard
                seasonLabel={featuredCampeonato.temporada ?? "Temporada atual"}
                tournamentName={featuredCampeonato.nome}
                championLabel={
                  getSeasonStatus(featuredCampeonato) === "finalizado" ? "Campeão atual" : "Líder atual"
                }
                teamName={championTeam}
                playerName={championParticipant?.nome ?? championClassificacao?.nome ?? "A definir"}
                statusLabel={featuredCampeonato.status === "finalizado" ? "Encerrada" : "Em disputa"}
                summary={`${
                  championParticipant?.nome ?? championClassificacao?.nome ?? "O líder"
                } puxa a temporada ${featuredCampeonato.temporada ?? ""} no campeonato ${
                  featuredCampeonato.nome
                }.`}
                statLine={[
                  { label: "Pontos", value: String(championClassificacao?.pontos ?? 0) },
                  { label: "Vitórias", value: String(championClassificacao?.vitorias ?? 0) },
                  {
                    label: "Saldo",
                    value: `${(championClassificacao?.saldo ?? 0) >= 0 ? "+" : ""}${championClassificacao?.saldo ?? 0}`,
                  },
                  { label: "Jogos", value: String(championClassificacao?.jogos ?? 0) },
                ]}
                accent={featuredCampeonato.status === "finalizado" ? "gold" : "blue"}
                actionLabel="Abrir pódio"
                onPress={() => setSubView("podium")}
              />
            </RevealOnScroll>

            <View className="flex-row flex-wrap gap-3">
              <PrimaryButton
                label="Ver pódio da temporada"
                onPress={() => setSubView("podium")}
                variant="gold"
                className="flex-1"
              />
              <PrimaryButton
                label="Abrir campeonato"
                onPress={() => {
                  setCurrentTournamentId(featuredCampeonato.id);
                  router.push(`/tournament/${featuredCampeonato.id}`);
                }}
                variant="secondary"
                className="flex-1"
              />
              {orderedVideos.length ? (
                <PrimaryButton
                  label="Galeria de vídeos"
                  onPress={() => setSubView("video-gallery")}
                  variant="light"
                  className="flex-1"
                />
              ) : null}
              <PrimaryButton
                label="Histórico e títulos"
                onPress={() => router.push({ pathname: "/gallery", params: { section: "titles" } })}
                variant="secondary"
                className="flex-1"
              />
            </View>

            {playerTitleLeaders.length ? (
              <View className="gap-4">
                <SectionHeader
                  eyebrow="Titulos"
                  title="Quem mais venceu"
                  subtitle="O Hall da Fama agora também acompanha quem acumula mais títulos e quais equipes já levantaram troféus reais."
                />

                <View className="gap-4">
                  {playerTitleLeaders.map((entry, index) => (
                    <RevealOnScroll key={entry.id} delay={index * 70}>
                      <RankingBarCard
                        rank={index + 1}
                        teamName={entry.label}
                        playerName={entry.subtitle}
                        value={entry.titles}
                        maxValue={playerTitleLeaders[0]?.titles ?? 1}
                        unit="tit."
                        accent={index === 0 ? "gold" : index === 1 ? "blue" : "mint"}
                        subtitle={`Última conquista: ${entry.latestSeason}`}
                      />
                    </RevealOnScroll>
                  ))}
                </View>

                {teamTitleLeaders.length ? (
                  <View className="gap-4">
                    {teamTitleLeaders.map((entry, index) => (
                      <RevealOnScroll key={entry.id} delay={index * 70}>
                        <RankingBarCard
                          rank={index + 1}
                          teamName={entry.label}
                          playerName={entry.subtitle}
                          value={entry.titles}
                          maxValue={teamTitleLeaders[0]?.titles ?? 1}
                          unit="tit."
                          accent={index === 0 ? "gold" : index === 1 ? "blue" : "mint"}
                          subtitle={`Equipe/seleção campeã • última conquista ${entry.latestSeason}`}
                        />
                      </RevealOnScroll>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            {finishedHistory.length ? (
              <View className="gap-4">
                <SectionHeader
                  eyebrow="Arquivo"
                  title="Últimos campeões"
                  subtitle="Campeões oficiais das temporadas já encerradas, com ligação direta para o histórico completo."
                />

                <View className="gap-4">
                  {finishedHistory.slice(0, 2).map((entry, index) => (
                    <RevealOnScroll key={entry.campeonato.id} delay={index * 80}>
                      <ChampionShowcaseCard
                        seasonLabel={entry.campeonato.temporada ?? "Temporada encerrada"}
                        tournamentName={entry.campeonato.nome}
                        championLabel="Campeão"
                        teamName={entry.championTeamName}
                        playerName={entry.championPlayerName}
                        statusLabel="Encerrada"
                        summary={`${entry.videosCount} vídeos ligados a essa temporada e campanha fechada com ${entry.points} pontos.`}
                        statLine={[
                          { label: "Pontos", value: String(entry.points) },
                          { label: "Vitórias", value: String(entry.wins) },
                          {
                            label: "Saldo",
                            value: `${entry.goalDifference >= 0 ? "+" : ""}${entry.goalDifference}`,
                          },
                          { label: "Vídeos", value: String(entry.videosCount) },
                        ]}
                        accent="gold"
                        actionLabel="Abrir temporada"
                        onPress={() => router.push(`/tournament/${entry.campeonato.id}`)}
                      />
                    </RevealOnScroll>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {subView === "podium" ? (
          <View className="gap-5">
            <RevealOnScroll delay={0}>
              <BackButton onPress={() => setSubView("overview")} label="Voltar" />
            </RevealOnScroll>

            <SectionHeader
              eyebrow="Hall da Fama"
              title={`Top 3 • ${featuredCampeonato.temporada ?? "Temporada atual"}`}
              subtitle="Pódio da classificação atual da temporada. Passe o mouse sobre cada posição para alternar entre destaque e estatísticas."
            />

            <RevealOnScroll delay={40}>
              <SeasonPodiumBoard
                title={featuredCampeonato.nome}
                subtitle="O ranking do pódio acompanha a classificação real salva no campeonato."
                entries={podiumEntries}
              />
            </RevealOnScroll>

            <View className="flex-row flex-wrap gap-3">
              <PrimaryButton
                label="Abrir campeonato"
                onPress={() => {
                  setCurrentTournamentId(featuredCampeonato.id);
                  router.push(`/tournament/${featuredCampeonato.id}`);
                }}
                variant="secondary"
                className="flex-1"
              />
              <PrimaryButton
                label="Ver classificação completa"
                onPress={() =>
                  router.push({
                    pathname: "/tournament/standings",
                    params: { id: featuredCampeonato.id },
                  })
                }
                variant="light"
                className="flex-1"
              />
              <PrimaryButton
                label="Histórico e títulos"
                onPress={() => router.push({ pathname: "/gallery", params: { section: "titles" } })}
                variant="secondary"
                className="flex-1"
              />
            </View>
          </View>
        ) : null}

        {subView === "video-gallery" ? (
          <View className="gap-5 px-2">
            <RevealOnScroll delay={0}>
              <BackButton onPress={() => setSubView("overview")} label="Voltar" />
            </RevealOnScroll>

            <SectionHeader
              eyebrow="Hall da Fama"
              title="Galeria de vídeos"
              subtitle="Destaques da temporada organizados por votação."
            />

            <View className="gap-5">
              {orderedVideos.map((video, index) => {
                const selectedByCurrentUser = userVotes[voterId] === video.id;

                return (
                  <RevealOnScroll key={video.id} delay={index * 70}>
                    <VideoHighlightCard
                      video={{
                        ...video,
                        isGoalAwardWinner: index === 0,
                        tournamentName: video.tournamentName ?? featuredCampeonato.nome,
                      }}
                      voteLocked={hasCurrentUserVoted}
                      voteLabel={
                        selectedByCurrentUser
                          ? "Seu voto"
                          : hasCurrentUserVoted
                            ? "Votação travada"
                            : "Votar"
                      }
                      onVote={() => voteVideo(voterId, video.id)}
                    />
                  </RevealOnScroll>
                );
              })}

              {!orderedVideos.length ? (
                <Text
                  style={{
                    color: "#AEBBDA",
                    fontSize: 15,
                    lineHeight: 24,
                  }}
                >
                  Ainda não existem vídeos cadastrados nesta temporada.
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
