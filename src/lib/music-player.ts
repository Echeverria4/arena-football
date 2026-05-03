import { Platform } from "react-native";
import { Audio, type AVPlaybackStatus } from "expo-av";
import { Asset } from "expo-asset";

import { MUSIC_TRACKS } from "./music-tracks";
import { useMusicStore } from "@/stores/music-store";

// ── Shared state ──────────────────────────────────────────────────────────

let _currentTrackId: string | null = null;
let _volume = 0.4;
let _isPlaying = false;
// True when the user intends audio to be playing (not explicitly paused/stopped).
let _shouldBePlaying = false;

function _pickNextTrackId(): string | null {
  if (MUSIC_TRACKS.length === 0) return null;
  const { playMode, selectedTrackId } = useMusicStore.getState();
  if (playMode === "favorite") return selectedTrackId ?? _currentTrackId;
  const others = MUSIC_TRACKS.filter((t) => t.id !== _currentTrackId);
  const pool = others.length > 0 ? others : MUSIC_TRACKS;
  return pool[Math.floor(Math.random() * pool.length)]!.id;
}

function _advanceToNext() {
  const nextId = _pickNextTrackId();
  if (!nextId) return;
  void playTrack(nextId, _volume).then(() => {
    const store = useMusicStore.getState();
    store.setSelectedTrackId(nextId);
    store.setIsPlaying(true);
  });
}

// ── Web implementation (HTMLAudioElement) ─────────────────────────────────
// expo-av's web wrapper has known issues during SPA navigation: it can
// silently pause the audio after a route change. Using the native
// HTMLAudioElement directly avoids the entire expo-av web layer.

let _webAudio: HTMLAudioElement | null = null;
let _webAudioCleanup: (() => void) | null = null;

async function _resolveWebUrl(source: unknown): Promise<string | null> {
  try {
    const asset = Asset.fromModule(source as number);
    if (asset.uri) return asset.uri;
    await asset.downloadAsync();
    return asset.localUri ?? asset.uri ?? null;
  } catch {
    return null;
  }
}

function _mountWebAudio(audio: HTMLAudioElement) {
  function onPause() {
    if (audio !== _webAudio) return;
    _isPlaying = false;
    // Resume only if browser paused unexpectedly (not when track ends).
    // The 'pause' event does NOT fire on natural track end (ended fires instead).
    if (_shouldBePlaying) {
      void audio.play().catch(() => {});
    }
  }

  function onEnded() {
    if (audio !== _webAudio) return;
    _isPlaying = false;
    if (_shouldBePlaying) _advanceToNext();
  }

  function onPlay() {
    if (audio !== _webAudio) return;
    _isPlaying = true;
  }

  audio.addEventListener("pause", onPause);
  audio.addEventListener("ended", onEnded);
  audio.addEventListener("play", onPlay);

  _webAudioCleanup = () => {
    audio.removeEventListener("pause", onPause);
    audio.removeEventListener("ended", onEnded);
    audio.removeEventListener("play", onPlay);
  };
}

function _teardownWebAudio() {
  _webAudioCleanup?.();
  _webAudioCleanup = null;
  if (_webAudio) {
    _webAudio.pause();
    _webAudio.src = "";
    _webAudio = null;
  }
}

// ── Native implementation (expo-av) ───────────────────────────────────────

let _sound: Audio.Sound | null = null;

function _onNativeStatus(status: AVPlaybackStatus) {
  if (!status.isLoaded) return;
  _isPlaying = status.isPlaying;
  if (!_shouldBePlaying) return;
  if (status.didJustFinish) {
    _advanceToNext();
  } else if (!status.isPlaying) {
    void _sound?.playAsync().catch(() => {});
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export async function playTrack(trackId: string, volume?: number) {
  const track = MUSIC_TRACKS.find((t) => t.id === trackId);
  if (!track) return;

  if (volume !== undefined) _volume = Math.max(0, Math.min(1, volume));
  _shouldBePlaying = true;
  _isPlaying = false;

  if (Platform.OS === "web") {
    _teardownWebAudio();

    const url = await _resolveWebUrl(track.source);
    if (!url) {
      _shouldBePlaying = false;
      console.warn("[music-player] could not resolve URL for", trackId);
      return;
    }

    const audio = new (globalThis as any).Audio(url) as HTMLAudioElement;
    audio.volume = _volume;
    audio.loop = false;
    _mountWebAudio(audio);

    try {
      await audio.play();
      _webAudio = audio;
      _currentTrackId = trackId;
      _isPlaying = true;
    } catch (e) {
      _teardownWebAudio();
      _shouldBePlaying = false;
      console.warn("[music-player] web play error:", e);
    }
  } else {
    try {
      if (_sound) {
        _sound.setOnPlaybackStatusUpdate(null);
        await _sound.unloadAsync();
        _sound = null;
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(track.source, {
        shouldPlay: true,
        isLooping: false,
        volume: _volume,
      });
      _sound = sound;
      _currentTrackId = trackId;
      _isPlaying = true;
      sound.setOnPlaybackStatusUpdate(_onNativeStatus);
    } catch (e) {
      _shouldBePlaying = false;
      console.warn("[music-player] native playTrack error:", e);
    }
  }
}

/**
 * Play an arbitrary URI (local file or data:) without requiring a catalog entry.
 * Used for per-tournament custom soundtracks.
 */
export async function playUri(uri: string, volume?: number) {
  if (volume !== undefined) _volume = Math.max(0, Math.min(1, volume));
  _shouldBePlaying = true;
  _isPlaying = false;
  _currentTrackId = null;

  if (Platform.OS === "web") {
    _teardownWebAudio();
    const audio = new (globalThis as any).Audio(uri) as HTMLAudioElement;
    audio.volume = _volume;
    audio.loop = true;
    _mountWebAudio(audio);
    try {
      await audio.play();
      _webAudio = audio;
      _isPlaying = true;
    } catch (e) {
      _teardownWebAudio();
      _shouldBePlaying = false;
    }
  } else {
    try {
      if (_sound) {
        _sound.setOnPlaybackStatusUpdate(null);
        await _sound.unloadAsync();
        _sound = null;
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: true, volume: _volume },
      );
      _sound = sound;
      _isPlaying = true;
      sound.setOnPlaybackStatusUpdate(_onNativeStatus);
    } catch (e) {
      _shouldBePlaying = false;
    }
  }
}

export async function pauseMusic() {
  _shouldBePlaying = false;
  if (Platform.OS === "web") {
    _webAudio?.pause();
  } else {
    try { await _sound?.pauseAsync(); } catch {}
  }
  _isPlaying = false;
}

export async function resumeMusic() {
  _shouldBePlaying = true;
  if (Platform.OS === "web") {
    try {
      await _webAudio?.play();
      _isPlaying = true;
    } catch {}
  } else {
    try {
      await _sound?.playAsync();
      _isPlaying = true;
    } catch {}
  }
}

export async function stopMusic() {
  _shouldBePlaying = false;
  if (Platform.OS === "web") {
    _teardownWebAudio();
  } else {
    try {
      if (_sound) {
        _sound.setOnPlaybackStatusUpdate(null);
        await _sound.stopAsync();
        await _sound.unloadAsync();
      }
    } catch {}
    _sound = null;
  }
  _currentTrackId = null;
  _isPlaying = false;
}

export async function setMusicVolume(volume: number) {
  _volume = Math.max(0, Math.min(1, volume));
  if (Platform.OS === "web") {
    if (_webAudio) _webAudio.volume = _volume;
  } else {
    try { await _sound?.setVolumeAsync(_volume); } catch {}
  }
}

export function getMusicStatus() {
  return {
    currentTrackId: _currentTrackId,
    isLoaded: Platform.OS === "web" ? _webAudio !== null : _sound !== null,
    isPlaying: _isPlaying,
  };
}
