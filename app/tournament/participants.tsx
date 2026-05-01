import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Image, Text, TextInput, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { ChoiceChip } from "@/components/ui/ChoiceChip";
import { LiveBorderCard } from "@/components/ui/LiveBorderCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Screen } from "@/components/ui/Screen";
import { ScreenState } from "@/components/ui/ScreenState";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { usePanelGrid } from "@/components/ui/usePanelGrid";
import { canEditTournament, useTournamentAccessMode } from "@/lib/tournament-access";
import { formatPhone } from "@/lib/formatters";
import { getTeamInitials, normalizeTeamDisplayName, resolveTeamVisualByName } from "@/lib/team-visuals";
import { getTournamentBundle } from "@/lib/tournament-display";
import { validateBrazilianPhone } from "@/lib/validations";
import { updateParticipantDisplay } from "@/services/participants";
import { useTournamentStore } from "@/stores/tournament-store";
import { useTournamentDataHydrated } from "@/stores/use-arena-hydration";
import { useVideoStore } from "@/stores/video-store";

function sanitizeWhatsappInput(value: string) {
  return value.replace(/[^\d+\-()\s]/g, "");
}

export default function TournamentParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campeonatos = useTournamentStore((state) => state.campeonatos);
  const atualizarCampeonato = useTournamentStore((state) => state.atualizarCampeonato);
  const videos = useVideoStore((state) => state.videos);
  const hydrated = useTournamentDataHydrated();
  const accessMode = useTournamentAccessMode(id);
  const canManageTournament = canEditTournament(accessMode);
  const bundle = id ? getTournamentBundle(id, campeonatos, videos) : null;
  const { contentMaxWidth } = usePanelGrid();
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftWhatsapp, setDraftWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  if (!hydrated) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View className="w-full self-center py-8" style={{ maxWidth: contentMaxWidth }}>
          <ScreenState
            title="Carregando participantes"
            description="Sincronizando jogadores e equipes reais da temporada."
          />
        </View>
      </Screen>
    );
  }

  if (!bundle) {
    return (
      <Screen scroll ambientDiamond className="px-6">
        <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
          <BackButton fallbackHref="/tournaments" />
          <ScreenState
            title="Campeonato nao encontrado"
            description="Nao existe mais uma temporada valida para listar os participantes."
          />
        </View>
      </Screen>
    );
  }

  const standingsByParticipantId = new Map(
    bundle.standings.map((entry, index) => [entry.participantId, { entry, position: index + 1 }]),
  );
  const rawParticipantsById = new Map(
    bundle.campeonato.participantes.map((participant) => [participant.id, participant]),
  );
  const activeBundle = bundle;

  function startParticipantEdit(participantId: string) {
    const participant = rawParticipantsById.get(participantId);

    if (!participant) {
      return;
    }

    setEditingParticipantId(participantId);
    setDraftName(participant.nome);
    setDraftWhatsapp(participant.whatsapp ?? "");
  }

  function cancelParticipantEdit() {
    setEditingParticipantId(null);
    setDraftName("");
    setDraftWhatsapp("");
  }

  async function saveParticipantReplacement() {
    if (!editingParticipantId) {
      return;
    }

    const nextName = draftName.trim();
    const nextWhatsapp = draftWhatsapp.trim();
    const nextWhatsappDigits = nextWhatsapp.replace(/\D/g, "");

    if (nextName.length < 3) {
      Alert.alert("Nome invalido", "Informe pelo menos 3 caracteres para identificar o novo jogador.");
      return;
    }

    const phoneError = validateBrazilianPhone(nextWhatsapp);
    if (phoneError) {
      Alert.alert("WhatsApp inválido", phoneError);
      return;
    }

    setSaving(true);
    try {
      await updateParticipantDisplay(editingParticipantId, {
        displayName: nextName,
        phone: nextWhatsapp || undefined,
      });
    } catch {
      // Silent fail — local store update below ensures offline functionality.
    } finally {
      setSaving(false);
    }

    atualizarCampeonato(activeBundle.campeonato.id, {
      participantes: activeBundle.campeonato.participantes.map((participant) =>
        participant.id === editingParticipantId
          ? {
              ...participant,
              nome: nextName,
              whatsapp: nextWhatsapp || undefined,
            }
          : participant,
      ),
      classificacao: activeBundle.campeonato.classificacao.map((entry) =>
        entry.participanteId === editingParticipantId
          ? {
              ...entry,
              nome: nextName,
            }
          : entry,
      ),
    });

    Alert.alert(
      "Jogador atualizado",
      "A vaga foi substituida sem alterar time, rodadas, pontuacao ou historico do campeonato.",
    );

    cancelParticipantEdit();
  }

  return (
    <Screen scroll ambientDiamond className="px-6">
      <View className="w-full self-center gap-6 py-8" style={{ maxWidth: contentMaxWidth }}>
        <BackButton fallbackHref={{ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } }} />

        <SectionHeader
          eyebrow="Participantes"
          title={`Jogadores de ${bundle.tournament.name}`}
        />

        <ScrollRow>
          <ChoiceChip
            label="Painel"
            onPress={() => router.push({ pathname: "/tournament/[id]", params: { id: bundle.campeonato.id } })}
          />
          <ChoiceChip label="Participantes" active />
          <ChoiceChip
            label="Jogos"
            onPress={() => router.push({ pathname: "/tournament/matches", params: { id: bundle.campeonato.id } })}
          />
          <ChoiceChip
            label="Classificacao"
            onPress={() => router.push({ pathname: "/tournament/standings", params: { id: bundle.campeonato.id } })}
          />
          <ChoiceChip
            label="Estatisticas"
            onPress={() =>
              router.push({ pathname: "/tournament/statistics", params: { id: bundle.campeonato.id } })
            }
          />
          <ChoiceChip
            label="Videos"
            onPress={() => router.push({ pathname: "/tournament/videos", params: { id: bundle.campeonato.id } })}
          />
        </ScrollRow>

        <RevealOnScroll delay={0}>
          <LiveBorderCard
            accent={canManageTournament ? "blue" : "gold"}
            radius={18}
            padding={1.3}
            backgroundColor="#09121C"
          >
            <View className="flex-row items-center gap-3 px-5 py-4">
              <Ionicons
                name={canManageTournament ? "swap-horizontal-outline" : "eye-outline"}
                size={18}
                color={canManageTournament ? "#9AB8FF" : "#FFD76A"}
              />
              <Text
                className="text-sm font-black text-[#F3F7FF]"
              >
                {canManageTournament
                  ? "Trocar jogador sem refazer o campeonato"
                  : "Elenco em modo leitura"}
              </Text>
            </View>
          </LiveBorderCard>
        </RevealOnScroll>

        {bundle.participants.length > 0 ? (
          <View className="gap-5">
            {bundle.participants.map((participant, index) => {
              const standingContext = standingsByParticipantId.get(participant.id);
              const standing = standingContext?.entry;
              const teamName = normalizeTeamDisplayName(participant.teamName);
              const rawParticipant = rawParticipantsById.get(participant.id);
              const isEditing = editingParticipantId === participant.id;
              const accent = isEditing ? "emerald" : participant.isOrganizer ? "gold" : "blue";
              const phoneLabel = rawParticipant?.whatsapp
                ? formatPhone(rawParticipant.whatsapp)
                : "WhatsApp nao informado";

              return (
                <RevealOnScroll key={participant.id} delay={index * 45}>
                  <LiveBorderCard accent={accent} radius={18} padding={1.3} backgroundColor="#09121C">
                    <View className="gap-3 p-4">
                      <View className="flex-row items-center gap-3">
                        <View
                          className="items-center justify-center rounded-[16px]"
                          style={{
                            width: 52,
                            height: 52,
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderWidth: 1,
                            borderColor: isEditing
                              ? "rgba(118,255,169,0.24)"
                              : "rgba(154,184,255,0.16)",
                            overflow: "hidden",
                          }}
                        >
                          {(() => {
                            const crest = resolveTeamVisualByName(teamName);
                            if (crest) {
                              return (
                                <Image
                                  source={{ uri: crest }}
                                  style={{ width: "90%", height: "90%" }}
                                  resizeMode="contain"
                                />
                              );
                            }
                            if (teamName && teamName !== "A definir") {
                              return (
                                <Text style={{ color: "#9AB8FF", fontSize: 16, fontWeight: "900", letterSpacing: 1 }}>
                                  {getTeamInitials(teamName)}
                                </Text>
                              );
                            }
                            return (
                              <Ionicons
                                name={participant.isOrganizer ? "shield-outline" : "person-outline"}
                                size={34}
                                color={isEditing ? "#7BFFAF" : participant.isOrganizer ? "#FFD76A" : "#9AB8FF"}
                              />
                            );
                          })()}
                        </View>

                        <View className="flex-1 gap-1">
                          <Text className="text-base font-black text-[#F3F7FF]">
                            {participant.displayName}
                          </Text>
                          <Text className="text-sm text-[#AEBBDA]">{teamName}</Text>
                          <Text style={{ fontSize: 11, color: "#8EA4CE" }}>{phoneLabel}</Text>

                          <View className="flex-row flex-wrap gap-2">
                            <Badge label={participant.groupName ?? "liga principal"} tone="royal" />
                            {standing ? <Badge label={`${standing.points} pts`} tone="muted" /> : null}
                          </View>
                        </View>
                      </View>

                      <View className="flex-row gap-2">
                        {[
                          { label: "Posição", value: standingContext?.position ? `${standingContext.position}º` : "--" },
                          { label: "Vitórias", value: `${standing?.wins ?? 0}V` },
                          { label: "Saldo", value: standing ? `${standing.goalDifference >= 0 ? "+" : ""}${standing.goalDifference}` : "+0" },
                        ].map((stat) => (
                          <View
                            key={stat.label}
                            style={{
                              flex: 1,
                              borderRadius: 12,
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              borderWidth: 1,
                              borderColor: "rgba(154,184,255,0.12)",
                              backgroundColor: "rgba(255,255,255,0.04)",
                            }}
                          >
                            <Text style={{ color: "#8EA4CE", fontSize: 8, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" }}>
                              {stat.label}
                            </Text>
                            <Text style={{ color: "#F3F7FF", fontSize: 18, fontWeight: "900", marginTop: 4 }}>
                              {stat.value}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {canManageTournament ? (
                        <View
                          className="gap-4 rounded-[20px] px-4 py-4"
                          style={{
                            borderWidth: 1,
                            borderColor: isEditing
                              ? "rgba(118,255,169,0.24)"
                              : "rgba(154,184,255,0.14)",
                            backgroundColor: isEditing
                              ? "rgba(17,45,31,0.76)"
                              : "rgba(255,255,255,0.05)",
                          }}
                        >
                          <View className="flex-row items-center justify-between gap-3">
                            <Text
                              className="text-xs font-black uppercase tracking-[2px]"
                              style={{ color: isEditing ? "#CFFFD9" : "#D7E5FF" }}
                            >
                              Substituicao
                            </Text>

                            {!isEditing ? (
                              <PrimaryButton
                                label="Editar"
                                size="sm"
                                variant="light"
                                onPress={() => startParticipantEdit(participant.id)}
                                className="self-start"
                              />
                            ) : null}
                          </View>

                          {isEditing ? (
                            <View className="gap-3">
                              <View className="gap-2">
                                <Text className="text-sm font-semibold text-[#F3F7FF]">
                                  Nome do novo jogador
                                </Text>
                                <TextInput
                                  className="rounded-2xl px-4 py-4"
                                  style={{
                                    backgroundColor: "rgba(6,12,24,0.82)",
                                    borderWidth: 1,
                                    borderColor: "rgba(118,255,169,0.22)",
                                    color: "#F3F7FF",
                                  }}
                                  placeholder="Nome do jogador"
                                  placeholderTextColor="#7E8FAF"
                                  autoCapitalize="words"
                                  value={draftName}
                                  onChangeText={setDraftName}
                                />
                              </View>

                              <View className="gap-2">
                                <Text className="text-sm font-semibold text-[#F3F7FF]">
                                  WhatsApp do novo jogador
                                </Text>
                                <TextInput
                                  className="rounded-2xl px-4 py-4"
                                  style={{
                                    backgroundColor: "rgba(6,12,24,0.82)",
                                    borderWidth: 1,
                                    borderColor: "rgba(118,255,169,0.22)",
                                    color: "#F3F7FF",
                                  }}
                                  placeholder="55 67 9 1234-5678 (13 dígitos)"
                                  placeholderTextColor="#7E8FAF"
                                  keyboardType="phone-pad"
                                  value={draftWhatsapp}
                                  onChangeText={(value) => setDraftWhatsapp(sanitizeWhatsappInput(value))}
                                />
                              </View>

                              <View className="flex-row flex-wrap gap-3">
                                <PrimaryButton
                                  label={saving ? "Salvando..." : "Salvar substituicao"}
                                  size="sm"
                                  onPress={saveParticipantReplacement}
                                  disabled={saving}
                                  className="self-start"
                                />
                                <PrimaryButton
                                  label="Cancelar"
                                  size="sm"
                                  variant="secondary"
                                  onPress={cancelParticipantEdit}
                                  className="self-start"
                                />
                              </View>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </LiveBorderCard>
                </RevealOnScroll>
              );
            })}
          </View>
        ) : (
          <ScreenState
            title="Participantes indisponiveis"
            description="Este campeonato ainda nao possui jogadores consistentes para montar a lista. Revise a estrutura da temporada ou recrie o campeonato se ele foi salvo durante o bug anterior."
          />
        )}
      </View>
    </Screen>
  );
}
