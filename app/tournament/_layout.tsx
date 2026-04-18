import { router, Stack, useGlobalSearchParams, usePathname } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { TournamentDeadlinePill } from "@/components/tournament/TournamentDeadlinePill";
import { isTournamentAccessLocked, resolveTournamentAccessMode } from "@/lib/tournament-access";
import { useAppStore } from "@/stores/app-store";

function resolveTournamentRouteKey(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const routeSegment = segments[1];

  if (!routeSegment) {
    return undefined;
  }

  if (
    routeSegment === "access" ||
    routeSegment === "create" ||
    routeSegment === "matches" ||
    routeSegment === "participants" ||
    routeSegment === "preview" ||
    routeSegment === "share" ||
    routeSegment === "standings" ||
    routeSegment === "statistics" ||
    routeSegment === "videos"
  ) {
    return routeSegment;
  }

  return "[id]";
}

function buildLockedTournamentTarget(routeKey: string | undefined, tournamentId: string) {
  switch (routeKey) {
    case "matches":
      return { pathname: "/tournament/matches" as const, params: { id: tournamentId } };
    case "participants":
      return { pathname: "/tournament/participants" as const, params: { id: tournamentId } };
    case "standings":
      return { pathname: "/tournament/standings" as const, params: { id: tournamentId } };
    case "statistics":
      return { pathname: "/tournament/statistics" as const, params: { id: tournamentId } };
    case "videos":
      return { pathname: "/tournament/videos" as const, params: { id: tournamentId } };
    default:
      return { pathname: "/tournament/[id]" as const, params: { id: tournamentId } };
  }
}

export default function TournamentLayout() {
  const pathname = usePathname();
  const { id } = useGlobalSearchParams<{ id?: string | string[] }>();
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const routeKey = resolveTournamentRouteKey(pathname);
  const routeTournamentIdFromParams = Array.isArray(id) ? id[0] : id;
  const routeTournamentIdFromPath =
    routeKey === "[id]" ? pathname.split("/").filter(Boolean)[1] : undefined;
  const routeTournamentId =
    routeTournamentIdFromParams ??
    (routeTournamentIdFromPath && !routeTournamentIdFromPath.startsWith("[")
      ? routeTournamentIdFromPath
      : undefined);
  const activeTournamentAccessMode = resolveTournamentAccessMode(
    tournamentAccess,
    currentTournamentId,
  );
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);
  const isShareRoute = routeKey === "share";
  const isAllowedScopedRoute =
    routeKey === "[id]" ||
    routeKey === "matches" ||
    routeKey === "participants" ||
    routeKey === "preview" ||
    routeKey === "standings" ||
    routeKey === "statistics" ||
    routeKey === "videos";
  const shouldRedirect =
    Boolean(lockToActiveTournament && currentTournamentId) &&
    !isShareRoute &&
    (!isAllowedScopedRoute ||
      (Boolean(routeTournamentId) && routeTournamentId !== currentTournamentId));

  useEffect(() => {
    if (!shouldRedirect || !currentTournamentId) {
      return;
    }

    router.replace(buildLockedTournamentTarget(routeKey, currentTournamentId));
  }, [currentTournamentId, routeKey, shouldRedirect]);

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#050A11", flex: 1, width: "100%", maxWidth: "100vw" as never, minHeight: 0, overflow: "hidden" as never },
        }}
      />
      <TournamentDeadlinePill />
    </View>
  );
}
