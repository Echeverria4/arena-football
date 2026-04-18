import { router } from "expo-router";
import { Text, View, useWindowDimensions } from "react-native";

import { TournamentCard } from "@/components/tournament/TournamentCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { sortCampeonatosBySeason } from "@/lib/season-tournaments";
import { useTournamentStore } from "@/stores/tournament-store";

export default function HistoryScreen() {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 420;
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const { contentMaxWidth } = usePanelGrid();

  const finished = sortCampeonatosBySeason(
    campeonatos.filter((c) => c.status === "finalizado"),
  ).reverse();

  return (
    <Screen scroll className={isSmallPhone ? "px-4" : "px-6"}>
      <View
        className="w-full self-center"
        style={{
          maxWidth: contentMaxWidth,
          gap: isSmallPhone ? 20 : 24,
          paddingVertical: isSmallPhone ? 16 : 24,
        }}
      >
        <SectionHeader
          eyebrow="Histórico"
          title="Temporadas encerradas"
          subtitle="Consulte resultados, chaveamentos e classificações de todas as edições já concluídas."
        />

        {finished.length === 0 ? (
          <ScreenState
            title="Nenhuma temporada encerrada"
            description="Quando um campeonato for concluído, ele aparecerá aqui para consulta e memória."
          />
        ) : (
          <View className="gap-5">
            {finished.map((campeonato, index) => (
              <RevealOnScroll key={campeonato.id} delay={index * 60}>
                <TournamentCard
                  tournament={campeonato}
                  surface="dark"
                  primaryAction={{
                    label: "Abrir painel",
                    onPress: () =>
                      router.push({
                        pathname: "/tournament/preview",
                        params: { id: campeonato.id },
                      }),
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
        )}

        {finished.length > 0 ? (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(245,158,11,0.22)",
              backgroundColor: "rgba(80,54,10,0.45)",
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 4,
            }}
          >
            <Text style={{ color: "#FDE68A", fontSize: 12, fontWeight: "900", letterSpacing: 1.6, textTransform: "uppercase" }}>
              Acesso completo
            </Text>
            <Text style={{ color: "rgba(253,230,138,0.72)", fontSize: 13, lineHeight: 20 }}>
              Campeonatos encerrados mantêm acesso total: painel, rodadas, chaveamento e classificação.
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
