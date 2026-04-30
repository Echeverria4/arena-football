import { Ionicons } from "@expo/vector-icons";
import { useGlobalSearchParams, usePathname } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { DeadlineCalendarPicker } from "@/components/tournament/DeadlineCalendarPicker";
import { canEditTournament, resolveTournamentAccessMode } from "@/lib/tournament-access";
import { getCountdownParts } from "@/lib/tournament-deadlines";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";

function formatCountdown(ms: number): string {
  const { days, hours, minutes, seconds } = getCountdownParts(ms);
  if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

function formatDeadlineLabel(deadline: Date): string {
  const day = String(deadline.getDate()).padStart(2, "0");
  const month = String(deadline.getMonth() + 1).padStart(2, "0");
  const h = String(deadline.getHours()).padStart(2, "0");
  const m = String(deadline.getMinutes()).padStart(2, "0");
  return `${day}/${month} às ${h}:${m}`;
}

export function TournamentDeadlinePill() {
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const atualizarCampeonato = useTournamentStore((state) => state.atualizarCampeonato);

  // Resolve o campeonato a partir da URL primeiro (fonte da verdade
  // imediata quando o usuario navega entre campeonatos), com fallback
  // para o currentTournamentId do app-store. Isso evita o pill mostrar
  // o deadline do campeonato anterior por alguns frames durante a
  // transicao de telas — cada campeonato passa a ter sua propria gestao
  // de tempo, sem leak entre telas.
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ id?: string | string[] }>();
  const activeTournamentId = useMemo(() => {
    const fromParams = Array.isArray(params.id) ? params.id[0] : params.id;
    if (fromParams) return fromParams;

    // Caso a rota seja /tournament/[id] sem params (id inline na URL).
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "tournament" && segments[1] && !segments[1].startsWith("[")) {
      const knownStaticRoutes = new Set([
        "access",
        "create",
        "matches",
        "participants",
        "preview",
        "share",
        "standings",
        "statistics",
        "videos",
      ]);
      if (!knownStaticRoutes.has(segments[1])) {
        return segments[1];
      }
    }

    return currentTournamentId ?? undefined;
  }, [pathname, params.id, currentTournamentId]);

  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);

  const campeonato = campeonatos.find((c) => c.id === activeTournamentId) ?? null;
  const accessMode = resolveTournamentAccessMode(tournamentAccess, activeTournamentId);
  const canEdit = canEditTournament(accessMode);

  const deadline = campeonato?.prazoFinalEm ? new Date(campeonato.prazoFinalEm) : null;
  const remainingMs = deadline ? deadline.getTime() - now : null;
  const expired = remainingMs !== null && remainingMs <= 0;

  useEffect(() => {
    if (!deadline) { setNow(Date.now()); return; }
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [campeonato?.prazoFinalEm]);

  if (!campeonato || !deadline) return null;

  function handleSaveDeadline(date: Date) {
    if (!campeonato) return;
    atualizarCampeonato(campeonato.id, { prazoFinalEm: date.toISOString() });
    setOpen(false);
  }

  function handleReset() {
    if (!campeonato) return;
    atualizarCampeonato(campeonato.id, {
      prazoFinalEm: undefined,
      prazoRodadaDias: undefined,
      inicioEm: undefined,
    });
    setOpen(false);
  }

  const pillBg = expired ? "rgba(60,10,10,0.96)" : deadline ? "rgba(8,18,32,0.96)" : "rgba(12,20,36,0.92)";
  const pillBorder = expired
    ? "rgba(220,60,60,0.45)"
    : deadline
      ? "rgba(59,130,246,0.36)"
      : "rgba(59,130,246,0.2)";
  const clockColor = expired ? "#FF5252" : deadline ? "#60A5FA" : "#5B7FC4";

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        zIndex: 999,
        justifyContent: "flex-end",
        alignItems: "flex-end",
      }}
    >
      <View style={{ padding: 18, alignItems: "flex-end", gap: 10 }}>
        {open && (
          <DeadlineCalendarPicker
            currentDeadline={deadline}
            onConfirm={handleSaveDeadline}
            onCancel={() => setOpen(false)}
            onReset={handleReset}
          />
        )}

        <Pressable
          onPress={() => canEdit && setOpen((o) => !o)}
          disabled={!canEdit && !deadline}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: pillBorder,
            backgroundColor: pillBg,
            shadowColor: expired ? "#FF5252" : "#3B5BFF",
            shadowOpacity: 0.22,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Ionicons
            name={expired ? "alert-circle-outline" : "timer-outline"}
            size={15}
            color={clockColor}
          />

          {deadline ? (
            <>
              <View>
                <Text style={{ color: expired ? "#FF7070" : "#DCE9FF", fontSize: 13, fontWeight: "900" }}>
                  {expired ? "Prazo vencido" : formatCountdown(remainingMs!)}
                </Text>
                <Text style={{ color: expired ? "#A04040" : "#4E6F9C", fontSize: 9, fontWeight: "700", letterSpacing: 0.5 }}>
                  {formatDeadlineLabel(deadline)}
                </Text>
              </View>
              {canEdit && (
                <>
                  <View style={{ width: 1, height: 20, backgroundColor: pillBorder }} />
                  <Ionicons name={open ? "close" : "pencil-outline"} size={12} color={clockColor} />
                </>
              )}
            </>
          ) : canEdit ? (
            <Text style={{ color: "#5B7FC4", fontSize: 13, fontWeight: "800" }}>
              Definir prazo final
            </Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}
