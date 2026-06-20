import { z } from 'zod';

export const scheduledEventTypeEnum = z.enum([
  'INTERVIEW',
  'ASSESSMENT',
  'DEADLINE',
  'FOLLOWUP',
  'OTHER',
]);

/** Manually create a scheduled event against an application. */
export const createEventSchema = z.object({
  applicationId: z.string().min(1, 'applicationId is required'),
  title: z.string().min(1, 'Event needs a title'),
  type: scheduledEventTypeEnum.default('OTHER'),
  scheduledAt: z.string().min(1, 'A date and time is required'), // ISO date-time
  note: z.string().nullable().optional(),
});
export type CreateEventDto = z.infer<typeof createEventSchema>;

/** Edit an event, or mark it done. */
export const updateEventSchema = z
  .object({
    title: z.string().min(1).optional(),
    type: scheduledEventTypeEnum.optional(),
    scheduledAt: z.string().min(1).optional(),
    note: z.string().nullable().optional(),
    completed: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
