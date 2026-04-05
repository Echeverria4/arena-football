import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Platform, Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";

interface BackButtonProps {
  fallbackHref?: Href;
  label?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function BackButton({
  fallbackHref,
  label = "Voltar",
  onPress,
  style,
}: BackButtonProps) {
  if (!onPress && !fallbackHref) {
    return null;
  }

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    if (fallbackHref) {
      router.replace(fallbackHref);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      className="self-start overflow-hidden rounded-[16px] border border-[#3B5BFF]/18 bg-[#EAF1FF] active:opacity-85"
      style={[
        Platform.OS === "web"
          ? ({
              position: "sticky",
              top: 16,
              zIndex: 40,
            } as never)
          : undefined,
        style,
      ]}
    >
      <View className="flex-row items-center gap-2 rounded-[14px] border border-white/60 bg-[#F7FAFF] px-4 py-3">
        <Ionicons name="arrow-back" size={16} color="#2447A6" />
        <Text className="text-sm font-semibold" style={{ color: "#2447A6" }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
