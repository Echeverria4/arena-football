import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, Switch, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { classificationCriteriaOptions, tournamentFormats } from "@/lib/constants";
import { tournamentSchema, type TournamentFormValues } from "@/lib/validations";

export default function TournamentCreateScreen() {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      format: "groups_knockout",
      playerCount: 16,
      rules: "Mandante cria a sala. Resultados podem ser corrigidos somente pelo criador.",
      classificationCriteria: ["points", "goal_difference", "head_to_head"],
      allowVideos: true,
      allowGoalAward: true,
    },
  });

  const currentFormat = watch("format");
  const selectedCriteria = watch("classificationCriteria");

  function toggleClassificationCriterion(value: TournamentFormValues["classificationCriteria"][number]) {
    const nextCriteria = selectedCriteria.includes(value)
      ? selectedCriteria.filter((item) => item !== value)
      : classificationCriteriaOptions
          .map((item) => item.value)
          .filter((item) => selectedCriteria.includes(item) || item === value);

    setValue("classificationCriteria", nextCriteria, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(values: TournamentFormValues) {
    Alert.alert(
      "Campeonato preparado",
      `Fluxo base criado para ${values.name} com ${values.classificationCriteria.length} criterio(s).`,
    );
  }

  return (
    <Screen scroll className="px-6">
      <View className="gap-8 py-8">
        <SectionHeader
          eyebrow="Criar campeonato"
          title="ARENA"
          subtitle="Fluxo pronto para nome, formato, numero de participantes, criterios e configuracoes de videos."
        />

        <View className="gap-4 rounded-[28px] border border-arena-line bg-arena-card p-5">
          <View className="gap-2">
            <Text className="text-sm font-semibold text-arena-text">Nome do campeonato</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-arena-text"
                  placeholder="Arena Masters 2026"
                  placeholderTextColor="#7481A2"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.name ? <Text className="text-sm text-arena-danger">{errors.name.message}</Text> : null}
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-arena-text">Formato</Text>
            <ScrollRow>
              {tournamentFormats.map((format) => (
                <Pressable
                  key={format.value}
                    className={`rounded-full border px-4 py-2 ${
                      currentFormat === format.value
                        ? "border-arena-neon/65 bg-arena-neon/18"
                      : "border-arena-line bg-arena-card"
                    }`}
                  onPress={() => setValue("format", format.value)}
                >
                  <Text
                    className={`text-xs font-semibold uppercase tracking-[2px] ${
                      currentFormat === format.value ? "text-[#CFFFD9]" : "text-[#C6F8D6]"
                    }`}
                  >
                    {format.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollRow>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-arena-text">Quantidade de jogadores</Text>
            <Controller
              control={control}
              name="playerCount"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-arena-text"
                  placeholder="16"
                  placeholderTextColor="#7481A2"
                  keyboardType="numeric"
                  value={String(value)}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-arena-text">Regras principais</Text>
            <Controller
              control={control}
              name="rules"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="min-h-[120px] rounded-2xl border border-arena-line bg-arena-surface px-4 py-4 text-arena-text"
                  placeholder="Descreva criterios, mando de campo e governanca."
                  placeholderTextColor="#7481A2"
                  multiline
                  textAlignVertical="top"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.rules ? <Text className="text-sm text-arena-danger">{errors.rules.message}</Text> : null}
          </View>

          <View className="rounded-2xl border border-arena-line p-4">
            <ScrollRow className="mb-4">
              {classificationCriteriaOptions.map((criterion) => {
                const isSelected = selectedCriteria.includes(criterion.value);

                return (
                  <Pressable
                    key={criterion.value}
                    className={`rounded-full border px-4 py-2 ${
                      isSelected
                        ? "border-arena-neon/65 bg-arena-neon/18"
                        : "border-arena-line bg-arena-card"
                    }`}
                    onPress={() => toggleClassificationCriterion(criterion.value)}
                  >
                    <Text
                    className={`text-xs font-semibold uppercase tracking-[2px] ${
                        isSelected ? "text-[#CFFFD9]" : "text-[#C6F8D6]"
                      }`}
                    >
                      {criterion.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollRow>
            <Text className="text-sm leading-6 text-arena-muted">
              Toque para ativar ou remover os criterios de classificacao do campeonato.
            </Text>
            {errors.classificationCriteria ? (
              <Text className="mt-3 text-sm text-arena-danger">
                {errors.classificationCriteria.message}
              </Text>
            ) : null}
          </View>

          <Controller
            control={control}
            name="allowVideos"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row items-center justify-between rounded-2xl border border-arena-line px-4 py-3">
                <View className="flex-1 gap-1 pr-4">
                  <Text className="text-sm font-semibold text-arena-text">Permitir videos</Text>
                  <Text className="text-xs leading-5 text-arena-muted">
                    Libera upload de lances e moderacao do organizador.
                  </Text>
                </View>
                <Switch value={value} onValueChange={onChange} thumbColor="#57FF7C" />
              </View>
            )}
          />

          <Controller
            control={control}
            name="allowGoalAward"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row items-center justify-between rounded-2xl border border-arena-line px-4 py-3">
                <View className="flex-1 gap-1 pr-4">
                  <Text className="text-sm font-semibold text-arena-text">Ativar gol mais bonito</Text>
                  <Text className="text-xs leading-5 text-arena-muted">
                    Habilita destaque, votos e premiacao no hall do campeonato.
                  </Text>
                </View>
                <Switch value={value} onValueChange={onChange} thumbColor="#57FF7C" />
              </View>
            )}
          />

          <PrimaryButton
            label={isSubmitting ? "Salvando..." : "Finalizar"}
            onPress={handleSubmit(onSubmit)}
            className="self-center px-8"
          />
        </View>
      </View>
    </Screen>
  );
}
