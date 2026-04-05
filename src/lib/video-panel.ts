export const GLOBAL_VIDEO_PANEL_ID = "arena-global-video-panel";
export const GLOBAL_VIDEO_PANEL_NAME = "Painel global de videos";

export function normalizeVideoVoterPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function formatVideoVoterPhone(phone: string) {
  const digits = normalizeVideoVoterPhone(phone);

  if (digits.length === 13) {
    return digits.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4");
  }

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  return phone;
}
