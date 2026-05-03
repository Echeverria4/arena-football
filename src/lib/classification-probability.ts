/**
 * Monte Carlo classification probability engine.
 *
 * For each remaining match we estimate P(home wins), P(draw), P(away wins)
 * based on:
 *   - historical home / away win rates
 *   - attack (goals scored) vs opponent defence (goals conceded)
 *   - current points proximity
 *
 * We then run ITERATIONS simulated completions of the remaining schedule and
 * record how often each player finishes inside the qualifying band.
 */

import type { Jogo } from "@/types/tournament";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ParticipantPerfStats = {
  id: string;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  homeWins: number;
  homeGames: number;
  awayWins: number;
  awayGames: number;
  totalWins: number;
  totalGames: number;
};

/** participantId → 0-100 */
export type QualProbs = Map<string, number>;

// ── Internal helpers ───────────────────────────────────────────────────────────

function buildPerfStats(
  participantIds: ReadonlyArray<string>,
  finishedMatches: Jogo[],
): Map<string, ParticipantPerfStats> {
  const stats = new Map<string, ParticipantPerfStats>();
  for (const id of participantIds) {
    stats.set(id, {
      id,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      homeWins: 0,
      homeGames: 0,
      awayWins: 0,
      awayGames: 0,
      totalWins: 0,
      totalGames: 0,
    });
  }

  for (const m of finishedMatches) {
    const home = stats.get(m.mandanteId);
    const away = stats.get(m.visitanteId);
    if (!home || !away) continue;
    const hg = m.placarMandante ?? 0;
    const ag = m.placarVisitante ?? 0;

    home.homeGames++;
    away.awayGames++;
    home.totalGames++;
    away.totalGames++;
    home.goalsFor += hg;
    home.goalsAgainst += ag;
    away.goalsFor += ag;
    away.goalsAgainst += hg;

    if (hg > ag) {
      home.points += 3;
      home.homeWins++;
      home.totalWins++;
    } else if (ag > hg) {
      away.points += 3;
      away.awayWins++;
      away.totalWins++;
    } else {
      home.points += 1;
      away.points += 1;
    }
  }

  return stats;
}

function estimateProbs(
  home: ParticipantPerfStats,
  away: ParticipantPerfStats,
): { hw: number; d: number; aw: number } {
  const homeWinRate =
    home.homeGames >= 2
      ? home.homeWins / home.homeGames
      : home.totalGames > 0
        ? home.totalWins / home.totalGames
        : 0.38;

  const awayWinRate =
    away.awayGames >= 2
      ? away.awayWins / away.awayGames
      : away.totalGames > 0
        ? away.totalWins / away.totalGames
        : 0.24;

  const homeAtk = home.totalGames > 0 ? home.goalsFor / home.totalGames : 1.5;
  const homeDef = home.totalGames > 0 ? home.goalsAgainst / home.totalGames : 1.2;
  const awayAtk = away.totalGames > 0 ? away.goalsFor / away.totalGames : 1.2;
  const awayDef = away.totalGames > 0 ? away.goalsAgainst / away.totalGames : 1.5;

  const homeStrength = homeAtk / Math.max(awayDef, 0.4);
  const awayStrength = awayAtk / Math.max(homeDef, 0.4);
  const total = homeStrength + awayStrength;
  const homeRatio = total > 0 ? homeStrength / total : 0.55;

  // Blend win rates (weight 0.55) with attack/defense ratio (weight 0.45)
  const rawHome = homeWinRate * 0.55 + homeRatio * 0.45;
  const rawAway = awayWinRate * 0.55 + (1 - homeRatio) * 0.45;

  // Draw rate decreases as goal tendency increases
  const avgAtk = (homeAtk + awayAtk) / 2;
  const drawRate = Math.max(0.14, Math.min(0.34, 0.30 - avgAtk * 0.025));

  let hw = rawHome * (1 - drawRate);
  let aw = rawAway * (1 - drawRate);
  let d = 1 - hw - aw;

  // Clamp and renormalise
  hw = Math.max(0.05, hw);
  aw = Math.max(0.05, aw);
  d = Math.max(0.05, d);
  const sum = hw + d + aw;
  return { hw: hw / sum, d: d / sum, aw: aw / sum };
}

function pick(hw: number, d: number): "home" | "draw" | "away" {
  const r = Math.random();
  if (r < hw) return "home";
  if (r < hw + d) return "draw";
  return "away";
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Count rounds with at least one pending match, up to `maxRound` inclusive.
 */
export function countPendingRounds(allMatches: Jogo[], maxRound: number): number {
  const rounds = new Set<number>();
  for (const m of allMatches) {
    if (m.rodada <= maxRound && m.status !== "finalizado") {
      rounds.add(m.rodada);
    }
  }
  return rounds.size;
}

/**
 * Run Monte Carlo to estimate the probability (0–100) that each participant
 * finishes inside the top `qualifyingPositions` of the given group.
 *
 * @param participantIds  All IDs in this group/league
 * @param allMatches      All matches in this phase (finished + pending)
 * @param maxRound        Ceiling round for group stage (use Infinity for league)
 * @param qualifyingPositions  How many top spots qualify
 * @param iterations      Simulation count (default 4000)
 */
export function computeQualProbs(
  participantIds: ReadonlyArray<string>,
  allMatches: Jogo[],
  maxRound: number,
  qualifyingPositions: number,
  iterations = 4000,
): QualProbs {
  const result = new Map<string, number>();
  for (const id of participantIds) result.set(id, 0);

  const idSet = new Set(participantIds);

  const finished = allMatches.filter(
    (m) =>
      m.status === "finalizado" &&
      m.rodada <= maxRound &&
      idSet.has(m.mandanteId) &&
      idSet.has(m.visitanteId),
  );

  const pending = allMatches.filter(
    (m) =>
      m.status !== "finalizado" &&
      m.rodada <= maxRound &&
      idSet.has(m.mandanteId) &&
      idSet.has(m.visitanteId),
  );

  if (pending.length === 0) return result;

  const base = buildPerfStats(participantIds, finished);

  // Pre-compute match probabilities (these don't change across iterations)
  const matchProbs = pending.map((m) => ({
    homeId: m.mandanteId,
    awayId: m.visitanteId,
    ...estimateProbs(base.get(m.mandanteId)!, base.get(m.visitanteId)!),
  }));

  // Working arrays (avoid GC pressure inside the loop)
  const ids = participantIds as string[];
  const pts = new Array<number>(ids.length);
  const gd = new Array<number>(ids.length);
  const gf = new Array<number>(ids.length);

  // Build ID → index map for O(1) lookups
  const idxOf = new Map<string, number>(ids.map((id, i) => [id, i]));

  // Base values
  const basePts = ids.map((id) => base.get(id)!.points);
  const baseGd = ids.map((id) => {
    const s = base.get(id)!;
    return s.goalsFor - s.goalsAgainst;
  });
  const baseGf = ids.map((id) => base.get(id)!.goalsFor);

  for (let iter = 0; iter < iterations; iter++) {
    // Reset to base values
    for (let i = 0; i < ids.length; i++) {
      pts[i] = basePts[i]!;
      gd[i] = baseGd[i]!;
      gf[i] = baseGf[i]!;
    }

    // Simulate remaining matches
    for (const mp of matchProbs) {
      const hi = idxOf.get(mp.homeId)!;
      const ai = idxOf.get(mp.awayId)!;
      const outcome = pick(mp.hw, mp.d);

      if (outcome === "home") {
        pts[hi]! += 3;
        gd[hi]! += 1;
        gd[ai]! -= 1;
        gf[hi]! += 2;
        gf[ai]! += 1;
      } else if (outcome === "away") {
        pts[ai]! += 3;
        gd[ai]! += 1;
        gd[hi]! -= 1;
        gf[ai]! += 2;
        gf[hi]! += 1;
      } else {
        pts[hi]! += 1;
        pts[ai]! += 1;
        gd[hi]! += 1;
        gd[ai]! += 1;
        gf[hi]! += 2;
        gf[ai]! += 2;
      }
    }

    // Sort indices by (pts desc, gd desc, gf desc)
    const order = ids.map((_, i) => i).sort((a, b) => {
      if (pts[b]! !== pts[a]!) return pts[b]! - pts[a]!;
      if (gd[b]! !== gd[a]!) return gd[b]! - gd[a]!;
      return gf[b]! - gf[a]!;
    });

    for (let pos = 0; pos < qualifyingPositions && pos < order.length; pos++) {
      const id = ids[order[pos]!]!;
      result.set(id, result.get(id)! + 1);
    }
  }

  // Convert counts → percentages
  for (const [id, count] of result) {
    result.set(id, Math.round((count / iterations) * 100));
  }

  return result;
}
