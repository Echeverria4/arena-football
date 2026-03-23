import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";

const AnimatedView = Animated.View;
const tabBarStars = [
  { left: "8%", top: "28%", size: 2, opacity: 0.28 },
  { left: "19%", top: "62%", size: 1.5, opacity: 0.16 },
  { left: "36%", top: "22%", size: 1.2, opacity: 0.18 },
  { left: "51%", top: "68%", size: 1.8, opacity: 0.22 },
  { left: "69%", top: "32%", size: 1.4, opacity: 0.18 },
  { left: "88%", top: "58%", size: 1.9, opacity: 0.22 },
] as const;

function TabBarBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={["rgba(8,13,19,0.98)", "rgba(7,12,18,0.98)", "rgba(5,9,14,0.99)"]}
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
            backgroundColor: "#FFE3E6",
          }}
        />
      ))}
    </View>
  );
}

interface GradientTabBarButtonProps extends BottomTabBarButtonProps {
  pathname: string;
  routeName: string;
}

function GradientTabBarButton({ pathname, routeName, ...props }: GradientTabBarButtonProps) {
  const normalizedPath = pathname === "/" ? "/home" : pathname;
  const routePath = `/${routeName}`;
  const isActive =
    normalizedPath === routePath ||
    normalizedPath.startsWith(`${routePath}/`) ||
    Boolean(props.accessibilityState?.selected);
  const [isHovered, setIsHovered] = useState(false);
  const sheenShift = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const isInteractive = isHovered || isActive;

  useEffect(() => {
    if (!isInteractive) {
      sheenShift.stopAnimation();
      glowPulse.stopAnimation();
      sheenShift.setValue(0);
      glowPulse.setValue(0);
      return;
    }

    const sheenLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sheenShift, {
          toValue: 1,
          duration: isActive ? 1800 : 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sheenShift, {
          toValue: 0,
          duration: isActive ? 1800 : 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: isActive ? 1 : 0.78,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: isActive ? 0.62 : 0.38,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    sheenLoop.start();
    glowLoop.start();

    return () => {
      sheenLoop.stop();
      glowLoop.stop();
    };
  }, [glowPulse, isActive, isInteractive, sheenShift]);

  const sheenTranslate = sheenShift.interpolate({
    inputRange: [0, 1],
    outputRange: [-22, 22],
  });

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
                : ["rgba(9,15,20,0.92)", "rgba(8,14,19,0.95)", "rgba(7,12,17,0.97)"]
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />

        {isInteractive ? (
          <>
            <AnimatedView
              pointerEvents="none"
              style={[
                styles.activeSheen,
                {
                  transform: [{ translateX: sheenTranslate }],
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
            </AnimatedView>

            <AnimatedView
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  opacity: glowPulse,
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
            </AnimatedView>
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
  const pathname = usePathname();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#FFFFFF",
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: "rgba(97,124,129,0.14)",
          height: 78,
          paddingBottom: 12,
          paddingTop: 10,
          flexShrink: 0,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        },
        sceneStyle: {
          backgroundColor: "#050A11",
          flex: 1,
          minHeight: 0,
          paddingBottom: 96,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "500",
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
          tabBarButton: (props) => (
            <GradientTabBarButton {...props} pathname={pathname} routeName="tournaments" />
          ),
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: "Videos",
          tabBarIcon: ({ color, size }) => <Ionicons name="videocam-outline" color={color} size={size} />,
          tabBarButton: (props) => (
            <GradientTabBarButton {...props} pathname={pathname} routeName="videos" />
          ),
        }}
      />
      <Tabs.Screen
        name="titles"
        options={{
          title: "Titulos",
          tabBarIcon: ({ color, size }) => <Ionicons name="ribbon-outline" color={color} size={size} />,
          tabBarButton: (props) => (
            <GradientTabBarButton {...props} pathname={pathname} routeName="titles" />
          ),
        }}
      />
      <Tabs.Screen
        name="hall-of-fame"
        options={{
          title: "Hall da Fama",
          tabBarIcon: ({ color, size }) => <Ionicons name="medal-outline" color={color} size={size} />,
          tabBarButton: (props) => (
            <GradientTabBarButton {...props} pathname={pathname} routeName="hall-of-fame" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
          tabBarButton: (props) => (
            <GradientTabBarButton {...props} pathname={pathname} routeName="profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarTopLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(130, 28, 45, 0.28)",
  },
  tabButton: {
    marginHorizontal: 5,
    borderRadius: 20,
  },
  tabInner: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  tabInnerIdle: {
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  tabInnerHover: {
    shadowColor: "#FF2D4D",
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  tabInnerSelected: {
    shadowColor: "#FF2D4D",
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },
  activeSheen: {
    position: "absolute",
    left: "-12%",
    top: 0,
    bottom: 0,
    width: "124%",
  },
  activeTopEdge: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 0,
    height: 2,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    backgroundColor: "rgba(255,198,205,0.52)",
  },
  activeLeadingGlow: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 64,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  activeTrailingGlow: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 42,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  stroke: {
    borderWidth: 1,
    borderRadius: 20,
  },
  strokeIdle: {
    borderColor: "rgba(74,100,106,0.24)",
  },
  strokeInteractive: {
    borderColor: "rgba(255,173,182,0.46)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
});
