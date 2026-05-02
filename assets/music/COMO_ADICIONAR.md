# Como adicionar músicas

## Pasta
Coloque seus arquivos `.mp3` aqui:
```
Arena/assets/music/
```

## Nomes sugeridos
```
arena_theme.mp3
tournament_bg.mp3
victory_theme.mp3
battle_theme.mp3
```

## Após adicionar o arquivo
Abra o arquivo `src/lib/music-tracks.ts` e registre a música:

```ts
export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'arena_theme',
    name: 'Arena Theme',
    source: require('../../assets/music/arena_theme.mp3'),
  },
  // adicione mais aqui
];
```

## Formatos suportados
- `.mp3` (recomendado)
- `.m4a`
- `.wav`
