import { z } from 'zod';

export const clientStatusSchema = z.enum(['active', 'inactive', 'prospect']);

const phonePattern = /^\+?[\d\s\-()+]{7,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const websitePattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

export const createClientSchema = z.object({
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(200),
  contactPerson: z.string().trim().min(2, 'Contact person must be at least 2 characters').max(200),
  email: z.string().trim().min(1, 'Email address is required').regex(emailPattern, 'Invalid email address format').max(255),
  phone: z.string().trim().min(1, 'Mobile Number is required').regex(phonePattern, 'Invalid mobile number format').max(30),
  website: z.string().trim().max(255).optional().nullable().or(z.literal('')).refine((v) => !v || websitePattern.test(v), 'Invalid website URL format'),
  industry: z.string().trim().min(2, 'Industry must be at least 2 characters').max(100),
  businessType: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  companySize: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  companyEmail: z.string().trim().max(255).optional().nullable().or(z.literal('')).refine((v) => !v || emailPattern.test(v), 'Invalid company email format'),
  companyPhone: z.string().trim().max(100).optional().nullable().or(z.literal('')).refine((v) => !v || phonePattern.test(v), 'Invalid company phone format'),
  designation: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  leadSource: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  accountOwner: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  interestedServices: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  priority: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  estimatedBudget: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  expectedStartDate: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  currency: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  paymentTerms: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  status: clientStatusSchema.optional(),
  onboardingStep: z.number().int().min(1).max(4).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  city: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  state: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  country: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  postalCode: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  logoUrl: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
  uploadedFileIds: z.array(z.string()).optional(),
});

export const updateClientSchema = createClientSchema.partial();




