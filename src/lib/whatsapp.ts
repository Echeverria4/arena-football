interface MatchMessageParams {
  round?: number | string | null;
  tournamentName: string;
  isHomePlayerRoomCreator?: boolean;
}

export function buildMatchMessage({
  round,
  tournamentName,
  isHomePlayerRoomCreator,
}: MatchMessageParams) {
  if (round === undefined || round === null || round === "") {
    return `Ola, o campeonato ${tournamentName} ainda esta em preparacao. Quando as rodadas forem liberadas, combinamos por aqui.`;
  }

  const roomLine = isHomePlayerRoomCreator
    ? "Como voce joga em casa, voce cria a sala."
    : "O jogador mandante cria a sala.";

  return `Ola, nossa partida da rodada ${round} do campeonato ${tournamentName} ja esta disponivel. ${roomLine} Quando puder, me chama para jogarmos.`;
}

export function buildWhatsAppLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);

  return `https://wa.me/${digits}?text=${encoded}`;
}
