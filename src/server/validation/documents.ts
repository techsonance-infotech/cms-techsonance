import { z } from 'zod';

export const documentCategorySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().optional().nullable(),
  isRequired: z.boolean().optional().default(false),
});

export const employeeDocumentSchema = z.object({
  employeeId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  documentName: z.string().trim().min(1).max(255),
  fileUrl: z.string().trim().or(z.literal('')).optional().nullable(),
  expiryDate: z.string().date().optional().nullable().or(z.literal('')),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional().default('pending'),
  verifiedBy: z.number().int().positive().optional().nullable(),
  verifiedAt: z.string().datetime().optional().nullable(),
  rejectionReason: z.string().trim().optional().nullable(),
});
