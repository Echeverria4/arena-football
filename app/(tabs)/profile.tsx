import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, Share, Text, View } from "react-native";

import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { setMusicVolume, playTrack } from "@/lib/music-player";
import { MUSIC_TRACKS } from "@/lib/music-tracks";
import { buildTournamentShareLink } from "@/lib/tournament-sharing";
import { resolveTournamentAccessMode } from "@/lib/tournament-access";
import { signOut } from "@/services/auth";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { useMusicStore } from "@/stores/music-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useVideoStore } from "@/stores/video-store";
import { useMusicTrigger } from "@/hooks/useMusicTrigger";

const ROLE_LABELS: Record<string, string> = {
  organizer: "Organizador",
  admin: "Admin",
  player: "Jogador",
};

async function copyOrShare(link: string) {
  if (Platform.OS === "web" && globalThis.navigator?.clipboard?.writeText) {
    await globalThis.navigator.clipboard.writeText(link);
    return "copied" as const;
  }
  await Share.share({ message: link, url: link });
  return "shared" as const;
}

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const videos = useVideoStore((state) => state.videos);
  const [copiedViewer, setCopiedViewer] = useState(false);
  const [copiedEditor, setCopiedEditor] = useState(false);
  const [linkBusy, setLinkBusy] = useState<"viewer" | "editor" | null>(null);

  const musicEnabled = useMusicStore((s) => s.enabled);
  const musicVolume = useMusicStore((s) => s.volume);
  const musicIsPlaying = useMusicStore((s) => s.isPlaying);
  const musicPlayMode = useMusicStore((s) => s.playMode);
  const musicSelectedTrackId = useMusicStore((s) => s.selectedTrackId);
  const setMusicEnabled = useMusicStore((s) => s.setEnabled);
  const setMusicVolumeState = useMusicStore((s) => s.setVolume);
  const setMusicPlayMode = useMusicStore((s) => s.setPlayMode);
  const setMusicSelectedTrackId = useMusicStore((s) => s.setSelectedTrackId);
  const setMusicIsPlaying = useMusicStore((s) => s.setIsPlaying);
  const { togglePlayPause, stop } = useMusicTrigger();
  const [tracksExpanded, setTracksExpanded] = useState(false);

  async function handleSelectTrack(trackId: string) {
    setMusicSelectedTrackId(trackId);
    setMusicPlayMode("favorite");
    if (musicEnabled) {
      await playTrack(trackId, musicVolume);
      setMusicIsPlaying(true);
    }
  }

  async function handleToggleMusic(val: boolean) {
    setMusicEnabled(val);
    if (!val) await stop();
  }

  async function handleVolumeChange(v: number) {
    setMusicVolumeState(v);
    await setMusicVolume(v);
  }

  const VOLUME_STEPS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

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

  async function handleCopyLink(access: "viewer" | "editor") {
    if (!activeCampeonato || linkBusy) return;
    setLinkBusy(access);
    try {
      const tournamentVideos = videos.filter((v) => v.tournamentId === activeCampeonato.id);
      const link = await buildTournamentShareLink({
        access,
        campeonato: activeCampeonato,
        videos: tournamentVideos,
      });
      if (!link) {
        Alert.alert("Link indisponível", "Este campeonato já foi finalizado e não aceita novos links de acesso.");
        return;
      }
      const result = await copyOrShare(link);
      if (result === "copied") {
        if (access === "viewer") {
          setCopiedViewer(true);
          setTimeout(() => setCopiedViewer(false), 2200);
        } else {
          setCopiedEditor(true);
          setTimeout(() => setCopiedEditor(false), 2200);
        }
      }
    } catch {
      Alert.alert("Falha ao gerar link", "Não foi possível criar o link agora. Tente novamente.");
    } finally {
      setLinkBusy(null);
    }
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

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {/* Visualizador — gold */}
                  <Pressable
                    onPress={() => handleCopyLink("viewer")}
                    disabled={linkBusy !== null}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 7,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: copiedViewer ? "rgba(87,255,124,0.40)" : "rgba(255,215,106,0.38)",
                      backgroundColor: copiedViewer ? "rgba(87,255,124,0.10)" : "rgba(255,215,106,0.10)",
                      opacity: pressed || (linkBusy !== null && linkBusy !== "viewer") ? 0.65 : 1,
                    })}
                  >
                    <Ionicons
                      name={copiedViewer ? "checkmark-outline" : "copy-outline"}
                      size={13}
                      color={copiedViewer ? "#C6F8D6" : "#FFD76A"}
                    />
                    <Text
                      style={{
                        color: copiedViewer ? "#C6F8D6" : "#FFD76A",
                        fontSize: 12,
                        fontWeight: "800",
                        letterSpacing: 1.4,
                        textTransform: "uppercase",
                      }}
                    >
                      {copiedViewer ? "Copiado!" : linkBusy === "viewer" ? "Gerando..." : "Visualizador"}
                    </Text>
                  </Pressable>

                  {/* Editor — neon violet */}
                  <Pressable
                    onPress={() => handleCopyLink("editor")}
                    disabled={linkBusy !== null}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 7,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: copiedEditor ? "rgba(87,255,124,0.40)" : "rgba(167,139,250,0.40)",
                      backgroundColor: copiedEditor ? "rgba(87,255,124,0.10)" : "rgba(139,92,246,0.12)",
                      opacity: pressed || (linkBusy !== null && linkBusy !== "editor") ? 0.65 : 1,
                    })}
                  >
                    <Ionicons
                      name={copiedEditor ? "checkmark-outline" : "copy-outline"}
                      size={13}
                      color={copiedEditor ? "#C6F8D6" : "#C4B5FD"}
                    />
                    <Text
                      style={{
                        color: copiedEditor ? "#C6F8D6" : "#C4B5FD",
                        fontSize: 12,
                        fontWeight: "800",
                        letterSpacing: 1.4,
                        textTransform: "uppercase",
                      }}
                    >
                      {copiedEditor ? "Copiado!" : linkBusy === "editor" ? "Gerando..." : "Editor"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </LiveBorderCard>
          </RevealOnScroll>
        ) : null}

        {/* Music controls */}
        <RevealOnScroll delay={160}>
          <LiveBorderCard accent="blue" radius={22} padding={1.4} backgroundColor="#060D18">
            <View style={{ padding: 20, gap: 18 }}>
              <View style={{ gap: 3 }}>
                <Text style={{ color: "#60A5FA", fontSize: 11, fontWeight: "800", letterSpacing: 2.2, textTransform: "uppercase" }}>
                  Música
                </Text>
                <Text style={{ color: "#F3F7FF", fontSize: 18, fontWeight: "900" }}>Trilha sonora</Text>
                <Text style={{ color: "#6B7EA3", fontSize: 13, lineHeight: 20 }}>
                  {musicEnabled ? "Ativa — toca ao entrar no campeonato" : "Desativada — não tocará nas próximas sessões"}
                </Text>
              </View>

              {/* Enable toggle */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#AEBBDA" }}>Música de fundo</Text>
                <Pressable
                  onPress={() => handleToggleMusic(!musicEnabled)}
                  style={{
                    width: 52, height: 30, borderRadius: 15,
                    backgroundColor: musicEnabled ? "rgba(139,92,246,0.30)" : "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    borderColor: musicEnabled ? "rgba(139,92,246,0.60)" : "rgba(255,255,255,0.14)",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: musicEnabled ? "#8B5CF6" : "#4A5568",
                    alignSelf: musicEnabled ? "flex-end" : "flex-start",
                  }} />
                </Pressable>
              </View>

              {/* Play / Pause */}
              {musicEnabled && MUSIC_TRACKS.length > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <Pressable
                    onPress={togglePlayPause}
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      backgroundColor: musicIsPlaying ? "rgba(139,92,246,0.20)" : "rgba(255,255,255,0.07)",
                      borderWidth: 1,
                      borderColor: musicIsPlaying ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.14)",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Ionicons name={musicIsPlaying ? "pause" : "play"} size={20} color={musicIsPlaying ? "#C4B5FD" : "#94A3B8"} />
                  </Pressable>
                  <Text style={{ fontSize: 13, color: "#AEBBDA", fontWeight: "700" }}>
                    {musicIsPlaying ? "Pausar música" : "Retomar música"}
                  </Text>
                </View>
              )}

              {/* Volume */}
              {musicEnabled && MUSIC_TRACKS.length > 0 && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#6B7EA3" }}>Volume</Text>
                    <Text style={{ fontSize: 11, fontWeight: "900", color: "#C4B5FD" }}>{Math.round(musicVolume * 100)}%</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    {VOLUME_STEPS.map((step) => (
                      <Pressable
                        key={step}
                        onPress={() => handleVolumeChange(step)}
                        style={{ flex: 1, height: 24, justifyContent: "flex-end", alignItems: "center" }}
                      >
                        <View style={{
                          width: "100%",
                          height: `${step * 100}%`,
                          borderRadius: 3,
                          backgroundColor: musicVolume >= step ? "#8B5CF6" : "rgba(255,255,255,0.10)",
                        }} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Play mode */}
              {musicEnabled && (
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#6B7EA3" }}>Modo de reprodução</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => setMusicPlayMode("favorite")}
                      style={{
                        flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
                        paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14,
                        backgroundColor: musicPlayMode === "favorite" ? "rgba(139,92,246,0.16)" : "rgba(255,255,255,0.04)",
                        borderWidth: 1,
                        borderColor: musicPlayMode === "favorite" ? "rgba(139,92,246,0.50)" : "rgba(255,255,255,0.10)",
                      }}
                    >
                      <Ionicons name="heart" size={14} color={musicPlayMode === "favorite" ? "#C4B5FD" : "#4A5568"} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "800", color: musicPlayMode === "favorite" ? "#F3F7FF" : "#6B7EA3" }}>
                          Favorita
                        </Text>
                        <Text style={{ fontSize: 10, color: "#4A6080" }}>Sempre a mesma faixa</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => setMusicPlayMode("random")}
                      style={{
                        flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
                        paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14,
                        backgroundColor: musicPlayMode === "random" ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.04)",
                        borderWidth: 1,
                        borderColor: musicPlayMode === "random" ? "rgba(234,179,8,0.45)" : "rgba(255,255,255,0.10)",
                      }}
                    >
                      <Ionicons name="shuffle" size={14} color={musicPlayMode === "random" ? "#FDE047" : "#4A5568"} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "800", color: musicPlayMode === "random" ? "#FEF08A" : "#6B7EA3" }}>
                          Aleatório
                        </Text>
                        <Text style={{ fontSize: 10, color: "#4A6080" }}>Faixa diferente a cada vez</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Track list — collapsible */}
              {musicEnabled && MUSIC_TRACKS.length > 0 && (
                <View style={{ gap: 10 }}>
                  <View style={{ height: 1, backgroundColor: "rgba(59,91,255,0.12)" }} />
                  <Pressable
                    onPress={() => setTracksExpanded((v) => !v)}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <View style={{ gap: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: "#AEBBDA" }}>
                        Faixas disponíveis
                      </Text>
                      <Text style={{ fontSize: 10, color: "#4A6080" }}>
                        {MUSIC_TRACKS.length} faixa{MUSIC_TRACKS.length > 1 ? "s" : ""}
                        {musicSelectedTrackId ? ` · ${MUSIC_TRACKS.find((t) => t.id === musicSelectedTrackId)?.name ?? ""}` : ""}
                      </Text>
                    </View>
                    <Ionicons
                      name={tracksExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#6B7EA3"
                    />
                  </Pressable>

                  {tracksExpanded && (
                    <View style={{ gap: 6 }}>
                      {MUSIC_TRACKS.map((track) => {
                        const isSelected = musicSelectedTrackId === track.id;
                        return (
                          <Pressable
                            key={track.id}
                            onPress={() => handleSelectTrack(track.id)}
                            style={{
                              flexDirection: "row", alignItems: "center", gap: 10,
                              paddingVertical: 10, paddingHorizontal: 12,
                              borderRadius: 12,
                              backgroundColor: isSelected ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
                              borderWidth: 1,
                              borderColor: isSelected ? "rgba(139,92,246,0.40)" : "rgba(255,255,255,0.07)",
                            }}
                          >
                            <View style={{
                              width: 30, height: 30, borderRadius: 15,
                              backgroundColor: isSelected ? "rgba(139,92,246,0.20)" : "rgba(255,255,255,0.06)",
                              alignItems: "center", justifyContent: "center",
                              borderWidth: 1,
                              borderColor: isSelected ? "rgba(139,92,246,0.50)" : "rgba(255,255,255,0.10)",
                            }}>
                              <Ionicons
                                name={isSelected && musicIsPlaying ? "pause" : "musical-note"}
                                size={13}
                                color={isSelected ? "#C4B5FD" : "#6B7EA3"}
                              />
                            </View>
                            <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, fontWeight: "800", color: isSelected ? "#F3F7FF" : "#94A3B8" }}>
                              {track.name}
                            </Text>
                            {isSelected && (
                              <View style={{
                                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
                                backgroundColor: "rgba(139,92,246,0.18)",
                                borderWidth: 1, borderColor: "rgba(139,92,246,0.35)",
                              }}>
                                <Text style={{ fontSize: 8, fontWeight: "900", color: "#C4B5FD", letterSpacing: 1 }}>
                                  {musicIsPlaying ? "TOCANDO" : "SELECIONADA"}
                                </Text>
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>
          </LiveBorderCard>
        </RevealOnScroll>

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
