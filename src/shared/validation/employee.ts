import { z } from 'zod';

// ============================================================================
// UPLOAD CONSTANTS & MAGIC-BYTE SPECIFICATIONS
// ============================================================================

export const UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_DOCUMENT_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.webp'] as const,
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
  ] as const,
};

export type AllowedMimeType = (typeof UPLOAD_LIMITS.ALLOWED_MIME_TYPES)[number];

/**
 * Verify file header signatures (magic bytes) to prevent file-type spoofing
 */
export function verifyMagicBytes(buffer: Uint8Array | ArrayBuffer | Buffer): {
  valid: boolean;
  detectedType: 'pdf' | 'png' | 'jpeg' | 'webp' | 'docx' | 'unknown';
} {
  const bytes = buffer instanceof Uint8Array 
    ? buffer 
    : buffer instanceof ArrayBuffer 
      ? new Uint8Array(buffer) 
      : new Uint8Array(buffer as any);

  if (!bytes || bytes.length < 4) {
    return { valid: false, detectedType: 'unknown' };
  }

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { valid: true, detectedType: 'pdf' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A
  ) {
    return { valid: true, detectedType: 'png' };
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { valid: true, detectedType: 'jpeg' };
  }

  // WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { valid: true, detectedType: 'webp' };
  }

  // DOCX: ZIP container format PK\x03\x04 (0x50 0x4B 0x03 0x04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return { valid: true, detectedType: 'docx' };
  }

  return { valid: false, detectedType: 'unknown' };
}

// ============================================================================
// VERHOEFF CHECKSUM ALGORITHM (FOR AADHAAR CARD VALIDATION)
// ============================================================================

const d: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const inv: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validate Aadhaar number using Verhoeff algorithm
 */
export function validateVerhoeff(numStr: string): boolean {
  if (!numStr || !/^\d+$/.test(numStr)) return false;
  let c = 0;
  const digits = numStr.split('').map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }
  return c === 0;
}

/**
 * Generate check digit for number string using Verhoeff algorithm
 */
export function generateVerhoeff(numStr: string): number {
  let c = 0;
  const digits = numStr.split('').map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[(i + 1) % 8][digits[i]]];
  }
  return inv[c];
}

// ============================================================================
// CLEANING & NORMALIZATION HELPERS
// ============================================================================

export function cleanPan(val: string | null | undefined): string {
  return (val ?? '').replace(/\s+/g, '').toUpperCase().trim();
}

export function cleanAadhaar(val: string | null | undefined): string {
  return (val ?? '').replace(/[\s\-]/g, '').trim();
}

export function cleanIfsc(val: string | null | undefined): string {
  return (val ?? '').replace(/\s+/g, '').toUpperCase().trim();
}

export function cleanBankAccount(val: string | null | undefined): string {
  return (val ?? '').replace(/[\s\-]/g, '').trim();
}

export function cleanIndianPhone(val: string | null | undefined): string {
  let cleaned = (val ?? '').replace(/[\s\-\(\)\.]/g, '').trim();
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

export function cleanUsername(val: string | null | undefined): string {
  return (val ?? '').trim().toLowerCase();
}

/**
 * Generates a clean base username from firstName, lastName (and optional middleName)
 * following the workspace username formula ('first.last' | 'first_l' | 'first.middle.last').
 */
export function buildBaseUsername(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  middleName?: string | null,
  pattern: string = 'first.last'
): string {
  const sanitizePart = (part: string | null | undefined): string =>
    (part ?? '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const first = sanitizePart(firstName);
  const middle = sanitizePart(middleName);
  const last = sanitizePart(lastName);

  if (!first && !last) return '';

  let base = '';
  switch ((pattern ?? 'first.last').trim().toLowerCase()) {
    case 'first_l':
      base = first && last ? `${first}_${last[0]}` : (first || last);
      break;
    case 'first.middle.last':
      base = [first, middle, last].filter(Boolean).join('.');
      break;
    case 'first.last':
    default:
      base = [first, last].filter(Boolean).join('.');
      break;
  }

  base = base
    .replace(/\.{2,}/g, '.')
    .replace(/_{2,}/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 45);

  return base.length >= 3 ? base : '';
}

export const VALID_SYSTEM_ROLES = [
  'admin',
  'hr_manager',
  'cms_administrator',
  'project_manager',
  'developer',
  'qa_engineer',
  'devops_engineer',
  'ui_ux_designer',
  'intern',
  'business_development',
  'digital_marketing',
  'business_analyst',
  'management',
  'architect',
  'client',
] as const;

/**
 * Resolves a stored or RBAC-normalized role string into a valid System Access role option.
 */
export function resolveSystemRole(
  rawRole: string | null | undefined,
  designation?: string | null
): string {
  const norm = (rawRole ?? '').trim().toLowerCase().replace(/[\s/]+/g, '_');
  if ((VALID_SYSTEM_ROLES as readonly string[]).includes(norm)) {
    return norm;
  }

  if (norm === 'superadmin' || norm === 'super_admin' || norm === 'owner' || norm === 'tenant_owner') {
    return 'admin';
  }
  if (norm === 'manager') {
    return 'project_manager';
  }
  if (norm === 'viewer') {
    return 'client';
  }

  // Fallback for collapsed RBAC role ('employee') or empty role: infer from designation when available
  const desig = (designation ?? '').trim().toLowerCase();
  if (desig) {
    if (desig.includes('qa') || desig.includes('quality') || desig.includes('test')) return 'qa_engineer';
    if (desig.includes('devops') || desig.includes('sre') || desig.includes('infra')) return 'devops_engineer';
    if (desig.includes('ui') || desig.includes('ux') || desig.includes('design')) return 'ui_ux_designer';
    if (desig.includes('intern') || desig.includes('trainee')) return 'intern';
    if (desig.includes('architect')) return 'architect';
    if (desig.includes('hr') || desig.includes('human resource') || desig.includes('recruit')) return 'hr_manager';
    if (desig.includes('project manager') || desig.includes('scrum')) return 'project_manager';
    if (desig.includes('business analyst') || desig.includes('analyst')) return 'business_analyst';
    if (desig.includes('business dev') || desig.includes('sales') || desig.includes('bde')) return 'business_development';
    if (desig.includes('marketing') || desig.includes('seo')) return 'digital_marketing';
    if (desig.includes('director') || desig.includes('vp') || desig.includes('chief') || desig.includes('head')) return 'management';
    if (desig.includes('dev') || desig.includes('engineer') || desig.includes('program')) return 'developer';
  }

  return 'developer';
}

// ============================================================================
// MASKING HELPERS (PII PROTECTION)
// ============================================================================

export function maskPan(pan: string | null | undefined): string | null {
  if (!pan) return null;
  const clean = cleanPan(pan);
  if (clean.length < 4) return clean;
  return `${'X'.repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}

export function maskAadhaar(aadhaar: string | null | undefined): string | null {
  if (!aadhaar) return null;
  const digits = cleanAadhaar(aadhaar);
  if (digits.length !== 12) return aadhaar;
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

export function maskBankAccount(account: string | null | undefined): string | null {
  if (!account) return null;
  const clean = cleanBankAccount(account);
  if (clean.length < 4) return clean;
  return `${'X'.repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}

// ============================================================================
// DATE & AGE VALIDATION HELPERS
// ============================================================================

export function calculateAge(dob: string | Date): number {
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
  if (isNaN(birthDate.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function isJoiningDateValidForDob(dob: string | Date | null | undefined, joiningDate: string | Date | null | undefined): boolean {
  if (!dob || !joiningDate) return true;
  const bDate = typeof dob === 'string' ? new Date(dob) : dob;
  const jDate = typeof joiningDate === 'string' ? new Date(joiningDate) : joiningDate;
  if (isNaN(bDate.getTime()) || isNaN(jDate.getTime())) return true;

  // Employee must be at least 18 years old on their joining date
  const minJoinDate = new Date(bDate);
  minJoinDate.setFullYear(bDate.getFullYear() + 18);

  return jDate >= minJoinDate;
}

// ============================================================================
// HELPER FOR OPTIONAL FIELDS THAT ACCEPT EMPTY STRING
// ============================================================================

/**
 * Creates an optional schema that treats null, undefined, and empty string as null/undefined,
 * validating against the inner schema only when a non-empty value is provided.
 */
export function optionalWhenEmpty<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => {
    if (val === null || val === undefined) return undefined;
    if (typeof val === 'string' && val.trim() === '') return undefined;
    return val;
  }, schema.optional().nullable());
}

// ============================================================================
// REUSABLE FIELD SCHEMAS
// ============================================================================

/**
 * Unicode-aware name validator supporting Indian regional scripts (Devanagari, Telugu, Tamil, etc.),
 * spaces, hyphens, and apostrophes.
 */
export function createNameValidator(options: {
  fieldName: string;
  minLen: number;
  maxLen: number;
  isRequired: boolean;
  emptyError?: string;
  lengthError?: string;
  charError?: string;
}) {
  const {
    fieldName,
    minLen,
    maxLen,
    isRequired,
    emptyError = `${fieldName} is required.`,
    lengthError = `${fieldName} must contain ${minLen}–${maxLen} characters.`,
    charError = 'Numbers and special characters are not allowed.',
  } = options;

  return z
    .string()
    .transform((val) => (val ?? '').trim().replace(/\s+/g, ' '))
    .superRefine((val, ctx) => {
      if (!val) {
        if (isRequired) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: emptyError,
          });
        }
        return;
      }

      // Check length bounds
      if (val.length < minLen || val.length > maxLen) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lengthError,
        });
        return;
      }

      // Unicode letters \p{L}, combining marks \p{M} (vowel signs/matras in Indic scripts), spaces, hyphens, and apostrophes
      const validCharsRegex = /^[\p{L}][\p{L}\p{M}\s'\-]*$/u;
      if (!validCharsRegex.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: charError,
        });
        return;
      }

      // Prevent trailing punctuation or consecutive punctuation (e.g. '--', "''")
      if (/['\-]{2,}/.test(val) || /['\-]$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: charError,
        });
      }
    });
}

/**
 * First Name: Mandatory, 2–50 characters, Unicode letters, spaces, hyphens, apostrophes.
 */
export const firstNameSchema = createNameValidator({
  fieldName: 'First name',
  minLen: 2,
  maxLen: 50,
  isRequired: true,
  emptyError: 'First name is required.',
  lengthError: 'First name must contain 2–50 characters.',
  charError: 'Numbers and special characters are not allowed.',
});

/**
 * Middle Name: Optional, 1–50 characters if entered, Unicode letters, spaces, hyphens, apostrophes.
 */
export const middleNameSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => {
    if (val === null || val === undefined) return undefined;
    const cleaned = val.trim().replace(/\s+/g, ' ');
    return cleaned === '' ? undefined : cleaned;
  })
  .superRefine((val, ctx) => {
    if (!val) return; // Optional

    if (val.length > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Middle name must contain a maximum of 50 characters.',
      });
      return;
    }

    const validCharsRegex = /^[\p{L}][\p{L}\p{M}\s'\-]*$/u;
    if (!validCharsRegex.test(val) || /['\-]{2,}/.test(val) || /['\-]$/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid middle name.',
      });
    }
  });

/**
 * Last Name: Mandatory, 1–50 characters, Unicode letters, spaces, hyphens, apostrophes.
 */
export const lastNameSchema = createNameValidator({
  fieldName: 'Last name',
  minLen: 1,
  maxLen: 50,
  isRequired: true,
  emptyError: 'Last name is required.',
  lengthError: 'Last name must contain 1–50 characters.',
  charError: 'Numbers and special characters are not allowed.',
});

// Aliases for compatibility
export const personNameSchema = firstNameSchema;
export const optionalPersonNameSchema = middleNameSchema;

/**
 * Permanent Account Number (PAN): 5 uppercase letters, 4 digits, 1 uppercase letter
 * Input is auto-trimmed and converted to uppercase. Also accepts masked PAN (e.g. XXXXXX1234).
 */
export const panSchema = z
  .string()
  .transform(cleanPan)
  .pipe(
    z
      .string()
      .refine(
        (val) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val) || /^X{4,6}[A-Z0-9]{4}$/i.test(val),
        'Invalid PAN format. Must be 5 letters, 4 digits, and 1 letter (e.g. ABCDE1234F)'
      )
  );

export const optionalPanSchema = optionalWhenEmpty(panSchema);

/**
 * Aadhaar Number: 12 digits, cannot start with 0 or 1, satisfies Verhoeff algorithm.
 * Input is auto-trimmed, spaces and hyphens removed. Also accepts masked Aadhaar (e.g. XXXX-XXXX-1234).
 */
export const aadhaarSchema = z
  .string()
  .transform(cleanAadhaar)
  .pipe(
    z
      .string()
      .refine(
        (val) => {
          if (/^(XXXX-XXXX-\d{4}|X{8}\d{4})$/i.test(val)) return true;
          return /^[2-9][0-9]{11}$/.test(val) && validateVerhoeff(val);
        },
        'Aadhaar must be a 12-digit number (cannot start with 0 or 1, and Verhoeff checksum must pass)'
      )
  );

export const optionalAadhaarSchema = optionalWhenEmpty(aadhaarSchema);

/**
 * Indian Financial System Code (IFSC): 4 letters, 0, 6 alphanumeric characters
 * Input is auto-trimmed and converted to uppercase.
 */
export const ifscSchema = z
  .string()
  .transform(cleanIfsc)
  .pipe(
    z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code. Format: 4 letters, 0, and 6 alphanumeric characters (e.g. HDFC0001234)')
  );

export const optionalIfscSchema = optionalWhenEmpty(ifscSchema);

/**
 * Bank Account Number: 9 to 18 digits (cannot be all zeroes).
 * Input is auto-trimmed, spaces and hyphens removed. Also accepts masked bank account (e.g. XXXXXXXX1234).
 */
export const bankAccountSchema = z
  .string()
  .transform(cleanBankAccount)
  .pipe(
    z
      .string()
      .refine(
        (val) => /^X+\d{4}$/i.test(val) || (/^\d{9,18}$/.test(val) && !/^0+$/.test(val)),
        'Bank account number must be a valid 9 to 18 digit number'
      )
  );

export const optionalBankAccountSchema = optionalWhenEmpty(bankAccountSchema);

// ============================================================================
// PAYROLL, COMPENSATION, BANKING & STATUTORY COMPLIANCE SCHEMAS
// ============================================================================

export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD'] as const;

export const COMPENSATION_LIMITS = {
  MAX_MONTHLY_SALARY: 100_000_000, // 10 Crore / 100M max per month
  MAX_HOURLY_RATE: 1_000_000,      // 10 Lakh / 1M max per hour
  MAX_ANNUAL_CTC: 1_000_000_000,   // 100 Crore / 1B max per year
} as const;

/**
 * Factory for optional monetary/compensation inputs (accepts string or number, empty -> undefined).
 * Rejects negative values, non-numeric input, > 2 decimal places, scientific notation, and out-of-range values.
 */
export function createOptionalCompensationSchema(options: {
  label: string;
  max: number;
}) {
  const { label, max } = options;
  return z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined) return undefined;
      if (typeof val === 'number') return String(val);
      const trimmed = val.trim().replace(/,/g, '');
      return trimmed === '' ? undefined : trimmed;
    })
    .superRefine((val, ctx) => {
      if (val === undefined) return;
      if (val.startsWith('-')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} cannot be negative.`,
        });
        return;
      }
      if (!/^\d+(\.\d{1,2})?$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be a valid positive number with up to 2 decimal places.`,
        });
        return;
      }
      const num = Number(val);
      if (!Number.isFinite(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be a valid finite number.`,
        });
        return;
      }
      if (num > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} cannot exceed ${max.toLocaleString('en-US')}.`,
        });
      }
    })
    .transform((val) => (val === undefined ? undefined : Number(val)));
}

export const optionalSalarySchema = createOptionalCompensationSchema({
  label: 'Monthly base salary',
  max: COMPENSATION_LIMITS.MAX_MONTHLY_SALARY,
});

export const optionalHourlyRateSchema = createOptionalCompensationSchema({
  label: 'Hourly rate',
  max: COMPENSATION_LIMITS.MAX_HOURLY_RATE,
});

export const optionalCtcSchema = createOptionalCompensationSchema({
  label: 'Annual CTC',
  max: COMPENSATION_LIMITS.MAX_ANNUAL_CTC,
});

export const optionalCurrencySchema = optionalWhenEmpty(
  z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .refine(
      (val) => (SUPPORTED_CURRENCIES as readonly string[]).includes(val),
      `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`
    )
);

/**
 * Bank Name: 2–100 chars, alphabets, spaces, dots, hyphens, ampersands, apostrophes, parentheses.
 */
export const bankNameSchema = z
  .string()
  .transform((val) => (val ?? '').trim().replace(/\s+/g, ' '))
  .superRefine((val, ctx) => {
    if (val.length < 2 || val.length > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bank name must contain 2–100 characters.',
      });
      return;
    }
    if (!/^[A-Za-z][A-Za-z\s.&'()-]*$/.test(val) || /(.)\1{3,}/i.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid bank name (letters, spaces, and standard punctuation only).',
      });
    }
  });

export const optionalBankNameSchema = optionalWhenEmpty(bankNameSchema);

/**
 * Branch Name: 2–100 chars, alphanumeric + address punctuation, must include at least 2 letters,
 * rejects keyboard-mash repetitions (e.g. "wwww...") or unbroken 25+ char nonsense tokens.
 */
export const branchNameSchema = z
  .string()
  .transform((val) => (val ?? '').trim().replace(/\s+/g, ' '))
  .superRefine((val, ctx) => {
    if (val.length < 2 || val.length > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Branch name must contain 2–100 characters.',
      });
      return;
    }
    if (
      !/^[A-Za-z0-9][A-Za-z0-9\s.,'&()/-]*$/.test(val) ||
      !/[A-Za-z].*[A-Za-z]/.test(val) ||
      /(.)\1{3,}/i.test(val) ||
      val.split(/[\s,/()-]+/).some((word) => word.length > 25)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid bank branch name (e.g. MG Road Branch, Bengaluru).',
      });
    }
  });

export const optionalBranchNameSchema = optionalWhenEmpty(branchNameSchema);

export function cleanPfNumber(val: string | null | undefined): string {
  return (val ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Indian EPFO Provident Fund (PF) Member ID / Account Number:
 * Format: 2-letter State + 3-letter Regional Office + 5-7 digit Establishment + optional 3-char Extension + 5-7 digit Account No.
 * Examples: MH/BAN/0012345/000/0000123, MHBAN00123450000000123, TN/MAS/0012345/0000123
 */
export const pfNumberSchema = z
  .string()
  .transform(cleanPfNumber)
  .pipe(
    z
      .string()
      .regex(
        /^[A-Z]{2}[/-]?[A-Z]{3}[/-]?[0-9]{5,7}([/-]?[0-9A-Z]{3})?[/-]?[0-9]{5,7}$/,
        'Invalid PF number format (e.g. MH/BAN/0012345/000/0000123)'
      )
  );

export const optionalPfNumberSchema = optionalWhenEmpty(pfNumberSchema);

export function cleanUan(val: string | null | undefined): string {
  return (val ?? '').replace(/[\s\-]/g, '').trim();
}

/**
 * Indian EPFO Universal Account Number (UAN):
 * Exactly 12 digits, cannot start with 0, cannot be all identical digits.
 */
export const uanNumberSchema = z
  .string()
  .transform(cleanUan)
  .pipe(
    z
      .string()
      .refine(
        (val) => /^[1-9]\d{11}$/.test(val) && !/^(\d)\1{11}$/.test(val),
        'UAN must be a valid 12-digit number (cannot start with 0, e.g. 100123456789)'
      )
  );

export const optionalUanNumberSchema = optionalWhenEmpty(uanNumberSchema);

export function cleanEsi(val: string | null | undefined): string {
  return (val ?? '').replace(/[\s\-]/g, '').trim();
}

/**
 * Indian ESIC Number:
 * 10-digit Employee IP Number (e.g. 3112345678) or 17-digit ESIC Code (e.g. 31-00-123456-000-0001).
 * Cannot be all zeroes or all identical digits.
 */
export const esiNumberSchema = z
  .string()
  .transform(cleanEsi)
  .pipe(
    z
      .string()
      .refine(
        (val) => (/^\d{10}$/.test(val) || /^\d{17}$/.test(val)) && !/^(\d)\1+$/.test(val),
        'ESI number must be a valid 10-digit IP number or 17-digit ESIC code'
      )
  );

export const optionalEsiNumberSchema = optionalWhenEmpty(esiNumberSchema);

/**
 * Indian Mobile Phone: Mandatory, exactly 10 digits starting with 6, 7, 8, or 9.
 * Cleans +91, 91 prefix, leading 0, spaces, and hyphens.
 */
export const indianPhoneSchema = z
  .string()
  .superRefine((val, ctx) => {
    const raw = (val ?? '').trim();
    if (!raw) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Phone number is required.',
      });
      return;
    }

    const cleaned = cleanIndianPhone(raw);

    // If cleaned contains non-digits or length is not 10
    if (!/^\d+$/.test(cleaned) || cleaned.length !== 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Phone number must contain exactly 10 digits.',
      });
      return;
    }

    // First digit must be 6, 7, 8 or 9
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid Indian mobile number.',
      });
    }
  })
  .transform((val) => cleanIndianPhone(val));

export const optionalIndianPhoneSchema = optionalWhenEmpty(indianPhoneSchema);

/**
 * Date of Birth: Must not be in the future, and age must be at least 18 years.
 */
export const dobSchema = z
  .string()
  .trim()
  .refine((val) => {
    if (!val) return false;
    const date = new Date(val);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    // Cannot be in the future
    if (date > today) return false;
    // Must be at least 18 years old
    return calculateAge(date) >= 18;
  }, 'Employee must be at least 18 years old and date of birth cannot be in the future');

export const optionalDobSchema = optionalWhenEmpty(dobSchema);

/**
 * URL Factory for strict social profile links
 */
export function createProfileUrlSchema(platform: 'linkedin' | 'github') {
  if (platform === 'linkedin') {
    return z
      .string()
      .trim()
      .regex(
        /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-À-ÿ%]+\/?$/i,
        'Must be a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username)'
      );
  }
  return z
    .string()
    .trim()
    .regex(
      /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_\-]+\/?$/i,
      'Must be a valid GitHub profile URL (e.g. https://github.com/username)'
    );
}

export const linkedinUrlSchema = createProfileUrlSchema('linkedin');
export const optionalLinkedinUrlSchema = optionalWhenEmpty(linkedinUrlSchema);

export const githubUrlSchema = createProfileUrlSchema('github');
export const optionalGithubUrlSchema = optionalWhenEmpty(githubUrlSchema);

/**
 * Strong password: min 8, max 128 chars, at least one uppercase, one lowercase, and one digit.
 */
export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const optionalStrongPasswordSchema = optionalWhenEmpty(strongPasswordSchema);

/**
 * Standard Email Schema: Mandatory, 5–254 characters, normalized lowercase, no spaces, valid RFC domain.
 */
export const emailSchema = z
  .string()
  .transform((val) => (val ?? '').trim().toLowerCase())
  .superRefine((val, ctx) => {
    if (!val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email address is required.',
      });
      return;
    }

    // No internal spaces allowed
    if (/\s/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid email address.',
      });
      return;
    }

    // Min 5, max 254 characters
    if (val.length < 5 || val.length > 254) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid email address.',
      });
      return;
    }

    // Standard email validator regex requiring valid local part, @, domain name and TLD
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid email address.',
      });
      return;
    }

    // Ensure valid domain & TLD with at least 2 alpha characters
    const domain = val.split('@')[1];
    const parts = domain ? domain.split('.') : [];
    const tld = parts[parts.length - 1];
    if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid email address.',
      });
    }
  });

export const optionalEmailSchema = optionalWhenEmpty(emailSchema);

// ============================================================================
// STEP-SPECIFIC VALIDATION SCHEMAS (FOR WIZARD NAVIGATION)
// ============================================================================

/**
 * Validates a Personal ID Number based on the selected Government ID Type:
 * - Aadhaar Card: 12 digits, cannot start with 0 or 1, valid Verhoeff checksum.
 * - PAN Card: 5 uppercase letters, 4 digits, 1 uppercase letter.
 * - Social Security Number: 9 digits (format XXX-XX-XXXX or 9 digits), valid area/group/serial.
 * - Passport: 1 letter + 7 digits (Indian standard) or 6–12 alphanumeric characters.
 * - Driver License: e.g. MH0220110012345 or 8–20 alphanumeric characters.
 * - Other: 3–50 alphanumeric characters.
 */
export function validatePersonalIdByGovtId(
  personalId: string | null | undefined,
  govtIdType: string | null | undefined
): string | null {
  if (!personalId || personalId.trim() === '') return null; // Optional if empty
  const val = personalId.trim();
  const type = (govtIdType ?? 'Aadhaar Card').trim().toLowerCase();

  switch (type) {
    case 'aadhaar card':
    case 'aadhaar': {
      // Allow masked Aadhaar (e.g. XXXX-XXXX-1234 or XXXXXXXX1234)
      if (/^(XXXX-XXXX-\d{4}|X{8}\d{4})$/i.test(val)) return null;
      const cleaned = cleanAadhaar(val);
      if (!/^[2-9][0-9]{11}$/.test(cleaned)) {
        return 'Aadhaar must be a 12-digit number and cannot start with 0 or 1';
      }
      if (!validateVerhoeff(cleaned)) {
        return 'Invalid Aadhaar number (Verhoeff checksum failed)';
      }
      return null;
    }

    case 'pan card':
    case 'pan': {
      // Allow masked PAN (e.g. XXXXXX1234)
      if (/^X{4,6}[A-Z0-9]{4}$/i.test(val)) return null;
      const cleaned = cleanPan(val);
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleaned)) {
        return 'Invalid PAN format. Must be 5 letters, 4 digits, and 1 letter (e.g. ABCDE1234F)';
      }
      return null;
    }

    case 'social security number':
    case 'ssn': {
      // Allow masked SSN (e.g. XXX-XX-1234 or XXXXX1234)
      if (/^X{3}-?X{2}-?\d{4}$/i.test(val) || /^X{5}\d{4}$/i.test(val)) return null;
      const cleaned = val.replace(/[\s\-]/g, '');
      if (cleaned.length !== 9 || !/^\d{9}$/.test(cleaned)) {
        return 'Invalid Social Security Number. Must be exactly 9 digits (e.g. 123-45-6789)';
      }
      const area = cleaned.slice(0, 3);
      const group = cleaned.slice(3, 5);
      const serial = cleaned.slice(5, 9);
      if (area === '000' || area === '666' || area.startsWith('9')) {
        return 'Invalid SSN area number';
      }
      if (group === '00') {
        return 'Invalid SSN group number';
      }
      if (serial === '0000') {
        return 'Invalid SSN serial number';
      }
      return null;
    }

    case 'passport': {
      const cleaned = val.replace(/\s+/g, '').toUpperCase();
      // Indian Passport: 1 uppercase letter followed by 7 digits (e.g. A1234567)
      // International Passport: 6 to 12 alphanumeric characters
      const isIndianPassport = /^[A-Z][0-9]{7}$/.test(cleaned);
      const isGeneralPassport = /^[A-Z0-9]{6,12}$/.test(cleaned);
      if (!isIndianPassport && !isGeneralPassport) {
        return 'Invalid Passport number. Format: 1 letter followed by 7 digits (e.g. A1234567) or 6–12 alphanumeric characters';
      }
      return null;
    }

    case 'driver license':
    case 'driving license': {
      const cleaned = val.trim().replace(/\s+/g, ' ').toUpperCase();
      // Indian DL format: e.g. MH0220110012345 or general DL (8-20 alphanumeric chars)
      const isIndianDL = /^[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{7}$/.test(cleaned);
      const isGeneralDL = /^[A-Z0-9\s\-]{8,20}$/.test(cleaned);
      if (!isIndianDL && !isGeneralDL) {
        return 'Invalid Driver License number. Format: e.g. MH0220110012345 or 8–20 alphanumeric characters';
      }
      return null;
    }

    case 'other':
    default: {
      if (val.length < 3 || val.length > 50) {
        return 'Personal ID must be between 3 and 50 characters';
      }
      if (!/^[a-zA-Z0-9\s\-_/.]+$/.test(val)) {
        return 'Personal ID can only contain letters, numbers, spaces, hyphens, and slashes';
      }
      return null;
    }
  }
}

/**
 * Returns an intuitive placeholder string for the Personal ID Number input based on Govt ID Type
 */
export function getGovtIdPlaceholder(govtIdType: string | null | undefined): string {
  const type = (govtIdType ?? 'Aadhaar Card').trim().toLowerCase();
  switch (type) {
    case 'aadhaar card':
    case 'aadhaar':
      return 'e.g. 2345 6789 0123 (12 digits)';
    case 'pan card':
    case 'pan':
      return 'e.g. ABCDE1234F';
    case 'social security number':
    case 'ssn':
      return 'e.g. 123-45-6789';
    case 'passport':
      return 'e.g. A1234567';
    case 'driver license':
    case 'driving license':
      return 'e.g. MH0220110012345';
    case 'other':
    default:
      return 'Enter identification number';
  }
}

export const personalStepSchema = z
  .object({
    firstName: firstNameSchema,
    middleName: middleNameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    phone: indianPhoneSchema,
    gender: z.string().trim().optional().nullable(),
    dateOfBirth: optionalDobSchema,
    maritalStatus: z.string().trim().max(50).optional().nullable(),
    bloodGroup: z.string().trim().max(10).optional().nullable(),
    nationality: z.string().trim().max(50).optional().nullable(),
    govtIdType: z.string().trim().optional().nullable(),
    personalIdNumber: z.string().trim().max(100, 'Personal ID cannot exceed 100 characters').optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.personalIdNumber) {
      const errorMsg = validatePersonalIdByGovtId(data.personalIdNumber, data.govtIdType || 'Aadhaar Card');
      if (errorMsg) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: errorMsg,
          path: ['personalIdNumber'],
        });
      }
    }
  });

export const workStepSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(1, 'Employee ID is required')
    .max(100, 'Employee ID cannot exceed 100 characters'),
  department: z
    .string()
    .trim()
    .min(1, 'Department is required')
    .max(100, 'Department cannot exceed 100 characters'),
  designation: z
    .string()
    .trim()
    .min(1, 'Designation is required')
    .max(100, 'Designation cannot exceed 100 characters'),
  employmentType: z.string().trim().max(50).optional().nullable(),
  dateOfJoining: z.string().trim().min(1, 'Joining date is required'),
  dateOfBirth: z.string().trim().optional().nullable(),
  managerId: z.any().optional().nullable(),
  buddy: z.string().trim().max(100).optional().nullable(),
  mentor: z.string().trim().max(100).optional().nullable(),
  status: z.string().trim().max(50).optional().nullable(),
  probationPeriod: z.any().optional().nullable(),
  confirmationDate: z.string().trim().optional().nullable(),
  workLocation: z.string().trim().max(100, 'Work location cannot exceed 100 characters').optional().nullable(),
  workShift: z.string().trim().max(100, 'Work shift cannot exceed 100 characters').optional().nullable(),
  noticePeriod: z.any().optional().nullable(),
}).refine(
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
);

export const payrollStepSchema = z
  .object({
    salary: optionalSalarySchema,
    hourlyRate: optionalHourlyRateSchema,
    ctc: optionalCtcSchema,
    currency: optionalCurrencySchema,
    bankName: optionalBankNameSchema,
    bankAccountNumber: optionalBankAccountSchema,
    ifscCode: optionalIfscSchema,
    branchName: optionalBranchNameSchema,
    pfNumber: optionalPfNumberSchema,
    uanNumber: optionalUanNumberSchema,
    esiNumber: optionalEsiNumberSchema,
    panNumber: optionalPanSchema,
    aadhaarNumber: optionalAadhaarSchema,
  })
  .superRefine((data, ctx) => {
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

export const usernameSchema = z
  .string()
  .transform(cleanUsername)
  .pipe(
    z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .regex(/^[a-z0-9._-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores')
  );

export const optionalUsernameSchema = optionalWhenEmpty(usernameSchema);

export const accessStepSchema = (isEditMode: boolean = false) =>
  z.object({
    role: z.string().trim().min(1, 'System role is required').max(50),
    username: optionalUsernameSchema,
    officeEmail: optionalEmailSchema,
    password: isEditMode
      ? optionalStrongPasswordSchema
      : strongPasswordSchema,
  });

export const emergencyStepSchema = z.object({
  emergencyContactName: z.string().trim().max(100, 'Contact name cannot exceed 100 characters').optional().nullable(),
  emergencyContactRelationship: z.string().trim().max(50, 'Relationship cannot exceed 50 characters').optional().nullable(),
  emergencyContactPhone: optionalIndianPhoneSchema,
  emergencyContactAddress: z.string().trim().max(500, 'Address cannot exceed 500 characters').optional().nullable(),
  employeePhone: z.string().trim().optional().nullable(),
}).refine(
  (data) => {
    if (data.emergencyContactPhone && data.employeePhone) {
      const cleanEmergency = cleanIndianPhone(data.emergencyContactPhone);
      const cleanEmp = cleanIndianPhone(data.employeePhone);
      if (cleanEmergency && cleanEmp && cleanEmergency === cleanEmp) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'Emergency contact phone number cannot be the same as the employee phone number',
    path: ['emergencyContactPhone'],
  }
);

export const additionalStepSchema = z.object({
  languagesKnown: z.string().trim().max(255, 'Languages cannot exceed 255 characters').optional().nullable(),
  linkedinProfile: optionalLinkedinUrlSchema,
  githubProfile: optionalGithubUrlSchema,
  previousCompany: z.string().trim().max(255, 'Previous company cannot exceed 255 characters').optional().nullable(),
  referralSource: z.string().trim().max(100, 'Referral source cannot exceed 100 characters').optional().nullable(),
  notes: z.string().trim().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable(),
});

// ============================================================================
// EMPLOYEE DRAFT HELPERS & SCHEMA (DATABASE-BACKED MULTI-EMPLOYEE DRAFTS)
// ============================================================================

export const EMPLOYEE_DRAFT_STEPS = [
  'personal',
  'work',
  'payroll',
  'documents',
  'access',
  'emergency',
  'additional',
  'review',
] as const;

export type EmployeeDraftStep = (typeof EMPLOYEE_DRAFT_STEPS)[number];

/**
 * Strips secrets (such as raw passwords) before persisting employee form drafts.
 */
export function sanitizeDraftFormData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data ?? {})) {
    if (key === 'password' || key === 'confirmPassword') continue;
    if (value === undefined) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

/**
 * Derives a human-readable draft title for draft lists and resume banners.
 */
export function buildDraftDisplayName(formData: Record<string, unknown>): string {
  const first = typeof formData.firstName === 'string' ? formData.firstName.trim() : '';
  const last = typeof formData.lastName === 'string' ? formData.lastName.trim() : '';
  const fullName = `${first} ${last}`.trim();
  if (fullName) return fullName;

  const email = typeof formData.email === 'string' ? formData.email.trim() : '';
  if (email) return email;

  const empId = typeof formData.employeeId === 'string' ? formData.employeeId.trim() : '';
  if (empId) return `Draft (${empId})`;

  return 'Untitled Employee Draft';
}

const DRAFT_PROGRESS_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'dateOfBirth',
  'employeeId',
  'department',
  'designation',
  'dateOfJoining',
  'salary',
  'bankName',
  'bankAccountNumber',
  'ifscCode',
  'panNumber',
  'username',
  'role',
  'emergencyContactName',
  'emergencyContactPhone',
] as const;

/**
 * Computes completion percentage (0–100) across key employee onboarding fields.
 */
export function computeEmployeeDraftCompletion(formData: Record<string, unknown>): number {
  let filled = 0;
  for (const field of DRAFT_PROGRESS_FIELDS) {
    const val = formData[field];
    if (typeof val === 'string' && val.trim().length > 0) {
      filled++;
    } else if (typeof val === 'number' && !Number.isNaN(val)) {
      filled++;
    }
  }
  return Math.min(100, Math.round((filled / DRAFT_PROGRESS_FIELDS.length) * 100));
}

export const employeeDraftPayloadSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  currentStep: z.enum(EMPLOYEE_DRAFT_STEPS).default('personal'),
  formData: z.record(z.string(), z.unknown()).default({}),
});

