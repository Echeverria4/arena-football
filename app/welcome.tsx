import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Platform, Pressable, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { useAuthStore } from "@/stores/auth-store";

function goToHome() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.replace("/tournaments");
    return;
  }

  router.replace("/tournaments");
}

export default function WelcomeScreen() {
  const user = useAuthStore((state) => state.user);
  const welcomeName = useMemo(() => user?.name ?? "Jogador", [user?.name]);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(28)).current;
  const glowPulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const introAnimation = Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0.55,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);

    introAnimation.start();

    const timer = setTimeout(() => {
      goToHome();
    }, 2400);

    return () => {
      introAnimation.stop();
      clearTimeout(timer);
    };
  }, [fadeIn, glowPulse, slideUp]);

  return (
    <Screen className="flex-1" backgroundVariant="hero">
      <Pressable className="flex-1" onPress={goToHome}>
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View
            className="items-center gap-5"
            style={{
              opacity: fadeIn,
              transform: [{ translateY: slideUp }],
            }}
          >
            <Animated.View
              className="rounded-full border border-arena-neon/35 bg-black/35 px-5 py-3"
              style={{ opacity: glowPulse }}
            >
              <Text className="text-xs uppercase tracking-[6px] text-arena-neon">Acesso confirmado</Text>
            </Animated.View>

            <View className="items-center gap-3">
              <Text className="text-center text-3xl font-semibold text-[#C6F8D6]">Bem-vindo,</Text>
              <Text className="text-center text-6xl font-black uppercase tracking-[5px] text-arena-text">
                {welcomeName}
              </Text>
            </View>

            <Text className="max-w-2xl text-center text-base leading-7 text-arena-muted">
              Sua Arena está pronta. Preparando a entrada lenta no painel principal do campeonato.
            </Text>

            <Text className="text-center text-xs uppercase tracking-[4px] text-arena-neon/80">
              Toque na tela para continuar
            </Text>
          </Animated.View>
        </View>
      </Pressable>
    </Screen>
  );
}
