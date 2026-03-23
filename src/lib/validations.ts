import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
});

export const registerSchema = z
  .object({
    name: z.string().min(3, "Informe seu nome."),
    whatsappName: z.string().min(3, "Informe o nome usado no WhatsApp."),
    whatsappNumber: z
      .string()
      .min(10, "Informe um WhatsApp valido.")
      .regex(/^[\d+\-()\s]+$/, "Use apenas numeros e caracteres validos de telefone."),
    email: z.string().email("Informe um e-mail valido."),
    password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
    gamertag: z.string().optional(),
    favoriteTeam: z.string().optional(),
    role: z.enum(["player", "organizer"]),
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

export const tournamentSchema = z.object({
  name: z.string().min(3, "Informe o nome do campeonato."),
  format: z.enum(["league", "groups", "knockout", "groups_knockout"]),
  playerCount: z.coerce.number().min(2).max(128),
  rules: z.string().min(10, "Descreva as regras principais."),
  classificationCriteria: z
    .array(classificationCriterionSchema)
    .min(1, "Selecione ao menos um criterio de classificacao."),
  allowVideos: z.boolean(),
  allowGoalAward: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type TournamentFormValues = z.infer<typeof tournamentSchema>;
