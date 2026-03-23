import { Text, View } from "react-native";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ eyebrow, title, subtitle }: SectionHeaderProps) {
  return (
    <View className="gap-1">
      {eyebrow ? (
        <Text className="text-sm uppercase tracking-[3px] text-arena-text">{eyebrow}</Text>
      ) : null}
      <Text className="text-3xl font-bold text-arena-text">{title}</Text>
      {subtitle ? <Text className="text-base leading-7 text-arena-muted">{subtitle}</Text> : null}
    </View>
  );
}
