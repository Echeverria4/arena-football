import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { SeasonPodiumBoard } from "@/components/trophies/SeasonPodiumBoard";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { useMusicTrigger } from "@/hooks/useMusicTrigger";
import { getPlayerTitleLeaderboard } from "@/lib/championship-history";
import { MUSIC_TRACKS } from "@/lib/music-tracks";
import {
  normalizeTeamDisplayName,
  resolveTeamVisualByName,
  getTeamInitials,
} from "@/lib/team-visuals";
import { getTournamentBundle } from "@/lib/tournament-display";
import { useAppStore } from "@/stores/app-store";
import { useMusicStore } from "@/stores/music-store";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

const FORMAT_LABELS: Record<string, string> = {
  league: "Pontos corridos",
  cup: "Copa",
  groups: "Grupos",
  groups_knockout: "Grupos + Mata-mata",
  knockout: "Mata-mata",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ativo: { label: "Em andamento", color: "#10B981", bg: "rgba(16,185,129,0.14)" },
  finalizado: { label: "Encerrado", color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
  aguardando: { label: "Aguardando", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
};

function TeamCrestBadge({
  flagUrl,
  name,
  size = 44,
}: {
  flagUrl?: string | null;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(139,92,246,0.10)",
        borderWidth: 1.5,
        borderColor: "rgba(139,92,246,0.22)",
      }}
    >
      {flagUrl && !failed ? (
        <Image
          source={{ uri: flagUrl }}
          style={{ width: "92%", height: "92%" }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ color: "#C4B5FD", fontSize: size * 0.28, fontWeight: "900" }}>
          {getTeamInitials(name)}
        </Text>
      )}
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text
      style={{
        color: "#9AB8FF",
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 2.2,
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {text}
    </Text>
  );
}

// Auto-advancing team carousel — shows 2 teams per page, advances every 2s
function TeamCarousel({
  teams,
}: {
  teams: { id: string; teamName: string; playerName: string; flagUrl?: string | null }[];
}) {
  const [page, setPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ITEMS_PER_PAGE = 6;
  const COLS = 3;
  const totalPages = Math.max(1, Math.ceil(teams.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (totalPages <= 1) return;
    intervalRef.current = setInterval(() => {
      setPage((prev) => {
        const next = (prev + 1) % totalPages;
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();
        return next;
      });
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalPages, fadeAnim]);

  if (teams.length === 0) {
    return (
      <View
        style={{
          borderRadius: 14,
          padding: 14,
          alignItems: "center",
          backgroundColor: "rgba(10,16,30,0.60)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "#6B7EA3", fontSize: 13, textAlign: "center" }}>
          Nenhum time inscrito ainda.
        </Text>
      </View>
    );
  }

  const pageTeams = teams.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);
  // Pad to multiple of COLS so grid stays aligned
  const padded: (typeof pageTeams[0] | null)[] = [...pageTeams];
  while (padded.length % COLS !== 0) padded.push(null);

  // Build rows of COLS
  const rows: (typeof teams[0] | null)[][] = [];
  for (let i = 0; i < padded.length; i += COLS) {
    rows.push(padded.slice(i, i + COLS));
  }

  return (
    <View style={{ gap: 6 }}>
      <Animated.View style={{ opacity: fadeAnim, gap: 6 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: "row", gap: 6 }}>
            {row.map((team, ci) =>
              team ? (
                <View
                  key={team.id}
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    backgroundColor: "rgba(12,18,32,0.82)",
                    borderWidth: 1,
                    borderColor: "rgba(139,92,246,0.20)",
                    paddingVertical: 14,
                    paddingHorizontal: 4,
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <TeamCrestBadge flagUrl={team.flagUrl} name={team.teamName} size={32} />
                  <View style={{ alignItems: "center", gap: 2 }}>
                    <Text
                      numberOfLines={1}
                      style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800", textAlign: "center" }}
                    >
                      {team.teamName || "—"}
                    </Text>
                    {team.playerName ? (
                      <Text numberOfLines={1} style={{ color: "#8FA1C8", fontSize: 10, textAlign: "center" }}>
                        {team.playerName}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : (
                <View key={`pad-${ci}`} style={{ flex: 1 }} />
              )
            )}
          </View>
        ))}
      </Animated.View>

      {/* Page dots */}
      {totalPages > 1 ? (
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                Animated.sequence([
                  Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
                  Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
                ]).start();
                setPage(i);
              }}
              style={{
                width: i === page ? 16 : 5,
                height: 5,
                borderRadius: 999,
                backgroundColor: i === page ? "#8B5CF6" : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function TournamentPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 420;

  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const videos = useVideoStore((state) => state.videos);
  const setCurrentTournamentId = useAppStore((state) => state.setCurrentTournamentId);
  const hydrated = useTournamentDataHydrated();
  const musicEnabled = useMusicStore((s) => s.enabled);
  const musicIsPlaying = useMusicStore((s) => s.isPlaying);
  const selectedTrackId = useMusicStore((s) => s.selectedTrackId);
  const { triggerStart, togglePlayPause } = useMusicTrigger();

  if (!hydrated) {
    return (
      <Screen scroll ambientDiamond className="px-5">
        <ScreenState title="Carregando" description="Buscando dados do campeonato." />
      </Screen>
    );
  }

  const bundle = id ? getTournamentBundle(id, campeonatos, videos) : null;

  if (!bundle) {
    return (
      <Screen scroll ambientDiamond className="px-5">
        <View className="gap-6 py-8">
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato não encontrado"
            description="Esta temporada não existe ou foi removida."
          />
        </View>
      </Screen>
    );
  }

  const { campeonato, tournament, participants } = bundle;
  const seasonLabel = campeonato.temporada ?? "Temporada";
  const statusCfg = STATUS_CONFIG[campeonato.status] ?? STATUS_CONFIG.aguardando;
  const formatLabel = FORMAT_LABELS[tournament.format] ?? tournament.format;
  const titleLeaders = getPlayerTitleLeaderboard(campeonatos, {
    currentParticipants: campeonato.participantes.map((p) => ({
      whatsapp: p.whatsapp,
      nome: p.nome,
    })),
  }).slice(0, 5);

  // Build team list for carousel
  const teamList = participants.map((p) => ({
    id: p.id,
    teamName: normalizeTeamDisplayName(p.teamName ?? ""),
    playerName: p.displayName ?? "",
    flagUrl: p.teamBadgeUrl ?? resolveTeamVisualByName(p.teamName ?? "") ?? null,
  }));

  // Build podium entries for the current tournament standings
  const podiumEntries = bundle.standings
    .slice()
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    })
    .slice(0, 3)
    .map((entry, index) => {
      const participant = participants.find((p) => p.id === entry.participantId);
      const pos = (index + 1) as 1 | 2 | 3;
      return {
        id: entry.participantId,
        position: pos,
        teamName: normalizeTeamDisplayName(participant?.teamName ?? ""),
        playerName: participant?.displayName ?? "",
        points: entry.points,
        wins: entry.wins,
        goalDifference: entry.goalDifference,
        played: entry.played,
      };
    });

  function handleEnterTournament() {
    void triggerStart();
    setCurrentTournamentId(campeonato.id);
    router.push({ pathname: "/tournament/[id]", params: { id: campeonato.id } });
  }

  async function handleSharePreviewLink() {
    const path = `/tournament/preview?id=${campeonato.id}`;
    const baseUrl =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : null;
    const link = baseUrl ? `${baseUrl}${path}` : path;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        Alert.alert("Link copiado", "Cole o link e compartilhe com quem quiser acessar este campeonato.");
      } else {
        await Share.share({ message: link, url: link });
      }
    } catch {
      Alert.alert("Erro", "Não foi possível copiar o link agora.");
    }
  }

  const hPad = isSmallPhone ? 14 : 20;

  return (
    <Screen ambientDiamond>
      {/* Fixed header */}
      <View
        style={{
          paddingTop: isSmallPhone ? 10 : 14,
          paddingHorizontal: hPad,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.07)",
          backgroundColor: "rgba(3,5,11,0.72)",
          gap: 12,
        }}
      >
        <BackButton fallbackHref="/tournaments" />

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                color: "#9AB8FF",
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {seasonLabel}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                color: "#FFFFFF",
                fontSize: isSmallPhone ? 20 : 24,
                fontWeight: "900",
                lineHeight: isSmallPhone ? 26 : 30,
              }}
            >
              {tournament.name}
            </Text>
            <Text style={{ color: "#A78BFA", fontSize: 12, fontWeight: "700" }}>
              {formatLabel} • {participants.length} times
            </Text>
          </View>

          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: statusCfg.bg,
              borderWidth: 1,
              borderColor: statusCfg.color + "44",
              flexShrink: 0,
            }}
          >
            <Text style={{ color: statusCfg.color, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>
              {statusCfg.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: hPad,
          paddingTop: 20,
          paddingBottom: isSmallPhone ? 110 : 120,
          gap: 28,
        }}
      >
        {/* Enter button */}
        <RevealOnScroll delay={40}>
          <PrimaryButton
            label="Entrar no campeonato"
            icon="trophy-outline"
            size="sm"
            onPress={handleEnterTournament}
            className="self-center"
          />
        </RevealOnScroll>

        {/* Teams carousel */}
        <RevealOnScroll delay={60}>
          <View>
            <SectionLabel text={`Times inscritos — ${participants.length}`} />
            <TeamCarousel teams={teamList} />
          </View>
        </RevealOnScroll>

        {/* Season podium (top 3 current standings) */}
        {podiumEntries.length >= 1 ? (
          <RevealOnScroll delay={100}>
            <SeasonPodiumBoard
              title={tournament.name}
              subtitle={`${seasonLabel} • Classificação atual`}
              entries={podiumEntries}
              titleLeaders={titleLeaders}
            />
          </RevealOnScroll>
        ) : null}

        {/* Music card */}
        {musicEnabled && MUSIC_TRACKS.length > 0 && (
          <RevealOnScroll delay={140}>
            <Pressable
              onPress={() => router.push({ pathname: "/tournament/musicas", params: { id: campeonato.id } })}
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "rgba(139,92,246,0.30)",
                backgroundColor: "rgba(10,6,24,0.82)",
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* Play/pause toggle */}
              <Pressable
                onPress={(e) => { e.stopPropagation(); void togglePlayPause(); }}
                style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: musicIsPlaying ? "rgba(139,92,246,0.22)" : "rgba(255,255,255,0.07)",
                  borderWidth: 1,
                  borderColor: musicIsPlaying ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.14)",
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Ionicons
                  name={musicIsPlaying ? "pause" : "play"}
                  size={20}
                  color={musicIsPlaying ? "#C4B5FD" : "#94A3B8"}
                />
              </Pressable>

              {/* Info */}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#F3F7FF" }}>
                  {musicIsPlaying ? "Tocando agora" : "Trilha sonora"}
                </Text>
                <Text style={{ fontSize: 11, color: "#6B7EA3" }} numberOfLines={1}>
                  {MUSIC_TRACKS.find((t) => t.id === selectedTrackId)?.name ?? MUSIC_TRACKS[0]?.name ?? ""}
                </Text>
              </View>

              {/* Arrow */}
              <Ionicons name="chevron-forward" size={16} color="#4A5568" />
            </Pressable>
          </RevealOnScroll>
        )}

      </ScrollView>
    </Screen>
  );
}
