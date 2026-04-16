import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

interface NeonGridProps {
  variant?: "soft" | "hero";
}

// Nuvens nebulosas — elipses grandes, opacity muito baixa, sobrepostas naturalmente
// Simulam radial-gradient(ellipse ...) do CSS
const nebulaClouds = [
  // Mancha roxa — canto superior esquerdo
  { left: "4%",  top: "14%", width: 420, height: 240, rotate: "-14deg",
    color: "rgba(91,63,140,0.20)" },
  // Mancha azul profunda — superior direito
  { left: "50%", top: "6%",  width: 360, height: 200, rotate: "9deg",
    color: "rgba(58,95,168,0.15)" },
  // Mancha ciana — lateral direita centro
  { left: "64%", top: "48%", width: 320, height: 175, rotate: "-6deg",
    color: "rgba(78,155,184,0.11)" },
  // Roxo difuso — centro da tela
  { left: "25%", top: "42%", width: 380, height: 210, rotate: "18deg",
    color: "rgba(139,92,246,0.10)" },
  // Azul secundário — inferior direito
  { left: "42%", top: "68%", width: 300, height: 165, rotate: "-11deg",
    color: "rgba(59,130,246,0.09)" },
  // Ciano suave — inferior esquerdo
  { left: "-8%", top: "60%", width: 280, height: 155, rotate: "6deg",
    color: "rgba(34,211,238,0.07)" },
  // Roxo escuro extra — hero only — topo centro
  { left: "30%", top: "-4%", width: 340, height: 190, rotate: "3deg",
    color: "rgba(59,28,100,0.18)" },
] as const;

// Estrelas — pequenas, densas, coloridas como numa astrophoto real
const stars = [
  // Brancas puras — maioria
  { left: "2%",   top: "5%",  size: 1.2, opacity: 0.70 },
  { left: "7%",   top: "28%", size: 1.8, opacity: 0.60 },
  { left: "11%",  top: "14%", size: 0.9, opacity: 0.50 },
  { left: "15%",  top: "72%", size: 1.4, opacity: 0.55 },
  { left: "19%",  top: "44%", size: 0.8, opacity: 0.42 },
  { left: "24%",  top: "88%", size: 1.6, opacity: 0.48 },
  { left: "28%",  top: "18%", size: 2.0, opacity: 0.65 },
  { left: "33%",  top: "55%", size: 1.0, opacity: 0.46 },
  { left: "37%",  top: "8%",  size: 1.4, opacity: 0.62 },
  { left: "41%",  top: "80%", size: 0.8, opacity: 0.38 },
  { left: "45%",  top: "32%", size: 2.2, opacity: 0.58 },
  { left: "49%",  top: "65%", size: 1.0, opacity: 0.44 },
  { left: "53%",  top: "20%", size: 1.6, opacity: 0.62 },
  { left: "57%",  top: "50%", size: 0.9, opacity: 0.40 },
  { left: "61%",  top: "84%", size: 1.8, opacity: 0.50 },
  { left: "65%",  top: "12%", size: 1.2, opacity: 0.66 },
  { left: "69%",  top: "40%", size: 0.8, opacity: 0.42 },
  { left: "73%",  top: "70%", size: 2.0, opacity: 0.48 },
  { left: "77%",  top: "24%", size: 1.4, opacity: 0.60 },
  { left: "81%",  top: "56%", size: 1.0, opacity: 0.46 },
  { left: "85%",  top: "8%",  size: 1.8, opacity: 0.64 },
  { left: "89%",  top: "78%", size: 1.2, opacity: 0.44 },
  { left: "93%",  top: "36%", size: 1.6, opacity: 0.54 },
  { left: "97%",  top: "62%", size: 0.9, opacity: 0.40 },
  // Lilás — nas regiões das nebulosas roxas
  { left: "8%",   top: "22%", size: 1.4, opacity: 0.58, tint: "#DDD6FE" },
  { left: "21%",  top: "50%", size: 1.2, opacity: 0.52, tint: "#C4B5FD" },
  { left: "35%",  top: "35%", size: 1.8, opacity: 0.55, tint: "#E9D5FF" },
  { left: "55%",  top: "72%", size: 1.0, opacity: 0.46, tint: "#DDD6FE" },
  { left: "74%",  top: "45%", size: 1.6, opacity: 0.50, tint: "#C4B5FD" },
  { left: "88%",  top: "20%", size: 1.2, opacity: 0.56, tint: "#E9D5FF" },
  // Ciana — nas regiões das nebulosas azuis
  { left: "16%",  top: "62%", size: 1.4, opacity: 0.50, tint: "#A5F3FC" },
  { left: "48%",  top: "15%", size: 1.0, opacity: 0.48, tint: "#BAE6FD" },
  { left: "66%",  top: "58%", size: 1.8, opacity: 0.52, tint: "#A5F3FC" },
  { left: "82%",  top: "66%", size: 1.2, opacity: 0.44, tint: "#BAE6FD" },
  // Pontinhos minúsculos — camada de poeira estelar
  { left: "5%",   top: "50%", size: 0.7, opacity: 0.35 },
  { left: "13%",  top: "36%", size: 0.6, opacity: 0.30 },
  { left: "26%",  top: "76%", size: 0.7, opacity: 0.32 },
  { left: "39%",  top: "92%", size: 0.6, opacity: 0.28 },
  { left: "52%",  top: "42%", size: 0.7, opacity: 0.34 },
  { left: "63%",  top: "28%", size: 0.6, opacity: 0.30 },
  { left: "76%",  top: "88%", size: 0.7, opacity: 0.32 },
  { left: "91%",  top: "48%", size: 0.6, opacity: 0.28 },
] as const;

export function NeonGrid({ variant = "hero" }: NeonGridProps) {
  const isHero = variant === "hero";

  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">

      {/* ── Fundo base: espaço profundo ── */}
      <LinearGradient
        colors={["#03050B", "#070B14", "#0B1020"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* ── Nuvens nebulosas — elipses difusas sobrepostas ── */}
      {nebulaClouds.map((cloud, index) => {
        // A última mancha (índice 6) é hero-only
        if (index === 6 && !isHero) return null;
        return (
          <View
            key={`nebula-${index}`}
            style={{
              position: "absolute",
              left: cloud.left as any,
              top: cloud.top as any,
              width: cloud.width,
              height: cloud.height,
              borderRadius: 999,
              backgroundColor: cloud.color,
              // Sem shadowRadius — evita o aspecto "neon ring"
              // O efeito difuso vem das cores com opacity muito baixa
              transform: [{ rotate: cloud.rotate }],
            }}
          />
        );
      })}

      {/* Véu de luz difusa — hero: roxo/azul sobre o centro */}
      {isHero && (
        <LinearGradient
          colors={[
            "rgba(139,92,246,0.08)",
            "rgba(59,130,246,0.05)",
            "rgba(34,211,238,0.03)",
            "rgba(0,0,0,0)",
          ]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={{ position: "absolute", inset: 0, opacity: 0.9 }}
        />
      )}

      {/* ── Estrelas ── */}
      <View className="absolute inset-0">
        {stars.map((star, index) => (
          <View
            key={`star-${index}`}
            style={{
              position: "absolute",
              left: star.left as any,
              top: star.top as any,
              width: star.size,
              height: star.size,
              borderRadius: 999,
              opacity: (star.opacity * (isHero ? 1 : 0.72)),
              backgroundColor: (star as any).tint ?? "#FFFFFF",
            }}
          />
        ))}
      </View>

      {/* ── Grade muitíssimo sutil (quase invisível) — só hero ── */}
      {isHero && (
        <View style={{ position: "absolute", inset: 0, opacity: 0.06 }}>
          {(["20%", "52%", "84%"] as const).map((top) => (
            <View
              key={`h-${top}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top,
                height: 1,
                backgroundColor: "rgba(139,92,246,0.30)",
              }}
            />
          ))}
          {(["22%", "50%", "78%"] as const).map((left) => (
            <View
              key={`v-${left}`}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left,
                width: 1,
                backgroundColor: "rgba(34,211,238,0.20)",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
