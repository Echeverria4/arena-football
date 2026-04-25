import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform, Share, Text, View } from "react-native";

import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildTournamentShareLink } from "@/lib/tournament-sharing";
import {
  isTournamentAccessLocked,
  resolveTournamentAccessMode,
  useTournamentAccessMode,
} from "@/lib/tournament-access";
import { getTournamentBundle } from "@/lib/tournament-display";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

async function copyOrShare(link: string) {
  if (Platform.OS === "web" && globalThis.navigator?.clipboard?.writeText) {
    await globalThis.navigator.clipboard.writeText(link);
    return "copied" as const;
  }

  await Share.share({ message: link, url: link });
  return "shared" as const;
}

function isShortLink(link: string) {
  return link.includes("/s/");
}

function formatVisibleLink(link: string) {
  try {
    const url = new URL(link);

    if (isShortLink(link)) {
      return `${url.host}${url.pathname}`;
    }

    const access = url.searchParams.get("access");
    const data = url.searchParams.get("data");

    if (data) {
      return `${url.host}${url.pathname}?access=${access ?? "viewer"}&data=${data.slice(0, 24)}...`;
    }

    return link.length > 120 ? `${link.slice(0, 117)}...` : link;
  } catch {
    return link;
  }
}

function LinkCard({
  title,
  subtitle,
  link,
}: {
  title: string;
  subtitle: string;
  link: string | null;
}) {
  async function handleCopy() {
    if (!link) {
      return;
    }

    try {
      const result = await copyOrShare(link);

      Alert.alert(
        result === "copied" ? "Link copiado" : "Compartilhar",
        result === "copied"
          ? "Link copiado com sucesso."
          : "Abra o menu nativo para compartilhar."
      );
    } catch {
      Alert.alert(
        "Falha ao compartilhar",
        "Nao foi possivel copiar ou compartilhar este link."
      );
    }
  }

  return (
    <View
      className="gap-4 rounded-[24px] border p-5"
      style={{
        backgroundColor: "rgba(10,16,24,0.88)",
        borderColor: "rgba(87,255,124,0.14)",
      }}
    >
      <View className="gap-1">
        <Text
          style={{
            color: "#F3F7FF",
            fontSize: 22,
            fontWeight: "900",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: "#AEBBDA",
            fontSize: 15,
            lineHeight: 24,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <View
        className="rounded-[20px] border px-4 py-4"
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text
          selectable
          style={{
            color: "#DDE7FF",
            fontSize: 14,
            fontWeight: "800",
            lineHeight: 22,
          }}
        >
          {link ? formatVisibleLink(link) : "Gerando link..."}
        </Text>
      </View>

      <PrimaryButton
        label="Copiar link"
        onPress={handleCopy}
        size="sm"
        disabled={!link}
        className="self-start"
        style={!link ? { opacity: 0.55 } : undefined}
      />
    </View>
  );
}

export default function TournamentAccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const videos = useVideoStore((state) => state.videos);
  const hydrated = useTournamentDataHydrated();
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const accessMode = useTournamentAccessMode(id);
  const bundle = id ? getTournamentBundle(id, campeonatos, videos) : null;
  const championshipFinished = bundle?.campeonato.status === "finalizado";
  const activeTournamentAccessMode = resolveTournamentAccessMode(
    tournamentAccess,
    currentTournamentId,
  );
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);
  const [editorLink, setEditorLink] = useState<string | null>(null);
  const [viewerLink, setViewerLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastLoadedTournamentIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLinks() {
      if (!bundle) {
        setEditorLink(null);
        setViewerLink(null);
        setLoading(false);
        return;
      }

      const tournamentId = String(bundle.campeonato.id ?? "");

      if (!tournamentId) {
        setEditorLink(null);
        setViewerLink(null);
        setLoading(false);
        return;
      }

      if (bundle.campeonato.status === "finalizado") {
        setEditorLink(null);
        setViewerLink(null);
        setLoading(false);
        lastLoadedTournamentIdRef.current = null;
        return;
      }

      if (
        lastLoadedTournamentIdRef.current === tournamentId &&
        editorLink &&
        viewerLink
      ) {
        return;
      }

      setLoading(true);

      try {
        // Sequencial (nao Promise.all): cada chamada faz supabase.auth.getUser()
        // que disputa um lock global da gotrue. Em paralelo o lock e quebrado e
        // o segundo push falha com "Lock broken by another request with the
        // 'steal' option", caindo no fallback snapshot-only (link sem realtime).
        const editor = await buildTournamentShareLink({
          access: "editor",
          campeonato: bundle.campeonato,
          videos: bundle.videos,
        });
        const viewer = await buildTournamentShareLink({
          access: "viewer",
          campeonato: bundle.campeonato,
          videos: bundle.videos,
        });

        if (cancelled) {
          return;
        }

        setEditorLink(editor);
        setViewerLink(viewer);
        lastLoadedTournamentIdRef.current = tournamentId;
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao gerar links do campeonato:", error);
          setEditorLink(null);
          setViewerLink(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLinks();

    return () => {
      cancelled = true;
    };
    // Dependencies precisam ser PRIMITIVOS estaveis. `bundle` e recriado a
    // cada render por getTournamentBundle, e usar a referencia do objeto
    // disparava o efeito a cada render — o que causava chamadas em loop a
    // buildTournamentShareLink, travando o lock auth do Supabase e
    // cascateando "Lock broken" errors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle?.campeonato.id, bundle?.campeonato.status]);

  useEffect(() => {
    if (lockToActiveTournament && currentTournamentId && currentTournamentId !== id) {
      router.replace({ pathname: "/tournament/preview", params: { id: currentTournamentId } });
      return;
    }

    if (!id || accessMode === "owner") {
      return;
    }

    router.replace({ pathname: "/tournament/preview", params: { id } });
  }, [accessMode, currentTournamentId, id, lockToActiveTournament]);

  if (!hydrated) {
    return (
      <Screen scroll className="px-6" ambientDiamond>
        <ScreenState
          title="Carregando compartilhamento"
          description="Sincronizando campeonato e arquivos de video antes de gerar os links."
          tone="dark"
        />
      </Screen>
    );
  }

  if (!bundle) {
    return (
      <Screen scroll className="px-6" ambientDiamond>
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato nao encontrado"
            description="Nao existe uma temporada valida para gerar links de compartilhamento."
            tone="dark"
          />
        </View>
      </Screen>
    );
  }

  if (accessMode !== "owner") {
    return null;
  }

  return (
    <Screen scroll className="px-6" ambientDiamond>
      <View className="gap-6 py-8">
        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />

        <SectionHeader
          eyebrow="Compartilhamento"
          title={`Links de ${bundle.tournament.name}`}
          subtitle={
            championshipFinished
              ? "Este campeonato foi encerrado. Os links compartilhados expiram automaticamente ao fim da temporada."
              : "O link de editor importa uma copia editavel do campeonato. O link de visualizador abre a mesma copia em modo somente leitura."
          }
          tone="dark"
        />

        <View
          className="flex-row flex-wrap gap-4 rounded-[24px] border p-5"
          style={{
            backgroundColor: "rgba(10,16,24,0.78)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <View className="min-w-[160px] flex-1 gap-2">
            <Text className="text-xs font-black uppercase tracking-[2px] text-[#8CB4FF]">
              Campeonato
            </Text>
            <Text className="text-2xl font-black text-[#F3F7FF]">{bundle.campeonato.nome}</Text>
          </View>
          <View className="min-w-[140px] flex-1 gap-2">
            <Text className="text-xs font-black uppercase tracking-[2px] text-[#8CB4FF]">
              Videos vinculados
            </Text>
            <Text className="text-2xl font-black text-[#F3F7FF]">{bundle.videos.length}</Text>
          </View>
          <View className="min-w-[140px] flex-1 gap-2">
            <Text className="text-xs font-black uppercase tracking-[2px] text-[#8CB4FF]">
              Temporada
            </Text>
            <Text className="text-2xl font-black text-[#F3F7FF]">
              {bundle.campeonato.temporada ?? "Sem rótulo"}
            </Text>
          </View>
        </View>

        {championshipFinished ? (
          <ScreenState
            title="Links expirados"
            description="O campeonato já foi finalizado. Novos links de editor e visualizador ficam indisponíveis a partir deste encerramento."
            tone="dark"
          />
        ) : loading ? (
          <ScreenState
            title="Links gerando"
            description="Preparando links curtos de compartilhamento do campeonato."
            tone="dark"
          />
        ) : (
          <View className="gap-4">
            <LinkCard
              title="Editor"
              subtitle="Importa uma copia que pode ser editada neste aparelho."
              link={editorLink}
            />

            <LinkCard
              title="Visualizador"
              subtitle="Abre o campeonato em leitura, sem permissao de editar placares ou estrutura."
              link={viewerLink}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
