import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import { z } from "zod";

import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { classificationCriteriaOptions, tournamentFormats } from "@/lib/constants";
import { getNextSeasonLabel } from "@/lib/season-tournaments";
import { buildInitialCampeonato } from "@/lib/tournament-setup";
import { classificationCriterionSchema } from "@/lib/validations";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";

const tournamentCreateStepSchema = z.object({
  name: z.string().min(3, "Informe o nome do campeonato."),
  format: z.enum(["league", "groups", "knockout", "groups_knockout"]),
  playerCount: z.coerce.number().min(2).max(128),
  rules: z.string().min(10, "Descreva as regras principais."),
  classificationCriteria: z
    .array(classificationCriterionSchema)
    .min(1, "Selecione ao menos um criterio de classificacao."),
  allowVideos: z.boolean(),
  allowGoalAward: z.boolean(),
});

type TournamentCreateStepValues = z.infer<typeof tournamentCreateStepSchema>;

export default function TournamentCreateScreen() {
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const adicionarCampeonato = useTournamentStore((state) => state.adicionarCampeonato);
  const setCurrentTournamentId = useAppStore((state) => state.setCurrentTournamentId);
  const nextSeasonLabel = getNextSeasonLabel(campeonatos);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TournamentCreateStepValues>({
    resolver: zodResolver(tournamentCreateStepSchema),
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

  function toggleClassificationCriterion(
    value: TournamentCreateStepValues["classificationCriteria"][number],
  ) {
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

  function handleBackPress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/tournaments");
  }

  async function onSubmit(values: TournamentCreateStepValues) {
    const tournamentId = `campeonato-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();

    const campeonato = buildInitialCampeonato({
      id: tournamentId,
      name: values.name,
      createdAt,
      seasonLabel: getNextSeasonLabel(campeonatos),
      format: values.format,
      matchMode: "single_game",
      rules: values.rules,
      classificationCriteria: values.classificationCriteria,
      allowVideos: values.allowVideos,
      allowGoalAward: values.allowGoalAward,
      playerCount: values.playerCount,
    });

    adicionarCampeonato(campeonato);
    setCurrentTournamentId(tournamentId);
    router.replace({ pathname: "/tournament/[id]", params: { id: tournamentId } });
  }

  return (
    <Screen scroll className="px-6">
      <View className="gap-8 py-8">
        <BackButton onPress={handleBackPress} />

        <SectionHeader
          eyebrow="Criar campeonato"
          title="Nova temporada"
          subtitle="Monte a identidade do campeonato, defina o formato e entre direto no painel principal quando finalizar."
        />

        <View
          className="gap-5 rounded-[28px] border px-5 py-5"
          style={{
            borderColor: "rgba(59,91,255,0.18)",
            backgroundColor: "#EFF4FF",
          }}
        >
          <View className="gap-2">
            <Text
              style={{
                color: "#5678C9",
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1.8,
                textTransform: "uppercase",
              }}
            >
              Proximo ciclo
            </Text>
            <Text style={{ color: "#1C2B4A", fontSize: 28, fontWeight: "900" }}>
              {nextSeasonLabel}
            </Text>
            <Text style={{ color: "#6B7EA3", fontSize: 15, lineHeight: 24 }}>
              Assim que voce concluir esta etapa, o campeonato ja abre com painel, rodadas e
              compartilhamento prontos para o proximo passo.
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <View className="rounded-full border border-[#3B5BFF]/14 bg-white px-3 py-2">
              <Text className="text-xs font-black uppercase tracking-[1.6px] text-[#3150A6]">
                Painel imediato
              </Text>
            </View>
            <View className="rounded-full border border-[#3B5BFF]/14 bg-white px-3 py-2">
              <Text className="text-xs font-black uppercase tracking-[1.6px] text-[#3150A6]">
                Regras centrais
              </Text>
            </View>
            <View className="rounded-full border border-[#3B5BFF]/14 bg-white px-3 py-2">
              <Text className="text-xs font-black uppercase tracking-[1.6px] text-[#3150A6]">
                Midia opcional
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-4 rounded-[28px] border border-arena-line bg-arena-card p-5">
          <View className="gap-2 rounded-[22px] border border-arena-line bg-arena-surface px-4 py-4">
            <Text className="text-xs font-black uppercase tracking-[2px] text-[#5678C9]">
              Estrutura inicial
            </Text>
            <Text className="text-sm leading-6 text-arena-muted">
              Preencha os blocos abaixo para criar a temporada base. O campeonato nasce ativo e
              depois pode receber participantes, rodadas e ajustes finos.
            </Text>
          </View>

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
            {errors.playerCount ? (
              <Text className="text-sm text-arena-danger">{errors.playerCount.message}</Text>
            ) : null}
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
