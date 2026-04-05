import { useAppStore, type VideoPanelAccessMode } from "@/stores/app-store";

export function resolveVideoPanelAccessMode(mode?: VideoPanelAccessMode | null) {
  return mode ?? "owner";
}

export function useVideoPanelAccessMode() {
  return useAppStore((state) => resolveVideoPanelAccessMode(state.videoPanelAccessMode));
}

export function canModerateVideoPanel(args: {
  accessMode: VideoPanelAccessMode;
  userRole?: string | null;
}) {
  if (args.accessMode === "viewer") {
    return false;
  }

  if (args.accessMode === "owner") {
    return true;
  }

  if (args.accessMode === "moderator") {
    return true;
  }

  return args.userRole === "organizer" || args.userRole === "admin";
}
