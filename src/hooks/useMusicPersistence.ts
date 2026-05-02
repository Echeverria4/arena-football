import { useEffect } from "react";
import { usePathname } from "expo-router";

import { getMusicStatus, playTrack, resumeMusic } from "@/lib/music-player";
import { useMusicStore } from "@/stores/music-store";

// Secondary safety net: after any SPA navigation, verifies the audio is actually
// playing when the store says it should be. The primary guard is the
// setOnPlaybackStatusUpdate callback in music-player.ts; this handles cases
// where the callback hasn't fired yet (e.g., fresh AudioContext after navigation).
export function useMusicPersistence() {
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      const { enabled, isPlaying, selectedTrackId, volume } = useMusicStore.getState();
      if (!enabled || !isPlaying) return;

      // _isPlaying in getMusicStatus is kept in sync by the status callback,
      // so by 300ms post-navigation it should reflect the real audio state.
      const status = getMusicStatus();
      if (status.isPlaying) return;

      const trackId = selectedTrackId ?? null;
      if (!trackId) return;

      if (status.isLoaded && status.currentTrackId === trackId) {
        void resumeMusic();
      } else {
        void playTrack(trackId, volume);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);
}
