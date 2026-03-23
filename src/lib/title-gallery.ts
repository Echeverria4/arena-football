import { generatedClubContinentalNodes, generatedClubNationalNodes } from "@/lib/futbox-generated";

export type TitleMode = "clubs" | "national-teams";

export interface TitleGalleryItem {
  id: string;
  title: string;
  season: string;
  imageUrl: string;
}

export interface TitleGalleryNode {
  id: string;
  label: string;
  subtitle: string;
  items?: TitleGalleryItem[];
  children?: TitleGalleryNode[];
}

const clubWorldItems: TitleGalleryItem[] = [
  {
    id: "club-super-world-cup-2025",
    title: "Copa do Mundo de Super Clubes",
    season: "2025",
    imageUrl: "https://www.futbox.com/img/v1/541/b9d/6d1/629/025c090efca7b11cf1c7.png",
  },
  {
    id: "club-fifa-intercontinental-2024",
    title: "Copa Intercontinental (FIFA)",
    season: "A partir de 2024",
    imageUrl: "https://www.futbox.com/img/v1/531/1ee/f71/470/0c41faee72f1c2288ca8.png",
  },
  {
    id: "club-world-cup-2005-2023",
    title: "Copa do Mundo de Clubes",
    season: "2005 - 2023",
    imageUrl: "https://www.futbox.com/img/v1/455/7d8/360/d80/5976514a156aaa4adbed.png",
  },
  {
    id: "club-world-cup-2000",
    title: "Copa do Mundo de Clubes",
    season: "2000",
    imageUrl: "https://www.futbox.com/img/v1/5e3/cee/c7c/f36/7ab885b484f2173e066a.png",
  },
  {
    id: "club-europe-south-america-1980-2004",
    title: "Copa Europeia - Sul-Americana",
    season: "1980 - 2004",
    imageUrl: "https://www.futbox.com/img/v1/62d/0e5/543/8c9/b0a8e8d93693577ea5c8.png",
  },
  {
    id: "club-intercontinental-1960-1979",
    title: "Copa Intercontinental (UEFA + Conmebol)",
    season: "1960 - 1979",
    imageUrl: "https://www.futbox.com/img/v1/ca3/6d6/eb6/efd/996feaab426620e2218b.png",
  },
  {
    id: "club-copa-rio-1952",
    title: "Copa Rio",
    season: "1952",
    imageUrl: "https://www.futbox.com/img/v1/1af/829/294/d6b/fa6febd5742bea754e38.png",
  },
  {
    id: "club-copa-rio-1951",
    title: "Copa Rio",
    season: "1951",
    imageUrl: "https://www.futbox.com/img/v1/e1d/8c0/3d1/a7d/d22ad0427acbdac7a554.png",
  },
  {
    id: "club-rivadavia-1953",
    title: "Taca Rivadavia Correa Meyer",
    season: "1953",
    imageUrl: "https://www.futbox.com/img/v1/8b4/c30/d96/b16/465a8abfcf9c40fbd366.png",
  },
  {
    id: "club-little-world-cup-1957",
    title: "Little World Cup",
    season: "1957",
    imageUrl: "https://www.futbox.com/img/v1/e42/f8b/781/af2/18be2eb2e80fea1641e9.png",
  },
  {
    id: "club-little-world-cup-1956",
    title: "Little World Cup",
    season: "1956",
    imageUrl: "https://www.futbox.com/img/v1/7a8/a25/afd/57f/2810618ec9ca82f2de03.png",
  },
  {
    id: "club-little-world-cup-1955",
    title: "Little World Cup",
    season: "1955",
    imageUrl: "https://www.futbox.com/img/v1/ce4/17f/b9e/4a9/7c88d7398c2e3820425f.png",
  },
  {
    id: "club-little-world-cup-1952-1953",
    title: "Little World Cup",
    season: "1952 - 1953",
    imageUrl: "https://www.futbox.com/img/v1/8d9/974/a7c/5a2/bddc9ff21f7870bb5309.png",
  },
  {
    id: "club-international-womens-club-championship",
    title: "International Women's Club Championship",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/587/cd5/0b6/258/673da390d3ac33f3090b.png",
  },
  {
    id: "club-torneio-interclubes-feminino",
    title: "Torneio Interclubes Feminino",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/6f4/14b/f5d/116/4d48830dfe318551b1f5.png",
  },
  {
    id: "club-recopa-intercontinental",
    title: "Recopa Intercontinental",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/ab7/c24/a6d/e5e/ebfeaa96777cac006f85.png",
  },
  {
    id: "club-challenger-cup",
    title: "Challenger Cup",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/5ae/b52/934/97b/a7baa6a86bb14d9b7408.png",
  },
  {
    id: "club-derby-of-the-americas",
    title: "Derby of the Americas",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/19d/81e/f3d/282/b8d9c5f75bd08008b335.png",
  },
  {
    id: "club-african-asian-pacific-cup",
    title: "African-Asian-Pacific Cup",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/2f8/b1d/d32/bd3/fba0ba21ee9e6898e7ad.png",
  },
  {
    id: "club-womens-champions-cup",
    title: "Women's Champions Cup",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/beb/a77/9d9/920/6e79491ba3df6d323a12.png",
  },
  {
    id: "club-copa-iberoamericana",
    title: "Copa Iberoamericana",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/e43/d0c/137/a69/23d0162c93419f447b9d.png",
  },
  {
    id: "club-torneo-de-la-ciudad-de-caracas",
    title: "Torneo de la Ciudad de Caracas",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/65b/c1f/a70/c3c/ddbeb756b20311addc73.png",
  },
  {
    id: "club-taca-olimpica",
    title: "Taça Olímpica",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/048/9ff/1da/b9b/df58fe38624c028eda83.png",
  },
  {
    id: "club-international-soccer-league",
    title: "International Soccer League",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/652/780/bb6/d5d/65742cd9772173afa98e.png",
  },
  {
    id: "club-trofeo-triangular-de-caracas",
    title: "Trofeo Triangular de Caracas",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/000/d01/9ab/f92/e6997f284fbf9cf93ad2.png",
  },
  {
    id: "club-torneio-internacional-charles-miller",
    title: "Torneio Internacional Charles Miller",
    season: "Clubes • Mundiais",
    imageUrl: "https://www.futbox.com/img/v1/477/9c2/6ec/f63/81350c481e0f2c610807.png",
  },
];

const nationalTeamWorldItems: TitleGalleryItem[] = [
  {
    id: "nt-world-cup-1974",
    title: "World Cup",
    season: "Desde 1974",
    imageUrl: "https://www.futbox.com/img/v1/698/67e/812/da1/879cd26dd2a6365b014b.png",
  },
  {
    id: "nt-jules-rimet",
    title: "Coupe Jules Rimet",
    season: "1950 - 1970 (Championnat du monde de football: 1930 - 1938)",
    imageUrl: "https://www.futbox.com/img/v1/025/919/383/63b/453b1775df517c5d4ed4.png",
  },
  {
    id: "nt-wwc-2015",
    title: "Women's World Cup",
    season: "Desde 2015",
    imageUrl: "https://www.futbox.com/img/v1/2ea/337/200/e77/2c814085f84d1674723b.png",
  },
  {
    id: "nt-wwc-1999-2011",
    title: "Women's World Cup",
    season: "1999 - 2011",
    imageUrl: "https://www.futbox.com/img/v1/edf/669/fdf/f7e/d17962d15efa9afbe0a2.png",
  },
  {
    id: "nt-wwc-1991-1995",
    title: "Women's World Cup",
    season: "1991 - 1995",
    imageUrl: "https://www.futbox.com/img/v1/404/69b/3c8/62c/5875e15f2f4ca5e98724.png",
  },
  {
    id: "nt-mundialito",
    title: "Copa de Oro (Mundialito)",
    season: "1980",
    imageUrl: "https://www.futbox.com/img/v1/b3e/c49/469/4f6/077505d2a50c6cc0d825.png",
  },
  {
    id: "nt-olympic-world-1928-a",
    title: "Tournoi mondial du football (Olympic Games)",
    season: "1928 (COI + FIFA)",
    imageUrl: "https://www.futbox.com/img/v1/332/2e5/163/d14/0448ec73ca5677e8e88f.png",
  },
  {
    id: "nt-olympic-world-1928-b",
    title: "Tournoi mondial du football (Olympic Games)",
    season: "1928 (COI + FIFA)",
    imageUrl: "https://www.futbox.com/img/v1/5b6/737/810/8f1/76232f3eb6268cd0a187.png",
  },
  {
    id: "nt-olympic-world-1928-c",
    title: "Tournoi mondial du football (Olympic Games)",
    season: "1928 (COI + FIFA)",
    imageUrl: "https://www.futbox.com/img/v1/107/acb/ba0/ac2/d0f56fb83d74999cca90.png",
  },
  {
    id: "nt-olympic-world-1924-a",
    title: "Tournoi mondial du football (Olympic Games)",
    season: "1924 (COI + FIFA)",
    imageUrl: "https://www.futbox.com/img/v1/327/e9d/df3/cbb/714732532f853d2f17ab.png",
  },
  {
    id: "nt-olympic-world-1924-b",
    title: "Tournoi mondial du football (Olympic Games)",
    season: "1924 (COI + FIFA)",
    imageUrl: "https://www.futbox.com/img/v1/589/c50/426/ab7/87e457d7dc506ca72b4f.png",
  },
  {
    id: "nt-olympic-world-1924-c",
    title: "Tournoi mondial du football (Olympic Games)",
    season: "1924 (COI + FIFA)",
    imageUrl: "https://www.futbox.com/img/v1/93e/86f/51f/400/78a551e11f5648e90a5e.png",
  },
  {
    id: "nt-confederations-cup",
    title: "Confederations Cup",
    season: "1997 - 2017",
    imageUrl: "https://www.futbox.com/img/v1/3d5/1d1/175/f14/0f7eacf1389d840ffbd5.png",
  },
  {
    id: "nt-king-fahd-cup",
    title: "King Fahd Cup",
    season: "1992, 1995",
    imageUrl: "https://www.futbox.com/img/v1/4fb/285/ee8/e4d/1ca7f8293b09399eae29.png",
  },
  {
    id: "nt-finalissima-men-2022",
    title: "Men's Finalissima",
    season: "Desde 2022 (Artemio Franchi Trophy)",
    imageUrl: "https://www.futbox.com/img/v1/65e/522/02c/6e5/c4346d252512d1acf736.png",
  },
  {
    id: "nt-finalissima-men-1985-1993",
    title: "Men's Finalissima",
    season: "1985, 1993 (Artemio Franchi Trophy)",
    imageUrl: "https://www.futbox.com/img/v1/8f6/a4c/458/942/4fce2c87e7ed913ed58a.png",
  },
  {
    id: "nt-finalissima-women",
    title: "Women's Finalissima",
    season: "Desde 2023",
    imageUrl: "https://www.futbox.com/img/v1/191/d1e/9f5/636/4ac037337e95e6a2c764.png",
  },
  {
    id: "nt-afro-asian-1997-2007",
    title: "Afro-Asian Cup of Nations",
    season: "1997, 2007",
    imageUrl: "https://www.futbox.com/img/v1/0c1/1e4/297/0d8/82b98582aef94f8e2d88.png",
  },
  {
    id: "nt-afro-asian-1985-1995",
    title: "Afro-Asian Cup of Nations",
    season: "1985 - 1995",
    imageUrl: "https://www.futbox.com/img/v1/c31/964/3cc/70c/0addd881d5ad2f9aa919.png",
  },
  {
    id: "nt-womens-world-championship",
    title: "Women's World Championship",
    season: "1970, 1971 (Coppa del Mondo Femminile | Mundial Femenil)",
    imageUrl: "https://www.futbox.com/img/v1/9b8/957/795/cb2/a67f5ee8d48d36d0fb94.png",
  },
  {
    id: "nt-international-womens-tournament",
    title: "International Women's Tournament",
    season: "1988",
    imageUrl: "https://www.futbox.com/img/v1/bed/b61/f48/cf1/6bf1c5501a55bf614427.png",
  },
  {
    id: "nt-calcio-femminile",
    title: "Calcio Femminile",
    season: "1981, 1984 - 1986, 1988",
    imageUrl: "https://www.futbox.com/img/v1/399/f83/586/c33/74f4243ef466c2f4c666.png",
  },
  {
    id: "nt-u20-men-2013",
    title: "U-20 Men's World Cup",
    season: "Desde 2013",
    imageUrl: "https://www.futbox.com/img/v1/7e2/9d4/fc1/9c8/c42a748065931392627c.png",
  },
  {
    id: "nt-u20-men-2003-2011",
    title: "U-20 Men's World Cup",
    season: "2003 - 2011",
    imageUrl: "https://www.futbox.com/img/v1/95d/077/f12/8d1/47a996cdd621cc3bab38.png",
  },
  {
    id: "nt-u20-men-1977-2001",
    title: "U-20 Men's World Cup",
    season: "1977 - 2001",
    imageUrl: "https://www.futbox.com/img/v1/73e/50e/185/5b7/b4e697aa9faf9357e670.png",
  },
  {
    id: "nt-u20-women-2002",
    title: "U-20 Women's World Cup",
    season: "Desde 2002",
    imageUrl: "https://www.futbox.com/img/v1/919/a02/ccc/5a0/86d923a1903909f185ed.png",
  },
  {
    id: "nt-u17-men-2005",
    title: "U-17 Men's World Cup",
    season: "Desde 2005",
    imageUrl: "https://www.futbox.com/img/v1/d87/129/5c0/81e/839344517b65e0fc9175.png",
  },
  {
    id: "nt-u17-men-1999-2003",
    title: "U-17 Men's World Cup",
    season: "1999 - 2003",
    imageUrl: "https://www.futbox.com/img/v1/6fd/425/26d/70d/d4270c51fc09d7ca61a8.png",
  },
  {
    id: "nt-u17-men-1985-1997",
    title: "U-17 Men's World Cup",
    season: "1985 - 1997",
    imageUrl: "https://www.futbox.com/img/v1/92c/6dc/cab/d3d/7a0dbf11fe4982bda9a4.png",
  },
  {
    id: "nt-u17-women-2008",
    title: "U-17 Women's World Cup",
    season: "Desde 2008",
    imageUrl: "https://www.futbox.com/img/v1/2ea/cd7/c27/a1e/f4f7518461ae597b61ee.png",
  },
  {
    id: "nt-olympic-men-a",
    title: "Olympic Games - Men's Football",
    season: "1900 - 1920, 1932 - 1936, desde 1948",
    imageUrl: "https://www.futbox.com/img/v1/0e6/001/013/10d/178a88d7b938c5ea3661.png",
  },
  {
    id: "nt-olympic-men-b",
    title: "Olympic Games - Men's Football",
    season: "1900 - 1920, 1932 - 1936, desde 1948",
    imageUrl: "https://www.futbox.com/img/v1/091/ffd/b95/d14/53b29c61e7caa33ff7d7.png",
  },
  {
    id: "nt-olympic-men-c",
    title: "Olympic Games - Men's Football",
    season: "1900 - 1920, 1932 - 1936, desde 1948",
    imageUrl: "https://www.futbox.com/img/v1/343/5a2/d2f/4ca/5bdf85085e065caf9fc4.png",
  },
  {
    id: "nt-olympic-women-a",
    title: "Olympic Games - Women's Football",
    season: "Desde 1996",
    imageUrl: "https://www.futbox.com/img/v1/6b4/ed7/d26/783/16245af5a7e46a104de2.png",
  },
  {
    id: "nt-olympic-women-b",
    title: "Olympic Games - Women's Football",
    season: "Desde 1996",
    imageUrl: "https://www.futbox.com/img/v1/236/d24/6a4/f80/de6e7b1ad92c91321804.png",
  },
  {
    id: "nt-olympic-women-c",
    title: "Olympic Games - Women's Football",
    season: "Desde 1996",
    imageUrl: "https://www.futbox.com/img/v1/e82/9b4/df5/7b2/7cc4fc9a70db7047439e.png",
  },
];

const nationalTeamContinentalNodes: TitleGalleryNode[] = [
  {
    id: "afc",
    label: "AFC",
    subtitle: "Asia",
    items: [
      {
        id: "afc-asian-cup-2019",
        title: "AFC Asian Cup",
        season: "Desde 2019",
        imageUrl: "https://www.futbox.com/img/v1/199/8ea/53d/c72/a9e84a5bf0ca786fc015.png",
      },
      {
        id: "afc-asian-cup-2004-2015",
        title: "AFC Asian Cup",
        season: "2004 - 2015",
        imageUrl: "https://www.futbox.com/img/v1/b84/35d/18b/7c4/345d355f61e4338377c4.png",
      },
      {
        id: "afc-asian-cup-1956-2000",
        title: "AFC Asian Cup",
        season: "1956 a 2000",
        imageUrl: "https://www.futbox.com/img/v1/8c1/46a/824/dfd/9bb536eed84742b6da11.png",
      },
      {
        id: "afc-womens-asian-cup-2022",
        title: "AFC Women's Asian Cup",
        season: "Desde 2022",
        imageUrl: "https://www.futbox.com/img/v1/75f/a84/58c/0b3/6b5bb6a735ce4de22bfe.png",
      },
      {
        id: "afc-womens-asian-cup-2018",
        title: "AFC Women's Asian Cup",
        season: "2018",
        imageUrl: "https://www.futbox.com/img/v1/632/db9/5ad/87c/9aa913132df7e6b0724c.png",
      },
      {
        id: "afc-womens-asian-cup-2008-2014",
        title: "AFC Women's Asian Cup",
        season: "2008 - 2014",
        imageUrl: "https://www.futbox.com/img/v1/a9a/b8c/86c/ef9/830845b6ef34ecbc88c8.png",
      },
      {
        id: "afc-womens-asian-cup-2006",
        title: "AFC Women's Asian Cup",
        season: "2006",
        imageUrl: "https://www.futbox.com/img/v1/f19/037/8c3/c98/dc0b86e16468cc47acd7.png",
      },
      {
        id: "afc-asian-womens-championship-1997-2003",
        title: "Asian Women's Championship",
        season: "1997 - 2003",
        imageUrl: "https://www.futbox.com/img/v1/9ef/fdb/70e/df9/b07a02c92415a1188f07.png",
      },
      {
        id: "afc-asian-womens-championship-1986-1995",
        title: "Asian Women's Championship",
        season: "1986 - 1995",
        imageUrl: "https://www.futbox.com/img/v1/e91/d91/e59/b3e/b0ab3399babd1ac878df.png",
      },
      {
        id: "afc-asian-womens-championship-1975-1983",
        title: "Asian Women's Championship",
        season: "1975 - 1983",
        imageUrl: "https://www.futbox.com/img/v1/da5/b3a/147/33c/a97ff5447107781a991e.png",
      },
      {
        id: "afc-arab-cup-fifa",
        title: "Arab Cup",
        season: "Desde 2021 (FIFA)",
        imageUrl: "https://www.futbox.com/img/v1/c19/08e/4f6/950/e64cb56a8ad00e147171.png",
      },
      {
        id: "afc-arab-cup-uafa",
        title: "Arab Cup",
        season: "1963 - 2012 (UAFA)",
        imageUrl: "https://www.futbox.com/img/v1/e5d/f53/186/d30/998812865eb8d8431c2a.png",
      },
    ],
  },
  {
    id: "caf",
    label: "CAF",
    subtitle: "Africa",
    items: [
      {
        id: "caf-afcon-2002",
        title: "Africa Cup of Nations",
        season: "Desde 2002",
        imageUrl: "https://www.futbox.com/img/v1/c7a/c19/1aa/d17/01c289626bf2ef47c15c.png",
      },
      {
        id: "caf-afcon-1980-2000",
        title: "Africa Cup of Nations",
        season: "1980 - 2000",
        imageUrl: "https://www.futbox.com/img/v1/0bd/81f/ff5/dce/78fd84f0e42334b0af81.png",
      },
      {
        id: "caf-afcon-1957-1978",
        title: "Africa Cup of Nations",
        season: "1957 - 1978",
        imageUrl: "https://www.futbox.com/img/v1/89b/a57/64e/980/a2ef72b9d0b313e86e2b.png",
      },
      {
        id: "caf-wafcon-2015",
        title: "Women's Africa Cup of Nations",
        season: "Desde 2015",
        imageUrl: "https://www.futbox.com/img/v1/1a6/20a/fed/636/7322ed21cb07f7bfcfd1.png",
      },
      {
        id: "caf-awc-2006-2014",
        title: "African Women's Championship",
        season: "2006 - 2014",
        imageUrl: "https://www.futbox.com/img/v1/e02/7a1/ab7/a41/4a301238a13b777538b8.png",
      },
      {
        id: "caf-awc-1991-2004",
        title: "African Women's Championship",
        season: "1991 - 2004",
        imageUrl: "https://www.futbox.com/img/v1/22b/ae1/e81/10a/574f767764839fdf2e3c.png",
      },
    ],
  },
  {
    id: "concacaf",
    label: "CONCACAF",
    subtitle: "America do Norte, Central e Caribe",
    items: [
      {
        id: "concacaf-gold-cup-2013",
        title: "Concacaf Gold Cup",
        season: "Desde 2013",
        imageUrl: "https://www.futbox.com/img/v1/47f/421/eaa/6d1/b74091d34cb3004315fa.png",
      },
      {
        id: "concacaf-gold-cup-1993-2011",
        title: "Concacaf Gold Cup",
        season: "1993 - 2011",
        imageUrl: "https://www.futbox.com/img/v1/17b/292/5a1/30c/54250d6f2c11c2e98b30.png",
      },
      {
        id: "concacaf-gold-cup-1991",
        title: "Concacaf Gold Cup",
        season: "1991",
        imageUrl: "https://www.futbox.com/img/v1/990/0f4/e2f/f68/5e743e97f0256fa7432d.png",
      },
      {
        id: "concacaf-nations-league",
        title: "Concacaf Nations League",
        season: "Desde 2019",
        imageUrl: "https://www.futbox.com/img/v1/a0f/508/4d2/f19/8e35e59ee4773a398746.png",
      },
      {
        id: "concacaf-championship-1981-1989",
        title: "Concacaf Campeonato de Naciones",
        season: "1981 - 1989",
        imageUrl: "https://www.futbox.com/img/v1/905/b7e/1c1/071/801ebbf3c995522c3fe2.png",
      },
      {
        id: "concacaf-championship-1963-1977",
        title: "Concacaf Campeonato de Naciones",
        season: "1963 - 1977",
        imageUrl: "https://www.futbox.com/img/v1/f52/c5c/155/de3/527b34dd8c9259d97536.png",
      },
      {
        id: "concacaf-w-gold-cup-2024",
        title: "Concacaf W Gold Cup",
        season: "2024",
        imageUrl: "https://www.futbox.com/img/v1/cd8/77b/766/8e0/b9163266f24015f0380e.png",
      },
      {
        id: "concacaf-w-championship-2022",
        title: "Concacaf W Championship",
        season: "2022",
        imageUrl: "https://www.futbox.com/img/v1/1f5/46c/549/632/84cba21236d0c527d02f.png",
      },
      {
        id: "concacaf-womens-championship-2018",
        title: "Concacaf Women's Championship",
        season: "2018",
        imageUrl: "https://www.futbox.com/img/v1/16a/3c5/ff6/bee/a81aafba6b8bbb25c5bf.png",
      },
      {
        id: "concacaf-womens-championship-2014",
        title: "Concacaf Women's Championship",
        season: "2014",
        imageUrl: "https://www.futbox.com/img/v1/89a/957/3d0/072/dcd4e28e6a89a8810dd1.png",
      },
      {
        id: "concacaf-womens-championship-1998",
        title: "Concacaf Women's Championship",
        season: "1998",
        imageUrl: "https://www.futbox.com/img/v1/0ec/405/31d/b4a/530ba917bd940c926d24.png",
      },
      {
        id: "concacaf-womens-championship-1994",
        title: "Concacaf Women's Championship",
        season: "1994",
        imageUrl: "https://www.futbox.com/img/v1/885/e8e/b23/0b7/3f097ed23d53d64722e5.png",
      },
      {
        id: "concacaf-womens-championship-1991",
        title: "Concacaf Women's Championship",
        season: "1991",
        imageUrl: "https://www.futbox.com/img/v1/4ae/c0f/4e5/a7f/f5b8c25612895bbaa96a.png",
      },
      {
        id: "concacaf-womens-qualifiers-2010",
        title: "Concacaf Women's World Cup Qualifying",
        season: "2010",
        imageUrl: "https://www.futbox.com/img/v1/816/656/bd3/16d/2d508f1c90a8a673cf11.png",
      },
      {
        id: "concacaf-womens-gold-cup-2006",
        title: "Concacaf Women's Gold Cup",
        season: "2006",
        imageUrl: "https://www.futbox.com/img/v1/5b0/0c7/f8c/2b6/5ba16f4de517faaa984e.png",
      },
      {
        id: "concacaf-womens-gold-cup-2002",
        title: "Concacaf Women's Gold Cup",
        season: "2002",
        imageUrl: "https://www.futbox.com/img/v1/a8b/575/91f/711/2b44ce3fe307277a32c0.png",
      },
      {
        id: "concacaf-womens-gold-cup-2000",
        title: "Concacaf Women's Gold Cup",
        season: "2000",
        imageUrl: "https://www.futbox.com/img/v1/37c/a10/22d/72f/fa2bcb5fa334272b67fb.png",
      },
      {
        id: "concacaf-womens-invitational-1993",
        title: "Concacaf Women's Invitational Tournament",
        season: "1993",
        imageUrl: "https://www.futbox.com/img/v1/f3d/2ca/665/72d/2d86b7114498c7f5f4dd.png",
      },
      {
        id: "concacaf-nafc-cup",
        title: "NAFC Cup",
        season: "1947, 1949, 1990 - 1991",
        imageUrl: "https://www.futbox.com/img/v1/a52/c6a/c17/124/ed10f756d63c7dd26776.png",
      },
      {
        id: "concacaf-cccf-cup",
        title: "Copa CCCF",
        season: "1941 - 1961",
        imageUrl: "https://www.futbox.com/img/v1/b82/57f/f1d/0bb/af4b5fb2dc8114e1e154.png",
      },
    ],
  },
  {
    id: "conmebol",
    label: "CONMEBOL",
    subtitle: "America do Sul",
    items: [
      {
        id: "conmebol-copa-america-1975",
        title: "Copa America",
        season: "Desde 1975",
        imageUrl: "https://www.futbox.com/img/v1/a4e/d07/14f/f9f/bfde33b66120e095da02.png",
      },
      {
        id: "conmebol-copa-america-centenario",
        title: "Copa America Centenario",
        season: "2016",
        imageUrl: "https://www.futbox.com/img/v1/727/a8e/263/c86/3ffd5e52af946a88065e.png",
      },
      {
        id: "conmebol-sudamericano-1939-1967",
        title: "Campeonato Sudamericano de Selecciones",
        season: "1939 - 1967",
        imageUrl: "https://www.futbox.com/img/v1/379/e5f/6d0/367/235207dd6365174b4f10.png",
      },
      {
        id: "conmebol-sudamericano-1917-1937",
        title: "Campeonato Sudamericano de Selecciones",
        season: "1917 - 1937",
        imageUrl: "https://www.futbox.com/img/v1/44b/15d/232/b89/ea1e429e190399aa1022.png",
      },
      {
        id: "conmebol-sudamericano-1916",
        title: "Campeonato Sudamericano de Selecciones",
        season: "1916",
        imageUrl: "https://www.futbox.com/img/v1/551/0fc/6ef/5b0/1b0ab8b43725f3e6a2c1.png",
      },
      {
        id: "conmebol-copa-america-femenina-2025",
        title: "Copa America Femenina",
        season: "Desde 2025",
        imageUrl: "https://www.futbox.com/img/v1/c5c/f9b/d89/e83/e741a9983113499ea3da.png",
      },
      {
        id: "conmebol-copa-america-femenina-2022",
        title: "Copa America Femenina",
        season: "2022",
        imageUrl: "https://www.futbox.com/img/v1/c18/5c4/7cf/03d/3366dc4da6027d7f64bf.png",
      },
      {
        id: "conmebol-copa-america-femenina-2018",
        title: "Copa America Femenina",
        season: "2018",
        imageUrl: "https://www.futbox.com/img/v1/63e/492/b3f/49d/777bef4d759053c28077.png",
      },
      {
        id: "conmebol-copa-america-femenina-2014",
        title: "Copa America Femenina",
        season: "2014",
        imageUrl: "https://www.futbox.com/img/v1/0eb/2db/efd/796/92960358f9c6909ff790.png",
      },
      {
        id: "conmebol-copa-america-femenina-2010",
        title: "Copa America Femenina",
        season: "2010",
        imageUrl: "https://www.futbox.com/img/v1/a4e/f34/dc8/9aa/617ebded941ad633d900.png",
      },
      {
        id: "conmebol-sudamericano-femenino-2006",
        title: "Campeonato Sudamericano Femenino",
        season: "2006",
        imageUrl: "https://www.futbox.com/img/v1/898/124/01a/764/18b105d221d81254daa7.png",
      },
      {
        id: "conmebol-sudamericano-femenino-2003",
        title: "Campeonato Sudamericano Femenino",
        season: "2003",
        imageUrl: "https://www.futbox.com/img/v1/a76/1da/f82/620/ad8f7a21c5ba425c6c9f.png",
      },
      {
        id: "conmebol-sudamericano-femenino-1998",
        title: "Campeonato Sudamericano Femenino",
        season: "1998",
        imageUrl: "https://www.futbox.com/img/v1/b97/f7c/93f/f51/af2fb85e3aa8c6794680.png",
      },
      {
        id: "conmebol-sudamericano-femenino-1995",
        title: "Campeonato Sudamericano Femenino",
        season: "1995",
        imageUrl: "https://www.futbox.com/img/v1/63f/198/503/c20/9a6685a1dca2d2046673.png",
      },
      {
        id: "conmebol-sudamericano-femenino-1991",
        title: "Campeonato Sudamericano Femenino",
        season: "1991",
        imageUrl: "https://www.futbox.com/img/v1/927/e83/d58/8ef/5157d26c9817bc484681.png",
      },
    ],
  },
  {
    id: "ofc",
    label: "OFC",
    subtitle: "Oceania",
    items: [
      {
        id: "ofc-nations-cup-2012",
        title: "OFC Nations Cup",
        season: "Desde 2012",
        imageUrl: "https://www.futbox.com/img/v1/9b2/62b/f7b/838/e110da4ccdd210c1bbc6.png",
      },
      {
        id: "ofc-nations-cup-1973-2008",
        title: "OFC Nations Cup",
        season: "1973 - 2008",
        imageUrl: "https://www.futbox.com/img/v1/5fd/0a6/559/9e3/4cc339cd4583f10dc22c.png",
      },
      {
        id: "ofc-womens-nations-cup-2014",
        title: "OFC Women's Nations Cup",
        season: "Desde 2014",
        imageUrl: "https://www.futbox.com/img/v1/320/b46/415/4fb/bdda46f6b8c2f14e4c3b.png",
      },
      {
        id: "ofc-womens-nations-cup-1991-2010",
        title: "OFC Women's Nations Cup",
        season: "1991 - 2010",
        imageUrl: "https://www.futbox.com/img/v1/588/f42/075/32b/4f2c333545108a860d11.png",
      },
      {
        id: "ofc-womens-championship-1983-1989",
        title: "OFC Women's Championship",
        season: "1983 - 1989",
        imageUrl: "https://www.futbox.com/img/v1/45d/ab9/b80/239/1d2b0d3695217b89758e.png",
      },
    ],
  },
  {
    id: "uefa",
    label: "UEFA",
    subtitle: "Europa",
    items: [
      {
        id: "uefa-euro-2008",
        title: "Euro Cup",
        season: "Desde 2008",
        imageUrl: "https://www.futbox.com/img/v1/365/6b2/114/f43/81d4d9743ef24d7c106c.png",
      },
      {
        id: "uefa-euro-1968-2004",
        title: "Euro Cup",
        season: "1968 - 2004",
        imageUrl: "https://www.futbox.com/img/v1/757/1d7/705/d4f/9d891b48658db4919a47.png",
      },
      {
        id: "uefa-european-nations-cup",
        title: "European Nations Cup",
        season: "1960 - 1964",
        imageUrl: "https://www.futbox.com/img/v1/6b9/706/fbe/dd1/e8dcfc91ac07b52baa74.png",
      },
      {
        id: "uefa-nations-league",
        title: "Nations League",
        season: "Desde 2018",
        imageUrl: "https://www.futbox.com/img/v1/7d0/c3b/551/a49/c98f4ad8a899b11fac7b.png",
      },
      {
        id: "uefa-womens-euro-2005",
        title: "Women's Euro Cup",
        season: "Desde 2005",
        imageUrl: "https://www.futbox.com/img/v1/4df/e79/e6e/095/0fdb8f8683b903c2fbcd.png",
      },
      {
        id: "uefa-womens-euro-1991-2001",
        title: "Women's Euro Cup",
        season: "1991 - 2001",
        imageUrl: "https://www.futbox.com/img/v1/97e/57a/417/2c8/f23ac7deeac3f7bdbd19.png",
      },
      {
        id: "uefa-womens-euro-1984-1989",
        title: "Women's Euro Cup",
        season: "1984 - 1989",
        imageUrl: "https://www.futbox.com/img/v1/acf/9e5/b61/8d0/8cd7e8f60b720ee83c99.png",
      },
      {
        id: "uefa-womens-nations-league",
        title: "Women's Nations League",
        season: "Desde 2023/24",
        imageUrl: "https://www.futbox.com/img/v1/0c8/6f2/3a4/e80/333a258e5cee3d80041d.png",
      },
      {
        id: "uefa-european-w-competition",
        title: "European W Competition",
        season: "1979",
        imageUrl: "https://www.futbox.com/img/v1/a2a/c1e/b06/50e/45082fb63f3e9d508973.png",
      },
    ],
  },
];

export const titleGalleryByMode: Record<TitleMode, TitleGalleryNode[]> = {
  clubs: [
    {
      id: "world",
      label: "Mundiais",
      subtitle: "Titulos internacionais de clubes para exibicao na galeria.",
      items: clubWorldItems,
    },
    {
      id: "continental",
      label: "Continentais",
      subtitle: "Competições continentais de clubes organizadas por confederação.",
      children: generatedClubContinentalNodes,
    },
    {
      id: "national",
      label: "Nacionais",
      subtitle: "Competições nacionais de clubes organizadas por confederação e país.",
      children: generatedClubNationalNodes,
    },
  ],
  "national-teams": [
    {
      id: "world",
      label: "Mundiais",
      subtitle: "Trofeus globais de selecoes masculinas, femininas e categorias de base.",
      items: nationalTeamWorldItems,
    },
    {
      id: "continental",
      label: "Continentais",
      subtitle: "Competições continentais de seleções por confederação.",
      children: nationalTeamContinentalNodes,
    },
  ],
};
