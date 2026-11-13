import { z } from 'zod';

export const leaveTypeSchema = z.enum([
  'annual',
  'casual',
  'sick',
  'earned',
  'family',
  'maternity',
  'paternity',
  'study',
  'unpaid',
  'work_from_home',
  'bereavement',
  'compensatory',
]).or(z.string().trim().min(1).max(50));

export const approvalStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const leavePeriodSchema = z.enum([
  'full_day',
  'half_day',
  'hourly',
  'first_half',
  'second_half',
]).or(z.string().trim().min(1).max(50));

export const createLeaveRequestSchema = z.object({
  employeeId: z.preprocess(
    (val) => (val === 0 || val === '0' || val === '' || val === null ? undefined : val),
    z.coerce.number().int().positive().optional()
  ),
  leaveType: leaveTypeSchema,
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().trim().min(1).max(2000),
  leavePeriod: leavePeriodSchema.optional(),
  actualDays: z.coerce.number().min(0).optional(),
  attachmentUrl: z.string().optional().nullable(),
  attachmentName: z.string().optional().nullable(),
});

export const updateLeaveRequestSchema = z.object({
  leaveType: leaveTypeSchema.optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  reason: z.string().trim().min(1).max(2000).optional(),
  leavePeriod: leavePeriodSchema.optional(),
  actualDays: z.coerce.number().min(0).optional(),
  status: approvalStatusSchema.optional(),
  adminComment: z.string().trim().max(2000).optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
  attachmentName: z.string().optional().nullable(),
});

export const createPerformanceReviewSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  reviewerId: z.coerce.number().int().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  reviewPeriod: z.string().trim().min(1).max(255),
  comments: z.string().trim().max(2000).optional().nullable(),
});

export const updatePerformanceReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  reviewPeriod: z.string().trim().min(1).max(255).optional(),
  comments: z.string().trim().max(2000).optional().nullable(),
});

