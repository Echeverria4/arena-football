import * as Linking from "expo-linking";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { buildMatchMessage, buildWhatsAppLink } from "@/lib/whatsapp";

interface WhatsAppButtonProps {
  phone: string;
  round: number;
  tournamentName: string;
  isHomePlayerRoomCreator: boolean;
}

export function WhatsAppButton(props: WhatsAppButtonProps) {
  async function handleOpen() {
    const message = buildMatchMessage(props);
    const link = buildWhatsAppLink(props.phone, message);

    await Linking.openURL(link);
  }

  return <PrimaryButton label="Chamar no WhatsApp" onPress={handleOpen} />;
}
