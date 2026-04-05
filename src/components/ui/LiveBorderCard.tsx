import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, View, type StyleProp, type ViewStyle } from "react-native";

type LiveBorderAccent = "blue" | "gold" | "emerald" | "crimson";

type Props = {
  children: ReactNode;
  accent?: LiveBorderAccent;
  radius?: number;
  padding?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

const accentPalette: Record<
  LiveBorderAccent,
  {
    border: [string, string, string];
    frame: string;
    glow: string;
  }
> = {
  blue: {
    border: ["rgba(69,115,255,0.0)", "rgba(88,142,255,0.95)", "rgba(69,115,255,0.0)"],
    frame: "rgba(59,91,255,0.16)",
    glow: "rgba(59,91,255,0.18)",
  },
  gold: {
    border: ["rgba(255,205,86,0.0)", "rgba(255,203,102,0.96)", "rgba(255,205,86,0.0)"],
    frame: "rgba(233,179,52,0.18)",
    glow: "rgba(233,179,52,0.18)",
  },
  emerald: {
    border: ["rgba(87,255,124,0.0)", "rgba(118,255,169,0.94)", "rgba(87,255,124,0.0)"],
    frame: "rgba(87,255,124,0.18)",
    glow: "rgba(87,255,124,0.16)",
  },
  crimson: {
    border: ["rgba(236,88,124,0.0)", "rgba(255,112,148,0.95)", "rgba(236,88,124,0.0)"],
    frame: "rgba(212,79,98,0.20)",
    glow: "rgba(212,79,98,0.14)",
  },
};

export function LiveBorderCard({
  children,
  accent = "blue",
  radius = 18,
  padding = 1.5,
  backgroundColor = "#FFFFFF",
  style,
  contentStyle,
}: Props) {
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.94)).current;
  const palette = accentPalette[accent];

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 4800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.92,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    rotateLoop.start();
    pulseLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
    };
  }, [pulse, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={[
        {
          position: "relative",
          borderRadius: radius,
          padding,
          overflow: "hidden",
          backgroundColor: palette.frame,
          shadowColor: palette.glow,
          shadowOpacity: 0.16,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: "-35%",
          left: "-15%",
          width: "130%",
          height: "170%",
          opacity: 0.32,
          transform: [{ rotate: spin }, { scale: pulse }],
        }}
      >
        <LinearGradient
          colors={palette.border}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            position: "absolute",
            top: "46%",
            left: "-18%",
            width: "136%",
            height: 44,
            borderRadius: 999,
          }}
        />
      </Animated.View>

      <View
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          backgroundColor: palette.glow,
          opacity: 0.04,
        }}
        pointerEvents="none"
      />

      <View
        style={[
          {
            borderRadius: Math.max(radius - padding, 0),
            overflow: "hidden",
            backgroundColor,
            borderWidth: 1,
            borderColor: palette.frame,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
