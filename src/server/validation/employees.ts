import { z } from 'zod';

const safeNumber = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}, z.number().nullable().optional());

const safeInt = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : Math.floor(val);
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : Math.floor(num);
}, z.number().int().nullable().optional());

export const employeeStatusSchema = z.string().trim().optional().nullable().transform((val) => {
  if (!val) return 'active';
  const norm = val.toLowerCase().replace(/[\s-]+/g, '_');
  if (norm === 'probation') return 'active';
  if (norm === 'notice_period' || norm === 'onnotice' || norm === 'notice') return 'on_notice';
  if (norm === 'onleave' || norm === 'on_leave' || norm === 'leave') return 'on_leave';
  return norm;
});

export const employmentTypeSchema = z.string().trim().optional().nullable().default('full_time');

export const createEmployeeSchema = z.object({
  userId: z.coerce.number().int().positive(),
  employeeId: z.string().trim().min(1).max(100),
  department: z.string().trim().min(1).max(100),
  designation: z.string().trim().min(1).max(100),
  dateOfJoining: z.string().trim().optional().nullable().or(z.literal('')),
  dateOfBirth: z.string().trim().optional().nullable().or(z.literal('')),
  skills: z.any().optional().nullable(),
  employmentType: employmentTypeSchema,
  salary: safeNumber,
  hourlyRate: safeNumber,
  ctc: safeNumber,
  pfNumber: z.string().trim().max(100).optional().nullable(),
  uanNumber: z.string().trim().max(100).optional().nullable(),
  bankName: z.string().trim().max(150).optional().nullable(),
  bankAccountNumber: z.string().trim().max(50).optional().nullable(),
  ifscCode: z.string().trim().max(20).optional().nullable(),
  managerId: safeInt,
  status: employeeStatusSchema,
  gender: z.string().trim().optional().nullable().or(z.literal('')),
  // Personal Info
  maritalStatus: z.string().trim().optional().nullable(),
  bloodGroup: z.string().trim().optional().nullable(),
  nationality: z.string().trim().optional().nullable(),
  personalIdNumber: z.string().trim().optional().nullable(),
  middleName: z.string().trim().optional().nullable(),
  officeEmail: z.string().trim().optional().nullable(),
  // Work Info
  probationPeriod: safeInt,
  confirmationDate: z.string().trim().optional().nullable().or(z.literal('')),
  workLocation: z.string().trim().optional().nullable(),
  workShift: z.string().trim().optional().nullable(),
  noticePeriod: safeInt,
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
  permissions: z.any().optional().nullable(),
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
  // Hierarchy / Onboarding references
  buddy: z.string().trim().optional().nullable(),
  buddyName: z.string().trim().optional().nullable(),
  mentor: z.string().trim().optional().nullable(),
  mentorName: z.string().trim().optional().nullable(),
}).passthrough();

export const updateEmployeeSchema = createEmployeeSchema.omit({ userId: true }).partial().passthrough();
