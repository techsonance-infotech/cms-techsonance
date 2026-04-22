import { z } from 'zod';

export const employeeStatusSchema = z.enum(['active', 'on_leave', 'resigned']);

export const employmentTypeSchema = z.enum(['full_time', 'part_time', 'contract', 'intern']);

export const createEmployeeSchema = z.object({
  userId: z.coerce.number().int().positive(),
  employeeId: z.string().trim().min(1).max(100),
  department: z.string().trim().min(1).max(100),
  designation: z.string().trim().min(1).max(100),
  dateOfJoining: z.string().date(),
  dateOfBirth: z.string().date().optional().nullable(),
  skills: z.array(z.string().trim().min(1).max(100)).optional().nullable(),
  employmentType: employmentTypeSchema.optional().default('full_time'),
  salary: z.coerce.number().min(0).optional().nullable(),
  hourlyRate: z.coerce.number().min(0).optional().nullable(),
  ctc: z.coerce.number().min(0).optional().nullable(),
  pfNumber: z.string().trim().max(100).optional().nullable(),
  uanNumber: z.string().trim().max(100).optional().nullable(),
  bankName: z.string().trim().max(150).optional().nullable(),
  bankAccountNumber: z.string().trim().max(50).optional().nullable(),
  ifscCode: z.string().trim().max(20).optional().nullable(),
  managerId: z.coerce.number().int().positive().optional().nullable(),
  status: employeeStatusSchema.optional(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.omit({ userId: true }).partial();

