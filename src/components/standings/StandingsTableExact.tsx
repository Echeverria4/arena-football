import { useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Movement = "up" | "down" | "same";
type RecentFormResult = "win" | "draw" | "loss" | "empty";

export type StandingRow = {
  id: string;
  position: number;
  name: string;
  crest?: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  recentForm?: RecentFormResult[];
  movement?: Movement;
  previousPosition?: number;
};

type Props = {
  title?: string;
  phaseLabel?: string;
  data: StandingRow[];
  selectedId?: string;
  showTitle?: boolean;
  onSelect?: (item: StandingRow) => void;
};

// ── Zone ─────────────────────────────────────────────────────────────────────

function getZoneColor(position: number, total: number): string {
  if (position === 1) return "#F4C542";
  if (position <= 4) return "#1FBF75";
  if (position >= total - 2) return "#E24C4C";
  return "#CBD5E1";
}

// ── Movement ─────────────────────────────────────────────────────────────────

function getMovement(item: StandingRow): Movement {
  if (item.movement) return item.movement;
  if (item.previousPosition == null) return "same";
  if (item.previousPosition > item.position) return "up";
  if (item.previousPosition < item.position) return "down";
  return "same";
}

// ── Form ─────────────────────────────────────────────────────────────────────

function formVisual(result: RecentFormResult) {
  switch (result) {
    case "win":  return { bg: "#16A34A", text: "#fff", label: "V" };
    case "draw": return { bg: "#EAB308", text: "#3B2F00", label: "E" };
    case "loss": return { bg: "#DC2626", text: "#fff", label: "D" };
    default:     return { bg: "#E2E8F0", text: "#94A3B8", label: "·" };
  }
}

// ── Row height constant (keeps fixed + scroll columns aligned) ────────────────

const ROW_H = 52;
const HEAD_H = 38;
const STAT_W = 38;   // width of each stat column
const FORM_DOT = 16; // form dot size
const FORM_GAP = 3;
const FORM_COL_W = 5 * (FORM_DOT + FORM_GAP) - FORM_GAP + 16; // ~91px
const FIXED_W = 188; // rank(32) + badge(36) + name(120)

// ── Fixed left column ─────────────────────────────────────────────────────────

function FixedColumn({
  data,
  total,
  selectedId,
  onSelect,
}: {
  data: StandingRow[];
  total: number;
  selectedId?: string;
  onSelect?: (item: StandingRow) => void;
}) {
  return (
    <View style={{ width: FIXED_W }}>
      {/* Header */}
      <View style={[s.headRow, { height: HEAD_H }]}>
        <View style={s.zoneBar} />
        <Text style={[s.headText, { width: 32, textAlign: "center" }]}>#</Text>
        <Text style={[s.headText, { flex: 1, paddingLeft: 8 }]}>Clube</Text>
      </View>

      {data.map((item, index) => {
        const zoneColor = getZoneColor(item.position, total);
        const move = getMovement(item);
        const isSelected = item.id === selectedId;
        const isAlt = index % 2 !== 0;

        return (
          <Pressable
            key={item.id}
            onPress={onSelect ? () => onSelect(item) : undefined}
            style={({ pressed }) => [
              s.row,
              { height: ROW_H },
              isAlt && s.rowAlt,
              isSelected && s.rowSelected,
              pressed && { opacity: 0.88 },
            ]}
          >
            {/* Zone color bar */}
            <View style={[s.zoneBar, { backgroundColor: zoneColor }]} />

            {/* Rank */}
            <View style={s.rankCell}>
              <Text style={[
                s.rankText,
                item.position === 1 && { color: "#B07D00" },
              ]}>
                {item.position}
              </Text>
            </View>

            {/* Badge + Name */}
            <View style={s.teamFixedCell}>
              <View style={s.badgeShell}>
                {item.crest ? (
                  <Image source={{ uri: item.crest }} style={s.badge} resizeMode="contain" />
                ) : (
                  <View style={s.badgeFallback}>
                    <Text style={s.badgeFallbackText}>{item.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1, gap: 1 }}>
                <Text numberOfLines={1} style={[s.teamName, isSelected && { color: "#1E3A8A" }]}>
                  {item.name}
                </Text>
                {move !== "same" && (
                  <Text style={[
                    s.moveTag,
                    move === "up" ? { color: "#16A34A" } : { color: "#DC2626" },
                  ]}>
                    {move === "up" ? "▲" : "▼"}
                  </Text>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Scrollable stats columns ──────────────────────────────────────────────────

const STAT_COLS = [
  { key: "points",        label: "P",    highlight: true },
  { key: "played",        label: "J",    highlight: false },
  { key: "wins",          label: "V",    highlight: false },
  { key: "draws",         label: "E",    highlight: false },
  { key: "losses",        label: "D",    highlight: false },
  { key: "goalsFor",      label: "GM",   highlight: false },
  { key: "goalsAgainst",  label: "GC",   highlight: false },
  { key: "goalDifference",label: "SG",   highlight: false },
];

function StatColumns({
  data,
  total,
  selectedId,
}: {
  data: StandingRow[];
  total: number;
  selectedId?: string;
}) {
  const totalStatW = STAT_COLS.length * STAT_W + FORM_COL_W;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
      <View style={{ minWidth: totalStatW }}>
        {/* Header */}
        <View style={[s.headRow, { height: HEAD_H }]}>
          {STAT_COLS.map((col) => (
            <View key={col.key} style={[s.statHeadCell, col.highlight && s.statHeadHighlight]}>
              <Text style={[s.headText, col.highlight && { color: "#2447A6" }]}>{col.label}</Text>
            </View>
          ))}
          {/* Form header */}
          <View style={[s.statHeadCell, { width: FORM_COL_W }]}>
            <Text style={s.headText}>Últimas</Text>
          </View>
        </View>

        {data.map((item, index) => {
          const isAlt = index % 2 !== 0;
          const isSelected = item.id === selectedId;
          const gd = item.goalDifference ?? 0;
          const gdColor = gd > 0 ? "#15803D" : gd < 0 ? "#B91C1C" : "#475569";

          const vals: Record<string, number | string> = {
            points: item.points,
            played: item.played,
            wins: item.wins,
            draws: item.draws,
            losses: item.losses,
            goalsFor: item.goalsFor ?? 0,
            goalsAgainst: item.goalsAgainst ?? 0,
            goalDifference: gd > 0 ? `+${gd}` : gd,
          };

          return (
            <View
              key={item.id}
              style={[
                s.row,
                { height: ROW_H },
                isAlt && s.rowAlt,
                isSelected && s.rowSelected,
              ]}
            >
              {STAT_COLS.map((col) => (
                <View key={col.key} style={[s.statCell, col.highlight && s.statCellHighlight]}>
                  <Text style={[
                    s.statText,
                    col.key === "points" && s.pointsText,
                    col.key === "goalDifference" && { color: gdColor },
                  ]}>
                    {String(vals[col.key])}
                  </Text>
                </View>
              ))}

              {/* Form dots */}
              <View style={[s.formCell, { width: FORM_COL_W }]}>
                {(item.recentForm ?? ["empty","empty","empty","empty","empty"]).slice(0, 5).map((r, i) => {
                  const v = formVisual(r);
                  return (
                    <View key={i} style={[s.formDot, { backgroundColor: v.bg }]}>
                      <Text style={[s.formDotText, { color: v.text }]}>{v.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function StandingsTableExact({
  title,
  phaseLabel = "1ª Fase",
  data,
  selectedId,
  showTitle = true,
  onSelect,
}: Props) {
  return (
    <View style={s.root}>
      {/* Phase pill */}
      <View style={s.phaseRow}>
        {showTitle && title ? (
          <Text style={s.phaseTitle} numberOfLines={1}>{title}</Text>
        ) : null}
        <View style={s.phasePill}>
          <Text style={s.phaseText}>{phaseLabel}</Text>
        </View>
      </View>

      {/* Table shell */}
      <View style={s.shell}>
        <View style={{ flexDirection: "row" }}>
          <FixedColumn data={data} total={data.length} selectedId={selectedId} onSelect={onSelect} />
          <View style={s.divider} />
          <View style={{ flex: 1, overflow: "hidden" }}>
            <StatColumns data={data} total={data.length} selectedId={selectedId} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    gap: 8,
  },

  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  phaseTitle: {
    flex: 1,
    color: "#1E2B5C",
    fontSize: 15,
    fontWeight: "900",
  },

  phasePill: {
    alignSelf: "flex-start",
    backgroundColor: "#F8FAFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(59,91,255,0.18)",
  },

  phaseText: {
    color: "#3150A6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  shell: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
  },

  divider: {
    width: 1,
    backgroundColor: "#D7E4F7",
  },

  headRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F8FF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5EDF7",
  },

  headText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EAF1F8",
  },

  rowAlt: {
    backgroundColor: "#FAFCFF",
  },

  rowSelected: {
    backgroundColor: "#EEF4FF",
  },

  zoneBar: {
    width: 3,
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },

  rankCell: {
    width: 29,
    alignItems: "center",
    justifyContent: "center",
  },

  rankText: {
    color: "#1E2B5C",
    fontSize: 13,
    fontWeight: "800",
  },

  teamFixedCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 6,
    paddingRight: 8,
    gap: 7,
    overflow: "hidden",
  },

  badgeShell: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0F5FF",
    borderWidth: 1,
    borderColor: "#D7E4F7",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },

  badge: {
    width: 24,
    height: 24,
  },

  badgeFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DBE4F0",
    alignItems: "center",
    justifyContent: "center",
  },

  badgeFallbackText: {
    color: "#223C7B",
    fontWeight: "800",
    fontSize: 9,
  },

  teamName: {
    color: "#1E2B5C",
    fontSize: 12,
    fontWeight: "800",
  },

  moveTag: {
    fontSize: 9,
    fontWeight: "900",
  },

  statHeadCell: {
    width: STAT_W,
    height: HEAD_H,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#EEF3F9",
  },

  statHeadHighlight: {
    backgroundColor: "#EEF4FF",
  },

  statCell: {
    width: STAT_W,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#EEF3F9",
  },

  statCellHighlight: {
    backgroundColor: "#F7F9FF",
  },

  statText: {
    color: "#1E2B5C",
    fontSize: 12,
    fontWeight: "700",
  },

  pointsText: {
    color: "#2447A6",
    fontSize: 13,
    fontWeight: "900",
  },

  formCell: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: FORM_GAP,
    borderLeftWidth: 1,
    borderLeftColor: "#EEF3F9",
    paddingHorizontal: 6,
  },

  formDot: {
    width: FORM_DOT,
    height: FORM_DOT,
    borderRadius: FORM_DOT / 2,
    alignItems: "center",
    justifyContent: "center",
  },

  formDotText: {
    fontSize: 8,
    fontWeight: "900",
  },
});
