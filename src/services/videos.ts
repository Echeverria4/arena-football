import { useVideoStore } from "@/stores/video-store";

export async function listVideosByTournament(tournamentId?: string) {
  const videos = useVideoStore.getState().videos;

  if (!tournamentId) {
    return videos;
  }

  return videos.filter((video) => video.tournamentId === tournamentId);
}

export async function uploadVideoHighlight(input: {
  createdByName: string;
  tournamentId: string;
  tournamentName: string;
  title: string;
  teamName: string;
  userId: string;
  videoUrl: string;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  storageKey?: string | null;
}) {
  return useVideoStore.getState().addVideo(input);
}
