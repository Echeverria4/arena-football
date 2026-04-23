import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { registerWithEmail } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";
import { type RegisterFormValues, registerSchema } from "@/lib/validations";

export default function RegisterScreen() {
  const setUser = useAuthStore((state) => state.setUser);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      whatsappName: "",
      whatsappNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      gamertag: "",
      favoriteTeam: "",
      role: "organizer",
    },
  });

  const currentRole = watch("role");

  async function onSubmit(values: RegisterFormValues) {
    try {
      const result = await registerWithEmail(values);

      if (result.user) {
        setUser(result.user);
        router.replace("/tournaments");
        return;
      }

      Alert.alert(
        "Cadastro criado",
        `Conta criada para ${result.email}. Confirme o e-mail antes de entrar.`,
      );
      router.replace("/login");
    } catch (error) {
      console.error("[register] registerWithEmail failed:", error);
      Alert.alert("Falha no cadastro", error instanceof Error ? error.message : "Nao foi possivel cadastrar.");
    }
  }

  return (
    <Screen scroll className="px-6">
      <View className="gap-8 py-10">
        <SectionHeader
          eyebrow="Cadastro"
          title="Crie sua conta Arena"
          subtitle="Onboarding base para nome, WhatsApp, gamertag, time favorito e perfil inicial."
        />

        <View className="gap-4 rounded-[28px] border border-arena-line bg-arena-card p-5">
          <View className="gap-2">
            <Text className="text-base font-semibold text-arena-text">Perfil inicial</Text>
            <ScrollRow>
              {(["organizer", "player"] as const).map((role) => (
                <Pressable
                  key={role}
                  className={`rounded-full border px-4 py-3 ${
                    currentRole === role ? "border-arena-neon/65 bg-arena-neon/18" : "border-arena-line bg-arena-card"
                  }`}
                  onPress={() => setValue("role", role)}
                >
                  <Text
                    className={`text-sm font-semibold uppercase tracking-[2px] ${
                      currentRole === role ? "text-arena-text" : "text-arena-text"
                    }`}
                  >
                    {role === "organizer" ? "Organizador" : "Jogador"}
                  </Text>
                </Pressable>
              ))}
            </ScrollRow>
          </View>

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
            <Text className="text-base font-semibold text-arena-text">Nome no WhatsApp</Text>
            <Controller
              control={control}
              name="whatsappName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-base text-arena-text"
                  placeholder="Nome exibido na conversa"
                  placeholderTextColor="#F3F5F7"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.whatsappName ? (
              <Text className="text-base text-arena-danger">{errors.whatsappName.message}</Text>
            ) : null}
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
            <Text className="text-base font-semibold text-arena-text">Gamertag</Text>
            <Controller
              control={control}
              name="gamertag"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-base text-arena-text"
                  placeholder="Seu ID no jogo"
                  placeholderTextColor="#F3F5F7"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          <View className="gap-2">
            <Text className="text-base font-semibold text-arena-text">Time favorito</Text>
            <Controller
              control={control}
              name="favoriteTeam"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-base text-arena-text"
                  placeholder="Ex.: Barcelona"
                  placeholderTextColor="#F3F5F7"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
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
            onPress={handleSubmit(onSubmit)}
          />
          <PrimaryButton label="Ja tenho conta" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
