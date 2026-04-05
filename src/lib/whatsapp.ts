import * as Linking from "expo-linking";

interface MatchMessageParams {
  round?: number | string | null;
  tournamentName: string;
  recipientIsHomePlayer?: boolean;
  isHomePlayerRoomCreator?: boolean;
}

export function buildMatchMessage({
  round,
  tournamentName,
  recipientIsHomePlayer,
  isHomePlayerRoomCreator,
}: MatchMessageParams) {
  if (round === undefined || round === null || round === "") {
    return `Ola, o campeonato ${tournamentName} ainda esta em preparacao. Quando as rodadas forem liberadas, combinamos por aqui.`;
  }

  const recipientCreatesRoom = recipientIsHomePlayer ?? isHomePlayerRoomCreator ?? false;

  const roomLine = recipientCreatesRoom
    ? "Como voce joga em casa, voce cria a sala."
    : "O jogador mandante cria a sala.";

  return `Ola, nossa partida da rodada ${round} do campeonato ${tournamentName} ja esta disponivel. ${roomLine} Quando puder, me chama para jogarmos.`;
}

export function buildWhatsAppLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);

  return `https://wa.me/${digits}?text=${encoded}`;
}

export function buildWhatsAppAppLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);

  return `whatsapp://send?phone=${digits}&text=${encoded}`;
}

export async function openWhatsAppConversation(phone: string, message: string) {
  const appLink = buildWhatsAppAppLink(phone, message);
  const webLink = buildWhatsAppLink(phone, message);

  if (typeof window !== "undefined") {
    window.location.assign(webLink);
    return;
  }

  try {
    const canOpenApp = await Linking.canOpenURL(appLink);

    if (canOpenApp) {
      try {
        await Linking.openURL(appLink);
        return;
      } catch {
        // Fall through to browser link.
      }
    }
  } catch {
    // Fall back to the browser when the native handler is unavailable.
  }

  await Linking.openURL(webLink);
}
