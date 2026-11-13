import { z } from 'zod';

export const createInvoiceItemSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  description: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  amount: z.coerce.number().min(0).optional(),
});

export const updateInvoiceItemSchema = createInvoiceItemSchema.partial();

