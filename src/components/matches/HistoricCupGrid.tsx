import { useMemo } from "react";
import { Text, View, useWindowDimensions } from "react-native";

import { HistoricCupCard, type HistoricCupItem } from "@/components/matches/HistoricCupCard";

interface HistoricCupGridProps {
  emptyLabel?: string;
  items: HistoricCupItem[];
  onPressItem?: (item: HistoricCupItem) => void;
}

export function HistoricCupGrid({
  emptyLabel = "Nenhuma partida cadastrada nesta rodada.",
  items,
  onPressItem,
}: HistoricCupGridProps) {
  const { width } = useWindowDimensions();
  const preferredCardWidth = width < 768 ? Math.max(Math.min(width - 48, 360), 272) : 272;
  const horizontalPadding = width < 768 ? 48 : 72;
  const availableWidth = Math.max(width - horizontalPadding, preferredCardWidth);
  const shouldLockEightMatchLayout = items.length === 8;

  const columns = useMemo(() => {
    const rawColumns = Math.max(1, Math.floor((availableWidth + 16) / (preferredCardWidth + 16)));
    return shouldLockEightMatchLayout ? Math.min(rawColumns, 4) : rawColumns;
  }, [availableWidth, preferredCardWidth, shouldLockEightMatchLayout]);

  const gridWidth = useMemo(() => {
    if (columns <= 1) {
      return "100%";
    }

    const exactWidth = columns * preferredCardWidth + (columns - 1) * 16;
    return Math.min(exactWidth, availableWidth);
  }, [availableWidth, columns, preferredCardWidth]);

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
        gap: 16,
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
