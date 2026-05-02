import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useMusicTrigger } from "@/hooks/useMusicTrigger";
import { MUSIC_TRACKS } from "@/lib/music-tracks";
import { useMusicStore } from "@/stores/music-store";

export function FloatingMusicPlayer() {
  const [expanded, setExpanded] = useState(false);

  const enabled = useMusicStore((s) => s.enabled);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const selectedTrackId = useMusicStore((s) => s.selectedTrackId);
  const { togglePlayPause, playNext, playPrev } = useMusicTrigger();

  if (!enabled || MUSIC_TRACKS.length === 0) return null;

  const currentTrack =
    MUSIC_TRACKS.find((t) => t.id === selectedTrackId) ?? MUSIC_TRACKS[0];

  return (
    <>
      {/* Transparent backdrop — collapses the player on outside tap */}
      {expanded && (
        <Pressable
          onPress={() => setExpanded(false)}
          style={{ position: "absolute", inset: 0, zIndex: 58 } as never}
        />
      )}

      <View
        style={{
          position: "absolute",
          bottom: 96,
          right: 14,
          zIndex: 60,
          alignItems: "flex-end",
        }}
        pointerEvents="box-none"
      >
        {expanded ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(8,4,20,0.96)",
              borderWidth: 1,
              borderColor: "rgba(139,92,246,0.50)",
              borderRadius: 999,
              paddingVertical: 8,
              paddingLeft: 14,
              paddingRight: 10,
              shadowColor: "#8B5CF6",
              shadowOpacity: 0.40,
              shadowRadius: 18,
            }}
          >
            {/* Prev */}
            <Pressable
              onPress={() => { void playPrev(); }}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <Ionicons name="play-skip-back" size={17} color="#A78BFA" />
            </Pressable>

            {/* Track name */}
            <Text
              numberOfLines={1}
              style={{
                color: "#DDE6FF",
                fontSize: 12,
                fontWeight: "700",
                maxWidth: 150,
              }}
            >
              {currentTrack?.name ?? ""}
            </Text>

            {/* Play / Pause */}
            <Pressable
              onPress={() => { void togglePlayPause(); }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isPlaying
                  ? "rgba(139,92,246,0.28)"
                  : "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: isPlaying
                  ? "rgba(139,92,246,0.65)"
                  : "rgba(255,255,255,0.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={16}
                color={isPlaying ? "#C4B5FD" : "#94A3B8"}
              />
            </Pressable>

            {/* Next */}
            <Pressable
              onPress={() => { void playNext(); }}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <Ionicons name="play-skip-forward" size={17} color="#A78BFA" />
            </Pressable>

            {/* Collapse button */}
            <Pressable
              onPress={() => setExpanded(false)}
              hitSlop={8}
              style={{ padding: 4, marginLeft: 2 }}
            >
              <Ionicons name="chevron-down" size={15} color="#4A5568" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setExpanded(true)}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: isPlaying
                ? "rgba(139,92,246,0.22)"
                : "rgba(16,10,32,0.88)",
              borderWidth: 1.5,
              borderColor: isPlaying
                ? "rgba(139,92,246,0.60)"
                : "rgba(255,255,255,0.14)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: isPlaying ? "#8B5CF6" : "transparent",
              shadowOpacity: 0.55,
              shadowRadius: 14,
            }}
          >
            <Ionicons
              name={isPlaying ? "musical-notes" : "musical-notes-outline"}
              size={19}
              color={isPlaying ? "#C4B5FD" : "#6B7EA3"}
            />
          </Pressable>
        )}
      </View>
    </>
  );
}
