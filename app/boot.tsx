import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, useWindowDimensions, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";

const bootNeon = "#57FF7C";
const horizontalBeamColors = [
  "rgba(87,255,124,0)",
  "rgba(87,255,124,0.12)",
  "rgba(87,255,124,0.9)",
  "rgba(87,255,124,0.12)",
  "rgba(87,255,124,0)",
] as const;
const verticalBeamColors = [
  "rgba(87,255,124,0)",
  "rgba(87,255,124,0.1)",
  "rgba(87,255,124,0.85)",
  "rgba(87,255,124,0.1)",
  "rgba(87,255,124,0)",
] as const;
const diagonalBeamColors = [
  "rgba(87,255,124,0)",
  "rgba(87,255,124,0.08)",
  "rgba(87,255,124,0.75)",
  "rgba(87,255,124,0.08)",
  "rgba(87,255,124,0)",
] as const;
const horizontalGuides = ["14%", "28%", "42%", "56%", "70%", "84%"] as const;
const verticalGuides = ["10%", "24%", "38%", "52%", "66%", "80%"] as const;
const diagonalBeams = [
  { top: "10%", left: "-18%", width: "150%", rotate: "-8deg", opacity: 0.06 },
  { top: "24%", left: "-16%", width: "144%", rotate: "-7deg", opacity: 0.06 },
  { top: "38%", left: "-18%", width: "150%", rotate: "-8deg", opacity: 0.07 },
  { top: "52%", left: "-20%", width: "156%", rotate: "-8deg", opacity: 0.08 },
  { top: "66%", left: "-18%", width: "150%", rotate: "-7deg", opacity: 0.06 },
  { top: "80%", left: "-16%", width: "144%", rotate: "-8deg", opacity: 0.06 },
] as const;
const diagonalReverseBeams = [
  { top: "18%", left: "-14%", width: "146%", rotate: "8deg", opacity: 0.06 },
  { top: "34%", left: "-18%", width: "150%", rotate: "7deg", opacity: 0.07 },
  { top: "50%", left: "-14%", width: "146%", rotate: "8deg", opacity: 0.08 },
  { top: "66%", left: "-20%", width: "154%", rotate: "7deg", opacity: 0.07 },
] as const;

export default function BootScreen() {
  const { width, height } = useWindowDimensions();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const releaseSharedTournamentAccess = useAppStore(
    (state) => state.releaseSharedTournamentAccess,
  );
  const setBootCompleted = useAppStore((state) => state.setBootCompleted);
  const authStatus = useAuthStore((state) => state.status);
  const horizontalAnimations = useRef(horizontalGuides.map(() => new Animated.Value(-1800))).current;
  const horizontalReverseAnimations = useRef(horizontalGuides.map(() => new Animated.Value(1800))).current;
  const verticalAnimations = useRef(verticalGuides.map(() => new Animated.Value(-1800))).current;
  const verticalReverseAnimations = useRef(verticalGuides.map(() => new Animated.Value(1800))).current;
  const diagonalAnimations = useRef(diagonalBeams.map(() => new Animated.Value(-1800))).current;
  const diagonalReverseAnimations = useRef(diagonalReverseBeams.map(() => new Animated.Value(1800))).current;
  const scanlineY = useRef(new Animated.Value(-220)).current;
  const moonColor = useRef(new Animated.Value(0)).current;
  const moonScale = useRef(new Animated.Value(0.94)).current;
  const haloOpacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    releaseSharedTournamentAccess();
  }, [releaseSharedTournamentAccess]);

  useEffect(() => {
    const horizontalTravel = Math.max(width * 0.55, 520);
    const verticalTravel = Math.max(height * 0.55, 420);
    const diagonalTravel = Math.max(width * 0.6, 700);

    horizontalAnimations.forEach((value) => value.setValue(-horizontalTravel));
    horizontalReverseAnimations.forEach((value) => value.setValue(horizontalTravel));
    verticalAnimations.forEach((value) => value.setValue(-verticalTravel));
    verticalReverseAnimations.forEach((value) => value.setValue(verticalTravel));
    diagonalAnimations.forEach((value) => value.setValue(-diagonalTravel));
    diagonalReverseAnimations.forEach((value) => value.setValue(diagonalTravel));
    scanlineY.setValue(-220);

    const horizontalLoops = horizontalAnimations.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 220),
          Animated.timing(value, {
            toValue: horizontalTravel,
            duration: 7000 + index * 1600,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    const horizontalReverseLoops = horizontalReverseAnimations.map((value, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 340),
          Animated.timing(value, {
            toValue: -horizontalTravel,
            duration: 7600 + index * 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      );
    });

    const verticalLoops = verticalAnimations.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 300),
          Animated.timing(value, {
            toValue: verticalTravel,
            duration: 8200 + index * 1600,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    const verticalReverseLoops = verticalReverseAnimations.map((value, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 420),
          Animated.timing(value, {
            toValue: -verticalTravel,
            duration: 9000 + index * 1400,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      );
    });

    const scanlineLoop = Animated.loop(
      Animated.timing(scanlineY, {
        toValue: 1600,
        duration: 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const diagonalLoops = diagonalAnimations.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 260),
          Animated.timing(value, {
            toValue: diagonalTravel,
            duration: 6400 + index * 700,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    const diagonalReverseLoops = diagonalReverseAnimations.map((value, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 360),
          Animated.timing(value, {
            toValue: -diagonalTravel,
            duration: 7000 + index * 900,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      );
    });

    const moonColorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(moonColor, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(moonColor, {
          toValue: 2,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(moonColor, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(moonScale, {
            toValue: 1.03,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(moonScale, {
            toValue: 0.94,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(haloOpacity, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.45,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    horizontalLoops.forEach((animation) => animation.start());
    horizontalReverseLoops.forEach((animation) => animation.start());
    verticalLoops.forEach((animation) => animation.start());
    verticalReverseLoops.forEach((animation) => animation.start());
    diagonalLoops.forEach((animation) => animation.start());
    diagonalReverseLoops.forEach((animation) => animation.start());
    scanlineLoop.start();
    moonColorLoop.start();
    pulseLoop.start();

    return () => {
      horizontalLoops.forEach((animation) => animation.stop());
      horizontalReverseLoops.forEach((animation) => animation.stop());
      verticalLoops.forEach((animation) => animation.stop());
      verticalReverseLoops.forEach((animation) => animation.stop());
      diagonalLoops.forEach((animation) => animation.stop());
      diagonalReverseLoops.forEach((animation) => animation.stop());
      scanlineLoop.stop();
      moonColorLoop.stop();
      pulseLoop.stop();
    };
  }, [
    diagonalAnimations,
    diagonalReverseAnimations,
    haloOpacity,
    height,
    horizontalAnimations,
    horizontalReverseAnimations,
    moonColor,
    moonScale,
    scanlineY,
    verticalAnimations,
    verticalReverseAnimations,
    width,
  ]);

  const moonBorder = moonColor.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["#57FF7C", "#A3FF8B", "#D8FFE4"],
  });

  return (
    <Screen className="flex-1" backgroundVariant="none">
      <Pressable className="flex-1" onPress={() => {
        setBootCompleted(true);
        if (redirect) {
          router.replace(redirect as never);
        } else if (authStatus === "authenticated") {
          router.replace("/tournaments");
        } else {
          router.replace("/login");
        }
      }}>
        <View className="flex-1 bg-black">
          <View className="absolute inset-0 bg-[#010302]" />

          <View className="absolute inset-0 overflow-hidden opacity-25">
            {horizontalGuides.map((top) => (
              <View
                key={`static-h-${top}`}
                className="absolute left-0 right-0"
                style={{ top, height: 1, backgroundColor: "rgba(87,255,124,0.14)" }}
              />
            ))}

            {verticalGuides.map((left) => (
              <View
                key={`static-v-${left}`}
                className="absolute bottom-0 top-0"
                style={{ left, width: 1, backgroundColor: "rgba(87,255,124,0.14)" }}
              />
            ))}
          </View>

          <View className="absolute inset-0 overflow-hidden opacity-28">
            {diagonalBeams.map((beam, index) => (
              <Animated.View
                key={`beam-${index}`}
                className="absolute"
                style={{
                  top: beam.top,
                  left: beam.left,
                  width: beam.width,
                  height: 2,
                  opacity: beam.opacity + 0.04,
                  shadowColor: bootNeon,
                  shadowOpacity: 0.8,
                  shadowRadius: 12,
                  transform: [{ translateX: diagonalAnimations[index] }, { rotate: beam.rotate }],
                }}
              >
                <LinearGradient
                  colors={diagonalBeamColors}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ width: "100%", height: "100%" }}
                />
              </Animated.View>
            ))}

            {diagonalReverseBeams.map((beam, index) => (
              <Animated.View
                key={`beam-reverse-${index}`}
                className="absolute"
                style={{
                  top: beam.top,
                  left: beam.left,
                  width: beam.width,
                  height: 2,
                  opacity: beam.opacity + 0.04,
                  shadowColor: bootNeon,
                  shadowOpacity: 0.8,
                  shadowRadius: 12,
                  transform: [{ translateX: diagonalReverseAnimations[index] }, { rotate: beam.rotate }],
                }}
              >
                <LinearGradient
                  colors={diagonalBeamColors}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ width: "100%", height: "100%" }}
                />
              </Animated.View>
            ))}
          </View>

          <View className="absolute inset-0 overflow-hidden opacity-20">
            {horizontalGuides.map((top, index) => (
              <Animated.View
                key={`move-h-${top}`}
                className="absolute"
                style={{
                  left: "-20%",
                  top,
                  width: "140%",
                  height: 1,
                  opacity: 0.28,
                  transform: [{ translateX: horizontalAnimations[index] }],
                }}
              >
                <LinearGradient
                  colors={horizontalBeamColors}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ width: "100%", height: "100%" }}
                />
              </Animated.View>
            ))}

            {verticalGuides.map((left, index) => (
              <Animated.View
                key={`move-v-${left}`}
                className="absolute"
                style={{
                  left,
                  top: "-20%",
                  height: "140%",
                  width: 1,
                  opacity: 0.22,
                  transform: [{ translateY: verticalAnimations[index] }],
                }}
              >
                <LinearGradient
                  colors={verticalBeamColors}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ width: "100%", height: "100%" }}
                />
              </Animated.View>
            ))}
          </View>

          <Animated.View
            className="absolute left-0 right-0 h-px"
            style={{
              opacity: 0.7,
              backgroundColor: bootNeon,
              shadowColor: bootNeon,
              shadowOpacity: 0.9,
              shadowRadius: 18,
              transform: [{ translateY: scanlineY }],
            }}
          />

          <View className="flex-1 items-center justify-center px-6">
            <View className="items-center gap-6">
              <View className="items-center justify-center" style={{ width: 180, height: 180 }}>
                <Animated.View
                  className="absolute rounded-full border-2 border-arena-neon"
                  style={{
                    width: 180,
                    height: 180,
                    borderColor: moonBorder,
                    opacity: haloOpacity,
                    transform: [{ scale: moonScale }],
                    shadowColor: bootNeon,
                    shadowOpacity: 0.85,
                    shadowRadius: 28,
                  }}
                />
              </View>

              <View className="items-center gap-3">
                <Text className="text-center text-5xl font-black uppercase tracking-[6px] text-arena-text">
                  Iniciar Arena
                </Text>
                <Text className="text-center text-xs uppercase tracking-[4px] text-arena-neon/70">
                  Clique em qualquer lugar para iniciar
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Screen>
  );
}
