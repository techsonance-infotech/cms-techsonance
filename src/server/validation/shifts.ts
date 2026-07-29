import { z } from 'zod';

export const shiftSchema = z.object({
  name: z.string().trim().min(1).max(255),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Invalid time format (HH:MM)'),
  gracePeriodMinutes: z.number().int().min(0).optional().default(15),
  halfDayHours: z.coerce.number().min(0).optional().default(4),
});

export const employeeShiftSchema = z.object({
  employeeId: z.number().int().positive(),
  shiftId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date().optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});
