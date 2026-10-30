import { z } from 'zod';

export const userRoleSchema = z.string().trim().min(1).optional().nullable();

export const createUserSchema = z.object({
  email: z.string().trim().min(1).max(255),
  password: z.string().min(6).max(128).optional().nullable().or(z.literal('')),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  role: userRoleSchema,
  avatarUrl: z.string().trim().optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  twoFactorEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
  username: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  middleName: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  gender: z.string().trim().optional().nullable().or(z.literal('')),
  officeEmail: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  accountExpiryDate: z.string().optional().nullable().or(z.literal('')),
}).passthrough();

export const updateUserSchema = createUserSchema.partial().extend({
  lastLogin: z.string().optional().nullable().or(z.literal('')),
  password: z.string().max(128).optional().nullable().or(z.literal('')),
}).passthrough();
