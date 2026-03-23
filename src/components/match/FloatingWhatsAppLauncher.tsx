import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { buildMatchMessage, buildWhatsAppLink } from "@/lib/whatsapp";

interface FloatingWhatsAppLauncherProps {
  phone: string;
  round?: number | null;
  tournamentName: string;
  isHomePlayerRoomCreator?: boolean;
}

export function FloatingWhatsAppLauncher({
  phone,
  round,
  tournamentName,
  isHomePlayerRoomCreator,
}: FloatingWhatsAppLauncherProps) {
  const [isHovered, setIsHovered] = useState(Platform.OS !== "web");

  async function handleOpen() {
    const message = buildMatchMessage({
      round,
      tournamentName,
      isHomePlayerRoomCreator,
    });
    const link = buildWhatsAppLink(phone, message);

    await Linking.openURL(link);
  }

  return (
    <View
      pointerEvents="box-none"
      style={
        Platform.OS === "web"
          ? ({
              position: "fixed",
              right: 16,
              top: "50%",
              transform: [{ translateY: -44 }],
              zIndex: 9999,
              overflow: "visible",
            } as const)
          : ({
              position: "absolute",
              right: 16,
              bottom: 108,
              zIndex: 9999,
            } as const)
      }
    >
      <Pressable
        onPress={handleOpen}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={{ overflow: "visible" }}
      >
        <View className="flex-row items-center">
          {isHovered ? (
            <View className="mr-2 rounded-l-2xl border border-arena-line bg-arena-card px-4 py-3 opacity-100">
              <Text className="text-[11px] uppercase tracking-[2px] text-arena-neon">WhatsApp</Text>
            </View>
          ) : null}

          <View
            className={`items-center justify-center border border-arena-neon bg-arena-neon px-4 py-4 shadow-neon active:opacity-90 ${
              isHovered ? "rounded-l-2xl rounded-r-none border-r-0" : "rounded-2xl"
            }`}
            style={{ minWidth: 72, minHeight: 72 }}
          >
            <Ionicons name="logo-whatsapp" size={28} color="#050816" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}
