import { useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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

function getZoneMeta(position: number, total: number) {
  if (position === 1) {
    return {
      color: "#F4C542",
      label: "Lider",
      chipBackground: "rgba(244,197,66,0.16)",
      chipText: "#8A5A00",
    };
  }

  if (position <= 4) {
    return {
      color: "#1FBF75",
      label: "G4",
      chipBackground: "rgba(31,191,117,0.14)",
      chipText: "#0F7A47",
    };
  }

  if (position >= total - 2) {
    return {
      color: "#E24C4C",
      label: "Z3",
      chipBackground: "rgba(226,76,76,0.14)",
      chipText: "#9F1F1F",
    };
  }

  return {
    color: "#CBD5E1",
    label: "Meio",
    chipBackground: "#F8FAFC",
    chipText: "#64748B",
  };
}

function getMovement(item: StandingRow): Movement {
  if (item.movement) {
    return item.movement;
  }

  if (item.previousPosition == null) {
    return "same";
  }

  if (item.previousPosition > item.position) {
    return "up";
  }

  if (item.previousPosition < item.position) {
    return "down";
  }

  return "same";
}

function getMovementDelta(item: StandingRow) {
  if (item.previousPosition == null) {
    return 0;
  }

  return item.previousPosition - item.position;
}

function getMovementVisual(movement?: Movement) {
  switch (movement) {
    case "up":
      return {
        symbol: "▲",
        color: "#16A34A",
        backgroundColor: "rgba(34,197,94,0.12)",
        borderColor: "rgba(34,197,94,0.20)",
      };
    case "down":
      return {
        symbol: "▼",
        color: "#DC2626",
        backgroundColor: "rgba(239,68,68,0.12)",
        borderColor: "rgba(239,68,68,0.20)",
      };
    default:
      return {
        symbol: "-",
        color: "#94A3B8",
        backgroundColor: "#F8FAFC",
        borderColor: "#E2E8F0",
      };
  }
}

function getRecentFormVisual(result: RecentFormResult) {
  switch (result) {
    case "win":
      return {
        label: "Vitoria",
        shortLabel: "✓",
        backgroundColor: "#16A34A",
        borderColor: "#15803D",
        textColor: "#FFFFFF",
      };
    case "draw":
      return {
        label: "Empate",
        shortLabel: "—",
        backgroundColor: "#EAB308",
        borderColor: "#CA8A04",
        textColor: "#3B2F00",
      };
    case "loss":
      return {
        label: "Derrota",
        shortLabel: "×",
        backgroundColor: "#DC2626",
        borderColor: "#B91C1C",
        textColor: "#FFFFFF",
      };
    default:
      return {
        label: "Sem partida",
        shortLabel: "·",
        backgroundColor: "#FFFFFF",
        borderColor: "#CBD5E1",
        textColor: "#94A3B8",
      };
  }
}

function PositionBadge({ position }: { position: number }) {
  const isTop3 = position <= 3;

  return (
    <View
      style={[
        styles.positionBadge,
        isTop3 && position === 1 && styles.positionFirst,
        isTop3 && position === 2 && styles.positionSecond,
        isTop3 && position === 3 && styles.positionThird,
      ]}
    >
      <Text style={[styles.positionText, isTop3 && styles.positionTextTop]}>{position}</Text>
    </View>
  );
}

function TableLegend() {
  const classificationItems = [
    {
      label: "Lider",
      color: "#F4C542",
      backgroundColor: "rgba(244,197,66,0.16)",
      textColor: "#8A5A00",
    },
    {
      label: "G4",
      color: "#1FBF75",
      backgroundColor: "rgba(31,191,117,0.14)",
      textColor: "#0F7A47",
    },
    {
      label: "Z3",
      color: "#E24C4C",
      backgroundColor: "rgba(226,76,76,0.14)",
      textColor: "#9F1F1F",
    },
  ];
  const formItems: RecentFormResult[] = ["win", "draw", "loss"];

  return (
    <View style={styles.legendSection}>
      <View style={styles.legendBlock}>
        <Text style={styles.legendTitle}>Classificacao</Text>
        <View style={styles.legendRow}>
          {classificationItems.map((item) => (
            <View
              key={item.label}
              style={[
                styles.legendChip,
                {
                  backgroundColor: item.backgroundColor,
                  borderColor: item.color,
                },
              ]}
            >
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: item.textColor }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.legendBlock}>
        <Text style={styles.legendTitle}>Ultimas 5</Text>
        <View style={styles.legendRow}>
          {formItems.map((item) => {
            const visual = getRecentFormVisual(item);

            return (
              <View key={item} style={styles.legendFormItem}>
                <View
                  style={[
                    styles.formBadge,
                    {
                      backgroundColor: visual.backgroundColor,
                      borderColor: visual.borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.formBadgeText, { color: visual.textColor }]}>
                    {visual.shortLabel}
                  </Text>
                </View>
                <Text style={styles.legendFormText}>{visual.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function StatColumn({
  label,
  width,
  highlight = false,
}: {
  label: string;
  width: number;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.headStatCell, { width }, highlight && styles.headStatCellHighlight]}>
      <Text style={[styles.headText, highlight && styles.headTextHighlight]}>{label}</Text>
    </View>
  );
}

function RecentFormStrip({ recentForm }: { recentForm?: RecentFormResult[] }) {
  const safeForm: RecentFormResult[] = recentForm?.length
    ? recentForm.slice(0, 5)
    : ["empty", "empty", "empty", "empty", "empty"];

  return (
    <View style={styles.formStrip}>
      {safeForm.map((result, index) => {
        const visual = getRecentFormVisual(result);

        return (
          <View
            key={`${result}-${index}`}
            accessibilityLabel={`Partida ${index + 1}: ${visual.label}`}
            style={[
              styles.formBadge,
              {
                backgroundColor: visual.backgroundColor,
                borderColor: visual.borderColor,
              },
            ]}
          >
            <Text style={[styles.formBadgeText, { color: visual.textColor }]}>
              {visual.shortLabel}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function StandingItem({
  item,
  index,
  total,
  selected,
  showMovementColumn,
  compact,
  statWidth,
  formWidth,
  onPress,
}: {
  item: StandingRow;
  index: number;
  total: number;
  selected?: boolean;
  showMovementColumn: boolean;
  compact: boolean;
  statWidth: number;
  formWidth: number;
  onPress?: () => void;
}) {
  const move = getMovementVisual(getMovement(item));
  const movementDelta = getMovementDelta(item);
  const zone = getZoneMeta(item.position, total);
  const rowStyle = index % 2 === 0 ? styles.rowBase : styles.rowAlt;
  const goalDifference = item.goalDifference ?? 0;
  const goalDifferenceColor =
    goalDifference > 0 ? "#15803D" : goalDifference < 0 ? "#B91C1C" : "#475569";
  const movementLabel =
    movementDelta > 0 ? `+${movementDelta}` : movementDelta < 0 ? `${movementDelta}` : "-";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        rowStyle,
        compact && styles.rowCompact,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.zoneBar, { backgroundColor: zone.color }]} />

      <View style={styles.rankCol}>
        <PositionBadge position={item.position} />
      </View>

      {showMovementColumn ? (
        <View style={styles.moveCol}>
          <View
            style={[
              styles.moveBadge,
              {
                backgroundColor: move.backgroundColor,
                borderColor: move.borderColor,
              },
            ]}
          >
            <Text style={[styles.moveText, { color: move.color }]}>
              {movementDelta === 0 ? "-" : move.symbol}
            </Text>
            {movementDelta === 0 ? null : (
              <Text style={[styles.moveDeltaText, { color: move.color }]}>{movementLabel}</Text>
            )}
          </View>
        </View>
      ) : null}

      <View style={styles.teamCol}>
        <View style={[styles.crestShell, selected && styles.crestShellSelected]}>
          {item.crest ? (
            <Image source={{ uri: item.crest }} style={styles.crest} resizeMode="contain" />
          ) : (
            <View style={styles.crestFallback}>
              <Text style={styles.crestFallbackText}>{item.name.slice(0, 2).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.teamTextWrap}>
          <Text numberOfLines={1} style={styles.teamName}>
            {item.name}
          </Text>

          <View style={styles.teamMetaRow}>
            <View
              style={[
                styles.zoneChip,
                {
                  backgroundColor: zone.chipBackground,
                  borderColor: zone.color,
                },
              ]}
            >
              <Text style={[styles.zoneChipText, { color: zone.chipText }]}>{zone.label}</Text>
            </View>

            <Text numberOfLines={1} style={styles.teamMetaText}>
              {item.played} jogos
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.statCell, { width: statWidth }]}>
        <Text style={styles.pointsText}>{item.points}</Text>
      </View>
      <View style={[styles.statCell, { width: statWidth }]}>
        <Text style={styles.statText}>{item.played}</Text>
      </View>
      <View style={[styles.statCell, { width: statWidth }]}>
        <Text style={styles.statText}>{item.wins}</Text>
      </View>
      <View style={[styles.statCell, { width: statWidth }]}>
        <Text style={styles.statText}>{item.draws}</Text>
      </View>
      <View style={[styles.statCell, { width: statWidth }]}>
        <Text style={styles.statText}>{item.losses}</Text>
      </View>
      <View style={[styles.statCell, { width: statWidth }]}>
        <Text style={styles.statText}>{item.goalsFor ?? 0}</Text>
      </View>
      <View style={[styles.statCell, { width: statWidth }]}>
        <Text style={styles.statText}>{item.goalsAgainst ?? 0}</Text>
      </View>
      <View style={[styles.statCell, { width: statWidth }]}>
        <Text style={[styles.statText, { color: goalDifferenceColor }]}>
          {goalDifference > 0 ? `+${goalDifference}` : goalDifference}
        </Text>
      </View>
      <View style={[styles.formCell, { width: formWidth }]}>
        <RecentFormStrip recentForm={item.recentForm} />
      </View>
    </Pressable>
  );
}

export default function StandingsTableExact({
  title = "Copa Neres",
  phaseLabel = "1 Fase",
  data,
  selectedId,
  showTitle = true,
  onSelect,
}: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 420;
  const statWidth = compact ? 46 : width < 768 ? 52 : 56;
  const formWidth = compact ? 140 : width < 768 ? 150 : 164;
  const showMovementColumn = useMemo(
    () => data.some((item) => getMovement(item) !== "same"),
    [data],
  );

  const tableMinWidth = useMemo(
    () => 4 + 56 + (showMovementColumn ? 68 : 0) + 280 + statWidth * 8 + formWidth,
    [formWidth, showMovementColumn, statWidth],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, !showTitle && styles.headerCompact]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextWrap}>
            {showTitle ? <Text style={styles.title}>{title}</Text> : null}
            <Text style={styles.subtitle}>
              Tabela oficial com pontos, gols, saldo, movimento e forma recente.
            </Text>
          </View>

          <View style={styles.phasePill}>
            <Text style={styles.phaseText}>{phaseLabel}</Text>
          </View>
        </View>

        {showTitle ? <TableLegend /> : null}
      </View>

      <View style={styles.tableShell}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.tableInner, { minWidth: tableMinWidth }]}>
            <View style={styles.headRow}>
              <View style={styles.headZoneSpacer} />
              <View style={styles.rankHeadCell}>
                <Text style={styles.headText}>Rank</Text>
              </View>
              {showMovementColumn ? <StatColumn label="Mov" width={68} /> : null}
              <View style={styles.clubHeadCell}>
                <Text style={[styles.headText, styles.clubHeadText]}>Clube</Text>
              </View>
              <StatColumn label="Pts" width={statWidth} highlight />
              <StatColumn label="PJ" width={statWidth} />
              <StatColumn label="VIT" width={statWidth} />
              <StatColumn label="E" width={statWidth} />
              <StatColumn label="DER" width={statWidth} />
              <StatColumn label="GM" width={statWidth} />
              <StatColumn label="GC" width={statWidth} />
              <StatColumn label="SG" width={statWidth} />
              <StatColumn label="Ultimas 5" width={formWidth} />
            </View>

            {data.map((item, index) => (
              <StandingItem
                key={item.id}
                item={item}
                index={index}
                total={data.length}
                selected={item.id === selectedId}
                showMovementColumn={showMovementColumn}
                compact={compact}
                statWidth={statWidth}
                formWidth={formWidth}
                onPress={onSelect ? () => onSelect(item) : undefined}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "transparent",
    gap: 14,
  },

  header: {
    gap: 12,
  },

  headerCompact: {
    gap: 10,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  headerTextWrap: {
    flex: 1,
    gap: 6,
    minWidth: 240,
  },

  title: {
    color: "#1E2B5C",
    fontSize: 28,
    fontWeight: "900",
  },

  subtitle: {
    color: "#6B7EA3",
    fontSize: 14,
    lineHeight: 22,
  },

  phasePill: {
    alignSelf: "flex-start",
    backgroundColor: "#F8FAFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(59,91,255,0.16)",
  },

  phaseText: {
    color: "#3150A6",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  legendSection: {
    gap: 12,
  },

  legendBlock: {
    gap: 8,
  },

  legendTitle: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  legendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },

  legendText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  legendFormItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  legendFormText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },

  tableShell: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
  },

  scrollContent: {
    flexGrow: 1,
  },

  tableInner: {
    width: "100%",
  },

  headRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: "#E5EDF7",
    backgroundColor: "#F8FAFF",
  },

  headZoneSpacer: {
    width: 4,
    alignSelf: "stretch",
  },

  headText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  headTextHighlight: {
    color: "#3150A6",
  },

  rankHeadCell: {
    width: 56,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },

  clubHeadCell: {
    minWidth: 280,
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    paddingLeft: 14,
  },

  clubHeadText: {
    textAlign: "left",
  },

  headStatCell: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    borderLeftWidth: 1,
    borderLeftColor: "#EEF3F9",
  },

  headStatCellHighlight: {
    backgroundColor: "#EEF4FF",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    borderBottomWidth: 1,
    borderBottomColor: "#EAF1F8",
  },

  rowCompact: {
    minHeight: 72,
  },

  rowBase: {
    backgroundColor: "#FFFFFF",
  },

  rowAlt: {
    backgroundColor: "#FBFDFF",
  },

  rowSelected: {
    backgroundColor: "#F4F8FF",
  },

  rowPressed: {
    opacity: 0.92,
  },

  zoneBar: {
    width: 4,
    alignSelf: "stretch",
  },

  rankCol: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  moveCol: {
    width: 68,
    alignItems: "center",
    justifyContent: "center",
  },

  moveBadge: {
    minWidth: 46,
    minHeight: 30,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  moveText: {
    fontSize: 11,
    fontWeight: "900",
  },

  moveDeltaText: {
    fontSize: 10,
    fontWeight: "900",
  },

  positionBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#E1E9F4",
  },

  positionFirst: {
    backgroundColor: "rgba(244,197,66,0.18)",
  },

  positionSecond: {
    backgroundColor: "rgba(203,213,225,0.45)",
  },

  positionThird: {
    backgroundColor: "rgba(205,127,50,0.18)",
  },

  positionText: {
    color: "#1E2B5C",
    fontWeight: "800",
    fontSize: 14,
  },

  positionTextTop: {
    fontSize: 14,
  },

  teamCol: {
    flex: 1,
    minWidth: 280,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 10,
  },

  crestShell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#F0F5FF",
    borderWidth: 1,
    borderColor: "#D7E4F7",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestShellSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#9BB5E8",
  },

  crest: {
    width: 28,
    height: 28,
  },

  crestFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DBE4F0",
    alignItems: "center",
    justifyContent: "center",
  },

  crestFallbackText: {
    color: "#223C7B",
    fontWeight: "800",
    fontSize: 11,
  },

  teamTextWrap: {
    flex: 1,
    gap: 5,
  },

  teamName: {
    flex: 1,
    color: "#1E2B5C",
    fontSize: 15,
    fontWeight: "900",
  },

  teamMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  zoneChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },

  zoneChipText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  teamMetaText: {
    color: "#7A8CA9",
    fontSize: 11,
    fontWeight: "700",
  },

  statCell: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#EEF3F9",
    backgroundColor: "transparent",
  },

  formCell: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#EEF3F9",
    paddingHorizontal: 10,
    backgroundColor: "transparent",
  },

  statText: {
    color: "#1E2B5C",
    fontSize: 14,
    fontWeight: "900",
  },

  pointsText: {
    color: "#2447A6",
    fontSize: 15,
    fontWeight: "900",
  },

  formStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  formBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  formBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
