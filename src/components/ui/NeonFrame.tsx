import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  radius?: number;
  padding?: number;
  glowColor?: string;
  backgroundColor?: string;
  frameColor?: string;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
};

export function NeonFrame({
  children,
  radius = 24,
  padding = 2,
  glowColor = "#3B5BFF",
  backgroundColor = "#FFFFFF",
  frameColor = "rgba(59,91,255,0.16)",
  style,
  innerStyle,
}: Props) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.88,
          duration: 1800,
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
  }, [pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
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
          backgroundColor: frameColor,
          shadowColor: glowColor,
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          top: -54,
          left: -26,
          borderRadius: 999,
          backgroundColor: glowColor,
          opacity: 0,
          transform: [{ rotate: spin }, { scale: pulseAnim }],
        }}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          right: -80,
          bottom: -80,
          borderRadius: 999,
          backgroundColor: glowColor,
          opacity: 0,
          transform: [{ rotate: spin }, { scale: pulseAnim }],
        }}
      />

      <View
        style={[
          {
            borderRadius: radius - padding,
            overflow: "hidden",
            backgroundColor,
            borderWidth: 1,
            borderColor: frameColor,
          },
          innerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
