import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, View, type LayoutChangeEvent } from "react-native";

import { injectElectricFilter } from "@/components/ui/ElectricBorderLayer";

// ─── CSS-extracted flash timing ───────────────────────────────────────────────
// Mirrors @keyframes lightning { 86% / 87.75% / 89.5% / 93% / 100% }

const CYCLE_MS  = 4000;
const QUIET_MS  = 3440;
const FLASH1_MS =   70;
const DIP_MS    =   70;
const FLASH2_MS =  140;
const FADE_MS   =  280;

const FLASH1_INTENSITY = 0.45;
const DIP_INTENSITY    = 0.15;
const FLASH2_INTENSITY = 0.75;

const NUM_BOLTS = 9;
const THICKNESS = 3;

// ─── Random bolt generation ───────────────────────────────────────────────────

function generateBoltWaypoints(): [number, number][] {
  const numSegs = 2 + Math.floor(Math.random() * 3);
  const startX = 8 + Math.random() * 84;
  const startY = 8 + Math.random() * 84;
  const mainAngle = Math.random() * 360;
  const pts: [number, number][] = [[startX, startY]];

  for (let i = 0; i < numSegs; i++) {
    const prev = pts[pts.length - 1];
    const segLen = 8 + Math.random() * 16;
    const side = i % 2 === 0 ? 1 : -1;
    const deviation = (50 + Math.random() * 25) * side;
    const rad = ((mainAngle + deviation) * Math.PI) / 180;
    pts.push([
      Math.max(3, Math.min(97, prev[0] + Math.cos(rad) * segLen)),
      Math.max(3, Math.min(97, prev[1] + Math.sin(rad) * segLen)),
    ]);
  }
  return pts;
}

type ComputedSeg = { left: number; top: number; width: number; height: number; angle: string };

function computeSegments(
  waypoints: [number, number][],
  w: number,
  h: number,
  thickness: number,
): ComputedSeg[] {
  return waypoints.slice(0, -1).map((_, i) => {
    const x1 = (waypoints[i][0] / 100) * w;
    const y1 = (waypoints[i][1] / 100) * h;
    const x2 = (waypoints[i + 1][0] / 100) * w;
    const y2 = (waypoints[i + 1][1] / 100) * h;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    return {
      left: (x1 + x2) / 2 - len / 2,
      top: (y1 + y2) / 2 - thickness / 2,
      width: len,
      height: thickness,
      angle: `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`,
    };
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function CardLightningLayer({ compact = false }: { compact?: boolean }) {
  const flashValue = useRef(new Animated.Value(0)).current;
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [allWaypoints, setAllWaypoints] = useState<[number, number][][]>(() =>
    Array.from({ length: NUM_BOLTS }, generateBoltWaypoints),
  );

  useEffect(() => {
    // Ensure SVG filter is available for web bolt rendering
    if (Platform.OS === "web") injectElectricFilter();
  }, []);

  // CSS @keyframes lightning — 4s cycle, double-flash
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(QUIET_MS),
        Animated.timing(flashValue, { toValue: FLASH1_INTENSITY, duration: FLASH1_MS, useNativeDriver: true }),
        Animated.timing(flashValue, { toValue: DIP_INTENSITY,    duration: DIP_MS,    useNativeDriver: true }),
        Animated.timing(flashValue, { toValue: FLASH2_INTENSITY, duration: FLASH2_MS, useNativeDriver: true }),
        Animated.timing(flashValue, { toValue: 0,                duration: FADE_MS,   useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [flashValue]);

  // New random positions fired right before each flash
  useEffect(() => {
    const first = setTimeout(() => {
      setAllWaypoints(Array.from({ length: NUM_BOLTS }, generateBoltWaypoints));
    }, QUIET_MS);
    const interval = setInterval(() => {
      setAllWaypoints(Array.from({ length: NUM_BOLTS }, generateBoltWaypoints));
    }, CYCLE_MS);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, []);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev?.width === width && prev?.height === height ? prev : { width, height },
    );
  }

  const allSegments = useMemo(() => {
    if (!size) return [];
    return allWaypoints.flatMap((wp) => computeSegments(wp, size.width, size.height, THICKNESS));
  }, [allWaypoints, size]);

  const boltOpacity = flashValue.interpolate({
    inputRange: [0, DIP_INTENSITY, FLASH2_INTENSITY],
    outputRange: [0, 1, 1],
    extrapolate: "clamp",
  });

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
    >
      {/* Lightning bolts — turbulent SVG filter applied on web, makes them look electric */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: boltOpacity },
          Platform.OS === "web" ? ({ filter: "url(#arena-electric)" } as object) : {},
        ]}
      >
        {allSegments.map((seg, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: seg.left,
              top: seg.top,
              width: seg.width,
              height: seg.height,
              backgroundColor: "#E8F4FF",
              shadowColor: "#B0D4FF",
              shadowRadius: 9,
              shadowOpacity: 1,
              transform: [{ rotate: seg.angle }],
            }}
          />
        ))}
      </Animated.View>

      {/* Brightness flash overlay — simulates CSS filter:brightness() at flash peaks */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: compact ? 16 : 18,
          backgroundColor: "rgba(255, 235, 140, 1)",
          opacity: flashValue,
        }}
      />
    </View>
  );
}
