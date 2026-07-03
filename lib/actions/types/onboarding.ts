import { z } from "zod";

export const OnboardingDataSchema = z.object({
  goals: z.array(z.string()).default([]),
  customGoal: z.string().max(200).optional(),
  niche: z.string().max(120).optional(),
  audience: z.string().max(120).optional(),
  frequency: z.string().max(80).optional(),
  experience: z.string().max(80).optional(),
  productUpdates: z.boolean().optional(),
  tips: z.boolean().optional(),
  emailFrequency: z.enum(["daily", "weekly", "monthly", "never"]).optional(),
});

export type OnboardingData = z.infer<typeof OnboardingDataSchema>;
