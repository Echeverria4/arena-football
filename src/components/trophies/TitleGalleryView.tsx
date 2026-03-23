import { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

import { TitleGalleryCard } from "@/components/trophies/TitleGalleryCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { TitleGalleryNode, TitleMode, titleGalleryByMode } from "@/lib/title-gallery";

interface TitleGalleryViewProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

interface MenuButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

interface HierarchyRow {
  depth: number;
  nodes: TitleGalleryNode[];
  activeId: string;
}

function MenuButton({ label, active, onPress }: MenuButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-[52px] flex-1 items-center justify-center border-r active:opacity-80"
      style={{
        borderColor: "#2C2C2C",
        backgroundColor: active ? "#F2F2F2" : "#434343",
      }}
    >
      <Text
        className="text-base font-bold uppercase tracking-[1.5px]"
        style={{ color: active ? "#111111" : "#FFFFFF" }}
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
      currentNodes.find((node) => node.id === preferredIds[depth]) ?? currentNodes[0];

    if (!currentNode) {
      break;
    }

    path.push(currentNode);
    currentNodes = currentNode.children ?? [];
    depth += 1;
  }

  return path;
}

function buildHierarchyRows(nodes: TitleGalleryNode[], activePath: TitleGalleryNode[]) {
  const rows: HierarchyRow[] = [];
  let currentNodes = nodes;
  let depth = 0;

  while (currentNodes.length > 0) {
    const currentNode = activePath[depth] ?? currentNodes[0];

    if (!currentNode) {
      break;
    }

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

export function TitleGalleryView({ showBackButton = false, onBack }: TitleGalleryViewProps) {
  const [titleMode, setTitleMode] = useState<TitleMode>("clubs");
  const [clubPath, setClubPath] = useState<string[]>([titleGalleryByMode.clubs[0]?.id ?? "world"]);
  const [nationalPath, setNationalPath] = useState<string[]>([
    titleGalleryByMode["national-teams"][0]?.id ?? "world",
  ]);
  const { width } = useWindowDimensions();

  const contentMaxWidth = 1440;
  const horizontalPadding = 48;
  const contentWidth = Math.max(Math.min(width - horizontalPadding, contentMaxWidth), 320);
  const columns =
    contentWidth >= 1260 ? 6 : contentWidth >= 1080 ? 5 : contentWidth >= 860 ? 4 : contentWidth >= 640 ? 3 : 2;
  const galleryCardWidth = Math.max(Math.floor(contentWidth / columns), 160);

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
      return;
    }

    setNationalPath(nextPath);
  };

  return (
    <View className="w-full self-center gap-4 py-8" style={{ maxWidth: contentMaxWidth }}>
      {showBackButton && onBack ? (
        <RevealOnScroll delay={0}>
          <Pressable
            onPress={onBack}
            className="self-start rounded-full border px-4 py-3 active:opacity-80"
            style={{
              borderColor: "#D1D5DA",
              backgroundColor: "#FAFAFA",
            }}
          >
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-[#454A51]">
              Voltar
            </Text>
          </Pressable>
        </RevealOnScroll>
      ) : null}

      <View
        className="overflow-hidden rounded-[28px] border"
        style={{
          borderColor: "#BFC4CA",
          backgroundColor: "#F6F6F6",
          shadowColor: "#A3A8AF",
          shadowOpacity: 0.12,
          shadowRadius: 16,
        }}
      >
        <View className="flex-row border-b" style={{ borderColor: "#4B4B4B" }}>
          <MenuButton label="Clubes" active={titleMode === "clubs"} onPress={() => setTitleMode("clubs")} />
          <MenuButton
            label="Selecoes"
            active={titleMode === "national-teams"}
            onPress={() => setTitleMode("national-teams")}
          />
        </View>

        {navigationRows.map((row) => {
          const isPrimaryRow = row.depth === 0;

          return (
            <View
              key={`title-row-${row.depth}`}
              className="border-b px-0"
              style={{
                borderColor: isPrimaryRow ? "#BFC4CA" : "#D1D4D8",
                backgroundColor: isPrimaryRow ? "#5A5A5A" : "#E8EBEE",
              }}
            >
              <ScrollRow className="px-0" contentClassName="gap-0">
                {row.nodes.map((node) => {
                  const isActive = node.id === row.activeId;

                  return (
                    <Pressable
                      key={`${row.depth}-${node.id}`}
                      onPress={() => handlePathSelection(row.depth, node.id)}
                      className="min-h-[38px] min-w-[180px] items-center justify-center border-r px-5 active:opacity-80"
                      style={{
                        borderColor: isPrimaryRow ? "#4B4B4B" : "#CDD2D7",
                        backgroundColor: isActive ? "#FFFFFF" : isPrimaryRow ? "#5A5A5A" : "#E8EBEE",
                      }}
                    >
                      <Text
                        className="text-sm font-bold uppercase tracking-[1.5px]"
                        style={{
                          color: isActive ? "#111111" : isPrimaryRow ? "#FFFFFF" : "#5F6770",
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
          className="border-b px-5 py-4"
          style={{
            borderColor: "#D1D4D8",
            backgroundColor: "#EFEFEF",
          }}
        >
          <Text className="text-lg font-bold uppercase tracking-[1.4px] text-[#40454C]">
            {currentNode?.label}
          </Text>
          <Text className="mt-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#8A9097]">
            {breadcrumb}
          </Text>
          <Text className="mt-2 text-sm font-medium uppercase tracking-[1.2px] text-[#7B8087]">
            {currentNode?.subtitle}
          </Text>
        </View>

        <View className="flex-row flex-wrap bg-[#FFFFFF]">
          {currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <RevealOnScroll
                key={item.id}
                delay={index * 18}
                style={{
                  width: galleryCardWidth,
                }}
              >
                <TitleGalleryCard item={item} />
              </RevealOnScroll>
            ))
          ) : (
            <View className="w-full px-6 py-12">
              <Text className="text-center text-sm font-medium uppercase tracking-[1.2px] text-[#7B8087]">
                Nenhuma competicao encontrada nesta categoria.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
