import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

type FlameTone = "gold" | "silver" | "bronze";

type CardFlameLayerProps = {
  tone: FlameTone;
  compact?: boolean;
  intensity?: "balanced" | "wild";
};

type FireBlobProps = {
  left?: number;
  right?: number;
  bottom: number;
  width: number;
  height: number;
  delay: number;
  duration: number;
};

type FlameTongueProps = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  width: number;
  height: number;
  delay: number;
  duration: number;
  rotationRange: [string, string];
  reverse?: boolean;
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
  delay,
  duration,
}: FireBlobProps) {
  const rise = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.92)).current;
  const sway = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const riseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rise, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rise, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: Math.max(1200, duration - 320),
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: Math.max(1200, duration - 320),
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: Math.max(1000, duration - 600),
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: Math.max(1000, duration - 600),
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const timer = setTimeout(() => {
      riseLoop.start();
      pulseLoop.start();
      swayLoop.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      riseLoop.stop();
      pulseLoop.stop();
      swayLoop.stop();
    };
  }, [delay, duration, pulse, rise, sway]);

  const translateY = rise.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, -height * 0.18, -height * 0.42],
  });
  const translateX = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });
  const rotate = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-7deg", "8deg"],
  });
  const opacity = rise.interpolate({
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
        transform: [{ translateX }, { translateY }, { scaleX: pulse }, { scaleY: pulse }, { rotate }],
      }}
    >
      <LinearGradient
        colors={fireGradient}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{
          flex: 1,
          borderRadius: 999,
        }}
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
  delay,
  duration,
  rotationRange,
  reverse = false,
}: FlameTongueProps) {
  const motion = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const motionLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.16,
          duration: Math.max(1100, duration - 380),
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.92,
          duration: Math.max(1100, duration - 380),
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const timer = setTimeout(() => {
      motionLoop.start();
      pulseLoop.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      motionLoop.stop();
      pulseLoop.stop();
    };
  }, [delay, duration, motion, pulse]);

  const rotate = motion.interpolate({
    inputRange: [0, 1],
    outputRange: rotationRange,
  });
  const translateY = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, reverse ? 10 : -12],
  });
  const opacity = motion.interpolate({
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
        transform: [{ translateY }, { scaleX: pulse }, { scaleY: pulse }, { rotate }],
      }}
    >
      <LinearGradient
        colors={reverse ? reverseFireGradient : fireGradient}
        start={{ x: 0.5, y: reverse ? 0 : 1 }}
        end={{ x: 0.5, y: reverse ? 1 : 0 }}
        style={{
          flex: 1,
          borderRadius: 999,
        }}
      />
    </Animated.View>
  );
}

function Spark({
  left,
  delay,
  compact,
  emberColor,
}: {
  left: string;
  delay: number;
  compact: boolean;
  emberColor: string;
}) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: compact ? 1800 : 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const timer = setTimeout(() => loop.start(), delay);

    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [compact, delay, drift]);

  const translateY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, compact ? -62 : -86],
  });
  const translateX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, compact ? 14 : 22],
  });
  const opacity = drift.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.9, 0],
  });
  const scale = drift.interpolate({
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
        delay={120}
        duration={2400}
      />
      <FireBlob
        left={compact ? 46 : 62}
        bottom={compact ? -10 : -8}
        width={compact ? 78 : 104}
        height={compact ? 142 : 184}
        delay={340}
        duration={2700}
      />
      <FireBlob
        right={compact ? 10 : 14}
        bottom={compact ? -4 : -2}
        width={compact ? 62 : 82}
        height={compact ? 122 : 154}
        delay={620}
        duration={2500}
      />
      {isWild ? (
        <>
          <FireBlob
            left={compact ? 20 : 28}
            bottom={compact ? 10 : 14}
            width={compact ? 44 : 58}
            height={compact ? 98 : 132}
            delay={860}
            duration={2100}
          />
          <FireBlob
            right={compact ? 20 : 30}
            bottom={compact ? 8 : 12}
            width={compact ? 46 : 60}
            height={compact ? 102 : 138}
            delay={1180}
            duration={2160}
          />
        </>
      ) : null}

      <FlameTongue
        left={-2}
        bottom={compact ? 18 : 24}
        width={compact ? 20 : 26}
        height={compact ? 74 : 92}
        delay={140}
        duration={1300}
        rotationRange={["-18deg", "9deg"]}
      />
      <FlameTongue
        right={-2}
        bottom={compact ? 18 : 26}
        width={compact ? 20 : 26}
        height={compact ? 80 : 98}
        delay={360}
        duration={1380}
        rotationRange={["18deg", "-8deg"]}
      />
      <FlameTongue
        left={compact ? 24 : 32}
        top={-2}
        width={compact ? 18 : 22}
        height={compact ? 42 : 52}
        delay={520}
        duration={1200}
        rotationRange={["-12deg", "8deg"]}
        reverse
      />
      <FlameTongue
        right={compact ? 24 : 34}
        top={-2}
        width={compact ? 18 : 22}
        height={compact ? 42 : 52}
        delay={760}
        duration={1220}
        rotationRange={["12deg", "-10deg"]}
        reverse
      />
      <FlameTongue
        left={compact ? 28 : 36}
        bottom={compact ? -6 : -10}
        width={compact ? 24 : 30}
        height={compact ? 66 : 82}
        delay={420}
        duration={1440}
        rotationRange={["-6deg", "12deg"]}
      />
      <FlameTongue
        right={compact ? 30 : 40}
        bottom={compact ? -6 : -10}
        width={compact ? 24 : 30}
        height={compact ? 66 : 82}
        delay={900}
        duration={1480}
        rotationRange={["8deg", "-12deg"]}
      />
      {isWild ? (
        <>
          <FlameTongue
            left={compact ? -8 : -12}
            bottom={compact ? 72 : 88}
            width={compact ? 18 : 22}
            height={compact ? 58 : 86}
            delay={1080}
            duration={1260}
            rotationRange={["-24deg", "14deg"]}
          />
          <FlameTongue
            right={compact ? -8 : -12}
            bottom={compact ? 70 : 90}
            width={compact ? 18 : 22}
            height={compact ? 64 : 92}
            delay={1280}
            duration={1320}
            rotationRange={["24deg", "-14deg"]}
          />
          <FlameTongue
            left={compact ? 46 : 64}
            top={compact ? -6 : -8}
            width={compact ? 14 : 18}
            height={compact ? 34 : 42}
            delay={920}
            duration={980}
            rotationRange={["-16deg", "10deg"]}
            reverse
          />
          <FlameTongue
            right={compact ? 48 : 66}
            top={compact ? -6 : -8}
            width={compact ? 14 : 18}
            height={compact ? 34 : 42}
            delay={1100}
            duration={1040}
            rotationRange={["16deg", "-10deg"]}
            reverse
          />
        </>
      ) : null}

      <Spark left="18%" delay={160} compact={compact} emberColor={palette.ember} />
      <Spark left="34%" delay={640} compact={compact} emberColor={palette.ember} />
      <Spark left="58%" delay={980} compact={compact} emberColor={palette.ember} />
      <Spark left="74%" delay={1320} compact={compact} emberColor={palette.ember} />
      {isWild ? (
        <>
          <Spark left="12%" delay={320} compact={compact} emberColor={palette.ember} />
          <Spark left="24%" delay={520} compact={compact} emberColor={palette.ember} />
          <Spark left="42%" delay={860} compact={compact} emberColor={palette.ember} />
          <Spark left="50%" delay={1120} compact={compact} emberColor={palette.ember} />
          <Spark left="66%" delay={1460} compact={compact} emberColor={palette.ember} />
          <Spark left="82%" delay={1680} compact={compact} emberColor={palette.ember} />
        </>
      ) : null}
    </View>
  );
}
