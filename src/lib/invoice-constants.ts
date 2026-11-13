export const TECHSONANCE_COMPANY = {
  name: 'TechSonance InfoTech LLP',
  tagline: 'Where Innovation Finds Its Resonance',
  address: 'UG-15, Palladium Plaza, VIP Road, Vesu,\nSurat, Gujarat - 395007, India',
  email: 'info@techsonance.co.in',
  website: 'www.techsonance.co.in',
  gstin: '24AAZFT2335E1Z0',
  llpin: 'ACT-4904',
  bank: {
    name: 'Kotak Bank',
    accountName: 'TechSonance InfoTech LLP',
    accountNo: '1711230225',
    ifsc: 'KKBK00002875',
    upiId: '9173101711@kotak',
  },
  signatory: {
    name: 'Sajeshkumar Adeya',
    title: 'Co-Founder & CTO · Authorized Signatory',
  },
  logoUrl: '/images/invoices/techsonance-logo.png',
  stampUrl: '/images/invoices/stamp.png',
  signatureUrl: '/images/invoices/signature.png',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  AED: 'د.إ',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  SGD: 'S$',
  JPY: '¥',
  CHF: 'CHF ',
  SAR: '﷼',
  QAR: 'ر.ق',
};

export const INVOICE_SUBTITLES: Record<string, string> = {
  'Advance Payment': 'DEVELOPMENT ADVANCE',
  'Partial Payment': 'PARTIAL PAYMENT',
  'Full Payment': 'FULL PAYMENT',
  'Final Payment': 'FINAL PAYMENT',
  'Milestone Payment': 'MILESTONE PAYMENT',
  'Recurring Payment': 'RECURRING PAYMENT',
  'Other': 'OTHER / CUSTOM INVOICE',
};

export interface InvoiceLineItem {
  id?: string | number;
  description: string;
  details?: string;
  hsn?: string;
  qty: number;
  rate: number;
}

export function formatCurrencyAmount(amount: number, currency = 'INR'): string {
  const sym = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const val = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  return sym + val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  }
  return dateStr;
}

