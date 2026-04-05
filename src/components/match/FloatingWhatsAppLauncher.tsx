import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";

import { buildMatchMessage, openWhatsAppConversation } from "@/lib/whatsapp";

interface FloatingWhatsAppLauncherProps {
  phone?: string | null;
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
    if (!phone) {
      Alert.alert("WhatsApp indisponivel", "O adversário ainda não informou um número na inscrição.");
      return;
    }

    const message = buildMatchMessage({
      round,
      tournamentName,
      isHomePlayerRoomCreator,
    });

    await openWhatsAppConversation(phone, message);
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
            <View
              style={{
                marginRight: 8,
                borderTopLeftRadius: 18,
                borderBottomLeftRadius: 18,
                borderWidth: 1,
                borderRightWidth: 0,
                borderColor: "rgba(59,91,255,0.32)",
                backgroundColor: "#0B1328",
                paddingHorizontal: 16,
                paddingVertical: 12,
                shadowColor: "#3B5BFF",
                shadowOpacity: 0.14,
                shadowRadius: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "#9AB8FF",
                  fontWeight: "700",
                }}
              >
                WhatsApp
              </Text>
            </View>
          ) : null}

          <View
            style={{
              minWidth: 72,
              minHeight: 72,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(59,91,255,0.36)",
              backgroundColor: "#112018",
              shadowColor: "#3B5BFF",
              shadowOpacity: 0.22,
              shadowRadius: 18,
              borderTopLeftRadius: isHovered ? 18 : 18,
              borderBottomLeftRadius: isHovered ? 18 : 18,
              borderTopRightRadius: isHovered ? 18 : 18,
              borderBottomRightRadius: isHovered ? 18 : 18,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 54,
                height: 54,
                borderRadius: 999,
                backgroundColor: "rgba(59,91,255,0.14)",
              }}
            />

            <Ionicons name="logo-whatsapp" size={28} color="#D7FFE2" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}
