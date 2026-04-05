import { View, type ViewProps } from "react-native";

import { LiveBorderCard } from "@/components/ui/LiveBorderCard";

export function GlassCard({ children, className = "", style, ...rest }: ViewProps) {
  return (
    <LiveBorderCard
      accent="blue"
      radius={18}
      padding={1.3}
      backgroundColor="#FFFFFF"
    >
      <View className={`p-4 ${className}`.trim()} style={style} {...rest}>
        {children}
      </View>
    </LiveBorderCard>
  );
}
