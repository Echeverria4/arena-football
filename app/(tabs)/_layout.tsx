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
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { isTournamentAccessLocked, resolveTournamentAccessMode } from "@/lib/tournament-access";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { styles } from "./_styles";

const tabBarStars = [
  { left: "5%",  top: "20%", size: 1.6, opacity: 0.30 },
  { left: "14%", top: "55%", size: 1.2, opacity: 0.22 },
  { left: "24%", top: "30%", size: 2.0, opacity: 0.34 },
  { left: "38%", top: "72%", size: 1.4, opacity: 0.24 },
  { left: "48%", top: "18%", size: 1.8, opacity: 0.28 },
  { left: "58%", top: "60%", size: 1.2, opacity: 0.20 },
  { left: "68%", top: "38%", size: 1.6, opacity: 0.26 },
  { left: "77%", top: "75%", size: 2.2, opacity: 0.30 },
  { left: "86%", top: "22%", size: 1.4, opacity: 0.22 },
  { left: "93%", top: "50%", size: 1.8, opacity: 0.28 },
] as const;

const galaxies = [
  // Nebulosa roxa — canto superior direito
  { left: "60%", top: "6%",  outerW: 260, outerH: 160, innerW: 110, innerH: 70,  outerColor: "rgba(139,92,246,0.13)",  innerColor: "rgba(167,139,250,0.22)", shadowColor: "#8B5CF6", shadowRadius: 70 },
  // Nebulosa azul elétrica — lateral esquerda centro
  { left: "-6%", top: "38%", outerW: 220, outerH: 150, innerW: 90,  innerH: 60,  outerColor: "rgba(59,130,246,0.12)",  innerColor: "rgba(96,165,250,0.20)",  shadowColor: "#3B82F6", shadowRadius: 60 },
  // Nebulosa ciana — canto inferior direito
  { left: "70%", top: "66%", outerW: 200, outerH: 130, innerW: 80,  innerH: 52,  outerColor: "rgba(34,211,238,0.11)",  innerColor: "rgba(103,232,249,0.19)", shadowColor: "#22D3EE", shadowRadius: 55 },
  // Nebulosa lilás suave — superior esquerdo
  { left: "14%", top: "12%", outerW: 180, outerH: 110, innerW: 72,  innerH: 46,  outerColor: "rgba(167,139,250,0.10)", innerColor: "rgba(196,181,253,0.18)", shadowColor: "#A78BFA", shadowRadius: 50 },
] as const;

const stars = [
  // brancas puras
  { left: "3%",  top: "6%",  size: 1.4, opacity: 0.70, color: "#FFFFFF" },
  { left: "9%",  top: "22%", size: 2.2, opacity: 0.55, color: "#FFFFFF" },
  { left: "16%", top: "44%", size: 1.2, opacity: 0.50, color: "#FFFFFF" },
  { left: "22%", top: "8%",  size: 1.6, opacity: 0.60, color: "#FFFFFF" },
  { left: "28%", top: "67%", size: 1.8, opacity: 0.48, color: "#FFFFFF" },
  { left: "35%", top: "31%", size: 1.0, opacity: 0.55, color: "#FFFFFF" },
  { left: "42%", top: "82%", size: 2.0, opacity: 0.45, color: "#FFFFFF" },
  { left: "50%", top: "14%", size: 1.4, opacity: 0.62, color: "#FFFFFF" },
  { left: "56%", top: "52%", size: 1.2, opacity: 0.50, color: "#FFFFFF" },
  { left: "63%", top: "77%", size: 1.8, opacity: 0.44, color: "#FFFFFF" },
  { left: "71%", top: "28%", size: 1.0, opacity: 0.58, color: "#FFFFFF" },
  { left: "79%", top: "60%", size: 2.4, opacity: 0.42, color: "#FFFFFF" },
  { left: "86%", top: "10%", size: 1.6, opacity: 0.65, color: "#FFFFFF" },
  { left: "93%", top: "40%", size: 1.2, opacity: 0.52, color: "#FFFFFF" },
  { left: "97%", top: "72%", size: 1.8, opacity: 0.46, color: "#FFFFFF" },
  // lilás / roxo
  { left: "6%",  top: "55%", size: 2.0, opacity: 0.60, color: "#E9D5FF" },
  { left: "13%", top: "81%", size: 1.4, opacity: 0.52, color: "#DDD6FE" },
  { left: "31%", top: "50%", size: 1.8, opacity: 0.56, color: "#C4B5FD" },
  { left: "46%", top: "35%", size: 1.2, opacity: 0.48, color: "#E9D5FF" },
  { left: "67%", top: "48%", size: 2.2, opacity: 0.55, color: "#DDD6FE" },
  { left: "84%", top: "84%", size: 1.6, opacity: 0.50, color: "#C4B5FD" },
  // ciano / azul
  { left: "19%", top: "18%", size: 1.6, opacity: 0.55, color: "#BAE6FD" },
  { left: "37%", top: "88%", size: 1.2, opacity: 0.48, color: "#A5F3FC" },
  { left: "53%", top: "63%", size: 2.0, opacity: 0.50, color: "#BAE6FD" },
  { left: "74%", top: "17%", size: 1.4, opacity: 0.58, color: "#A5F3FC" },
  { left: "88%", top: "55%", size: 1.8, opacity: 0.46, color: "#BAE6FD" },
  // pontos minúsculos (cintilação de fundo)
  { left: "11%", top: "36%", size: 0.8, opacity: 0.38, color: "#FFFFFF" },
  { left: "26%", top: "75%", size: 0.8, opacity: 0.34, color: "#E9D5FF" },
  { left: "48%", top: "90%", size: 0.8, opacity: 0.32, color: "#FFFFFF" },
  { left: "61%", top: "22%", size: 0.8, opacity: 0.36, color: "#BAE6FD" },
  { left: "82%", top: "38%", size: 0.8, opacity: 0.34, color: "#FFFFFF" },
  // ── segunda camada (dobrar) ──
  // brancas
  { left: "5%",  top: "42%", size: 1.6, opacity: 0.52, color: "#FFFFFF" },
  { left: "12%", top: "62%", size: 1.2, opacity: 0.44, color: "#FFFFFF" },
  { left: "20%", top: "29%", size: 2.0, opacity: 0.50, color: "#FFFFFF" },
  { left: "30%", top: "16%", size: 1.4, opacity: 0.58, color: "#FFFFFF" },
  { left: "39%", top: "57%", size: 1.0, opacity: 0.46, color: "#FFFFFF" },
  { left: "44%", top: "4%",  size: 1.8, opacity: 0.54, color: "#FFFFFF" },
  { left: "52%", top: "78%", size: 1.4, opacity: 0.48, color: "#FFFFFF" },
  { left: "59%", top: "39%", size: 2.2, opacity: 0.42, color: "#FFFFFF" },
  { left: "66%", top: "92%", size: 1.2, opacity: 0.40, color: "#FFFFFF" },
  { left: "73%", top: "8%",  size: 1.6, opacity: 0.60, color: "#FFFFFF" },
  { left: "80%", top: "49%", size: 1.0, opacity: 0.50, color: "#FFFFFF" },
  { left: "90%", top: "26%", size: 2.0, opacity: 0.44, color: "#FFFFFF" },
  { left: "95%", top: "58%", size: 1.4, opacity: 0.48, color: "#FFFFFF" },
  // lilás extras
  { left: "8%",  top: "14%", size: 1.8, opacity: 0.54, color: "#E9D5FF" },
  { left: "25%", top: "92%", size: 1.2, opacity: 0.46, color: "#C4B5FD" },
  { left: "41%", top: "69%", size: 2.0, opacity: 0.52, color: "#DDD6FE" },
  { left: "57%", top: "26%", size: 1.4, opacity: 0.50, color: "#E9D5FF" },
  { left: "75%", top: "73%", size: 1.6, opacity: 0.46, color: "#C4B5FD" },
  { left: "91%", top: "88%", size: 1.2, opacity: 0.42, color: "#DDD6FE" },
  // ciano extras
  { left: "7%",  top: "78%", size: 1.4, opacity: 0.50, color: "#A5F3FC" },
  { left: "33%", top: "4%",  size: 1.8, opacity: 0.52, color: "#BAE6FD" },
  { left: "49%", top: "47%", size: 1.2, opacity: 0.46, color: "#A5F3FC" },
  { left: "69%", top: "34%", size: 2.0, opacity: 0.48, color: "#BAE6FD" },
  { left: "85%", top: "68%", size: 1.6, opacity: 0.44, color: "#A5F3FC" },
  // micros extras
  { left: "17%", top: "53%", size: 0.8, opacity: 0.36, color: "#FFFFFF" },
  { left: "43%", top: "24%", size: 0.8, opacity: 0.32, color: "#E9D5FF" },
  { left: "64%", top: "86%", size: 0.8, opacity: 0.34, color: "#BAE6FD" },
  { left: "78%", top: "15%", size: 0.8, opacity: 0.38, color: "#FFFFFF" },
  { left: "96%", top: "44%", size: 0.8, opacity: 0.32, color: "#C4B5FD" },
] as const;

function TabsSceneBackground() {
  const { width, height } = useWindowDimensions();

  const verticalLines = useMemo<{ left: DimensionValue; opacity: number }[]>(() => {
    const count = Math.max(6, Math.floor(width / 180));
    return Array.from({ length: count }, (_, index) => ({
      left: `${(index / Math.max(count - 1, 1)) * 100}%` as DimensionValue,
      opacity: index % 2 === 0 ? 0.09 : 0.05,
    }));
  }, [width]);

  const horizontalLines = useMemo<{ top: DimensionValue; opacity: number }[]>(() => {
    const count = Math.max(5, Math.floor(height / 210));
    return Array.from({ length: count }, (_, index) => ({
      top: `${(index / Math.max(count - 1, 1)) * 100}%` as DimensionValue,
      opacity: index % 2 === 0 ? 0.09 : 0.05,
    }));
  }, [height]);

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
      {/* Base escura universo */}
      <LinearGradient
        colors={["#0A0514", "#080B1A", "#060816", "#040610"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Véu roxo/ciano suave no topo */}
      <LinearGradient
        colors={["rgba(139,92,246,0.22)", "rgba(59,130,246,0.08)", "rgba(0,0,0,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.8 }}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.72 }]}
      />

      {/* Galáxias / Nebulosas */}
      {galaxies.map((g, index) => (
        <View key={`galaxy-${index}`} style={{ position: "absolute", left: g.left as any, top: g.top as any }}>
          {/* Halo externo difuso */}
          <View
            style={{
              width: g.outerW,
              height: g.outerH,
              borderRadius: 999,
              backgroundColor: g.outerColor,
              shadowColor: g.shadowColor,
              shadowOpacity: 0.55,
              shadowRadius: g.shadowRadius,
            }}
          />
          {/* Núcleo brilhante */}
          <View
            style={{
              position: "absolute",
              left: (g.outerW - g.innerW) / 2,
              top: (g.outerH - g.innerH) / 2,
              width: g.innerW,
              height: g.innerH,
              borderRadius: 999,
              backgroundColor: g.innerColor,
              shadowColor: g.shadowColor,
              shadowOpacity: 0.80,
              shadowRadius: g.shadowRadius * 0.5,
            }}
          />
        </View>
      ))}

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

      {/* Estrelas — ~31 pontos com cores variadas */}
      {stars.map((star, index) => (
        <View
          key={`star-${index}`}
          style={{
            position: "absolute",
            left: star.left as any,
            top: star.top as any,
            width: star.size,
            height: star.size,
            borderRadius: 999,
            backgroundColor: star.color,
            opacity: star.opacity,
            shadowColor: star.color,
            shadowOpacity: 0.9,
            shadowRadius: star.size * 2,
          }}
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
        colors={["rgba(10,5,20,0.94)", "rgba(8,11,26,0.96)", "rgba(4,6,16,0.98)"]}
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
            backgroundColor: "#E9D5FF",
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
      className="transition-transform duration-200 hover:-translate-y-[1px] hover:scale-[1.015]"
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
  const authStatus = useAuthStore((state) => state.status);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const isPhone = width < 768;
  const isSmallPhone = width < 420;
  const activeTournamentAccessMode = resolveTournamentAccessMode(
    tournamentAccess,
    currentTournamentId,
  );
  const lockToActiveTournament =
    Boolean(currentTournamentId) && isTournamentAccessLocked(activeTournamentAccessMode);
  // Viewers e editores que entraram via link compartilhado nao precisam estar logados para ver o torneio.
  const hasSharedAccess =
    activeTournamentAccessMode === "editor" || activeTournamentAccessMode === "viewer";
  const requiresLogin = authHydrated && authStatus === "guest" && !hasSharedAccess;

  useEffect(() => {
    if (requiresLogin) {
      router.replace("/login");
    }
  }, [requiresLogin]);

  useEffect(() => {
    if (!lockToActiveTournament || !currentTournamentId) {
      return;
    }

    if (pathname?.startsWith("/tournament/") || pathname === "/history" || pathname === "/hall-of-fame") {
      return;
    }

    router.replace({ pathname: "/tournament/preview", params: { id: currentTournamentId } });
  }, [currentTournamentId, lockToActiveTournament, pathname]);

  if (!authHydrated || authStatus === "loading") {
    return (
      <View style={styles.layoutRoot}>
        <TabsSceneBackground />
        <Screen className="flex-1 px-6" backgroundVariant="none">
          <View className="flex-1 items-center justify-center py-12">
            <ScreenState
              title="Carregando sessão"
              description="Validando seu acesso ao Arena."
              tone="light"
            />
          </View>
        </Screen>
      </View>
    );
  }

  if (requiresLogin) {
    return (
      <View style={styles.layoutRoot}>
        <TabsSceneBackground />
        <Screen className="flex-1 px-6" backgroundVariant="none">
          <View className="flex-1 items-center justify-center py-12">
            <ScreenState
              title="Redirecionando para o login"
              description="Faça login para continuar no Arena."
              tone="light"
            />
          </View>
        </Screen>
      </View>
    );
  }

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
            borderTopColor: "transparent",
            height: isSmallPhone ? 64 : isPhone ? 68 : 74,
            paddingBottom: isSmallPhone ? 8 : isPhone ? 10 : 12,
            paddingTop: isSmallPhone ? 6 : 8,
            flexShrink: 0,
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: lockToActiveTournament ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          sceneStyle: {
            backgroundColor: "transparent",
            flex: 1,
            minHeight: 0,
            paddingBottom: lockToActiveTournament ? 0 : isSmallPhone ? 72 : isPhone ? 80 : 90,
          },
          tabBarItemStyle: {
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: "auto",
            width: "auto",
            paddingHorizontal: isSmallPhone ? 20 : isPhone ? 28 : 36,
          },
          tabBarLabelStyle: {
            fontSize: isSmallPhone ? 11 : isPhone ? 12 : 13,
            fontWeight: "600",
            marginTop: Platform.OS === "android" ? 0 : 2,
          },
          tabBarIconStyle: {
            marginTop: isSmallPhone ? 4 : 0,
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
          name="history"
          options={{
            title: "Histórico",
            tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
            tabBarButton: (props) => <GradientTabBarButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="videos"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="gallery"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="titles"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="clubs"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="selections"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="hall-of-fame"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="profile"
          options={{ href: null }}
        />
      </Tabs>
    </View>
  );
}
