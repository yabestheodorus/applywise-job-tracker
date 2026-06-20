import { z } from 'zod';

export const createStageSchema = z.object({
  label: z.string().min(1).max(60),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #10b981')
    .optional(),
  order: z.number().int().min(0).optional(),
  isTerminal: z.boolean().optional(),
});
export type CreateStageDto = z.infer<typeof createStageSchema>;

export const updateStageSchema = createStageSchema.partial();
export type UpdateStageDto = z.infer<typeof updateStageSchema>;
