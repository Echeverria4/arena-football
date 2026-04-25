import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Platform, View } from "react-native";

// ─── Accent palette ───────────────────────────────────────────────────────────
// Maps to the CSS --electric-border-color, --electric-light-color, --gradient-color

export type ElectricAccent = "gold" | "silver" | "bronze" | "blue" | "emerald" | "crimson";

const PALETTES: Record<
  ElectricAccent,
  { border: string; light: string; gradient: [string, string, string] }
> = {
  gold: {
    border: "#D48840",
    light: "#FFD070",
    gradient: ["rgba(180,100,20,0.40)", "transparent", "rgba(180,100,20,0.40)"],
  },
  silver: {
    border: "#88AACC",
    light: "#C8DCFF",
    gradient: ["rgba(60,100,160,0.40)", "transparent", "rgba(60,100,160,0.40)"],
  },
  bronze: {
    border: "#B06828",
    light: "#E09050",
    gradient: ["rgba(130,55,10,0.40)", "transparent", "rgba(130,55,10,0.40)"],
  },
  blue: {
    border: "#3B82F6",
    light: "#60A8FF",
    gradient: ["rgba(20,50,180,0.40)", "transparent", "rgba(20,50,180,0.40)"],
  },
  emerald: {
    border: "#10B981",
    light: "#34D399",
    gradient: ["rgba(5,100,60,0.40)", "transparent", "rgba(5,100,60,0.40)"],
  },
  crimson: {
    border: "#E84870",
    light: "#FF6890",
    gradient: ["rgba(160,20,60,0.40)", "transparent", "rgba(160,20,60,0.40)"],
  },
};

// ─── SVG filter injection (web only, singleton) ───────────────────────────────
// Injects the <feTurbulence> + <feDisplacementMap> filter that makes the border
// look like an electric/plasma edge — the core effect from the CSS reference

let filterInjected = false;

export function injectElectricFilter() {
  if (filterInjected || typeof document === "undefined") return;
  filterInjected = true;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.cssText =
    "position:fixed;width:0;height:0;overflow:hidden;pointer-events:none;z-index:-9999";
  svg.setAttribute("aria-hidden", "true");
  // Animations use durs that never share a common multiple so the
  // displacement noise nunca alinha em zero ao mesmo tempo (era a causa
  // do "freeze" momentaneo no mobile). Linear continuo, sem pausa.
  svg.innerHTML = `<defs>
    <filter id="arena-electric" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="n1" seed="1"/>
      <feOffset in="n1" result="on1"><animate attributeName="dy" values="700;-700;700" keyTimes="0;0.5;1" dur="11s" repeatCount="indefinite" calcMode="linear"/></feOffset>
      <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="n2" seed="3"/>
      <feOffset in="n2" result="on2"><animate attributeName="dy" values="-700;700;-700" keyTimes="0;0.5;1" dur="13s" repeatCount="indefinite" calcMode="linear"/></feOffset>
      <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="n3" seed="5"/>
      <feOffset in="n3" result="on3"><animate attributeName="dx" values="490;-490;490" keyTimes="0;0.5;1" dur="7s" repeatCount="indefinite" calcMode="linear"/></feOffset>
      <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="n4" seed="7"/>
      <feOffset in="n4" result="on4"><animate attributeName="dx" values="-490;490;-490" keyTimes="0;0.5;1" dur="9s" repeatCount="indefinite" calcMode="linear"/></feOffset>
      <feComposite in="on1" in2="on2" result="p1"/>
      <feComposite in="on3" in2="on4" result="p2"/>
      <feBlend in="p1" in2="p2" mode="color-dodge" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" xChannelSelector="R" yChannelSelector="B"/>
    </filter>
  </defs>`;

  document.body.appendChild(svg);

  // Continuous flowing border: usa um conic-gradient rotacionando sua
  // angulacao via @property. Matematicamente continuo (360deg = 0deg),
  // sem qualquer ponto morto na transicao do loop. O mask isola apenas
  // o anel da borda (padding box).
  if (!document.getElementById("arena-flow-border-style")) {
    const style = document.createElement("style");
    style.id = "arena-flow-border-style";
    style.textContent = `
@property --arena-conic-from {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes arena-conic-spin {
  to { --arena-conic-from: 360deg; }
}
.arena-flow-border {
  background: conic-gradient(
    from var(--arena-conic-from),
    transparent 0deg,
    var(--arena-flow-color, rgba(255,200,90,0.85)) 50deg,
    rgba(255,255,255,0.98) 80deg,
    var(--arena-flow-color, rgba(255,200,90,0.85)) 110deg,
    transparent 160deg,
    transparent 360deg
  );
  animation: arena-conic-spin 2.4s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  padding: 2px;
  will-change: --arena-conic-from;
}
/* Fallback para browsers sem @property (Firefox antigo): roda o
   elemento inteiro. Como o background eh circular pelo conic, ainda
   parece continuo — so menos suave. */
@supports not (background: conic-gradient(from 0deg, red, blue)) {
  .arena-flow-border { animation: none; }
}
`;
    document.head.appendChild(style);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
// Layered border system extracted from the CSS reference:
//   1. Main border   → turbulent displacement filter (web) / sharp border (native)
//   2. Glow layer 1  → filter:blur(1px) equivalent
//   3. Glow layer 2  → filter:blur(4px) equivalent
//   4. Overlay       → mix-blend-mode:overlay gradient (corner highlights)
//   5. Bg glow       → blurred gradient halo behind the card

export function ElectricBorderLayer({
  accent = "gold",
  radius = 18,
  inset = 0,
}: {
  accent?: ElectricAccent;
  radius?: number;
  /** Negative inset extends the layer beyond the card (use when parent has no overflow:hidden) */
  inset?: number;
}) {
  useEffect(() => {
    if (Platform.OS === "web") injectElectricFilter();
  }, []);

  const c = PALETTES[accent];
  const r = radius + Math.abs(Math.min(inset, 0));

  const base = {
    position: "absolute" as const,
    top: inset,
    left: inset,
    right: inset,
    bottom: inset,
    borderRadius: r,
  };

  return (
    <>
      {/* 0. Continuous flowing highlight (web only) — never pauses, even
             when the SVG turbulence filter is throttled by the mobile
             browser. Renders behind the displaced border so they combine. */}
      {Platform.OS === "web" ? (
        <View
          pointerEvents="none"
          {...{ className: "arena-flow-border" }}
          style={{
            ...base,
            borderRadius: r,
            ...({ "--arena-flow-color": c.light } as object),
          }}
        />
      ) : null}

      {/* 1. Main electric border — displaced on web, solid on native */}
      <View
        pointerEvents="none"
        style={[
          base,
          { borderWidth: 2, borderColor: c.border },
          Platform.OS === "web" ? ({ filter: "url(#arena-electric)" } as object) : {},
        ]}
      />

      {/* 2. Glow layer 1 — filter:blur(1px) */}
      <View
        pointerEvents="none"
        style={{
          ...base,
          borderWidth: 2,
          borderColor: `${c.border}88`,
          shadowColor: c.border,
          shadowRadius: 4,
          shadowOpacity: 0.7,
          shadowOffset: { width: 0, height: 0 },
        }}
      />

      {/* 3. Glow layer 2 — filter:blur(4px) */}
      <View
        pointerEvents="none"
        style={{
          ...base,
          borderWidth: 2,
          borderColor: c.light,
          shadowColor: c.light,
          shadowRadius: 16,
          shadowOpacity: 0.85,
          shadowOffset: { width: 0, height: 0 },
        }}
      />

      {/* 4. Corner highlight overlay (mix-blend-mode:overlay simulation) */}
      <LinearGradient
        colors={["rgba(255,255,255,0.16)", "transparent", "transparent", "rgba(255,255,255,0.16)"]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: inset - 6,
          left: inset - 6,
          right: inset - 6,
          bottom: inset - 6,
          borderRadius: r + 6,
          opacity: 0.9,
        }}
      />

      {/* 5. Background glow halo (z-index:-1 equivalent — render first, visually behind) */}
      <LinearGradient
        colors={c.gradient}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: inset - 16,
          left: inset - 16,
          right: inset - 16,
          bottom: inset - 16,
          borderRadius: r + 16,
          opacity: 0.28,
        }}
      />
    </>
  );
}
