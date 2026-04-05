import { Image, Text, View, useWindowDimensions } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { getCampeonatoLeader, normalizeCampeonato } from "@/lib/season-tournaments";
import {
  getTeamInitials,
  normalizeTeamDisplayName,
  resolveTeamVisualByName,
} from "@/lib/team-visuals";
import type { Campeonato } from "@/types/tournament";

interface TournamentCardAction {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "light" | "gold";
}

interface TournamentCardProps {
  tournament: Campeonato;
  primaryAction?: TournamentCardAction;
  secondaryAction?: TournamentCardAction;
  dangerAction?: TournamentCardAction;
  surface?: "light" | "dark";
}

export function TournamentCard({
  tournament,
  primaryAction,
  secondaryAction,
  dangerAction,
  surface = "light",
}: TournamentCardProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const normalized = normalizeCampeonato(tournament);
  const leader = getCampeonatoLeader(normalized);
  const teamName = normalizeTeamDisplayName(
    leader.participante?.time ?? leader.classificacao?.time ?? normalized.nome,
  );
  const playerName = leader.participante?.nome ?? leader.classificacao?.nome ?? "A definir";
  const accent = normalized.status === "finalizado" ? "gold" : "blue";
  const accentColor = normalized.status === "finalizado" ? "#D6A11D" : "#3B5BFF";
  const accentBorder = normalized.status === "finalizado"
    ? "rgba(233,179,52,0.18)"
    : "rgba(59,91,255,0.14)";
  const palette =
    surface === "dark"
      ? {
          cardBackground: "#09121C",
          seasonBackground:
            normalized.status === "finalizado" ? "rgba(233,179,52,0.14)" : "rgba(59,91,255,0.18)",
          seasonText: normalized.status === "finalizado" ? "#FFD76A" : "#D7E5FF",
          statusBackground: "rgba(255,255,255,0.04)",
          statusText: "#AEBBDA",
          title: "#F3F7FF",
          subtitle: "#AEBBDA",
          leaderSurface:
            normalized.status === "finalizado" ? "rgba(55,37,10,0.72)" : "rgba(10,20,44,0.72)",
          leaderCard: "rgba(255,255,255,0.05)",
          leaderTitle: normalized.status === "finalizado" ? "#FFD76A" : "#D7E5FF",
          leaderName: "#F3F7FF",
          leaderMeta: "#AEBBDA",
          pointsLabel: "#D8DEEB",
          statBackground: "rgba(255,255,255,0.04)",
          statBorder: "rgba(255,255,255,0.08)",
          statLabel: "#8FA4CF",
          statValue: "#F3F7FF",
          actionsBackground:
            normalized.status === "ativo" ? "rgba(59,91,255,0.12)" : "rgba(233,179,52,0.12)",
          actionsBorder:
            normalized.status === "ativo" ? "rgba(59,91,255,0.18)" : "rgba(233,179,52,0.22)",
        }
      : {
          cardBackground: "#FFFFFF",
          seasonBackground:
            normalized.status === "finalizado" ? "#FFF2D2" : "#EEF4FF",
          seasonText: accentColor,
          statusBackground: "#F7FAFF",
          statusText: "#6B7EA3",
          title: "#1C2B4A",
          subtitle: "#6B7EA3",
          leaderSurface: normalized.status === "finalizado" ? "#FFF8E8" : "#F7FAFF",
          leaderCard: "#FFFFFF",
          leaderTitle: accentColor,
          leaderName: "#1C2B4A",
          leaderMeta: "#6B7EA3",
          pointsLabel: "#6B7EA3",
          statBackground: "#F8FAFF",
          statBorder: "rgba(59,91,255,0.10)",
          statLabel: "#6B7EA3",
          statValue: "#1C2B4A",
          actionsBackground: normalized.status === "ativo" ? "#F7FAFF" : "#FFF8E8",
          actionsBorder:
            normalized.status === "ativo" ? "rgba(59,91,255,0.14)" : "rgba(233,179,52,0.18)",
        };
  const crest = resolveTeamVisualByName(teamName);
  const statCards = [
    { label: "Participantes", value: String(normalized.participantes.length) },
    { label: "Rodadas", value: String(normalized.rodadas.length) },
    { label: "Pontos", value: String(leader.classificacao?.pontos ?? 0) },
    { label: "Vitórias", value: String(leader.classificacao?.vitorias ?? 0) },
  ];

  return (
    <View className="gap-4" style={{ width: "100%" }}>
      <LiveBorderCard
        accent={accent}
        radius={18}
        padding={1.3}
        backgroundColor={palette.cardBackground}
      >
        <View className="gap-4" style={{ padding: isPhone ? 16 : 18 }}>
          <View className="flex-row items-start justify-between gap-3" style={{ flexWrap: "wrap" }}>
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: palette.seasonBackground,
                borderWidth: 1,
                borderColor: accentBorder,
              }}
            >
              <Text
                style={{
                  color: palette.seasonText,
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                }}
              >
                {normalized.temporada ?? "Temporada atual"}
              </Text>
            </View>

            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: palette.statusBackground,
                borderWidth: 1,
                borderColor: surface === "dark" ? "rgba(255,255,255,0.08)" : accentBorder,
              }}
            >
              <Text
                style={{
                  color: palette.statusText,
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                {normalized.status === "finalizado" ? "Encerrada" : "Ativa"}
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <Text
              style={{
                color: palette.title,
                fontSize: isPhone ? 22 : 26,
                fontWeight: "900",
              }}
            >
              {normalized.nome}
            </Text>
            <Text
              style={{
                color: palette.subtitle,
                fontSize: 15,
                lineHeight: 24,
              }}
            >
              {normalized.status === "finalizado"
                ? "Resumo compacto da temporada encerrada, com campeão e números finais."
                : "Resumo compacto da temporada ativa, com líder atual e acesso direto às rodadas."}
            </Text>
          </View>

          <View
            className="flex-row items-center gap-4 rounded-[20px]"
            style={{
              paddingHorizontal: 14,
              paddingVertical: 14,
              backgroundColor: palette.leaderSurface,
              borderWidth: 1,
              borderColor: surface === "dark" ? "rgba(255,255,255,0.08)" : accentBorder,
            }}
          >
            <View
              style={{
                width: isPhone ? 58 : 66,
                height: isPhone ? 58 : 66,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.leaderCard,
                borderWidth: 1,
                borderColor: surface === "dark" ? "rgba(255,255,255,0.08)" : accentBorder,
                overflow: "hidden",
              }}
            >
              {crest ? (
                <Image source={{ uri: crest }} style={{ width: "72%", height: "72%" }} resizeMode="contain" />
              ) : (
                <Text
                  style={{
                    color: accentColor,
                    fontSize: 20,
                    fontWeight: "900",
                    letterSpacing: 1.2,
                  }}
                >
                  {getTeamInitials(teamName)}
                </Text>
              )}
            </View>

            <View className="flex-1 gap-1">
              <Text
                style={{
                  color: palette.leaderTitle,
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                {normalized.status === "finalizado" ? "Campeão" : "Líder"}
              </Text>
              <Text
                style={{
                  color: palette.leaderName,
                  fontSize: isPhone ? 18 : 20,
                  fontWeight: "900",
                }}
              >
                {playerName}
              </Text>
              <Text
                style={{
                  color: palette.leaderMeta,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {teamName}
              </Text>
            </View>

            <View className="items-end">
              <Text
                style={{
                  color: palette.seasonText,
                  fontSize: isPhone ? 28 : 32,
                  fontWeight: "900",
                }}
              >
                {leader.classificacao?.pontos ?? 0}
              </Text>
              <Text
                style={{
                  color: palette.pointsLabel,
                  fontSize: 10,
                  fontWeight: "800",
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                }}
              >
                PTS
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {statCards.map((stat) => (
              <View
                key={stat.label}
                style={{
                  minWidth: isPhone ? "47%" : 110,
                  flex: 1,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  backgroundColor: palette.statBackground,
                  borderWidth: 1,
                  borderColor: palette.statBorder,
                }}
              >
                <Text
                  style={{
                    color: palette.statLabel,
                    fontSize: 10,
                    fontWeight: "800",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    color: palette.statValue,
                    fontSize: 22,
                    fontWeight: "900",
                  }}
                >
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </LiveBorderCard>

      {(primaryAction || secondaryAction || dangerAction) ? (
        <View
          className="gap-3 rounded-[18px] border px-4 py-4"
          style={{
            borderColor: palette.actionsBorder,
            backgroundColor: palette.actionsBackground,
          }}
        >
          <View className="flex-row flex-wrap gap-3">
            {primaryAction ? (
              <PrimaryButton
                label={primaryAction.label}
                onPress={primaryAction.onPress}
                variant={primaryAction.variant ?? "light"}
                className={`${isPhone ? "w-full min-w-0" : "min-w-[220px]"} flex-1 rounded-[14px] py-3`}
              />
            ) : null}

            {secondaryAction ? (
              <PrimaryButton
                label={secondaryAction.label}
                onPress={secondaryAction.onPress}
                variant={secondaryAction.variant ?? "secondary"}
                className={`${isPhone ? "w-full min-w-0" : "min-w-[220px]"} flex-1 rounded-[14px] py-3`}
              />
            ) : null}

            {dangerAction ? (
              <PrimaryButton
                label={dangerAction.label}
                onPress={dangerAction.onPress}
                variant={dangerAction.variant ?? "danger"}
                className={`${isPhone ? "w-full min-w-0" : "min-w-[220px]"} flex-1 rounded-[14px] py-3`}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
