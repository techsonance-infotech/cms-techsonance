import { z } from 'zod';
import {
  firstNameSchema,
  middleNameSchema,
  lastNameSchema,
  emailSchema,
  optionalIndianPhoneSchema,
} from '../../shared/validation/employee';

export const userRoleSchema = z.string().trim().min(1).optional().nullable();

export const createUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(6).max(128).optional().nullable().or(z.literal('')),
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  role: userRoleSchema,
  avatarUrl: z.string().trim().optional().nullable().or(z.literal('')),
  phone: optionalIndianPhoneSchema,
  twoFactorEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
  username: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  middleName: middleNameSchema,
  gender: z.string().trim().optional().nullable().or(z.literal('')),
  officeEmail: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  accountExpiryDate: z.string().optional().nullable().or(z.literal('')),
}).passthrough();

export const updateUserSchema = createUserSchema.partial().extend({
  lastLogin: z.string().optional().nullable().or(z.literal('')),
  password: z.string().max(128).optional().nullable().or(z.literal('')),
}).passthrough();
