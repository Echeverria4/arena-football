import { router } from "expo-router";
import { View } from "react-native";

import {
  getFinishedChampionshipHistory,
  getPlayerTitleLeaderboard,
  getTeamTitleLeaderboard,
} from "@/lib/championship-history";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { RankingBarCard } from "@/components/tournament/RankingBarCard";
import { ChampionShowcaseCard } from "@/components/trophies/ChampionShowcaseCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { useTournamentStore } from "@/stores/tournament-store";
import { useArenaDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

export function TitlesGalleryPanel() {
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const videos = useVideoStore((state) => state.videos);
  const hydrated = useArenaDataHydrated();
  const { cardWidth, contentMaxWidth } = usePanelGrid();

  if (!hydrated) {
    return (
      <View className="w-full self-center pb-8" style={{ maxWidth: contentMaxWidth }}>
        <ScreenState
          title="Carregando títulos"
          description="Sincronizando campeões, histórico das temporadas e ranking de conquistas."
        />
      </View>
    );
  }

  const history = getFinishedChampionshipHistory(campeonatos, videos);
  const latestChampion = history[0] ?? null;
  const playerTitles = getPlayerTitleLeaderboard(campeonatos);
  const teamTitles = getTeamTitleLeaderboard(campeonatos);

  return (
    <View className="w-full self-center gap-6 pb-8" style={{ maxWidth: contentMaxWidth }}>
      <SectionHeader
        eyebrow="Títulos"
        title="Histórico oficial de campeões"
        subtitle="Arquivo real das temporadas encerradas, com campeão, time ou seleção, títulos acumulados e ligação direta para cada campeonato."
      />

      {!history.length ? (
        <View className="gap-5">
          <ScreenState
            title="Nenhum campeonato finalizado ainda"
            description="Assim que a primeira temporada terminar, o histórico oficial de campeões aparece aqui."
          />

          <FeatureCard
            icon="trophy-outline"
            title="Abrir campeonato atual"
            subtitle="Continuar temporada"
            description="Finalize os jogos da temporada ativa para transformar a campanha em título e registrar o campeão neste histórico."
            meta="Ir para campeonatos"
            width={cardWidth}
            accent="gold"
            onPress={() => router.push("/tournaments")}
          />
        </View>
      ) : (
        <>
          {latestChampion ? (
            <RevealOnScroll delay={0}>
              <ChampionShowcaseCard
                seasonLabel={latestChampion.campeonato.temporada ?? "Temporada encerrada"}
                tournamentName={latestChampion.campeonato.nome}
                championLabel="Campeão mais recente"
                teamName={latestChampion.championTeamName}
                playerName={latestChampion.championPlayerName}
                statusLabel="Encerrada"
                summary={`${latestChampion.videosCount} vídeos ligados à temporada e campanha final fechada com ${latestChampion.points} pontos.`}
                statLine={[
                  { label: "Pontos", value: String(latestChampion.points) },
                  { label: "Vitórias", value: String(latestChampion.wins) },
                  {
                    label: "Saldo",
                    value: `${latestChampion.goalDifference >= 0 ? "+" : ""}${latestChampion.goalDifference}`,
                  },
                  { label: "Vídeos", value: String(latestChampion.videosCount) },
                ]}
                accent="gold"
                actionLabel="Abrir temporada"
                onPress={() => router.push(`/tournament/${latestChampion.campeonato.id}`)}
              />
            </RevealOnScroll>
          ) : null}

          <View className="gap-4">
            <SectionHeader
              eyebrow="Ranking de títulos"
              title="Quem mais conquistou"
              subtitle="Leitura rápida das campanhas que já viraram troféu no histórico real do app."
            />

            <View className="gap-4">
              {playerTitles.slice(0, 3).map((entry, index) => (
                <RevealOnScroll key={entry.id} delay={index * 70}>
                  <RankingBarCard
                    rank={index + 1}
                    teamName={entry.label}
                    playerName={entry.subtitle}
                    value={entry.titles}
                    maxValue={playerTitles[0]?.titles ?? 1}
                    unit="tit."
                    accent={index === 0 ? "gold" : index === 1 ? "blue" : "mint"}
                    subtitle={`Última conquista: ${entry.latestSeason}`}
                  />
                </RevealOnScroll>
              ))}
            </View>

            <View className="gap-4">
              {teamTitles.slice(0, 3).map((entry, index) => (
                <RevealOnScroll key={entry.id} delay={index * 70}>
                  <RankingBarCard
                    rank={index + 1}
                    teamName={entry.label}
                    playerName={entry.subtitle}
                    value={entry.titles}
                    maxValue={teamTitles[0]?.titles ?? 1}
                    unit="tit."
                    accent={index === 0 ? "gold" : index === 1 ? "blue" : "mint"}
                    subtitle={`Equipe/seleção campeã • última conquista ${entry.latestSeason}`}
                  />
                </RevealOnScroll>
              ))}
            </View>
          </View>

          <View className="gap-4">
            <SectionHeader
              eyebrow="Arquivo de temporadas"
              title="Campeonatos encerrados"
              subtitle="Histórico completo de campeões das temporadas passadas, sem depender de dados de teste."
            />

            <View className="flex-row flex-wrap gap-5">
              {history.map((entry, index) => (
                <RevealOnScroll key={entry.campeonato.id} delay={index * 80} style={{ width: cardWidth }}>
                  <TournamentCard
                    tournament={entry.campeonato}
                    primaryAction={{
                      label: "Abrir temporada",
                      onPress: () => router.push(`/tournament/${entry.campeonato.id}`),
                    }}
                    secondaryAction={{
                      label: "Ver classificação",
                      onPress: () =>
                        router.push({
                          pathname: "/tournament/standings",
                          params: { id: entry.campeonato.id },
                        }),
                      variant: "secondary",
                    }}
                  />
                </RevealOnScroll>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );
}
