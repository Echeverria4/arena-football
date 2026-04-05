import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, type ComponentProps } from "react";
import {
  Image,
  Linking,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type DimensionValue,
  type LayoutChangeEvent,
} from "react-native";

import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { NeonFrame } from "@/components/ui/NeonFrame";
import { getConfederationIcon, resolveTeamVisual } from "@/lib/team-visuals";
import type { TeamsByConfederationData } from "@/types/team-browser";

export type TimesPorConfederacao = TeamsByConfederationData;

type ConfederationMeta = {
  label: string;
  region: string;
  icon: ComponentProps<typeof Ionicons>["name"];
};

const CONFEDERATIONS_META: Record<string, ConfederationMeta> = {
  conmebol: { label: "CONMEBOL", region: "América do Sul", icon: "globe-outline" },
  uefa: { label: "UEFA", region: "Europa", icon: "planet-outline" },
  concacaf: {
    label: "CONCACAF",
    region: "América do Norte, Central e Caribe",
    icon: "earth-outline",
  },
  caf: { label: "CAF", region: "África", icon: "leaf-outline" },
  afc: { label: "AFC", region: "Ásia", icon: "earth-outline" },
};

const COUNTRY_FLAG_URLS: Record<string, string> = {
  arg: "https://flagcdn.com/w160/ar.png",
  bol: "https://flagcdn.com/w160/bo.png",
  bra: "https://flagcdn.com/w160/br.png",
  chi: "https://flagcdn.com/w160/cl.png",
  col: "https://flagcdn.com/w160/co.png",
  ecu: "https://flagcdn.com/w160/ec.png",
  par: "https://flagcdn.com/w160/py.png",
  per: "https://flagcdn.com/w160/pe.png",
  uru: "https://flagcdn.com/w160/uy.png",
  ger: "https://flagcdn.com/w160/de.png",
  aut: "https://flagcdn.com/w160/at.png",
  bel: "https://flagcdn.com/w160/be.png",
  cro: "https://flagcdn.com/w160/hr.png",
  den: "https://flagcdn.com/w160/dk.png",
  sco: "https://flagcdn.com/w160/gb-sct.png",
  svk: "https://flagcdn.com/w160/sk.png",
  svn: "https://flagcdn.com/w160/si.png",
  esp: "https://flagcdn.com/w160/es.png",
  fra: "https://flagcdn.com/w160/fr.png",
  gre: "https://flagcdn.com/w160/gr.png",
  hun: "https://flagcdn.com/w160/hu.png",
  eng: "https://flagcdn.com/w160/gb-eng.png",
  irl: "https://flagcdn.com/w160/ie.png",
  ita: "https://flagcdn.com/w160/it.png",
  ned: "https://flagcdn.com/w160/nl.png",
  pol: "https://flagcdn.com/w160/pl.png",
  por: "https://flagcdn.com/w160/pt.png",
  cze: "https://flagcdn.com/w160/cz.png",
  rou: "https://flagcdn.com/w160/ro.png",
  rus: "https://flagcdn.com/w160/ru.png",
  srb: "https://flagcdn.com/w160/rs.png",
  swe: "https://flagcdn.com/w160/se.png",
  sui: "https://flagcdn.com/w160/ch.png",
  tur: "https://flagcdn.com/w160/tr.png",
  ukr: "https://flagcdn.com/w160/ua.png",
  can: "https://flagcdn.com/w160/ca.png",
  crc: "https://flagcdn.com/w160/cr.png",
  usa: "https://flagcdn.com/w160/us.png",
  mex: "https://flagcdn.com/w160/mx.png",
  rsa: "https://flagcdn.com/w160/za.png",
  alg: "https://flagcdn.com/w160/dz.png",
  egy: "https://flagcdn.com/w160/eg.png",
  mar: "https://flagcdn.com/w160/ma.png",
  nga: "https://flagcdn.com/w160/ng.png",
  sen: "https://flagcdn.com/w160/sn.png",
  jpn: "https://flagcdn.com/w160/jp.png",
  sau: "https://flagcdn.com/w160/sa.png",
  kor: "https://flagcdn.com/w160/kr.png",
  aus: "https://flagcdn.com/w160/au.png",
  irn: "https://flagcdn.com/w160/ir.png",
  qat: "https://flagcdn.com/w160/qa.png",
  uae: "https://flagcdn.com/w160/ae.png",
  chn: "https://flagcdn.com/w160/cn.png",
};

function buildInitials(name: string) {
  const cleaned = name.replace(/\([^)]*\)/g, "").trim();
  const parts = cleaned
    .split(/\s+/)
    .map((part) =>
      part
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, ""),
    )
    .filter(Boolean);

  const letters = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean);

  return letters.join("") || cleaned.slice(0, 2).toUpperCase() || "TM";
}

function getConfederationCardWidth(viewportWidth: number, total: number): DimensionValue {
  if (viewportWidth < 520) {
    return "50%";
  }

  if (viewportWidth < 920) {
    return "33.3333%";
  }

  return `${100 / Math.max(total, 1)}%`;
}

function getGridTileWidth(viewportWidth: number, desktopWidth: number): DimensionValue {
  if (viewportWidth < 420) {
    return "50%";
  }

  if (viewportWidth < 760) {
    return "33.3333%";
  }

  if (viewportWidth < 1080) {
    return "25%";
  }

  return desktopWidth;
}

function ConfederationCard({
  confKey,
  active,
  onPress,
  height,
  compact,
}: {
  confKey: string;
  active: boolean;
  onPress: () => void;
  height: number;
  compact: boolean;
}) {
  const meta = CONFEDERATIONS_META[confKey as keyof typeof CONFEDERATIONS_META];
  const [hover, setHover] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = getConfederationIcon(confKey, hover || active ? "color" : "gray");

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        width: "100%",
        height,
        position: "relative",
        overflow: "hidden",
        backgroundColor: active ? "#162344" : "#111A32",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 116,
          height: 116,
          top: -24,
          left: -18,
          borderRadius: 999,
          backgroundColor: "#3B5BFF",
          opacity: active ? 0.15 : 0.08,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 128,
          height: 128,
          right: -30,
          bottom: -36,
          borderRadius: 999,
          backgroundColor: "#5D85FF",
          opacity: active ? 0.11 : 0.05,
        }}
      />

      {imageSource && !imageFailed ? (
        <Image
          source={imageSource}
          style={{ width: compact ? 60 : 82, height: compact ? 60 : 82, marginBottom: compact ? 6 : 8 }}
          resizeMode="contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Ionicons name={meta.icon} size={compact ? 28 : 36} color="#EAF0FF" />
      )}

      <Text
        numberOfLines={1}
        style={{
          fontSize: compact ? 13 : 15,
          fontWeight: "900",
          letterSpacing: compact ? 0.8 : 1.2,
          color: "#F5F7FF",
          textAlign: "center",
        }}
      >
        {meta.label}
      </Text>

      <Text
        style={{
          marginTop: 3,
          fontSize: compact ? 10 : 11,
          color: "#90A0C0",
          textAlign: "center",
          lineHeight: compact ? 14 : 16,
        }}
      >
        ({meta.region})
      </Text>

      <Ionicons
        name={active ? "chevron-up" : "chevron-down"}
        size={12}
        color={active ? "#9AB8FF" : "rgba(154,184,255,0.5)"}
        style={{ marginTop: 8 }}
      />
    </Pressable>
  );
}

function SectionIntro({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 22,
        paddingVertical: 22,
        backgroundColor: "#0E1730",
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.06)",
      }}
    >
      <Text
        style={{
          color: "#9AB8FF",
          fontSize: 11,
          fontWeight: "900",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </Text>
      <Text
        style={{
          marginTop: 10,
          color: "#F3F7FF",
          fontSize: 22,
          fontWeight: "900",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 8,
          color: "#AAB8D8",
          fontSize: 14,
          lineHeight: 22,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

function CountryCard({
  name,
  flagUrl,
  active,
  onPress,
  width,
  compact,
}: {
  name: string;
  flagUrl?: string;
  active: boolean;
  onPress: () => void;
  width: DimensionValue;
  compact: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width,
        minHeight: compact ? 96 : 114,
        backgroundColor: active ? "#162344" : "#111A32",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: compact ? 6 : 8,
        paddingVertical: compact ? 8 : 10,
      }}
    >
      {flagUrl ? (
        <Image
          source={{ uri: flagUrl }}
          style={{ width: compact ? 46 : 60, height: compact ? 46 : 60, marginBottom: compact ? 6 : 8 }}
          resizeMode="contain"
        />
      ) : (
        <Ionicons
          name="flag-outline"
          size={compact ? 22 : 28}
          color="#F3F7FF"
          style={{ marginBottom: compact ? 8 : 10 }}
        />
      )}

      <Text
        numberOfLines={compact ? 3 : 2}
        style={{
          textAlign: "center",
          fontSize: compact ? 11 : 13,
          lineHeight: compact ? 14 : 16,
          color: "#F3F7FF",
          fontWeight: "800",
          letterSpacing: compact ? 0.6 : 1,
          textTransform: "uppercase",
        }}
      >
        {name}
      </Text>

      <Ionicons
        name={active ? "chevron-up" : "chevron-down"}
        size={compact ? 11 : 13}
        color={active ? "#9AB8FF" : "rgba(154,184,255,0.45)"}
        style={{ marginTop: compact ? 6 : 10 }}
      />
    </Pressable>
  );
}

function SelectionTile({
  name,
  imageUrl,
  width,
  compact,
}: {
  name: string;
  imageUrl?: string;
  width: DimensionValue;
  compact: boolean;
}) {
  return (
    <View
      style={{
        width,
        minHeight: compact ? 108 : 126,
        backgroundColor: "#101A31",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: compact ? 8 : 10,
        paddingVertical: compact ? 10 : 14,
      }}
    >
      <View
        style={{
          width: compact ? 50 : 62,
          height: compact ? 50 : 62,
          borderRadius: compact ? 14 : 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#162344",
          borderWidth: 1,
          borderColor: "rgba(59,91,255,0.24)",
          overflow: "hidden",
          marginBottom: compact ? 8 : 10,
        }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: compact ? 38 : 48, height: compact ? 38 : 48 }}
            resizeMode="contain"
          />
        ) : (
          <Ionicons name="shield-outline" size={compact ? 22 : 26} color="#EAF0FF" />
        )}
      </View>

      <Text
        numberOfLines={compact ? 3 : 2}
        style={{
          textAlign: "center",
          color: "#EAF0FF",
          fontSize: compact ? 11 : 13,
          lineHeight: compact ? 15 : 18,
          fontWeight: "700",
        }}
      >
        {name}
      </Text>
    </View>
  );
}

function TeamGridCard({
  name,
  badgeUrl,
  width,
  link,
  compact,
}: {
  name: string;
  badgeUrl?: string;
  width: DimensionValue;
  link?: string;
  compact: boolean;
}) {
  return (
    <Pressable
      disabled={!link}
      onPress={() => {
        if (link) {
          Linking.openURL(link);
        }
      }}
      style={{
        width,
        overflow: "hidden",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        backgroundColor: "#101A31",
      }}
    >
      <View
        style={{
          backgroundColor: "#111A32",
          paddingVertical: compact ? 12 : 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: compact ? 46 : 54,
            height: compact ? 46 : 54,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: compact ? 14 : 16,
            borderWidth: 1,
            borderColor: "rgba(59,91,255,0.35)",
            backgroundColor: "#162344",
            overflow: "hidden",
          }}
        >
          {badgeUrl ? (
            <Image
              source={{ uri: badgeUrl }}
              style={{ width: compact ? 36 : 44, height: compact ? 36 : 44, borderRadius: 8 }}
              resizeMode="contain"
            />
          ) : (
            <Text
              style={{
                color: "#F3F7FF",
                fontSize: compact ? 14 : 16,
                fontWeight: "900",
                letterSpacing: 1,
              }}
            >
              {buildInitials(name)}
            </Text>
          )}
        </View>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderColor: "rgba(255,255,255,0.06)",
          backgroundColor: "#101A31",
          paddingHorizontal: compact ? 6 : 8,
          paddingVertical: compact ? 10 : 12,
        }}
      >
        <Text
          numberOfLines={compact ? 3 : 2}
          style={{
            textAlign: "center",
            color: "#EAF0FF",
            fontSize: compact ? 11 : 13,
            lineHeight: compact ? 15 : 18,
            fontWeight: "600",
          }}
        >
          {name}
        </Text>
      </View>
    </Pressable>
  );
}

export function TeamsByConfederationView({
  data,
  headerLabel,
  headerSubtitle,
}: {
  data: TimesPorConfederacao;
  headerLabel: string;
  headerSubtitle?: string;
}) {
  const { width: viewportWidth } = useWindowDimensions();
  const isSelections = headerLabel.toLowerCase().includes("sele");
  const confederations = useMemo(() => Object.entries(data), [data]);
  const [activeConfederation, setActiveConfederation] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [contentWidth, setContentWidth] = useState(0);

  const activeCountries = useMemo(() => {
    if (!activeConfederation) {
      return {};
    }

    return data[activeConfederation] ?? {};
  }, [activeConfederation, data]);

  const countryEntries = useMemo(() => Object.entries(activeCountries), [activeCountries]);
  const currentCountry = activeCountry ? activeCountries[activeCountry] : undefined;

  const responsiveWidth = contentWidth || viewportWidth;
  const isCompactMobile = responsiveWidth < 420;
  const isPhoneLayout = responsiveWidth < 768;
  const confederationWidth = getConfederationCardWidth(responsiveWidth, confederations.length);
  const countryCardWidth = getGridTileWidth(responsiveWidth, 180);
  const selectionTileWidth = getGridTileWidth(responsiveWidth, 160);
  const clubCardWidth = getGridTileWidth(responsiveWidth, 180);

  const breadcrumb = [
    headerLabel.toUpperCase(),
    activeConfederation
      ? CONFEDERATIONS_META[activeConfederation]?.label ?? activeConfederation.toUpperCase()
      : null,
    !isSelections && currentCountry?.nome ? currentCountry.nome.toUpperCase() : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <NeonFrame radius={22}>
      <View
        onLayout={(event: LayoutChangeEvent) => {
          const nextWidth = Math.round(event.nativeEvent.layout.width);

          if (Math.abs(nextWidth - contentWidth) > 4) {
            setContentWidth(nextWidth);
          }
        }}
        style={{
          width: "100%",
          maxWidth: "100%",
          alignSelf: "stretch",
          overflow: "hidden",
          backgroundColor: "#09101F",
          paddingBottom: 120,
        }}
      >
        <View
          style={{
            paddingHorizontal: isCompactMobile ? 14 : 22,
            paddingVertical: isCompactMobile ? 14 : 16,
            backgroundColor: "#0E1730",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.06)",
          }}
        >
          <Text style={{ fontSize: isCompactMobile ? 16 : 18, fontWeight: "800", color: "#F3F7FF" }}>
            {headerLabel}
          </Text>
          <Text style={{ marginTop: 4, fontSize: isCompactMobile ? 11 : 12, color: "#8C9BBC" }}>
            {breadcrumb}
          </Text>
          {headerSubtitle ? (
            <Text
              style={{
                marginTop: isCompactMobile ? 8 : 10,
                fontSize: isCompactMobile ? 12 : 14,
                lineHeight: isCompactMobile ? 18 : 22,
                color: "#AAB8D8",
              }}
            >
              {headerSubtitle}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            backgroundColor: "#0E1730",
            borderBottomWidth: 1,
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          {confederations.map(([confKey], index) => (
            <View key={confKey} style={{ width: confederationWidth, minWidth: 0 }}>
              <RevealOnScroll delay={index * 30}>
                <ConfederationCard
                  confKey={confKey}
                  active={confKey === activeConfederation}
                  onPress={() => {
                    if (confKey === activeConfederation) {
                      setActiveConfederation(null);
                      setActiveCountry(null);
                      return;
                    }

                    setActiveConfederation(confKey);
                    setActiveCountry(null);
                  }}
                  height={isCompactMobile ? 116 : 132}
                  compact={isCompactMobile}
                />
              </RevealOnScroll>
            </View>
          ))}
        </View>

        {!activeConfederation ? (
          <SectionIntro
            eyebrow="Passo 1"
            title="Escolha a confederação"
            subtitle={
              isSelections
                ? "As seleções ficam recolhidas até você escolher um continente."
                : "Os países e clubes ficam recolhidos até você escolher um continente."
            }
          />
        ) : null}

        {activeConfederation && isSelections ? (
          <>
            <SectionIntro
              eyebrow="Passo 2"
              title={`Seleções da ${CONFEDERATIONS_META[activeConfederation]?.label ?? activeConfederation.toUpperCase()}`}
              subtitle="Agora as seleções deste continente foram abertas. Clique em outra confederação para trocar a vitrine."
            />

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                backgroundColor: "#101A31",
              }}
            >
              {countryEntries.map(([countryKey, bucket], index) => (
                <RevealOnScroll key={`${activeConfederation}-${countryKey}`} delay={index * 30}>
                  <SelectionTile
                    name={bucket.nome}
                    imageUrl={bucket.imagem ?? COUNTRY_FLAG_URLS[countryKey]}
                    width={selectionTileWidth}
                    compact={isCompactMobile}
                  />
                </RevealOnScroll>
              ))}
            </View>
          </>
        ) : null}

        {activeConfederation && !isSelections ? (
          <>
            <SectionIntro
              eyebrow="Passo 2"
              title="Escolha o país"
              subtitle="Os clubes continuam recolhidos. Primeiro selecione o país ou liga que você quer abrir."
            />

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                backgroundColor: "#111A32",
                borderBottomWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              {countryEntries.map(([countryKey, bucket], index) => (
                <RevealOnScroll key={`${activeConfederation}-${countryKey}`} delay={index * 24}>
                  <CountryCard
                    name={bucket.nome}
                    flagUrl={bucket.imagem ?? COUNTRY_FLAG_URLS[countryKey]}
                    active={countryKey === activeCountry}
                    onPress={() => setActiveCountry((current) => (current === countryKey ? null : countryKey))}
                    width={countryCardWidth}
                    compact={isCompactMobile}
                  />
                </RevealOnScroll>
              ))}
            </View>

            {!activeCountry ? (
              <SectionIntro
                eyebrow="Passo 3"
                title="Abra os clubes do país"
                subtitle="Quando você clicar em um país, os clubes daquela liga aparecem logo abaixo."
              />
            ) : (
              <>
                <SectionIntro
                  eyebrow="Passo 3"
                  title={`Clubes de ${currentCountry?.nome ?? "liga selecionada"}`}
                  subtitle="Esta grade só aparece depois do clique no país, deixando a navegação mais limpa."
                />

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    backgroundColor: "#101A31",
                  }}
                >
                  {(currentCountry?.times ?? []).map((team, index) => {
                    const teamName = typeof team === "string" ? team : team.nome;
                    const visualUri =
                      typeof team === "string"
                        ? resolveTeamVisual({ nome: teamName, tipoIcone: "escudo" })
                        : resolveTeamVisual(team);

                    return (
                      <RevealOnScroll key={`${activeCountry}-${teamName}`} delay={index * 18}>
                        <TeamGridCard
                          name={teamName}
                          badgeUrl={visualUri}
                          width={clubCardWidth}
                          link={typeof team === "string" ? undefined : team.link}
                          compact={isCompactMobile}
                        />
                      </RevealOnScroll>
                    );
                  })}
                </View>
              </>
            )}
          </>
        ) : null}
      </View>
    </NeonFrame>
  );
}
