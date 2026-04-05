import { createElement, useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";

import { resolvePlayableVideoUrl } from "@/lib/local-video-assets";
import { buildYouTubeEmbedUrl } from "@/lib/video-links";

interface VideoPlayerSurfaceProps {
  videoUrl: string;
  title: string;
}

export function VideoPlayerSurface({ videoUrl, title }: VideoPlayerSurfaceProps) {
  const [playbackUrl, setPlaybackUrl] = useState<string>("");
  const [resolved, setResolved] = useState(false);
  const embedUrl = buildYouTubeEmbedUrl(videoUrl);

  useEffect(() => {
    let active = true;
    let objectUrlToRevoke = "";

    async function load() {
      setResolved(false);
      setPlaybackUrl("");
      const nextUrl = await resolvePlayableVideoUrl(videoUrl);

      if (!active) {
        if (nextUrl.startsWith("blob:")) {
          URL.revokeObjectURL(nextUrl);
        }
        return;
      }

      objectUrlToRevoke = nextUrl.startsWith("blob:") ? nextUrl : "";
      setPlaybackUrl(nextUrl);
      setResolved(true);
    }

    void load();

    return () => {
      active = false;

      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [videoUrl]);

  if (Platform.OS !== "web") {
    return (
      <View
        className="items-center justify-center rounded-[20px] border px-5 py-10"
        style={{
          minHeight: 260,
          backgroundColor: "rgba(255,255,255,0.04)",
          borderColor: "rgba(255,255,255,0.10)",
        }}
      >
        <Text style={{ color: "#F3F7FF", fontSize: 18, fontWeight: "800", textAlign: "center" }}>
          Visualização disponível no navegador
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: "#AEBBDA",
            fontSize: 14,
            lineHeight: 22,
            textAlign: "center",
          }}
        >
          O painel consegue reproduzir os vídeos importados diretamente na versão web.
        </Text>
      </View>
    );
  }

  if (!playbackUrl) {
    return (
      <View
        className="items-center justify-center rounded-[20px] border px-5 py-10"
        style={{
          minHeight: 260,
          backgroundColor: "rgba(255,255,255,0.04)",
          borderColor: "rgba(255,255,255,0.10)",
        }}
      >
        <Text style={{ color: "#F3F7FF", fontSize: 16, fontWeight: "800", textAlign: "center" }}>
          {resolved ? "Video indisponivel" : "Carregando video"}
        </Text>
        {resolved ? (
          <Text
            style={{
              marginTop: 8,
              color: "#AEBBDA",
              fontSize: 14,
              lineHeight: 22,
              textAlign: "center",
            }}
          >
            O arquivo original nao esta acessivel neste aparelho. Use uma URL publica para compartilhar a reproducao.
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={{
        overflow: "hidden",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        backgroundColor: "#04070D",
      }}
    >
      {embedUrl
        ? createElement("iframe", {
            src: embedUrl,
            title,
            allow:
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
            allowFullScreen: true,
            referrerPolicy: "strict-origin-when-cross-origin",
            style: {
              display: "block",
              width: "100%",
              aspectRatio: "16 / 9",
              border: "none",
              backgroundColor: "#000000",
            },
          })
        : createElement("video", {
            src: playbackUrl,
            controls: true,
            playsInline: true,
            preload: "metadata",
            "aria-label": title,
            style: {
              display: "block",
              width: "100%",
              maxHeight: "70vh",
              backgroundColor: "#000000",
            },
          })}
    </View>
  );
}
