import type { ReactNode } from "react";
import { Platform, ScrollView, View } from "react-native";

interface ScrollRowProps {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ScrollRow({ children, className = "", contentClassName = "" }: ScrollRowProps) {
  return (
    <ScrollView
      horizontal
      className={className}
      contentContainerStyle={{ paddingRight: 8 }}
      showsHorizontalScrollIndicator
      showsVerticalScrollIndicator={false}
      style={
        Platform.OS === "web"
          ? {
              overflowX: "auto",
              overflowY: "hidden",
            }
          : undefined
      }
    >
      <View className={`flex-row gap-2 ${contentClassName}`.trim()}>{children}</View>
    </ScrollView>
  );
}
