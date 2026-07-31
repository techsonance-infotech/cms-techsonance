import { z } from 'zod';

export const inquiryTagSchema = z.enum([
  'need_estimation',
  'rough_estimation',
  'scheduling_meeting',
  'need_schedule_meeting',
  'hired_someone_else',
  'hired',
]);

export const inquiryStatusSchema = z.enum([
  'lead',
  'no_reply',
  'follow_up',
  'hired',
  'rejected_client',
  'rejected_us',
  'invite_lead',
  'invite_hire',
  'not_good_client',
  'budget_low',
  'cant_work',
  'hired_someone_else',
]);

export const inquiryAppStatusSchema = z.enum(['open', 'close']);

export const createInquirySchema = z.object({
  aliasName: z.string().trim().min(1, 'Alias Name is required').max(255),
  tag: z.string().trim().min(1, 'Tech Tag is required'),
  status: z.string().trim().min(1, 'Pipeline Stage is required'),
  dueDate: z.string().optional().nullable(),
  appStatus: z.string().optional().nullable(),
  isFavourite: z.boolean().optional(),
  companyName: z.string().trim().optional().nullable(),
  website: z.string().trim().optional().nullable(),
  industry: z.string().trim().optional().nullable(),
  companySize: z.string().trim().optional().nullable(),
  countryRegion: z.string().trim().optional().nullable(),
  contactPerson: z.string().trim().min(1, 'Contact Person is required'),
  designation: z.string().trim().optional().nullable(),
  workEmail: z.string().trim().email('Invalid email address'),
  phoneNumber: z.string().trim().min(7, 'Invalid phone number'),
  alternateEmail: z.string().trim().optional().nullable().or(z.literal('')),
  alternatePhone: z.string().trim().optional().nullable().or(z.literal('')),
  techTagRequirement: z.string().trim().min(1, 'Tech Tag/Requirement is required'),
  inquirySource: z.string().trim().optional().nullable(),
  pipelineStage: z.string().trim().min(1, 'Pipeline Stage is required'),
  opportunityStatus: z.string().trim().min(1, 'Opportunity Status is required'),
  estimationDueDate: z.string().optional().nullable().or(z.literal('')),
  expectedStartDate: z.string().optional().nullable().or(z.literal('')),
  projectOverviewRequirements: z.string().trim().min(1, 'Project Overview/Requirements is required'),
  budgetRange: z.string().trim().optional().nullable(),
  estimatedValue: z.coerce.number().optional().nullable(),
  timeline: z.string().trim().optional().nullable(),
  priorityLevel: z.string().trim().optional().nullable(),
  probability: z.string().trim().optional().nullable(),
  accountOwner: z.string().trim().min(1, 'Account Owner is required'),
  salesManager: z.string().trim().optional().nullable(),
  technicalLead: z.string().trim().optional().nullable(),
  preferredCommunication: z.string().trim().optional().nullable(),
  attachmentUrl: z.string().trim().optional().nullable(),
  internalNotes: z.string().trim().optional().nullable(),
});

export const updateInquirySchema = createInquirySchema.partial();

export const createInquiryFeedSchema = z.object({
  inquiryId: z.coerce.number().int().positive(),
  technology: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().min(1).max(5000),
});

export const updateInquiryFeedSchema = z.object({
  technology: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().min(1).max(5000).optional(),
});

export const createClientCommunicationSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  message: z.string().trim().min(1).max(5000),
  attachments: z.array(z.string().trim().min(1).max(2000)).optional().nullable(),
  userId: z.coerce.number().int().positive().optional(),
});

export const updateClientCommunicationSchema = z.object({
  message: z.string().trim().min(1).max(5000).optional(),
  attachments: z.array(z.string().trim().min(1).max(2000)).optional().nullable(),
  isRead: z.boolean().optional(),
});
