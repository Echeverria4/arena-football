import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";

interface MatchShowdownCardProps {
  homeTeam: string;
  awayTeam: string;
  homePlayer: string;
  awayPlayer: string;
  phase: string;
  status: "pending" | "in_progress" | "finished";
  onOpen?: () => void;
}

const statusStyles = {
  pending: {
    label: "Aguardando",
    tone: "#4D82FF",
    background: "rgba(77,130,255,0.10)",
    border: "rgba(77,130,255,0.26)",
    icon: "ellipse" as const,
  },
  in_progress: {
    label: "Em andamento",
    tone: "#E1A91A",
    background: "rgba(225,169,26,0.10)",
    border: "rgba(225,169,26,0.26)",
    icon: "ellipse" as const,
  },
  finished: {
    label: "Finalizado",
    tone: "#13B77A",
    background: "rgba(19,183,122,0.10)",
    border: "rgba(19,183,122,0.26)",
    icon: "ellipse" as const,
  },
};

export function MatchShowdownCard({
  homeTeam,
  awayTeam,
  homePlayer,
  awayPlayer,
  phase,
  status,
  onOpen,
}: MatchShowdownCardProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const isSmallPhone = width < 420;
  const palette = statusStyles[status];

  return (
    <View
      style={{
        borderRadius: 30,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "rgba(59,91,255,0.14)",
        shadowColor: "#345EFF",
        shadowOpacity: 0.1,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        overflow: "hidden",
      }}
    >
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingHorizontal: isSmallPhone ? 14 : 22,
          paddingTop: isSmallPhone ? 14 : 20,
          paddingBottom: isSmallPhone ? 10 : 14,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(59,91,255,0.10)",
        }}
      >
        <View className="gap-1">
          <Text
            style={{
              color: "#5678C9",
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 2.6,
              textTransform: "uppercase",
            }}
          >
            {phase}
          </Text>
          <Text
            style={{
              color: "#1C2B4A",
              fontSize: isPhone ? 18 : 20,
              fontWeight: "800",
            }}
          >
            Card de jogo
          </Text>
        </View>

        <View
          className="flex-row items-center gap-2 rounded-full px-3 py-2"
          style={{
            backgroundColor: palette.background,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Ionicons name={palette.icon} size={10} color={palette.tone} />
          <Text
            style={{
              color: palette.tone,
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {palette.label}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onOpen}
        disabled={!onOpen}
        className="transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.01]"
        style={{ padding: isSmallPhone ? 14 : isPhone ? 18 : 24 }}
      >
        <View className={`items-center ${isPhone ? "gap-4" : "flex-row gap-4"}`}>
          <View className="flex-1 items-center gap-2">
            <View
              className="items-center justify-center rounded-[24px]"
              style={{
                width: isSmallPhone ? 72 : isPhone ? 96 : 110,
                height: isSmallPhone ? 72 : isPhone ? 96 : 110,
                backgroundColor: "#F7FAFF",
                borderWidth: 1,
                borderColor: "rgba(59,91,255,0.12)",
              }}
            >
              <Ionicons name="shield-outline" size={isSmallPhone ? 30 : isPhone ? 40 : 48} color="#4A70E8" />
            </View>
            <Text
              style={{
                color: "#1C2B4A",
                fontSize: isSmallPhone ? 15 : isPhone ? 18 : 22,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {homeTeam}
            </Text>
            <Text style={{ color: "#6B7EA3", fontSize: isSmallPhone ? 12 : 14, textAlign: "center" }}>
              {homePlayer}
            </Text>
          </View>

          <View className="items-center gap-2 px-2">
            <Text
              style={{
                color: "#5678C9",
                fontSize: isSmallPhone ? 12 : isPhone ? 13 : 14,
                fontWeight: "700",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              VS
            </Text>
            <View className="h-10 w-[1px]" style={{ backgroundColor: "rgba(59,91,255,0.16)" }} />
            <Text
              style={{
                color: "#89A0D8",
                fontSize: isSmallPhone ? 10 : 12,
                fontWeight: "700",
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              FIFA Style
            </Text>
          </View>

          <View className="flex-1 items-center gap-2">
            <View
              className="items-center justify-center rounded-[24px]"
              style={{
                width: isSmallPhone ? 72 : isPhone ? 96 : 110,
                height: isSmallPhone ? 72 : isPhone ? 96 : 110,
                backgroundColor: "#F7FAFF",
                borderWidth: 1,
                borderColor: "rgba(59,91,255,0.12)",
              }}
            >
              <Ionicons name="shield-outline" size={isSmallPhone ? 30 : isPhone ? 40 : 48} color="#4A70E8" />
            </View>
            <Text
              style={{
                color: "#1C2B4A",
                fontSize: isSmallPhone ? 15 : isPhone ? 18 : 22,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {awayTeam}
            </Text>
            <Text style={{ color: "#6B7EA3", fontSize: isSmallPhone ? 12 : 14, textAlign: "center" }}>
              {awayPlayer}
            </Text>
          </View>
        </View>

        <PrimaryButton
          label="Entrar na partida"
          onPress={onOpen}
          variant="light"
          className="mt-5 w-full rounded-[18px] py-3"
        />
      </Pressable>
    </View>
  );
}
