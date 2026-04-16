import { ResizeMode, Video } from "expo-av";
import { createElement, useEffect, useRef, useState } from "react";
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
  const videoRef = useRef<Video>(null);
  const embedUrl = Platform.OS === "web" ? buildYouTubeEmbedUrl(videoUrl) : null;

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

  // ── Native playback (expo-av) ──────────────────────────────────────────────
  if (Platform.OS !== "web") {
    if (!playbackUrl) {
      return (
        <View
          style={{
            minHeight: 200,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            backgroundColor: "rgba(255,255,255,0.04)",
            paddingHorizontal: 20,
            paddingVertical: 32,
          }}
        >
          <Text style={{ color: "#F3F7FF", fontSize: 15, fontWeight: "700", textAlign: "center" }}>
            {resolved ? "Vídeo indisponível" : "Carregando vídeo..."}
          </Text>
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
        <Video
          ref={videoRef}
          source={{ uri: playbackUrl }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          style={{ width: "100%", aspectRatio: 16 / 9 }}
          accessibilityLabel={title}
        />
      </View>
    );
  }

  // ── Web: loading / error state ─────────────────────────────────────────────
  if (!playbackUrl) {
    return (
      <View
        style={{
          minHeight: 260,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          backgroundColor: "rgba(255,255,255,0.04)",
          paddingHorizontal: 20,
          paddingVertical: 40,
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

  // ── Web: YouTube iframe or HTML5 video ─────────────────────────────────────
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
