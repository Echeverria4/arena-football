import type { ReactNode } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  View,
  useWindowDimensions,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";

import { NeonGrid } from "@/components/boot/NeonGrid";
import { AmbientDiamond } from "@/components/ui/AmbientDiamond";

type ScreenProps = ViewProps & {
  ambientDiamond?: boolean;
  children?: ReactNode;
  backgroundVariant?: "none" | "soft" | "hero";
  className?: string;
  overlay?: ReactNode;
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
};

export function Screen({
  ambientDiamond = false,
  backgroundVariant = "hero",
  children,
  overlay,
  scroll,
  scrollProps,
  className = "",
  style,
  ...rest
}: ScreenProps) {
  const { width } = useWindowDimensions();
  const contentClassName = (backgroundVariant === "none" ? `flex-1 ${className}` : `flex-1 bg-arena-bg ${className}`).trim();
  const isHorizontal = Boolean(scrollProps?.horizontal);
  const baseBottomPadding = isHorizontal ? 16 : width < 420 ? 108 : width < 768 ? 118 : 132;
  const baseScreenStyle =
    Platform.OS === "web"
      ? ({ flex: 1, width: "100%" as const, minHeight: "100vh" as never } as const)
      : ({ flex: 1, minHeight: 0 } as const);
  const webVerticalScrollStyle =
    Platform.OS === "web" && !isHorizontal
      ? {
          flex: 1,
          width: "100%" as const,
          minHeight: "100vh" as never,
          overflowX: "hidden" as const,
          overflowY: "scroll" as const,
          scrollbarGutter: "stable" as never,
        }
      : undefined;
  const webScrollStyle =
    Platform.OS === "web"
      ? {
          overflowX: isHorizontal ? ("auto" as const) : ("hidden" as const),
          overflowY: isHorizontal ? ("hidden" as const) : ("scroll" as const),
          scrollbarGutter: "stable" as never,
        }
      : undefined;

  if (scroll) {
    if (Platform.OS === "web" && !isHorizontal) {
      return (
        <SafeAreaView className={contentClassName} style={[baseScreenStyle, style]} {...rest}>
          {backgroundVariant === "none" ? null : <NeonGrid variant={backgroundVariant} />}
          {backgroundVariant === "none" || !ambientDiamond ? null : <AmbientDiamond />}
          <View style={[webVerticalScrollStyle, scrollProps?.style]}>
            <View
              style={[
                { paddingBottom: baseBottomPadding, flexGrow: 1 },
                scrollProps?.contentContainerStyle,
              ]}
            >
              {children}
            </View>
          </View>
          {overlay}
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className={contentClassName} style={[baseScreenStyle, style]} {...rest}>
        {backgroundVariant === "none" ? null : <NeonGrid variant={backgroundVariant} />}
        {backgroundVariant === "none" || !ambientDiamond ? null : <AmbientDiamond />}
        <ScrollView
          style={[{ flex: 1, minHeight: 0, height: "100%" as never }, webScrollStyle, scrollProps?.style]}
          contentContainerStyle={[
            { paddingBottom: baseBottomPadding, flexGrow: 1 },
            scrollProps?.contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={scrollProps?.showsVerticalScrollIndicator ?? !isHorizontal}
          showsHorizontalScrollIndicator={scrollProps?.showsHorizontalScrollIndicator ?? isHorizontal}
          {...scrollProps}
        >
          {children}
        </ScrollView>
        {overlay}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={contentClassName} style={[baseScreenStyle, style]} {...rest}>
      {backgroundVariant === "none" ? null : <NeonGrid variant={backgroundVariant} />}
      {backgroundVariant === "none" || !ambientDiamond ? null : <AmbientDiamond />}
      {children}
      {overlay}
    </SafeAreaView>
  );
}
