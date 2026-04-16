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
    if (compact) return Math.floor((availableWidth - 12) / 2);
    return width < 768 ? Math.max(Math.min(width - 48, 360), 272) : 272;
  }, [compact, availableWidth, width]);

  const columns = useMemo(() => {
    if (compact) return Math.min(2, items.length > 0 ? 2 : 1);
    const rawColumns = Math.max(1, Math.floor((availableWidth + 16) / (preferredCardWidth + 16)));
    return shouldLockEightMatchLayout ? Math.min(rawColumns, 4) : rawColumns;
  }, [compact, items.length, availableWidth, preferredCardWidth, shouldLockEightMatchLayout]);

  const gridWidth = useMemo(() => {
    if (columns <= 1) {
      return "100%";
    }

    const exactWidth = columns * preferredCardWidth + (columns - 1) * (compact ? 12 : 16);
    return Math.min(exactWidth, availableWidth);
  }, [availableWidth, columns, preferredCardWidth, compact]);

  if (!items.length) {
    return (
      <Text
        style={{
          color: "rgba(255,255,255,0.72)",
          fontSize: 14,
        }}
      >
        {emptyLabel}
      </Text>
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
        gap: compact ? 12 : 16,
        justifyContent: "center",
      }}
    >
      {items.map((item) => (
        <View
          key={item.id}
          style={{
            width: columns === 1 ? "100%" : preferredCardWidth,
          }}
        >
          <HistoricCupCard item={item} onPress={onPressItem ? () => onPressItem(item) : undefined} />
        </View>
      ))}
    </View>
  );
}
