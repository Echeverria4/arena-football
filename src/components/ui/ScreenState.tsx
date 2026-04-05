import { Text, View } from "react-native";

interface ScreenStateProps {
  description?: string;
  title: string;
  tone?: "dark" | "light";
}

export function ScreenState({
  description,
  title,
  tone = "dark",
}: ScreenStateProps) {
  const styles =
    tone === "dark"
      ? {
          shell: "rgba(255,255,255,0.08)",
          border: "rgba(255,255,255,0.12)",
          accent: "#DDE7FF",
          title: "#F3F7FF",
          description: "#AEBBDA",
        }
      : {
          shell: "#F7FAFF",
          border: "rgba(59,91,255,0.14)",
          accent: "#5678C9",
          title: "#1E2B5C",
          description: "#64748B",
        };

  return (
    <View
      className="gap-4 rounded-[24px] border px-5 py-6"
      style={{
        backgroundColor: styles.shell,
        borderColor: styles.border,
      }}
    >
      <View
        className="self-start rounded-full px-3 py-2"
        style={{
          backgroundColor: tone === "dark" ? "rgba(255,255,255,0.06)" : "#EEF4FF",
        }}
      >
        <Text
          style={{
            color: styles.accent,
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.8,
            textTransform: "uppercase",
          }}
        >
          Estado da tela
        </Text>
      </View>

      <Text
        style={{
          color: styles.title,
          fontSize: 26,
          fontWeight: "900",
        }}
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={{
            color: styles.description,
            fontSize: 15,
            lineHeight: 26,
          }}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}
