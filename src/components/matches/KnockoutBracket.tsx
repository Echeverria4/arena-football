import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { getTeamInitials, normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";
import type { Campeonato, Jogo, Participante } from "@/types/tournament";

// ── Layout constants (vertical bracket) ──────────────────────────────────────

const CARD_H = 76;
const CARD_W = 100;
const CARD_GAP_H = 6;          // horizontal gap between cards in the same phase
const UNIT_W = CARD_W + CARD_GAP_H; // 106px per first-round slot
const ROW_GAP = 32;            // vertical space between phases (connector zone)
const HEADER_H = 20;           // phase label height
const CONN = "rgba(139,92,246,0.45)";

// ── Helpers ──────────────────────────────────────────────────────────────────

function phaseName(matchCount: number): string {
  if (matchCount >= 16) return "Rodada de 32";
  if (matchCount === 8) return "Oitavas";
  if (matchCount === 4) return "Quartas";
  if (matchCount === 2) return "Semifinal";
  if (matchCount === 1) return "Final";
  return `Fase ${matchCount}`;
}

// X center of slot `slotIdx` in phase `phIdx` (0 = first/widest phase)
function xCenterOf(phIdx: number, slotIdx: number): number {
  return (slotIdx + 0.5) * Math.pow(2, phIdx) * UNIT_W - CARD_GAP_H / 2;
}
function xLeftOf(phIdx: number, slotIdx: number): number {
  return xCenterOf(phIdx, slotIdx) - CARD_W / 2;
}
// Y top of cards in phase `phIdx`
function yCardOf(phIdx: number): number {
  return phIdx * (HEADER_H + CARD_H + ROW_GAP) + HEADER_H;
}

// ── Data types ───────────────────────────────────────────────────────────────

interface BracketSlot {
  matchId: string | null;
  leg2Id: string | null;
  homeId: string | null;
  awayId: string | null;
  homeName: string;
  awayName: string;
  homeFlagUrl: string | undefined;
  awayFlagUrl: string | undefined;
  leg1HomeGoals: number | null;
  leg1AwayGoals: number | null;
  leg2HomeGoals: number | null;
  leg2AwayGoals: number | null;
  isDone: boolean;
  isHomeAway: boolean;
  winnerId: string | null;
}

interface BracketColumn {
  label: string;
  slots: BracketSlot[];
}

// ── Slot builder ─────────────────────────────────────────────────────────────

function resolveWinner(slot: BracketSlot): string | null {
  if (!slot.isDone || !slot.homeId || !slot.awayId) return null;
  if (!slot.isHomeAway) {
    const h = slot.leg1HomeGoals ?? 0;
    const a = slot.leg1AwayGoals ?? 0;
    if (h === a) return null;
    return h > a ? slot.homeId : slot.awayId;
  }
  const totalHome = (slot.leg1HomeGoals ?? 0) + (slot.leg2AwayGoals ?? 0);
  const totalAway = (slot.leg1AwayGoals ?? 0) + (slot.leg2HomeGoals ?? 0);
  if (totalHome === totalAway) return null;
  return totalHome > totalAway ? slot.homeId : slot.awayId;
}

function emptySlot(isHomeAway: boolean): BracketSlot {
  return {
    matchId: null, leg2Id: null, homeId: null, awayId: null,
    homeName: "A definir", awayName: "A definir",
    homeFlagUrl: undefined, awayFlagUrl: undefined,
    leg1HomeGoals: null, leg1AwayGoals: null,
    leg2HomeGoals: null, leg2AwayGoals: null,
    isDone: false, isHomeAway, winnerId: null,
  };
}

// ── Public: build bracket columns from campeonato data ───────────────────────

export function buildBracketColumns(
  campeonato: Campeonato,
  participantes: Participante[],
): BracketColumn[] {
  const isKnockoutOnly = campeonato.formato === "knockout";
  const numGroupRounds = campeonato.numRodadasGrupos ?? 0;
  const allRounds = campeonato.rodadas;
  const koRounds = isKnockoutOnly ? allRounds : allRounds.slice(numGroupRounds);

  if (koRounds.length === 0) return [];

  const matchMode = isKnockoutOnly
    ? (campeonato.modoConfronto ?? "single_game")
    : (campeonato.modoConfrontoMataMata ?? "single_game");
  const useHomeAway = matchMode === "home_away";

  function getP(id: string) {
    return participantes.find((p) => p.id === id);
  }

  function makeSlot(leg1: Jogo, leg2?: Jogo): BracketSlot {
    const homeP = getP(leg1.mandanteId);
    const awayP = getP(leg1.visitanteId);
    const homeName = normalizeTeamDisplayName(homeP?.time ?? "") || "A definir";
    const awayName = normalizeTeamDisplayName(awayP?.time ?? "") || "A definir";
    const done = useHomeAway
      ? leg1.status === "finalizado" && leg2?.status === "finalizado"
      : leg1.status === "finalizado";

    const slot: BracketSlot = {
      matchId: leg1.id,
      leg2Id: leg2?.id ?? null,
      homeId: leg1.mandanteId,
      awayId: leg1.visitanteId,
      homeName,
      awayName,
      homeFlagUrl: resolveTeamVisualByName(homeName) ?? undefined,
      awayFlagUrl: resolveTeamVisualByName(awayName) ?? undefined,
      leg1HomeGoals: leg1.placarMandante,
      leg1AwayGoals: leg1.placarVisitante,
      leg2HomeGoals: leg2?.placarMandante ?? null,
      leg2AwayGoals: leg2?.placarVisitante ?? null,
      isDone: Boolean(done),
      isHomeAway: useHomeAway,
      winnerId: null,
    };
    slot.winnerId = resolveWinner(slot);
    return slot;
  }

  const existingPhases: BracketColumn[] = [];

  if (!useHomeAway) {
    for (const round of koRounds) {
      if (round.length === 0) continue;
      const slots = round.map((m) => makeSlot(m));
      existingPhases.push({ label: phaseName(slots.length), slots });
    }
  } else {
    for (let i = 0; i + 1 < koRounds.length; i += 2) {
      const leg1Round = koRounds[i]!;
      const leg2Round = koRounds[i + 1]!;
      if (leg1Round.length === 0) continue;
      const slots = leg1Round.map((leg1) => {
        const leg2 = leg2Round.find(
          (m) => m.mandanteId === leg1.visitanteId && m.visitanteId === leg1.mandanteId,
        );
        return makeSlot(leg1, leg2);
      });
      existingPhases.push({ label: phaseName(slots.length), slots });
    }
    if (koRounds.length % 2 === 1) {
      const lastRound = koRounds[koRounds.length - 1]!;
      if (lastRound.length > 0) {
        const slots = lastRound.map((m) => makeSlot(m));
        existingPhases.push({ label: phaseName(slots.length), slots });
      }
    }
  }

  if (existingPhases.length === 0) return [];

  const firstCount = existingPhases[0]!.slots.length;
  const result: BracketColumn[] = [];
  let c = firstCount;
  let idx = 0;

  while (c >= 1) {
    result.push(
      existingPhases[idx] ?? {
        label: phaseName(c),
        slots: Array.from({ length: c }, () => emptySlot(useHomeAway)),
      },
    );
    idx++;
    if (c === 1) break;
    c = Math.ceil(c / 2);
  }

  return result;
}

// ── Team row (compact for narrow cards) ─────────────────────────────────────

interface TeamRowProps {
  name: string;
  flagUrl: string | undefined;
  goalsD1: number | null;
  goalsD2: number | null;
  isWinner: boolean;
  showD2: boolean;
}

function TeamRow({ name, flagUrl, goalsD1, goalsD2, isWinner, showD2 }: TeamRowProps) {
  const isDefined = name !== "A definir";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 6, gap: 4, minHeight: 20 }}>
      {/* Flag / initials */}
      <View style={{ width: 18, height: 13, justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
        {flagUrl && isDefined ? (
          <Image source={{ uri: flagUrl }} style={{ width: 18, height: 13 }} resizeMode="contain" />
        ) : (
          <View style={{ width: 18, height: 13, borderRadius: 2, backgroundColor: "rgba(154,184,255,0.09)", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "#4B6A99", fontSize: 6, fontWeight: "900" }}>
              {isDefined ? getTeamInitials(name).slice(0, 3) : "—"}
            </Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: !isDefined ? "rgba(255,255,255,0.22)" : isWinner ? "#FFFFFF" : "rgba(255,255,255,0.72)",
          fontSize: 10,
          fontWeight: isWinner ? "900" : "700",
        }}
      >
        {name}
      </Text>

      {/* Score boxes */}
      <View style={{ flexDirection: "row", gap: 2, flexShrink: 0 }}>
        {[goalsD1, ...(showD2 ? [goalsD2] : [])].map((g, i) => (
          <View
            key={i}
            style={{
              width: 18, height: 18, borderRadius: 3,
              backgroundColor: isWinner ? "rgba(245,158,11,0.22)" : "rgba(255,255,255,0.07)",
              justifyContent: "center", alignItems: "center",
            }}
          >
            <Text style={{ color: isWinner ? "#FDE68A" : "rgba(255,255,255,0.52)", fontSize: 10, fontWeight: "900" }}>
              {g !== null ? String(g) : "–"}
            </Text>
          </View>
        ))}
      </View>

      {/* Winner arrow */}
      {isWinner ? (
        <Text style={{ color: "#F59E0B", fontSize: 8, fontWeight: "900", flexShrink: 0 }}>◀</Text>
      ) : (
        <View style={{ width: 10 }} />
      )}
    </View>
  );
}

// ── Match card ───────────────────────────────────────────────────────────────

interface BracketMatchCardProps {
  slot: BracketSlot;
  onPress?: () => void;
}

function BracketMatchCard({ slot, onPress }: BracketMatchCardProps) {
  const isDefined = slot.homeId !== null && slot.awayId !== null;
  const homeIsWinner = isDefined && slot.winnerId === slot.homeId;
  const awayIsWinner = isDefined && slot.winnerId === slot.awayId;
  const showD2 = slot.isHomeAway;
  const homeGoalsD2 = showD2 ? slot.leg2AwayGoals : null;
  const awayGoalsD2 = showD2 ? slot.leg2HomeGoals : null;
  const showAggregate = showD2 && slot.isDone && isDefined;
  const totalHome = showAggregate ? (slot.leg1HomeGoals ?? 0) + (homeGoalsD2 ?? 0) : null;
  const totalAway = showAggregate ? (slot.leg1AwayGoals ?? 0) + (awayGoalsD2 ?? 0) : null;

  return (
    <Pressable
      onPress={isDefined ? onPress : undefined}
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isDefined ? "rgba(139,92,246,0.28)" : "rgba(255,255,255,0.07)",
        backgroundColor: isDefined ? "rgba(7,4,18,0.94)" : "rgba(7,4,18,0.50)",
        overflow: "hidden",
        justifyContent: "space-between",
      }}
    >
      {!isDefined ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 3 }}>
          <Text style={{ color: "rgba(255,255,255,0.16)", fontSize: 16 }}>🛡️</Text>
          <Text style={{ color: "rgba(255,255,255,0.22)", fontSize: 9 }}>A definir</Text>
        </View>
      ) : (
        <>
          {/* D1/D2 column headers */}
          <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 6, paddingTop: 4, gap: 2 }}>
            <Text style={{ width: 18, textAlign: "center", color: "#3B5580", fontSize: 8, fontWeight: "800" }}>D1</Text>
            {showD2 && (
              <Text style={{ width: 18, textAlign: "center", color: "#3B5580", fontSize: 8, fontWeight: "800" }}>D2</Text>
            )}
            <View style={{ width: 10 }} />
          </View>

          <TeamRow
            name={slot.homeName}
            flagUrl={slot.homeFlagUrl}
            goalsD1={slot.leg1HomeGoals}
            goalsD2={homeGoalsD2}
            isWinner={homeIsWinner}
            showD2={showD2}
          />

          <View style={{ height: 1, backgroundColor: "rgba(139,92,246,0.12)", marginHorizontal: 5 }} />

          <TeamRow
            name={slot.awayName}
            flagUrl={slot.awayFlagUrl}
            goalsD1={slot.leg1AwayGoals}
            goalsD2={awayGoalsD2}
            isWinner={awayIsWinner}
            showD2={showD2}
          />

          {showAggregate ? (
            <View style={{ paddingHorizontal: 5, paddingBottom: 3 }}>
              <Text style={{ color: "rgba(167,139,250,0.50)", fontSize: 8, textAlign: "center" }}>
                Agr: {totalHome}–{totalAway}
              </Text>
            </View>
          ) : (
            <View style={{ height: 4 }} />
          )}
        </>
      )}
    </Pressable>
  );
}

// ── Main component — vertical bracket ────────────────────────────────────────

export interface KnockoutBracketProps {
  campeonato: Campeonato;
  participantes: Participante[];
  onPressMatch: (matchId: string) => void;
}

export function KnockoutBracket({ campeonato, participantes, onPressMatch }: KnockoutBracketProps) {
  const columns = buildBracketColumns(campeonato, participantes);
  if (columns.length === 0) return null;

  const numPhases = columns.length;
  const firstCount = columns[0]!.slots.length;

  function pressSlot(slot: BracketSlot) {
    if (slot.matchId) onPressMatch(slot.matchId);
  }

  // Only a final — render it simply
  if (numPhases === 1 || firstCount < 2) {
    const slot = columns[numPhases - 1]!.slots[0]!;
    return (
      <View style={{ alignItems: "center", padding: 16 }}>
        <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>
          Final
        </Text>
        <BracketMatchCard slot={slot} onPress={() => pressSlot(slot)} />
      </View>
    );
  }

  // ── Canvas dimensions ────────────────────────────────────────────────────

  const totalWidth = firstCount * UNIT_W - CARD_GAP_H;
  const phaseBlockH = HEADER_H + CARD_H;
  const totalHeight = numPhases * phaseBlockH + (numPhases - 1) * ROW_GAP;

  // ── Connectors between consecutive phases ────────────────────────────────
  // For each pair (2i, 2i+1) in phase phIdx → parent slot i in phase phIdx+1:
  //   1. Arm down from each card bottom to mergeY
  //   2. Horizontal spine from leftCX to rightCX at mergeY
  //   3. Arm down from parentCX to next card top

  const connectors: React.ReactNode[] = [];

  for (let phIdx = 0; phIdx < numPhases - 1; phIdx++) {
    const slotsInPhase = columns[phIdx]!.slots.length;
    const yBottom = yCardOf(phIdx) + CARD_H;
    const mergeY = yBottom + ROW_GAP / 2;
    const yNextCard = yCardOf(phIdx + 1);

    for (let i = 0; i < Math.ceil(slotsInPhase / 2); i++) {
      const leftSlot = 2 * i;
      const rightSlot = 2 * i + 1 < slotsInPhase ? 2 * i + 1 : 2 * i;
      const leftCX = xCenterOf(phIdx, leftSlot);
      const rightCX = xCenterOf(phIdx, rightSlot);
      const parentCX = xCenterOf(phIdx + 1, i);
      const spineW = Math.abs(rightCX - leftCX);

      connectors.push(
        // Arm down from left card
        <View key={`aL-${phIdx}-${i}`} style={{ position: "absolute", left: leftCX - 0.5, top: yBottom, width: 1, height: mergeY - yBottom, backgroundColor: CONN }} />,
        // Arm down from right card (only if different from left)
        leftSlot !== rightSlot && (
          <View key={`aR-${phIdx}-${i}`} style={{ position: "absolute", left: rightCX - 0.5, top: yBottom, width: 1, height: mergeY - yBottom, backgroundColor: CONN }} />
        ),
        // Horizontal spine at mergeY
        spineW > 0 && (
          <View key={`sp-${phIdx}-${i}`} style={{ position: "absolute", left: Math.min(leftCX, rightCX), top: mergeY - 0.5, width: spineW, height: 1, backgroundColor: CONN }} />
        ),
        // Arm down from spine midpoint to next card
        <View key={`dn-${phIdx}-${i}`} style={{ position: "absolute", left: parentCX - 0.5, top: mergeY, width: 1, height: yNextCard - mergeY, backgroundColor: CONN }} />,
      );
    }
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 24 }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View style={{ width: totalWidth, height: totalHeight }}>

          {/* Connectors (drawn under cards) */}
          {connectors}

          {/* Cards phase by phase */}
          {columns.map((col, phIdx) => (
            <React.Fragment key={`ph-${phIdx}`}>
              {/* Phase label */}
              <Text
                style={{
                  position: "absolute",
                  left: 0,
                  width: totalWidth,
                  top: phIdx * (phaseBlockH + ROW_GAP),
                  textAlign: "center",
                  color: phIdx === numPhases - 1 ? "#F59E0B" : "#6B8FD4",
                  fontSize: 10,
                  fontWeight: "900",
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                }}
              >
                {col.label}
              </Text>

              {/* Slot cards */}
              {col.slots.map((slot, si) => (
                <View
                  key={si}
                  style={{ position: "absolute", left: xLeftOf(phIdx, si), top: yCardOf(phIdx) }}
                >
                  <BracketMatchCard slot={slot} onPress={() => pressSlot(slot)} />
                </View>
              ))}
            </React.Fragment>
          ))}

        </View>
      </ScrollView>
    </ScrollView>
  );
}
