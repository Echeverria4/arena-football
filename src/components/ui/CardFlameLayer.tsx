import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

type FlameTone = "gold" | "silver" | "bronze";

type CardFlameLayerProps = {
  tone: FlameTone;
  compact?: boolean;
  intensity?: "balanced" | "wild";
};

// Shared animation values passed down — no per-element loops
type SharedAnims = {
  riseA: Animated.Value; // primary rise, ~2500ms
  riseB: Animated.Value; // secondary rise, ~2700ms (inverted phase)
  sway: Animated.Value;  // horizontal sway, ~1600ms
  pulse: Animated.Value; // scale pulse, ~1900ms
  drift: Animated.Value; // spark drift, ~2100ms
};

type FireBlobProps = {
  left?: number;
  right?: number;
  bottom: number;
  width: number;
  height: number;
  riseAnim: Animated.Value;
  swayAnim: Animated.Value;
  pulseAnim: Animated.Value;
  riseScale?: number;
  swayInvert?: boolean;
};

type FlameTongueProps = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  width: number;
  height: number;
  riseAnim: Animated.Value;
  swayAnim: Animated.Value;
  rotationRange: [string, string];
  reverse?: boolean;
  riseScale?: number;
};

type SparkProps = {
  left: string;
  compact: boolean;
  emberColor: string;
  driftAnim: Animated.Value;
  driftInvert?: boolean;
};

const tonePalette = {
  gold: {
    rim: "rgba(255, 198, 96, 0.42)",
    outerGlow: "rgba(255, 126, 26, 0.20)",
    ember: "rgba(255, 226, 160, 0.38)",
  },
  silver: {
    rim: "rgba(216, 233, 255, 0.34)",
    outerGlow: "rgba(255, 132, 38, 0.18)",
    ember: "rgba(236, 244, 255, 0.34)",
  },
  bronze: {
    rim: "rgba(236, 176, 122, 0.36)",
    outerGlow: "rgba(255, 118, 30, 0.18)",
    ember: "rgba(255, 228, 192, 0.34)",
  },
} as const;

const fireGradient = [
  "rgba(255, 80, 0, 0.00)",
  "rgba(255, 88, 0, 0.34)",
  "rgba(255, 129, 18, 0.70)",
  "rgba(255, 191, 72, 0.90)",
  "rgba(255, 245, 188, 0.98)",
] as const;

const reverseFireGradient = [...fireGradient].reverse() as [string, string, ...string[]];

function FireBlob({
  left,
  right,
  bottom,
  width,
  height,
  riseAnim,
  swayAnim,
  pulseAnim,
  riseScale = 1,
  swayInvert = false,
}: FireBlobProps) {
  const travel = height * 0.42 * riseScale;
  const mid = height * 0.18 * riseScale;

  const translateY = riseAnim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, -mid, -travel],
  });
  const translateX = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: swayInvert ? [8, -8] : [-8, 8],
  });
  const rotate = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: swayInvert ? ["7deg", "-8deg"] : ["-7deg", "8deg"],
  });
  const opacity = riseAnim.interpolate({
    inputRange: [0, 0.2, 0.76, 1],
    outputRange: [0.16, 0.74, 0.9, 0.08],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left,
        right,
        bottom,
        width,
        height,
        opacity,
        transform: [{ translateX }, { translateY }, { scaleX: pulseAnim }, { scaleY: pulseAnim }, { rotate }],
      }}
    >
      <LinearGradient
        colors={fireGradient}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1, borderRadius: 999 }}
      />
    </Animated.View>
  );
}

function FlameTongue({
  left,
  right,
  top,
  bottom,
  width,
  height,
  riseAnim,
  swayAnim,
  rotationRange,
  reverse = false,
  riseScale = 1,
}: FlameTongueProps) {
  const travel = reverse ? 10 * riseScale : -12 * riseScale;

  const rotate = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: rotationRange,
  });
  const translateY = riseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travel],
  });
  const opacity = riseAnim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.48, 0.86, 0.7],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left,
        right,
        top,
        bottom,
        width,
        height,
        opacity,
        transform: [{ translateY }, { rotate }],
      }}
    >
      <LinearGradient
        colors={reverse ? reverseFireGradient : fireGradient}
        start={{ x: 0.5, y: reverse ? 0 : 1 }}
        end={{ x: 0.5, y: reverse ? 1 : 0 }}
        style={{ flex: 1, borderRadius: 999 }}
      />
    </Animated.View>
  );
}

function Spark({ left, compact, emberColor, driftAnim, driftInvert = false }: SparkProps) {
  const maxY = compact ? -62 : -86;
  const maxX = compact ? 14 : 22;

  const translateY = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxY],
  });
  const translateX = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, driftInvert ? -maxX : maxX],
  });
  const opacity = driftAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.9, 0],
  });
  const scale = driftAnim.interpolate({
    inputRange: [0, 0.48, 1],
    outputRange: [0.5, 1.1, 0.46],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: left as any,
        bottom: compact ? 14 : 20,
        width: compact ? 4 : 5,
        height: compact ? 4 : 5,
        borderRadius: 999,
        backgroundColor: emberColor,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

export function CardFlameLayer({
  tone,
  compact = false,
  intensity = "balanced",
}: CardFlameLayerProps) {
  const palette = tonePalette[tone];
  const baseInset = compact ? -10 : -14;
  const isWild = intensity === "wild";

  // 4 shared loops instead of 25+ per-element loops
  const riseA = useRef(new Animated.Value(0)).current;
  const riseB = useRef(new Animated.Value(0.5)).current; // offset phase
  const sway = useRef(new Animated.Value(-1)).current;
  const pulse = useRef(new Animated.Value(0.92)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const riseLoopA = Animated.loop(
      Animated.sequence([
        Animated.timing(riseA, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(riseA, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );

    const riseLoopB = Animated.loop(
      Animated.sequence([
        Animated.timing(riseB, {
          toValue: 1,
          duration: 2700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(riseB, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );

    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: compact ? 1800 : 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(drift, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );

    riseLoopA.start();
    riseLoopB.start();
    swayLoop.start();
    pulseLoop.start();
    driftLoop.start();

    return () => {
      riseLoopA.stop();
      riseLoopB.stop();
      swayLoop.stop();
      pulseLoop.stop();
      driftLoop.stop();
    };
  }, [compact, drift, pulse, riseA, riseB, sway]);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: baseInset,
        right: baseInset,
        bottom: baseInset,
        left: baseInset,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: compact ? 8 : 12,
          left: compact ? 8 : 12,
          right: compact ? 8 : 12,
          bottom: compact ? 8 : 12,
          borderRadius: compact ? 20 : 26,
          borderWidth: 1,
          borderColor: palette.rim,
          opacity: 0.74,
        }}
      />

      <View
        style={{
          position: "absolute",
          top: compact ? 4 : 6,
          left: compact ? 4 : 6,
          right: compact ? 4 : 6,
          bottom: compact ? 4 : 6,
          borderRadius: compact ? 22 : 28,
          backgroundColor: palette.outerGlow,
          opacity: 0.28,
        }}
      />

      <View
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          bottom: compact ? 0 : 4,
          height: compact ? 74 : 96,
          borderRadius: 999,
          backgroundColor: palette.outerGlow,
          opacity: 0.9,
        }}
      />

      <View
        style={{
          position: "absolute",
          left: compact ? -18 : -28,
          bottom: compact ? 18 : 28,
          width: compact ? 38 : 54,
          height: compact ? 112 : 164,
          borderRadius: 999,
          backgroundColor: palette.outerGlow,
          opacity: isWild ? 0.64 : 0.34,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: compact ? -18 : -28,
          bottom: compact ? 22 : 34,
          width: compact ? 38 : 54,
          height: compact ? 118 : 172,
          borderRadius: 999,
          backgroundColor: palette.outerGlow,
          opacity: isWild ? 0.68 : 0.34,
        }}
      />

      <LinearGradient
        colors={["rgba(255,120,12,0.00)", "rgba(255,98,0,0.16)", "rgba(255,168,60,0.24)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          left: "10%",
          right: "10%",
          bottom: compact ? 6 : 8,
          height: compact ? "34%" : "38%",
          borderRadius: 999,
        }}
      />

      <FireBlob
        left={compact ? 8 : 12}
        bottom={compact ? -2 : 0}
        width={compact ? 58 : 74}
        height={compact ? 112 : 142}
        riseAnim={riseA}
        swayAnim={sway}
        pulseAnim={pulse}
        riseScale={0.9}
      />
      <FireBlob
        left={compact ? 46 : 62}
        bottom={compact ? -10 : -8}
        width={compact ? 78 : 104}
        height={compact ? 142 : 184}
        riseAnim={riseB}
        swayAnim={sway}
        pulseAnim={pulse}
        riseScale={1.08}
        swayInvert
      />
      <FireBlob
        right={compact ? 10 : 14}
        bottom={compact ? -4 : -2}
        width={compact ? 62 : 82}
        height={compact ? 122 : 154}
        riseAnim={riseA}
        swayAnim={sway}
        pulseAnim={pulse}
        riseScale={0.96}
        swayInvert
      />
      {isWild ? (
        <>
          <FireBlob
            left={compact ? 20 : 28}
            bottom={compact ? 10 : 14}
            width={compact ? 44 : 58}
            height={compact ? 98 : 132}
            riseAnim={riseB}
            swayAnim={sway}
            pulseAnim={pulse}
            riseScale={0.82}
          />
          <FireBlob
            right={compact ? 20 : 30}
            bottom={compact ? 8 : 12}
            width={compact ? 46 : 60}
            height={compact ? 102 : 138}
            riseAnim={riseA}
            swayAnim={sway}
            pulseAnim={pulse}
            riseScale={0.86}
            swayInvert
          />
        </>
      ) : null}

      <FlameTongue
        left={-2}
        bottom={compact ? 18 : 24}
        width={compact ? 20 : 26}
        height={compact ? 74 : 92}
        riseAnim={riseA}
        swayAnim={sway}
        rotationRange={["-18deg", "9deg"]}
        riseScale={0.9}
      />
      <FlameTongue
        right={-2}
        bottom={compact ? 18 : 26}
        width={compact ? 20 : 26}
        height={compact ? 80 : 98}
        riseAnim={riseB}
        swayAnim={sway}
        rotationRange={["18deg", "-8deg"]}
        riseScale={0.95}
      />
      <FlameTongue
        left={compact ? 24 : 32}
        top={-2}
        width={compact ? 18 : 22}
        height={compact ? 42 : 52}
        riseAnim={riseA}
        swayAnim={sway}
        rotationRange={["-12deg", "8deg"]}
        reverse
        riseScale={0.85}
      />
      <FlameTongue
        right={compact ? 24 : 34}
        top={-2}
        width={compact ? 18 : 22}
        height={compact ? 42 : 52}
        riseAnim={riseB}
        swayAnim={sway}
        rotationRange={["12deg", "-10deg"]}
        reverse
        riseScale={0.88}
      />
      <FlameTongue
        left={compact ? 28 : 36}
        bottom={compact ? -6 : -10}
        width={compact ? 24 : 30}
        height={compact ? 66 : 82}
        riseAnim={riseA}
        swayAnim={sway}
        rotationRange={["-6deg", "12deg"]}
        riseScale={1.0}
      />
      <FlameTongue
        right={compact ? 30 : 40}
        bottom={compact ? -6 : -10}
        width={compact ? 24 : 30}
        height={compact ? 66 : 82}
        riseAnim={riseB}
        swayAnim={sway}
        rotationRange={["8deg", "-12deg"]}
        riseScale={1.02}
      />
      {isWild ? (
        <>
          <FlameTongue
            left={compact ? -8 : -12}
            bottom={compact ? 72 : 88}
            width={compact ? 18 : 22}
            height={compact ? 58 : 86}
            riseAnim={riseA}
            swayAnim={sway}
            rotationRange={["-24deg", "14deg"]}
            riseScale={1.1}
          />
          <FlameTongue
            right={compact ? -8 : -12}
            bottom={compact ? 70 : 90}
            width={compact ? 18 : 22}
            height={compact ? 64 : 92}
            riseAnim={riseB}
            swayAnim={sway}
            rotationRange={["24deg", "-14deg"]}
            riseScale={1.12}
          />
          <FlameTongue
            left={compact ? 46 : 64}
            top={compact ? -6 : -8}
            width={compact ? 14 : 18}
            height={compact ? 34 : 42}
            riseAnim={riseA}
            swayAnim={sway}
            rotationRange={["-16deg", "10deg"]}
            reverse
            riseScale={0.78}
          />
          <FlameTongue
            right={compact ? 48 : 66}
            top={compact ? -6 : -8}
            width={compact ? 14 : 18}
            height={compact ? 34 : 42}
            riseAnim={riseB}
            swayAnim={sway}
            rotationRange={["16deg", "-10deg"]}
            reverse
            riseScale={0.8}
          />
        </>
      ) : null}

      <Spark left="18%" compact={compact} emberColor={palette.ember} driftAnim={drift} />
      <Spark left="34%" compact={compact} emberColor={palette.ember} driftAnim={drift} driftInvert />
      <Spark left="58%" compact={compact} emberColor={palette.ember} driftAnim={drift} />
      <Spark left="74%" compact={compact} emberColor={palette.ember} driftAnim={drift} driftInvert />
      {isWild ? (
        <>
          <Spark left="12%" compact={compact} emberColor={palette.ember} driftAnim={drift} driftInvert />
          <Spark left="24%" compact={compact} emberColor={palette.ember} driftAnim={drift} />
          <Spark left="42%" compact={compact} emberColor={palette.ember} driftAnim={drift} driftInvert />
          <Spark left="50%" compact={compact} emberColor={palette.ember} driftAnim={drift} />
          <Spark left="66%" compact={compact} emberColor={palette.ember} driftAnim={drift} driftInvert />
          <Spark left="82%" compact={compact} emberColor={palette.ember} driftAnim={drift} />
        </>
      ) : null}
    </View>
  );
}
