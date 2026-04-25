import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { SyncStatus } from "@/hooks/useTournamentRealtimeSync";

const STATUS_COLOR: Record<SyncStatus, { bg: string; fg: string; label: string }> = {
  idle: { bg: "rgba(148,163,184,0.18)", fg: "#94A3B8", label: "Aguardando" },
  syncing: { bg: "rgba(59,130,246,0.22)", fg: "#93C5FD", label: "Sincronizando" },
  synced: { bg: "rgba(16,185,129,0.22)", fg: "#6EE7B7", label: "Atualizado" },
  error: { bg: "rgba(239,68,68,0.22)", fg: "#FCA5A5", label: "Sem conexao" },
};

function formatRelative(ms: number | null): string {
  if (!ms) return "";
  const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diff < 5) return "agora";
  if (diff < 60) return `ha ${diff}s`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `ha ${mins}min`;
  const hours = Math.floor(mins / 60);
  return `ha ${hours}h`;
}

export function SyncStatusPill({
  status,
  lastSyncedAt,
  lastError,
}: {
  status: SyncStatus;
  lastSyncedAt: number | null;
  lastError: string | null;
}) {
  // Re-render every 5s so the "ha Xs" relative timer stays current.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const [showError, setShowError] = useState(false);

  if (status === "idle") {
    return null;
  }

  const palette = STATUS_COLOR[status];
  const relative = formatRelative(lastSyncedAt);
  const text =
    status === "synced"
      ? `Atualizado ${relative}`
      : status === "error"
        ? "Sem conexao"
        : status === "syncing"
          ? "Sincronizando..."
          : palette.label;

  return (
    <Pressable
      onPress={() => {
        if (status === "error" && lastError) {
          setShowError((v) => !v);
        }
      }}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.fg + "33",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: palette.fg,
        }}
      />
      <Text
        style={{
          color: palette.fg,
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 0.5,
        }}
      >
        {text}
      </Text>
      {showError && lastError ? (
        <Text style={{ color: palette.fg, fontSize: 10 }} numberOfLines={2}>
          {" • "}
          {lastError.slice(0, 80)}
        </Text>
      ) : null}
    </Pressable>
  );
}
