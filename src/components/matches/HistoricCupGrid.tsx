import { useMemo } from "react";
import { Text, View, useWindowDimensions } from "react-native";

import { HistoricCupCard, type HistoricCupItem } from "@/components/matches/HistoricCupCard";

interface HistoricCupGridProps {
  emptyLabel?: string;
  items: HistoricCupItem[];
  onPressItem?: (item: HistoricCupItem) => void;
  compact?: boolean;
}

export function HistoricCupGrid({
  emptyLabel = "Nenhuma partida cadastrada nesta rodada.",
  items,
  onPressItem,
  compact = false,
}: HistoricCupGridProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 768 ? 48 : 72;
  const availableWidth = Math.max(width - horizontalPadding, 100);
  const shouldLockEightMatchLayout = !compact && items.length === 8;

  const preferredCardWidth = useMemo(() => {
    return width < 768 ? Math.max(Math.min(width - 48, 360), 272) : 272;
  }, [width]);

  const columns = useMemo(() => {
    const rawColumns = Math.max(1, Math.floor((availableWidth + 16) / (preferredCardWidth + 16)));
    return shouldLockEightMatchLayout ? Math.min(rawColumns, 4) : rawColumns;
  }, [availableWidth, preferredCardWidth, shouldLockEightMatchLayout]);

  const gridWidth = useMemo(() => {
    if (columns <= 1) return "100%";
    const exactWidth = columns * preferredCardWidth + (columns - 1) * 16;
    return Math.min(exactWidth, availableWidth);
  }, [availableWidth, columns, preferredCardWidth]);

  if (!items.length) {
    return (
      <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 14 }}>
        {emptyLabel}
      </Text>
    );
  }

  // Compact: 2-column flex rows that fill all available width without clipping
  if (compact) {
    const rows: HistoricCupItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      rows.push(items.slice(i, i + 2));
    }
    return (
      <View style={{ width: "100%", gap: 12 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: "row", gap: 10 }}>
            {row.map((item) => (
              <View key={item.id} style={{ flex: 1, minWidth: 0 }}>
                <HistoricCupCard item={item} compact onPress={onPressItem ? () => onPressItem(item) : undefined} />
              </View>
            ))}
            {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={{
        width: gridWidth,
        maxWidth: "100%",
        alignSelf: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        justifyContent: "center",
      }}
    >
      {items.map((item) => (
        <View
          key={item.id}
          style={{ width: columns === 1 ? "100%" : preferredCardWidth }}
        >
          <HistoricCupCard item={item} onPress={onPressItem ? () => onPressItem(item) : undefined} />
        </View>
      ))}
    </View>
  );
}
