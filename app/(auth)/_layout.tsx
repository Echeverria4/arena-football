import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#050A11", flex: 1, width: "100%", maxWidth: "100vw" as never, minHeight: 0, overflow: "hidden" as never },
      }}
    />
  );
}
