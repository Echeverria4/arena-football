import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

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
  buttonLabel = "Salvar",
  countdown = null,
  defaultDays = 3,
  variant = "light",
  onSave,
}: RoundDeadlineSetupCardProps) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(defaultDays);

  useEffect(() => {
    setDays(defaultDays);
  }, [defaultDays]);

  function adjustDays(delta: number) {
    setDays((v) => Math.max(1, Math.min(30, v + delta)));
  }

  function handleSave() {
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      Alert.alert("Prazo inválido", "Informe um prazo entre 1 e 30 dias.");
      return;
    }
    onSave(days);
    setOpen(false);
  }

  // Countdown label for collapsed pill
  function getClockLabel() {
    if (!countdown) return `${defaultDays}d / rodada`;
    if (countdown.expired) return "Prazo vencido";
    const parts: string[] = [];
    if (countdown.days > 0) parts.push(`${countdown.days}d`);
    parts.push(`${String(countdown.hours).padStart(2, "0")}h`);
    parts.push(`${String(countdown.minutes).padStart(2, "0")}m`);
    return parts.join(" ");
  }

  const isExpired = countdown?.expired ?? false;
  const hasCountdown = Boolean(countdown && !countdown.expired);

  const pillBg = variant === "dark"
    ? "rgba(30,30,40,0.92)"
    : "rgba(255,255,255,0.96)";
  const pillBorder = hasCountdown
    ? "rgba(59,91,255,0.28)"
    : isExpired
      ? "rgba(220,60,60,0.35)"
      : "rgba(59,91,255,0.16)";
  const clockColor = hasCountdown ? "#3B82F6" : isExpired ? "#DC4040" : "#5678C9";
  const labelColor = variant === "dark" ? "#E0EAFF" : "#1C2B4A";

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: pillBorder,
          backgroundColor: pillBg,
          shadowColor: "#3B5BFF",
          shadowOpacity: 0.10,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Ionicons name="timer-outline" size={15} color={clockColor} />
        <Text style={{ color: labelColor, fontSize: 13, fontWeight: "800", letterSpacing: 0.3 }}>
          {getClockLabel()}
        </Text>
        <View style={{ width: 1, height: 12, backgroundColor: pillBorder, marginHorizontal: 2 }} />
        <Ionicons name="pencil-outline" size={12} color={clockColor} />
      </Pressable>
    );
  }

  // Expanded inline editor
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(59,91,255,0.28)",
        backgroundColor: pillBg,
        shadowColor: "#3B5BFF",
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        flexWrap: "wrap",
      }}
    >
      <Ionicons name="timer-outline" size={15} color="#3B82F6" />

      {/* Stepper */}
      <Pressable
        onPress={() => adjustDays(-1)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          backgroundColor: "rgba(59,91,255,0.08)",
          borderWidth: 1,
          borderColor: "rgba(59,91,255,0.18)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#1C2B4A", fontSize: 18, fontWeight: "700", lineHeight: 20 }}>−</Text>
      </Pressable>

      <View style={{ alignItems: "center", minWidth: 52 }}>
        <Text style={{ color: "#1C2B4A", fontSize: 18, fontWeight: "900" }}>{days}</Text>
        <Text style={{ color: "#7481A2", fontSize: 8, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>dias</Text>
      </View>

      <Pressable
        onPress={() => adjustDays(1)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          backgroundColor: "rgba(59,91,255,0.08)",
          borderWidth: 1,
          borderColor: "rgba(59,91,255,0.18)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#1C2B4A", fontSize: 18, fontWeight: "700", lineHeight: 20 }}>+</Text>
      </Pressable>

      {/* Reset */}
      <Pressable
        onPress={() => {
          setDays(0);
          onSave(0);
          setOpen(false);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 11,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: "rgba(220,60,60,0.10)",
          borderWidth: 1,
          borderColor: "rgba(220,60,60,0.22)",
        }}
      >
        <Ionicons name="refresh-outline" size={12} color="#DC4040" />
        <Text style={{ color: "#DC4040", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 }}>
          Zerar
        </Text>
      </Pressable>

      {/* Save */}
      <Pressable
        onPress={handleSave}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: "#2447A6",
        }}
      >
        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 }}>
          {buttonLabel}
        </Text>
      </Pressable>

      {/* Close */}
      <Pressable onPress={() => setOpen(false)} style={{ padding: 4 }}>
        <Ionicons name="close" size={15} color="#94A3B8" />
      </Pressable>
    </View>
  );
}
