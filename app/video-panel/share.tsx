import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { BackButton } from "@/components/ui/BackButton";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  parseSharedVideoPanelAccess,
  parseVideoPanelSharePayload,
} from "@/lib/video-panel-sharing";
import { useAppStore } from "@/stores/app-store";
import { useVideoStore } from "@/stores/video-store";
import { useArenaDataHydrated } from "@/stores/use-arena-hydration";

export default function VideoPanelShareScreen() {
  const params = useLocalSearchParams<{
    access?: string | string[];
    data?: string | string[];
  }>();
  const hydrated = useArenaDataHydrated();
  const importarPainelGlobalCompartilhado = useVideoStore(
    (state) => state.importarPainelGlobalCompartilhado,
  );
  const setVideoPanelAccessMode = useAppStore((state) => state.setVideoPanelAccessMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const importStartedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || importStartedRef.current) {
      return;
    }

    importStartedRef.current = true;
    setErrorMessage(null);

    const accessMode = parseSharedVideoPanelAccess(params.access);
    const payload = parseVideoPanelSharePayload(params.data);

    if (!accessMode || !payload) {
      setErrorMessage("O link compartilhado do painel de videos esta incompleto ou invalido.");
      importStartedRef.current = false;
      return;
    }

    importarPainelGlobalCompartilhado({
      videos: payload.videos,
      voterPhones: payload.voterPhones,
      votesByPhone: payload.votesByPhone,
      votingClosed: payload.votingClosed,
      votingClosedAt: payload.votingClosedAt,
      winningVideoId: payload.winningVideoId,
    });
    setVideoPanelAccessMode(accessMode);

    setTimeout(() => {
      router.replace("/videos");
    }, 0);
  }, [
    hydrated,
    importarPainelGlobalCompartilhado,
    params.access,
    params.data,
    setVideoPanelAccessMode,
  ]);

  if (!hydrated) {
    return (
      <Screen scroll className="px-6" ambientDiamond>
        <View className="gap-6 py-8">
          <ScreenState
            title="Carregando painel"
            description="Preparando o painel compartilhado de videos."
            tone="dark"
          />
        </View>
      </Screen>
    );
  }

  if (errorMessage) {
    return (
      <Screen scroll className="px-6" ambientDiamond>
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/videos" />
          <SectionHeader
            eyebrow="Painel compartilhado"
            title="Link invalido"
            subtitle="Nao foi possivel abrir o painel compartilhado de videos."
          />
          <ScreenState
            title="Compartilhamento indisponivel"
            description={errorMessage}
            tone="dark"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll className="px-6" ambientDiamond>
      <View className="gap-6 py-8">
        <SectionHeader
          eyebrow="Painel compartilhado"
          title="Abrindo videos"
          subtitle="Importando o painel compartilhado e aplicando o modo correto de acesso."
        />
        <ScreenState
          title="Redirecionando"
          description="Voce sera levado ao painel de videos em alguns instantes."
          tone="dark"
        />
      </View>
    </Screen>
  );
}
