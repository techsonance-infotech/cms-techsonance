import { z } from 'zod';

// ========================
// Employee Assets
// ========================
export const assetTypeSchema = z.enum([
  'laptop', 'desktop', 'mac', 'monitor', 'mouse', 'keyboard',
  'mobile', 'sim', 'id_card', 'access_card', 'parking_pass',
  'locker', 'headset', 'dock', 'other'
]);

export const assetConditionSchema = z.enum(['new', 'good', 'fair', 'damaged', 'lost']);
export const assetStatusSchema = z.enum(['issued', 'returned', 'lost', 'damaged', 'under_repair']);

export const createAssetSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  assetType: assetTypeSchema,
  assetName: z.string().trim().min(1).max(200),
  serialNumber: z.string().trim().max(200).optional().nullable(),
  brand: z.string().trim().max(100).optional().nullable(),
  model: z.string().trim().max(100).optional().nullable(),
  specification: z.string().trim().max(500).optional().nullable(),
  issueDate: z.string().date().optional().nullable(),
  returnDate: z.string().date().optional().nullable(),
  condition: assetConditionSchema.optional().default('good'),
  warrantyExpiry: z.string().date().optional().nullable(),
  status: assetStatusSchema.optional().default('issued'),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.omit({ employeeId: true }).partial();

// ========================
// Employee Skills
// ========================
export const skillCategorySchema = z.enum([
  'programming', 'framework', 'language', 'cloud', 'devops',
  'design', 'soft_skill', 'certification', 'database', 'tools', 'other'
]);

export const proficiencyLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

export const createSkillSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  skillName: z.string().trim().min(1).max(200),
  category: skillCategorySchema,
  proficiencyLevel: proficiencyLevelSchema.optional().default('intermediate'),
  yearsExperience: z.coerce.number().min(0).max(50).optional().default(0),
  certified: z.boolean().optional().default(false),
  assessmentScore: z.coerce.number().min(0).max(100).optional().nullable(),
});

export const updateSkillSchema = createSkillSchema.omit({ employeeId: true }).partial();

// ========================
// Employee Training
// ========================
export const trainingTypeSchema = z.enum([
  'internal', 'external', 'compliance', 'certification', 'workshop', 'conference'
]);

export const trainingStatusSchema = z.enum([
  'pending', 'in_progress', 'completed', 'expired', 'cancelled'
]);

export const createTrainingSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  courseName: z.string().trim().min(1).max(300),
  provider: z.string().trim().max(200).optional().nullable(),
  trainingType: trainingTypeSchema.optional().default('external'),
  startDate: z.string().date().optional().nullable(),
  endDate: z.string().date().optional().nullable(),
  status: trainingStatusSchema.optional().default('pending'),
  score: z.coerce.number().min(0).max(100).optional().nullable(),
  certificateUrl: z.string().trim().url().optional().nullable(),
  expiryDate: z.string().date().optional().nullable(),
  cost: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().trim().max(10).optional().default('INR'),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateTrainingSchema = createTrainingSchema.omit({ employeeId: true }).partial();

// ========================
// Employee Timeline
// ========================
export const timelineEventTypeSchema = z.enum([
  'joined', 'promotion', 'transfer', 'salary_revision',
  'leave_applied', 'leave_approved', 'leave_rejected',
  'attendance_marked', 'performance_review',
  'warning', 'training_completed', 'document_uploaded',
  'login', 'password_reset', 'role_changed',
  'project_assigned', 'project_removed',
  'asset_issued', 'asset_returned',
  'resigned', 'terminated', 'exit_completed',
  'skill_added', 'certification_earned',
  'manager_changed', 'department_changed',
  'note_added', 'status_changed', 'other'
]);

export const createTimelineEventSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  eventType: timelineEventTypeSchema,
  eventTitle: z.string().trim().min(1).max(300),
  eventDescription: z.string().trim().max(2000).optional().nullable(),
  eventData: z.record(z.string(), z.unknown()).optional().default({}),
});

// ========================
// Employee Notes
// ========================
export const noteTypeSchema = z.enum([
  'general', 'hr_private', 'manager_note', 'achievement', 'award',
  'incident', 'warning', 'compliment', 'feedback', 'disciplinary'
]);

export const noteVisibilitySchema = z.enum(['private', 'manager', 'hr', 'public']);

export const createNoteSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  noteType: noteTypeSchema.optional().default('general'),
  title: z.string().trim().max(300).optional().nullable(),
  content: z.string().trim().min(1).max(5000),
  visibility: noteVisibilitySchema.optional().default('private'),
});

export const updateNoteSchema = createNoteSchema.omit({ employeeId: true }).partial();

// ========================
// Employee Documents
// ========================
export const documentTypeSchema = z.enum([
  'resume', 'offer_letter', 'appointment_letter', 'nda',
  'employment_contract', 'pan_card', 'aadhaar_card',
  'passport', 'driving_license', 'visa',
  'education_certificate', 'experience_certificate',
  'salary_slip', 'relieving_letter', 'promotion_letter',
  'certificate', 'medical_report', 'background_verification',
  'police_verification', 'training_certificate', 'other'
]);

export const storageProviderSchema = z.enum(['supabase', 's3', 'cloudinary']);

export const createDocumentSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  documentType: documentTypeSchema,
  documentName: z.string().trim().min(1).max(300),
  fileUrl: z.string().trim().min(1),
  fileSize: z.coerce.number().int().min(0).optional().nullable(),
  fileType: z.string().trim().max(50).optional().nullable(),
  storageProvider: storageProviderSchema.optional().default('supabase'),
  expiryDate: z.string().date().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateDocumentSchema = createDocumentSchema.omit({ employeeId: true }).partial();

// ========================
// Review Cycles
// ========================
export const reviewTypeSchema = z.enum([
  'quarterly', 'half_yearly', 'yearly', 'monthly',
  'weekly_one_on_one', 'probation', 'exit',
  'promotion', 'peer', 'manager', 'self', '360_degree'
]);

export const reviewCycleStatusSchema = z.enum(['draft', 'active', 'completed', 'cancelled']);

export const createReviewCycleSchema = z.object({
  name: z.string().trim().min(1).max(300),
  reviewType: reviewTypeSchema,
  startDate: z.string().date(),
  endDate: z.string().date(),
  status: reviewCycleStatusSchema.optional().default('draft'),
});

export const updateReviewCycleSchema = createReviewCycleSchema.partial();

// ========================
// Employee Reviews
// ========================
export const employeeReviewStatusSchema = z.enum([
  'pending', 'self_review', 'manager_review', 'completed', 'acknowledged'
]);

export const createEmployeeReviewSchema = z.object({
  cycleId: z.coerce.number().int().positive().optional().nullable(),
  employeeId: z.coerce.number().int().positive(),
  reviewerId: z.coerce.number().int().positive().optional().nullable(),
  reviewType: z.string().trim().min(1),
  goals: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  kpis: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  kras: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  okrs: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  selfRating: z.coerce.number().min(0).max(10).optional().nullable(),
  managerRating: z.coerce.number().min(0).max(10).optional().nullable(),
  finalRating: z.coerce.number().min(0).max(10).optional().nullable(),
  strengths: z.string().trim().max(2000).optional().nullable(),
  improvements: z.string().trim().max(2000).optional().nullable(),
  comments: z.string().trim().max(2000).optional().nullable(),
  promotionEligible: z.boolean().optional().default(false),
  trainingRecommendations: z.array(z.string().trim()).optional().default([]),
  status: employeeReviewStatusSchema.optional().default('pending'),
});

export const updateEmployeeReviewSchema = createEmployeeReviewSchema
  .omit({ employeeId: true, cycleId: true })
  .partial();

// ========================
// Org Chart
// ========================
export const createOrgChartNodeSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  parentEmployeeId: z.coerce.number().int().positive().optional().nullable(),
  positionTitle: z.string().trim().max(200).optional().nullable(),
  level: z.coerce.number().int().min(0).optional().default(0),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

export const updateOrgChartNodeSchema = createOrgChartNodeSchema.omit({ employeeId: true }).partial();

// ========================
// Audit Log (read-only from frontend, created server-side)
// ========================
export const auditLogQuerySchema = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  action: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
