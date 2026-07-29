import { z } from 'zod';

export const trainingProgramSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().optional().nullable(),
  instructor: z.string().trim().optional().nullable(),
  durationHours: z.coerce.number().min(0).optional().nullable(),
  code: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  subcategory: z.string().trim().optional().nullable(),
  difficultyLevel: z.string().trim().optional().nullable(),
  targetAudience: z.string().trim().optional().nullable(),
  deliveryMethod: z.string().trim().optional().nullable(),
  validityPeriod: z.coerce.number().optional().nullable(),
  ceCredits: z.coerce.number().optional().nullable(),
  costCentre: z.string().trim().optional().nullable(),
  pricing: z.coerce.number().optional().nullable(),
  passingCriteria: z.coerce.number().optional().nullable(),
});

export const trainingEnrollmentSchema = z.object({
  programId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  status: z.enum(['enrolled', 'in_progress', 'completed', 'failed']).optional().default('enrolled'),
  progressPercentage: z.number().int().min(0).max(100).optional().default(0),
  completedAt: z.string().datetime().optional().nullable(),
  sessionId: z.number().int().positive().optional().nullable(),
  nominatedBy: z.number().int().positive().optional().nullable(),
  enrolmentType: z.string().trim().optional().nullable(),
  assessmentScore: z.coerce.number().optional().nullable(),
  certificateUrl: z.string().trim().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});

export const certificationSchema = z.object({
  employeeId: z.number().int().positive(),
  name: z.string().trim().min(1).max(255),
  issuingOrganization: z.string().trim().min(1).max(255),
  credentialId: z.string().trim().optional().nullable(),
  issueDate: z.string().date().optional().nullable().or(z.literal('')),
  expiryDate: z.string().date().optional().nullable().or(z.literal('')),
  verificationStatus: z.enum(['pending', 'verified']).optional().default('pending'),
});

export const skillMatrixSchema = z.object({
  employeeId: z.number().int().positive(),
  skillName: z.string().trim().min(1).max(255),
  proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional().default('beginner'),
  yearsOfExperience: z.coerce.number().min(0).optional().default(0),
});
