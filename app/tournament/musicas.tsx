import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BackButton } from "@/components/ui/BackButton";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { setMusicVolume, playTrack } from "@/lib/music-player";
import { MUSIC_TRACKS } from "@/lib/music-tracks";
import { useMusicStore } from "@/stores/music-store";
import { useMusicTrigger } from "@/hooks/useMusicTrigger";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useTournamentStore } from "@/stores/tournament-store";
import { getTournamentBundle } from "@/lib/tournament-display";
import { useVideoStore } from "@/stores/video-store";

const VOLUME_STEPS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

export default function TournamentMusicasScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campeonatos = useTournamentStore((s) => s.campeonatos);
  const videos = useVideoStore((s) => s.videos);
  const hydrated = useTournamentDataHydrated();
  const { contentMaxWidth } = usePanelGrid();

  const enabled = useMusicStore((s) => s.enabled);
  const selectedTrackId = useMusicStore((s) => s.selectedTrackId);
  const volume = useMusicStore((s) => s.volume);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const playMode = useMusicStore((s) => s.playMode);
  const setEnabled = useMusicStore((s) => s.setEnabled);
  const setSelectedTrackId = useMusicStore((s) => s.setSelectedTrackId);
  const setVolume = useMusicStore((s) => s.setVolume);
  const setPlayMode = useMusicStore((s) => s.setPlayMode);

  const { togglePlayPause, stop } = useMusicTrigger();

  const bundle = hydrated && id ? getTournamentBundle(id, campeonatos, videos) : null;

  async function handleSelectTrack(trackId: string) {
    setSelectedTrackId(trackId);
    // Selecting a specific track switches to favorite mode automatically
    setPlayMode("favorite");
    if (enabled) {
      await playTrack(trackId, volume);
      useMusicStore.getState().setIsPlaying(true);
    }
  }

  async function handleVolumeChange(v: number) {
    setVolume(v);
    await setMusicVolume(v);
  }

  async function handleToggleEnabled(val: boolean) {
    setEnabled(val);
    if (!val) {
      await stop();
    }
  }

  if (!bundle) return null;

  const campeonatoId = bundle.campeonato.id;

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View style={{ maxWidth: contentMaxWidth, width: "100%", alignSelf: "center", gap: 24, paddingVertical: 32 }}>

        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: campeonatoId } }} />

        <SectionHeader
          eyebrow="Músicas"
          title={bundle.tournament.name}
          subtitle="Controle a trilha sonora do campeonato."
        />

        <ScrollRow>
          <ChoiceChip label="Painel" onPress={() => router.push({ pathname: "/tournament/[id]", params: { id: campeonatoId } })} />
          <ChoiceChip label="Jogos" onPress={() => router.push({ pathname: "/tournament/matches", params: { id: campeonatoId } })} />
          <ChoiceChip label="Estatisticas" onPress={() => router.push({ pathname: "/tournament/statistics", params: { id: campeonatoId } })} />
          <ChoiceChip label="Músicas" active />
        </ScrollRow>

        {/* Master toggle + play/pause */}
        <RevealOnScroll delay={0}>
          <LiveBorderCard accent="blue" radius={22} padding={1.3} backgroundColor="#060D18">
            <View style={{ padding: 20, gap: 18 }}>

              {/* Enable toggle */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#F3F7FF" }}>Música de fundo</Text>
                  <Text style={{ fontSize: 11, color: "#6B7EA3" }}>Ativar ou desativar em todas as telas</Text>
                </View>
                <Pressable
                  onPress={() => handleToggleEnabled(!enabled)}
                  style={{
                    width: 52, height: 30, borderRadius: 15,
                    backgroundColor: enabled ? "rgba(139,92,246,0.30)" : "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    borderColor: enabled ? "rgba(139,92,246,0.60)" : "rgba(255,255,255,0.14)",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: enabled ? "#8B5CF6" : "#4A5568",
                    alignSelf: enabled ? "flex-end" : "flex-start",
                    shadowColor: enabled ? "#8B5CF6" : "transparent",
                    shadowOpacity: 0.7, shadowRadius: 6,
                  }} />
                </Pressable>
              </View>

              {/* Play / Pause */}
              {enabled && MUSIC_TRACKS.length > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <Pressable
                    onPress={togglePlayPause}
                    style={{
                      width: 48, height: 48, borderRadius: 24,
                      backgroundColor: isPlaying ? "rgba(139,92,246,0.20)" : "rgba(255,255,255,0.07)",
                      borderWidth: 1,
                      borderColor: isPlaying ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.14)",
                      alignItems: "center", justifyContent: "center",
                      shadowColor: isPlaying ? "#8B5CF6" : "transparent",
                      shadowOpacity: 0.55, shadowRadius: 12,
                    }}
                  >
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={22}
                      color={isPlaying ? "#C4B5FD" : "#94A3B8"}
                    />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#F3F7FF" }}>
                      {isPlaying ? "Tocando" : "Pausado"}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#6B7EA3" }}>
                      {MUSIC_TRACKS.find((t) => t.id === selectedTrackId)?.name ?? "Nenhuma música selecionada"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Volume */}
              {enabled && MUSIC_TRACKS.length > 0 && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#6B7EA3" }}>Volume</Text>
                    <Text style={{ fontSize: 11, fontWeight: "900", color: "#C4B5FD" }}>
                      {Math.round(volume * 100)}%
                    </Text>
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
                          backgroundColor: volume >= step ? "#8B5CF6" : "rgba(255,255,255,0.10)",
                        }} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Play mode */}
              {enabled && (
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#6B7EA3" }}>Modo de reprodução</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => setPlayMode("favorite")}
                      style={{
                        flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
                        paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
                        backgroundColor: playMode === "favorite" ? "rgba(139,92,246,0.16)" : "rgba(255,255,255,0.04)",
                        borderWidth: 1,
                        borderColor: playMode === "favorite" ? "rgba(139,92,246,0.50)" : "rgba(255,255,255,0.10)",
                      }}
                    >
                      <Ionicons name="heart" size={15} color={playMode === "favorite" ? "#C4B5FD" : "#4A5568"} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "800", color: playMode === "favorite" ? "#F3F7FF" : "#6B7EA3" }}>
                          Favorita
                        </Text>
                        <Text style={{ fontSize: 10, color: "#4A6080" }}>Sempre a mesma faixa</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => setPlayMode("random")}
                      style={{
                        flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
                        paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
                        backgroundColor: playMode === "random" ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.04)",
                        borderWidth: 1,
                        borderColor: playMode === "random" ? "rgba(234,179,8,0.45)" : "rgba(255,255,255,0.10)",
                      }}
                    >
                      <Ionicons name="shuffle" size={15} color={playMode === "random" ? "#FDE047" : "#4A5568"} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "800", color: playMode === "random" ? "#FEF08A" : "#6B7EA3" }}>
                          Aleatório
                        </Text>
                        <Text style={{ fontSize: 10, color: "#4A6080" }}>Faixa diferente a cada vez</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </LiveBorderCard>
        </RevealOnScroll>

        {/* Track list */}
        <RevealOnScroll delay={80}>
          <LiveBorderCard accent="blue" radius={22} padding={1.3} backgroundColor="#060D18">
            <View style={{ padding: 20, gap: 14 }}>
              <View style={{ gap: 3 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#F3F7FF" }}>Faixas disponíveis</Text>
                <Text style={{ fontSize: 11, color: "#6B7EA3" }}>
                  {MUSIC_TRACKS.length === 0
                    ? "Adicione arquivos .mp3 em assets/music/ e registre em src/lib/music-tracks.ts"
                    : `${MUSIC_TRACKS.length} faixa${MUSIC_TRACKS.length > 1 ? "s" : ""}`}
                </Text>
              </View>

              {MUSIC_TRACKS.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: "center", gap: 8 }}>
                  <Ionicons name="musical-notes-outline" size={36} color="#2D3A52" />
                  <Text style={{ fontSize: 12, color: "#3D4F6B", textAlign: "center" }}>
                    Nenhuma música adicionada ainda.{"\n"}Veja assets/music/COMO_ADICIONAR.md
                  </Text>
                </View>
              ) : (
                MUSIC_TRACKS.map((track) => {
                  const isSelected = selectedTrackId === track.id;
                  return (
                    <Pressable
                      key={track.id}
                      onPress={() => handleSelectTrack(track.id)}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 12,
                        paddingVertical: 12, paddingHorizontal: 14,
                        borderRadius: 14,
                        backgroundColor: isSelected ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
                        borderWidth: 1,
                        borderColor: isSelected ? "rgba(139,92,246,0.40)" : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <View style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: isSelected ? "rgba(139,92,246,0.20)" : "rgba(255,255,255,0.06)",
                        alignItems: "center", justifyContent: "center",
                        borderWidth: 1,
                        borderColor: isSelected ? "rgba(139,92,246,0.50)" : "rgba(255,255,255,0.10)",
                      }}>
                        <Ionicons
                          name={isSelected && isPlaying ? "pause" : "musical-note"}
                          size={16}
                          color={isSelected ? "#C4B5FD" : "#6B7EA3"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: isSelected ? "#F3F7FF" : "#94A3B8" }}>
                          {track.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={{
                          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
                          backgroundColor: "rgba(139,92,246,0.18)",
                          borderWidth: 1, borderColor: "rgba(139,92,246,0.35)",
                        }}>
                          <Text style={{ fontSize: 9, fontWeight: "900", color: "#C4B5FD", letterSpacing: 1 }}>
                            {isPlaying ? "TOCANDO" : "SELECIONADA"}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>
          </LiveBorderCard>
        </RevealOnScroll>

      </View>
    </Screen>
  );
}
