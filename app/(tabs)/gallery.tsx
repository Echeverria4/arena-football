import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

import { TitlesGalleryPanel } from "@/components/gallery/TitlesGalleryPanel";
import { Screen } from "@/components/ui/Screen";
import { usePanelGrid } from "@/components/ui/usePanelGrid";

export type GallerySection = "titles";

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
    label: "Hall da Fama",
    description: "Histórico de campeões, pódio de ganhadores e temporadas encerradas.",
    icon: "ribbon-outline",
  },
];

function normalizeGallerySection(section: string | string[] | undefined): GallerySection {
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
      <View className="flex-row items-end justify-between">
        {[
          { label: "🥉", height: 28, color: "rgba(255,255,255,0.18)" },
          { label: "🥇", height: 52, color: accent },
          { label: "🥈", height: 38, color: "rgba(255,255,255,0.30)" },
        ].map((item) => (
          <View key={item.label} className="items-center gap-2">
            <Text
              style={{
                fontSize: 32,
              }}
            >
              {item.label}
            </Text>
            <View
              style={{
                width: 34,
                height: item.height,
                borderRadius: 12,
                backgroundColor: item.color,
              }}
            />
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
        {["🥉", "🥇", "🥈"].map((label, index) => (
          <View key={label} className="items-center gap-2">
            <Text
              style={{
                fontSize: 32,
              }}
            >
              {label}
            </Text>
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
                {index === 0 ? "3º" : index === 1 ? "1º" : "2º"}
              </Text>
            </View>
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
            Hall da Fama
          </Text>
          <Text
            style={{
              color: "#AEBBDA",
              fontSize: isCompactMobile ? 14 : 16,
              lineHeight: isCompactMobile ? 22 : 26,
            }}
          >
            Histórico oficial de campeões, pódio dos ganhadores com nomes e contatos, ranking de títulos e arquivo completo de temporadas encerradas.
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
      ) : null}
    </Screen>
  );
}
