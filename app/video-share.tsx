import { useLocalSearchParams } from "expo-router";
import { Linking, Text, View } from "react-native";

import { VideoPlayerSurface } from "@/components/videos/VideoPlayerSurface";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { isRemoteVideoUrl, normalizePublicVideoUrl } from "@/lib/video-links";
import { parseVideoSharePayload } from "@/lib/video-sharing";

export default function VideoShareScreen() {
  const params = useLocalSearchParams<{ data?: string | string[] }>();
  const sharedVideo = parseVideoSharePayload(params.data);
  const publicVideoUrl = normalizePublicVideoUrl(sharedVideo?.videoUrl);
  const canOpenOriginalSource = Boolean(publicVideoUrl);
  const isLocalOnlyVideo = sharedVideo ? !isRemoteVideoUrl(sharedVideo.videoUrl) : false;

  if (!sharedVideo) {
    return (
      <Screen scroll className="px-6" ambientDiamond>
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/videos" />
          <ScreenState
            title="Link inválido"
            description="Este link de vídeo está incompleto ou não pode mais ser aberto."
            tone="dark"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll className="px-6" ambientDiamond>
      <View className="mx-auto w-full max-w-[980px] gap-6 py-8">
        <BackButton fallbackHref="/videos" />

        <SectionHeader
          eyebrow="Vídeo compartilhado"
          title={sharedVideo.title}
          subtitle={
            isLocalOnlyVideo
              ? "Este link foi gerado a partir de um arquivo importado localmente. A página abre, mas a reprodução completa depende do navegador onde o arquivo original foi salvo."
              : "Abra o vídeo abaixo e compartilhe esta mesma página com os jogadores que precisam assistir."
          }
        />

        <View
          className="gap-5 rounded-[26px] border p-5"
          style={{
            backgroundColor: "rgba(7,12,22,0.86)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <VideoPlayerSurface videoUrl={sharedVideo.videoUrl} title={sharedVideo.title} />

          <View className="gap-2">
            <Text style={{ color: "#F3F7FF", fontSize: 28, fontWeight: "900" }}>
              {sharedVideo.title}
            </Text>
            {sharedVideo.description ? (
              <Text style={{ color: "#AEBBDA", fontSize: 15, lineHeight: 24 }}>
                {sharedVideo.description}
              </Text>
            ) : null}
          </View>

          <View className="flex-row flex-wrap gap-3">
            <View
              className="rounded-full border px-3 py-2"
              style={{
                borderColor: "rgba(255,255,255,0.10)",
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              <Text
                style={{
                  color: "#DDE7FF",
                  fontSize: 11,
                  fontWeight: "900",
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                }}
              >
                {sharedVideo.viewsCount ?? 0} visualizações
              </Text>
            </View>

            <View
              className="rounded-full border px-3 py-2"
              style={{
                borderColor: "rgba(255,255,255,0.10)",
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              <Text
                style={{
                  color: "#DDE7FF",
                  fontSize: 11,
                  fontWeight: "900",
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                }}
              >
                {sharedVideo.votesCount} votos
              </Text>
            </View>

            {sharedVideo.teamName ? (
              <View
                className="rounded-full border px-3 py-2"
                style={{
                  borderColor: "rgba(90,124,255,0.22)",
                  backgroundColor: "rgba(90,124,255,0.12)",
                }}
              >
                <Text
                  style={{
                    color: "#C8D6FF",
                    fontSize: 11,
                    fontWeight: "900",
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                  }}
                >
                  {sharedVideo.teamName}
                </Text>
              </View>
            ) : null}
          </View>

          {canOpenOriginalSource ? (
            <PrimaryButton
              label="Abrir vídeo original"
              onPress={() => {
                if (publicVideoUrl) {
                  void Linking.openURL(publicVideoUrl);
                }
              }}
              variant="light"
              className="self-start"
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
