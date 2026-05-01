import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { Alert, Platform, Switch, Text, TextInput, View, useWindowDimensions } from "react-native";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { type LoginFormValues, loginSchema } from "@/lib/validations";
import { signInWithEmail, signInWithGoogle } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";

const INPUT_STYLE = {
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "rgba(59,91,255,0.22)",
  backgroundColor: "rgba(4,8,18,0.72)",
  color: "#E5E7EB",
  fontSize: 15,
  fontWeight: "600" as const,
  paddingHorizontal: 16,
  paddingVertical: 14,
};

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const stayConnected = useAuthStore((state) => state.stayConnected);
  const setStayConnected = useAuthStore((state) => state.setStayConnected);
  const setUser = useAuthStore((state) => state.setUser);
  const status = useAuthStore((state) => state.status);
  const params = useLocalSearchParams<{ redirect?: string | string[] }>();
  const redirectTo = useMemo(() => {
    const raw = Array.isArray(params.redirect) ? params.redirect[0] : params.redirect;
    return raw && raw.startsWith("/") ? raw : "/tournaments";
  }, [params.redirect]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(redirectTo as never);
    }
  }, [status, redirectTo]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const user = await signInWithEmail(values);
      setUser(user);
    } catch (error) {
      Alert.alert("Falha no login", error instanceof Error ? error.message : "Nao foi possivel entrar.");
    }
  }

  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
      if (Platform.OS !== "web") {
        Alert.alert("Abra o navegador", "Conclua o login com Google no navegador e volte para o app.");
      }
    } catch (error) {
      Alert.alert("Google indisponivel", error instanceof Error ? error.message : "Nao foi possivel iniciar o login com Google.");
    }
  }

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View
        style={{
          width: "100%",
          maxWidth: 480,
          alignSelf: "center",
          gap: 28,
          paddingVertical: isPhone ? 40 : 56,
        }}
      >
        {/* Header identidade */}
        <View style={{ alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(139,92,246,0.18)",
              borderWidth: 1.5,
              borderColor: "rgba(167,139,250,0.40)",
              shadowColor: "#8B5CF6",
              shadowOpacity: 0.55,
              shadowRadius: 22,
            }}
          >
            <Text style={{ fontSize: 26 }}>⚡</Text>
          </View>
          <Text
            style={{
              color: "#F3F7FF",
              fontSize: isPhone ? 28 : 34,
              fontWeight: "900",
              letterSpacing: -0.5,
              textAlign: "center",
            }}
          >
            Arena Football
          </Text>
          <Text
            style={{
              color: "#C4B5FD",
              fontSize: 11,
              fontWeight: "900",
              letterSpacing: 2.4,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Acesso à plataforma
          </Text>
        </View>

        {/* Form card */}
        <LiveBorderCard
          accent="blue"
          radius={24}
          padding={1.4}
          backgroundColor="#060D18"
          contentStyle={{ paddingHorizontal: 22, paddingVertical: 24 }}
        >
          <View style={{ gap: 18 }}>
            {/* Email */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: "#7B9EC8",
                  fontSize: 11,
                  fontWeight: "900",
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                }}
              >
                E-mail
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[INPUT_STYLE, errors.email ? { borderColor: "rgba(224,107,128,0.55)" } : {}]}
                    placeholder="voce@arena.com"
                    placeholderTextColor="#3B5070"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.email ? (
                <Text style={{ color: "#FCA5B4", fontSize: 12, fontWeight: "700" }}>{errors.email.message}</Text>
              ) : null}
            </View>

            {/* Senha */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: "#7B9EC8",
                  fontSize: 11,
                  fontWeight: "900",
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                }}
              >
                Senha
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[INPUT_STYLE, errors.password ? { borderColor: "rgba(224,107,128,0.55)" } : {}]}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#3B5070"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.password ? (
                <Text style={{ color: "#FCA5B4", fontSize: 12, fontWeight: "700" }}>{errors.password.message}</Text>
              ) : null}
            </View>

            {/* Manter conectado */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(59,91,255,0.18)",
                backgroundColor: "rgba(4,8,18,0.50)",
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: 12,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: "#D7E5FF", fontSize: 14, fontWeight: "700" }}>
                  Manter conectado
                </Text>
                <Text style={{ color: "#5B7FC4", fontSize: 12, lineHeight: 18 }}>
                  Ideal para organizadores acompanharem rodadas sem precisar entrar de novo.
                </Text>
              </View>
              <Switch
                value={stayConnected}
                onValueChange={setStayConnected}
                thumbColor="#8B5CF6"
                trackColor={{ false: "#1E2A42", true: "rgba(139,92,246,0.40)" }}
              />
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: "rgba(59,91,255,0.14)",
                marginVertical: 2,
              }}
            />

            <PrimaryButton
              label={isSubmitting ? "Entrando..." : "Entrar"}
              onPress={handleSubmit(onSubmit)}
            />

            {Platform.OS === "web" && process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ? (
              <View style={{ alignItems: "center", paddingVertical: 4 }}>
                <GoogleSignInButton
                  onError={(error) => Alert.alert("Google indisponivel", error.message || "Nao foi possivel entrar com Google.")}
                  onSuccess={() => router.replace(redirectTo as never)}
                />
              </View>
            ) : (
              <PrimaryButton label="Entrar com Google" variant="secondary" onPress={handleGoogleLogin} />
            )}

            <PrimaryButton
              label="Criar cadastro"
              variant="secondary"
              onPress={() => router.push({ pathname: "/register", params: { redirect: redirectTo } })}
            />
          </View>
        </LiveBorderCard>
      </View>
    </Screen>
  );
}
