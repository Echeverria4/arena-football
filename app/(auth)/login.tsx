import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { Alert, Platform, Switch, Text, TextInput, View } from "react-native";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { type LoginFormValues, loginSchema } from "@/lib/validations";
import { signInWithEmail, signInWithGoogle } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginScreen() {
  const stayConnected = useAuthStore((state) => state.stayConnected);
  const setStayConnected = useAuthStore((state) => state.setStayConnected);
  const setUser = useAuthStore((state) => state.setUser);
  const status = useAuthStore((state) => state.status);
  const params = useLocalSearchParams<{ redirect?: string | string[] }>();
  const redirectTo = useMemo(() => {
    const raw = Array.isArray(params.redirect) ? params.redirect[0] : params.redirect;
    return raw && raw.startsWith("/") ? raw : "/tournaments";
  }, [params.redirect]);

  // Already authenticated (e.g. persistent session) — skip login
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
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const user = await signInWithEmail(values);
      setUser(user);
      // Navigation handled by useEffect reacting to status === "authenticated"
    } catch (error) {
      console.error("[login] signInWithEmail failed:", error);
      Alert.alert("Falha no login", error instanceof Error ? error.message : "Nao foi possivel entrar.");
    }
  }

  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
      // Web: o browser redireciona sozinho — nenhum feedback adicional precisa.
      // Native: o browser abriu, avisamos o usuario para concluir e voltar.
      if (Platform.OS !== "web") {
        Alert.alert(
          "Abra o navegador",
          "Conclua o login com Google no navegador e volte para o app.",
        );
      }
    } catch (error) {
      console.error("[login] signInWithGoogle failed:", error);
      Alert.alert(
        "Google indisponivel",
        error instanceof Error ? error.message : "Nao foi possivel iniciar o login com Google.",
      );
    }
  }

  return (
    <Screen scroll className="px-6">
      <View className="gap-8 py-10">
        <SectionHeader
          eyebrow="Acesso"
          title="Entre no Arena Football"
          subtitle="Login por e-mail, Google e um fluxo de onboarding pronto para nome, WhatsApp e gamertag."
        />

        <View className="gap-4 rounded-[28px] border border-arena-line bg-arena-card p-5">
          <View className="gap-2">
            <Text className="text-base font-semibold text-arena-text">E-mail</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-base text-arena-text"
                  placeholder="voce@arena.com"
                  placeholderTextColor="#F3F5F7"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.email ? <Text className="text-base text-arena-danger">{errors.email.message}</Text> : null}
          </View>

          <View className="gap-2">
            <Text className="text-base font-semibold text-arena-text">Senha</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-base text-arena-text"
                  placeholder="Digite sua senha"
                  placeholderTextColor="#F3F5F7"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.password ? (
              <Text className="text-base text-arena-danger">{errors.password.message}</Text>
            ) : null}
          </View>

          <View className="flex-row items-center justify-between rounded-2xl border border-arena-line px-4 py-3">
            <View className="flex-1 gap-1 pr-4">
              <Text className="text-base font-semibold text-arena-text">Manter conectado</Text>
              <Text className="text-sm leading-6 text-arena-muted">
                Ideal para organizadores acompanharem rodadas, resultados e videos mais rapido.
              </Text>
            </View>
            <Switch value={stayConnected} onValueChange={setStayConnected} thumbColor="#57FF7C" />
          </View>

          <PrimaryButton label={isSubmitting ? "Entrando..." : "Entrar"} onPress={handleSubmit(onSubmit)} />

          {Platform.OS === "web" && process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ? (
            <View className="items-center py-1">
              <GoogleSignInButton
                onError={(error) => {
                  console.error("[login] Google sign-in failed:", error);
                  Alert.alert(
                    "Google indisponivel",
                    error.message || "Nao foi possivel entrar com Google.",
                  );
                }}
                onSuccess={() => {
                  router.replace(redirectTo as never);
                }}
              />
            </View>
          ) : (
            <PrimaryButton label="Entrar com Google" variant="secondary" onPress={handleGoogleLogin} />
          )}
          <PrimaryButton
            label="Criar cadastro"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: "/register", params: { redirect: redirectTo } })
            }
          />
        </View>
      </View>
    </Screen>
  );
}
