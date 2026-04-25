import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { Alert, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { registerWithEmail } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";
import { type RegisterFormValues, registerSchema } from "@/lib/validations";

export default function RegisterScreen() {
  const setUser = useAuthStore((state) => state.setUser);
  const params = useLocalSearchParams<{ redirect?: string | string[] }>();
  const redirectTo = useMemo(() => {
    const raw = Array.isArray(params.redirect) ? params.redirect[0] : params.redirect;
    return raw && raw.startsWith("/") ? raw : "/tournaments";
  }, [params.redirect]);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      whatsappNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(values: RegisterFormValues) {
    console.log("[register] onSubmit firing for", values.email);
    setSubmitError(null);
    try {
      const result = await registerWithEmail(values);
      console.log("[register] registerWithEmail result:", {
        userId: result.user?.id,
        needsEmailConfirmation: result.needsEmailConfirmation,
      });

      if (result.user) {
        setUser(result.user);
        router.replace(redirectTo as never);
        return;
      }

      Alert.alert(
        "Cadastro criado",
        `Conta criada para ${result.email}. Confirme o e-mail antes de entrar.`,
      );
      router.replace({ pathname: "/login", params: { redirect: redirectTo } });
    } catch (error) {
      console.error("[register] registerWithEmail failed:", error);
      const message = error instanceof Error ? error.message : "Nao foi possivel cadastrar.";
      setSubmitError(message);
      Alert.alert("Falha no cadastro", message);
    }
  }

  function onInvalid(validationErrors: FieldErrors<RegisterFormValues>) {
    console.warn("[register] validation blocked submit:", validationErrors);
    const firstField = Object.keys(validationErrors)[0];
    const firstMessage =
      firstField && validationErrors[firstField as keyof RegisterFormValues]?.message;
    setSubmitError(
      firstMessage
        ? `Corrija o campo "${firstField}": ${firstMessage}`
        : "Ha campos invalidos no formulario. Cheque as mensagens em vermelho abaixo.",
    );
  }

  const hasFieldErrors = Object.keys(errors).length > 0;

  return (
    <Screen scroll className="px-6">
      <View className="gap-8 py-10">
        <SectionHeader
          eyebrow="Cadastro"
          title="Crie sua conta Arena"
          subtitle="Onboarding rapido: nome, WhatsApp, e-mail e senha. Seu WhatsApp e quem vincula voce aos campeonatos."
        />

        <View className="gap-4 rounded-[28px] border border-arena-line bg-arena-card p-5">
          {submitError || hasFieldErrors ? (
            <View
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(224,107,128,0.45)",
                backgroundColor: "rgba(224,107,128,0.12)",
              }}
            >
              <Text
                style={{
                  color: "#FCA5B4",
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                }}
              >
                Nao foi possivel cadastrar
              </Text>
              <Text style={{ marginTop: 6, color: "#FDE1E6", fontSize: 14, lineHeight: 20 }}>
                {submitError ?? "Cheque os campos destacados em vermelho abaixo."}
              </Text>
            </View>
          ) : null}

          <View className="gap-2">
            <Text className="text-base font-semibold text-arena-text">Nome completo</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-base text-arena-text"
                  placeholder="Seu nome no app"
                  placeholderTextColor="#F3F5F7"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.name ? <Text className="text-base text-arena-danger">{errors.name.message}</Text> : null}
          </View>

          <View className="gap-2">
            <Text className="text-base font-semibold text-arena-text">WhatsApp</Text>
            <Controller
              control={control}
              name="whatsappNumber"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-base text-arena-text"
                  placeholder="+55 11 99999-0000"
                  placeholderTextColor="#F3F5F7"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.whatsappNumber ? (
              <Text className="text-base text-arena-danger">{errors.whatsappNumber.message}</Text>
            ) : null}
          </View>

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
                  placeholder="Crie uma senha"
                  placeholderTextColor="#F3F5F7"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.password ? <Text className="text-base text-arena-danger">{errors.password.message}</Text> : null}
          </View>

          <View className="gap-2">
            <Text className="text-base font-semibold text-arena-text">Confirmar senha</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-base text-arena-text"
                  placeholder="Repita a senha"
                  placeholderTextColor="#F3F5F7"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.confirmPassword ? (
              <Text className="text-base text-arena-danger">{errors.confirmPassword.message}</Text>
            ) : null}
          </View>

          <PrimaryButton
            label={isSubmitting ? "Criando conta..." : "Criar conta"}
            onPress={handleSubmit(onSubmit, onInvalid)}
          />
          <PrimaryButton label="Ja tenho conta" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
