import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";

import { buildMatchMessage, openWhatsAppConversation } from "@/lib/whatsapp";

interface WhatsAppButtonProps {
  phone?: string | null;
  round: number;
  tournamentName: string;
  label?: string;
  compact?: boolean;
  recipientIsHomePlayer?: boolean;
  isHomePlayerRoomCreator?: boolean;
}

export function WhatsAppButton(props: WhatsAppButtonProps) {
  async function handleOpen() {
    if (!props.phone) {
      Alert.alert("WhatsApp indisponivel", "O adversário ainda não informou um número na inscrição.");
      return;
    }

    const message = buildMatchMessage(props);
    await openWhatsAppConversation(props.phone, message);
  }

  return (
    <Pressable
      disabled={!props.phone}
      onPress={handleOpen}
      className="active:opacity-90"
      style={{
        minHeight: props.compact ? 48 : 56,
        opacity: props.phone ? 1 : 0.58,
        width: "100%",
      }}
    >
      <View
        className="flex-row items-center justify-center gap-3 rounded-[20px] px-5 py-4"
        style={{
          borderWidth: 1,
          borderColor: "rgba(59,91,255,0.35)",
          backgroundColor: "#112018",
          shadowColor: "#3B5BFF",
          shadowOpacity: props.compact ? 0.1 : 0.18,
          shadowRadius: props.compact ? 8 : 14,
          paddingHorizontal: props.compact ? 12 : 20,
          paddingVertical: props.compact ? 10 : 16,
        }}
      >
        <Ionicons name="logo-whatsapp" size={props.compact ? 18 : 20} color="#CFFFD9" />
        <Text
          className={props.compact ? "font-semibold" : "font-semibold uppercase"}
          style={{
            fontSize: props.compact ? 13 : 16,
            letterSpacing: props.compact ? 0.3 : 1.4,
            color: "#EFFFF3",
            textAlign: "center",
          }}
        >
          {props.label ?? "Chamar no WhatsApp"}
        </Text>
      </View>
    </Pressable>
  );
}
