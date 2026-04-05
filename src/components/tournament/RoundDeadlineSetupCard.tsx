import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { RoundDeadlineCountdownCard } from "@/components/tournament/RoundDeadlineCountdownCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

type CountdownData = {
  round: number;
  deadlineAt: string;
  remainingMs: number;
  expired: boolean;
  extraTimeMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

interface RoundDeadlineSetupCardProps {
  buttonLabel?: string;
  countdown?: CountdownData | null;
  canAdjustExtraTime?: boolean;
  defaultDays?: number;
  onDecreaseExtraHour?: () => void;
  onIncreaseExtraHour?: () => void;
  subtitle: string;
  title: string;
  variant?: "light" | "dark";
  onSave: (days: number) => void;
}

export function RoundDeadlineSetupCard({
  buttonLabel = "Iniciar rodadas",
  countdown = null,
  canAdjustExtraTime = false,
  defaultDays = 3,
  onDecreaseExtraHour,
  onIncreaseExtraHour,
  subtitle,
  title,
  variant = "light",
  onSave,
}: RoundDeadlineSetupCardProps) {
  const [days, setDays] = useState(defaultDays);

  const palette =
    variant === "dark"
      ? {
          containerBackground: "#343434",
          containerBorder: "rgba(255,255,255,0.12)",
          eyebrow: "#D9D9D9",
          title: "#FFFFFF",
          subtitle: "rgba(255,255,255,0.78)",
          label: "#FFFFFF",
          controlBackground: "#242424",
          controlBorder: "rgba(255,255,255,0.14)",
          controlText: "#FFFFFF",
          valueBackground: "rgba(255,255,255,0.06)",
          valueBorder: "rgba(255,255,255,0.14)",
          valueText: "#FFFFFF",
          valueHelper: "rgba(255,255,255,0.58)",
          buttonVariant: "secondary" as const,
        }
      : {
          containerBackground: "#F7FAFF",
          containerBorder: "rgba(59,91,255,0.10)",
          eyebrow: "#5678C9",
          title: "#1C2B4A",
          subtitle: "#6B7EA3",
          label: "#1C2B4A",
          controlBackground: "#FFFFFF",
          controlBorder: "rgba(59,91,255,0.10)",
          controlText: "#1C2B4A",
          valueBackground: "#FFFFFF",
          valueBorder: "rgba(59,91,255,0.10)",
          valueText: "#1C2B4A",
          valueHelper: "#7481A2",
          buttonVariant: "primary" as const,
        };

  useEffect(() => {
    setDays(defaultDays);
  }, [defaultDays]);

  function handleSave() {
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      Alert.alert("Prazo inválido", "Informe um prazo entre 1 e 30 dias para cada rodada.");
      return;
    }

    onSave(days);
  }

  function adjustDays(delta: number) {
    setDays((currentValue) => Math.max(1, Math.min(30, currentValue + delta)));
  }

  return (
    <View
      className="w-full max-w-[760px] gap-3 rounded-[20px] p-4"
      style={{
        backgroundColor: palette.containerBackground,
        borderWidth: 0.8,
        borderColor: palette.containerBorder,
        shadowColor: "#000000",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      }}
    >
      <View className="gap-1.5">
        <Text
          style={{
            color: palette.eyebrow,
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          Rodadas
        </Text>
        <Text style={{ color: palette.title, fontSize: 21, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: palette.subtitle, fontSize: 14, lineHeight: 24 }}>{subtitle}</Text>
      </View>

      <View className="gap-1.5">
        <Text style={{ color: palette.label, fontSize: 13, fontWeight: "700" }}>
          Prazo por rodada
        </Text>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => adjustDays(-1)}
            className="items-center justify-center rounded-[18px]"
            style={{
              width: 48,
              height: 48,
              backgroundColor: palette.controlBackground,
              borderWidth: 0.8,
              borderColor: palette.controlBorder,
            }}
          >
            <Text style={{ color: palette.controlText, fontSize: 24, fontWeight: "700" }}>-</Text>
          </Pressable>

          <View
            className="items-center justify-center rounded-[14px] px-2 py-1.5"
            style={{
              width: 78,
              minHeight: 28,
              backgroundColor: palette.valueBackground,
              borderWidth: 0.8,
              borderColor: palette.valueBorder,
            }}
          >
            <Text style={{ color: palette.valueText, fontSize: 14, fontWeight: "900" }}>
              {days}
            </Text>
            <Text style={{ color: palette.valueHelper, fontSize: 8, fontWeight: "700", letterSpacing: 0.9, textTransform: "uppercase" }}>
              dias
            </Text>
          </View>

          <Pressable
            onPress={() => adjustDays(1)}
            className="items-center justify-center rounded-[18px]"
            style={{
              width: 48,
              height: 48,
              backgroundColor: palette.controlBackground,
              borderWidth: 0.8,
              borderColor: palette.controlBorder,
            }}
          >
            <Text style={{ color: palette.controlText, fontSize: 24, fontWeight: "700" }}>+</Text>
          </Pressable>
        </View>

        <Text
          style={{
            color: palette.valueHelper,
            fontSize: 12,
            lineHeight: 18,
          }}
        >
          Use os botões para ajustar entre 1 e 30 dias por rodada.
        </Text>
      </View>

      <PrimaryButton
        label={buttonLabel}
        onPress={handleSave}
        variant={palette.buttonVariant}
        size="sm"
        className="self-start rounded-[16px] px-4 py-2"
        style={{ borderWidth: 0.8 }}
      />

      <RoundDeadlineCountdownCard
        countdown={countdown}
        tone={variant === "dark" ? "dark" : "light"}
        canAdjust={canAdjustExtraTime}
        onDecreaseHour={onDecreaseExtraHour}
        onIncreaseHour={onIncreaseExtraHour}
      />
    </View>
  );
}
