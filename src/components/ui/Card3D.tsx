import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type DimensionValue,
  type ImageSourcePropType,
  type LayoutChangeEvent,
} from "react-native";

interface Card3DProps {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: string;
  accent?: "blue" | "gold" | "crimson" | "obsidian";
  ambientSurface?: boolean;
  width?: DimensionValue;
  minHeight?: number;
  imageSource?: ImageSourcePropType;
  floatingNode?: ReactNode;
  heroNode?: ReactNode;
  footerLeft?: string;
  footerRight?: string;
  hideHeroPanel?: boolean;
  content?: ReactNode;
  children?: ReactNode;
  onPress?: () => void;
}

const accentPalette = {
  blue: {
    edge: ["#D6E6FF", "#BDD6FF", "#F8FBFF"],
    frame: "rgba(88,128,255,0.22)",
    glow: "rgba(96,130,255,0.18)",
    shadow: "#4B74FF",
    title: "#16305B",
    text: "#5B7297",
    eyebrow: "#5678C9",
    badgeBg: "#E9F0FF",
    badgeText: "#335BBC",
    footer: "#6B7EA3",
  },
  gold: {
    edge: ["#FFF7E3", "#FCE8B2", "#FFFDF6"],
    frame: "rgba(255,198,74,0.24)",
    glow: "rgba(255,198,74,0.18)",
    shadow: "#D9A723",
    title: "#4D3410",
    text: "#8C6E3B",
    eyebrow: "#B6841F",
    badgeBg: "#FFF0C2",
    badgeText: "#8A5B00",
    footer: "#9B7F45",
  },
  crimson: {
    edge: ["#FFF0F1", "#FFD5D9", "#FFF8F8"],
    frame: "rgba(212,79,98,0.22)",
    glow: "rgba(212,79,98,0.18)",
    shadow: "#D44F62",
    title: "#5D1E2A",
    text: "#8C5660",
    eyebrow: "#B44A5A",
    badgeBg: "#FFE1E5",
    badgeText: "#A33146",
    footer: "#94616A",
  },
  obsidian: {
    edge: ["#1C1F2B", "#242B3B", "#121620"],
    frame: "rgba(106,136,255,0.18)",
    glow: "rgba(106,136,255,0.18)",
    shadow: "#3658E8",
    title: "#F4F7FF",
    text: "#AEBBDA",
    eyebrow: "#9AB8FF",
    badgeBg: "rgba(255,255,255,0.08)",
    badgeText: "#E0E8FF",
    footer: "#8FA1C8",
  },
} as const;

export function Card3D({
  title,
  subtitle,
  eyebrow,
  badge,
  accent = "blue",
  ambientSurface = false,
  width = "100%",
  minHeight,
  imageSource,
  floatingNode,
  heroNode,
  footerLeft,
  footerRight,
  hideHeroPanel = false,
  content,
  children,
  onPress,
}: Card3DProps) {
  const { width: viewportWidth } = useWindowDimensions();
  const isPhone = viewportWidth < 768;
  const isSmallPhone = viewportWidth < 420;
  const palette = accentPalette[accent];
  const useAmbientSurface = ambientSurface && accent !== "obsidian";
  const [cardSize, setCardSize] = useState({ width: 260, height: 360 });

  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const shadowPulse = useRef(new Animated.Value(0.65)).current;
  const glowX = useRef(new Animated.Value(0)).current;
  const glowY = useRef(new Animated.Value(0)).current;

  const cardHeight = minHeight ?? (isSmallPhone ? 360 : isPhone ? 390 : 430);
  const heroHeight = isSmallPhone ? 164 : isPhone ? 188 : 220;
  const imageHeight = heroHeight + 36;
  const cardEdgeColors: readonly [string, string, string] = useAmbientSurface
    ? ["rgba(155,183,255,0.18)", "rgba(89,123,228,0.1)", "rgba(255,255,255,0.02)"]
    : palette.edge;
  const cardSurfaceColors: readonly [string, string, string] =
    accent === "obsidian"
      ? ["#121827", "#1A2234", "#141B2A"]
      : useAmbientSurface
        ? ["rgba(11,18,34,0.86)", "rgba(9,17,31,0.8)", "rgba(7,13,24,0.88)"]
        : ["#FFFFFF", "#F8FBFF", "#F5F8FF"];
  const titleColor = useAmbientSurface ? "#F3F7FF" : palette.title;
  const textColor = useAmbientSurface ? "#AEBBDA" : palette.text;
  const footerColor = useAmbientSurface ? "#8FA1C8" : palette.footer;
  const ambientGlowOpacity = useAmbientSurface ? 0.12 : 0.55;
  const cornerBeamOpacity = 0;
  const shadowOpacity = accent === "obsidian" ? 0.3 : useAmbientSurface ? 0.08 : 0.16;

  const rotateXStyle = useMemo(
    () =>
      rotateX.interpolate({
        inputRange: [-16, 16],
        outputRange: ["-16deg", "16deg"],
      }),
    [rotateX],
  );

  const rotateYStyle = useMemo(
    () =>
      rotateY.interpolate({
        inputRange: [-16, 16],
        outputRange: ["-16deg", "16deg"],
      }),
    [rotateY],
  );

  const glowTranslateX = glowX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-cardSize.width * 0.24, cardSize.width * 0.24],
  });

  const glowTranslateY = glowY.interpolate({
    inputRange: [-1, 1],
    outputRange: [-cardSize.height * 0.22, cardSize.height * 0.22],
  });

  function handleLayout(event: LayoutChangeEvent) {
    const { width: measuredWidth, height: measuredHeight } = event.nativeEvent.layout;
    if (measuredWidth && measuredHeight) {
      setCardSize({ width: measuredWidth, height: measuredHeight });
    }
  }

  function animateToCenter() {
    Animated.parallel([
      Animated.spring(rotateX, {
        toValue: 0,
        damping: 16,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.spring(rotateY, {
        toValue: 0,
        damping: 16,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 16,
        stiffness: 140,
        useNativeDriver: true,
      }),
      Animated.spring(glowX, {
        toValue: 0,
        damping: 16,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.spring(glowY, {
        toValue: 0,
        damping: 16,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handlePointerMove(event: {
    nativeEvent: { locationX: number; locationY: number };
  }) {
    const { locationX, locationY } = event.nativeEvent;
    const normalizedX = (locationX / Math.max(cardSize.width, 1) - 0.5) * 2;
    const normalizedY = (locationY / Math.max(cardSize.height, 1) - 0.5) * 2;

    Animated.parallel([
      Animated.spring(rotateX, {
        toValue: -normalizedY * 10,
        damping: 18,
        stiffness: 140,
        useNativeDriver: true,
      }),
      Animated.spring(rotateY, {
        toValue: normalizedX * 10,
        damping: 18,
        stiffness: 140,
        useNativeDriver: true,
      }),
      Animated.spring(glowX, {
        toValue: normalizedX,
        damping: 18,
        stiffness: 140,
        useNativeDriver: true,
      }),
      Animated.spring(glowY, {
        toValue: normalizedY,
        damping: 18,
        stiffness: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handleHoverIn() {
    Animated.spring(scale, {
      toValue: 1.025,
      damping: 16,
      stiffness: 130,
      useNativeDriver: true,
    }).start();
  }

  return (
    <View
      style={{
        width,
        transform: [{ perspective: 1200 }],
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        onHoverIn={handleHoverIn}
        onHoverOut={animateToCenter}
        onPressIn={handleHoverIn}
        onPressOut={animateToCenter}
        onResponderMove={handlePointerMove}
        onResponderRelease={animateToCenter}
        onStartShouldSetResponder={() => true}
        onTouchMove={handlePointerMove}
        onTouchEnd={animateToCenter}
        className="active:opacity-95"
      >
        <Animated.View
          onLayout={handleLayout}
          style={{
            minHeight: cardHeight,
            transform: [
              { scale },
              { rotateX: rotateXStyle },
              { rotateY: rotateYStyle },
            ],
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              right: 12,
              bottom: 12,
              borderRadius: 34,
              backgroundColor: palette.glow,
              opacity: shadowPulse,
              transform: [{ scale: 1.05 }],
            }}
          />

          <LinearGradient
            colors={cardEdgeColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 30,
              padding: 1.5,
              shadowColor: palette.shadow,
              shadowOpacity,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 16 },
              elevation: 10,
            }}
          >
            <LinearGradient
              colors={cardSurfaceColors}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={{
                minHeight: cardHeight,
                borderRadius: 28,
                overflow: "hidden",
                position: "relative",
                borderWidth: 1,
                borderColor: palette.frame,
              }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: cardSize.height * 0.08,
                  left: cardSize.width * 0.34,
                  width: 220,
                  height: 220,
                  borderRadius: 999,
                  backgroundColor: palette.glow,
                  opacity: ambientGlowOpacity,
                  transform: [{ translateX: glowTranslateX }, { translateY: glowTranslateY }],
                }}
              />

              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: -36,
                  right: -24,
                  width: 140,
                  height: 140,
                  borderRadius: 999,
                  backgroundColor: palette.glow,
                  opacity: cornerBeamOpacity,
                }}
              />

              <View
                className="justify-between"
                style={{
                  minHeight: cardHeight,
                  paddingHorizontal: isSmallPhone ? 16 : 20,
                  paddingTop: isSmallPhone ? 16 : 18,
                  paddingBottom: isSmallPhone ? 16 : 18,
                }}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    {eyebrow ? (
                      <Text
                        style={{
                          color: palette.eyebrow,
                          fontSize: isSmallPhone ? 11 : 12,
                          fontWeight: "700",
                          letterSpacing: isSmallPhone ? 1.8 : 2.4,
                          textTransform: "uppercase",
                        }}
                      >
                        {eyebrow}
                      </Text>
                    ) : null}
                  </View>

                  {badge ? (
                    <View
                      style={{
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: palette.badgeBg,
                        borderWidth: 1,
                        borderColor: palette.frame,
                      }}
                    >
                      <Text
                        style={{
                          color: palette.badgeText,
                          fontSize: 11,
                          fontWeight: "700",
                          letterSpacing: 1.4,
                          textTransform: "uppercase",
                        }}
                      >
                        {badge}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {!hideHeroPanel ? (
                  <View
                    className="items-center justify-center"
                    style={{
                      height: heroHeight,
                      marginTop: 8,
                      marginBottom: 12,
                      borderRadius: 22,
                      overflow: "visible",
                      position: "relative",
                    }}
                  >
                    {heroNode ? (
                      heroNode
                    ) : imageSource ? (
                      <Image
                        source={imageSource}
                        resizeMode="cover"
                        style={{
                          width: "100%",
                          height: imageHeight,
                          borderRadius: 24,
                        }}
                      />
                    ) : (
                      <LinearGradient
                        colors={
                          accent === "gold"
                            ? ["#FFF3CF", "#FFE7A1", "#FFF8E3"]
                            : accent === "crimson"
                              ? ["#FFE8EB", "#FFD0D6", "#FFF4F5"]
                              : accent === "obsidian"
                                ? ["#1C2232", "#263248", "#151A27"]
                                : ["#EDF4FF", "#D7E7FF", "#F9FBFF"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: "100%",
                          height: heroHeight,
                          borderRadius: 24,
                          borderWidth: 1,
                          borderColor: palette.frame,
                        }}
                      />
                    )}

                    {floatingNode ? (
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          bottom: -18,
                          right: isSmallPhone ? 10 : 16,
                        }}
                      >
                        {floatingNode}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View className="gap-2">
                  {title ? (
                    <Text
                      style={{
                        color: titleColor,
                        fontSize: isSmallPhone ? 18 : isPhone ? 20 : 22,
                        fontWeight: "800",
                      }}
                    >
                      {title}
                    </Text>
                  ) : null}

                  {subtitle ? (
                    <Text
                      style={{
                        color: textColor,
                        fontSize: isSmallPhone ? 14 : 15,
                        lineHeight: isSmallPhone ? 22 : 24,
                      }}
                    >
                      {subtitle}
                    </Text>
                  ) : null}

                  {content}
                  {children}
                </View>

                {footerLeft || footerRight ? (
                  <View className="mt-5 flex-row items-center justify-between">
                    <Text
                      style={{
                        color: footerColor,
                        fontSize: 12,
                        fontWeight: "700",
                        letterSpacing: 1.4,
                        textTransform: "uppercase",
                      }}
                    >
                      {footerLeft ?? ""}
                    </Text>

                    <Text
                      style={{
                        color: footerColor,
                        fontSize: 12,
                        fontWeight: "700",
                        letterSpacing: 1.4,
                        textTransform: "uppercase",
                      }}
                    >
                      {footerRight ?? ""}
                    </Text>
                  </View>
                ) : null}
              </View>
            </LinearGradient>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
}
