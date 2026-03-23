import { sampleVideos } from "@/lib/constants";

export async function listVideosByTournament() {
  return sampleVideos;
}

export async function uploadVideoHighlight() {
  return sampleVideos[0];
}
