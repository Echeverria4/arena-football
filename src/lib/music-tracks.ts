// Registro de músicas disponíveis no app.
// Veja assets/music/COMO_ADICIONAR.md para instruções.

export type MusicTrack = {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'Dark_Angel',                name: 'Dark Angel',                   source: require('../../assets/music/Dark_Angel.mp3') },
];
