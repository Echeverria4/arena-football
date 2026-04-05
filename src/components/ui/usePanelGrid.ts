import { useWindowDimensions, type DimensionValue } from "react-native";

export function usePanelGrid() {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const isSmallPhone = width < 420;
  const columns = width >= 980 ? 2 : 1;
  const gap = isPhone ? 16 : 20;
  const horizontalPadding = isSmallPhone ? 24 : isPhone ? 32 : 48;
  const contentMaxWidth = 1440;
  const innerPadding = isSmallPhone ? 8 : 16;
  const contentWidth = Math.min(width - horizontalPadding, contentMaxWidth);
  const availableWidth = Math.max(
    contentWidth - innerPadding * 2 - gap * (columns - 1),
    isSmallPhone ? 272 : 320,
  );
  const cardWidth: DimensionValue = columns === 1 ? "100%" : Math.floor(availableWidth / columns);

  return {
    cardWidth,
    contentMaxWidth,
    gap,
    horizontalPadding,
    isPhone,
    isSmallPhone,
  };
}
