import { Text, View, useWindowDimensions } from "react-native";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: "light" | "dark";
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  tone = "light",
}: SectionHeaderProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const isSmallPhone = width < 420;
  const colors =
    tone === "dark"
      ? {
          eyebrow: "#5678C9",
          title: "#1C2B4A",
          subtitle: "#6B7EA3",
          divider: "rgba(59,91,255,0.14)",
        }
      : {
          eyebrow: "#DDE7FF",
          title: "#F3F7FF",
          subtitle: "#AEBBDA",
          divider: "rgba(255,255,255,0.12)",
        };

  return (
    <View className="gap-3">
      {eyebrow ? (
        <View
          className="self-start rounded-full border px-3 py-2"
          style={{
            borderColor: colors.divider,
            backgroundColor: tone === "dark" ? "#F7FAFF" : "rgba(255,255,255,0.06)",
          }}
        >
          <Text
            style={{
              color: colors.eyebrow,
              fontSize: isSmallPhone ? 10 : 11,
              fontWeight: "900",
              letterSpacing: isSmallPhone ? 1.8 : 2.2,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Text>
        </View>
      ) : null}

      <View className="gap-2">
        <Text
          style={{
            color: colors.title,
            fontSize: isSmallPhone ? 20 : isPhone ? 24 : 32,
            fontWeight: "900",
            lineHeight: isSmallPhone ? 26 : isPhone ? 30 : 38,
          }}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={{
              maxWidth: 880,
              color: colors.subtitle,
              fontSize: isSmallPhone ? 13 : isPhone ? 14 : 16,
              lineHeight: isSmallPhone ? 20 : isPhone ? 22 : 28,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
