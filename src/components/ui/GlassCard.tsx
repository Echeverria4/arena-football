import { View, type ViewProps } from "react-native";

export function GlassCard({ children, className = "", style, ...rest }: ViewProps) {
  return (
    <View
      className={`rounded-3xl border p-4 ${className}`.trim()}
      style={[
        {
          borderColor: "#D3D7DC",
          backgroundColor: "#FAFAFA",
          shadowColor: "#A3A8AF",
          shadowOpacity: 0.1,
          shadowRadius: 16,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
