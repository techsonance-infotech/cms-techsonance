import { z } from 'zod';

export const holidayCalendarSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().optional().nullable(),
  year: z.number().int().min(2000).max(2100),
});

export const holidaySchema = z.object({
  calendarId: z.number().int().positive(),
  name: z.string().trim().min(1).max(255),
  holidayDate: z.string().date(),
  isOptional: z.boolean().optional().default(false),
});
