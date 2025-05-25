import { z } from "zod";

export const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.array(z.object({
    name: z.string(),
    score: z.number(),
    comment: z.string(),
  })),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
});
