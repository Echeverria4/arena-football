import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, Pressable, Switch, Text, TextInput, View } from "react-native";
import { z } from "zod";

import { TeamPickerModal } from "@/components/tournament/TeamPickerModal";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { classificationCriteriaOptions, tournamentFormats } from "@/lib/constants";
import { getNextSeasonLabel } from "@/lib/season-tournaments";
import type { TeamItem } from "@/lib/team-data";
import { getTeamInitials, resolveTeamVisual } from "@/lib/team-visuals";
import { buildInitialCampeonato } from "@/lib/tournament-setup";
import { classificationCriterionSchema } from "@/lib/validations";
import { useAppStore } from "@/stores/app-store";
import { useTournamentStore } from "@/stores/tournament-store";

const tournamentCreateSchema = z.object({
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

type TournamentCreateValues = z.infer<typeof tournamentCreateSchema>;

type DraftParticipant = {
  nome: string;
  time: string;
  whatsapp: string;
  timeImagem?: string;
  timeTipoIcone?: "bandeira" | "escudo";
};

function StepDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View className="flex-row items-center justify-center gap-2 py-2">
      {([1, 2, 3] as const).map((s) => (
        <View
          key={s}
          style={{
            width: s === step ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor:
              s === step ? "#57FF7C" : s < step ? "#3B5BFF" : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </View>
  );
}

function TeamBadge({
  imageUri,
  name,
  tipoIcone,
}: {
  imageUri?: string;
  name: string;
  tipoIcone?: "bandeira" | "escudo";
}) {
  const [failed, setFailed] = useState(false);
  const size = tipoIcone === "escudo" ? 28 : 36;

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(59,91,255,0.12)",
        borderWidth: 1,
        borderColor: "rgba(59,91,255,0.28)",
      }}
    >
      {imageUri && !failed ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ color: "#9AB8FF", fontSize: 11, fontWeight: "900" }}>
          {getTeamInitials(name)}
        </Text>
      )}
    </View>
  );
}

export default function TournamentCreateScreen() {
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const adicionarCampeonato = useTournamentStore((state) => state.adicionarCampeonato);
  const setCurrentTournamentId = useAppStore((state) => state.setCurrentTournamentId);
  const nextSeasonLabel = getNextSeasonLabel(campeonatos);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1Values, setStep1Values] = useState<TournamentCreateValues | null>(null);
  const [draftParticipants, setDraftParticipants] = useState<DraftParticipant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step2Touched, setStep2Touched] = useState(false);
  const [pickerOpenForIndex, setPickerOpenForIndex] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TournamentCreateValues>({
    resolver: zodResolver(tournamentCreateSchema),
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

  function handleBackPress() {
    if (step === 2) { setStep2Touched(false); setStep(1); return; }
    if (step === 3) { setStep(2); return; }
    if (router.canGoBack()) { router.back(); return; }
    router.replace("/tournaments");
  }

  function toggleClassificationCriterion(
    value: TournamentCreateValues["classificationCriteria"][number],
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

  function handleStep1Next(values: TournamentCreateValues) {
    const count = Math.max(2, Number(values.playerCount) || 2);
    setStep1Values(values);
    setDraftParticipants((prev) =>
      Array.from({ length: count }, (_, i) => ({
        nome: prev[i]?.nome ?? `Jogador ${String(i + 1).padStart(2, "0")}`,
        time: prev[i]?.time ?? `Time ${String(i + 1).padStart(2, "0")}`,
        whatsapp: prev[i]?.whatsapp ?? "",
        timeImagem: prev[i]?.timeImagem,
        timeTipoIcone: prev[i]?.timeTipoIcone,
      })),
    );
    setStep(2);
  }

  function updateParticipant(index: number, field: keyof DraftParticipant, value: string) {
    setDraftParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  function handleTeamSelect(index: number, team: TeamItem) {
    const visualUri = resolveTeamVisual(team) ?? undefined;
    setDraftParticipants((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, time: team.nome, timeImagem: visualUri, timeTipoIcone: team.tipoIcone }
          : p,
      ),
    );
    setPickerOpenForIndex(null);
  }

  function isParticipantIncomplete(p: DraftParticipant) {
    return !p.nome.trim() || !p.time.trim();
  }

  function handleStep2Next() {
    setStep2Touched(true);
    const hasIncomplete = draftParticipants.some(isParticipantIncomplete);
    if (hasIncomplete) return;
    setStep(3);
  }

  async function onSubmit() {
    if (!step1Values) return;
    setIsSubmitting(true);
    try {
      const tournamentId = `campeonato-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const createdAt = new Date().toISOString();

      const campeonato = buildInitialCampeonato({
        id: tournamentId,
        name: step1Values.name,
        createdAt,
        seasonLabel: nextSeasonLabel,
        format: step1Values.format,
        matchMode: "single_game",
        rules: step1Values.rules,
        classificationCriteria: step1Values.classificationCriteria,
        allowVideos: step1Values.allowVideos,
        allowGoalAward: step1Values.allowGoalAward,
        playerCount: step1Values.playerCount,
      });

      const updatedParticipantes = campeonato.participantes.map((autoP, i) => {
        const draft = draftParticipants[i];
        if (!draft) return autoP;
        return {
          ...autoP,
          nome: draft.nome.trim() || autoP.nome,
          time: draft.time.trim() || autoP.time,
          whatsapp: draft.whatsapp.trim() || undefined,
          timeImagem: draft.timeImagem,
          timeTipoIcone: draft.timeTipoIcone,
        };
      });

      const updatedClassificacao = campeonato.classificacao.map((entry) => {
        const p = updatedParticipantes.find((part) => part.id === entry.participanteId);
        if (!p) return entry;
        return { ...entry, nome: p.nome, time: p.time };
      });

      const finalCampeonato = {
        ...campeonato,
        participantes: updatedParticipantes,
        classificacao: updatedClassificacao,
      };

      adicionarCampeonato(finalCampeonato);
      setCurrentTournamentId(tournamentId);
      router.replace({ pathname: "/tournament/[id]", params: { id: tournamentId } });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 1: Tournament identity ─────────────────────────────────────────────
  if (step === 1) {
    return (
      <Screen scroll className="px-6">
        <View className="gap-8 py-8">
          <BackButton onPress={handleBackPress} />
          <StepDots step={1} />

          <SectionHeader
            eyebrow="Etapa 1 de 3 — Identidade"
            title="Nova temporada"
            subtitle="Monte a estrutura base do campeonato. Os jogadores e a confirmação vêm nos próximos passos."
          />

          {/* Season preview card */}
          <View
            className="gap-3 rounded-[28px] border px-5 py-5"
            style={{ borderColor: "rgba(59,91,255,0.18)", backgroundColor: "#EFF4FF" }}
          >
            <Text style={{ color: "#5678C9", fontSize: 11, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase" }}>
              Próximo ciclo
            </Text>
            <Text style={{ color: "#1C2B4A", fontSize: 28, fontWeight: "900" }}>
              {nextSeasonLabel}
            </Text>
            <Text style={{ color: "#6B7EA3", fontSize: 15, lineHeight: 24 }}>
              Ao concluir as 3 etapas, o campeonato abre com painel, rodadas e compartilhamento prontos.
            </Text>
          </View>

          <View className="gap-4 rounded-[28px] border border-arena-line bg-arena-card p-5">
            {/* Name */}
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

            {/* Format */}
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

            {/* Player count */}
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

            {/* Rules */}
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

            {/* Classification criteria */}
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
                Toque para ativar ou remover os criterios de classificacao.
              </Text>
              {errors.classificationCriteria ? (
                <Text className="mt-3 text-sm text-arena-danger">
                  {errors.classificationCriteria.message}
                </Text>
              ) : null}
            </View>

            {/* Allow videos */}
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

            {/* Allow goal award */}
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
              label="Proximo: Jogadores"
              onPress={handleSubmit(handleStep1Next)}
              className="self-center px-8"
            />
          </View>
        </View>
      </Screen>
    );
  }

  // ── Step 2: Players ─────────────────────────────────────────────────────────
  if (step === 2) {
    const incompleteCount = draftParticipants.filter(isParticipantIncomplete).length;
    const allComplete = incompleteCount === 0;

    // Teams already chosen by OTHER participants (to lock in picker)
    const lockedTeamNames = draftParticipants
      .filter((_, i) => i !== pickerOpenForIndex)
      .map((p) => p.time)
      .filter(Boolean);

    return (
      <Screen scroll className="px-6">
        <View className="gap-8 py-8">
          <BackButton onPress={handleBackPress} />
          <StepDots step={2} />

          <SectionHeader
            eyebrow="Etapa 2 de 3 — Jogadores"
            title="Registrar participantes"
            subtitle={`Preencha nome e time de cada jogador. Use o botão de escudo para escolher o time pelo catálogo de continentes. WhatsApp é opcional.`}
          />

          {/* Global error banner */}
          {step2Touched && !allComplete ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: "rgba(212,79,98,0.12)",
                borderWidth: 1,
                borderColor: "rgba(212,79,98,0.30)",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <Text style={{ fontSize: 18 }}>⚠️</Text>
              <Text style={{ flex: 1, color: "#FF8A97", fontSize: 14, fontWeight: "700", lineHeight: 20 }}>
                {incompleteCount === 1
                  ? "1 participante ainda está sem nome ou time."
                  : `${incompleteCount} participantes ainda estão sem nome ou time.`}
                {"\n"}
                <Text style={{ fontWeight: "400", color: "#AEBBDA" }}>
                  Preencha os campos obrigatórios antes de continuar.
                </Text>
              </Text>
            </View>
          ) : null}

          <View className="gap-4">
            {draftParticipants.map((participant, index) => {
              const incomplete = step2Touched && isParticipantIncomplete(participant);
              const missingNome = step2Touched && !participant.nome.trim();
              const missingTime = step2Touched && !participant.time.trim();
              const hasTeamFromCatalog = Boolean(participant.timeImagem);

              return (
                <View
                  key={index}
                  style={{
                    gap: 12,
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: incomplete
                      ? "rgba(212,79,98,0.45)"
                      : "rgba(255,255,255,0.08)",
                    backgroundColor: incomplete
                      ? "rgba(212,79,98,0.05)"
                      : "#0E171E",
                    padding: 16,
                  }}
                >
                  {/* Slot header */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: incomplete
                          ? "rgba(212,79,98,0.18)"
                          : "rgba(59,91,255,0.14)",
                      }}
                    >
                      <Text
                        style={{
                          color: incomplete ? "#FF8A97" : "#9AB8FF",
                          fontSize: 13,
                          fontWeight: "900",
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                    </View>
                    <Text style={{ color: "#F3F7FF", fontSize: 14, fontWeight: "700", flex: 1 }}>
                      Jogador {String(index + 1).padStart(2, "0")}
                    </Text>
                    {incomplete ? (
                      <Text style={{ color: "#FF8A97", fontSize: 12, fontWeight: "700" }}>
                        Incompleto
                      </Text>
                    ) : null}
                  </View>

                  {/* Nome */}
                  <View style={{ gap: 4 }}>
                    <TextInput
                      style={{
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: missingNome
                          ? "rgba(212,79,98,0.60)"
                          : "rgba(255,255,255,0.10)",
                        backgroundColor: missingNome
                          ? "rgba(212,79,98,0.08)"
                          : "#132028",
                        color: "#F3F7FF",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        fontSize: 15,
                      }}
                      placeholder="Nome do jogador *"
                      placeholderTextColor={missingNome ? "#FF8A97" : "#7481A2"}
                      autoCapitalize="words"
                      value={participant.nome}
                      onChangeText={(v) => updateParticipant(index, "nome", v)}
                    />
                    {missingNome ? (
                      <Text style={{ color: "#FF8A97", fontSize: 12, fontWeight: "600", paddingLeft: 4 }}>
                        Nome obrigatório
                      </Text>
                    ) : null}
                  </View>

                  {/* Time — campo + botão catálogo */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {/* Badge do time selecionado pelo catálogo */}
                      {hasTeamFromCatalog ? (
                        <TeamBadge
                          imageUri={participant.timeImagem}
                          name={participant.time}
                          tipoIcone={participant.timeTipoIcone}
                        />
                      ) : null}

                      <TextInput
                        style={{
                          flex: 1,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: missingTime
                            ? "rgba(212,79,98,0.60)"
                            : hasTeamFromCatalog
                              ? "rgba(59,91,255,0.35)"
                              : "rgba(255,255,255,0.10)",
                          backgroundColor: missingTime
                            ? "rgba(212,79,98,0.08)"
                            : hasTeamFromCatalog
                              ? "rgba(59,91,255,0.08)"
                              : "#132028",
                          color: "#F3F7FF",
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          fontSize: 15,
                        }}
                        placeholder="Nome do time *"
                        placeholderTextColor={missingTime ? "#FF8A97" : "#7481A2"}
                        autoCapitalize="words"
                        value={participant.time}
                        onChangeText={(v) => {
                          updateParticipant(index, "time", v);
                          // Clear catalog data when user types manually
                          setDraftParticipants((prev) =>
                            prev.map((p, i) =>
                              i === index
                                ? { ...p, time: v, timeImagem: undefined, timeTipoIcone: undefined }
                                : p,
                            ),
                          );
                        }}
                      />

                      {/* Botão abrir catálogo */}
                      <Pressable
                        onPress={() => setPickerOpenForIndex(index)}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(59,91,255,0.14)",
                          borderWidth: 1,
                          borderColor: "rgba(59,91,255,0.32)",
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>🌍</Text>
                      </Pressable>
                    </View>

                    {missingTime ? (
                      <Text style={{ color: "#FF8A97", fontSize: 12, fontWeight: "600", paddingLeft: 4 }}>
                        Time obrigatório
                      </Text>
                    ) : hasTeamFromCatalog ? (
                      <Text style={{ color: "#6B8FD4", fontSize: 11, paddingLeft: 4 }}>
                        Time selecionado do catálogo
                      </Text>
                    ) : null}
                  </View>

                  {/* WhatsApp (opcional) */}
                  <TextInput
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.10)",
                      backgroundColor: "#132028",
                      color: "#F3F7FF",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 15,
                    }}
                    placeholder="WhatsApp (opcional) +55 11 99999-0000"
                    placeholderTextColor="#7481A2"
                    keyboardType="phone-pad"
                    value={participant.whatsapp}
                    onChangeText={(v) =>
                      updateParticipant(index, "whatsapp", v.replace(/[^\d+\-()\s]/g, ""))
                    }
                  />
                </View>
              );
            })}
          </View>

          <View className="flex-row gap-3 pb-4">
            <PrimaryButton
              label="Voltar"
              variant="secondary"
              onPress={handleBackPress}
              className="flex-1"
            />
            <PrimaryButton
              label="Próximo: Confirmar"
              onPress={handleStep2Next}
              className="flex-1"
            />
          </View>
        </View>

        {/* Team picker modal */}
        <TeamPickerModal
          visible={pickerOpenForIndex !== null}
          lockedTeamNames={lockedTeamNames}
          onClose={() => setPickerOpenForIndex(null)}
          onSelect={(team) => {
            if (pickerOpenForIndex !== null) {
              handleTeamSelect(pickerOpenForIndex, team);
            }
          }}
        />
      </Screen>
    );
  }

  // ── Step 3: Confirmation ────────────────────────────────────────────────────
  const vals = step1Values!;
  const formatLabel =
    tournamentFormats.find((f) => f.value === vals.format)?.label ?? vals.format;

  return (
    <Screen scroll className="px-6">
      <View className="gap-8 py-8">
        <BackButton onPress={handleBackPress} />
        <StepDots step={3} />

        <SectionHeader
          eyebrow="Etapa 3 de 3 — Confirmacao"
          title="Pronto para criar?"
          subtitle="Revise o resumo abaixo antes de finalizar. Voce ainda pode ajustar qualquer detalhe depois no painel."
        />

        {/* Tournament summary */}
        <View className="gap-4 rounded-[28px] border border-arena-line bg-arena-card p-5">
          <View className="gap-1">
            <Text className="text-xs font-black uppercase tracking-[2px] text-[#5678C9]">
              Campeonato
            </Text>
            <Text className="text-2xl font-black text-arena-text">{vals.name}</Text>
            <Text className="text-sm text-arena-muted">{nextSeasonLabel}</Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full border border-arena-line bg-arena-surface px-3 py-1">
              <Text className="text-xs font-bold text-arena-muted">{formatLabel}</Text>
            </View>
            <View className="rounded-full border border-arena-line bg-arena-surface px-3 py-1">
              <Text className="text-xs font-bold text-arena-muted">
                {vals.playerCount} jogadores
              </Text>
            </View>
            {vals.allowVideos ? (
              <View className="rounded-full border border-arena-line bg-arena-surface px-3 py-1">
                <Text className="text-xs font-bold text-arena-muted">Videos ativados</Text>
              </View>
            ) : null}
            {vals.allowGoalAward ? (
              <View className="rounded-full border border-arena-line bg-arena-surface px-3 py-1">
                <Text className="text-xs font-bold text-arena-muted">Gol mais bonito</Text>
              </View>
            ) : null}
          </View>

          <View className="rounded-2xl border border-arena-line bg-arena-surface px-4 py-3">
            <Text className="mb-2 text-xs font-black uppercase tracking-[2px] text-arena-muted">
              Regras
            </Text>
            <Text className="text-sm leading-6 text-arena-text" numberOfLines={3}>
              {vals.rules}
            </Text>
          </View>
        </View>

        {/* Players summary */}
        <View className="gap-3 rounded-[28px] border border-arena-line bg-arena-card p-5">
          <Text className="text-xs font-black uppercase tracking-[2px] text-[#5678C9]">
            Jogadores ({draftParticipants.length})
          </Text>

          {draftParticipants.slice(0, 8).map((p, i) => (
            <View
              key={i}
              className="flex-row items-center gap-3 border-b border-arena-line py-2"
              style={{ borderBottomWidth: i < Math.min(7, draftParticipants.length - 1) ? 1 : 0 }}
            >
              <Text
                className="text-xs font-black text-arena-muted"
                style={{ width: 24 }}
              >
                {String(i + 1).padStart(2, "0")}
              </Text>
              {p.timeImagem ? (
                <TeamBadge imageUri={p.timeImagem} name={p.time} tipoIcone={p.timeTipoIcone} />
              ) : null}
              <Text className="flex-1 text-sm font-semibold text-arena-text">
                {p.nome || `Jogador ${String(i + 1).padStart(2, "0")}`}
              </Text>
              <Text className="text-sm text-arena-muted">
                {p.time || `Time ${String(i + 1).padStart(2, "0")}`}
              </Text>
            </View>
          ))}

          {draftParticipants.length > 8 ? (
            <Text className="text-sm text-arena-muted">
              + {draftParticipants.length - 8} jogadores adicionais
            </Text>
          ) : null}
        </View>

        <View className="flex-row gap-3 pb-4">
          <PrimaryButton
            label="Voltar"
            variant="secondary"
            onPress={handleBackPress}
            className="flex-1"
          />
          <PrimaryButton
            label={isSubmitting ? "Criando..." : "Criar campeonato"}
            onPress={onSubmit}
            disabled={isSubmitting}
            className="flex-1"
          />
        </View>
      </View>
    </Screen>
  );
}
