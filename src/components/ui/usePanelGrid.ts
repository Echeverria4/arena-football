import { useWindowDimensions } from "react-native";

export function usePanelGrid() {
  const { width } = useWindowDimensions();
  const columns = width >= 920 ? 2 : 1;
  const gap = 20;
  const horizontalPadding = 48;
  const contentMaxWidth = 1440;
  const innerPadding = 16;
  const contentWidth = Math.min(width - horizontalPadding, contentMaxWidth);
  const availableWidth = Math.max(
    contentWidth - innerPadding * 2 - gap * (columns - 1),
    320,
  );
  const cardWidth = columns === 1 ? "100%" : Math.floor(availableWidth / columns);

  return {
    cardWidth,
    contentMaxWidth,
    gap,
  };
}
