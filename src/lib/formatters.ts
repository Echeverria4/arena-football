export function formatDate(date?: string | null) {
  if (!date) {
    return "A definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10) {
    return phone;
  }

  return digits.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4");
}

export function formatPhase(phase: string) {
  return phase.trim() || "Rodada";
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
