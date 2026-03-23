import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

interface NeonGridProps {
  variant?: "soft" | "hero";
}

const horizontalLines = ["20%", "52%", "84%"];
const verticalLines = ["22%", "50%", "78%"];
const stars = [
  { left: "6%", top: "10%", size: 2, opacity: 0.52 },
  { left: "14%", top: "18%", size: 1.5, opacity: 0.34 },
  { left: "23%", top: "78%", size: 2, opacity: 0.44 },
  { left: "31%", top: "36%", size: 1.4, opacity: 0.36 },
  { left: "39%", top: "61%", size: 2.4, opacity: 0.62 },
  { left: "44%", top: "46%", size: 1.7, opacity: 0.42 },
  { left: "47%", top: "28%", size: 1.1, opacity: 0.25 },
  { left: "52%", top: "72%", size: 1.6, opacity: 0.38 },
  { left: "58%", top: "14%", size: 1.3, opacity: 0.26 },
  { left: "63%", top: "54%", size: 2.2, opacity: 0.58 },
  { left: "69%", top: "32%", size: 1.5, opacity: 0.32 },
  { left: "74%", top: "84%", size: 1.9, opacity: 0.4 },
  { left: "81%", top: "19%", size: 2.3, opacity: 0.5 },
  { left: "88%", top: "63%", size: 1.4, opacity: 0.28 },
  { left: "92%", top: "26%", size: 1.1, opacity: 0.22 },
  { left: "95%", top: "78%", size: 1.8, opacity: 0.42 },
] as const;
const diagonalTrails = [
  { left: "47%", top: "18%", width: 220, rotate: "55deg", opacity: 0.12 },
  { left: "52%", top: "38%", width: 250, rotate: "-41deg", opacity: 0.1 },
  { left: "59%", top: "24%", width: 180, rotate: "20deg", opacity: 0.08 },
  { left: "61%", top: "62%", width: 190, rotate: "-28deg", opacity: 0.08 },
] as const;
const glassShards = [
  { left: "54%", top: "20%", width: 170, height: 110, rotate: "36deg", opacity: 0.05 },
  { left: "50%", top: "42%", width: 240, height: 170, rotate: "-41deg", opacity: 0.04 },
  { left: "61%", top: "68%", width: 160, height: 110, rotate: "-16deg", opacity: 0.045 },
] as const;

export function NeonGrid({ variant = "hero" }: NeonGridProps) {
  const isHero = variant === "hero";
  const rows = isHero ? 12 : 9;
  const columns = isHero ? 18 : 14;
  const chevronWidth = isHero ? 86 : 68;
  const rowGap = 100 / rows;
  const columnGap = 100 / columns;
  const chevrons = Array.from({ length: rows + 2 }, (_, row) =>
    Array.from({ length: columns + 2 }, (_, column) => ({
      id: `${row}-${column}`,
      left: `${column * columnGap - columnGap * 0.7}%`,
      top: `${row * rowGap - rowGap * 0.35}%`,
      lowerTop: `${row * rowGap - rowGap * 0.35 + (chevronWidth / 10)}%`,
      width: chevronWidth,
    })),
  ).flat();

  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
      <LinearGradient
        colors={isHero ? ["#070C13", "#050911", "#03070C"] : ["#060B10", "#04070C", "#03060A"]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      <LinearGradient
        colors={["rgba(140, 199, 174, 0.12)", "rgba(140, 199, 174, 0.02)", "rgba(0, 0, 0, 0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          left: "32%",
          right: "22%",
          top: "18%",
          bottom: "10%",
          opacity: isHero ? 0.75 : 0.5,
        }}
      />

      <LinearGradient
        colors={["rgba(120, 179, 155, 0.12)", "rgba(0, 0, 0, 0)"]}
        start={{ x: 0.5, y: 0.2 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          left: "-8%",
          width: "42%",
          top: "52%",
          height: "34%",
          opacity: isHero ? 0.45 : 0.3,
        }}
      />

      <View className="absolute inset-0">
        {stars.map((star, index) => (
          <View
            key={`star-${index}`}
            style={{
              position: "absolute",
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              borderRadius: 999,
              opacity: star.opacity * (isHero ? 1 : 0.8),
              backgroundColor: "#E8FFF5",
            }}
          />
        ))}
      </View>

      <View className={`absolute inset-0 ${isHero ? "opacity-[0.1]" : "opacity-[0.07]"}`}>
        {chevrons.flatMap((chevron) => [
          <View
            key={`${chevron.id}-upper`}
            className="absolute"
            style={{
              left: chevron.left,
              top: chevron.top,
              width: chevron.width,
              height: 1,
              backgroundColor: isHero ? "rgba(154,226,178,0.12)" : "rgba(154,226,178,0.08)",
              transform: [{ rotate: "24deg" }],
            }}
          />,
          <View
            key={`${chevron.id}-lower`}
            className="absolute"
            style={{
              left: chevron.left,
              top: chevron.lowerTop,
              width: chevron.width,
              height: 1,
              backgroundColor: isHero ? "rgba(154,226,178,0.12)" : "rgba(154,226,178,0.08)",
              transform: [{ rotate: "-24deg" }],
            }}
          />,
        ])}
      </View>

      <View className={`${isHero ? "opacity-35" : "opacity-22"} absolute inset-0`}>
        {horizontalLines.map((top) => (
          <View
            key={top}
            className="absolute left-0 right-0 h-px"
            style={{ top, backgroundColor: isHero ? "rgba(136,177,184,0.18)" : "rgba(136,177,184,0.11)" }}
          />
        ))}

        {verticalLines.map((left) => (
          <View
            key={left}
            className="absolute bottom-0 top-0 w-px"
            style={{ left, backgroundColor: isHero ? "rgba(136,177,184,0.18)" : "rgba(136,177,184,0.11)" }}
          />
        ))}
      </View>

      {diagonalTrails.map((trail, index) => (
        <View
          key={`trail-${index}`}
          style={{
            position: "absolute",
            left: trail.left,
            top: trail.top,
            width: trail.width,
            height: 1,
            opacity: isHero ? trail.opacity : trail.opacity * 0.7,
            backgroundColor: "#8CC7AE",
            transform: [{ rotate: trail.rotate }],
          }}
        />
      ))}

      {glassShards.map((shard, index) => (
        <View
          key={`shard-${index}`}
          style={{
            position: "absolute",
            left: shard.left,
            top: shard.top,
            width: shard.width,
            height: shard.height,
            opacity: isHero ? shard.opacity : shard.opacity * 0.75,
            borderWidth: 1,
            borderColor: "rgba(124, 170, 156, 0.08)",
            backgroundColor: "rgba(175, 220, 201, 0.016)",
            transform: [{ rotate: shard.rotate }],
          }}
        />
      ))}

      <View
        className="absolute left-[-15%] right-[-15%] h-px"
        style={{
          top: "50%",
          opacity: isHero ? 0.12 : 0.08,
          backgroundColor: "rgba(154,226,178,0.26)",
          shadowColor: "#9AE2B2",
          shadowOpacity: isHero ? 0.18 : 0.08,
          shadowRadius: isHero ? 10 : 6,
        }}
      />
    </View>
  );
}
