import { z } from 'zod';

export const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'half_day']);
export const attendanceSourceSchema = z.enum(['nfc', 'legacy']).optional();

const flexibleDateSchema = z.string().transform((val) => {
  const trimmed = val.trim();
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/]/);
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return trimmed;
}).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)'));

const flexibleDatetimeSchema = z.string().datetime({ offset: true });

export const createAttendanceSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  date: flexibleDateSchema,
  timeIn: flexibleDatetimeSchema,
  timeOut: flexibleDatetimeSchema.optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  location: z.string().trim().max(255).optional().nullable(),
  readerId: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  locationLatitude: z.coerce.number().optional().nullable(),
  locationLongitude: z.coerce.number().optional().nullable(),
  status: attendanceStatusSchema,
});

export const createManualAttendanceSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  checkIn: flexibleDatetimeSchema,
  checkOut: flexibleDatetimeSchema.optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateAttendanceRecordSchema = z.object({
  timeIn: z.string().min(1),
  timeOut: z.string().min(1).optional().nullable(),
  status: attendanceStatusSchema,
  _source: z.enum(['legacy', 'nfc']),
  date: z.string().date(),
});

export const attendanceExportQuerySchema = z.object({
  startDate: z.string().date().optional().nullable(),
  endDate: z.string().date().optional().nullable(),
  employeeId: z.coerce.number().int().positive().optional().nullable(),
  readerId: z.string().trim().max(255).optional().nullable(),
  status: z.string().trim().max(100).optional().nullable(),
  source: z.enum(['legacy', 'nfc']).optional().nullable(),
});

export const attendanceBulkRowSchema = z.object({
  employeeIdentifier: z.string().trim().min(1),
  date: z.string().date(),
  timeIn: z.string().trim().optional().nullable(),
  timeOut: z.string().trim().optional().nullable(),
});

export const attendanceToggleSchema = z.object({
  tagUid: z.string().trim().min(1).optional().nullable(),
  employeeId: z.coerce.number().int().positive().optional().nullable(),
  readerId: z.string().trim().max(255).optional().nullable(),
  location: z.string().trim().max(255).optional().nullable(),
  idempotencyKey: z.string().trim().max(255).optional().nullable(),
  locationLatitude: z.coerce.number().optional().nullable(),
  locationLongitude: z.coerce.number().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
}).refine((value) => value.tagUid || value.employeeId, {
  message: 'Either tagUid or employeeId must be provided',
});

export const attendancePolicySchema = z.object({
  name: z.string().trim().min(1).max(150),
  isDefault: z.boolean().default(false),
  standardHours: z.coerce.number().positive().default(9.0),
  minHoursHalfDay: z.coerce.number().positive().default(4.0),
  minHoursFullDay: z.coerce.number().positive().default(8.0),
  gracePeriodLateMinutes: z.coerce.number().int().nonnegative().default(15),
  gracePeriodEarlyExitMinutes: z.coerce.number().int().nonnegative().default(15),
  isFlexible: z.boolean().default(false),
  roundingMinutes: z.coerce.number().int().nonnegative().default(0),
  autoMarkAbsence: z.boolean().default(true),
  unpaidBreakDurationMinutes: z.coerce.number().int().nonnegative().default(60),
  paidBreakDurationMinutes: z.coerce.number().int().nonnegative().default(0),
  overtimeEligibility: z.boolean().default(true),
  overtimeMinMinutes: z.coerce.number().int().nonnegative().default(30),
  overtimeRateMultiplier: z.coerce.number().positive().default(1.5),
  weeklyOffDays: z.string().trim().default('Saturday,Sunday'),
  targetAssignment: z.record(z.string(), z.unknown()).default({}),
});

export const regularizationRequestSchema = z.object({
  date: flexibleDateSchema,
  reasonType: z.enum(['missing_punch', 'travel', 'wfh', 'forgotten_punch', 'dispute', 'regularization']),
  notes: z.string().trim().min(1).max(1000),
  requestedTimeIn: flexibleDatetimeSchema.optional().nullable(),
  requestedTimeOut: flexibleDatetimeSchema.optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  gpsLatitude: z.coerce.number().optional().nullable(),
  gpsLongitude: z.coerce.number().optional().nullable(),
});

export const overtimeRequestSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  date: flexibleDateSchema,
  calculatedOvertimeMinutes: z.coerce.number().int().nonnegative(),
  approvedOvertimeMinutes: z.coerce.number().int().nonnegative(),
  reason: z.string().trim().max(1000).optional().nullable(),
});

export const attendanceLockSchema = z.object({
  year: z.coerce.number().int().positive(),
  month: z.coerce.number().int().min(1).max(12),
  locked: z.boolean().default(true),
});

export const exceptionResolutionSchema = z.object({
  exceptionId: z.string().uuid(),
  resolutionNotes: z.string().trim().min(1).max(1000),
});

