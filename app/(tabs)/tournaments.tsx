import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";

import { LoginPromptModal } from "@/components/auth/LoginPromptModal";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { sortCampeonatosBySeason } from "@/lib/season-tournaments";
import { isTournamentAccessLocked, resolveTournamentAccessMode } from "@/lib/tournament-access";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTournamentStore } from "@/stores/tournament-store";

export default function TournamentsScreen() {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 420;
  const isPhone = width < 768;
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const setCurrentTournamentId = useAppStore((state) => state.setCurrentTournamentId);
  const user = useAuthStore((state) => state.user);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { contentMaxWidth } = usePanelGrid();
  const orderedCampeonatos = sortCampeonatosBySeason(campeonatos);
  const activeCampeonatos = orderedCampeonatos.filter((campeonato) => campeonato.status === "ativo");
  const archivedCampeonatos = orderedCampeonatos.filter((campeonato) => campeonato.status === "finalizado");
  const activeAccessMode = resolveTournamentAccessMode(tournamentAccess, currentTournamentId);
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeAccessMode);

  useEffect(() => {
    if (!lockToActiveTournament || !currentTournamentId) {
      return;
    }

    router.replace({ pathname: "/tournament/preview", params: { id: currentTournamentId } });
  }, [currentTournamentId, lockToActiveTournament]);

  if (lockToActiveTournament) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View className="w-full self-center gap-8 py-8" style={{ maxWidth: contentMaxWidth }}>
          <ScreenState
            title="Abrindo campeonato ativo"
            description="Seu acesso atual está restrito ao campeonato compartilhado. Redirecionando para o painel correto."
          />
        </View>
      </Screen>
    );
  }

  function openTournament(id: string) {
    router.push({ pathname: "/tournament/preview", params: { id } });
  }

  function goToNewTournament() {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    router.push("/tournament/create");
  }

  return (
    <Screen
      scroll
      className={isSmallPhone ? "px-4" : "px-6"}
      overlay={
        <LoginPromptModal
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          eyebrow="Criar campeonato"
          title="Entrar para criar"
          description="Voce esta navegando como convidado. Para criar um campeonato precisa de uma conta — leva menos de 1 minuto e o login fica salvo para as proximas vezes."
          redirectPath="/tournament/create"
        />
      }
    >
      <View
        className="w-full self-center"
        style={{
          maxWidth: contentMaxWidth,
          gap: isSmallPhone ? 20 : isPhone ? 24 : 32,
          paddingVertical: isSmallPhone ? 16 : 24,
        }}
      >
        <SectionHeader
          eyebrow="Campeonatos"
          title="Temporadas do Arena"
          subtitle="Organize ciclos ativos, acompanhe temporadas encerradas e entre rápido no painel principal de cada campeonato."
        />

        <RevealOnScroll delay={0}>
          <LiveBorderCard
            accent="gold"
            radius={20}
            padding={1.4}
            backgroundColor="#0A1018"
            contentStyle={{ paddingHorizontal: 20, paddingVertical: 22 }}
          >
            <View className="gap-5">
              <View className="gap-2">
                <Text
                  style={{
                    color: "#FFD76A",
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 2.4,
                    textTransform: "uppercase",
                  }}
                >
                  Novo ciclo
                </Text>
                <Text style={{ color: "#F3F7FF", fontSize: isSmallPhone ? 20 : isPhone ? 24 : 30, fontWeight: "900" }}>
                  Criar campeonato
                </Text>
                <Text style={{ color: "#AEBBDA", fontSize: 15, lineHeight: 24 }}>
                  Abra a configuração inicial da temporada e entre no painel principal assim que
                  concluir o primeiro passo.
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-3">
                <ChoiceChip label="Painel central" active tone="gold" />
                <ChoiceChip label="Cards destacados" tone="gold" />
                <ChoiceChip label="Fluxo real" tone="gold" />
              </View>

              <PrimaryButton
                label="Nova temporada"
                variant="gold"
                onPress={goToNewTournament}
                className="self-start rounded-[16px] px-6 py-3"
              />
            </View>
          </LiveBorderCard>
        </RevealOnScroll>

        {orderedCampeonatos.length === 0 ? (
          <ScreenState
            title="Nenhum campeonato ainda"
            description="Crie o primeiro campeonato para liberar rodadas, gráfico de evolução, classificação e compartilhamento."
          />
        ) : null}

        {activeCampeonatos.length > 0 ? (
          <View className="gap-4">
            <SectionHeader
              eyebrow="Em andamento"
              title="Temporadas ativas"
              subtitle="Campeonatos com rodadas abertas, painel central e acesso direto ao andamento atual."
            />

            <View className="gap-5">
              {activeCampeonatos.map((campeonato, index) => (
                <RevealOnScroll key={campeonato.id} delay={index * 70}>
                  <TournamentCard
                    tournament={campeonato}
                    surface="dark"
                    primaryAction={{
                      label: "Abrir painel",
                      onPress: () => openTournament(campeonato.id),
                    }}
                    secondaryAction={{
                      label: "Ver rodadas",
                      onPress: () =>
                        router.push({
                          pathname: "/tournament/matches",
                          params: { id: campeonato.id },
                        }),
                      variant: "secondary",
                    }}
                  />
                </RevealOnScroll>
              ))}
            </View>
          </View>
        ) : null}

      </View>
    </Screen>
  );
}
