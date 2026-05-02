import { Audio } from "expo-av";

import { MUSIC_TRACKS } from "./music-tracks";

let _sound: Audio.Sound | null = null;
let _currentTrackId: string | null = null;
let _volume = 0.4;

export async function playTrack(trackId: string, volume?: number) {
  const track = MUSIC_TRACKS.find((t) => t.id === trackId);
  if (!track) return;

  if (volume !== undefined) _volume = Math.max(0, Math.min(1, volume));

  try {
    if (_sound) {
      await _sound.unloadAsync();
      _sound = null;
    }
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(track.source, {
      shouldPlay: true,
      isLooping: true,
      volume: _volume,
    });
    _sound = sound;
    _currentTrackId = trackId;
  } catch (e) {
    console.warn("[music-player] playTrack error:", e);
  }
}

export async function pauseMusic() {
  try { await _sound?.pauseAsync(); } catch {}
}

export async function resumeMusic() {
  try { await _sound?.playAsync(); } catch {}
}

export async function stopMusic() {
  try {
    await _sound?.stopAsync();
    await _sound?.unloadAsync();
  } catch {}
  _sound = null;
  _currentTrackId = null;
}

export async function setMusicVolume(volume: number) {
  _volume = Math.max(0, Math.min(1, volume));
  try { await _sound?.setVolumeAsync(_volume); } catch {}
}

export function getMusicStatus() {
  return { currentTrackId: _currentTrackId, isLoaded: _sound !== null };
}
