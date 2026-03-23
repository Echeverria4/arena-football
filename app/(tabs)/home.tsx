import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Text, View } from "react-native";

import { FloatingWhatsAppLauncher } from "@/components/match/FloatingWhatsAppLauncher";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { sampleMatches, sampleTournament, sampleVideos } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import { buildMatchMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { useAuthStore } from "@/stores/auth-store";

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const { cardWidth, contentMaxWidth } = usePanelGrid();
  const nextMatch = sampleMatches[0];
  const homeTeam = "Corinthians";
  const awayTeam = "Bragantino";

  async function handleOpenWhatsApp() {
    const link = buildWhatsAppLink(
      "+55 11 99999-0000",
      buildMatchMessage({
        round: nextMatch.round,
        tournamentName: sampleTournament.name,
        isHomePlayerRoomCreator: true,
      }),
    );

    await Linking.openURL(link);
  }

  return (
    <Screen
      ambientDiamond
      scroll
      className="px-6"
      overlay={
        <FloatingWhatsAppLauncher
          phone="+55 11 99999-0000"
          tournamentName={sampleTournament.name}
        />
      }
    >
      <View className="w-full self-center gap-8 py-8" style={{ maxWidth: contentMaxWidth }}>
        <View
          className="self-center"
          style={{ width: "100vw", paddingLeft: 28, paddingRight: 28 }}
        >
          <SectionHeader
            eyebrow="Home"
            title={`Bem-vindo, ${user?.name ?? "Organizador"}`}
            subtitle="Central premium para criar campeonatos, acompanhar partidas e divulgar confrontos pelo WhatsApp."
          />
        </View>

        <View className="gap-4 px-2">
          <View
            className="self-center"
            style={{ width: "100vw", paddingLeft: 28, paddingRight: 28 }}
          >
            <SectionHeader
              eyebrow="Painel do menu"
              title="Atalhos do organizador"
              subtitle="Cards mais objetivos para entrar no campeonato, acompanhar rodadas e abrir as areas mais usadas."
            />
          </View>

          <View className="flex-row flex-wrap gap-5">
            <RevealOnScroll delay={0}>
              <FeatureCard
                icon="add-circle-outline"
                title="Criar campeonato"
                subtitle="Novo torneio"
                description="Monte formato, regras, videos e premiacoes do proximo campeonato sem sair do painel principal."
                meta="Abrir wizard"
                onPress={() => router.push("/tournament/create")}
                width={cardWidth}
              />
            </RevealOnScroll>
            <RevealOnScroll delay={70}>
              <FeatureCard
                icon="trophy-outline"
                title="Campeonato atual"
                subtitle={sampleTournament.name}
                description="Entre direto no campeonato em andamento para ver fases, classificacao, estatisticas e confrontos."
                meta="Em andamento"
                onPress={() => router.push(`/tournament/${sampleTournament.id}`)}
                width={cardWidth}
              />
            </RevealOnScroll>
            <RevealOnScroll delay={140}>
              <FeatureCard
                icon="stats-chart-outline"
                title="Classificacao"
                subtitle="Grupo e geral"
                description="Veja tabela, aproveitamento, probabilidades e indicadores do torneio com um toque."
                meta="Abrir tabela"
                onPress={() =>
                  router.push({ pathname: "/tournament/standings", params: { id: sampleTournament.id } })
                }
                width={cardWidth}
              />
            </RevealOnScroll>
            <RevealOnScroll delay={210}>
              <FeatureCard
                icon="git-network-outline"
                title="Fases e rodadas"
                subtitle={`Rodada ${nextMatch.round}`}
                description="Acompanhe a grade de confrontos, avance entre rodadas e visualize o chaveamento do campeonato."
                meta="Ver confrontos"
                onPress={() =>
                  router.push({ pathname: "/tournament/matches", params: { id: sampleTournament.id } })
                }
                width={cardWidth}
              />
            </RevealOnScroll>
            <RevealOnScroll delay={280}>
              <FeatureCard
                icon="radio-outline"
                title="Proxima partida"
                subtitle={`${homeTeam} x ${awayTeam}`}
                description={`Prazo final em ${formatDate(nextMatch.deadlineAt)}. Abra a partida para adicionar placar e acompanhar o duelo.`}
                meta="Abrir partida"
                onPress={() => router.push("/match/match-1")}
                width={cardWidth}
              />
            </RevealOnScroll>
            <RevealOnScroll delay={350}>
              <FeatureCard
                icon="logo-whatsapp"
                title="WhatsApp"
                subtitle="Contato rapido"
                description="Abra a conversa oficial da rodada atual para combinar sala, horario e inicio da partida."
                meta="Chamar agora"
                onPress={handleOpenWhatsApp}
                width={cardWidth}
              />
            </RevealOnScroll>
          </View>
        </View>

        <View className="gap-4 px-2">
          <SectionHeader eyebrow="Em destaque" title="Resumo do campeonato" subtitle="Visao detalhada do torneio principal e do que exige atencao agora." />

          <View className="flex-row flex-wrap gap-5">
            <RevealOnScroll delay={0} style={{ width: cardWidth }}>
              <TournamentCard
                tournament={sampleTournament}
                primaryAction={{
                  label: "Acompanhar campeonato",
                  onPress: () => router.push(`/tournament/${sampleTournament.id}`),
                }}
                secondaryAction={{
                  label: "Ver fases e rodadas",
                  onPress: () =>
                    router.push({ pathname: "/tournament/matches", params: { id: sampleTournament.id } }),
                  variant: "secondary",
                }}
              />
            </RevealOnScroll>

            <RevealOnScroll delay={90}>
              <FeatureCard
                icon="podium-outline"
                title="Classificacao atual"
                subtitle="Corinthians lider"
                description="Acompanhe a tabela geral, o desempenho do torneio e os indicadores mais relevantes da fase atual."
                meta="9 pts / saldo +6"
                onPress={() =>
                  router.push({ pathname: "/tournament/standings", params: { id: sampleTournament.id } })
                }
                width={cardWidth}
              />
            </RevealOnScroll>
          </View>
        </View>

        <View className="gap-4 px-2">
          <SectionHeader
            eyebrow="Radar rapido"
            title="O que esta chamando mais atencao"
            subtitle="Leitura curta do confronto imediato, da rodada ativa e do destaque de video."
          />

          <View className="flex-row flex-wrap gap-5">
            <RevealOnScroll delay={0}>
              <FeatureCard
                icon="calendar-outline"
                title={`Rodada ${nextMatch.round}`}
                subtitle="Fase de grupos"
                description={`Mandante ${homeTeam}. Deadline ${formatDate(nextMatch.deadlineAt)}. Abra a partida ou avance para a grade completa.`}
                meta="Calendario vivo"
                onPress={() =>
                  router.push({ pathname: "/tournament/matches", params: { id: sampleTournament.id } })
                }
                width={cardWidth}
              />
            </RevealOnScroll>
            <RevealOnScroll delay={90}>
              <FeatureCard
                icon="play-circle-outline"
                title={sampleVideos[0].title}
                subtitle="Video em destaque"
                description="Area de videos pronta para curadoria do gol mais bonito, votacao e aprovacao do organizador."
                meta={`${sampleVideos[0].votesCount} votos`}
                onPress={() => router.push("/videos")}
                width={cardWidth}
              />
            </RevealOnScroll>
            <RevealOnScroll delay={180}>
              <FeatureCard
                icon="sparkles-outline"
                title="Hall da Fama"
                subtitle="Premios e historico"
                description="Veja trofeus, destaques, campeoes e as memorias competitivas que ja foram registradas no Arena."
                meta="Abrir galeria"
                onPress={() => router.push("/hall-of-fame")}
                width={cardWidth}
              />
            </RevealOnScroll>
          </View>
        </View>
      </View>
    </Screen>
  );
}
