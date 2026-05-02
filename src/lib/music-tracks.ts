// Registro de músicas disponíveis no app.
// Veja assets/music/COMO_ADICIONAR.md para instruções.

export type MusicTrack = {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  // Exemplo — descomente após adicionar o arquivo .mp3:
  // { id: 'arena_theme', name: 'Arena Theme', source: require('../../assets/music/arena_theme.mp3') },
];
