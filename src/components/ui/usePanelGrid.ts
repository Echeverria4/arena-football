import { useWindowDimensions, type DimensionValue } from "react-native";

export function usePanelGrid() {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const isSmallPhone = width < 420;
  const columns = width >= 1200 ? 3 : 2;
  const gap = isSmallPhone ? 12 : isPhone ? 14 : 20;
  const horizontalPadding = isSmallPhone ? 16 : isPhone ? 24 : 48;
  const contentMaxWidth = 1440;
  const innerPadding = isSmallPhone ? 8 : 16;
  const contentWidth = Math.min(width - horizontalPadding * 2, contentMaxWidth);
  const availableWidth = Math.max(
    contentWidth - innerPadding * 2 - gap * (columns - 1),
    isSmallPhone ? 260 : 300,
  );
  // Always a pixel value so all cards in a flex-row wrap get identical widths
  const cardWidth: DimensionValue = Math.floor(availableWidth / columns);

  return {
    cardWidth,
    contentMaxWidth,
    gap,
    horizontalPadding,
    isPhone,
    isSmallPhone,
  };
}
