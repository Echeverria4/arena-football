import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Text, View } from "react-native";

import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { resolveTournamentAccessMode } from "@/lib/tournament-access";
import { signOut } from "@/services/auth";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTournamentStore } from "@/stores/tournament-store";

const ROLE_LABELS: Record<string, string> = {
  organizer: "Organizador",
  admin: "Admin",
  player: "Jogador",
};

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const campeonatos = useTournamentStore((state) => state.campeonatos);

  const activeCampeonato = campeonatos.find((c) => c.id === currentTournamentId) ?? null;
  const accessMode = resolveTournamentAccessMode(tournamentAccess, currentTournamentId);
  const isOwner = accessMode === "owner";

  async function handleSignOut() {
    try {
      await signOut();
      clearSession();
      router.replace("/login");
    } catch (error) {
      Alert.alert("Saída não concluída", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  function handleManageShare() {
    if (!currentTournamentId) return;
    router.push({ pathname: "/tournament/access", params: { id: currentTournamentId } });
  }

  return (
    <Screen scroll className="px-6">
      <View className="w-full self-center gap-6 py-8" style={{ maxWidth: 680 }}>
        <SectionHeader
          eyebrow="Perfil"
          title={user?.name ?? "Jogador Arena"}
          subtitle="Dados da conta, identidade competitiva e gerenciamento de acesso ao campeonato ativo."
        />

        {/* Account card */}
        <RevealOnScroll delay={0}>
          <LiveBorderCard
            accent="blue"
            radius={22}
            padding={1.4}
            backgroundColor="#060D18"
            contentStyle={{ paddingHorizontal: 22, paddingVertical: 22 }}
          >
            <View style={{ gap: 16 }}>
              {/* Role badge */}
              <View
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: "rgba(139,92,246,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(139,92,246,0.35)",
                }}
              >
                <Text
                  style={{
                    color: "#C4B5FD",
                    fontSize: 11,
                    fontWeight: "800",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {ROLE_LABELS[user?.role ?? "player"] ?? "Jogador"}
                </Text>
              </View>

              {/* Name */}
              <View style={{ gap: 4 }}>
                <Text style={{ color: "#F3F7FF", fontSize: 26, fontWeight: "900", lineHeight: 32 }}>
                  {user?.name ?? "Arena Player"}
                </Text>
                {user?.gamertag ? (
                  <Text style={{ color: "#7C9BDA", fontSize: 14, fontWeight: "700" }}>
                    @{user.gamertag}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: "rgba(59,91,255,0.18)",
                }}
              />

              {/* Contact info */}
              <View style={{ gap: 10 }}>
                {user?.whatsappName || user?.whatsappNumber ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name="logo-whatsapp" size={15} color="#4ADE80" />
                    <Text style={{ color: "#AEBBDA", fontSize: 14, fontWeight: "600" }}>
                      {user.whatsappName ?? user.whatsappNumber}
                    </Text>
                  </View>
                ) : null}
                {user?.email ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name="mail-outline" size={15} color="#60A5FA" />
                    <Text style={{ color: "#AEBBDA", fontSize: 14, fontWeight: "600" }}>
                      {user.email}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </LiveBorderCard>
        </RevealOnScroll>

        {/* Share links card — only for tournament owners with an active tournament */}
        {isOwner && activeCampeonato ? (
          <RevealOnScroll delay={90}>
            <LiveBorderCard
              accent="blue"
              radius={22}
              padding={1.4}
              backgroundColor="#060D18"
              contentStyle={{ paddingHorizontal: 22, paddingVertical: 22 }}
            >
              <View style={{ gap: 16 }}>
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      color: "#60A5FA",
                      fontSize: 11,
                      fontWeight: "800",
                      letterSpacing: 2.2,
                      textTransform: "uppercase",
                    }}
                  >
                    Compartilhamento
                  </Text>
                  <Text style={{ color: "#F3F7FF", fontSize: 20, fontWeight: "900" }}>
                    {activeCampeonato.nome}
                  </Text>
                  {activeCampeonato.temporada ? (
                    <Text style={{ color: "#5B7FC4", fontSize: 13, fontWeight: "700" }}>
                      {activeCampeonato.temporada}
                    </Text>
                  ) : null}
                </View>

                <Text style={{ color: "#7B9EC8", fontSize: 14, lineHeight: 22 }}>
                  Gere links de acesso para convidados entrarem como Visualizador ou Editor neste campeonato.
                </Text>

                <PrimaryButton
                  label="Gerenciar links"
                  onPress={handleManageShare}
                  size="sm"
                  className="self-start"
                />
              </View>
            </LiveBorderCard>
          </RevealOnScroll>
        ) : null}

        {/* Sign out */}
        <RevealOnScroll delay={180}>
          <PrimaryButton
            label="Sair da conta"
            variant="secondary"
            onPress={handleSignOut}
          />
        </RevealOnScroll>
      </View>
    </Screen>
  );
}
