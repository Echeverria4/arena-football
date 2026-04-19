import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  GLOBAL_VIDEO_PANEL_ID,
  GLOBAL_VIDEO_PANEL_NAME,
  normalizeVideoVoterPhone,
} from "@/lib/video-panel";
import {
  prepareGlobalVideoPayload,
  type GlobalVideoPublishError,
  type GlobalVideoPublishInput,
} from "@/lib/video-publishing";
import { persistStorage } from "@/stores/persist-storage";
import type { VideoHighlight } from "@/types/video";

interface AddVideoInput {
  createdByName: string;
  tournamentId: string;
  tournamentName: string;
  title: string;
  teamName: string;
  teamName2?: string | null;
  description?: string | null;
  playerPhone?: string | null;
  userId: string;
  videoUrl: string;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  storageKey?: string | null;
}

interface VideoState {
  videos: VideoHighlight[];
  userVotes: Record<string, string>;
  // Per-tournament phone-based voting (tournament videos)
  tournamentVotesByPhone: Record<string, Record<string, string>>; // tournamentId -> normalizedPhone -> videoId
  tournamentVoterNames: Record<string, Record<string, string>>; // tournamentId -> normalizedPhone -> voterName
  globalVideoVoterPhones: string[];
  globalVideoVotesByPhone: Record<string, string>;
  globalVotingClosed: boolean;
  globalVotingClosedAt: string | null;
  globalWinningVideoId: string | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  addVideo: (input: AddVideoInput) => VideoHighlight;
  addGlobalVideo: (
    input: Omit<AddVideoInput, "tournamentId" | "tournamentName"> & { teamName?: string },
  ) => VideoHighlight;
  publicarVideoGlobal: (
    input: GlobalVideoPublishInput,
  ) =>
    | {
        ok: true;
        video: VideoHighlight;
        normalizedPublicVideoUrl: string | null;
      }
    | {
        ok: false;
        error: GlobalVideoPublishError;
      };
  importarPainelGlobalCompartilhado: (input: {
    videos: VideoHighlight[];
    voterPhones: string[];
    votesByPhone: Record<string, string>;
    votingClosed: boolean;
    votingClosedAt?: string | null;
    winningVideoId?: string | null;
  }) => void;
  importarVideosCompartilhados: (tournamentId: string, videos: VideoHighlight[]) => void;
  voteVideo: (voterId: string, videoId: string) => boolean;
  voteGlobalVideo: (phone: string, videoId: string) => boolean;
  registrarVisualizacaoVideo: (videoId: string) => void;
  adicionarVotanteGlobal: (phone: string) => boolean;
  editarVotanteGlobal: (currentPhone: string, nextPhone: string) => boolean;
  removerVotanteGlobal: (phone: string) => void;
  encerrarVotacaoGlobal: () => string | null;
  reabrirVotacaoGlobal: () => void;
  definirVencedorGlobal: (videoId: string) => boolean;
  voteTournamentVideoByPhone: (tournamentId: string, phone: string, voterName: string, videoId: string) => boolean;
  removeVideo: (videoId: string) => void;
  removerVideosDoCampeonato: (tournamentId: string) => void;
}

function pickGlobalWinningVideoId(videos: VideoHighlight[]) {
  const orderedVideos = [...videos]
    .filter((video) => video.tournamentId === GLOBAL_VIDEO_PANEL_ID)
    .sort((current, next) => {
      if (next.votesCount !== current.votesCount) {
        return next.votesCount - current.votesCount;
      }

      const currentCreatedAt = current.createdAt ? new Date(current.createdAt).getTime() : 0;
      const nextCreatedAt = next.createdAt ? new Date(next.createdAt).getTime() : 0;

      if (currentCreatedAt !== nextCreatedAt) {
        return currentCreatedAt - nextCreatedAt;
      }

      return String(current.id).localeCompare(String(next.id));
    });

  return orderedVideos[0]?.id ?? null;
}

function applyGlobalWinner(videos: VideoHighlight[], winningVideoId: string | null) {
  return videos.map((video) =>
    video.tournamentId === GLOBAL_VIDEO_PANEL_ID
      ? {
          ...video,
          isGoalAwardWinner: Boolean(winningVideoId) && video.id === winningVideoId,
        }
      : video,
  );
}

export const useVideoStore = create<VideoState>()(
  persist(
    (set, get) => ({
      videos: [],
      userVotes: {},
      tournamentVotesByPhone: {},
      tournamentVoterNames: {},
      globalVideoVoterPhones: [],
      globalVideoVotesByPhone: {},
      globalVotingClosed: false,
      globalVotingClosedAt: null,
      globalWinningVideoId: null,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      addVideo: ({
        createdByName,
        tournamentId,
        tournamentName,
        title,
        teamName,
        teamName2,
        description,
        playerPhone,
        userId,
        videoUrl,
        fileName,
        fileSizeBytes,
        mimeType,
        storageKey,
      }) => {
        const currentVideos = get().videos;
        const nextIndex = currentVideos.length + 1;
        const nextVideo: VideoHighlight = {
          id: `video-${nextIndex}`,
          tournamentId,
          tournamentName,
          matchId: null,
          userId,
          title: title.trim() || `Lance da rodada ${nextIndex}`,
          teamName: teamName.trim() || null,
          teamName2: teamName2?.trim() || null,
          playerPhone: playerPhone?.trim() || null,
          description: description?.trim() || null,
          videoUrl,
          thumbnailUrl: null,
          fileName: fileName?.trim() || null,
          fileSizeBytes: fileSizeBytes ?? null,
          mimeType: mimeType?.trim() || null,
          storageKey: storageKey?.trim() || null,
          approvalStatus: "approved",
          votesCount: 0,
          viewsCount: 0,
          isGoalAwardWinner: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          videos: [nextVideo, ...state.videos],
        }));

        return nextVideo;
      },
      addGlobalVideo: ({ createdByName, title, teamName = "", description, playerPhone, userId, videoUrl, fileName, fileSizeBytes, mimeType, storageKey }) =>
        get().addVideo({
          createdByName,
          tournamentId: GLOBAL_VIDEO_PANEL_ID,
          tournamentName: GLOBAL_VIDEO_PANEL_NAME,
          title,
          teamName,
          description,
          playerPhone,
          userId,
          videoUrl,
          fileName,
          fileSizeBytes,
          mimeType,
          storageKey,
        }),
      publicarVideoGlobal: (input) => {
        const preparedPayload = prepareGlobalVideoPayload(input);

        if (!preparedPayload.ok) {
          return {
            ok: false,
            error: preparedPayload.error,
          };
        }

        const nextVideo = get().addVideo(preparedPayload.payload);

        return {
          ok: true,
          video: nextVideo,
          normalizedPublicVideoUrl: preparedPayload.normalizedPublicVideoUrl,
        };
      },
      importarPainelGlobalCompartilhado: ({
        videos,
        voterPhones,
        votesByPhone,
        votingClosed,
        votingClosedAt,
        winningVideoId,
      }) =>
        set((state) => ({
          videos: [
            ...applyGlobalWinner(
              videos.map((video, index) => ({
                ...video,
                id: video.id || `shared-global-video-${index + 1}`,
                tournamentId: GLOBAL_VIDEO_PANEL_ID,
                tournamentName: GLOBAL_VIDEO_PANEL_NAME,
              })),
              winningVideoId ?? null,
            ),
            ...state.videos.filter((video) => video.tournamentId !== GLOBAL_VIDEO_PANEL_ID),
          ],
          globalVideoVoterPhones: [...voterPhones],
          globalVideoVotesByPhone: { ...votesByPhone },
          globalVotingClosed: Boolean(votingClosed),
          globalVotingClosedAt: votingClosedAt ?? null,
          globalWinningVideoId: winningVideoId ?? null,
        })),
      importarVideosCompartilhados: (tournamentId, videos) =>
        set((state) => ({
          videos: [
            ...videos.map((video, index) => ({
              ...video,
              id: video.id || `shared-video-${tournamentId}-${index + 1}`,
              tournamentId,
            })),
            ...state.videos.filter((video) => video.tournamentId !== tournamentId),
          ],
        })),
      voteVideo: (voterId, videoId) => {
        const currentVote = get().userVotes[voterId];

        if (currentVote) {
          return false;
        }

        set((state) => ({
          userVotes: {
            ...state.userVotes,
            [voterId]: videoId,
          },
          videos: state.videos.map((video) =>
            video.id === videoId
                ? {
                  ...video,
                  votesCount: video.votesCount + 1,
                }
              : video,
          ),
        }));

        return true;
      },
      voteGlobalVideo: (phone, videoId) => {
        const normalizedPhone = normalizeVideoVoterPhone(phone);

        if (!normalizedPhone) {
          return false;
        }

        if (get().globalVotingClosed) {
          return false;
        }

        if (!get().globalVideoVoterPhones.includes(normalizedPhone)) {
          return false;
        }

        if (get().globalVideoVotesByPhone[normalizedPhone]) {
          return false;
        }

        set((state) => ({
          globalVideoVotesByPhone: {
            ...state.globalVideoVotesByPhone,
            [normalizedPhone]: videoId,
          },
          videos: state.videos.map((video) =>
            video.id === videoId
              ? {
                  ...video,
                  votesCount: video.votesCount + 1,
                }
              : video,
          ),
        }));

        return true;
      },
      registrarVisualizacaoVideo: (videoId) =>
        set((state) => ({
          videos: state.videos.map((video) =>
            video.id === videoId
              ? {
                  ...video,
                  viewsCount: (video.viewsCount ?? 0) + 1,
                }
              : video,
          ),
        })),
      adicionarVotanteGlobal: (phone) => {
        const normalizedPhone = normalizeVideoVoterPhone(phone);

        if (!normalizedPhone) {
          return false;
        }

        if (get().globalVideoVoterPhones.includes(normalizedPhone)) {
          return false;
        }

        set((state) => ({
          globalVideoVoterPhones: [...state.globalVideoVoterPhones, normalizedPhone],
        }));

        return true;
      },
      editarVotanteGlobal: (currentPhone, nextPhone) => {
        const normalizedCurrentPhone = normalizeVideoVoterPhone(currentPhone);
        const normalizedNextPhone = normalizeVideoVoterPhone(nextPhone);

        if (!normalizedCurrentPhone || !normalizedNextPhone) {
          return false;
        }

        if (!get().globalVideoVoterPhones.includes(normalizedCurrentPhone)) {
          return false;
        }

        if (
          normalizedCurrentPhone !== normalizedNextPhone &&
          get().globalVideoVoterPhones.includes(normalizedNextPhone)
        ) {
          return false;
        }

        set((state) => {
          const nextVotesByPhone = { ...state.globalVideoVotesByPhone };

          if (
            normalizedCurrentPhone !== normalizedNextPhone &&
            nextVotesByPhone[normalizedCurrentPhone]
          ) {
            nextVotesByPhone[normalizedNextPhone] = nextVotesByPhone[normalizedCurrentPhone]!;
            delete nextVotesByPhone[normalizedCurrentPhone];
          }

          return {
            globalVideoVoterPhones: state.globalVideoVoterPhones.map((storedPhone) =>
              storedPhone === normalizedCurrentPhone ? normalizedNextPhone : storedPhone,
            ),
            globalVideoVotesByPhone:
              normalizedCurrentPhone === normalizedNextPhone
                ? state.globalVideoVotesByPhone
                : nextVotesByPhone,
          };
        });

        return true;
      },
      removerVotanteGlobal: (phone) => {
        const normalizedPhone = normalizeVideoVoterPhone(phone);

        set((state) => ({
          globalVideoVoterPhones: state.globalVideoVoterPhones.filter((item) => item !== normalizedPhone),
          globalVideoVotesByPhone: Object.fromEntries(
            Object.entries(state.globalVideoVotesByPhone).filter(([storedPhone]) => storedPhone !== normalizedPhone),
          ),
        }));
      },
      encerrarVotacaoGlobal: () => {
        const winningVideoId = pickGlobalWinningVideoId(get().videos);

        set((state) => ({
          globalVotingClosed: true,
          globalVotingClosedAt: new Date().toISOString(),
          globalWinningVideoId: winningVideoId,
          videos: applyGlobalWinner(state.videos, winningVideoId),
        }));

        return winningVideoId;
      },
      reabrirVotacaoGlobal: () =>
        set((state) => ({
          globalVotingClosed: false,
          globalVotingClosedAt: null,
          globalWinningVideoId: null,
          videos: applyGlobalWinner(state.videos, null),
        })),
      definirVencedorGlobal: (videoId) => {
        const hasMatchingVideo = get().videos.some(
          (video) => video.tournamentId === GLOBAL_VIDEO_PANEL_ID && video.id === videoId,
        );

        if (!hasMatchingVideo) {
          return false;
        }

        set((state) => ({
          globalVotingClosed: true,
          globalVotingClosedAt: state.globalVotingClosedAt ?? new Date().toISOString(),
          globalWinningVideoId: videoId,
          videos: applyGlobalWinner(state.videos, videoId),
        }));

        return true;
      },
      voteTournamentVideoByPhone: (tournamentId, phone, voterName, videoId) => {
        const normalizedPhone = normalizeVideoVoterPhone(phone);

        if (!normalizedPhone) {
          return false;
        }

        const existingVote = get().tournamentVotesByPhone[tournamentId]?.[normalizedPhone];
        if (existingVote) {
          return false;
        }

        set((state) => ({
          tournamentVotesByPhone: {
            ...state.tournamentVotesByPhone,
            [tournamentId]: {
              ...(state.tournamentVotesByPhone[tournamentId] ?? {}),
              [normalizedPhone]: videoId,
            },
          },
          tournamentVoterNames: {
            ...state.tournamentVoterNames,
            [tournamentId]: {
              ...(state.tournamentVoterNames[tournamentId] ?? {}),
              [normalizedPhone]: voterName.trim() || "Participante",
            },
          },
          videos: state.videos.map((video) =>
            video.id === videoId
              ? { ...video, votesCount: video.votesCount + 1 }
              : video,
          ),
        }));

        return true;
      },
      removeVideo: (videoId) =>
        set((state) => ({
          videos: state.videos.filter((video) => video.id !== videoId),
          userVotes: Object.fromEntries(
            Object.entries(state.userVotes).filter(([, votedVideoId]) => votedVideoId !== videoId),
          ),
        })),
      removerVideosDoCampeonato: (tournamentId) =>
        set((state) => ({
          videos: state.videos.filter((video) => video.tournamentId !== tournamentId),
          userVotes: Object.fromEntries(
            Object.entries(state.userVotes).filter(([, votedVideoId]) => {
              const votedVideo = state.videos.find((video) => video.id === votedVideoId);
              return votedVideo?.tournamentId !== tournamentId;
            }),
          ),
        })),
    }),
    {
      name: "arena-video-store",
      storage: createJSONStorage(() => persistStorage),
      partialize: (state) => ({
        videos: state.videos,
        userVotes: state.userVotes,
        tournamentVotesByPhone: state.tournamentVotesByPhone,
        tournamentVoterNames: state.tournamentVoterNames,
        globalVideoVoterPhones: state.globalVideoVoterPhones,
        globalVideoVotesByPhone: state.globalVideoVotesByPhone,
        globalVotingClosed: state.globalVotingClosed,
        globalVotingClosedAt: state.globalVotingClosedAt,
        globalWinningVideoId: state.globalWinningVideoId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
