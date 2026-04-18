import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { VideoGalleryCard } from "@/components/videos/VideoGalleryCard";
import { VideoPlayerSurface } from "@/components/videos/VideoPlayerSurface";
import { Card3D } from "@/components/ui/Card3D";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import {
  formatImportedVideoSize,
  isLocalVideoImportAvailable,
  pickLocalVideoAsset,
  type ImportedVideoAsset,
} from "@/lib/local-video-assets";
import { normalizePublicVideoUrl } from "@/lib/video-links";
import { canModerateVideoPanel, useVideoPanelAccessMode } from "@/lib/video-panel-access";
import {
  formatVideoVoterPhone,
  GLOBAL_VIDEO_PANEL_ID,
  GLOBAL_VIDEO_PANEL_NAME,
  normalizeVideoVoterPhone,
} from "@/lib/video-panel";
import { buildVideoPanelShareLink } from "@/lib/video-panel-sharing";
import { buildVideoShareLink } from "@/lib/video-sharing";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { useVideoStore } from "@/stores/video-store";
import type { VideoHighlight } from "@/types/video";

function buildViewerStatus(params: {
  phone: string;
  authorized: boolean;
  votedVideoId: string | null;
  votingClosed: boolean;
}) {
  if (params.votingClosed) {
    return "A votacao foi encerrada. O painel segue aberto apenas para visualizacao.";
  }

  if (!params.phone) {
    return "Digite seu WhatsApp para verificar se este numero tem direito a voto.";
  }

  if (!params.authorized) {
    return "Este WhatsApp nao esta na lista de votacao. A visualizacao segue liberada, mas sem voto.";
  }

  if (params.votedVideoId) {
    return "Este WhatsApp ja registrou um voto. O painel continua aberto somente para visualizacao.";
  }

  return "WhatsApp autorizado. Este numero ainda pode votar em um unico video.";
}

function formatClosedAt(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

async function copyOrShare(link: string) {
  if (Platform.OS === "web" && globalThis.navigator?.clipboard?.writeText) {
    await globalThis.navigator.clipboard.writeText(link);
    return "copied" as const;
  }

  await Share.share({ message: link, url: link });
  return "shared" as const;
}

function buildVideoCardNote(params: {
  video: VideoHighlight;
  normalizedViewerPhone: string;
  viewerAuthorized: boolean;
  viewerVotedVideoId: string | null;
  votingClosed: boolean;
  winningVideoId: string | null;
}) {
  const messages: string[] = [];

  if (params.winningVideoId === params.video.id) {
    messages.push("Este e o video vencedor atual do painel.");
  } else if (params.viewerVotedVideoId === params.video.id) {
    messages.push("Este foi o video escolhido por este WhatsApp.");
  } else {
    messages.push(
      buildViewerStatus({
        phone: params.normalizedViewerPhone,
        authorized: params.viewerAuthorized,
        votedVideoId: params.viewerVotedVideoId,
        votingClosed: params.votingClosed,
      }),
    );
  }

  if (!normalizePublicVideoUrl(params.video.videoUrl)) {
    messages.push(
      "Este video foi importado localmente. Para abrir em outros aparelhos, prefira cadastrar uma URL publica.",
    );
  }

  return messages.join(" ");
}

export default function VideosScreen() {
  const user = useAuthStore((state) => state.user);
  const clearVideoPanelAccess = useAppStore((state) => state.clearVideoPanelAccess);
  const videos = useVideoStore((state) => state.videos);
  const publicarVideoGlobal = useVideoStore((state) => state.publicarVideoGlobal);
  const registrarVisualizacaoVideo = useVideoStore((state) => state.registrarVisualizacaoVideo);
  const adicionarVotanteGlobal = useVideoStore((state) => state.adicionarVotanteGlobal);
  const editarVotanteGlobal = useVideoStore((state) => state.editarVotanteGlobal);
  const removerVotanteGlobal = useVideoStore((state) => state.removerVotanteGlobal);
  const voteGlobalVideo = useVideoStore((state) => state.voteGlobalVideo);
  const encerrarVotacaoGlobal = useVideoStore((state) => state.encerrarVotacaoGlobal);
  const reabrirVotacaoGlobal = useVideoStore((state) => state.reabrirVotacaoGlobal);
  const definirVencedorGlobal = useVideoStore((state) => state.definirVencedorGlobal);
  const globalVideoVoterPhones = useVideoStore((state) => state.globalVideoVoterPhones);
  const globalVideoVotesByPhone = useVideoStore((state) => state.globalVideoVotesByPhone);
  const globalVotingClosed = useVideoStore((state) => state.globalVotingClosed);
  const globalVotingClosedAt = useVideoStore((state) => state.globalVotingClosedAt);
  const globalWinningVideoId = useVideoStore((state) => state.globalWinningVideoId);
  const { contentMaxWidth, horizontalPadding, gap, isPhone, isSmallPhone } = usePanelGrid();
  const { width: viewportWidth } = useWindowDimensions();
  const videoPanelAccessMode = useVideoPanelAccessMode();
  const isModerator = canModerateVideoPanel({
    accessMode: videoPanelAccessMode,
    userRole: user?.role,
  });

  const [showComposer, setShowComposer] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTeamName, setUploadTeamName] = useState("");
  const [uploadPlayerPhone, setUploadPlayerPhone] = useState("");
  const [uploadVideoUrl, setUploadVideoUrl] = useState("");
  const [selectedUploadVideo, setSelectedUploadVideo] = useState<ImportedVideoAsset | null>(null);
  const [importing, setImporting] = useState(false);
  const [registryPhoneInput, setRegistryPhoneInput] = useState("");
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [editingPhoneValue, setEditingPhoneValue] = useState("");
  const [viewerPhoneInput, setViewerPhoneInput] = useState("");
  const [activeViewerPhone, setActiveViewerPhone] = useState("");
  const [openedVideoId, setOpenedVideoId] = useState<string | null>(null);

  const globalVideos = useMemo(
    () =>
      videos
        .filter((video) => video.tournamentId === GLOBAL_VIDEO_PANEL_ID)
        .sort((current, next) => {
          const nextDate = next.createdAt ? new Date(next.createdAt).getTime() : 0;
          const currentDate = current.createdAt ? new Date(current.createdAt).getTime() : 0;
          return nextDate - currentDate;
        }),
    [videos],
  );

  const openedVideo = useMemo(
    () => globalVideos.find((video) => video.id === openedVideoId) ?? null,
    [globalVideos, openedVideoId],
  );
  const winningVideo = useMemo(
    () => globalVideos.find((video) => video.id === globalWinningVideoId) ?? null,
    [globalVideos, globalWinningVideoId],
  );

  const normalizedViewerPhone = normalizeVideoVoterPhone(activeViewerPhone);
  const viewerAuthorized = Boolean(
    normalizedViewerPhone && globalVideoVoterPhones.includes(normalizedViewerPhone),
  );
  const viewerVotedVideoId = viewerAuthorized
    ? globalVideoVotesByPhone[normalizedViewerPhone] ?? null
    : null;
  const viewerHasVoted = Boolean(viewerVotedVideoId);

  const normalizedUploadVideoUrl = useMemo(
    () => normalizePublicVideoUrl(uploadVideoUrl),
    [uploadVideoUrl],
  );

  const galleryColumns = viewportWidth >= 920 ? 2 : 1;
  const effectiveContentWidth = Math.min(
    viewportWidth - horizontalPadding,
    contentMaxWidth,
  );
  const galleryCardWidth =
    galleryColumns === 1
      ? "100%"
      : Math.floor((effectiveContentWidth - gap) / 2);

  async function handlePickVideo() {
    if (!isLocalVideoImportAvailable()) {
      Alert.alert(
        "Importacao indisponivel",
        "A importacao direta de videos esta habilitada na versao web do painel.",
      );
      return;
    }

    try {
      setImporting(true);
      const asset = await pickLocalVideoAsset();

      if (asset) {
        setSelectedUploadVideo(asset);
      }
    } catch {
      Alert.alert("Falha ao importar video", "Nao foi possivel carregar o arquivo selecionado.");
    } finally {
      setImporting(false);
    }
  }

  function resetComposer() {
    setUploadTitle("");
    setUploadDescription("");
    setUploadTeamName("");
    setUploadPlayerPhone("");
    setUploadVideoUrl("");
    setSelectedUploadVideo(null);
    setShowComposer(false);
  }

  function handleSaveGlobalVideo() {
    if (!isModerator) {
      return;
    }

    const result = publicarVideoGlobal({
      createdByName: user?.name,
      title: uploadTitle,
      description: uploadDescription,
      teamName: uploadTeamName,
      playerPhone: uploadPlayerPhone,
      userId: user?.id,
      publicVideoUrl: uploadVideoUrl,
      importedVideoAsset: selectedUploadVideo,
    });

    if (!result.ok) {
      if (result.error === "missing_title") {
        Alert.alert("Titulo obrigatorio", "Informe o titulo antes de publicar o video.");
        return;
      }

      if (result.error === "invalid_public_url") {
        Alert.alert(
          "Link invalido",
          "Use uma URL publica valida, como um link HTTPS do YouTube ou de um arquivo MP4.",
        );
        return;
      }

      Alert.alert(
        "Fonte obrigatoria",
        "Cole uma URL publica do video ou importe um arquivo local antes de publicar.",
      );
      return;
    }

    resetComposer();
  }

  function handleRegisterPhone() {
    if (!isModerator) {
      return;
    }

    const saved = adicionarVotanteGlobal(registryPhoneInput);

    if (!saved) {
      Alert.alert("Cadastro invalido", "Use um WhatsApp valido que ainda nao esteja cadastrado.");
      return;
    }

    setRegistryPhoneInput("");
  }

  function handleStartEditingPhone(phone: string) {
    if (!isModerator) {
      return;
    }

    setEditingPhone(phone);
    setEditingPhoneValue(formatVideoVoterPhone(phone));
  }

  function handleSaveEditedPhone() {
    if (!isModerator) {
      return;
    }

    if (!editingPhone) {
      return;
    }

    const saved = editarVotanteGlobal(editingPhone, editingPhoneValue);

    if (!saved) {
      Alert.alert(
        "Edicao invalida",
        "Use um WhatsApp valido que ainda nao esteja sendo usado por outro jogador.",
      );
      return;
    }

    setEditingPhone(null);
    setEditingPhoneValue("");
  }

  function handleAccessCheck() {
    const normalizedPhone = normalizeVideoVoterPhone(viewerPhoneInput);

    if (!normalizedPhone) {
      Alert.alert("WhatsApp invalido", "Digite um numero de WhatsApp valido para continuar.");
      return;
    }

    setActiveViewerPhone(normalizedPhone);
  }

  function handleOpenVideo(videoId: string) {
    registrarVisualizacaoVideo(videoId);
    setOpenedVideoId(videoId);
  }

  function handleVote(videoId: string) {
    if (globalVotingClosed) {
      Alert.alert("Votacao encerrada", "A votacao ja foi fechada e o painel esta somente para visualizacao.");
      return;
    }

    if (!viewerAuthorized || !normalizedViewerPhone || viewerHasVoted) {
      return;
    }

    const voted = voteGlobalVideo(normalizedViewerPhone, videoId);

    if (!voted) {
      Alert.alert("Voto bloqueado", "Este WhatsApp nao pode votar novamente.");
      return;
    }

    Alert.alert("Voto registrado", "Seu voto foi salvo com sucesso.");
  }

  async function handleShareVideo(video: VideoHighlight) {
    if (!isModerator) {
      return;
    }

    const link = buildVideoShareLink(video);

    try {
      const result = await copyOrShare(link);

      Alert.alert(
        result === "copied" ? "Link copiado" : "Compartilhar video",
        result === "copied"
          ? "O link do video foi copiado com sucesso."
          : "Abra o menu nativo para compartilhar este link.",
      );
    } catch {
      Alert.alert(
        "Falha ao compartilhar",
        "Nao foi possivel copiar ou compartilhar este link agora.",
      );
    }
  }

  async function handleSharePanelLink(access: "moderator" | "viewer") {
    if (!isModerator) {
      return;
    }

    const link = buildVideoPanelShareLink({
      access,
      videos: globalVideos,
      voterPhones: globalVideoVoterPhones,
      votesByPhone: globalVideoVotesByPhone,
      votingClosed: globalVotingClosed,
      votingClosedAt: globalVotingClosedAt,
      winningVideoId: globalWinningVideoId,
    });

    try {
      const result = await copyOrShare(link);

      Alert.alert(
        result === "copied" ? "Link copiado" : "Compartilhar painel",
        result === "copied"
          ? `O link de ${access === "moderator" ? "moderador" : "visualizador"} foi copiado com sucesso.`
          : "Abra o menu nativo para compartilhar este link.",
      );
    } catch {
      Alert.alert(
        "Falha ao compartilhar",
        "Nao foi possivel copiar ou compartilhar o link do painel agora.",
      );
    }
  }

  function handleCloseVoting() {
    if (!isModerator) {
      return;
    }

    if (globalVideos.length === 0) {
      Alert.alert("Sem videos", "Cadastre pelo menos um video antes de encerrar a votacao.");
      return;
    }

    const winningVideoId = encerrarVotacaoGlobal();
    const autoWinner = globalVideos.find((video) => video.id === winningVideoId) ?? null;

    Alert.alert(
      "Votacao encerrada",
      autoWinner
        ? `A votacao foi fechada e o vencedor inicial ficou como ${autoWinner.title}.`
        : "A votacao foi fechada. Nenhum vencedor inicial foi definido.",
    );
  }

  function handleSetWinner(videoId: string) {
    if (!isModerator) {
      return;
    }

    const saved = definirVencedorGlobal(videoId);
    const selectedVideo = globalVideos.find((video) => video.id === videoId) ?? null;

    if (!saved || !selectedVideo) {
      Alert.alert("Falha ao definir vencedor", "Nao foi possivel atualizar o vencedor agora.");
      return;
    }

    Alert.alert("Vencedor atualizado", `${selectedVideo.title} agora esta marcado como vencedor.`);
  }

  const votingStatusText = globalVotingClosed
    ? `Encerrada${formatClosedAt(globalVotingClosedAt) ? ` em ${formatClosedAt(globalVotingClosedAt)}` : ""}.`
    : "Aberta para jogadores autorizados.";

  return (
    <Screen
      scroll
      ambientDiamond
      className="px-6"
      overlay={
        <Modal transparent visible={Boolean(openedVideo)} animationType="fade" onRequestClose={() => setOpenedVideoId(null)}>
          <Pressable
            onPress={() => setOpenedVideoId(null)}
            style={{
              flex: 1,
              justifyContent: "center",
              paddingHorizontal: 24,
              backgroundColor: "rgba(4,8,18,0.62)",
            }}
          >
            {openedVideo ? (
              <Pressable
                onPress={(event) => event.stopPropagation()}
                style={{
                  alignSelf: "center",
                  width: "100%",
                  maxWidth: 860,
                  borderRadius: 24,
                  padding: 20,
                  backgroundColor: "rgba(8,15,28,0.88)",
                  borderWidth: 1,
                  borderColor: "rgba(154,184,255,0.18)",
                }}
              >
                <View className="gap-4">
                  <View className="gap-2">
                    <Text
                      style={{
                        color: "#9AB8FF",
                        fontSize: 11,
                        fontWeight: "900",
                        letterSpacing: 1.8,
                        textTransform: "uppercase",
                      }}
                    >
                      Painel global de videos
                    </Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "900" }}>
                      {openedVideo.title}
                    </Text>
                    <Text style={{ color: "#AEBBDA", fontSize: 14, lineHeight: 22 }}>
                      {(openedVideo.viewsCount ?? 0)} visualizacoes • {openedVideo.votesCount} votos
                    </Text>
                  </View>

                  <VideoPlayerSurface videoUrl={openedVideo.videoUrl} title={openedVideo.title} mimeType={openedVideo.mimeType} />

                  {openedVideo.description || openedVideo.teamName || openedVideo.playerPhone ? (
                    <View
                      className="gap-3 rounded-[18px] border px-4 py-4"
                      style={{
                        borderColor: "rgba(255,255,255,0.10)",
                        backgroundColor: "rgba(255,255,255,0.04)",
                      }}
                    >
                      {openedVideo.description ? (
                        <Text style={{ color: "#F3F7FF", fontSize: 14, lineHeight: 22 }}>
                          {openedVideo.description}
                        </Text>
                      ) : null}

                      <View className="flex-row flex-wrap gap-2">
                        {openedVideo.teamName ? (
                          <View
                            style={{
                              borderRadius: 999,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              backgroundColor: "rgba(90,124,255,0.12)",
                              borderWidth: 1,
                              borderColor: "rgba(90,124,255,0.22)",
                            }}
                          >
                            <Text
                              style={{
                                color: "#BFD0FF",
                                fontSize: 11,
                                fontWeight: "800",
                                letterSpacing: 1.1,
                                textTransform: "uppercase",
                              }}
                            >
                              {openedVideo.teamName}
                            </Text>
                          </View>
                        ) : null}

                        {openedVideo.playerPhone ? (
                          <View
                            style={{
                              borderRadius: 999,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              backgroundColor: "rgba(87,255,124,0.10)",
                              borderWidth: 1,
                              borderColor: "rgba(87,255,124,0.22)",
                            }}
                          >
                            <Text
                              style={{
                                color: "#CFFFD9",
                                fontSize: 11,
                                fontWeight: "800",
                                letterSpacing: 1.1,
                              }}
                            >
                              {formatVideoVoterPhone(openedVideo.playerPhone)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ) : null}

                  <View
                    className="rounded-[18px] border px-4 py-4"
                    style={{
                      borderColor: "rgba(255,255,255,0.10)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Text style={{ color: "#F3F7FF", fontSize: 15, fontWeight: "800" }}>
                      Situacao do seu acesso
                    </Text>
                    <Text style={{ marginTop: 6, color: "#AEBBDA", fontSize: 14, lineHeight: 22 }}>
                      {buildVideoCardNote({
                        video: openedVideo,
                        normalizedViewerPhone,
                        viewerAuthorized,
                        viewerVotedVideoId,
                        votingClosed: globalVotingClosed,
                        winningVideoId: globalWinningVideoId,
                      })}
                    </Text>
                  </View>

                  <View className="flex-row flex-wrap gap-3">
                    {isModerator ? (
                      <PrimaryButton
                        label="Compartilhar"
                        onPress={() => handleShareVideo(openedVideo)}
                        variant="light"
                        className={isPhone ? "w-full" : "flex-1"}
                      />
                    ) : null}

                    {viewerAuthorized && !viewerHasVoted && !globalVotingClosed ? (
                      <PrimaryButton
                        label="Votar neste video"
                        onPress={() => handleVote(openedVideo.id)}
                        className={isPhone ? "w-full" : "flex-1"}
                      />
                    ) : null}
                  </View>

                  {viewerHasVoted ? (
                    <Text style={{ color: "#FFD76A", fontSize: 13, fontWeight: "700", textAlign: "center" }}>
                      Voce ja votou {viewerVotedVideoId === openedVideo.id ? "neste video." : "em outro video deste painel."}
                    </Text>
                  ) : null}

                  <PrimaryButton label="Fechar" variant="secondary" onPress={() => setOpenedVideoId(null)} />
                </View>
              </Pressable>
            ) : null}
          </Pressable>
        </Modal>
      }
    >
      <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
        <SectionHeader
          eyebrow="Painel de videos"
          title="Galeria global com cards em formato de vitrine"
          subtitle={
            isModerator
              ? "Como moderador, voce pode publicar videos, compartilhar links, gerenciar a lista de WhatsApps e encerrar a votacao."
              : "Aqui voce pode assistir aos videos e votar apenas se o seu WhatsApp estiver autorizado."
          }
        />

        {isModerator ? (
          <View
            className="flex-row flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-4"
            style={{
              borderColor: "rgba(87,255,124,0.22)",
              backgroundColor: "rgba(17,32,24,0.72)",
            }}
          >
            <View className="flex-1 gap-1">
              <Text
                style={{
                  color: "#CFFFD9",
                  fontSize: 11,
                  fontWeight: "900",
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                }}
              >
                Gerenciamento
              </Text>
              <Text style={{ color: "#F3F7FF", fontSize: 18, fontWeight: "800" }}>
                Adicionar videos e jogadores
              </Text>
            <Text style={{ color: "#AEBBDA", fontSize: 14, lineHeight: 22 }}>
              Use este atalho para publicar videos e cadastrar os WhatsApps que podem visualizar e votar.
            </Text>
            {showComposer ? (
              <Text style={{ color: "#FFD76A", fontSize: 13, fontWeight: "700" }}>
                Editor aberto no bloco "Acesso e videos" logo abaixo.
              </Text>
            ) : null}
          </View>

            <PrimaryButton
              label={showComposer ? "Fechar cadastro" : "Adicionar video"}
              onPress={() => setShowComposer((current) => !current)}
              icon={showComposer ? "close-outline" : "add-outline"}
              variant="primary"
              className="self-start"
            />
          </View>
        ) : null}

        {videoPanelAccessMode !== "owner" ? (
          <View
            className="self-start rounded-full border px-3 py-2"
            style={{
              borderColor: videoPanelAccessMode === "viewer" ? "rgba(233,179,52,0.34)" : "rgba(87,255,124,0.34)",
              backgroundColor: videoPanelAccessMode === "viewer" ? "rgba(80,54,10,0.62)" : "rgba(11,44,24,0.66)",
            }}
          >
            <Text
              style={{
                color: videoPanelAccessMode === "viewer" ? "#FFD76A" : "#CFFFD9",
                fontSize: 11,
                fontWeight: "900",
                letterSpacing: 1.8,
                textTransform: "uppercase",
              }}
            >
              Link compartilhado • {videoPanelAccessMode === "viewer" ? "visualizador" : "moderador"}
            </Text>
          </View>
        ) : null}

        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <View className="max-w-[820px] gap-2">
            <Text style={{ color: "#F3F7FF", fontSize: isSmallPhone ? 24 : 30, fontWeight: "900" }}>
              Biblioteca do painel
            </Text>
            <Text style={{ color: "#AEBBDA", fontSize: 15, lineHeight: 24 }}>
              Os videos agora ficam organizados dentro do menu de acesso, com publicacao e lista no mesmo bloco.
            </Text>
          </View>

        </View>

        {videoPanelAccessMode !== "owner" &&
        (user?.role === "organizer" || user?.role === "admin") ? (
          <PrimaryButton
            label="Voltar ao painel local"
            onPress={clearVideoPanelAccess}
            variant="secondary"
            className="self-start"
          />
        ) : null}

        <View className="flex-row flex-wrap gap-5">
          {isModerator ? (
            <RevealOnScroll delay={40} style={{ width: galleryColumns === 1 ? "100%" : galleryCardWidth }}>
              <Card3D
                accent="obsidian"
                eyebrow="Compartilhamento"
                badge={videoPanelAccessMode === "moderator" ? "Moderando por link" : "Painel local"}
                title="Links do painel"
                subtitle="Compartilhe o painel inteiro em modo visualizador para jogadores, ou em modo moderador para quem vai administrar esta galeria."
                hideHeroPanel
                content={
                  <View className="gap-3">
                    <PrimaryButton
                      label="Copiar link visualizador"
                      onPress={() => handleSharePanelLink("viewer")}
                      variant="light"
                    />
                    <PrimaryButton
                      label="Copiar link moderador"
                      onPress={() => handleSharePanelLink("moderator")}
                      variant="secondary"
                    />
                  </View>
                }
              />
            </RevealOnScroll>
          ) : null}

          {isModerator ? (
            <RevealOnScroll delay={60} style={{ width: galleryColumns === 1 ? "100%" : galleryCardWidth }}>
              <Card3D
                accent="obsidian"
                eyebrow="Votantes"
                badge={`${globalVideoVoterPhones.length} cadastrados`}
                title="Tabela de WhatsApps autorizados"
                subtitle="No painel local, ou no link de moderacao, voce pode cadastrar, editar ou remover os numeros que liberam a votacao."
                hideHeroPanel
                content={
                  <View className="gap-4">
                    <View className="flex-row gap-3">
                      <TextInput
                        value={registryPhoneInput}
                        onChangeText={setRegistryPhoneInput}
                        placeholder="+55 11 99999-0000"
                        placeholderTextColor="#8D97AD"
                        keyboardType="phone-pad"
                        style={{
                          flex: 1,
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.10)",
                          backgroundColor: "rgba(8,11,18,0.78)",
                          color: "#F4F7FF",
                          fontSize: 15,
                          fontWeight: "700",
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                        }}
                      />
                      <PrimaryButton label="Cadastrar" onPress={handleRegisterPhone} variant="secondary" />
                    </View>

                    <View className="gap-2 rounded-[18px] border px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)" }}>
                      <Text style={{ color: "#F3F7FF", fontSize: 14, fontWeight: "800" }}>
                        Lista atual
                      </Text>

                      {globalVideoVoterPhones.length === 0 ? (
                        <Text style={{ color: "#AEBBDA", fontSize: 14, lineHeight: 22 }}>
                          Nenhum WhatsApp cadastrado ainda.
                        </Text>
                      ) : (
                        globalVideoVoterPhones.map((phone) => {
                          const isEditingCurrentPhone = editingPhone === phone;

                          return (
                            <View
                              key={phone}
                              className="rounded-[16px] px-3 py-3"
                              style={{ backgroundColor: "rgba(7,13,24,0.72)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}
                            >
                              {isEditingCurrentPhone ? (
                                <View className="gap-3">
                                  <TextInput
                                    value={editingPhoneValue}
                                    onChangeText={setEditingPhoneValue}
                                    placeholder="+55 11 99999-0000"
                                    placeholderTextColor="#8D97AD"
                                    keyboardType="phone-pad"
                                    style={{
                                      borderRadius: 16,
                                      borderWidth: 1,
                                      borderColor: "rgba(255,255,255,0.10)",
                                      backgroundColor: "rgba(8,11,18,0.78)",
                                      color: "#F4F7FF",
                                      fontSize: 15,
                                      fontWeight: "700",
                                      paddingHorizontal: 14,
                                      paddingVertical: 12,
                                    }}
                                  />
                                  <View className="flex-row flex-wrap gap-3">
                                    <PrimaryButton label="Salvar" onPress={handleSaveEditedPhone} variant="light" size="sm" className="flex-1" />
                                    <PrimaryButton
                                      label="Cancelar"
                                      onPress={() => {
                                        setEditingPhone(null);
                                        setEditingPhoneValue("");
                                      }}
                                      variant="secondary"
                                      size="sm"
                                      className="flex-1"
                                    />
                                  </View>
                                </View>
                              ) : (
                                <View className="flex-row items-center justify-between gap-3">
                                  <Text style={{ color: "#F3F7FF", fontSize: 14, fontWeight: "700" }}>
                                    {formatVideoVoterPhone(phone)}
                                  </Text>
                                  <View className="flex-row gap-3">
                                    <Pressable onPress={() => handleStartEditingPhone(phone)} className="active:opacity-80">
                                      <Text style={{ color: "#C9D7FF", fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>
                                        Editar
                                      </Text>
                                    </Pressable>
                                    <Pressable onPress={() => removerVotanteGlobal(phone)} className="active:opacity-80">
                                      <Text style={{ color: "#FFD29E", fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>
                                        Remover
                                      </Text>
                                    </Pressable>
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  </View>
                }
              />
            </RevealOnScroll>
          ) : null}

          <RevealOnScroll delay={100} style={{ width: galleryColumns === 1 ? "100%" : galleryCardWidth }}>
            <Card3D
              accent="obsidian"
              eyebrow="Votacao"
              badge={globalVotingClosed ? "Encerrada" : "Aberta"}
              title={winningVideo ? `Vencedor atual: ${winningVideo.title}` : "Status da votacao"}
              subtitle={
                globalVotingClosed
                  ? `${votingStatusText} O vencedor pode ser redefinido manualmente pelo moderador nos cards abaixo.`
                  : `${votingStatusText} O vencedor sera definido assim que o moderador encerrar a votacao.`
              }
              hideHeroPanel
              content={
                <View className="gap-4">
                  <View className="rounded-[18px] border px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)" }}>
                    <Text style={{ color: "#F3F7FF", fontSize: 14, fontWeight: "800" }}>
                      {globalVotingClosed
                        ? "Votacao fechada para todos os jogadores."
                        : "Votacao liberada para os WhatsApps autorizados."}
                    </Text>
                    <Text style={{ marginTop: 6, color: "#AEBBDA", fontSize: 14, lineHeight: 22 }}>
                      {winningVideo
                        ? `${winningVideo.title} esta marcado como vencedor atual com ${winningVideo.votesCount} votos.`
                        : "Ainda nao existe um vencedor definido neste painel."}
                    </Text>
                  </View>

                  {isModerator ? (
                    !globalVotingClosed ? (
                      <PrimaryButton label="Encerrar votacao agora" onPress={handleCloseVoting} variant="gold" />
                    ) : (
                      <PrimaryButton label="Reabrir votacao" onPress={reabrirVotacaoGlobal} variant="secondary" />
                    )
                  ) : null}
                </View>
              }
            />
          </RevealOnScroll>

          <RevealOnScroll delay={120} style={{ width: "100%" }}>
            <Card3D
              accent="obsidian"
              eyebrow={isModerator ? "Acesso e videos" : "Acesso"}
              badge={globalVotingClosed ? "Somente visualizacao" : viewerAuthorized ? (viewerHasVoted ? "Voto concluido" : "Voto liberado") : "Visualizacao"}
              title={isModerator ? "Entrar com WhatsApp e cadastrar videos" : "Entrar com WhatsApp"}
              subtitle={isModerator ? "O moderador publica videos neste mesmo painel. O jogador informa o WhatsApp para descobrir se pode votar ou apenas assistir." : "O jogador informa o WhatsApp para descobrir se pode votar ou apenas assistir."}
              hideHeroPanel
              content={
                <View className="gap-4">
                  <View className="flex-row gap-3">
                    <TextInput
                      value={viewerPhoneInput}
                      onChangeText={setViewerPhoneInput}
                      placeholder="Digite seu WhatsApp"
                      placeholderTextColor="#8D97AD"
                      keyboardType="phone-pad"
                      style={{
                        flex: 1,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.10)",
                        backgroundColor: "rgba(8,11,18,0.78)",
                        color: "#F4F7FF",
                        fontSize: 15,
                        fontWeight: "700",
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                      }}
                    />
                    <PrimaryButton label="Verificar" onPress={handleAccessCheck} />
                  </View>

                  <View className="rounded-[18px] border px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)" }}>
                    <Text style={{ color: "#F3F7FF", fontSize: 14, fontWeight: "800" }}>
                      {activeViewerPhone ? `WhatsApp ativo: ${formatVideoVoterPhone(activeViewerPhone)}` : "Nenhum WhatsApp validado ainda"}
                    </Text>
                    <Text style={{ marginTop: 6, color: "#AEBBDA", fontSize: 14, lineHeight: 22 }}>
                      {buildViewerStatus({
                        phone: normalizedViewerPhone,
                        authorized: viewerAuthorized,
                        votedVideoId: viewerVotedVideoId,
                        votingClosed: globalVotingClosed,
                      })}
                    </Text>
                  </View>

                  {isModerator ? (
                    <View
                      className="gap-4 rounded-[20px] border px-4 py-4"
                      style={{
                        borderColor: "rgba(154,184,255,0.14)",
                        backgroundColor: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <View className="gap-2">
                        <Text
                          style={{
                            color: "#9AB8FF",
                            fontSize: 12,
                            fontWeight: "800",
                            letterSpacing: 1.8,
                            textTransform: "uppercase",
                          }}
                        >
                          Publicacao
                        </Text>
                        <Text style={{ color: "#F4F7FF", fontSize: 18, fontWeight: "800" }}>
                          Adicionar videos neste menu
                        </Text>
                        <Text style={{ color: "#AEBBDA", fontSize: 14, lineHeight: 22 }}>
                          Publique os videos daqui e a lista aparece logo abaixo dentro do mesmo painel.
                        </Text>
                      </View>

                      <PrimaryButton
                        label={showComposer ? "Fechar editor" : "Adicionar video"}
                        onPress={() => setShowComposer((current) => !current)}
                        icon={showComposer ? "close-outline" : "add-outline"}
                        variant="light"
                        className="self-start"
                      />

                      {showComposer ? (
                        <View
                          className="gap-4 rounded-[18px] border px-4 py-4"
                          style={{
                            borderColor: "rgba(255,255,255,0.08)",
                            backgroundColor: "rgba(7,13,24,0.72)",
                          }}
                        >
                          <View className="gap-2">
                            <Text style={{ color: "#FFD29E", fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>
                              Titulo do video
                            </Text>
                            <TextInput
                              value={uploadTitle}
                              onChangeText={setUploadTitle}
                              placeholder="Ex.: Golaço no angulo"
                              placeholderTextColor="#8D97AD"
                              style={{
                                borderRadius: 18,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.10)",
                                backgroundColor: "rgba(8,11,18,0.78)",
                                color: "#F4F7FF",
                                fontSize: 15,
                                fontWeight: "700",
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                              }}
                            />
                          </View>

                          <View className="gap-2">
                            <Text style={{ color: "#FFD29E", fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>
                              Descricao abaixo do video
                            </Text>
                            <TextInput
                              value={uploadDescription}
                              onChangeText={setUploadDescription}
                              placeholder="Descreva o lance, contexto da rodada ou observacao do video"
                              placeholderTextColor="#8D97AD"
                              multiline
                              numberOfLines={4}
                              textAlignVertical="top"
                              style={{
                                minHeight: 110,
                                borderRadius: 18,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.10)",
                                backgroundColor: "rgba(8,11,18,0.78)",
                                color: "#F4F7FF",
                                fontSize: 15,
                                fontWeight: "600",
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                              }}
                            />
                          </View>

                          <View className="flex-row flex-wrap gap-3">
                            <View className="min-w-[220px] flex-1 gap-2">
                              <Text style={{ color: "#FFD29E", fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>
                                Time ou campeonato
                              </Text>
                              <TextInput
                                value={uploadTeamName}
                                onChangeText={setUploadTeamName}
                                placeholder="Ex.: Time Azul ou Copa Arena"
                                placeholderTextColor="#8D97AD"
                                style={{
                                  borderRadius: 18,
                                  borderWidth: 1,
                                  borderColor: "rgba(255,255,255,0.10)",
                                  backgroundColor: "rgba(8,11,18,0.78)",
                                  color: "#F4F7FF",
                                  fontSize: 15,
                                  fontWeight: "700",
                                  paddingHorizontal: 16,
                                  paddingVertical: 14,
                                }}
                              />
                            </View>

                            <View className="min-w-[220px] flex-1 gap-2">
                              <Text style={{ color: "#FFD29E", fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>
                                WhatsApp do jogador
                              </Text>
                              <TextInput
                                value={uploadPlayerPhone}
                                onChangeText={setUploadPlayerPhone}
                                placeholder="+55 11 99999-0000"
                                placeholderTextColor="#8D97AD"
                                keyboardType="phone-pad"
                                style={{
                                  borderRadius: 18,
                                  borderWidth: 1,
                                  borderColor: "rgba(255,255,255,0.10)",
                                  backgroundColor: "rgba(8,11,18,0.78)",
                                  color: "#F4F7FF",
                                  fontSize: 15,
                                  fontWeight: "700",
                                  paddingHorizontal: 16,
                                  paddingVertical: 14,
                                }}
                              />
                            </View>
                          </View>

                          <View className="gap-2">
                            <Text style={{ color: "#FFD29E", fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>
                              Link publico do video
                            </Text>
                            <TextInput
                              value={uploadVideoUrl}
                              onChangeText={setUploadVideoUrl}
                              placeholder="https://youtube.com/watch?v=... ou https://site/video.mp4"
                              placeholderTextColor="#8D97AD"
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="url"
                              style={{
                                borderRadius: 18,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.10)",
                                backgroundColor: "rgba(8,11,18,0.78)",
                                color: "#F4F7FF",
                                fontSize: 15,
                                fontWeight: "700",
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                              }}
                            />
                          </View>

                          <View className="flex-row flex-wrap gap-3">
                            <PrimaryButton
                              label={importing ? "Importando..." : selectedUploadVideo ? "Trocar arquivo local" : "Importar arquivo local"}
                              onPress={handlePickVideo}
                              disabled={importing}
                              variant="secondary"
                            />
                            <PrimaryButton
                              label="Publicar video"
                              onPress={handleSaveGlobalVideo}
                              disabled={!uploadTitle.trim() || (!normalizedUploadVideoUrl && !selectedUploadVideo)}
                              variant="light"
                            />
                          </View>

                          <View
                            className="rounded-[18px] border px-4 py-4"
                            style={{
                              borderColor:
                                normalizedUploadVideoUrl || selectedUploadVideo
                                  ? "rgba(255,180,96,0.28)"
                                  : "rgba(255,255,255,0.08)",
                              backgroundColor:
                                normalizedUploadVideoUrl || selectedUploadVideo
                                  ? "rgba(255,120,32,0.10)"
                                  : "rgba(255,255,255,0.04)",
                            }}
                          >
                            <Text style={{ color: "#FFF0DB", fontSize: 13, lineHeight: 20, fontWeight: "700" }}>
                              {normalizedUploadVideoUrl
                                ? "Fonte atual: URL publica pronta para compartilhamento."
                                : selectedUploadVideo
                                  ? `Fonte atual: ${selectedUploadVideo.fileName} • ${formatImportedVideoSize(selectedUploadVideo.fileSizeBytes)}. Arquivo local reproduz neste navegador e o link compartilhado depende de uma URL publica para tocar em outros aparelhos.`
                                  : "Nenhuma fonte selecionada ainda. Use uma URL publica ou importe um arquivo local."}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  <View className="gap-3">
                    <View className="gap-1">
                      <Text
                        style={{
                          color: "#9AB8FF",
                          fontSize: 12,
                          fontWeight: "800",
                          letterSpacing: 1.8,
                          textTransform: "uppercase",
                        }}
                      >
                        Lista de videos
                      </Text>
                      <Text style={{ color: "#AEBBDA", fontSize: 14, lineHeight: 22 }}>
                        Os videos publicados aparecem dentro deste menu para assistir, votar e, para quem administra o painel, compartilhar ou definir o vencedor.
                      </Text>
                    </View>

                    {globalVideos.length === 0 ? (
                      <View
                        className="rounded-[18px] border px-4 py-4"
                        style={{
                          borderColor: "rgba(255,255,255,0.08)",
                          backgroundColor: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <Text style={{ color: "#F3F7FF", fontSize: 14, fontWeight: "800" }}>
                          Nenhum video publicado ainda
                        </Text>
                        <Text style={{ marginTop: 6, color: "#AEBBDA", fontSize: 14, lineHeight: 22 }}>
                          {isModerator
                            ? "Use o editor acima para publicar o primeiro video desta galeria."
                            : "Aguarde a publicacao de videos pelo moderador para assistir e votar."}
                        </Text>
                      </View>
                    ) : (
                      <View className="gap-4">
                        {globalVideos.map((video, index) => {
                          const selectedByViewer = viewerVotedVideoId === video.id;
                          const canVoteCurrentVideo =
                            viewerAuthorized && !viewerHasVoted && !globalVotingClosed;
                          const canDefineWinner =
                            isModerator &&
                            globalVotingClosed &&
                            globalWinningVideoId !== video.id;

                          return (
                            <RevealOnScroll key={video.id} delay={index * 60}>
                              <VideoGalleryCard
                                video={video}
                                statusNote={buildVideoCardNote({
                                  video,
                                  normalizedViewerPhone,
                                  viewerAuthorized,
                                  viewerVotedVideoId,
                                  votingClosed: globalVotingClosed,
                                  winningVideoId: globalWinningVideoId,
                                })}
                                voteLabel={selectedByViewer ? "Seu voto" : "Votar neste video"}
                                voteLocked={!canVoteCurrentVideo}
                                shareLabel="Compartilhar"
                                adminLabel="Definir vencedor"
                                onOpen={() => handleOpenVideo(video.id)}
                                onShare={isModerator ? () => handleShareVideo(video) : undefined}
                                onVote={canVoteCurrentVideo ? () => handleVote(video.id) : undefined}
                                onAdminAction={canDefineWinner ? () => handleSetWinner(video.id) : undefined}
                              />
                            </RevealOnScroll>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
              }
            />
          </RevealOnScroll>
        </View>

      </View>
    </Screen>
  );
}
