import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  isTournamentAccessLocked,
  resolveTournamentAccessMode,
  useTournamentAccessMode,
} from "@/lib/tournament-access";
import { getTournamentBundle } from "@/lib/tournament-display";
import {
  formatImportedVideoSize,
  pickLocalVideoAsset,
  resolvePlayableVideoUrl,
  type ImportedVideoAsset,
} from "@/lib/local-video-assets";
import { normalizeVideoVoterPhone } from "@/lib/video-panel";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";
import type { VideoHighlight } from "@/types/video";

// ─── Video player helpers ─────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1]! : null;
}

function VideoNativePlayer({ uri, width, height }: { uri: string; width: number; height: number }) {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    // @ts-ignore — web only: View renders as <div>, we inject a <video> element directly
    const container = containerRef.current as unknown as HTMLElement | null;
    if (!container) return;
    const video = document.createElement("video");
    video.src = uri;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.cssText = "width:100%;height:100%;object-fit:contain;background:#000;display:block;border-radius:12px;";
    container.appendChild(video);
    video.play().catch(() => {});
    return () => {
      video.pause();
      container.removeChild(video);
    };
  }, [uri]);

  if (Platform.OS !== "web") {
    return (
      <Video
        source={{ uri }}
        style={{ width, height, borderRadius: 12 }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        useNativeControls
      />
    );
  }

  return (
    <View
      ref={containerRef}
      style={{ width, height, borderRadius: 12, overflow: "hidden", backgroundColor: "#000" }}
    />
  );
}

function VideoPlayerModal({ video, onClose }: { video: VideoHighlight; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const playerW = Math.min(width - 32, 720);
  const playerH = Math.round(playerW * 9 / 16);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);

  const ytId = getYouTubeId(video.videoUrl);

  useEffect(() => {
    if (ytId) { setResolving(false); return; }
    resolvePlayableVideoUrl(video.videoUrl).then((url) => {
      setResolvedUrl(url);
      setResolving(false);
    });
  }, [video.videoUrl, ytId]);

  const header = (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 14, flex: 1 }} numberOfLines={2}>{video.title}</Text>
      <Pressable onPress={onClose} style={{ padding: 6 }}>
        <Ionicons name="close" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  // YouTube embed
  if (ytId) {
    if (Platform.OS === "web") {
      const embedSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1`;
      return (
        <Modal transparent animationType="fade" onRequestClose={onClose}>
          <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.90)", alignItems: "center", justifyContent: "center" }}>
            <Pressable onPress={(e) => e.stopPropagation()} style={{ width: playerW }}>
              {header}
              <View
                style={{ width: playerW, height: playerH, borderRadius: 12, overflow: "hidden", backgroundColor: "#000" }}
                // @ts-ignore web-only
                dangerouslySetInnerHTML={{ __html: `<iframe src="${embedSrc}" width="${playerW}" height="${playerH}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen style="display:block;border:0"></iframe>` }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      );
    }
    Linking.openURL(`https://www.youtube.com/watch?v=${ytId}`);
    onClose();
    return null;
  }

  // Local / direct URL — wait for resolution from IndexedDB
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: playerW }}>
          {header}
          {resolving ? (
            <View style={{ width: playerW, height: playerH, borderRadius: 12, backgroundColor: "#111", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Carregando vídeo…</Text>
            </View>
          ) : !resolvedUrl ? (
            <View style={{ width: playerW, height: playerH, borderRadius: 12, backgroundColor: "#111", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Ionicons name="alert-circle-outline" size={32} color="#F87171" />
              <Text style={{ color: "#F87171", fontSize: 13, textAlign: "center" }}>Não foi possível carregar o vídeo.{"\n"}Tente adicionar novamente.</Text>
            </View>
          ) : (
            <VideoNativePlayer uri={resolvedUrl} width={playerW} height={playerH} />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ActiveTab = "feed" | "ranking" | "votantes";
type AddVideoMode = "file" | "url";

interface AddVideoForm {
  title: string;
  teamName: string;
  teamName2: string;
  videoUrl: string;
  videoAsset: ImportedVideoAsset | null;
  mode: AddVideoMode;
}

interface VoteForm {
  voterName: string;
  phone: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maskPhone(normalized: string) {
  if (normalized.length >= 10) {
    return `(${normalized.slice(0, 2)}) ****-${normalized.slice(-4)}`;
  }
  return `****${normalized.slice(-4)}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: active ? "#57FF7C22" : "transparent",
        borderWidth: 1,
        borderColor: active ? "#57FF7C66" : "rgba(255,255,255,0.10)",
      }}
    >
      <Text
        style={{
          color: active ? "#57FF7C" : "#AEBBDA",
          fontWeight: "700",
          fontSize: 13,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function VideoFeedCard({
  video,
  rank,
  alreadyVoted,
  votedThisVideo,
  onVote,
  onPlay,
  onRemove,
}: {
  video: VideoHighlight;
  rank: number;
  alreadyVoted: boolean;
  votedThisVideo: boolean;
  onVote: () => void;
  onPlay: () => void;
  onRemove?: () => void;
}) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;

  const medalColors: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
  const medalColor = medalColors[rank] ?? "#AEBBDA";

  return (
    <View
      style={{
        backgroundColor: "#0E171E",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: votedThisVideo
          ? "rgba(87,255,124,0.35)"
          : "rgba(255,255,255,0.07)",
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      {/* Hero area */}
      <Pressable
        onPress={onPlay}
        style={{
          width: "100%",
          height: isPhone ? 220 : 280,
          backgroundColor: "#080B12",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* rank badge */}
        <View
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor: "rgba(0,0,0,0.65)",
            borderWidth: 1,
            borderColor: medalColor + "55",
          }}
        >
          <Text style={{ color: medalColor, fontWeight: "800", fontSize: 13 }}>
            {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
          </Text>
        </View>

        {/* winner badge */}
        {video.isGoalAwardWinner ? (
          <View
            style={{
              position: "absolute",
              top: 14,
              right: onRemove ? 52 : 14,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: "rgba(233,179,52,0.20)",
              borderWidth: 1,
              borderColor: "rgba(233,179,52,0.40)",
            }}
          >
            <Text style={{ color: "#FFE6A3", fontWeight: "800", fontSize: 11, letterSpacing: 1 }}>
              GOL MAIS BONITO
            </Text>
          </View>
        ) : null}

        {/* remove button — owner/editor only */}
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.65)",
              borderWidth: 1,
              borderColor: "rgba(255,107,122,0.45)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#FF6B7A" />
          </Pressable>
        ) : null}

        {/* play icon */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.10)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.20)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="play" size={32} color="#FFFFFF" />
        </View>

        {/* title overlay */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        >
          <Text
            style={{ color: "#FFFFFF", fontWeight: "900", fontSize: isPhone ? 18 : 22 }}
            numberOfLines={2}
          >
            {video.title}
          </Text>
          {video.teamName ? (
            <Text style={{ color: "#FFD77A", fontWeight: "700", fontSize: 13, marginTop: 2 }}>
              {video.teamName2 ? `${video.teamName}  ×  ${video.teamName2}` : video.teamName}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {/* Footer */}
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: "rgba(87,255,124,0.10)",
              borderWidth: 1,
              borderColor: "rgba(87,255,124,0.20)",
            }}
          >
            <Ionicons name="heart" size={13} color="#57FF7C" />
            <Text style={{ color: "#57FF7C", fontWeight: "700", fontSize: 13 }}>
              {video.votesCount} {video.votesCount === 1 ? "voto" : "votos"}
            </Text>
          </View>

          {video.viewsCount ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Ionicons name="eye" size={13} color="#AEBBDA" />
              <Text style={{ color: "#AEBBDA", fontWeight: "600", fontSize: 13 }}>
                {video.viewsCount}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={onPlay}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: "#132028",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              flexDirection: "row",
              gap: 6,
            }}
          >
            <Ionicons name="play-circle-outline" size={18} color="#AEBBDA" />
            <Text style={{ color: "#AEBBDA", fontWeight: "700", fontSize: 13, letterSpacing: 0.8 }}>
              ASSISTIR
            </Text>
          </Pressable>

          <Pressable
            onPress={alreadyVoted ? undefined : onVote}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: votedThisVideo
                ? "rgba(87,255,124,0.14)"
                : alreadyVoted
                  ? "rgba(255,255,255,0.04)"
                  : "#112018",
              borderWidth: 1,
              borderColor: votedThisVideo
                ? "rgba(87,255,124,0.45)"
                : alreadyVoted
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(87,255,124,0.40)",
              flexDirection: "row",
              gap: 6,
              opacity: alreadyVoted && !votedThisVideo ? 0.5 : 1,
            }}
          >
            <Ionicons
              name={votedThisVideo ? "heart" : "heart-outline"}
              size={18}
              color={votedThisVideo ? "#57FF7C" : alreadyVoted ? "#AEBBDA" : "#57FF7C"}
            />
            <Text
              style={{
                color: votedThisVideo ? "#57FF7C" : alreadyVoted ? "#AEBBDA" : "#57FF7C",
                fontWeight: "700",
                fontSize: 13,
                letterSpacing: 0.8,
              }}
            >
              {votedThisVideo ? "SEU VOTO" : alreadyVoted ? "VOTADO" : "VOTAR"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Modal: Adicionar Vídeo ───────────────────────────────────────────────────

function AddVideoModal({
  visible,
  teams,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  teams: string[];
  onClose: () => void;
  onSubmit: (form: AddVideoForm) => void;
}) {
  const emptyForm: AddVideoForm = { title: "", teamName: "", teamName2: "", videoUrl: "", videoAsset: null, mode: "file" };
  const [form, setForm] = useState<AddVideoForm>(emptyForm);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");

  async function handlePickFile() {
    try {
      setPicking(true);
      setError("");
      const asset = await pickLocalVideoAsset();
      if (asset) {
        setForm((f) => ({ ...f, videoAsset: asset }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível selecionar o vídeo.";
      Alert.alert("Erro ao importar", msg);
    } finally {
      setPicking(false);
    }
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      setError("Informe o título do vídeo.");
      return;
    }
    if (teams.length > 0 && (!form.teamName || !form.teamName2)) {
      setError("Selecione os dois jogadores do lance.");
      return;
    }
    if (form.mode === "file" && !form.videoAsset) {
      setError("Selecione um vídeo do celular/computador.");
      return;
    }
    if (form.mode === "url" && !form.videoUrl.trim()) {
      setError("Informe a URL do vídeo (YouTube ou link direto).");
      return;
    }
    setError("");
    onSubmit(form);
    setForm(emptyForm);
  }

  function handleClose() {
    setForm(emptyForm);
    setError("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.80)" }}
        contentContainerStyle={{ justifyContent: "flex-end", flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: "#0E171E",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            padding: 28,
            gap: 20,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#F3F7FF", fontWeight: "900", fontSize: 20, letterSpacing: 0.3 }}>
              Adicionar Vídeo
            </Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color="#AEBBDA" />
            </Pressable>
          </View>

          {/* Mode toggle */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#132028",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              padding: 4,
              gap: 4,
            }}
          >
            {(["file", "url"] as AddVideoMode[]).map((mode) => {
              const active = form.mode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setForm((f) => ({ ...f, mode, videoAsset: null, videoUrl: "" }))}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: active ? "#0E171E" : "transparent",
                    borderWidth: active ? 1 : 0,
                    borderColor: active ? "rgba(87,255,124,0.30)" : "transparent",
                  }}
                >
                  <Ionicons
                    name={mode === "file" ? "phone-portrait-outline" : "link-outline"}
                    size={16}
                    color={active ? "#57FF7C" : "#AEBBDA"}
                  />
                  <Text
                    style={{
                      color: active ? "#57FF7C" : "#AEBBDA",
                      fontWeight: "700",
                      fontSize: 13,
                      letterSpacing: 0.5,
                    }}
                  >
                    {mode === "file" ? "Do celular" : "Link (URL)"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Fields */}
          <View style={{ gap: 12 }}>
            {/* Title */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: "#AEBBDA", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
                Título *
              </Text>
              <TextInput
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Ex: Golaço do Gabriel"
                placeholderTextColor="#4A5568"
                style={{
                  backgroundColor: "#132028",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  color: "#F3F7FF",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                }}
              />
            </View>

            {/* Player 1 chips */}
            {[
              { label: "Jogador 1 *", field: "teamName" as const, otherField: "teamName2" as const },
              { label: "Jogador 2 *", field: "teamName2" as const, otherField: "teamName" as const },
            ].map(({ label, field, otherField }) => (
              <View key={field} style={{ gap: 8 }}>
                <Text style={{ color: "#AEBBDA", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
                  {label}
                </Text>

                {teams.length > 0 ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {teams
                      .filter((team) => team !== form[otherField])
                      .map((team) => {
                      const selected = form[field] === team;
                      return (
                        <Pressable
                          key={team}
                          onPress={() => setForm((f) => ({ ...f, [field]: team }))}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 9,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: selected ? "rgba(87,255,124,0.50)" : "rgba(255,255,255,0.12)",
                            backgroundColor: selected ? "rgba(87,255,124,0.12)" : "#132028",
                          }}
                        >
                          <Text style={{ color: selected ? "#57FF7C" : "#AEBBDA", fontWeight: "700", fontSize: 13 }}>
                            {team}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <TextInput
                    value={form[field]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
                    placeholder="Ex: Real Madrid"
                    placeholderTextColor="#4A5568"
                    style={{
                      backgroundColor: "#132028",
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.10)",
                      color: "#F3F7FF",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 15,
                    }}
                  />
                )}
              </View>
            ))}

            {/* File mode */}
            {form.mode === "file" ? (
              <View style={{ gap: 10 }}>
                <Pressable
                  onPress={handlePickFile}
                  disabled={picking}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    paddingVertical: 18,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderStyle: "dashed" as never,
                    borderColor: form.videoAsset
                      ? "rgba(87,255,124,0.40)"
                      : "rgba(255,255,255,0.15)",
                    backgroundColor: form.videoAsset
                      ? "rgba(87,255,124,0.06)"
                      : "rgba(255,255,255,0.03)",
                    opacity: picking ? 0.6 : 1,
                  }}
                >
                  <Ionicons
                    name={form.videoAsset ? "checkmark-circle" : picking ? "hourglass-outline" : "cloud-upload-outline"}
                    size={26}
                    color={form.videoAsset ? "#57FF7C" : "#AEBBDA"}
                  />
                  <View>
                    <Text
                      style={{
                        color: form.videoAsset ? "#57FF7C" : "#F3F7FF",
                        fontWeight: "800",
                        fontSize: 15,
                      }}
                    >
                      {picking
                        ? "Abrindo galeria..."
                        : form.videoAsset
                          ? "Vídeo selecionado"
                          : "Selecionar vídeo"}
                    </Text>
                    <Text style={{ color: "#AEBBDA", fontSize: 12, marginTop: 2 }}>
                      {form.videoAsset
                        ? `${form.videoAsset.fileName} • ${formatImportedVideoSize(form.videoAsset.fileSizeBytes)}`
                        : "Galeria, câmera ou arquivos do celular"}
                    </Text>
                  </View>
                </Pressable>

                {form.videoAsset ? (
                  <Pressable
                    onPress={() => setForm((f) => ({ ...f, videoAsset: null }))}
                    style={{ alignItems: "center", paddingVertical: 6 }}
                  >
                    <Text style={{ color: "#FF6B7A", fontSize: 13, fontWeight: "600" }}>
                      Remover vídeo selecionado
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              /* URL mode */
              <View style={{ gap: 6 }}>
                <Text style={{ color: "#AEBBDA", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
                  URL do Vídeo *
                </Text>
                <TextInput
                  value={form.videoUrl}
                  onChangeText={(v) => setForm((f) => ({ ...f, videoUrl: v }))}
                  placeholder="https://youtube.com/... ou link direto"
                  placeholderTextColor="#4A5568"
                  autoCapitalize="none"
                  keyboardType="url"
                  style={{
                    backgroundColor: "#132028",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.10)",
                    color: "#F3F7FF",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                  }}
                />
              </View>
            )}
          </View>

          {error ? (
            <View
              style={{
                backgroundColor: "rgba(255,107,122,0.10)",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255,107,122,0.25)",
                padding: 12,
              }}
            >
              <Text style={{ color: "#FF6B7A", fontSize: 13, fontWeight: "600" }}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton label="Publicar Vídeo" onPress={handleSubmit} icon="cloud-upload-outline" />
        </View>
      </ScrollView>
    </Modal>
  );
}

// ─── Modal: Votar ─────────────────────────────────────────────────────────────

function VoteModal({
  visible,
  video,
  participantPhones,
  alreadyVotedPhones,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  video: VideoHighlight | null;
  participantPhones: string[];
  alreadyVotedPhones: string[];
  onClose: () => void;
  onSubmit: (voterName: string, phone: string) => void;
}) {
  const [form, setForm] = useState<VoteForm>({ voterName: "", phone: "" });
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.voterName.trim()) {
      setError("Informe seu nome.");
      return;
    }

    const normalized = normalizeVideoVoterPhone(form.phone);

    if (!normalized || normalized.length < 10) {
      setError("Informe um número de celular válido.");
      return;
    }

    if (!participantPhones.includes(normalized)) {
      setError("Este número não está cadastrado como participante ativo do campeonato.");
      return;
    }

    if (alreadyVotedPhones.includes(normalized)) {
      setError("Este número já votou neste campeonato.");
      return;
    }

    setError("");
    onSubmit(form.voterName.trim(), normalized);
    setForm({ voterName: "", phone: "" });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.80)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: "#0E171E",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: "rgba(87,255,124,0.20)",
            padding: 28,
            gap: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#F3F7FF", fontWeight: "900", fontSize: 20 }}>
              Votar no Vídeo
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#AEBBDA" />
            </Pressable>
          </View>

          {video ? (
            <View
              style={{
                backgroundColor: "#132028",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(87,255,124,0.20)",
                padding: 14,
                gap: 4,
              }}
            >
              <Text style={{ color: "#57FF7C", fontWeight: "700", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                Votando em:
              </Text>
              <Text style={{ color: "#F3F7FF", fontWeight: "800", fontSize: 15 }}>
                {video.title}
              </Text>
              {video.teamName ? (
                <Text style={{ color: "#FFD77A", fontWeight: "600", fontSize: 13 }}>
                  {video.teamName2 ? `${video.teamName}  ×  ${video.teamName2}` : video.teamName}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={{ color: "#AEBBDA", fontSize: 13, lineHeight: 20 }}>
            Apenas participantes cadastrados no campeonato podem votar. Informe seu nome e celular (o mesmo cadastrado no campeonato).
          </Text>

          <View style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ color: "#AEBBDA", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
                Seu Nome *
              </Text>
              <TextInput
                value={form.voterName}
                onChangeText={(v) => setForm((f) => ({ ...f, voterName: v }))}
                placeholder="Ex: João Silva"
                placeholderTextColor="#4A5568"
                style={{
                  backgroundColor: "#132028",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  color: "#F3F7FF",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                }}
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: "#AEBBDA", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
                Celular (WhatsApp) *
              </Text>
              <TextInput
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="(11) 99999-0000"
                placeholderTextColor="#4A5568"
                keyboardType="phone-pad"
                style={{
                  backgroundColor: "#132028",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  color: "#F3F7FF",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                }}
              />
            </View>
          </View>

          {error ? (
            <View
              style={{
                backgroundColor: "rgba(255,107,122,0.10)",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255,107,122,0.25)",
                padding: 12,
              }}
            >
              <Text style={{ color: "#FF6B7A", fontSize: 13, fontWeight: "600" }}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton label="Confirmar Voto" onPress={handleSubmit} icon="heart-outline" />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TournamentVideosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;

  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const videosStore = useVideoStore((state) => state.videos);
  const addVideo = useVideoStore((state) => state.addVideo);
  const removeVideo = useVideoStore((state) => state.removeVideo);
  const voteTournamentVideoByPhone = useVideoStore((state) => state.voteTournamentVideoByPhone);
  const tournamentVotesByPhone = useVideoStore((state) => state.tournamentVotesByPhone);
  const tournamentVoterNames = useVideoStore((state) => state.tournamentVoterNames);

  const user = useAuthStore((state) => state.user);
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const hydrated = useTournamentDataHydrated();
  const accessMode = useTournamentAccessMode(id);
  const bundle = id ? getTournamentBundle(id, campeonatos, videosStore) : null;
  const activeTournamentAccessMode = resolveTournamentAccessMode(tournamentAccess, currentTournamentId);
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);

  const [activeTab, setActiveTab] = useState<ActiveTab>("feed");
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [voteTargetVideo, setVoteTargetVideo] = useState<VideoHighlight | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoHighlight | null>(null);

  useEffect(() => {
    if (
      !lockToActiveTournament ||
      !currentTournamentId ||
      bundle?.campeonato.id === currentTournamentId
    ) {
      return;
    }
    router.replace({ pathname: "/tournament/videos", params: { id: currentTournamentId } });
  }, [bundle?.campeonato.id, currentTournamentId, lockToActiveTournament]);

  const orderedVideos = useMemo(() => {
    if (!bundle) return [];
    return [...bundle.videos].sort((a, b) => b.votesCount - a.votesCount);
  }, [bundle]);

  // Teams of active tournament participants (for the Add Video modal)
  const participantTeams = useMemo(() => {
    if (!bundle) return [];
    return bundle.campeonato.participantes.map((p) => p.nome);
  }, [bundle]);

  // Phones of active tournament participants
  const participantPhones = useMemo(() => {
    if (!bundle) return [];
    return bundle.campeonato.participantes
      .map((p) => normalizeVideoVoterPhone(p.whatsapp ?? ""))
      .filter(Boolean);
  }, [bundle]);

  // Votes registered for this tournament
  const votesByPhone = useMemo(
    () => tournamentVotesByPhone[id ?? ""] ?? {},
    [tournamentVotesByPhone, id],
  );
  const voterNames = useMemo(
    () => tournamentVoterNames[id ?? ""] ?? {},
    [tournamentVoterNames, id],
  );

  const alreadyVotedPhones = useMemo(() => Object.keys(votesByPhone), [votesByPhone]);

  // Voters table rows
  const voterRows = useMemo(() => {
    return Object.entries(votesByPhone).map(([phone, videoId]) => {
      const video = orderedVideos.find((v) => v.id === videoId);
      return {
        phone,
        name: voterNames[phone] ?? "Participante",
        videoTitle: video?.title ?? "Vídeo removido",
        videoId,
      };
    });
  }, [votesByPhone, voterNames, orderedVideos]);

  if (!hydrated) {
    return (
      <Screen scroll className="px-6" backgroundVariant="soft">
        <ScreenState title="Carregando vídeos" description="Sincronizando biblioteca da temporada." />
      </Screen>
    );
  }

  if (!bundle) {
    return (
      <Screen scroll className="px-6" backgroundVariant="soft">
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato não encontrado"
            description="Não existe uma temporada válida para abrir os vídeos."
          />
        </View>
      </Screen>
    );
  }

  function handleAddVideo(form: AddVideoForm) {
    if (!bundle) return;

    const videoUrl =
      form.mode === "file" && form.videoAsset
        ? form.videoAsset.videoUrl
        : form.videoUrl.trim();

    addVideo({
      createdByName: user?.email ?? "Organizador",
      tournamentId: bundle.campeonato.id,
      tournamentName: bundle.campeonato.nome,
      title: form.title,
      teamName: form.teamName,
      teamName2: form.teamName2 || null,
      videoUrl,
      userId: user?.id ?? "arena-organizer",
      fileName: form.videoAsset?.fileName ?? null,
      fileSizeBytes: form.videoAsset?.fileSizeBytes ?? null,
      mimeType: form.videoAsset?.mimeType ?? null,
      storageKey: form.videoAsset?.storageKey ?? null,
    });
    setShowAddVideo(false);
  }

  function handleVoteSubmit(voterName: string, phone: string) {
    if (!voteTargetVideo || !bundle) return;
    voteTournamentVideoByPhone(bundle.campeonato.id, phone, voterName, voteTargetVideo.id);
    setVoteTargetVideo(null);
  }

  return (
    <Screen scroll className="px-0" backgroundVariant="soft">
      <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 8, gap: 20 }}>
        <BackButton
          fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }}
        />

        <SectionHeader
          eyebrow="Vídeos do campeonato"
          title={`Lances de ${bundle.campeonato.nome}`}
        />

        {/* Tab pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
          <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 4, paddingBottom: 4 }}>
            <TabPill label="Vídeos" active={activeTab === "feed"} onPress={() => setActiveTab("feed")} />
            <TabPill label={`Ranking (${orderedVideos.length})`} active={activeTab === "ranking"} onPress={() => setActiveTab("ranking")} />
            {(accessMode === "owner" || accessMode === "editor") && (
              <TabPill label={`Votantes (${voterRows.length})`} active={activeTab === "votantes"} onPress={() => setActiveTab("votantes")} />
            )}
          </View>
        </ScrollView>

        {/* Add video button — owner/editor only */}
        {(accessMode === "owner" || accessMode === "editor") ? (
          <PrimaryButton
            label="Adicionar Vídeo"
            icon="add-circle-outline"
            onPress={() => setShowAddVideo(true)}
          />
        ) : null}
      </View>

      {/* ── Feed Tab ── */}
      {activeTab === "feed" ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }}>
          {orderedVideos.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                gap: 12,
                paddingVertical: 60,
                borderRadius: 24,
                backgroundColor: "rgba(255,255,255,0.03)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <Ionicons name="videocam-outline" size={48} color="#AEBBDA" />
              <Text style={{ color: "#AEBBDA", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
                Nenhum vídeo publicado ainda
              </Text>
              <Text style={{ color: "#AEBBDA", fontSize: 14, opacity: 0.7, textAlign: "center", maxWidth: 260 }}>
                Toque em "Adicionar Vídeo" para publicar o primeiro lance.
              </Text>
            </View>
          ) : (
            orderedVideos.map((video, index) => (
              <VideoFeedCard
                key={video.id}
                video={video}
                rank={index + 1}
                alreadyVoted={false}
                votedThisVideo={false}
                onPlay={() => setPlayingVideo(video)}
                onVote={() => setVoteTargetVideo(video)}
                onRemove={
                  accessMode === "owner" || accessMode === "editor"
                    ? () => {
                        if (Platform.OS === "web") {
                          const confirmed =
                            globalThis.confirm?.(
                              `Remover "${video.title}"? Esta ação não pode ser desfeita.`,
                            ) ?? false;
                          if (confirmed) removeVideo(video.id);
                          return;
                        }
                        Alert.alert(
                          "Remover vídeo",
                          `Tem certeza que deseja remover "${video.title}"? Esta ação não pode ser desfeita.`,
                          [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Remover", style: "destructive", onPress: () => removeVideo(video.id) },
                          ],
                        );
                      }
                    : undefined
                }
              />
            ))
          )}
        </View>
      ) : null}

      {/* ── Ranking Tab ── */}
      {activeTab === "ranking" ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, gap: 12 }}>
          {orderedVideos.length === 0 ? (
            <Text style={{ color: "#AEBBDA", fontSize: 15, textAlign: "center", paddingVertical: 40 }}>
              Nenhum vídeo para classificar ainda.
            </Text>
          ) : (
            orderedVideos.map((video, index) => {
              const rank = index + 1;
              const medalColors: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
              const medalColor = medalColors[rank] ?? "#AEBBDA";
              const medals = ["🥇", "🥈", "🥉"];

              return (
                <View
                  key={video.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#0E171E",
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: rank <= 3 ? medalColor + "33" : "rgba(255,255,255,0.07)",
                    padding: 16,
                    gap: 14,
                  }}
                >
                  {/* Rank */}
                  <View style={{ width: 42, alignItems: "center" }}>
                    {rank <= 3 ? (
                      <Text style={{ fontSize: 26 }}>{medals[rank - 1]}</Text>
                    ) : (
                      <Text style={{ color: "#AEBBDA", fontWeight: "800", fontSize: 18 }}>
                        #{rank}
                      </Text>
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text
                      style={{ color: "#F3F7FF", fontWeight: "800", fontSize: 15 }}
                      numberOfLines={1}
                    >
                      {video.title}
                    </Text>
                    {video.teamName ? (
                      <Text style={{ color: "#FFD77A", fontWeight: "600", fontSize: 13 }}>
                        {video.teamName2 ? `${video.teamName}  ×  ${video.teamName2}` : video.teamName}
                      </Text>
                    ) : null}
                  </View>

                  {/* Votes */}
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: "rgba(87,255,124,0.10)",
                      borderWidth: 1,
                      borderColor: "rgba(87,255,124,0.25)",
                      gap: 3,
                    }}
                  >
                    <Text style={{ color: "#57FF7C", fontWeight: "900", fontSize: 18 }}>
                      {video.votesCount}
                    </Text>
                    <Text style={{ color: "#57FF7C", fontWeight: "600", fontSize: 10, letterSpacing: 0.8 }}>
                      VOTOS
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : null}

      {/* ── Votantes Tab ── */}
      {activeTab === "votantes" ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, gap: 12 }}>
          {/* Summary */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "#0E171E",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.07)",
                padding: 16,
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ color: "#57FF7C", fontWeight: "900", fontSize: 28 }}>
                {voterRows.length}
              </Text>
              <Text style={{ color: "#AEBBDA", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Votos
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#0E171E",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.07)",
                padding: 16,
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ color: "#FFD77A", fontWeight: "900", fontSize: 28 }}>
                {participantPhones.length}
              </Text>
              <Text style={{ color: "#AEBBDA", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Participantes
              </Text>
            </View>
          </View>

          {voterRows.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                gap: 10,
                paddingVertical: 50,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.02)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.05)",
              }}
            >
              <Ionicons name="people-outline" size={40} color="#AEBBDA" />
              <Text style={{ color: "#AEBBDA", fontSize: 14, fontWeight: "700" }}>
                Nenhum voto registrado ainda
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: "#0E171E",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.07)",
                overflow: "hidden",
              }}
            >
              {/* Table header */}
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderBottomWidth: 1,
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: "#AEBBDA",
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Nome
                </Text>
                <Text
                  style={{
                    width: isPhone ? 110 : 150,
                    color: "#AEBBDA",
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Celular
                </Text>
                <Text
                  style={{
                    flex: 1,
                    color: "#AEBBDA",
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    textAlign: "right",
                  }}
                >
                  Votou em
                </Text>
              </View>

              {/* Table rows */}
              {voterRows.map((row, index) => (
                <View
                  key={row.phone}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: index < voterRows.length - 1 ? 1 : 0,
                    borderColor: "rgba(255,255,255,0.05)",
                    backgroundColor: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                  }}
                >
                  <Text
                    style={{ flex: 1, color: "#F3F7FF", fontWeight: "700", fontSize: 14 }}
                    numberOfLines={1}
                  >
                    {row.name}
                  </Text>
                  <Text
                    style={{
                      width: isPhone ? 110 : 150,
                      color: "#AEBBDA",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    {maskPhone(row.phone)}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      color: "#57FF7C",
                      fontSize: 13,
                      fontWeight: "600",
                      textAlign: "right",
                    }}
                    numberOfLines={1}
                  >
                    {row.videoTitle}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {/* Modals */}
      <AddVideoModal
        visible={showAddVideo}
        teams={participantTeams}
        onClose={() => setShowAddVideo(false)}
        onSubmit={handleAddVideo}
      />

      <VoteModal
        visible={Boolean(voteTargetVideo)}
        video={voteTargetVideo}
        participantPhones={participantPhones}
        alreadyVotedPhones={alreadyVotedPhones}
        onClose={() => setVoteTargetVideo(null)}
        onSubmit={handleVoteSubmit}
      />

      {playingVideo && (
        <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </Screen>
  );
}
