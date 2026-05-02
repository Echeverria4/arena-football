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
  const playMode = useMusicStore((s) => s.playMode);
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying);
  const setSelectedTrackId = useMusicStore((s) => s.setSelectedTrackId);
  const setPlayMode = useMusicStore((s) => s.setPlayMode);

  async function triggerStart() {
    if (!enabled || MUSIC_TRACKS.length === 0) return;
    if (getMusicStatus().isPlaying) return;

    if (playMode === "random") {
      const nextId = pickRandomTrackId(selectedTrackId);
      if (!nextId) return;
      await playTrack(nextId, volume);
      setSelectedTrackId(nextId);
    } else {
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
    const { isPlaying: actuallyPlaying } = getMusicStatus();
    if (actuallyPlaying) {
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

  async function playNext() {
    if (MUSIC_TRACKS.length === 0) return;
    const idx = MUSIC_TRACKS.findIndex((t) => t.id === selectedTrackId);
    const nextId = MUSIC_TRACKS[(idx + 1) % MUSIC_TRACKS.length]!.id;
    await playTrack(nextId, volume);
    setSelectedTrackId(nextId);
    setPlayMode("favorite");
    setIsPlaying(true);
  }

  async function playPrev() {
    if (MUSIC_TRACKS.length === 0) return;
    const idx = MUSIC_TRACKS.findIndex((t) => t.id === selectedTrackId);
    const prevId = MUSIC_TRACKS[(idx - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length]!.id;
    await playTrack(prevId, volume);
    setSelectedTrackId(prevId);
    setPlayMode("favorite");
    setIsPlaying(true);
  }

  async function stop() {
    await stopMusic();
    setIsPlaying(false);
  }

  return { triggerStart, togglePlayPause, playNext, playPrev, stop };
}
