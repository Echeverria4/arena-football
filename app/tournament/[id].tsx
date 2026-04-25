import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { KnockoutBracket } from "@/components/matches/KnockoutBracket";
import { LeagueProgressChart } from "@/components/tournament/LeagueProgressChart";
import { BackButton } from "@/components/ui/BackButton";
import { Card3D } from "@/components/ui/Card3D";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { useTournamentAutoPush } from "@/hooks/useTournamentAutoPush";
import { deleteLocalVideoAssets } from "@/lib/local-video-assets";
import {
  canEditTournament,
  isTournamentAccessLocked,
  resolveTournamentAccessMode,
  useTournamentAccessMode,
} from "@/lib/tournament-access";
import { getCampeonatoSeasonLabel } from "@/lib/season-tournaments";
import { getTournamentBundle } from "@/lib/tournament-display";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";


export default function TournamentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const removerCampeonato = useTournamentStore((state) => state.removerCampeonato);
  const gerarFaseMataMataCampeonato = useTournamentStore((state) => state.gerarFaseMataMataCampeonato);
  const videos = useVideoStore((state) => state.videos);
  const removerVideosDoCampeonato = useVideoStore((state) => state.removerVideosDoCampeonato);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const setCurrentTournamentId = useAppStore((state) => state.setCurrentTournamentId);
  const clearTournamentAccess = useAppStore((state) => state.clearTournamentAccess);
  const { cardWidth, contentMaxWidth, gap } = usePanelGrid();
  const hydrated = useTournamentDataHydrated();
  const accessMode = useTournamentAccessMode(id);
  const tournamentMissing = Boolean(hydrated && (!id || !campeonatos.some((campeonato) => campeonato.id === id)));

  if (!hydrated) {
    return (
      <Screen scroll className="px-6">
        <View className="w-full self-center" style={{ maxWidth: contentMaxWidth }}>
          <ScreenState
            title="Carregando campeonato"
            description="Sincronizando rodadas, classificação, estatísticas e vídeos da temporada."
          />
        </View>
      </Screen>
    );
  }

  if (tournamentMissing) {
    return (
      <Screen scroll className="px-6">
        <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato nao encontrado"
            description="Esse campeonato nao existe mais na base ativa do app."
          />
        </View>
      </Screen>
    );
  }

  const bundle = (id ? getTournamentBundle(id, campeonatos, videos) : null)!;

  if (!bundle) {
    return (
      <Screen scroll className="px-6">
        <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato nao encontrado"
            description="Esse campeonato nao existe mais na base ativa do app."
          />
        </View>
      </Screen>
    );
  }

  const formato = bundle.campeonato.formato;
  const numRodadasGrupos = bundle.campeonato.numRodadasGrupos ?? 0;
  const hasKnockoutRounds =
    (formato === "groups_knockout" || formato === "knockout") &&
    bundle.campeonato.rodadas.length > numRodadasGrupos;
  const showBracketPanel =
    formato === "knockout" || (formato === "groups_knockout" && hasKnockoutRounds);
  const showChartPanel =
    formato === "league" ||
    formato === "groups" ||
    (formato === "groups_knockout" && !hasKnockoutRounds);

  const isPersistedTournament = campeonatos.some((campeonato) => campeonato.id === bundle.campeonato.id);
  const isCurrentTournament =
    currentTournamentId == null || currentTournamentId === bundle.campeonato.id;
  const canManageTournament = canEditTournament(accessMode);

  // Auto-generate first knockout round when group stage is fully done
  const groupStageAllDone =
    formato === "groups_knockout" &&
    numRodadasGrupos > 0 &&
    bundle.campeonato.rodadas.slice(0, numRodadasGrupos).flat().every((m) => m.status === "finalizado");

  useEffect(() => {
    if (groupStageAllDone && !hasKnockoutRounds && canManageTournament) {
      gerarFaseMataMataCampeonato(bundle.campeonato.id);
    }
  }, [groupStageAllDone, hasKnockoutRounds]);
  const canDeleteTournament =
    accessMode === "owner" &&
    isPersistedTournament &&
    isCurrentTournament;
  const activeTournamentAccessMode = resolveTournamentAccessMode(
    tournamentAccess,
    currentTournamentId,
  );
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);

  useEffect(() => {
    if (bundle.campeonato.id !== currentTournamentId) {
      setCurrentTournamentId(bundle.campeonato.id);
    }
  }, [bundle.campeonato.id, currentTournamentId, setCurrentTournamentId]);

  // Self-heal: if owner opens a tournament that was created before the
  // relational push worked (no supabaseId), push it now so realtime kicks in.
  // Realtime subscription itself is mounted once no _layout para cobrir
  // todas as telas do escopo /tournament/* (preview, matches, etc).
  useTournamentAutoPush({
    campeonato: bundle.campeonato,
    isOwner: accessMode === "owner",
  });

  useEffect(() => {
    if (!lockToActiveTournament || !currentTournamentId || bundle.campeonato.id === currentTournamentId) {
      return;
    }

    router.replace({ pathname: "/tournament/preview", params: { id: currentTournamentId } });
  }, [bundle.campeonato.id, currentTournamentId, lockToActiveTournament]);

  function performDeleteTournament() {
    const tournamentId = bundle.campeonato.id;
    const isFinished = bundle.campeonato.status === "finalizado";
    const storageKeys = bundle.videos
      .map((video) => video.storageKey)
      .filter((storageKey): storageKey is string => Boolean(storageKey));

    // Navigate first so the tournament screen unmounts cleanly before store mutations
    router.replace(isFinished ? "/history" : "/tournaments");

    removerVideosDoCampeonato(tournamentId);
    removerCampeonato(tournamentId);
    clearTournamentAccess(tournamentId);
    setCurrentTournamentId(undefined);
    void deleteLocalVideoAssets(storageKeys);
  }

  function handleDeleteTournament() {
    if (!isCurrentTournament) {
      Alert.alert(
        "Ação bloqueada",
        "O botão EXCLUIR só pode apagar o campeonato que está ativo no app neste momento.",
      );
      return;
    }

    const isFinished = bundle.campeonato.status === "finalizado";
    const destination = isFinished ? "histórico de temporadas" : "lista de campeonatos";
    const confirmMessage = `Deseja excluir ${bundle.campeonato.nome}? Todos os jogos, classificação e vídeos ligados a esta temporada serão apagados e você será levado de volta para o ${destination}.`;

    if (Platform.OS === "web") {
      const confirmed = globalThis.confirm?.(confirmMessage) ?? false;

      if (confirmed) {
        performDeleteTournament();
      }

      return;
    }

    Alert.alert(
      "Excluir campeonato",
      confirmMessage,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: performDeleteTournament,
        },
      ],
    );
  }

  const tabs = [
    {
      label: "Painel",
      active: true,
      onPress: () => router.replace({ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }),
    },
    {
      label: "Participantes",
      active: false,
      onPress: () => router.push({ pathname: "/tournament/participants", params: { id: bundle.campeonato.id } }),
    },
    {
      label: "Jogos",
      active: false,
      onPress: () => router.push({ pathname: "/tournament/matches", params: { id: bundle.campeonato.id } }),
    },
    {
      label: "Classificacao",
      active: false,
      onPress: () => router.push({ pathname: "/tournament/standings", params: { id: bundle.campeonato.id } }),
    },
    {
      label: "Estatisticas",
      active: false,
      onPress: () => router.push({ pathname: "/tournament/statistics", params: { id: bundle.campeonato.id } }),
    },
    {
      label: "Videos",
      active: false,
      onPress: () => router.push({ pathname: "/tournament/videos", params: { id: bundle.campeonato.id } }),
    },
    ...(accessMode === "owner"
      ? [
          {
            label: "Links",
            active: false,
            onPress: () =>
              router.push({ pathname: "/tournament/access", params: { id: bundle.campeonato.id } }),
          },
        ]
      : []),
  ];

  return (
    <Screen scroll className="px-6">
      <View className="w-full self-center gap-8 py-8" style={{ maxWidth: contentMaxWidth }}>
        {lockToActiveTournament ? null : <BackButton fallbackHref="/tournaments" />}

        {accessMode === "editor" ? (
          <View
            className="items-start rounded-[18px] border px-4 py-3"
            style={{
              borderColor: "rgba(59,91,255,0.32)",
              backgroundColor: "rgba(10,20,44,0.72)",
            }}
          >
            <Text style={{ color: "#D7E5FF", fontSize: 14, fontWeight: "700" }}>
              Modo editor via link ativo. Este acesso fica restrito ao campeonato atual.
            </Text>
          </View>
        ) : null}

        {accessMode === "owner" && isPersistedTournament && !canDeleteTournament ? (
          <View
            className="items-start rounded-[18px] border px-4 py-3"
            style={{
              borderColor: "rgba(233,179,52,0.28)",
              backgroundColor: "rgba(80,54,10,0.72)",
            }}
          >
            <Text style={{ color: "#FFD76A", fontSize: 14, fontWeight: "700" }}>
              O botão EXCLUIR apaga apenas o campeonato que está ativo no app neste momento.
            </Text>
          </View>
        ) : null}

        <View className="items-center gap-3">
          <Text
            style={{
              color: "#F3F7FF",
              fontSize: 34,
              fontWeight: "900",
              lineHeight: 40,
              textAlign: "center",
            }}
          >
            {bundle.tournament.name}
          </Text>
          <Text
            style={{
              maxWidth: 880,
              color: "#AEBBDA",
              fontSize: 16,
              lineHeight: 28,
              textAlign: "center",
            }}
          >
            {`Status ${
              bundle.tournament.status === "finished" ? "finalizado" : "em andamento"
            } com painel central para jogos, classificação, estatísticas e vídeos.`}
          </Text>
        </View>

        <ScrollRow>
          {tabs.map((tab) => (
            <ChoiceChip
              key={tab.label}
              label={tab.label}
              active={tab.active}
              onPress={tab.onPress}
              compact
            />
          ))}
        </ScrollRow>

        <RevealOnScroll delay={0}>
          <Card3D
            accent={bundle.tournament.status === "finished" ? "gold" : "blue"}
            ambientSurface={bundle.tournament.status !== "finished"}
            eyebrow="Tela principal"
            badge={bundle.tournament.status === "finished" ? "Finalizado" : "Em andamento"}
            hideHeroPanel
            minHeight={540}
            footerLeft={`${bundle.participants.length} jogadores`}
            content={
              showBracketPanel ? (
                <KnockoutBracket
                  campeonato={bundle.campeonato}
                  participantes={bundle.campeonato.participantes}
                  onPressMatch={() =>
                    router.push({ pathname: "/tournament/matches", params: { id: bundle.campeonato.id } })
                  }
                />
              ) : showChartPanel ? (
                <LeagueProgressChart
                  campeonato={bundle.campeonato}
                  format={bundle.tournament.format}
                />
              ) : null
            }
          />
        </RevealOnScroll>


        <View style={{ gap: 12 }}>
          <RevealOnScroll delay={0}>
            <FeatureCard
              icon="people-outline"
              title="Participantes"
              subtitle="Elenco da temporada"
              meta="Abrir"
              width={cardWidth}
              onPress={() =>
                router.push({ pathname: "/tournament/participants", params: { id: bundle.campeonato.id } })
              }
            />
          </RevealOnScroll>
          <RevealOnScroll delay={80}>
            <FeatureCard
              icon="git-network-outline"
              title="Jogos"
              subtitle="Confrontos"
              meta="Abrir"
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
              subtitle="Ranking visual"
              meta="Abrir"
              width={cardWidth}
              onPress={() =>
                router.push({ pathname: "/tournament/standings", params: { id: bundle.campeonato.id } })
              }
            />
          </RevealOnScroll>
          <RevealOnScroll delay={240}>
            <FeatureCard
              icon="stats-chart-outline"
              title="Estatisticas"
              subtitle="Ataque, defesa e destaque"
              meta="Abrir"
              width={cardWidth}
              accent="blue"
              onPress={() =>
                router.push({ pathname: "/tournament/statistics", params: { id: bundle.campeonato.id } })
              }
            />
          </RevealOnScroll>
          <RevealOnScroll delay={320}>
            <FeatureCard
              icon="videocam-outline"
              title="Videos"
              subtitle="Reels do campeonato"
              meta="Abrir"
              width={cardWidth}
              accent="gold"
              onPress={() =>
                router.push({ pathname: "/tournament/videos", params: { id: bundle.campeonato.id } })
              }
            />
          </RevealOnScroll>
          {accessMode === "owner" ? (
            <RevealOnScroll delay={400}>
              <FeatureCard
                icon="link-outline"
                title="Links"
                subtitle="Editor e visualizador"
                meta="Abrir"
                width={cardWidth}
                accent="blue"
                onPress={() =>
                  router.push({ pathname: "/tournament/access", params: { id: bundle.campeonato.id } })
                }
              />
            </RevealOnScroll>
          ) : null}
        </View>

        {canManageTournament && canDeleteTournament ? (
          <View className="gap-4">
            <SectionHeader
              eyebrow="Gestão"
              title="Remover campeonato"
              subtitle="A exclusão apaga o campeonato atual inteiro, incluindo rodadas, classificação e vídeos vinculados."
            />
            <View className="items-start">
              <Pressable
                onPress={handleDeleteTournament}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(192,70,91,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(192,70,91,0.40)",
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#C0465B" />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
