import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Tabs, usePathname } from "expo-router";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  useWindowDimensions,
  type DimensionValue,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import { isTournamentAccessLocked, resolveTournamentAccessMode } from "@/lib/tournament-access";
import { useAppStore } from "@/stores/app-store";
import { styles } from "./styles";

const tabBarStars = [
  { left: "8%", top: "28%", size: 2, opacity: 0.28 },
  { left: "19%", top: "62%", size: 1.5, opacity: 0.16 },
  { left: "36%", top: "22%", size: 1.2, opacity: 0.18 },
  { left: "51%", top: "68%", size: 1.8, opacity: 0.22 },
  { left: "69%", top: "32%", size: 1.4, opacity: 0.18 },
  { left: "88%", top: "58%", size: 1.9, opacity: 0.22 },
] as const;

function TabsSceneBackground() {
  const { width, height } = useWindowDimensions();

  const verticalLines = useMemo<{ left: DimensionValue; opacity: number }[]>(() => {
  const count = Math.max(6, Math.floor(width / 180));
  return Array.from({ length: count }, (_, index) => ({
    left: `${(index / Math.max(count - 1, 1)) * 100}%` as DimensionValue,
    opacity: index % 2 === 0 ? 0.12 : 0.07,
  }));
}, [width]);

const horizontalLines = useMemo<{ top: DimensionValue; opacity: number }[]>(() => {
  const count = Math.max(5, Math.floor(height / 210));
  return Array.from({ length: count }, (_, index) => ({
    top: `${(index / Math.max(count - 1, 1)) * 100}%` as DimensionValue,
    opacity: index % 2 === 0 ? 0.12 : 0.07,
  }));
}, [height]);

const particles = useMemo<{ left: DimensionValue; top: DimensionValue; size: number; opacity: number }[]>(
  () => [
    { left: "7%" as DimensionValue, top: "10%" as DimensionValue, size: 2, opacity: 0.32 },
    { left: "18%" as DimensionValue, top: "73%" as DimensionValue, size: 1.8, opacity: 0.24 },
    { left: "33%" as DimensionValue, top: "18%" as DimensionValue, size: 1.5, opacity: 0.16 },
    { left: "44%" as DimensionValue, top: "58%" as DimensionValue, size: 2.2, opacity: 0.2 },
    { left: "61%" as DimensionValue, top: "26%" as DimensionValue, size: 1.4, opacity: 0.2 },
    { left: "73%" as DimensionValue, top: "54%" as DimensionValue, size: 1.6, opacity: 0.18 },
    { left: "84%" as DimensionValue, top: "13%" as DimensionValue, size: 2.1, opacity: 0.28 },
    { left: "91%" as DimensionValue, top: "79%" as DimensionValue, size: 1.7, opacity: 0.22 },
  ],
  [],
);
  const shapeA = {
    width: 170,
    height: 170,
    left: width * 0.43,
    top: height * 0.12,
  };

  const shapeB = {
    width: 140,
    height: 140,
    left: width * 0.53,
    top: height * 0.38,
  };

  const shapeC = {
    width: 92,
    height: 26,
    left: width * 0.40,
    top: height * 0.73,
  };

  const shapeD = {
    width: 100,
    height: 26,
    left: width * 0.61,
    top: height * 0.12,
  };

  const shapeE = {
    width: 110,
    height: 74,
    left: width * 0.56,
    top: height * 0.70,
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={["#07111B", "#091826", "#061019", "#040A11"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={["rgba(58,133,196,0.30)", "rgba(10,24,36,0.08)", "rgba(0,0,0,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.8 }}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.72 }]}
      />

      <View
        style={[
          styles.centerGlow,
          {
            width: Math.min(width * 0.9, 760),
            height: Math.min(width * 0.9, 760),
            top: height * 0.18,
            left: (width - Math.min(width * 0.9, 760)) / 2,
          },
        ]}
      />

      {verticalLines.map((line, index) => (
        <View
          key={`v-line-${index}`}
          style={[styles.gridVertical, { left: line.left, opacity: line.opacity }]}
        />
      ))}

      {horizontalLines.map((line, index) => (
        <View
          key={`h-line-${index}`}
          style={[styles.gridHorizontal, { top: line.top, opacity: line.opacity }]}
        />
      ))}

      <View style={styles.vanishingPointWrap}>
        <View style={[styles.vanishingRay, { transform: [{ rotate: "-58deg" }], opacity: 0.12 }]} />
        <View style={[styles.vanishingRay, { transform: [{ rotate: "-38deg" }], opacity: 0.08 }]} />
        <View style={[styles.vanishingRay, { transform: [{ rotate: "-18deg" }], opacity: 0.12 }]} />
        <View style={[styles.vanishingRay, { transform: [{ rotate: "0deg" }], opacity: 0.08 }]} />
        <View style={[styles.vanishingRay, { transform: [{ rotate: "18deg" }], opacity: 0.12 }]} />
        <View style={[styles.vanishingRay, { transform: [{ rotate: "38deg" }], opacity: 0.08 }]} />
        <View style={[styles.vanishingRay, { transform: [{ rotate: "58deg" }], opacity: 0.12 }]} />
      </View>

      <View
        style={[
          styles.diamondOutline,
          {
            width: shapeA.width,
            height: shapeA.height,
            left: shapeA.left,
            top: shapeA.top,
          },
        ]}
      />
      <View
        style={[
          styles.diamondOutlineSoft,
          {
            width: shapeB.width,
            height: shapeB.height,
            left: shapeB.left,
            top: shapeB.top,
          },
        ]}
      />
      <View
        style={[
          styles.shapeBarGreen,
          {
            width: shapeC.width,
            height: shapeC.height,
            left: shapeC.left,
            top: shapeC.top,
          },
        ]}
      />
      <View
        style={[
          styles.shapeBarLight,
          {
            width: shapeD.width,
            height: shapeD.height,
            left: shapeD.left,
            top: shapeD.top,
          },
        ]}
      />
      <View
        style={[
          styles.shapePlate,
          {
            width: shapeE.width,
            height: shapeE.height,
            left: shapeE.left,
            top: shapeE.top,
          },
        ]}
      />

      <View style={styles.wordmarkWrap}>
        <View style={styles.wordmarkDiamond} />
        <View style={styles.wordmarkGlow} />
        <View style={styles.wordmarkLine} />
      </View>

      {particles.map((particle, index) => (
        <View
          key={`particle-${index}`}
          style={[
            styles.particle,
            {
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
            },
          ]}
        />
      ))}

      <View style={styles.bottomGlowLine} />
    </View>
  );
}

function TabBarBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={["rgba(11,22,34,0.92)", "rgba(8,16,25,0.96)", "rgba(5,11,18,0.98)"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.tabBarTopLine} />
      {tabBarStars.map((star, index) => (
        <View
          key={`tab-star-${index}`}
          style={{
            position: "absolute",
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: 999,
            opacity: star.opacity,
            backgroundColor: "#DFF7FF",
          }}
        />
      ))}
    </View>
  );
}

interface GradientTabBarButtonProps {
  accessibilityState?: { selected?: boolean };
  children?: ReactNode;
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
  onPress?: ((event: GestureResponderEvent) => void) | null;
  style?: StyleProp<ViewStyle>;
}

function GradientTabBarButton({ ...props }: GradientTabBarButtonProps) {
  const isActive = Boolean(props.accessibilityState?.selected);
  const [isHovered, setIsHovered] = useState(false);
  const isInteractive = isHovered || isActive;

  return (
    <Pressable
      {...props}
      className="flex-1 transition-transform duration-200 hover:-translate-y-[1px] hover:scale-[1.015]"
      style={[props.style, styles.tabButton]}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <View
        style={[
          styles.tabInner,
          isActive ? styles.tabInnerSelected : isHovered ? styles.tabInnerHover : styles.tabInnerIdle,
        ]}
      >
        <LinearGradient
          colors={
            isActive
              ? ["#06070A", "#2C0108", "#8A0619", "#FF2A49", "#8A0619", "#2C0108", "#06070A"]
              : isHovered
                ? ["#07070A", "#1B0105", "#650311", "#E71D3D", "#650311", "#1B0105", "#07070A"]
                : ["rgba(9,15,20,0.82)", "rgba(8,14,19,0.88)", "rgba(7,12,17,0.92)"]
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />

        {isInteractive ? (
          <>
            <View
              pointerEvents="none"
              style={[
                styles.activeSheen,
                {
                  opacity: isActive ? 0.92 : 0.54,
                },
              ]}
            >
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0)",
                  "rgba(255,65,96,0.05)",
                  "rgba(255,92,119,0.28)",
                  "rgba(255,210,216,0.18)",
                  "rgba(255,92,119,0.28)",
                  "rgba(255,65,96,0.05)",
                  "rgba(0,0,0,0)",
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>

            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  opacity: isActive ? 0.82 : 0.5,
                },
              ]}
            >
              <LinearGradient
                colors={
                  isActive
                    ? [
                        "rgba(0,0,0,0.05)",
                        "rgba(255,55,87,0.22)",
                        "rgba(255,198,205,0.18)",
                        "rgba(255,55,87,0.22)",
                        "rgba(0,0,0,0.05)",
                      ]
                    : [
                        "rgba(0,0,0,0.03)",
                        "rgba(255,55,87,0.14)",
                        "rgba(255,198,205,0.1)",
                        "rgba(255,55,87,0.14)",
                        "rgba(0,0,0,0.03)",
                      ]
                }
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          </>
        ) : null}

        {isActive ? (
          <>
            <View pointerEvents="none" style={styles.activeTopEdge} />
            <View pointerEvents="none" style={styles.activeLeadingGlow} />
            <View pointerEvents="none" style={styles.activeTrailingGlow} />
          </>
        ) : null}

        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.stroke,
            isInteractive ? styles.strokeInteractive : styles.strokeIdle,
          ]}
        />

        <View style={styles.content}>{props.children}</View>
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const currentTournamentId = useAppStore((state) => state.currentTournamentId);
  const tournamentAccess = useAppStore((state) => state.tournamentAccess);
  const isPhone = width < 768;
  const isSmallPhone = width < 420;
  const activeTournamentAccessMode = resolveTournamentAccessMode(
    tournamentAccess,
    currentTournamentId,
  );
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);

  useEffect(() => {
    if (!lockToActiveTournament || !currentTournamentId) {
      return;
    }

    if (pathname?.startsWith("/tournament/")) {
      return;
    }

    router.replace({ pathname: "/tournament/[id]", params: { id: currentTournamentId } });
  }, [currentTournamentId, lockToActiveTournament, pathname]);

  return (
    <View style={styles.layoutRoot}>
      <TabsSceneBackground />

      <Tabs
        screenOptions={{
          headerShown: false,
          freezeOnBlur: true,
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#FFFFFF",
          tabBarShowLabel: !isSmallPhone,
          tabBarStyle: {
            backgroundColor: "transparent",
            borderTopColor: "rgba(97,124,129,0.14)",
            height: isSmallPhone ? 72 : isPhone ? 76 : 78,
            paddingBottom: isSmallPhone ? 10 : 12,
            paddingTop: isSmallPhone ? 8 : 10,
            flexShrink: 0,
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: lockToActiveTournament ? "none" : "flex",
          },
          sceneStyle: {
            backgroundColor: "transparent",
            flex: 1,
            minHeight: 0,
            paddingBottom: lockToActiveTournament ? 0 : isSmallPhone ? 86 : 96,
          },
          tabBarItemStyle: {
            paddingHorizontal: isSmallPhone ? 0 : 2,
          },
          tabBarLabelStyle: {
            fontSize: isPhone ? 11 : 13,
            fontWeight: "500",
            marginTop: Platform.OS === "android" ? 0 : 2,
          },
          tabBarIconStyle: {
            marginTop: isSmallPhone ? 6 : 0,
          },
          tabBarBackground: () => <TabBarBackdrop />,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarButton: () => null,
            tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="tournaments"
          options={{
            title: "Campeonatos",
            tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" color={color} size={size} />,
            tabBarButton: (props) => <GradientTabBarButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="videos"
          options={{
            title: "Videos",
            tabBarIcon: ({ color, size }) => <Ionicons name="videocam-outline" color={color} size={size} />,
            tabBarButton: (props) => <GradientTabBarButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="gallery"
          options={{
            title: "Galeria",
            tabBarIcon: ({ color, size }) => <Ionicons name="images-outline" color={color} size={size} />,
            tabBarButton: (props) => <GradientTabBarButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="titles"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="clubs"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="selections"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="hall-of-fame"
          options={{
            title: "Hall da Fama",
            tabBarIcon: ({ color, size }) => <Ionicons name="medal-outline" color={color} size={size} />,
            tabBarButton: (props) => <GradientTabBarButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="styles"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
