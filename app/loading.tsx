import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { bootMessages } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";

const horizontalLines = ["20%", "50%", "80%"] as const;
const verticalLines = ["22%", "60%"] as const;
const loadingNeon = "#57FF7C";
const loadingNeonSoft = "#BFFFC8";
const loadingNeonText = "#D7FFE0";
const loadingBeamColors = [
  "rgba(87,255,124,0)",
  "rgba(87,255,124,0.18)",
  "rgba(87,255,124,0.95)",
  "rgba(87,255,124,0.18)",
  "rgba(87,255,124,0)",
] as const;
const loadingBarColors = ["#C9FF72", "#8DFF9E", "#57FF7C"] as const;

function formatBootCommand(value: string) {
  return `> ${value.replaceAll(" ", "_").toUpperCase()}...`;
}

function goToHome() {
  router.replace("/tournaments");
}

export default function LoadingScreen() {
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const commandLines = useMemo(() => {
    return bootMessages
      .slice(0, Math.min(messageIndex + 1, bootMessages.length))
      .map(formatBootCommand);
  }, [messageIndex]);
  const setBootCompleted = useAppStore((state) => state.setBootCompleted);
  const releaseSharedTournamentAccess = useAppStore(
    (state) => state.releaseSharedTournamentAccess,
  );
  const redirectStarted = useRef(false);

  const scanlineY = useRef(new Animated.Value(-120)).current;
  const beamX = useRef(new Animated.Value(-900)).current;
  const beamY = useRef(new Animated.Value(-900)).current;
  const progressGlow = useRef(new Animated.Value(0.45)).current;
  const chevronSegments = useMemo(() => {
    const columns = 18;
    const rows = 12;
    const segmentWidth = Math.max(viewport.width / 16, 78);
    const columnGap = viewport.width / columns;
    const rowGap = viewport.height / rows;
    const segmentOffset = segmentWidth * 0.18;

    return Array.from({ length: rows + 2 }, (_, row) =>
      Array.from({ length: columns + 2 }, (_, column) => ({
        id: `${row}-${column}`,
        left: column * columnGap - columnGap * 0.65,
        top: row * rowGap - rowGap * 0.3,
        width: segmentWidth,
        lowerTop: row * rowGap - rowGap * 0.3 + segmentOffset,
      })),
    ).flat();
  }, [viewport.height, viewport.width]);

  useEffect(() => {
    releaseSharedTournamentAccess();
  }, [releaseSharedTournamentAccess]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          clearInterval(progressInterval);
          return 100;
        }

        return Math.min(current + 4, 100);
      });
    }, 110);

    const messageInterval = setInterval(() => {
      setMessageIndex((current) => {
        if (current >= bootMessages.length - 1) {
          clearInterval(messageInterval);
          return current;
        }

        return current + 1;
      });
    }, 650);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    const syncViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (progress < 100 || redirectStarted.current) {
      return;
    }

    redirectStarted.current = true;

    const redirectTimer = setTimeout(() => {
      setBootCompleted(true);
      goToHome();
    }, 450);

    return () => {
      clearTimeout(redirectTimer);
    };
  }, [progress, setBootCompleted]);

  useEffect(() => {
    const scanlineAnimation = Animated.loop(
      Animated.timing(scanlineY, {
        toValue: 1400,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const beamXAnimation = Animated.loop(
      Animated.timing(beamX, {
        toValue: 900,
        duration: 8500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const beamYAnimation = Animated.loop(
      Animated.timing(beamY, {
        toValue: 900,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const progressPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(progressGlow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progressGlow, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    scanlineAnimation.start();
    beamXAnimation.start();
    beamYAnimation.start();
    progressPulse.start();

    return () => {
      scanlineAnimation.stop();
      beamXAnimation.stop();
      beamYAnimation.stop();
      progressPulse.stop();
    };
  }, [beamX, beamY, progressGlow, scanlineY]);

  return (
    <Screen className="flex-1" backgroundVariant="none">
        <View className="flex-1 bg-black">
          <View className="absolute inset-0 opacity-[0.22]">
            {chevronSegments.flatMap((segment) => [
                <View
                  key={`${segment.id}-upper`}
                  className="absolute"
                  style={{
                    left: segment.left,
                    top: segment.top,
                    width: segment.width,
                    height: 1,
                    backgroundColor: "rgba(87,255,124,0.16)",
                    transform: [{ rotate: "24deg" }],
                  }}
                />,
                <View
                  key={`${segment.id}-lower`}
                  className="absolute"
                  style={{
                    left: segment.left,
                    top: segment.lowerTop,
                    width: segment.width,
                    height: 1,
                    backgroundColor: "rgba(87,255,124,0.16)",
                    transform: [{ rotate: "-24deg" }],
                  }}
                />,
            ])}
          </View>

        <View className="absolute inset-0 opacity-45">
            {horizontalLines.map((top) => (
              <View
                key={`horizontal-${top}`}
                className="absolute left-0 right-0 h-px"
                style={{ top, backgroundColor: "rgba(87,255,124,0.24)" }}
              />
            ))}

            {verticalLines.map((left) => (
              <View
                key={`vertical-${left}`}
                className="absolute bottom-0 top-0 w-px"
                style={{ left, backgroundColor: "rgba(87,255,124,0.24)" }}
              />
            ))}
          </View>

          <Animated.View
            className="absolute left-[-15%] h-px w-[130%]"
            style={{
              top: "50%",
              opacity: 0.35,
              shadowColor: loadingNeon,
              shadowOpacity: 0.65,
              shadowRadius: 10,
              transform: [{ translateX: beamX }],
            }}
          >
            <LinearGradient
              colors={loadingBeamColors}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ width: "100%", height: "100%" }}
            />
          </Animated.View>

          <Animated.View
            className="absolute top-[-15%] h-[130%] w-px"
            style={{
              left: "60%",
              opacity: 0.24,
              shadowColor: loadingNeon,
              shadowOpacity: 0.45,
              shadowRadius: 8,
              transform: [{ translateY: beamY }],
            }}
          >
            <LinearGradient
              colors={loadingBeamColors}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ width: "100%", height: "100%" }}
            />
          </Animated.View>

          <Animated.View
            className="absolute left-0 right-0 h-px"
            style={{
              opacity: 0.65,
              backgroundColor: loadingNeon,
              shadowColor: loadingNeon,
              shadowOpacity: 0.8,
              shadowRadius: 18,
              transform: [{ translateY: scanlineY }],
          }}
        />

        <View className="absolute inset-0 bg-black/10" />

        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full max-w-3xl gap-7">
            <View className="gap-1">
              {commandLines.map((line) => (
                <Text
                  key={line}
                  className="font-mono text-lg uppercase tracking-[2px]"
                  style={{ color: loadingNeon }}
                >
                  {line}
                </Text>
              ))}
            </View>

            <View className="gap-4">
              <View className="flex-row items-end justify-between gap-6">
                <Text
                  className="font-mono text-2xl uppercase tracking-[6px]"
                  style={{ color: loadingNeonSoft }}
                >
                  Carregando sistema
                </Text>
                <Text className="font-mono text-5xl font-black" style={{ color: loadingNeonSoft }}>
                  {progress}%
                </Text>
              </View>

              <View
                className="h-3 overflow-hidden border"
                style={{ borderColor: "rgba(87,255,124,0.4)", backgroundColor: "#08110C" }}
              >
                <View style={{ height: "100%", width: `${progress}%` }}>
                  <Animated.View
                    style={{
                      width: "100%",
                      height: "100%",
                      opacity: progressGlow,
                      shadowColor: "#57FF7C",
                      shadowOpacity: 1,
                      shadowRadius: 20,
                    }}
                  >
                    <LinearGradient
                      colors={loadingBarColors}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Animated.View>
                </View>
              </View>
            </View>

            <View className="gap-2">
              <Text className="max-w-2xl text-sm leading-6 text-arena-muted">
                Inicializando ambiente competitivo, sincronizando dados e preparando o hub oficial
                do campeonato.
              </Text>
              <Text className="text-xs uppercase tracking-[3px]" style={{ color: loadingNeonText }}>
                Aguarde. O menu sera liberado automaticamente em 100%.
              </Text>
              {progress >= 100 ? (
                <Text
                  className="text-xs uppercase tracking-[3px]"
                  style={{ color: "#E8FFF0" }}
                  onPress={goToHome}
                >
                  Abrir menu agora
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}
