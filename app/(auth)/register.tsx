import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { Alert, Text, TextInput, View, useWindowDimensions } from "react-native";

import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { registerWithEmail } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";
import { type RegisterFormValues, registerSchema } from "@/lib/validations";

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

const LABEL_STYLE = {
  color: "#7B9EC8",
  fontSize: 11,
  fontWeight: "900" as const,
  letterSpacing: 1.8,
  textTransform: "uppercase" as const,
};

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
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
    setSubmitError(null);
    try {
      const result = await registerWithEmail(values);
      if (result.user) {
        setUser(result.user);
        router.replace(redirectTo as never);
        return;
      }
      Alert.alert("Cadastro criado", `Conta criada para ${result.email}. Confirme o e-mail antes de entrar.`);
      router.replace({ pathname: "/login", params: { redirect: redirectTo } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel cadastrar.";
      setSubmitError(message);
      Alert.alert("Falha no cadastro", message);
    }
  }

  function onInvalid(validationErrors: FieldErrors<RegisterFormValues>) {
    const firstField = Object.keys(validationErrors)[0];
    const firstMessage = firstField && validationErrors[firstField as keyof RegisterFormValues]?.message;
    setSubmitError(
      firstMessage
        ? `Corrija o campo "${firstField}": ${firstMessage}`
        : "Ha campos invalidos no formulario.",
    );
  }

  const hasFieldErrors = Object.keys(errors).length > 0;

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
            Crie sua conta
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
            Arena Football
          </Text>
        </View>

        {/* Error banner */}
        {(submitError || hasFieldErrors) ? (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(224,107,128,0.45)",
              backgroundColor: "rgba(224,107,128,0.10)",
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 4,
            }}
          >
            <Text style={{ color: "#FCA5B4", fontSize: 11, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" }}>
              Nao foi possivel cadastrar
            </Text>
            <Text style={{ color: "#FDE1E6", fontSize: 13, lineHeight: 20 }}>
              {submitError ?? "Cheque os campos destacados abaixo."}
            </Text>
          </View>
        ) : null}

        {/* Form card */}
        <LiveBorderCard
          accent="blue"
          radius={24}
          padding={1.4}
          backgroundColor="#060D18"
          contentStyle={{ paddingHorizontal: 22, paddingVertical: 24 }}
        >
          <View style={{ gap: 18 }}>
            {/* Nome */}
            <View style={{ gap: 8 }}>
              <Text style={LABEL_STYLE}>Nome completo</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[INPUT_STYLE, errors.name ? { borderColor: "rgba(224,107,128,0.55)" } : {}]}
                    placeholder="Seu nome no app"
                    placeholderTextColor="#3B5070"
                    autoCapitalize="words"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.name ? <Text style={{ color: "#FCA5B4", fontSize: 12, fontWeight: "700" }}>{errors.name.message}</Text> : null}
            </View>

            {/* WhatsApp */}
            <View style={{ gap: 8 }}>
              <Text style={LABEL_STYLE}>WhatsApp</Text>
              <Controller
                control={control}
                name="whatsappNumber"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[INPUT_STYLE, errors.whatsappNumber ? { borderColor: "rgba(224,107,128,0.55)" } : {}]}
                    placeholder="+55 11 99999-0000"
                    placeholderTextColor="#3B5070"
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.whatsappNumber ? <Text style={{ color: "#FCA5B4", fontSize: 12, fontWeight: "700" }}>{errors.whatsappNumber.message}</Text> : null}
            </View>

            {/* E-mail */}
            <View style={{ gap: 8 }}>
              <Text style={LABEL_STYLE}>E-mail</Text>
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
              {errors.email ? <Text style={{ color: "#FCA5B4", fontSize: 12, fontWeight: "700" }}>{errors.email.message}</Text> : null}
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(59,91,255,0.12)" }} />

            {/* Senha */}
            <View style={{ gap: 8 }}>
              <Text style={LABEL_STYLE}>Senha</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[INPUT_STYLE, errors.password ? { borderColor: "rgba(224,107,128,0.55)" } : {}]}
                    placeholder="Crie uma senha"
                    placeholderTextColor="#3B5070"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.password ? <Text style={{ color: "#FCA5B4", fontSize: 12, fontWeight: "700" }}>{errors.password.message}</Text> : null}
            </View>

            {/* Confirmar senha */}
            <View style={{ gap: 8 }}>
              <Text style={LABEL_STYLE}>Confirmar senha</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[INPUT_STYLE, errors.confirmPassword ? { borderColor: "rgba(224,107,128,0.55)" } : {}]}
                    placeholder="Repita a senha"
                    placeholderTextColor="#3B5070"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.confirmPassword ? <Text style={{ color: "#FCA5B4", fontSize: 12, fontWeight: "700" }}>{errors.confirmPassword.message}</Text> : null}
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(59,91,255,0.12)", marginVertical: 2 }} />

            <PrimaryButton
              label={isSubmitting ? "Criando conta..." : "Criar conta"}
              onPress={handleSubmit(onSubmit, onInvalid)}
            />
            <PrimaryButton
              label="Já tenho conta"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        </LiveBorderCard>
      </View>
    </Screen>
  );
}
