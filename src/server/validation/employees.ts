import { z } from 'zod';
import {
  optionalPanSchema,
  optionalAadhaarSchema,
  optionalIfscSchema,
  optionalBankAccountSchema,
  optionalIndianPhoneSchema,
  optionalDobSchema,
  optionalLinkedinUrlSchema,
  optionalGithubUrlSchema,
  optionalSalarySchema,
  optionalHourlyRateSchema,
  optionalCtcSchema,
  optionalCurrencySchema,
  optionalBankNameSchema,
  optionalBranchNameSchema,
  optionalPfNumberSchema,
  optionalUanNumberSchema,
  optionalEsiNumberSchema,
  isJoiningDateValidForDob,
  cleanIndianPhone,
  validatePersonalIdByGovtId,
} from '../../shared/validation/employee';

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

export const baseEmployeeSchema = z
  .object({
    userId: z.coerce.number().int().positive(),
    employeeId: z.string().trim().min(1, 'Employee ID is required').max(100, 'Employee ID cannot exceed 100 characters'),
    department: z.string().trim().min(1, 'Department is required').max(100, 'Department cannot exceed 100 characters'),
    designation: z.string().trim().min(1, 'Designation is required').max(100, 'Designation cannot exceed 100 characters'),
    dateOfJoining: z.string().trim().optional().nullable().or(z.literal('')),
    dateOfBirth: optionalDobSchema,
    skills: z.any().optional().nullable(),
    employmentType: employmentTypeSchema,
    salary: optionalSalarySchema,
    hourlyRate: optionalHourlyRateSchema,
    ctc: optionalCtcSchema,
    pfNumber: optionalPfNumberSchema,
    uanNumber: optionalUanNumberSchema,
    bankName: optionalBankNameSchema,
    bankAccountNumber: optionalBankAccountSchema,
    ifscCode: optionalIfscSchema,
    managerId: safeInt,
    status: employeeStatusSchema,
    gender: z.string().trim().max(50).optional().nullable().or(z.literal('')),
    // Personal Info
    maritalStatus: z.string().trim().max(50).optional().nullable(),
    bloodGroup: z.string().trim().max(10).optional().nullable(),
    nationality: z.string().trim().max(50).optional().nullable(),
    govtIdType: z.string().trim().optional().nullable(),
    personalIdNumber: z.string().trim().max(100, 'Personal ID cannot exceed 100 characters').optional().nullable(),
    middleName: z.string().trim().max(100, 'Middle name cannot exceed 100 characters').optional().nullable(),
    officeEmail: z.string().trim().max(255, 'Office email cannot exceed 255 characters').optional().nullable(),
    phone: optionalIndianPhoneSchema,
    // Work Info
    probationPeriod: safeInt,
    confirmationDate: z.string().trim().optional().nullable().or(z.literal('')),
    workLocation: z.string().trim().max(100, 'Work location cannot exceed 100 characters').optional().nullable(),
    workShift: z.string().trim().max(100, 'Work shift cannot exceed 100 characters').optional().nullable(),
    noticePeriod: safeInt,
    // Financials / Compliance
    currency: optionalCurrencySchema,
    branchName: optionalBranchNameSchema,
    esiNumber: optionalEsiNumberSchema,
    panNumber: optionalPanSchema,
    aadhaarNumber: optionalAadhaarSchema,
    // Documents (Urls)
    aadhaarCardUrl: z.string().trim().max(1000).optional().nullable(),
    panCardUrl: z.string().trim().max(1000).optional().nullable(),
    addressProofUrl: z.string().trim().max(1000).optional().nullable(),
    educationCertificateUrl: z.string().trim().max(1000).optional().nullable(),
    experienceCertificateUrl: z.string().trim().max(1000).optional().nullable(),
    resumeUrl: z.string().trim().max(1000).optional().nullable(),
    // Permissions
    permissions: z.any().optional().nullable(),
    // Emergency Contact
    emergencyContactName: z.string().trim().max(100, 'Emergency contact name cannot exceed 100 characters').optional().nullable(),
    emergencyContactRelationship: z.string().trim().max(50, 'Emergency contact relationship cannot exceed 50 characters').optional().nullable(),
    emergencyContactPhone: optionalIndianPhoneSchema,
    emergencyContactAddress: z.string().trim().max(500, 'Emergency contact address cannot exceed 500 characters').optional().nullable(),
    // Additional Info
    languagesKnown: z.string().trim().max(255, 'Languages known cannot exceed 255 characters').optional().nullable(),
    linkedinProfile: optionalLinkedinUrlSchema,
    githubProfile: optionalGithubUrlSchema,
    previousCompany: z.string().trim().max(255, 'Previous company cannot exceed 255 characters').optional().nullable(),
    referralSource: z.string().trim().max(100, 'Referral source cannot exceed 100 characters').optional().nullable(),
    notes: z.string().trim().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable(),
    // Hierarchy / Onboarding references
    buddy: z.string().trim().max(100).optional().nullable(),
    buddyName: z.string().trim().max(100).optional().nullable(),
    mentor: z.string().trim().max(100).optional().nullable(),
    mentorName: z.string().trim().max(100).optional().nullable(),
  })
  .passthrough();

export const createEmployeeSchema = baseEmployeeSchema
  .refine(
    (data) => {
      if (data.dateOfBirth && data.dateOfJoining) {
        return isJoiningDateValidForDob(data.dateOfBirth, data.dateOfJoining);
      }
      return true;
    },
    {
      message: 'Joining date must be at least 18 years after date of birth',
      path: ['dateOfJoining'],
    }
  )
  .refine(
    (data) => {
      if (data.emergencyContactPhone && data.phone) {
        const cleanEmergency = cleanIndianPhone(data.emergencyContactPhone);
        const cleanEmp = cleanIndianPhone(data.phone);
        if (cleanEmergency && cleanEmp && cleanEmergency === cleanEmp) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Emergency contact phone number cannot be identical to employee phone number',
      path: ['emergencyContactPhone'],
    }
  )
  .superRefine((data, ctx) => {
    if (data.personalIdNumber) {
      const err = validatePersonalIdByGovtId(data.personalIdNumber, data.govtIdType);
      if (err) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: err,
          path: ['personalIdNumber'],
        });
      }
    }
    if (
      typeof data.salary === 'number' &&
      data.salary > 0 &&
      typeof data.ctc === 'number' &&
      data.ctc > 0 &&
      data.ctc < data.salary * 12
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Annual CTC cannot be less than 12 × Monthly Base Salary.',
        path: ['ctc'],
      });
    }
  });

export const updateEmployeeSchema = baseEmployeeSchema
  .omit({ userId: true })
  .partial()
  .passthrough()
  .refine(
    (data) => {
      if (data.dateOfBirth && data.dateOfJoining) {
        return isJoiningDateValidForDob(data.dateOfBirth, data.dateOfJoining);
      }
      return true;
    },
    {
      message: 'Joining date must be at least 18 years after date of birth',
      path: ['dateOfJoining'],
    }
  )
  .refine(
    (data) => {
      if (data.emergencyContactPhone && data.phone) {
        const cleanEmergency = cleanIndianPhone(data.emergencyContactPhone);
        const cleanEmp = cleanIndianPhone(data.phone);
        if (cleanEmergency && cleanEmp && cleanEmergency === cleanEmp) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Emergency contact phone number cannot be identical to employee phone number',
      path: ['emergencyContactPhone'],
    }
  )
  .superRefine((data, ctx) => {
    if (data.personalIdNumber && data.govtIdType) {
      const err = validatePersonalIdByGovtId(data.personalIdNumber, data.govtIdType);
      if (err) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: err,
          path: ['personalIdNumber'],
        });
      }
    }
    if (
      typeof data.salary === 'number' &&
      data.salary > 0 &&
      typeof data.ctc === 'number' &&
      data.ctc > 0 &&
      data.ctc < data.salary * 12
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Annual CTC cannot be less than 12 × Monthly Base Salary.',
        path: ['ctc'],
      });
    }
  });
