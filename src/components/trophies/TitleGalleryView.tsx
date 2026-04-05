import { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

import { TitleGalleryCard } from "@/components/trophies/TitleGalleryCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { NeonFrame } from "@/components/ui/NeonFrame";
import {
  TitleGalleryNode,
  TitleMode,
  titleGalleryByMode,
} from "@/lib/title-gallery";

interface TitleGalleryViewProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

interface MenuButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}

interface HierarchyRow {
  depth: number;
  nodes: TitleGalleryNode[];
  activeId: string;
}

function MenuButton({
  label,
  active,
  onPress,
  compact = false,
}: MenuButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center border-r px-2 active:opacity-80"
      style={{
        borderColor: "rgba(59,91,255,0.12)",
        backgroundColor: active ? "#EEF4FF" : "#FFFFFF",
        minHeight: compact ? 46 : 52,
      }}
    >
      <Text
        className="font-bold uppercase"
        style={{
          color: active ? "#2447A6" : "#344767",
          fontSize: compact ? 13 : 16,
          letterSpacing: compact ? 1.1 : 1.5,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function resolveActivePath(nodes: TitleGalleryNode[], preferredIds: string[]) {
  const path: TitleGalleryNode[] = [];
  let currentNodes = nodes;
  let depth = 0;

  while (currentNodes.length > 0) {
    const currentNode =
      currentNodes.find((node) => node.id === preferredIds[depth]) ??
      currentNodes[0];

    if (!currentNode) break;

    path.push(currentNode);
    currentNodes = currentNode.children ?? [];
    depth += 1;
  }

  return path;
}

function buildHierarchyRows(
  nodes: TitleGalleryNode[],
  activePath: TitleGalleryNode[],
) {
  const rows: HierarchyRow[] = [];
  let currentNodes = nodes;
  let depth = 0;

  while (currentNodes.length > 0) {
    const currentNode = activePath[depth] ?? currentNodes[0];
    if (!currentNode) break;

    rows.push({
      depth,
      nodes: currentNodes,
      activeId: currentNode.id,
    });

    currentNodes = currentNode.children ?? [];
    depth += 1;
  }

  return rows;
}

export function TitleGalleryView({
  showBackButton = false,
  onBack,
}: TitleGalleryViewProps) {
  const [titleMode, setTitleMode] = useState<TitleMode>("clubs");
  const [clubPath, setClubPath] = useState<string[]>([
    titleGalleryByMode.clubs[0]?.id ?? "world",
  ]);
  const [nationalPath, setNationalPath] = useState<string[]>([
    titleGalleryByMode["national-teams"][0]?.id ?? "world",
  ]);

  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const isSmallPhone = width < 420;

  const contentMaxWidth = 1440;
  const horizontalPadding = isSmallPhone ? 24 : isPhone ? 32 : 48;
  const contentWidth = Math.max(
    Math.min(width - horizontalPadding, contentMaxWidth),
    320,
  );

  const columns = isSmallPhone
    ? 1
    : contentWidth >= 1260
      ? 6
      : contentWidth >= 1080
        ? 5
        : contentWidth >= 860
          ? 4
          : contentWidth >= 640
            ? 3
            : 2;

  const galleryCardWidth = Math.max(Math.floor(contentWidth / columns), 160);
  const rowButtonMinWidth = isSmallPhone ? 124 : isPhone ? 146 : 180;
  const sectionPaddingX = isPhone ? 16 : 20;
  const sectionPaddingY = isPhone ? 14 : 16;
  const outerVerticalPadding = isPhone ? 16 : 32;
  const backButtonPaddingX = isPhone ? 14 : 16;
  const backButtonPaddingY = isPhone ? 10 : 12;

  const currentRoots = titleGalleryByMode[titleMode];
  const activePathIds = titleMode === "clubs" ? clubPath : nationalPath;
  const activePath = resolveActivePath(currentRoots, activePathIds);
  const navigationRows = buildHierarchyRows(currentRoots, activePath);
  const currentNode = activePath[activePath.length - 1] ?? currentRoots[0];
  const currentItems = currentNode?.items ?? [];
  const breadcrumb = [
    titleMode === "clubs" ? "Clubes" : "Seleções",
    ...activePath.map((node) => node.label),
  ].join(" / ");

  const handlePathSelection = (depth: number, nodeId: string) => {
    const nextPath = [...activePathIds.slice(0, depth), nodeId];

    if (titleMode === "clubs") {
      setClubPath(nextPath);
    } else {
      setNationalPath(nextPath);
    }
  };

  return (
    <View
      className="w-full self-center gap-4"
      style={{
        maxWidth: contentMaxWidth,
        paddingVertical: outerVerticalPadding,
        backgroundColor: "#F7FAFF",
      }}
    >
      {showBackButton && onBack ? (
        <RevealOnScroll delay={0}>
          <Pressable
            onPress={onBack}
            className="self-start rounded-full border active:opacity-80"
            style={{
              borderColor: "rgba(59,91,255,0.16)",
              backgroundColor: "#FFFFFF",
              paddingHorizontal: backButtonPaddingX,
              paddingVertical: backButtonPaddingY,
            }}
          >
            <Text
              style={{
                color: "#35508C",
                fontSize: 12,
                fontWeight: "700",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Voltar
            </Text>
          </Pressable>
        </RevealOnScroll>
      ) : null}

      <NeonFrame radius={28} backgroundColor="#FFFFFF">
        <View
          style={{
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
          }}
        >
          <View
            className="flex-row border-b"
            style={{ borderColor: "rgba(59,91,255,0.10)" }}
          >
            <MenuButton
              label="Clubes"
              active={titleMode === "clubs"}
              onPress={() => setTitleMode("clubs")}
              compact={isPhone}
            />
            <MenuButton
              label="Selecoes"
              active={titleMode === "national-teams"}
              onPress={() => setTitleMode("national-teams")}
              compact={isPhone}
            />
          </View>

          {navigationRows.map((row) => {
            const isPrimaryRow = row.depth === 0;

            return (
              <View
                key={`title-row-${row.depth}`}
                className="border-b px-0"
                style={{
                  borderColor: "rgba(59,91,255,0.10)",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <ScrollRow className="px-0" contentClassName="gap-0">
                  {row.nodes.map((node) => {
                    const isActive = node.id === row.activeId;

                    return (
                      <Pressable
                        key={`${row.depth}-${node.id}`}
                        onPress={() => handlePathSelection(row.depth, node.id)}
                        className="items-center justify-center border-r px-4 active:opacity-80"
                        style={{
                          borderColor: "rgba(59,91,255,0.10)",
                          backgroundColor: isActive
                            ? "#EEF4FF"
                            : isPrimaryRow
                              ? "#FFFFFF"
                              : "#FBFCFF",
                          minHeight: isPhone ? 36 : 38,
                          minWidth: rowButtonMinWidth,
                        }}
                      >
                        <Text
                          className="text-center font-bold uppercase"
                          style={{
                            color: isActive ? "#2447A6" : "#405577",
                            fontSize: isPhone ? 12 : 14,
                            letterSpacing: isPhone ? 1.1 : 1.5,
                          }}
                        >
                          {node.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollRow>
              </View>
            );
          })}

          <View
            className="border-b"
            style={{
              borderColor: "rgba(59,91,255,0.10)",
              backgroundColor: "#F8FAFF",
              paddingHorizontal: sectionPaddingX,
              paddingVertical: sectionPaddingY,
            }}
          >
            <Text
              className="font-bold uppercase"
              style={{
                color: "#1C2B4A",
                fontSize: isPhone ? 16 : 18,
                letterSpacing: isPhone ? 1.1 : 1.4,
              }}
            >
              {currentNode?.label}
            </Text>

            <Text
              className="mt-2 font-medium uppercase"
              style={{
                color: "#7B8FB5",
                fontSize: isPhone ? 12 : 14,
                letterSpacing: isPhone ? 1 : 1.2,
              }}
            >
              {currentNode?.subtitle}
            </Text>
          </View>

          <View
            className="flex-row flex-wrap"
            style={{
              backgroundColor: "#FFFFFF",
              padding: 8,
            }}
          >
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <RevealOnScroll
                  key={item.id}
                  delay={index * 18}
                  style={{
                    width: galleryCardWidth,
                    padding: 8,
                  }}
                >
                  <TitleGalleryCard item={item} />
                </RevealOnScroll>
              ))
            ) : (
              <View className="w-full px-6 py-12">
                <Text
                  style={{
                    textAlign: "center",
                    color: "#7B8FB5",
                    fontSize: 14,
                    fontWeight: "500",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  Nenhuma competicao encontrada nesta categoria.
                </Text>
              </View>
            )}
          </View>
        </View>
      </NeonFrame>
    </View>
  );
}

