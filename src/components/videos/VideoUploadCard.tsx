import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { Card3D } from "@/components/ui/Card3D";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  formatImportedVideoSize,
  isLocalVideoImportAvailable,
  pickLocalVideoAsset,
  type ImportedVideoAsset,
} from "@/lib/local-video-assets";
import { normalizeTeamDisplayName } from "@/lib/team-visuals";

interface VideoUploadCardProps {
  onAdd: (input: { title: string; teamName: string; videoAsset: ImportedVideoAsset }) => void;
  teamOptions: string[];
  tournamentName: string;
}

export function VideoUploadCard({
  onAdd,
  teamOptions,
  tournamentName,
}: VideoUploadCardProps) {
  const normalizedTeams = useMemo(
    () => teamOptions.map((team) => normalizeTeamDisplayName(team)),
    [teamOptions],
  );
  const [title, setTitle] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(normalizedTeams[0] ?? "");
  const [selectedVideo, setSelectedVideo] = useState<ImportedVideoAsset | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setSelectedTeam((current) => {
      if (normalizedTeams.length === 0) {
        return "";
      }

      return normalizedTeams.includes(current) ? current : normalizedTeams[0];
    });
  }, [normalizedTeams]);

  async function handlePickVideo() {
    if (!isLocalVideoImportAvailable()) {
      Alert.alert(
        "Importação indisponível",
        "Nesta versão, a importação direta de vídeo está disponível no navegador. No app nativo, o próximo passo é ligar um picker de arquivos com storage.",
      );
      return;
    }

    try {
      setImporting(true);
      const asset = await pickLocalVideoAsset();

      if (asset) {
        setSelectedVideo(asset);
      }
    } catch {
      Alert.alert("Falha ao importar vídeo", "Não foi possível selecionar o arquivo de vídeo.");
    } finally {
      setImporting(false);
    }
  }

  function handleAdd() {
    const safeTitle = title.trim();
    const safeTeam = selectedTeam.trim();

    if (!safeTitle || !safeTeam || !selectedVideo) {
      return;
    }

    onAdd({ title: safeTitle, teamName: safeTeam, videoAsset: selectedVideo });
    setTitle("");
    setSelectedTeam(normalizedTeams[0] ?? "");
    setSelectedVideo(null);
  }

  const previewTitle = title.trim() || "Título do lance";
  const previewTeam = selectedTeam.trim() || "Time do lance";
  const previewMeta = selectedVideo
    ? `${selectedVideo.fileName} • ${formatImportedVideoSize(selectedVideo.fileSizeBytes)}`
    : "Importe um vídeo para ativar a visualização";

  return (
    <Card3D
      accent="obsidian"
      eyebrow="Studio"
      badge={selectedVideo ? "Preview ativo" : "Upload local"}
      title="Importar vídeo"
      subtitle="Visual inspirado em Reels e Shorts para revisar o lance antes de enviar para o Hall da Fama."
      footerLeft={tournamentName}
      footerRight={selectedVideo ? "Pronto para publicar" : "Aguardando mídia"}
      heroNode={
        <LinearGradient
          colors={["#0F0B10", "#120D18", "#1F0E08"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 24,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -32,
              left: -16,
              width: 180,
              height: 180,
              borderRadius: 999,
              backgroundColor: "rgba(255,124,24,0.14)",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: -24,
              bottom: -36,
              width: 200,
              height: 200,
              borderRadius: 999,
              backgroundColor: "rgba(255,84,0,0.16)",
            }}
          />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View
                className="flex-row items-center gap-2 rounded-full px-3 py-2"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <Ionicons name="logo-instagram" size={14} color="#FFD8C1" />
                <Text
                  style={{
                    color: "#FFF0E0",
                    fontSize: 11,
                    fontWeight: "900",
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                  }}
                >
                  Reel
                </Text>
              </View>

              <View
                className="flex-row items-center gap-2 rounded-full px-3 py-2"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <Ionicons name="logo-youtube" size={14} color="#FFD8C1" />
                <Text
                  style={{
                    color: "#FFF0E0",
                    fontSize: 11,
                    fontWeight: "900",
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                  }}
                >
                  Short
                </Text>
              </View>
            </View>

            <View
              className="rounded-full px-3 py-2"
              style={{
                backgroundColor: selectedVideo ? "rgba(255,120,32,0.22)" : "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: selectedVideo ? "rgba(255,180,96,0.30)" : "rgba(255,255,255,0.08)",
              }}
            >
              <Text
                style={{
                  color: selectedVideo ? "#FFF0DB" : "#D5DCEA",
                  fontSize: 10,
                  fontWeight: "900",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {selectedVideo ? "Arquivo ligado" : "Sem mídia"}
              </Text>
            </View>
          </View>

          <View
            style={{
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              backgroundColor: "rgba(5,8,15,0.72)",
              overflow: "hidden",
            }}
          >
            <View
              className="items-center justify-center"
              style={{
                minHeight: 132,
                paddingHorizontal: 16,
                paddingVertical: 18,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                }}
              >
                <Ionicons
                  name={selectedVideo ? "play" : "videocam-outline"}
                  size={selectedVideo ? 28 : 30}
                  color="#FFF4E8"
                  style={{ marginLeft: selectedVideo ? 4 : 0 }}
                />
              </View>

              <Text
                numberOfLines={2}
                style={{
                  marginTop: 14,
                  color: "#FFF3E7",
                  fontSize: 18,
                  fontWeight: "900",
                  textAlign: "center",
                }}
              >
                {previewTitle}
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  marginTop: 6,
                  color: "#FFCE9F",
                  fontSize: 13,
                  fontWeight: "800",
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                {previewTeam}
              </Text>
            </View>

            <View
              className="flex-row items-center justify-between"
              style={{
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.08)",
                paddingHorizontal: 14,
                paddingVertical: 12,
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  color: "#D7DEE9",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {previewMeta}
              </Text>

              <View
                className="ml-3 rounded-full px-3 py-2"
                style={{
                  backgroundColor: "rgba(255,120,32,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(255,180,96,0.24)",
                }}
              >
                <Text
                  style={{
                    color: "#FFF0DB",
                    fontSize: 10,
                    fontWeight: "900",
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                  }}
                >
                  Preview
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <View
              className="rounded-full px-3 py-2"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text
                style={{
                  color: "#FFF0E0",
                  fontSize: 11,
                  fontWeight: "800",
                }}
              >
                Hall da Fama
              </Text>
            </View>

            <View
              className="rounded-full px-3 py-2"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text
                style={{
                  color: "#FFD29E",
                  fontSize: 11,
                  fontWeight: "800",
                }}
              >
                {selectedVideo ? formatImportedVideoSize(selectedVideo.fileSizeBytes) : "Upload pendente"}
              </Text>
            </View>
          </View>
        </LinearGradient>
      }
      content={
        <View className="gap-4">
          <View
            className="gap-3 rounded-[22px] p-4"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text className="text-xs font-extrabold uppercase tracking-[1.8px] text-[#FFCF9A]">
              Nome do lance
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex.: Gol no ângulo aos 92"
              placeholderTextColor="#8D97AD"
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                backgroundColor: "rgba(8,11,18,0.78)",
                color: "#F4F7FF",
                fontSize: 15,
                fontWeight: "700",
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            />
          </View>

          <View
            className="gap-3 rounded-[22px] p-4"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text className="text-xs font-extrabold uppercase tracking-[1.8px] text-[#FFCF9A]">
              Time do lance
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {normalizedTeams.map((team) => {
                const selected = selectedTeam === team;

                return (
                  <Pressable
                    key={team}
                    onPress={() => setSelectedTeam(team)}
                    className="rounded-full border px-4 py-2 active:opacity-80"
                    style={{
                      borderColor: selected ? "rgba(255,180,96,0.34)" : "rgba(255,255,255,0.10)",
                      backgroundColor: selected ? "rgba(255,112,26,0.18)" : "rgba(9,12,18,0.72)",
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? "#FFF0DB" : "#D9E1F0",
                        fontSize: 12,
                        fontWeight: "800",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {team}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-3">
            <PrimaryButton
              label={importing ? "Importando..." : selectedVideo ? "Trocar vídeo" : "Importar vídeo"}
              onPress={handlePickVideo}
              disabled={importing}
              variant="secondary"
              className="w-full rounded-[18px] py-3"
            />

            <View
              className="rounded-[18px] border px-4 py-3"
              style={{
                borderColor: selectedVideo ? "rgba(255,180,96,0.28)" : "rgba(255,255,255,0.08)",
                backgroundColor: selectedVideo ? "rgba(255,120,32,0.10)" : "rgba(255,255,255,0.04)",
              }}
            >
              <Text
                style={{
                  color: selectedVideo ? "#FFF0DB" : "#BFC9DE",
                  fontSize: 13,
                  lineHeight: 20,
                  fontWeight: "700",
                }}
              >
                {selectedVideo
                  ? `Arquivo conectado: ${selectedVideo.fileName} • ${formatImportedVideoSize(selectedVideo.fileSizeBytes)}`
                  : "Nenhum vídeo importado ainda. Selecione um arquivo antes de salvar o card."}
              </Text>
            </View>
          </View>

          <PrimaryButton
            label="Salvar vídeo"
            onPress={handleAdd}
            disabled={!title.trim() || !selectedTeam.trim() || !selectedVideo}
            variant="light"
            className="w-full rounded-[18px] py-3"
          />

          <Text className="text-sm leading-6 text-[#AEBBDA]">
            O envio continua local para o campeonato ativo {tournamentName}. O ajuste aqui foi visual e de fluxo de preview, não uma integração externa real com Instagram ou YouTube.
          </Text>
        </View>
      }
    />
  );
}
