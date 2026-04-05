import { Pressable, Text, View } from "react-native";

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

interface RoundDeadlineCountdownCardProps {
  countdown: CountdownData | null;
  tone?: "light" | "dark";
  canAdjust?: boolean;
  onDecreaseHour?: () => void;
  onIncreaseHour?: () => void;
}

function formatUnit(value: number) {
  return String(value).padStart(2, "0");
}

function formatExtraTimeLabel(extraTimeMs: number) {
  if (!extraTimeMs) {
    return "Sem tempo extra";
  }

  const absoluteHours = Math.floor(Math.abs(extraTimeMs) / (60 * 60 * 1000));
  const absoluteMinutes = Math.floor((Math.abs(extraTimeMs) % (60 * 60 * 1000)) / (60 * 1000));
  const sign = extraTimeMs > 0 ? "+" : "-";
  const timeLabel =
    absoluteMinutes > 0
      ? `${absoluteHours}h ${String(absoluteMinutes).padStart(2, "0")}m`
      : `${absoluteHours}h`;

  return `${sign}${timeLabel} de tempo extra`;
}

export function RoundDeadlineCountdownCard({
  countdown,
  tone = "light",
  canAdjust = false,
  onDecreaseHour,
  onIncreaseHour,
}: RoundDeadlineCountdownCardProps) {
  const palette =
    tone === "dark"
      ? {
          surface: "rgba(255,255,255,0.04)",
          border: "rgba(255,255,255,0.10)",
          title: "#F3F7FF",
          text: "#AEBBDA",
          valueSurface: "rgba(7,13,24,0.72)",
          valueBorder: "rgba(255,255,255,0.10)",
          valueText: "#FFFFFF",
          valueLabel: "#8FA1C8",
          buttonSurface: "rgba(255,255,255,0.08)",
          buttonBorder: "rgba(255,255,255,0.12)",
          buttonText: "#F3F7FF",
        }
      : {
          surface: "rgba(59,91,255,0.05)",
          border: "rgba(59,91,255,0.10)",
          title: "#1C2B4A",
          text: "#6B7EA3",
          valueSurface: "#FFFFFF",
          valueBorder: "rgba(59,91,255,0.10)",
          valueText: "#1C2B4A",
          valueLabel: "#7481A2",
          buttonSurface: "#FFFFFF",
          buttonBorder: "rgba(59,91,255,0.10)",
          buttonText: "#1C2B4A",
        };

  if (!countdown) {
    return (
      <View
        className="gap-2 rounded-[20px] px-4 py-4"
        style={{
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
        }}
      >
        <Text style={{ color: palette.title, fontSize: 16, fontWeight: "800" }}>
          Contagem regressiva indisponível
        </Text>
        <Text style={{ color: palette.text, fontSize: 14, lineHeight: 22 }}>
          Defina primeiro o prazo das rodadas para iniciar o cronômetro oficial.
        </Text>
      </View>
    );
  }

  const units = [
    { label: "dias", value: countdown.days },
    { label: "horas", value: countdown.hours },
    { label: "min", value: countdown.minutes },
    { label: "seg", value: countdown.seconds },
  ];

  return (
    <View
      className="gap-3 rounded-[20px] px-4 py-4"
      style={{
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      <View className="gap-1">
        <Text style={{ color: palette.title, fontSize: 17, fontWeight: "900", textAlign: "center" }}>
          Rodada {countdown.round} em contagem regressiva
        </Text>
        <Text style={{ color: palette.text, fontSize: 13, lineHeight: 20, textAlign: "center" }}>
          Prazo final em {new Date(countdown.deadlineAt).toLocaleString("pt-BR")}
        </Text>
        <Text style={{ color: palette.text, fontSize: 12, fontWeight: "700", textAlign: "center" }}>
          {formatExtraTimeLabel(countdown.extraTimeMs)}
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center justify-center gap-2">
        {units.map((unit) => (
          <View
            key={unit.label}
            className="items-center justify-center rounded-[18px] px-3 py-3"
            style={{
              minWidth: 72,
              backgroundColor: palette.valueSurface,
              borderWidth: 1,
              borderColor: palette.valueBorder,
            }}
          >
            <Text style={{ color: palette.valueText, fontSize: 24, fontWeight: "900" }}>
              {formatUnit(unit.value)}
            </Text>
            <Text
              style={{
                color: palette.valueLabel,
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 1.1,
                textTransform: "uppercase",
              }}
            >
              {unit.label}
            </Text>
          </View>
        ))}
      </View>

      {canAdjust ? (
        <View className="flex-row items-center justify-center gap-3">
          <Pressable
            onPress={onDecreaseHour}
            className="rounded-[16px] px-4 py-3 active:opacity-80"
            style={{
              backgroundColor: palette.buttonSurface,
              borderWidth: 1,
              borderColor: palette.buttonBorder,
            }}
          >
            <Text
              style={{
                color: palette.buttonText,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              -1h
            </Text>
          </Pressable>

          <Pressable
            onPress={onIncreaseHour}
            className="rounded-[16px] px-4 py-3 active:opacity-80"
            style={{
              backgroundColor: palette.buttonSurface,
              borderWidth: 1,
              borderColor: palette.buttonBorder,
            }}
          >
            <Text
              style={{
                color: palette.buttonText,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              +1h
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
