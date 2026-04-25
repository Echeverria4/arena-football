import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
});

export const registerSchema = z
  .object({
    name: z.string().min(3, "Informe seu nome."),
    whatsappNumber: z
      .string()
      .min(10, "Informe um WhatsApp valido.")
      .regex(/^[\d+\-()\s]+$/, "Use apenas numeros e caracteres validos de telefone."),
    email: z.string().email("Informe um e-mail valido."),
    password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas precisam ser iguais.",
  });

export const classificationCriterionSchema = z.enum([
  "points",
  "goal_difference",
  "goals_for",
  "wins",
  "draws",
  "losses",
  "head_to_head",
]);

export const participantSchema = z.object({
  id: z.string(),
  nome: z.string(),
  time: z.string(),
  whatsapp: z.string().optional(),
});

/**
 * Valida número de WhatsApp brasileiro.
 * Formato obrigatório: 55 + DDD (2 dígitos) + 9 + 8 dígitos = 13 dígitos no total.
 * Exemplo: 5567912345678 → 55 67 9 1234-5678
 * Retorna null se válido (ou vazio), ou string de erro se inválido.
 */
export function validateBrazilianPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 0) return null;

  if (digits.length !== 13) {
    return `O WhatsApp deve ter exatamente 13 dígitos.\nFormato: 55 + DDD + 9 + 8 dígitos\nExemplo: 55 67 9 1234-5678\n\nVocê informou ${digits.length} dígito${digits.length === 1 ? "" : "s"}.`;
  }

  if (!digits.startsWith("55")) {
    return "O número deve começar com 55 (código do Brasil).\nExemplo: 55 67 9 1234-5678";
  }

  if (digits[4] !== "9") {
    return "O 5º dígito deve ser 9 (obrigatório para celulares brasileiros).\nExemplo: 55 67 9 1234-5678";
  }

  return null;
}

export const tournamentSchema = z.object({
  name: z.string().min(3, "Informe o nome do campeonato."),
  format: z.enum(["league", "groups", "knockout", "groups_knockout"]),
  matchMode: z.enum(["single_game", "home_away"]),
  teamRuleMode: z.enum(["open", "preset"]),
  teamRulePresetId: z.string().nullable().optional(),
  playerCount: z.coerce.number().min(2).max(128),
  rules: z.string().min(10, "Descreva as regras principais."),
  classificationCriteria: z
    .array(classificationCriterionSchema)
    .min(1, "Selecione ao menos um criterio de classificacao."),
  allowVideos: z.boolean(),
  allowGoalAward: z.boolean(),
  participants: z.array(participantSchema).min(2, "Adicione pelo menos 2 participantes."),
}).superRefine((values, ctx) => {
  if (values.teamRuleMode === "preset" && !values.teamRulePresetId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["teamRulePresetId"],
      message: "Selecione o continente e depois o país, liga ou grupo de seleções permitido.",
    });
  }
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type TournamentFormValues = z.infer<typeof tournamentSchema>;
export type ParticipantFormValues = z.infer<typeof participantSchema>;
