import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { BackButton } from "@/components/ui/BackButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  canEditTournament,
  isTournamentAccessLocked,
  resolveTournamentAccessMode,
  useTournamentAccessMode,
} from "@/lib/tournament-access";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { VideoHighlightCard } from "@/components/videos/VideoHighlightCard";
import { getTournamentBundle } from "@/lib/tournament-display";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

export default function TournamentVideosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const videosStore = useVideoStore((state) => state.videos);
  const voteVideo = useVideoStore((state) => state.voteVideo);
  const userVotes = useVideoStore((state) => state.userVotes);
  const user = useAuthStore((state) => state.user);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const { cardWidth } = usePanelGrid();
  const hydrated = useTournamentDataHydrated();
  const accessMode = useTournamentAccessMode(id);
  const canManageVideos = canEditTournament(accessMode);
  const bundle = id ? getTournamentBundle(id, campeonatos, videosStore) : null;
  const activeTournamentAccessMode = resolveTournamentAccessMode(
    tournamentAccess,
    currentTournamentId,
  );
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const voterId = user?.id ?? user?.email ?? "arena-device";
  const hasCurrentUserVoted = Boolean(userVotes[voterId]);

  if (!hydrated) {
    return (
      <Screen scroll className="px-6" backgroundVariant="soft">
        <ScreenState
          title="Carregando vídeos"
          description="Sincronizando biblioteca oficial da temporada."
        />
      </Screen>
    );
  }

  if (!bundle) {
    return (
      <Screen scroll className="px-6" backgroundVariant="soft">
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato nao encontrado"
            description="Nao existe mais uma temporada valida para abrir os videos."
          />
        </View>
      </Screen>
    );
  }

  useEffect(() => {
    if (!lockToActiveTournament || !currentTournamentId || bundle.campeonato.id === currentTournamentId) {
      return;
    }

    router.replace({ pathname: "/tournament/videos", params: { id: currentTournamentId } });
  }, [bundle.campeonato.id, currentTournamentId, lockToActiveTournament]);

  const orderedVideos = useMemo(() => {
    return [...bundle.videos].sort((current, next) => next.votesCount - current.votesCount);
  }, [bundle.videos]);

  function toggleFavorite(videoId: string) {
    setFavoriteIds((current) =>
      current.includes(videoId)
        ? current.filter((item) => item !== videoId)
        : [...current, videoId],
    );
  }

  return (
    <Screen scroll className="px-6" backgroundVariant="soft">
      <View className="gap-6 py-8">
        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />

        <SectionHeader
          eyebrow="Videos do campeonato"
          title={`Lances de ${bundle.tournament.name}`}
        />

        <View className="gap-5">
          {orderedVideos.map((video, index) => {
            const selectedByCurrentUser = userVotes[voterId] === video.id;
            const isFavorite = favoriteIds.includes(video.id);
            const isWinner = index === 0 || video.isGoalAwardWinner;

            return (
              <RevealOnScroll key={video.id} delay={index * 70} style={{ width: cardWidth }}>
                <VideoHighlightCard
                  video={{ ...video, isGoalAwardWinner: isWinner }}
                  voteLocked={hasCurrentUserVoted}
                  voteLabel={
                    isWinner
                      ? "Gol mais bonito"
                      : selectedByCurrentUser
                        ? "Seu voto"
                        : hasCurrentUserVoted
                          ? "Votacao travada"
                          : "Votar"
                  }
                  favoriteLabel={isFavorite ? "Favoritado" : "Favorito"}
                  onVote={() => voteVideo(voterId, video.id)}
                  onFavorite={canManageVideos ? () => toggleFavorite(video.id) : undefined}
                />
              </RevealOnScroll>
            );
          })}
        </View>

        {orderedVideos.length === 0 ? (
          <Text className="text-base leading-7 text-arena-muted">
            Nenhum video foi cadastrado ainda para este campeonato.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
