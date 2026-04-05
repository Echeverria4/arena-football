import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

import { TitlesGalleryPanel } from "@/components/gallery/TitlesGalleryPanel";
import { TeamsByConfederationView } from "@/components/teams/TeamsByConfederationView";
import { Screen } from "@/components/ui/Screen";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { CLUBES_DO_CATALOGO, SELECOES_DO_CATALOGO } from "@/lib/team-browser-data";

export type GallerySection = "titles" | "clubs" | "selections";

type GalleryOption = {
  accent: string;
  accentSoft: string;
  key: GallerySection;
  label: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
};

const GALLERY_OPTIONS: GalleryOption[] = [
  {
    accent: "#F6C54B",
    accentSoft: "rgba(246,197,75,0.20)",
    key: "titles",
    label: "Títulos",
    description: "Histórico de campeões, ranking e temporadas encerradas.",
    icon: "ribbon-outline",
  },
  {
    accent: "#4FC3FF",
    accentSoft: "rgba(79,195,255,0.18)",
    key: "clubs",
    label: "Clubes",
    description: "Catálogo por confederação, país e clubes disponíveis.",
    icon: "football-outline",
  },
  {
    accent: "#58D68D",
    accentSoft: "rgba(88,214,141,0.18)",
    key: "selections",
    label: "Seleções",
    description: "Seleções organizadas por continente em uma única vitrine.",
    icon: "flag-outline",
  },
];

function normalizeGallerySection(section: string | string[] | undefined): GallerySection {
  const value = Array.isArray(section) ? section[0] : section;

  if (value === "clubs" || value === "selections") {
    return value;
  }

  return "titles";
}

function TitlesCardPreview({ accent }: { accent: string }) {
  return (
    <View
      style={{
        marginTop: 14,
        borderRadius: 18,
        padding: 14,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <View className="flex-row items-end justify-between">
        {[
          { label: "#3", height: 28, color: "rgba(255,255,255,0.18)" },
          { label: "#1", height: 52, color: accent },
          { label: "#2", height: 38, color: "rgba(255,255,255,0.30)" },
        ].map((item) => (
          <View key={item.label} className="items-center gap-2">
            <View
              style={{
                width: 34,
                height: item.height,
                borderRadius: 12,
                backgroundColor: item.color,
              }}
            />
            <Text
              style={{
                color: "#DDE6FF",
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 1.1,
              }}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ClubsCardPreview({ accent }: { accent: string }) {
  return (
    <View
      style={{
        marginTop: 14,
        borderRadius: 18,
        padding: 14,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <View className="flex-row items-center justify-between">
        {[
          { label: "CONT.", tone: "rgba(255,255,255,0.22)" },
          { label: "PAÍS", tone: accent },
          { label: "CLUBE", tone: "rgba(255,255,255,0.30)" },
        ].map((item, index) => (
          <View key={item.label} className="flex-row items-center">
            <View
              className="items-center justify-center rounded-[14px]"
              style={{
                width: 54,
                height: 40,
                backgroundColor: item.tone,
              }}
            >
              <Text
                style={{
                  color: "#F3F7FF",
                  fontSize: 10,
                  fontWeight: "900",
                  letterSpacing: 1,
                }}
              >
                {item.label}
              </Text>
            </View>
            {index < 2 ? (
              <Ionicons
                name="chevron-forward"
                size={16}
                color="rgba(255,255,255,0.45)"
                style={{ marginHorizontal: 6 }}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function SelectionsCardPreview({ accent }: { accent: string }) {
  return (
    <View
      style={{
        marginTop: 14,
        borderRadius: 18,
        padding: 14,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <View className="flex-row items-center justify-between">
        {["BRA", "JPN", "MAR"].map((label, index) => (
          <View key={label} className="items-center gap-2">
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: 42,
                height: 42,
                backgroundColor: index === 1 ? accent : "rgba(255,255,255,0.20)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              <Text
                style={{
                  color: index === 1 ? "#0B1328" : "#F3F7FF",
                  fontSize: 10,
                  fontWeight: "900",
                  letterSpacing: 0.8,
                }}
              >
                {label}
              </Text>
            </View>
            <View
              style={{
                width: 18,
                height: 4,
                borderRadius: 999,
                backgroundColor: index === 1 ? accent : "rgba(255,255,255,0.24)",
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function GalleryCardPreview({ option }: { option: GalleryOption }) {
  if (option.key === "titles") {
    return <TitlesCardPreview accent={option.accent} />;
  }

  if (option.key === "clubs") {
    return <ClubsCardPreview accent={option.accent} />;
  }

  return <SelectionsCardPreview accent={option.accent} />;
}

function GallerySwitchCard({
  option,
  active,
  onPress,
  compact,
}: {
  option: GalleryOption;
  active: boolean;
  onPress: () => void;
  compact: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1"
      style={{
        minWidth: compact ? "100%" : 220,
        minHeight: compact ? 168 : 194,
        overflow: "hidden",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: active ? option.accent : "rgba(255,255,255,0.08)",
        backgroundColor: active ? option.accentSoft : "rgba(9,16,31,0.88)",
        paddingHorizontal: compact ? 14 : 18,
        paddingVertical: compact ? 14 : 16,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -28,
          right: -24,
          width: 110,
          height: 110,
          borderRadius: 999,
          backgroundColor: active ? option.accent : "rgba(255,255,255,0.08)",
          opacity: active ? 0.18 : 0.08,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -34,
          left: -20,
          width: 124,
          height: 124,
          borderRadius: 999,
          backgroundColor: active ? option.accent : "rgba(255,255,255,0.06)",
          opacity: active ? 0.12 : 0.05,
        }}
      />

      <View className="flex-row items-center gap-3">
        <View
          className="items-center justify-center rounded-[16px]"
          style={{
            width: compact ? 42 : 48,
            height: compact ? 42 : 48,
            backgroundColor: active ? "#F4F7FF" : "#162344",
            borderWidth: 1,
            borderColor: active ? "rgba(255,255,255,0.72)" : "rgba(59,91,255,0.24)",
          }}
        >
          <Ionicons
            name={option.icon}
            size={22}
            color={active ? "#102C7A" : "#B7C7EA"}
          />
        </View>

        <View className="flex-1 gap-1">
          <Text
            style={{
              color: active ? "#F3F7FF" : "#E4ECFF",
              fontSize: compact ? 14 : 16,
              fontWeight: "900",
              letterSpacing: 0.4,
            }}
          >
            {option.label}
          </Text>
          <Text
            style={{
              color: active ? "#D6E0FF" : "#91A3CB",
              fontSize: compact ? 11 : 12,
              lineHeight: compact ? 16 : 18,
            }}
          >
            {option.description}
          </Text>
        </View>
      </View>

      <GalleryCardPreview option={option} />

      <View className="mt-3 flex-row items-center justify-between">
        <Text
            style={{
              color: active ? option.accent : "#8FA4CF",
              fontSize: compact ? 9 : 10,
              fontWeight: "900",
              letterSpacing: 1.5,
              textTransform: "uppercase",
          }}
        >
          {active ? "Visualização ativa" : "Clique para abrir"}
        </Text>
        <Ionicons
          name={active ? "checkmark-circle" : "arrow-forward-circle-outline"}
          size={18}
          color={active ? option.accent : "#8FA4CF"}
        />
      </View>
    </Pressable>
  );
}

export default function GalleryScreen() {
  const params = useLocalSearchParams<{ section?: string | string[] }>();
  return <GalleryScreenContent initialSection={params.section} />;
}

export function GalleryScreenContent({
  initialSection,
}: {
  initialSection?: string | string[];
}) {
  const { contentMaxWidth } = usePanelGrid();
  const { width } = useWindowDimensions();
  const activeSection = normalizeGallerySection(initialSection);
  const isCompactMobile = width < 420;
  const screenPadding = isCompactMobile ? "px-3" : "px-6";

  return (
    <Screen scroll ambientDiamond className={screenPadding}>
      <View className="w-full self-center gap-5 py-8" style={{ maxWidth: contentMaxWidth }}>
        <View className="gap-2">
          <Text
            style={{
              color: "#9AB8FF",
              fontSize: isCompactMobile ? 11 : 12,
              fontWeight: "900",
              letterSpacing: 2.4,
              textTransform: "uppercase",
            }}
          >
            Galeria
          </Text>
          <Text
            style={{
              color: "#F3F7FF",
              fontSize: isCompactMobile ? 24 : 30,
              fontWeight: "800",
            }}
          >
            Tudo em um único espaço
          </Text>
          <Text
            style={{
              color: "#AEBBDA",
              fontSize: isCompactMobile ? 14 : 16,
              lineHeight: isCompactMobile ? 22 : 26,
            }}
          >
            Selecione uma vitrine por vez. O conteúdo de Títulos, Clubes e Seleções agora fica centralizado aqui, sem espalhar a navegação em várias abas.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-4">
          {GALLERY_OPTIONS.map((option) => (
            <GallerySwitchCard
              key={option.key}
              option={option}
              active={option.key === activeSection}
              compact={isCompactMobile}
              onPress={() => {
                if (option.key === activeSection) {
                  return;
                }

                router.push({
                  pathname: "/gallery",
                  params: { section: option.key },
                });
              }}
            />
          ))}
        </View>
      </View>

      {activeSection === "titles" ? (
        <TitlesGalleryPanel />
      ) : (
        <View className="w-full self-center pb-8" style={{ maxWidth: contentMaxWidth }}>
          <TeamsByConfederationView
            data={activeSection === "clubs" ? CLUBES_DO_CATALOGO : SELECOES_DO_CATALOGO}
            headerLabel={activeSection === "clubs" ? "Clubes" : "Seleções"}
            headerSubtitle={
              activeSection === "clubs"
                ? "Os blocos começam recolhidos. Selecione um continente e depois clique no país para abrir os clubes disponíveis."
                : "As seleções ficam recolhidas até você clicar em uma confederação."
            }
          />
        </View>
      )}
    </Screen>
  );
}
