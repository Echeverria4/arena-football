import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { FeatureCard } from "@/components/ui/FeatureCard";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";

interface SpotlightConfiguratorCardProps {
  width: number | string;
  selectedCategory: string;
  selectedSpotlight: string;
  hallCategories: string[];
  spotlightOptions: string[];
  onSelectCategory: (value: string) => void;
  onSelectSpotlight: (value: string) => void;
}

function SpotlightConfiguratorCard({
  width,
  selectedCategory,
  selectedSpotlight,
  hallCategories,
  spotlightOptions,
  onSelectCategory,
  onSelectSpotlight,
}: SpotlightConfiguratorCardProps) {
  return (
    <View
      className="rounded-[24px] border p-6 gap-5"
      style={{
        width,
        minHeight: 236,
        borderColor: "#D3D7DC",
        backgroundColor: "#FAFAFA",
        shadowColor: "#A3A8AF",
        shadowOpacity: 0.12,
        shadowRadius: 18,
      }}
    >
      <View className="mb-1 flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full border border-[#C4C9CF] bg-[#EEF1F3]">
          <Ionicons name="medal-outline" size={22} color="#666C74" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-semibold text-[#3F454C]">Adicionar ao salao</Text>
          <Text className="text-base text-[#777D85]">Novo destaque</Text>
        </View>
      </View>

      <Text className="text-base leading-7 text-[#777D85]">
        Inclua videos premiados, trofeus especiais e destaques historicos no mural principal do campeonato.
      </Text>

      <View className="gap-2">
        <Text className="text-xl font-semibold text-[#3F454C]">Escolha do destaque</Text>
        <Text className="text-base leading-7 text-[#777D85]">
          Configure categoria e tipo de trofeu no mesmo padrao visual do painel principal.
        </Text>
      </View>

      <View className="gap-3">
        <Text className="text-sm uppercase tracking-[2px] text-[#50565D]">Categoria</Text>
        <ScrollRow>
          {hallCategories.map((option) => (
            <ChoiceChip
              key={option}
              label={option}
              active={selectedCategory === option}
              tone="gold"
              onPress={() => onSelectCategory(option)}
            />
          ))}
        </ScrollRow>
      </View>

      <View className="gap-3">
        <Text className="text-sm uppercase tracking-[2px] text-[#50565D]">Escolha</Text>
        <ScrollRow>
          {spotlightOptions.map((option) => (
            <ChoiceChip
              key={option}
              label={option}
              active={selectedSpotlight === option}
              tone="gold"
              onPress={() => onSelectSpotlight(option)}
            />
          ))}
        </ScrollRow>
      </View>

      <View className="mt-auto flex-row items-center gap-2">
        <Ionicons name="flash-outline" size={14} color="#666C74" />
        <Text className="text-sm font-semibold uppercase tracking-[2px] text-[#464B52]">Modo ativo</Text>
      </View>
    </View>
  );
}

export default function HallOfFameScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("Gol mais bonito");
  const [selectedSpotlight, setSelectedSpotlight] = useState("Video vencedor");
  const [subView, setSubView] = useState<"overview" | "configurator">("overview");
  const { cardWidth, contentMaxWidth } = usePanelGrid();

  const hallCategories = ["Gol mais bonito", "Campeao", "Artilheiro", "Organizador destaque"];
  const spotlightOptions = ["Video vencedor", "Destaque da rodada", "Trofeu especial"];

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
        {subView === "overview" ? (
          <>
            <SectionHeader
              eyebrow="Hall da Fama"
              title="Galeria de trofeus"
              subtitle="Cards organizados para premiacoes, destaques historicos e configuracoes do salao."
            />

            <View className="flex-row flex-wrap gap-5 px-2">
              <RevealOnScroll delay={0}>
                <FeatureCard
                  icon="medal-outline"
                  title="Adicionar ao salao"
                  subtitle="Novo destaque"
                  description="Inclua videos premiados, trofeus especiais e destaques historicos no mural principal do campeonato."
                  meta="Abrir configuracao"
                  width={cardWidth}
                  accent="gold"
                  onPress={() => setSubView("configurator")}
                />
              </RevealOnScroll>
              <RevealOnScroll delay={90}>
                <FeatureCard
                  icon="trophy-outline"
                  title="Titulos"
                  subtitle="Aba dedicada"
                  description="Abra a galeria completa com Clubes e Selecoes em um menu proprio."
                  meta="Abrir aba"
                  onPress={() => router.push("/titles")}
                  width={cardWidth}
                  accent="gold"
                />
              </RevealOnScroll>
              <RevealOnScroll delay={180}>
                <FeatureCard
                  icon="sparkles-outline"
                  title={selectedCategory}
                  subtitle={selectedSpotlight}
                  description="Configuracao atual do salao para a categoria de destaque e o tipo de premiacao exibido."
                  meta="Configuracao ativa"
                  width={cardWidth}
                  accent="gold"
                  onPress={() => setSubView("configurator")}
                />
              </RevealOnScroll>
            </View>
          </>
        ) : (
          <View className="gap-5 px-2">
            <RevealOnScroll delay={0}>
              <Pressable
                onPress={() => setSubView("overview")}
                className="self-start flex-row items-center gap-2 rounded-full border px-4 py-3 active:opacity-80"
                style={{
                  borderColor: "#D1D5DA",
                  backgroundColor: "#FAFAFA",
                }}
              >
                <Ionicons name="arrow-back" size={16} color="#4D535A" />
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-[#4D535A]">
                  Voltar ao hall
                </Text>
              </Pressable>
            </RevealOnScroll>

            <SectionHeader
              eyebrow="Hall da Fama"
              title="Configuracao do destaque"
              subtitle="Esta e uma subaba interna do salao. Ajuste categoria e premio sem misturar com os outros cards."
            />

            <RevealOnScroll delay={80}>
              <SpotlightConfiguratorCard
                width="100%"
                selectedCategory={selectedCategory}
                selectedSpotlight={selectedSpotlight}
                hallCategories={hallCategories}
                spotlightOptions={spotlightOptions}
                onSelectCategory={setSelectedCategory}
                onSelectSpotlight={setSelectedSpotlight}
              />
            </RevealOnScroll>
          </View>
        )}
      </View>
    </Screen>
  );
}
