import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { MUSIC_TRACKS } from "@/lib/music-tracks";

export type MusicPlayMode = "favorite" | "random";

type MusicStore = {
  enabled: boolean;
  selectedTrackId: string | null;
  volume: number;
  isPlaying: boolean;
  playMode: MusicPlayMode;
  setEnabled: (v: boolean) => void;
  setSelectedTrackId: (v: string | null) => void;
  setVolume: (v: number) => void;
  setIsPlaying: (v: boolean) => void;
  setPlayMode: (v: MusicPlayMode) => void;
};

export const useMusicStore = create<MusicStore>()(
  persist(
    (set) => ({
      enabled: true,
      selectedTrackId: MUSIC_TRACKS[0]?.id ?? null,
      volume: 0.4,
      isPlaying: false,
      playMode: "favorite",
      setEnabled: (enabled) => set({ enabled }),
      setSelectedTrackId: (selectedTrackId) => set({ selectedTrackId }),
      setVolume: (volume) => set({ volume }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setPlayMode: (playMode) => set({ playMode }),
    }),
    {
      name: "arena-music",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        selectedTrackId: state.selectedTrackId,
        volume: state.volume,
        playMode: state.playMode,
      }),
    },
  ),
);
