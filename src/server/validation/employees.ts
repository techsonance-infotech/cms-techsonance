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
  gender: z.string().trim().optional().nullable(),
  // Personal Info
  maritalStatus: z.string().trim().optional().nullable(),
  bloodGroup: z.string().trim().optional().nullable(),
  nationality: z.string().trim().optional().nullable(),
  personalIdNumber: z.string().trim().optional().nullable(),
  // Work Info
  probationPeriod: z.coerce.number().int().min(0).optional().nullable(),
  confirmationDate: z.string().date().optional().nullable().or(z.literal('')),
  workLocation: z.string().trim().optional().nullable(),
  workShift: z.string().trim().optional().nullable(),
  noticePeriod: z.coerce.number().int().min(0).optional().nullable(),
  // Financials / Compliance
  currency: z.string().trim().optional().nullable(),
  branchName: z.string().trim().optional().nullable(),
  esiNumber: z.string().trim().optional().nullable(),
  panNumber: z.string().trim().optional().nullable(),
  aadhaarNumber: z.string().trim().optional().nullable(),
  // Documents (Urls)
  aadhaarCardUrl: z.string().trim().optional().nullable(),
  panCardUrl: z.string().trim().optional().nullable(),
  addressProofUrl: z.string().trim().optional().nullable(),
  educationCertificateUrl: z.string().trim().optional().nullable(),
  experienceCertificateUrl: z.string().trim().optional().nullable(),
  resumeUrl: z.string().trim().optional().nullable(),
  // Permissions
  permissions: z.array(z.string().trim()).optional().nullable(),
  // Emergency Contact
  emergencyContactName: z.string().trim().optional().nullable(),
  emergencyContactRelationship: z.string().trim().optional().nullable(),
  emergencyContactPhone: z.string().trim().optional().nullable(),
  emergencyContactAddress: z.string().trim().optional().nullable(),
  // Additional Info
  languagesKnown: z.string().trim().optional().nullable(),
  linkedinProfile: z.string().trim().optional().nullable(),
  githubProfile: z.string().trim().optional().nullable(),
  previousCompany: z.string().trim().optional().nullable(),
  referralSource: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.omit({ userId: true }).partial();

