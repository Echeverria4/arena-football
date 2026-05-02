import { getMusicStatus, pauseMusic, playTrack, resumeMusic, stopMusic } from "@/lib/music-player";
import { MUSIC_TRACKS } from "@/lib/music-tracks";
import { useMusicStore } from "@/stores/music-store";

function pickRandomTrackId(currentId: string | null): string | null {
  if (MUSIC_TRACKS.length === 0) return null;
  if (MUSIC_TRACKS.length === 1) return MUSIC_TRACKS[0]!.id;
  const others = MUSIC_TRACKS.filter((t) => t.id !== currentId);
  const pool = others.length > 0 ? others : MUSIC_TRACKS;
  return pool[Math.floor(Math.random() * pool.length)]!.id;
}

export function useMusicTrigger() {
  const enabled = useMusicStore((s) => s.enabled);
  const selectedTrackId = useMusicStore((s) => s.selectedTrackId);
  const volume = useMusicStore((s) => s.volume);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const playMode = useMusicStore((s) => s.playMode);
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying);
  const setSelectedTrackId = useMusicStore((s) => s.setSelectedTrackId);

  async function triggerStart() {
    if (!enabled || MUSIC_TRACKS.length === 0) return;
    // Already playing — don't restart mid-song
    if (isPlaying) return;

    if (playMode === "random") {
      // Always pick a fresh random track each time music starts
      const nextId = pickRandomTrackId(selectedTrackId);
      if (!nextId) return;
      await playTrack(nextId, volume);
      setSelectedTrackId(nextId);
    } else {
      // Favorite: resume if paused, start selected track if stopped
      const trackId = selectedTrackId ?? MUSIC_TRACKS[0]?.id;
      if (!trackId) return;
      const { isLoaded, currentTrackId } = getMusicStatus();
      if (isLoaded && currentTrackId === trackId) {
        await resumeMusic();
      } else {
        await playTrack(trackId, volume);
      }
    }

    setIsPlaying(true);
  }

  async function togglePlayPause() {
    if (!enabled || MUSIC_TRACKS.length === 0) return;
    if (isPlaying) {
      await pauseMusic();
      setIsPlaying(false);
    } else {
      const { isLoaded, currentTrackId } = getMusicStatus();
      const trackId = selectedTrackId ?? MUSIC_TRACKS[0]?.id;
      if (!trackId) return;
      if (isLoaded && currentTrackId === trackId) {
        await resumeMusic();
      } else {
        await playTrack(trackId, volume);
      }
      setIsPlaying(true);
    }
  }

  async function stop() {
    await stopMusic();
    setIsPlaying(false);
  }

  return { triggerStart, togglePlayPause, stop };
}
