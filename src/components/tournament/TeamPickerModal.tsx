import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { NeonFrame } from "@/components/ui/NeonFrame";
import {
  teamCatalog,
  type ContinentItem,
  type LeagueItem,
  type TeamItem,
  type TeamMode,
} from "@/lib/team-data";
import {
  getConfederationIcon,
  getTeamInitials,
  resolveTeamVisual,
  slugify,
} from "@/lib/team-visuals";

type Step = "continente" | "tipo" | "categoria" | "time";

type Props = {
  visible: boolean;
  lockedTeamNames?: string[];
  restrictedPool?: {
    label: string;
    description: string;
    teams: TeamItem[];
  } | null;
  onClose: () => void;
  onSelect: (team: TeamItem) => void;
};

function VisualToken({
  imageUri,
  name,
  imageWidth,
  imageHeight,
  fallbackSize,
  fallbackColor,
}: {
  imageUri?: string;
  name: string;
  imageWidth: number;
  imageHeight: number;
  fallbackSize: number;
  fallbackColor: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageUri && !imageFailed) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={{ width: imageWidth, height: imageHeight }}
        resizeMode="contain"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <Text
      style={{
        fontSize: fallbackSize,
        color: fallbackColor,
        fontWeight: "900",
        letterSpacing: 1.2,
      }}
    >
      {getTeamInitials(name)}
    </Text>
  );
}

function EmptyStage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 28,
        backgroundColor: "#0E1730",
      }}
    >
      <Text style={{ color: "#F3F7FF", fontSize: 18, fontWeight: "800" }}>
        {title}
      </Text>
      <Text
        style={{
          marginTop: 8,
          color: "#90A0C0",
          fontSize: 14,
          lineHeight: 22,
        }}
      >
        {description}
      </Text>
    </View>
  );
}

function ContinentCard({
  item,
  onPress,
}: {
  item: ContinentItem;
  onPress: () => void;
}) {
  const [hover, setHover] = useState(false);
  const iconSource = getConfederationIcon(item.id, hover ? "color" : "gray");

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        width: 180,
        minHeight: 190,
        position: "relative",
        overflow: "hidden",
        backgroundColor: hover ? "#162344" : "#111A32",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 110,
          height: 110,
          top: -22,
          left: -18,
          borderRadius: 999,
          backgroundColor: "#3B5BFF",
          opacity: hover ? 0.16 : 0.08,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          right: -24,
          bottom: -30,
          borderRadius: 999,
          backgroundColor: "#5F86FF",
          opacity: hover ? 0.12 : 0.05,
        }}
      />

      <View
        style={{
          width: 68,
          height: 68,
          marginBottom: 10,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: hover ? "rgba(59,91,255,0.16)" : "rgba(255,255,255,0.04)",
          borderWidth: 1,
          borderColor: hover ? "rgba(154,184,255,0.42)" : "rgba(59,91,255,0.28)",
          shadowColor: "#3B5BFF",
          shadowOpacity: hover ? 0.24 : 0.08,
          shadowRadius: hover ? 16 : 8,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        {iconSource ? (
          <Image source={iconSource} style={{ width: 46, height: 46 }} resizeMode="contain" />
        ) : (
          <Ionicons name="globe-outline" size={30} color="#9AB8FF" />
        )}
      </View>

      <Text
        numberOfLines={1}
        style={{
          fontSize: 15,
          fontWeight: "900",
          letterSpacing: 1,
          color: "#F5F7FF",
          textAlign: "center",
        }}
      >
        {item.nome}
      </Text>

      <Text
        numberOfLines={2}
        style={{
          marginTop: 2,
          fontSize: 11,
          lineHeight: 15,
          color: "#90A0C0",
          textAlign: "center",
        }}
      >
        ({item.subtitulo})
      </Text>

      <View
        style={{
          marginTop: 8,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: hover ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: hover ? "rgba(154,184,255,0.22)" : "rgba(255,255,255,0.08)",
        }}
      >
        <Text
          style={{
            fontSize: 10,
            color: hover ? "#DDE8FF" : "#9AB8FF",
            fontWeight: "800",
            letterSpacing: 1.1,
            textTransform: "uppercase",
          }}
        >
          Abrir catálogo
        </Text>
      </View>
    </Pressable>
  );
}

function TeamGridItem({
  disabled = false,
  item,
  onPress,
}: {
  disabled?: boolean;
  item: TeamItem;
  onPress: () => void;
}) {
  const visualUri = resolveTeamVisual(item);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        width: 108,
        minHeight: 130,
        backgroundColor: disabled ? "#0B1020" : "#0F172D",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        opacity: disabled ? 0.42 : 1,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 10,
        paddingHorizontal: 6,
        paddingBottom: 10,
      }}
    >
      <View
        style={{
          width: 72,
          height: 58,
          marginBottom: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#162344",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(59,91,255,0.32)",
        }}
      >
        <VisualToken
          imageUri={visualUri}
          name={item.nome}
          imageWidth={item.tipoIcone === "escudo" ? 40 : 58}
          imageHeight={item.tipoIcone === "escudo" ? 40 : 36}
          fallbackSize={14}
          fallbackColor="#8FA1C8"
        />
      </View>

      <Text
        numberOfLines={2}
        style={{
          textAlign: "center",
          fontSize: 12,
          lineHeight: 16,
          color: disabled ? "#7C89A4" : "#EAF0FF",
          fontWeight: "500",
        }}
      >
        {item.nome}
      </Text>

      {disabled ? (
        <Text
          style={{
            marginTop: 6,
            textAlign: "center",
            fontSize: 10,
            lineHeight: 12,
            color: "#FF9DA9",
            fontWeight: "700",
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          Ja escolhido
        </Text>
      ) : null}
    </Pressable>
  );
}

export function TeamPickerModal({
  visible,
  lockedTeamNames = [],
  restrictedPool = null,
  onClose,
  onSelect,
}: Props) {
  const restrictedPoolKey = restrictedPool?.label ?? "";
  const [step, setStep] = useState<Step>(restrictedPool ? "time" : "continente");
  const [continenteSelecionado, setContinenteSelecionado] =
    useState<ContinentItem | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState<TeamMode | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<LeagueItem | null>(null);
  const contentScrollRef = useRef<ScrollView | null>(null);

  const categorias = useMemo(() => {
    if (!continenteSelecionado || tipoSelecionado !== "clubes") return [];
    return continenteSelecionado.clubes;
  }, [continenteSelecionado, tipoSelecionado]);

  const times = useMemo(() => {
    if (restrictedPool) {
      return restrictedPool.teams;
    }

    if (!continenteSelecionado || !tipoSelecionado) return [];
    if (tipoSelecionado === "selecoes") return continenteSelecionado.selecoes;
    return categoriaSelecionada?.times ?? [];
  }, [categoriaSelecionada, continenteSelecionado, restrictedPool, tipoSelecionado]);
  const lockedTeams = useMemo(
    () => new Set(lockedTeamNames.map((name) => slugify(name))),
    [lockedTeamNames],
  );
  const resolvedStep = useMemo<Step>(() => {
    if (restrictedPool) {
      return "time";
    }

    if ((step === "tipo" || step === "categoria" || step === "time") && !continenteSelecionado) {
      return "continente";
    }

    if ((step === "categoria" || step === "time") && !tipoSelecionado) {
      return "tipo";
    }

    if (step === "time" && tipoSelecionado === "clubes" && !categoriaSelecionada) {
      return "categoria";
    }

    return step;
  }, [categoriaSelecionada, continenteSelecionado, restrictedPool, step, tipoSelecionado]);
  const contentKey = `${resolvedStep}-${continenteSelecionado?.id ?? "none"}-${tipoSelecionado ?? "none"}-${categoriaSelecionada?.id ?? "none"}`;

  function resetarEstado() {
    setStep(restrictedPool ? "time" : "continente");
    setContinenteSelecionado(null);
    setTipoSelecionado(null);
    setCategoriaSelecionada(null);
  }

  useEffect(() => {
    if (!visible) {
      resetarEstado();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      resetarEstado();
    }
  }, [restrictedPoolKey, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    contentScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [resolvedStep, visible]);

  function fecharModal() {
    onClose();
  }

  function voltar() {
    if (restrictedPool) {
      fecharModal();
      return;
    }

    if (resolvedStep === "time") {
      if (tipoSelecionado === "selecoes") {
        setStep("tipo");
        setTipoSelecionado(null);
        return;
      }

      setStep("categoria");
      setCategoriaSelecionada(null);
      return;
    }

    if (resolvedStep === "categoria") {
      setStep("tipo");
      setTipoSelecionado(null);
      setCategoriaSelecionada(null);
      return;
    }

    if (resolvedStep === "tipo") {
      setStep("continente");
      setContinenteSelecionado(null);
      setTipoSelecionado(null);
      setCategoriaSelecionada(null);
      return;
    }

    fecharModal();
  }

  function tituloAtual() {
    if (restrictedPool) return restrictedPool.label;
    if (resolvedStep === "continente") return "Continentes";
    if (resolvedStep === "tipo") return continenteSelecionado?.nome ?? "Tipo";
    if (resolvedStep === "categoria") return "Categorias";
    return tipoSelecionado === "selecoes" ? "Seleções" : "Times";
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={fecharModal}>
      <View
        pointerEvents="box-none"
        style={{
          flex: 1,
          zIndex: 999,
          elevation: 999,
        }}
      >
        <Pressable
          onPress={fecharModal}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.82)",
          }}
        />

        <View
          pointerEvents="box-none"
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 18,
          }}
        >
        <View
          key={contentKey}
          style={{
            width: "100%",
            maxWidth: 1220,
            maxHeight: "90%",
          }}
        >
          <NeonFrame radius={24} padding={2}>
            <View style={{ backgroundColor: "#09101F" }}>
              <View
                style={{
                  paddingHorizontal: 22,
                  paddingVertical: 16,
                  backgroundColor: "#0E1730",
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: "#F3F7FF",
                  }}
                >
                  {tituloAtual()}
                </Text>

                {continenteSelecionado ? (
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "#8C9BBC",
                    }}
                  >
                    {tipoSelecionado === "selecoes"
                      ? "SELEÇÕES"
                      : tipoSelecionado === "clubes"
                        ? "CLUBES"
                        : ""}
                    {continenteSelecionado ? ` / ${continenteSelecionado.nome}` : ""}
                    {categoriaSelecionada ? ` / ${categoriaSelecionada.nome}` : ""}
                  </Text>
                ) : restrictedPool ? (
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "#8C9BBC",
                    }}
                  >
                    {restrictedPool.description}
                  </Text>
                ) : (
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "#8C9BBC",
                    }}
                  >
                    Escolha uma etapa para navegar
                  </Text>
                )}
              </View>

              <ScrollView
                key={contentKey}
                ref={contentScrollRef}
                style={{ backgroundColor: "#09101F" }}
              >
                <View>
                  {resolvedStep === "continente" && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {teamCatalog.map((item) => (
                        <ContinentCard
                          key={item.id}
                          item={item}
                          onPress={() => {
                            setContinenteSelecionado(item);
                            setTipoSelecionado(null);
                            setCategoriaSelecionada(null);
                            setStep("tipo");
                          }}
                        />
                      ))}
                    </View>
                  )}

                  {resolvedStep === "tipo" && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {[
                        { id: "selecoes", nome: "Seleções" },
                        { id: "clubes", nome: "Clubes" },
                      ].map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            const tipo = item.id as TeamMode;
                            setTipoSelecionado(tipo);
                            setCategoriaSelecionada(null);
                            setStep(tipo === "selecoes" ? "time" : "categoria");
                          }}
                          style={{
                            width: 180,
                            minHeight: 112,
                            backgroundColor: "#111A32",
                            borderRightWidth: 1,
                            borderBottomWidth: 1,
                            borderColor: "rgba(255,255,255,0.06)",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 14,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 22,
                              fontWeight: "800",
                              color: "#F3F7FF",
                            }}
                          >
                            {item.nome}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {resolvedStep === "categoria" &&
                    (categorias.length ? (
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {categorias.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => {
                              setCategoriaSelecionada(item);
                              setStep("time");
                            }}
                            style={{
                              width: 180,
                              minHeight: 88,
                              backgroundColor: "#111A32",
                              borderRightWidth: 1,
                              borderBottomWidth: 1,
                              borderColor: "rgba(255,255,255,0.06)",
                              justifyContent: "center",
                              paddingHorizontal: 16,
                              paddingVertical: 14,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 18,
                                fontWeight: "700",
                                color: "#F3F7FF",
                              }}
                            >
                              {item.nome}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : (
                      <EmptyStage
                        title="Nenhuma categoria cadastrada"
                        description="Este continente ainda não possui clubes configurados no seletor."
                      />
                    ))}

                  {resolvedStep === "time" &&
                    (times.length ? (
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {times.map((item) => (
                          <TeamGridItem
                            key={item.id}
                            disabled={lockedTeams.has(slugify(item.nome))}
                            item={item}
                            onPress={() => {
                              onSelect(item);
                            }}
                          />
                        ))}
                      </View>
                    ) : (
                      <EmptyStage
                        title="Nenhum time disponível"
                        description="Ajuste a etapa anterior ou escolha outra região para carregar os times e seleções."
                      />
                    ))}
                </View>
              </ScrollView>

              <View
                style={{
                  padding: 14,
                  backgroundColor: "#0E1730",
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255,255,255,0.06)",
                }}
              >
                <TouchableOpacity
                  onPress={voltar}
                  style={{
                    backgroundColor: "#162344",
                    paddingVertical: 15,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(59,91,255,0.35)",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 18,
                      color: "#78A2FF",
                      fontWeight: "800",
                    }}
                  >
                    {resolvedStep === "continente" || restrictedPool ? "Fechar" : "Voltar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </NeonFrame>
        </View>
        </View>
      </View>
    </Modal>
  );
}
