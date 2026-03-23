import { useState } from "react";
import { Text, View } from "react-native";

import { FeatureCard } from "@/components/ui/FeatureCard";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { VideoHighlightCard } from "@/components/videos/VideoHighlightCard";
import { sampleVideos } from "@/lib/constants";

export default function VideosScreen() {
  const [actionMode, setActionMode] = useState<"upload" | "selection">("upload");
  const [selectedCategory, setSelectedCategory] = useState("Gol mais bonito");
  const [selectedSelectionMode, setSelectedSelectionMode] = useState("Votacao publica");
  const { cardWidth, contentMaxWidth } = usePanelGrid();

  const categoryOptions = ["Gol mais bonito", "Defesa", "Assistencia", "Jogada decisiva"];
  const selectionOptions = ["Votacao publica", "Organizador", "Comissao"];

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
        <SectionHeader
          eyebrow="Videos"
          title="Painel de destaques"
          subtitle="Organize envios, configure a escolha do vencedor e acompanhe os lances em cards mais diretos."
        />

        <View className="flex-row flex-wrap gap-5 px-2">
          <RevealOnScroll delay={0}>
            <FeatureCard
              icon="cloud-upload-outline"
              title="Adicionar video"
              subtitle="Novo lance"
              description="Abra o fluxo de envio para cadastrar videos da rodada atual e preparar a moderacao do torneio."
              meta={actionMode === "upload" ? "Modo ativo" : "Pronto para envio"}
              onPress={() => setActionMode("upload")}
              width={cardWidth}
            />
          </RevealOnScroll>
          <RevealOnScroll delay={90}>
            <FeatureCard
              icon="options-outline"
              title="Opcao de escolha"
              subtitle="Decisao do destaque"
              description="Defina se o vencedor sera escolhido por votacao publica, organizador ou comissao do campeonato."
              meta={actionMode === "selection" ? "Modo ativo" : "Escolha configuravel"}
              onPress={() => setActionMode("selection")}
              width={cardWidth}
            />
          </RevealOnScroll>
          <RevealOnScroll delay={180}>
            <FeatureCard
              icon="videocam-outline"
              title={selectedCategory}
              subtitle={selectedSelectionMode}
              description="Configuracao atual desta aba para categoria do video e metodo usado na definicao do destaque."
              meta="Configuracao ativa"
              width={cardWidth}
              accent="blue"
            />
          </RevealOnScroll>
        </View>

        <RevealOnScroll delay={80}>
          <View
            className="mx-2 rounded-[24px] border p-6 gap-5"
            style={{
              borderColor: "#D3D7DC",
              backgroundColor: "#FAFAFA",
              shadowColor: "#A3A8AF",
              shadowOpacity: 0.12,
              shadowRadius: 18,
            }}
          >
            <View className="gap-2">
              <Text className="text-xl font-semibold text-[#3F454C]">Escolha do destaque</Text>
              <Text className="text-base leading-7 text-[#777D85]">
                Ajuste categoria e metodo de selecao mantendo o mesmo visual do painel principal.
              </Text>
            </View>

            <View className="gap-3">
              <Text className="text-sm uppercase tracking-[2px] text-[#50565D]">Categoria</Text>
              <ScrollRow>
                {categoryOptions.map((option) => (
                  <ChoiceChip
                    key={option}
                    label={option}
                    active={selectedCategory === option}
                    onPress={() => setSelectedCategory(option)}
                  />
                ))}
              </ScrollRow>
            </View>

            <View className="gap-3">
              <Text className="text-sm uppercase tracking-[2px] text-[#50565D]">Escolha</Text>
              <ScrollRow>
                {selectionOptions.map((option) => (
                  <ChoiceChip
                    key={option}
                    label={option}
                    active={selectedSelectionMode === option}
                    onPress={() => setSelectedSelectionMode(option)}
                  />
                ))}
              </ScrollRow>
            </View>
          </View>
        </RevealOnScroll>

        <View className="gap-4">
          <SectionHeader
            eyebrow="Lances"
            title="Cards de video"
            subtitle="Todos os destaques seguem o mesmo estilo de card do restante do app."
          />

          <View className="flex-row flex-wrap gap-5 px-2">
            {sampleVideos.map((video, index) => (
              <RevealOnScroll key={video.id} delay={index * 90} style={{ width: cardWidth }}>
                <VideoHighlightCard video={video} />
              </RevealOnScroll>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
