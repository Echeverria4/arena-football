import { Image, Text, View, useWindowDimensions } from "react-native";

import { NeonFrame } from "@/components/ui/NeonFrame";
import type { TitleGalleryItem } from "@/lib/title-gallery";

interface TitleGalleryCardProps {
  item: TitleGalleryItem;
}

export function TitleGalleryCard({ item }: TitleGalleryCardProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 640;
  const isSmallPhone = width < 420;

  const heroHeight = isSmallPhone ? 164 : isPhone ? 188 : 224;
  const imageSize = isSmallPhone ? 82 : isPhone ? 96 : 128;
  const reflectionSize = isSmallPhone ? 58 : isPhone ? 72 : 96;

  return (
    <NeonFrame radius={22} padding={1.5} backgroundColor="#FFFFFF">
      <View
        style={{
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
        }}
      >
        <View
          className="items-center justify-center overflow-hidden"
          style={{
            backgroundColor: "#F8FAFF",
            height: heroHeight,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(59,91,255,0.08)",
            position: "relative",
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 140,
              height: 140,
              borderRadius: 999,
              backgroundColor: "rgba(59,91,255,0.08)",
              top: -28,
              right: -24,
            }}
          />

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 100,
              height: 100,
              borderRadius: 999,
              backgroundColor: "rgba(120,160,255,0.08)",
              bottom: 18,
              left: -20,
            }}
          />

          <Image
            source={{ uri: item.imageUrl }}
            resizeMode="contain"
            style={{ width: imageSize, height: imageSize }}
          />

          <Image
            source={{ uri: item.imageUrl }}
            resizeMode="contain"
            className="absolute bottom-0 opacity-[0.06]"
            style={{
              width: reflectionSize,
              height: reflectionSize,
              transform: [{ scaleY: -1 }],
            }}
          />
        </View>

        <View
          className="items-center gap-2 px-3"
          style={{
            backgroundColor: "#FFFFFF",
            paddingVertical: isPhone ? 12 : 16,
          }}
        >
          <Text
            className="text-center font-medium"
            style={{
              color: "#14213D",
              fontSize: isSmallPhone ? 13 : isPhone ? 14 : 15,
              lineHeight: isSmallPhone ? 18 : 20,
            }}
          >
            {item.title}
          </Text>
        </View>
      </View>
    </NeonFrame>
  );
}
