import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { getTeamInitials, normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";
import type { Campeonato, Jogo, Participante } from "@/types/tournament";

// ── Layout constants ─────────────────────────────────────────────────────────

const CARD_H = 96;
const CARD_W = 178;
const UNIT = CARD_H + 8; // 104px per bracket slot
const COL_GAP = 44;
const PHASE_STEP = CARD_W + COL_GAP; // 222px
const HEADER_H = 40;
const CENTER_GAP = COL_GAP;
const CONN = "rgba(139,92,246,0.45)";

// ── Helpers ──────────────────────────────────────────────────────────────────

function topForSide(phaseIdx: number, matchIdx: number): number {
  return (matchIdx + 0.5) * Math.pow(2, phaseIdx) * UNIT - CARD_H / 2;
}

function phaseName(matchCount: number): string {
  if (matchCount >= 16) return "Rodada de 32";
  if (matchCount === 8) return "Oitavas";
  if (matchCount === 4) return "Quartas de final";
  if (matchCount === 2) return "Semifinal";
  if (matchCount === 1) return "Final";
  return `Fase de ${matchCount}`;
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

// ── Match card subcomponents ─────────────────────────────────────────────────

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
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 5, minHeight: 22 }}>
      <View style={{ width: 22, height: 15, justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
        {flagUrl && isDefined ? (
          <Image source={{ uri: flagUrl }} style={{ width: 22, height: 15 }} resizeMode="contain" />
        ) : (
          <View
            style={{
              width: 22, height: 15, borderRadius: 2,
              backgroundColor: "rgba(154,184,255,0.09)",
              justifyContent: "center", alignItems: "center",
            }}
          >
            <Text style={{ color: "#4B6A99", fontSize: 7, fontWeight: "900" }}>
              {isDefined ? getTeamInitials(name).slice(0, 3) : "—"}
            </Text>
          </View>
        )}
      </View>

      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: !isDefined ? "rgba(255,255,255,0.22)" : isWinner ? "#FFFFFF" : "rgba(255,255,255,0.72)",
          fontSize: 11,
          fontWeight: isWinner ? "900" : "700",
        }}
      >
        {name}
      </Text>

      <View style={{ flexDirection: "row", gap: 3, flexShrink: 0 }}>
        {[goalsD1, ...(showD2 ? [goalsD2] : [])].map((g, i) => (
          <View
            key={i}
            style={{
              width: 20, height: 20, borderRadius: 4,
              backgroundColor: isWinner ? "rgba(245,158,11,0.22)" : "rgba(255,255,255,0.07)",
              justifyContent: "center", alignItems: "center",
            }}
          >
            <Text style={{ color: isWinner ? "#FDE68A" : "rgba(255,255,255,0.52)", fontSize: 11, fontWeight: "900" }}>
              {g !== null ? String(g) : "–"}
            </Text>
          </View>
        ))}
      </View>

      {isWinner ? (
        <Text style={{ color: "#F59E0B", fontSize: 9, fontWeight: "900", flexShrink: 0 }}>◀</Text>
      ) : (
        <View style={{ width: 12 }} />
      )}
    </View>
  );
}

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
        borderRadius: 10,
        borderWidth: 1,
        borderColor: isDefined ? "rgba(139,92,246,0.28)" : "rgba(255,255,255,0.07)",
        backgroundColor: isDefined ? "rgba(7,4,18,0.94)" : "rgba(7,4,18,0.50)",
        overflow: "hidden",
        justifyContent: "space-between",
      }}
    >
      {!isDefined ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 4 }}>
          <Text style={{ color: "rgba(255,255,255,0.16)", fontSize: 20 }}>🛡️</Text>
          <Text style={{ color: "rgba(255,255,255,0.22)", fontSize: 10 }}>A definir</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 8, paddingTop: 5, gap: 3 }}>
            <Text style={{ width: 20, textAlign: "center", color: "#3B5580", fontSize: 9, fontWeight: "800" }}>D1</Text>
            {showD2 && (
              <Text style={{ width: 20, textAlign: "center", color: "#3B5580", fontSize: 9, fontWeight: "800" }}>D2</Text>
            )}
            <View style={{ width: 12 }} />
          </View>

          <TeamRow
            name={slot.homeName}
            flagUrl={slot.homeFlagUrl}
            goalsD1={slot.leg1HomeGoals}
            goalsD2={homeGoalsD2}
            isWinner={homeIsWinner}
            showD2={showD2}
          />

          <View style={{ height: 1, backgroundColor: "rgba(139,92,246,0.12)", marginHorizontal: 6 }} />

          <TeamRow
            name={slot.awayName}
            flagUrl={slot.awayFlagUrl}
            goalsD1={slot.leg1AwayGoals}
            goalsD2={awayGoalsD2}
            isWinner={awayIsWinner}
            showD2={showD2}
          />

          {showAggregate ? (
            <View style={{ paddingHorizontal: 6, paddingBottom: 4 }}>
              <Text style={{ color: "rgba(167,139,250,0.50)", fontSize: 9, textAlign: "center" }}>
                Agregado: {totalHome} – {totalAway}
              </Text>
            </View>
          ) : (
            <View style={{ height: 5 }} />
          )}
        </>
      )}
    </Pressable>
  );
}

// ── Main component — Libertadores two-sided bracket ───────────────────────────

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        <View>
          <Text style={{ textAlign: "center", color: "#F59E0B", fontSize: 10, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>
            Final
          </Text>
          <BracketMatchCard slot={slot} onPress={() => pressSlot(slot)} />
        </View>
      </ScrollView>
    );
  }

  // ── Libertadores two-sided layout ────────────────────────────────────────

  const numSidePhases = numPhases - 1;
  const slotsPerSide = Math.floor(firstCount / 2);

  // finalX = x position of the Final card
  const finalX = numSidePhases * PHASE_STEP + CENTER_GAP;
  const totalWidth = 2 * numSidePhases * PHASE_STEP + CARD_W + 2 * CENTER_GAP;
  const canvasHeight = slotsPerSide * UNIT;

  // Both SFs and the Final share the same vertical center
  const finalCenterY = canvasHeight / 2;
  const finalTop = finalCenterY - CARD_H / 2;

  function rightColX(phIdx: number): number {
    return totalWidth - CARD_W - phIdx * PHASE_STEP;
  }

  // Split each non-final column into left (top half) and right (bottom half)
  const leftPhases = columns.slice(0, numSidePhases).map((col) => ({
    label: col.label,
    slots: col.slots.slice(0, Math.ceil(col.slots.length / 2)),
  }));
  const rightPhases = columns.slice(0, numSidePhases).map((col) => ({
    label: col.label,
    slots: col.slots.slice(Math.ceil(col.slots.length / 2)),
  }));
  const finalSlot = columns[numPhases - 1]!.slots[0]!;

  const labelStyle = {
    position: "absolute" as const,
    width: CARD_W,
    top: 0,
    textAlign: "center" as const,
    color: "#6B8FD4",
    fontSize: 10,
    fontWeight: "900" as const,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
    >
      <View style={{ width: totalWidth, height: canvasHeight + HEADER_H }}>

        {/* ── LEFT SIDE phases (branch left→right toward Final) ── */}
        {leftPhases.map((phase, k) => {
          const colX = k * PHASE_STEP;
          const isInner = k === numSidePhases - 1;

          return (
            <React.Fragment key={`L${k}`}>
              <Text style={{ ...labelStyle, left: colX }}>{phase.label}</Text>

              {phase.slots.map((slot, mi) => {
                const cardTop = HEADER_H + topForSide(k, mi);
                const myCenter = cardTop + CARD_H / 2;
                const cardRight = colX + CARD_W;

                const isTop = mi % 2 === 0;
                const pairTop = HEADER_H + topForSide(k, isTop ? mi + 1 : mi - 1);
                const pairCenter = pairTop + CARD_H / 2;
                const spineY = Math.min(myCenter, pairCenter);
                const spineH = Math.abs(myCenter - pairCenter);
                const midY = (myCenter + pairCenter) / 2;
                const spineX = cardRight + COL_GAP / 2;

                return (
                  <React.Fragment key={mi}>
                    <View style={{ position: "absolute", left: colX, top: cardTop }}>
                      <BracketMatchCard slot={slot} onPress={() => pressSlot(slot)} />
                    </View>

                    {/* Horizontal arm from card right edge */}
                    <View style={{
                      position: "absolute",
                      left: cardRight,
                      top: myCenter - 0.5,
                      width: isInner ? (finalX - cardRight) : COL_GAP / 2,
                      height: 1,
                      backgroundColor: CONN,
                    }} />

                    {/* Internal connector (spine + midpoint arm) — non-inner phases only */}
                    {!isInner && isTop && (
                      <>
                        <View style={{ position: "absolute", left: spineX - 0.5, top: spineY, width: 1, height: spineH, backgroundColor: CONN }} />
                        <View style={{ position: "absolute", left: spineX, top: midY - 0.5, width: COL_GAP / 2, height: 1, backgroundColor: CONN }} />
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* ── FINAL card (center) ── */}
        <Text style={{ ...labelStyle, left: finalX, color: "#F59E0B" }}>Final</Text>
        <View style={{ position: "absolute", left: finalX, top: HEADER_H + finalTop }}>
          <BracketMatchCard slot={finalSlot} onPress={() => pressSlot(finalSlot)} />
        </View>

        {/* ── RIGHT SIDE phases (branch right→left toward Final, mirrored) ── */}
        {rightPhases.map((phase, k) => {
          const colX = rightColX(k);
          const isInner = k === numSidePhases - 1;

          return (
            <React.Fragment key={`R${k}`}>
              <Text style={{ ...labelStyle, left: colX }}>{phase.label}</Text>

              {phase.slots.map((slot, mi) => {
                const cardTop = HEADER_H + topForSide(k, mi);
                const myCenter = cardTop + CARD_H / 2;
                // For right side, arm extends LEFT from the card's left edge
                const spineX = colX - COL_GAP / 2;

                const isTop = mi % 2 === 0;
                const pairTop = HEADER_H + topForSide(k, isTop ? mi + 1 : mi - 1);
                const pairCenter = pairTop + CARD_H / 2;
                const spineY = Math.min(myCenter, pairCenter);
                const spineH = Math.abs(myCenter - pairCenter);
                const midY = (myCenter + pairCenter) / 2;
                const nextColRight = rightColX(k + 1) + CARD_W;

                return (
                  <React.Fragment key={mi}>
                    <View style={{ position: "absolute", left: colX, top: cardTop }}>
                      <BracketMatchCard slot={slot} onPress={() => pressSlot(slot)} />
                    </View>

                    {/* Horizontal arm from card left edge going left */}
                    {isInner ? (
                      // Inner right (SF) → Final right edge
                      <View style={{
                        position: "absolute",
                        left: finalX + CARD_W,
                        top: myCenter - 0.5,
                        width: colX - (finalX + CARD_W),
                        height: 1,
                        backgroundColor: CONN,
                      }} />
                    ) : (
                      // Arm: spine → card left edge
                      <View style={{
                        position: "absolute",
                        left: spineX,
                        top: myCenter - 0.5,
                        width: COL_GAP / 2,
                        height: 1,
                        backgroundColor: CONN,
                      }} />
                    )}

                    {/* Internal connector — non-inner phases only */}
                    {!isInner && isTop && (
                      <>
                        <View style={{ position: "absolute", left: spineX - 0.5, top: spineY, width: 1, height: spineH, backgroundColor: CONN }} />
                        <View style={{ position: "absolute", left: nextColRight, top: midY - 0.5, width: COL_GAP / 2, height: 1, backgroundColor: CONN }} />
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

      </View>
    </ScrollView>
  );
}