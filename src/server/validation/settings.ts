import { z } from 'zod';

const emailSchema = z.string().trim().email().max(255);

export const companySettingsSchema = z.object({
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(255),
  email: emailSchema,
  logoUrl: z.string().trim().max(2000).optional().nullable(),
  primaryColor: z.string().trim().max(50).optional().nullable(),
  secondaryColor: z.string().trim().max(50).optional().nullable(),
  phone: z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits').optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  website: z.string().trim().url('Website must be a valid URL').or(z.string().length(0)).optional().nullable(),
  smtpHost: z.string().trim().max(255).optional().nullable(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  smtpUser: z.string().trim().max(255).optional().nullable(),
  smtpPassword: z.string().max(255).optional().nullable(),
  gstin: z.string().trim().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').or(z.string().length(0)).optional().nullable(),
  pan: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').or(z.string().length(0)).optional().nullable(),
  registrationCertificateUrl: z.string().trim().max(2000).optional().nullable(),
  panCardUrl: z.string().trim().max(2000).optional().nullable(),
  gstCertificateUrl: z.string().trim().max(2000).optional().nullable(),
  onboardingCompleted: z.boolean().optional(),
  faviconUrl: z.string().trim().max(2000).optional().nullable(),
  legalName: z.string().trim().max(255).optional().nullable(),
  workspaceName: z.string().trim().max(255).optional().nullable(),
  orgCode: z.string().trim().max(255).optional().nullable(),
  industry: z.string().trim().max(255).optional().nullable(),
  businessType: z.string().trim().max(255).optional().nullable(),
  timezone: z.string().trim().max(255).optional().nullable(),
  currency: z.string().trim().max(255).optional().nullable(),
  fiscalYear: z.string().trim().max(255).optional().nullable(),
  cinNumber: z.string().trim().max(255).optional().nullable(),
  msmeNumber: z.string().trim().max(255).optional().nullable(),
  emergencyContact: z.string().trim().max(255).optional().nullable(),
  supportEmail: z.string().trim().max(255).optional().nullable(),
  supportPhone: z.string().trim().max(255).optional().nullable(),
  invoicePrefix: z.string().trim().max(50).optional().nullable(),
  invoiceNumberStart: z.coerce.number().int().min(1).optional().nullable(),
  quotationPrefix: z.string().trim().max(50).optional().nullable(),
  purchasePrefix: z.string().trim().max(50).optional().nullable(),
  creditNotePrefix: z.string().trim().max(50).optional().nullable(),
  gstEnabled: z.boolean().optional().nullable(),
  gstRateDefault: z.coerce.number().min(0).max(100).optional().nullable(),
  taxConfiguration: z.array(z.object({
    name: z.string(),
    rate: z.number(),
    type: z.string()
  })).optional().nullable(),
  invoiceDecimal: z.coerce.number().int().min(0).max(4).optional().nullable(),
  invoiceFooter: z.string().trim().max(2000).optional().nullable(),
  invoiceTerms: z.string().trim().max(5000).optional().nullable(),
  defaultPaymentTerms: z.string().trim().max(255).optional().nullable(),
  paymentGateway: z.string().trim().max(50).optional().nullable(),
  paymentGatewayConfig: z.record(z.string(), z.any()).optional().nullable(),
  qrCodeEnabled: z.boolean().optional().nullable(),
  qrCodeUrl: z.string().trim().max(2000).optional().nullable(),
  digitalSignatureEnabled: z.boolean().optional().nullable(),
  digitalSignatureUrl: z.string().trim().max(2000).optional().nullable(),
  stampUrl: z.string().trim().max(2000).optional().nullable(),
  signatoryName: z.string().trim().max(255).optional().nullable(),
  signatoryTitle: z.string().trim().max(255).optional().nullable(),
  tagline: z.string().trim().max(500).optional().nullable(),
  bankDetails: z.record(z.string(), z.any()).optional().nullable(),
  invoiceTemplate: z.string().trim().max(50).optional().nullable(),
  multiCurrencyEnabled: z.boolean().optional().nullable(),
  supportedCurrencies: z.array(z.string()).optional().nullable(),
});

export const updateCompanySettingsSchema = companySettingsSchema.partial();

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(1).max(255),
  email: emailSchema.optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  gstNo: z.string().trim().max(100).optional().nullable(),
  pan: z.string().trim().max(100).optional().nullable(),
  tan: z.string().trim().max(100).optional().nullable(),
  registrationNo: z.string().trim().max(100).optional().nullable(),
  termsAndConditions: z.string().trim().max(5000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  paymentTerms: z.string().trim().max(2000).optional().nullable(),
  logoUrl: z.string().trim().max(2000).optional().nullable(),
});

export const companyHolidaySchema = z.object({
  date: z.string().date(),
  reason: z.string().trim().min(1).max(255),
  year: z.coerce.number().int().min(1000).max(9999).optional(),
});

export const updateCompanyHolidaySchema = companyHolidaySchema.partial();

