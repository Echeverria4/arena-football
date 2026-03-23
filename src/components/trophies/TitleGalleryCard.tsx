import { Image, Text, View } from "react-native";

import type { TitleGalleryItem } from "@/lib/title-gallery";

interface TitleGalleryCardProps {
  item: TitleGalleryItem;
}

export function TitleGalleryCard({ item }: TitleGalleryCardProps) {
  return (
    <View
      className="overflow-hidden border"
      style={{
        borderColor: "#CFCFCF",
        backgroundColor: "#F8F8F8",
      }}
    >
      <View
        className="h-56 items-center justify-center overflow-hidden"
        style={{
          backgroundColor: "#FAFAFA",
        }}
      >
        <Image source={{ uri: item.imageUrl }} resizeMode="contain" className="h-32 w-32" />
        <Image
          source={{ uri: item.imageUrl }}
          resizeMode="contain"
          className="absolute bottom-0 h-24 w-24 opacity-[0.06]"
          style={{
            transform: [{ scaleY: -1 }],
          }}
        />
      </View>

      <View
        className="items-center gap-2 border-t px-3 py-4"
        style={{
          borderColor: "#D7D7D7",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Text className="text-center text-[15px] font-medium leading-5 text-[#7A7F87]">
          {item.title}
        </Text>
        <Text className="text-center text-[13px] font-medium leading-5 text-[#A08876]">
          {item.season}
        </Text>
      </View>
    </View>
  );
}
