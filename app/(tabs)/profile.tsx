import { router } from "expo-router";
import { Alert, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { signOut } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfileScreen() {
  const [user, clearSession] = useAuthStore((state) => [state.user, state.clearSession]);
  const { cardWidth, contentMaxWidth } = usePanelGrid();

  async function handleSignOut() {
    try {
      await signOut();
      clearSession();
      router.replace("/login");
    } catch (error) {
      Alert.alert("Saida nao concluida", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  return (
    <Screen scroll className="px-6">
      <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
        <SectionHeader
          eyebrow="Perfil"
          title={user?.name ?? "Jogador Arena"}
          subtitle="Dados do usuario, canais de contato e configuracoes principais em cards no mesmo padrao do menu."
        />

        <View className="flex-row flex-wrap gap-5 px-2">
          <RevealOnScroll delay={0}>
            <View
              className="rounded-[24px] border p-6 gap-4"
              style={{
                width: cardWidth,
                minHeight: 236,
                borderColor: "#D3D7DC",
                backgroundColor: "rgba(250,250,250,0.94)",
                shadowColor: "#A3A8AF",
                shadowOpacity: 0.12,
                shadowRadius: 18,
              }}
            >
              <View className="gap-2">
                <Badge label={user?.role ?? "player"} tone="neon" />
                <Text className="text-3xl font-semibold text-[#3F454C]">{user?.whatsappName ?? "WhatsApp Arena"}</Text>
                <Text className="text-base text-[#777D85]">{user?.email ?? "email@arena.com"}</Text>
              </View>
              <Text className="text-base leading-7 text-[#777D85]">
                Perfil central para manter contato, identidade competitiva e dados do jogador dentro do Arena.
              </Text>
              <Text className="text-sm font-semibold uppercase tracking-[2px] text-[#464B52]">Perfil principal</Text>
            </View>
          </RevealOnScroll>

          <RevealOnScroll delay={90}>
            <FeatureCard
              icon="game-controller-outline"
              title={user?.gamertag ?? "ArenaLegend"}
              subtitle="Gamertag"
              description="Nome competitivo usado para identificar o jogador nas partidas, rankings e confrontos do campeonato."
              meta="Identidade de jogo"
              width={cardWidth}
            />
          </RevealOnScroll>
          <RevealOnScroll delay={180}>
            <FeatureCard
              icon="shield-outline"
              title={user?.favoriteTeam ?? "Barcelona"}
              subtitle="Time favorito"
              description="Equipe de preferencia usada como referencia visual e estatistica dentro das areas do torneio."
              meta="Preferencia ativa"
              width={cardWidth}
              accent="blue"
            />
          </RevealOnScroll>
          <RevealOnScroll delay={270}>
            <FeatureCard
              icon="log-out-outline"
              title="Sair da conta"
              subtitle="Encerrar sessao"
              description="Finalize sua sessao atual e retorne para a tela de autenticacao com seguranca."
              meta="Logout"
              onPress={handleSignOut}
              width={cardWidth}
            />
          </RevealOnScroll>
        </View>
      </View>
    </Screen>
  );
}