import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
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
import { getPlayerTitleLeaderboard } from "@/lib/championship-history";
import {
  normalizeTeamDisplayName,
  resolveTeamVisualByName,
  getTeamInitials,
} from "@/lib/team-visuals";
import { getTournamentBundle } from "@/lib/tournament-display";
import { useAppStore } from "@/stores/app-store";
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
          style={{ width: "82%", height: "82%" }}
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
  const titleLeaders = getPlayerTitleLeaderboard(campeonatos).slice(0, 5);

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
    setCurrentTournamentId(campeonato.id);
    router.push({ pathname: "/tournament/[id]", params: { id: campeonato.id } });
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
            />
          </RevealOnScroll>
        ) : null}

        {/* Mini Hall of Fame */}
        {titleLeaders.length > 0 ? (
          <RevealOnScroll delay={140}>
            <View>
              <SectionLabel text="Mini Hall da Fama" />
              <View
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(246,197,75,0.18)",
                  backgroundColor: "rgba(10,16,30,0.60)",
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(246,197,75,0.12)",
                    backgroundColor: "rgba(246,197,75,0.06)",
                  }}
                >
                  <Text
                    style={{
                      color: "#F6C54B",
                      fontSize: 12,
                      fontWeight: "800",
                      letterSpacing: 1.4,
                      textTransform: "uppercase",
                    }}
                  >
                    Maiores campeões
                  </Text>
                  <Text style={{ color: "#AEBBDA", fontSize: 12, marginTop: 4 }}>
                    Ranking de títulos em todas as edições.
                  </Text>
                </View>

                {titleLeaders.map((leader, index) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const medal = medals[index] ?? "🏅";

                  return (
                    <View
                      key={leader.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderBottomWidth: index < titleLeaders.length - 1 ? 1 : 0,
                        borderBottomColor: "rgba(255,255,255,0.06)",
                        backgroundColor: index === 0 ? "rgba(246,197,75,0.06)" : "transparent",
                      }}
                    >
                      <Text style={{ fontSize: 20, minWidth: 28, textAlign: "center" }}>
                        {medal}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: index === 0 ? "#F6C54B" : "#F3F7FF",
                            fontSize: 14,
                            fontWeight: "800",
                          }}
                        >
                          {leader.label}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{ color: "#6B7EA3", fontSize: 12, marginTop: 2 }}
                        >
                          {leader.subtitle}
                        </Text>
                      </View>
                      <View
                        style={{
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          backgroundColor:
                            index === 0 ? "rgba(246,197,75,0.16)" : "rgba(255,255,255,0.06)",
                          borderWidth: 1,
                          borderColor:
                            index === 0 ? "rgba(246,197,75,0.28)" : "rgba(255,255,255,0.08)",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: index === 0 ? "#F6C54B" : "#94A3B8",
                            fontSize: 18,
                            fontWeight: "900",
                            lineHeight: 22,
                          }}
                        >
                          {leader.titles}
                        </Text>
                        <Text
                          style={{
                            color: index === 0 ? "#C8941A" : "#4B5E7A",
                            fontSize: 9,
                            fontWeight: "800",
                            letterSpacing: 0.8,
                            textTransform: "uppercase",
                          }}
                        >
                          {leader.titles === 1 ? "título" : "títulos"}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </RevealOnScroll>
        ) : null}

        {/* Enter button */}
        <RevealOnScroll delay={200}>
          <View style={{ gap: 10 }}>
            <PrimaryButton
              label="Entrar no campeonato"
              icon="trophy-outline"
              size="sm"
              onPress={handleEnterTournament}
              className="self-center"
            />
            <Pressable
              onPress={() => router.back()}
              style={{ alignItems: "center", paddingVertical: 10 }}
            >
              <Text style={{ color: "#6B7EA3", fontSize: 14, fontWeight: "600" }}>
                Voltar para a lista
              </Text>
            </Pressable>
          </View>
        </RevealOnScroll>
      </ScrollView>
    </Screen>
  );
}
