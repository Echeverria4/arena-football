// Registro de músicas disponíveis no app.
// Veja assets/music/COMO_ADICIONAR.md para instruções.

export type MusicTrack = {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'adele_skyfall',               name: 'Adele — Skyfall',                          source: require('../../assets/music/Adele_Skyfall.mp3') },
  { id: 'bon_jovi_prayer',             name: "Bon Jovi — Livin' On a Prayer",             source: require('../../assets/music/Bon_Jovi_Livin_On_a_Prayer.mp3') },
  { id: 'bye_bye_bye',                 name: '*NSYNC — Bye Bye Bye (Deadpool)',            source: require('../../assets/music/bye_bye_bye_NSYNC_(deadpool).mp3') },
  { id: 'counting_crows_accidentally', name: 'Counting Crows — Accidentally in Love',     source: require('../../assets/music/Counting_Crows_Accidentally_in_Love.mp3') },
  { id: 'dreamers',                    name: 'Savoir Adore — Dreamers',                   source: require('../../assets/music/dreamers.mp3') },
  { id: 'el_bombon',                   name: 'El Bombón',                                 source: require('../../assets/music/El_Bombon.mp3') },
  { id: 'elvis_cant_help',             name: "Elvis Presley — Can't Help Falling in Love", source: require('../../assets/music/Elvis_Presley_Cant_Help_Falling_In_Love.mp3') },
  { id: 'eminem_lose_yourself',        name: 'Eminem — Lose Yourself',                    source: require('../../assets/music/Eminem_Lose_Yourself.mp3') },
  { id: 'ghost_way_down',              name: 'Ghost — Way Down We Go',                    source: require('../../assets/music/Ghost_Way_Down_We_Go.mp3') },
  { id: 'imagine_dragons_bones',       name: 'Imagine Dragons — Bones',                   source: require('../../assets/music/Imagine_Dragons_Bones.mp3') },
  { id: 'imagine_dragons_natural',     name: 'Imagine Dragons — Natural',                 source: require('../../assets/music/Imagine_Dragons_Natural.mp3') },
  { id: 'imagine_dragons_radioactive', name: 'Imagine Dragons — Radioactive',             source: require('../../assets/music/Imagine_Dragons_Radioactive.mp3') },
  { id: 'joy_crookes_hurts',           name: 'Joy Crookes — Hurts',                       source: require('../../assets/music/Joy_Crookes_Hurts_Lyrics.mp3') },
  { id: 'legend_never_die',            name: 'Legend Never Die',                          source: require('../../assets/music/Legend_Never_Die.mp3') },
  { id: 'love_again',                  name: 'Love Again',                                source: require('../../assets/music/Love_Again.mp3') },
  { id: 'nelly_furtado_say_it_right',  name: 'Nelly Furtado — Say It Right',              source: require('../../assets/music/Nelly_Furtado_Say_It_Right.mp3') },
  { id: 'numb_linkin_park',            name: 'Linkin Park — Numb',                        source: require('../../assets/music/Numb_Linkin_Park.mp3') },
  { id: 'ragnbone_human',              name: "Rag'n'Bone Man — Human",                    source: require('../../assets/music/RagnBone_Man_Human.mp3') },
  { id: 'twenty_one_pilots_heathens',  name: 'Twenty One Pilots — Heathens',              source: require('../../assets/music/twenty_one_pilots_Heathens.mp3') },
  { id: 'virtual_diva',                name: 'Don Omar — Virtual Diva',                   source: require('../../assets/music/virtual_diva_don_omar.mp3') },
];
