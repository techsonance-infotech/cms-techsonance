import { z } from 'zod';

export const onboardingChecklistSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const onboardingTaskSchema = z.object({
  checklistId: z.number().int().positive(),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().optional().nullable(),
  roleResponsible: z.string().trim().min(1).default('HR'),
  daysToComplete: z.number().int().min(1).default(7),
});

export const employeeOnboardingSchema = z.object({
  employeeId: z.number().int().positive(),
  taskId: z.number().int().positive(),
  status: z.enum(['pending', 'completed', 'skipped']).optional().default('pending'),
  completedBy: z.number().int().positive().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});
