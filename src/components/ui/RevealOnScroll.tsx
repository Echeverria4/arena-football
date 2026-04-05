import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  View,
  type ViewProps,
} from "react-native";

type RevealOnScrollProps = ViewProps & {
  children: ReactNode;
  delay?: number;
  distance?: number;
};

export function RevealOnScroll({
  children,
  delay = 0,
  distance = 28,
  style,
  ...rest
}: RevealOnScrollProps) {
  const containerRef = useRef<any>(null);
  const opacity = useRef(new Animated.Value(Platform.OS === "web" ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(Platform.OS === "web" ? distance : 0)).current;
  const hasRevealed = useRef(Platform.OS !== "web");

  const reveal = useCallback(() => {
    if (hasRevealed.current) {
      return;
    }

    hasRevealed.current = true;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      reveal();
      return;
    }

    const target = containerRef.current as Element | null;

    if (!target || typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [reveal]);

  return (
    <View ref={containerRef} style={style} {...rest}>
      <Animated.View
        style={{
          opacity,
          transform: [{ translateY }],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
