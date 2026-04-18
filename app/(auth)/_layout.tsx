import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#050A11", flex: 1, width: "100%", minHeight: 0 },
      }}
    />
  );
}
