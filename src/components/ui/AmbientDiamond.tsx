import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Text, useWindowDimensions, View } from "react-native";

const titleLabel = "ARENA";

const shardSpecs = [
  {
    key: "shard-top-right",
    left: 0.69,
    top: 0.22,
    width: 0.16,
    height: 0.042,
    rotate: 58,
    skew: -18,
    fill: "rgba(247,255,250,0.62)",
    border: "rgba(255,255,255,0.12)",
    driftX: 1.2,
    driftY: -0.45,
  },
  {
    key: "shard-right-core",
    left: 0.66,
    top: 0.44,
    width: 0.11,
    height: 0.16,
    rotate: 29,
    skew: -14,
    fill: "rgba(228,255,236,0.48)",
    border: "rgba(255,255,255,0.08)",
    driftX: 0.9,
    driftY: 0.18,
  },
  {
    key: "shard-bottom-right",
    left: 0.6,
    top: 0.7,
    width: 0.12,
    height: 0.07,
    rotate: -18,
    skew: -12,
    fill: "rgba(217,255,229,0.32)",
    border: "rgba(255,255,255,0.08)",
    driftX: 0.72,
    driftY: 0.72,
  },
  {
    key: "shard-bottom-left",
    left: 0.34,
    top: 0.71,
    width: 0.1,
    height: 0.038,
    rotate: -28,
    skew: 10,
    fill: "rgba(201,255,114,0.24)",
    border: "rgba(87,255,124,0.18)",
    driftX: -0.85,
    driftY: 0.82,
  },
  {
    key: "shard-upper-left",
    left: 0.32,
    top: 0.33,
    width: 0.082,
    height: 0.026,
    rotate: -42,
    skew: 14,
    fill: "rgba(255,255,255,0.18)",
    border: "rgba(255,255,255,0.06)",
    driftX: -0.58,
    driftY: -0.42,
  },
  {
    key: "shard-lower-mid",
    left: 0.49,
    top: 0.86,
    width: 0.084,
    height: 0.03,
    rotate: 14,
    skew: -9,
    fill: "rgba(87,255,124,0.22)",
    border: "rgba(87,255,124,0.12)",
    driftX: 0.2,
    driftY: 0.95,
  },
] as const;

const AnimatedText = Animated.Text;

export function AmbientDiamond() {
  const { width, height } = useWindowDimensions();
  const motion = useRef(new Animated.Value(0)).current;
  const [pointerShift, setPointerShift] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [motion]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    function handleMouseMove(event: MouseEvent) {
      const normalizedX = event.clientX / Math.max(width, 1) - 0.5;
      const normalizedY = event.clientY / Math.max(height, 1) - 0.5;

      setPointerShift({
        x: normalizedX * 34,
        y: normalizedY * 24,
      });
    }

    window.addEventListener("mousemove", handleMouseMove);

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [height, width]);

  const size = Math.min(Math.max(width * 0.62, 640), 1080);
  const crystalSize = size * 0.34;
  const titleSize = Math.min(Math.max(size * 0.14, 72), 164);

  const floatY = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-10, 7, -10],
  });

  const crystalRotate = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-3deg", "2deg", "-3deg"],
  });

  const crystalScale = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.985, 1.02, 0.985],
  });

  const textShift = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-3, 4, -3],
  });

  const glowOpacity = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.36, 0.62, 0.36],
  });

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
        width: size,
        height: size,
        opacity: 0.7,
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size * 1.08,
          marginLeft: -(size * 1.08) / 2,
          marginTop: -titleSize * 0.46,
          transform: [{ translateX: pointerShift.x * 0.18 }, { translateY: pointerShift.y * 0.08 }],
        }}
      >
        <AnimatedText
          style={{
            position: "absolute",
            width: "100%",
            textAlign: "center",
            fontSize: titleSize,
            fontWeight: "200",
            letterSpacing: titleSize * 0.06,
            color: "rgba(87,255,124,0.58)",
            transform: [{ translateX: -7 }, { translateX: textShift }],
            fontFamily:
              Platform.OS === "ios"
                ? "Helvetica Neue"
                : Platform.OS === "android"
                  ? "sans-serif-light"
                  : "'Helvetica Neue', 'Segoe UI', sans-serif",
          }}
        >
          {titleLabel}
        </AnimatedText>

        <AnimatedText
          style={{
            position: "absolute",
            width: "100%",
            textAlign: "center",
            fontSize: titleSize,
            fontWeight: "200",
            letterSpacing: titleSize * 0.06,
            color: "rgba(246,250,248,0.9)",
            textShadowColor: "rgba(255,255,255,0.18)",
            textShadowRadius: 12,
            textShadowOffset: { width: 0, height: 0 },
            transform: [{ translateX: pointerShift.x * 0.04 }],
            fontFamily:
              Platform.OS === "ios"
                ? "Helvetica Neue"
                : Platform.OS === "android"
                  ? "sans-serif-light"
                  : "'Helvetica Neue', 'Segoe UI', sans-serif",
          }}
        >
          {titleLabel}
        </AnimatedText>

        <AnimatedText
          style={{
            position: "absolute",
            width: "100%",
            textAlign: "center",
            fontSize: titleSize,
            fontWeight: "200",
            letterSpacing: titleSize * 0.06,
            color: "rgba(220,255,228,0.16)",
            transform: [{ translateX: pointerShift.x * -0.08 + 6 }],
            fontFamily:
              Platform.OS === "ios"
                ? "Helvetica Neue"
                : Platform.OS === "android"
                  ? "sans-serif-light"
                  : "'Helvetica Neue', 'Segoe UI', sans-serif",
          }}
        >
          {titleLabel}
        </AnimatedText>
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          transform: [
            { translateX: pointerShift.x * 0.34 },
            { translateY: pointerShift.y * 0.28 },
            { translateY: floatY },
          ],
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: crystalSize * 1.5,
            height: crystalSize * 1.5,
            marginLeft: -(crystalSize * 1.5) / 2,
            marginTop: -(crystalSize * 1.5) / 2,
            borderWidth: 1,
            borderColor: "rgba(87,255,124,0.08)",
            transform: [{ rotate: "45deg" }, { scale: 1.02 }],
          }}
        />

        <Animated.View
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: crystalSize * 1.04,
            height: crystalSize * 1.04,
            marginLeft: -(crystalSize * 1.04) / 2,
            marginTop: -(crystalSize * 1.04) / 2,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
            transform: [{ rotate: "45deg" }, { scale: 0.9 }],
          }}
        />

        <Animated.View
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: crystalSize,
            height: crystalSize,
            marginLeft: -crystalSize / 2,
            marginTop: -crystalSize / 2,
            transform: [{ rotate: "45deg" }, { rotate: crystalRotate }, { scale: crystalScale }],
            overflow: "hidden",
            borderWidth: 1.2,
            borderColor: "rgba(255,255,255,0.16)",
            backgroundColor: "rgba(255,255,255,0.02)",
            shadowColor: "#E8FFF0",
            shadowOpacity: 0.12,
            shadowRadius: 28,
          }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.06)", "rgba(0,0,0,0)"]}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 1, y: 0.95 }}
            style={{
              position: "absolute",
              left: -crystalSize * 0.04,
              top: -crystalSize * 0.02,
              width: crystalSize * 0.62,
              height: crystalSize * 0.54,
              transform: [{ skewY: "-14deg" }],
            }}
          />

          <LinearGradient
            colors={["rgba(255,255,255,0.18)", "rgba(9,17,12,0.04)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              left: crystalSize * 0.12,
              top: crystalSize * 0.14,
              width: crystalSize * 0.26,
              height: crystalSize * 0.62,
              transform: [{ skewY: "12deg" }],
            }}
          />

          <LinearGradient
            colors={["rgba(238,255,244,0.2)", "rgba(238,255,244,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              right: -crystalSize * 0.06,
              top: crystalSize * 0.12,
              width: crystalSize * 0.38,
              height: crystalSize * 0.42,
              transform: [{ rotate: "12deg" }, { skewY: "-11deg" }],
            }}
          />

          <LinearGradient
            colors={["rgba(255,255,255,0.28)", "rgba(0,0,0,0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: "absolute",
              left: crystalSize * 0.42,
              top: crystalSize * 0.08,
              width: crystalSize * 0.12,
              height: crystalSize * 0.5,
            }}
          />

          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(4,10,6,0.44)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: crystalSize * 0.42,
            }}
          />

          <View
            style={{
              position: "absolute",
              left: "50%",
              top: crystalSize * 0.12,
              bottom: crystalSize * 0.08,
              width: 1,
              marginLeft: -0.5,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          />

          <View
            style={{
              position: "absolute",
              left: crystalSize * 0.14,
              right: crystalSize * 0.14,
              top: "50%",
              height: 1,
              marginTop: -0.5,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
        </Animated.View>

        {shardSpecs.map((shard) => (
          <Animated.View
            key={shard.key}
            style={{
              position: "absolute",
              left: size * shard.left,
              top: size * shard.top,
              width: size * shard.width,
              height: size * shard.height,
              borderRadius: 3,
              borderWidth: 1,
              borderColor: shard.border,
              backgroundColor: shard.fill,
              opacity: shard.key === "shard-right-core" ? glowOpacity : 0.9,
              transform: [
                { translateX: pointerShift.x * shard.driftX },
                { translateY: pointerShift.y * shard.driftY },
                { rotate: `${shard.rotate}deg` },
                { skewX: `${shard.skew}deg` },
              ],
            }}
          />
        ))}

        <Animated.View
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: crystalSize * 0.18,
            height: crystalSize * 0.52,
            marginLeft: crystalSize * 0.01,
            marginTop: -crystalSize * 0.28,
            backgroundColor: "rgba(245,251,247,0.2)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            transform: [
              { translateX: pointerShift.x * 0.6 },
              { translateY: pointerShift.y * -0.4 },
              { rotate: "-26deg" },
              { skewY: "-16deg" },
            ],
            opacity: glowOpacity,
          }}
        />
      </Animated.View>
    </View>
  );
}
