'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Building,
  User,
  CreditCard,
  History,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TECHSONANCE_COMPANY,
  CURRENCY_SYMBOLS,
  INVOICE_SUBTITLES,
  InvoiceLineItem,
  formatCurrencyAmount,
  formatDisplayDate
} from '@/lib/invoice-constants';
import { getStoredSessionToken } from '@/lib/client-session';

const HISTORY_KEY = 'techsonance_invoice_history_v1';

function InvoiceGeneratorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceIdParam = searchParams?.get('invoiceId');

  // DB Clients
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Form Fields
  const [invoiceType, setInvoiceType] = useState<string>('Advance Payment');
  const [invoiceNo, setInvoiceNo] = useState<string>('TS-INV-001');
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState<string>('INR');
  const [paymentTerms, setPaymentTerms] = useState<string>('Advance Payment');
  const [dueDate, setDueDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Bill To Fields
  const [clientName, setClientName] = useState<string>('');
  const [country, setCountry] = useState<string>('India');
  const [state, setState] = useState<string>('Gujarat');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');

  // Line Items
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      description: 'Software Development Services',
      details: 'Development advance against agreed project scope',
      hsn: '998314',
      qty: 1,
      rate: 50000,
    },
  ]);

  // Tax Fields
  const [taxTreatment, setTaxTreatment] = useState<string>('auto');
  const [taxRate, setTaxRate] = useState<string>('18');
  const [customTaxRate, setCustomTaxRate] = useState<string>('0');
  const [taxNotePreset, setTaxNotePreset] = useState<string>('lut');
  const [taxNote, setTaxNote] = useState<string>('');

  // Payment Fields
  const [paymentStatus, setPaymentStatus] = useState<string>('Unpaid');
  const [amountReceived, setAmountReceived] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [receivedFrom, setReceivedFrom] = useState<string>('');
  const [paymentConfirmation, setPaymentConfirmation] = useState<string>('');
  const [confirmationManuallyEdited, setConfirmationManuallyEdited] = useState<boolean>(false);

  // Notes & Policies
  const [notes, setNotes] = useState<string>('');
  const [terms, setTerms] = useState<string>('Services are provided as per the mutually agreed scope, timeline and commercial terms.');
  const [paymentInstructions, setPaymentInstructions] = useState<string>('Please mention the invoice number in the payment reference and share payment confirmation after transfer.');
  const [refundPolicy, setRefundPolicy] = useState<string>('Payments are subject to the applicable project agreement, cancellation terms and approved scope of work.');

  // UI / Status
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // 1. Fetch Clients and Next Invoice Number
  useEffect(() => {
    fetchClients();
    loadLocalHistory();
  }, []);

  useEffect(() => {
    if (invoiceIdParam) {
      loadExistingInvoice(Number(invoiceIdParam));
    }
  }, [invoiceIdParam]);

  const loadExistingInvoice = async (id: number) => {
    if (!id || isNaN(id)) return;
    try {
      const token = getStoredSessionToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/invoices?id=${id}`, { headers, credentials: 'include' });
      if (res.ok) {
        const inv = await res.json();
        setInvoiceNo(inv.invoiceNumber || `TS-INV-${id}`);
        if (inv.dueDate) setDueDate(inv.dueDate);
        if (inv.createdAt) setInvoiceDate(inv.createdAt.slice(0, 10));
        if (inv.notes) setNotes(inv.notes);
        if (inv.termsAndConditions) setTerms(inv.termsAndConditions);
        if (inv.paymentTerms) setPaymentTerms(inv.paymentTerms);
        if (inv.status === 'paid') setPaymentStatus('Paid');
        if (inv.amount) setAmountReceived(String(inv.amount));

        // Line items
        const itemsRes = await fetch(`/api/invoice-items?invoiceId=${id}`, { headers, credentials: 'include' });
        if (itemsRes.ok) {
          const itemsJson = await itemsRes.json();
          const list = itemsJson.data || itemsJson || [];
          if (Array.isArray(list) && list.length > 0) {
            setItems(list.map((it: any) => ({
              description: it.description,
              details: '',
              hsn: '998314',
              qty: Number(it.quantity) || 1,
              rate: Number(it.unitPrice) || 0,
            })));
          }
        }
        toast.success(`Loaded invoice ${inv.invoiceNumber} for preview!`);
      }
    } catch (err) {
      console.warn('Failed to load existing invoice:', err);
    }
  };

  const populateClientFields = (found: any) => {
    if (!found) return;

    // Company Name
    const cName =
      found.companyName ||
      found.company_name ||
      found.name ||
      found.contactPerson ||
      found.contact_person ||
      (found.email ? found.email.split('@')[0] : '');
    setClientName(cName);

    // Email
    const cEmail = found.email || found.companyEmail || found.company_email || '';
    setClientEmail(cEmail);

    // Contact Person
    const cContact =
      found.contactPerson ||
      found.contact_person ||
      found.contactName ||
      found.contact_name ||
      found.name ||
      cName;
    setContactPerson(cContact);

    // Phone
    const cPhone = found.phone || found.companyPhone || found.company_phone || '';
    setContactNumber(cPhone);

    // Country
    const cCountry = found.country || 'India';
    setCountry(cCountry);

    // State
    const cState = found.state || 'Gujarat';
    setState(cState);

    // Address
    const rawAddr = found.address || '';
    const cCity = found.city || '';
    const cPostal = found.postalCode || found.postal_code || '';
    let formattedAddress = rawAddr;
    if (!formattedAddress && (cCity || cState || cCountry)) {
      formattedAddress = [cCity, cState, cPostal, cCountry].filter(Boolean).join(', ');
    }
    setClientAddress(formattedAddress || (cState && cCountry ? `${cState}, ${cCountry}` : ''));

    // Tax ID (GST / VAT / TRN)
    const cTax = found.taxId || found.tax_id || found.gstin || found.vat || found.trn || '';
    if (cTax) setTaxId(cTax);

    // Currency
    if (found.currency && CURRENCY_SYMBOLS[found.currency]) {
      setCurrency(found.currency);
    }

    // Payment Terms
    if (found.paymentTerms || found.payment_terms) {
      setPaymentTerms(found.paymentTerms || found.payment_terms);
    }
  };

  const fetchClients = async () => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/clients?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setClients(list);
        if (list.length > 0 && !selectedClientId && !clientName) {
          setSelectedClientId(String(list[0].id));
          populateClientFields(list[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch clients:', err);
    }
  };

  const loadLocalHistory = () => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setHistoryList(parsed);
        // Compute next invoice number if not set
        let max = 0;
        parsed.forEach((x: any) => {
          const m = String(x.invoiceNo || '').match(/^TS-INV-(\d+)$/i);
          if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        if (max > 0) {
          setInvoiceNo(`TS-INV-${String(max + 1).padStart(3, '0')}`);
        }
      }
    } catch {
      // ignore
    }
  };

  // 2. Handle Client Selection from Dropdown
  const handleSelectClient = (cid: string) => {
    setSelectedClientId(cid);
    if (!cid) return;
    const found = clients.find((c) => String(c.id) === cid);
    if (found) {
      populateClientFields(found);
      const displayName = found.companyName || found.company_name || found.email || 'Client';
      toast.success(`Client details for "${displayName}" auto-filled!`);
    }
  };

  // 3. Auto Calculate Due Date based on Payment Terms
  useEffect(() => {
    if (!invoiceDate) return;
    if (paymentTerms === 'Advance Payment') {
      setDueDate(invoiceDate);
      return;
    }
    const daysMap: Record<string, number> = {
      'Due on Receipt': 0,
      '7 Days': 7,
      '15 Days': 15,
      '30 Days': 30,
      '45 Days': 45,
      '60 Days': 60,
    };
    if (daysMap[paymentTerms] !== undefined) {
      const d = new Date(`${invoiceDate}T00:00:00`);
      d.setDate(d.getDate() + daysMap[paymentTerms]);
      setDueDate(d.toISOString().slice(0, 10));
    }
  }, [paymentTerms, invoiceDate]);

  // 4. Tax Treatment Calculation
  const activeTaxMode = useMemo(() => {
    if (taxTreatment === 'auto') {
      const c = country.trim().toLowerCase();
      const s = state.trim().toLowerCase();
      if (!['india', 'in', 'bharat'].includes(c)) return 'exempt';
      return s === 'gujarat' ? 'cgstsgst' : 'igst';
    }
    return taxTreatment;
  }, [taxTreatment, country, state]);

  const activeTaxRate = useMemo(() => {
    if (activeTaxMode === 'none' || activeTaxMode === 'exempt') return 0;
    if (taxRate === 'custom') return Number(customTaxRate) || 0;
    return Number(taxRate) || 0;
  }, [activeTaxMode, taxRate, customTaxRate]);

  // 5. Update Tax Note Preset
  useEffect(() => {
    const presets: Record<string, string> = {
      lut: 'SUPPLY MEANT FOR EXPORT UNDER LUT WITHOUT PAYMENT OF IGST — use only if applicable to the transaction and supported by the supplier’s LUT/export status.',
      gst: 'GST applicable as per the tax treatment and rate stated in this invoice.',
      rcm: 'Reverse Charge Mechanism (RCM) applicable where legally required.',
      none: 'No tax has been charged on this invoice.',
    };

    if (activeTaxMode === 'exempt' && taxNotePreset !== 'custom') {
      setTaxNote(presets.lut);
    } else if (presets[taxNotePreset]) {
      setTaxNote(presets[taxNotePreset]);
    }
  }, [taxNotePreset, activeTaxMode]);

  // 6. Subtotal, Tax, Total, Received, Balance calculations
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);
    const taxAmount = (subtotal * activeTaxRate) / 100;
    const grandTotal = subtotal + taxAmount;
    const rec = Math.min(Number(amountReceived) || 0, grandTotal);
    const balance = Math.max(0, grandTotal - rec);

    return {
      subtotal,
      taxAmount,
      grandTotal,
      received: rec,
      balance,
    };
  }, [items, activeTaxRate, amountReceived]);

  // 7. Auto Payment Confirmation Note
  useEffect(() => {
    if (confirmationManuallyEdited) return;

    if (totals.received > 0) {
      const who = receivedFrom.trim() || clientName.trim() || 'the client';
      const kind = invoiceType.toLowerCase();
      const formattedRec = formatCurrencyAmount(totals.received, currency);
      setPaymentConfirmation(
        `Payment of ${formattedRec} has been received from ${who} as ${
          kind === 'full payment' ? 'full payment' : 'a payment'
        } towards the services described above.`
      );
    } else {
      setPaymentConfirmation('No payment has been recorded for this invoice.');
    }
  }, [totals.received, receivedFrom, clientName, invoiceType, currency, confirmationManuallyEdited]);

  // Line Item Handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        details: '',
        hsn: '998314',
        qty: 1,
        rate: 0,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.info('Invoice must have at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Sample Data Loader
  const handleLoadSample = () => {
    setInvoiceType('Advance Payment');
    setInvoiceNo('TS-INV-001');
    setCurrency('INR');
    setPaymentTerms('Advance Payment');
    setClientName('VAGSync AI Artificial Intelligence Developing Service - FZCO');
    setCountry('UAE');
    setState('Dubai');
    setClientAddress('Dubai Silicon Oasis, Dubai, United Arab Emirates');
    setTaxId('105445626200001');
    setClientEmail('billing@vagsync.ai');
    setContactPerson('Managing Director');
    setContactNumber('+971 4 000 0000');
    setItems([
      {
        description: 'Advance payment towards AI Software Development Services - ZION',
        details: 'Development advance against agreed project scope & deliverables',
        hsn: '998314',
        qty: 1,
        rate: 104420,
      },
    ]);
    setTaxTreatment('exempt');
    setTaxRate('0');
    setTaxNotePreset('lut');
    setPaymentStatus('Paid');
    setAmountReceived('104420');
    setReceivedFrom('Client Representative');
    setPaymentMethod('Bank Transfer');
    setPaymentRef('FT26111309884');
    setConfirmationManuallyEdited(false);
    toast.success('Sample client invoice loaded successfully!');
  };

  // Reset to New
  const handleReset = () => {
    setInvoiceType('Advance Payment');
    setCurrency('INR');
    setPaymentTerms('Advance Payment');
    const today = new Date().toISOString().slice(0, 10);
    setInvoiceDate(today);
    setDueDate(today);
    setClientName('');
    setCountry('India');
    setState('Gujarat');
    setClientAddress('');
    setTaxId('');
    setClientEmail('');
    setContactPerson('');
    setContactNumber('');
    setItems([
      {
        description: 'Software Development Services',
        details: 'Development services as per agreed proposal',
        hsn: '998314',
        qty: 1,
        rate: 0,
      },
    ]);
    setTaxTreatment('auto');
    setTaxRate('18');
    setCustomTaxRate('0');
    setTaxNotePreset('lut');
    setPaymentStatus('Unpaid');
    setAmountReceived('0');
    setPaymentMethod('Bank Transfer');
    setPaymentDate('');
    setPaymentRef('');
    setReceivedFrom('');
    setConfirmationManuallyEdited(false);
    setStatusMessage(null);
    loadLocalHistory();
    toast.info('Invoice reset to blank defaults.');
  };

  // Validation
  const validateForm = () => {
    const errors: string[] = [];
    if (!invoiceNo.trim()) errors.push('Invoice number is required.');
    if (!invoiceDate) errors.push('Invoice date is required.');
    if (!clientName.trim()) errors.push('Client / Company name is required.');
    if (!country.trim()) errors.push('Country is required.');
    if (!clientAddress.trim()) errors.push('Registered address is required.');
    if (!items.some((i) => i.description.trim() && i.qty > 0)) {
      errors.push('Add at least one valid invoice line item with a description and quantity.');
    }

    if (errors.length > 0) {
      setStatusMessage({ text: errors.join(' '), isError: true });
      toast.error(errors[0]);
      return false;
    }
    setStatusMessage(null);
    return true;
  };

  // Save to Database & Record History
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setStatusMessage(null);

    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. If client doesn't exist in DB yet, or selectedClientId is not set, resolve clientId
      let targetClientId = Number(selectedClientId);
      if (!targetClientId || isNaN(targetClientId)) {
        if (clients.length > 0) {
          targetClientId = clients[0].id;
        } else {
          // Attempt quick client creation
          const clientRes = await fetch('/api/clients', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              companyName: clientName.trim(),
              contactPerson: contactPerson.trim() || clientName.trim(),
              email: clientEmail.trim() || 'billing@client.com',
              phone: contactNumber.trim() || null,
              address: clientAddress.trim() || null,
            }),
          });
          if (clientRes.ok) {
            const newClient = await clientRes.json();
            targetClientId = newClient.id;
          } else {
            // fallback if clients table has existing record
            targetClientId = 1;
          }
        }
      }

      // 2. Insert Invoice
      const invoicePayload = {
        invoiceNumber: invoiceNo.trim(),
        clientId: targetClientId,
        amount: totals.subtotal,
        tax: totals.taxAmount,
        totalAmount: totals.grandTotal,
        dueDate: dueDate || invoiceDate,
        status: paymentStatus === 'Paid' ? 'paid' : 'sent',
        notes: notes || null,
        termsAndConditions: terms || null,
        paymentTerms: paymentTerms || null,
      };

      const invRes = await fetch('/api/invoices', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(invoicePayload),
      });

      if (!invRes.ok) {
        const errData = await invRes.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to save invoice in database');
      }

      const savedInv = await invRes.json();
      const invId = savedInv.id;

      // 3. Insert Invoice Line Items
      if (invId) {
        for (const item of items) {
          if (!item.description.trim()) continue;
          await fetch('/api/invoice-items', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              invoiceId: invId,
              description: item.details ? `${item.description} - ${item.details}` : item.description,
              quantity: Number(item.qty) || 1,
              unitPrice: Number(item.rate) || 0,
              amount: (Number(item.qty) || 1) * (Number(item.rate) || 0),
            }),
          }).catch((err) => console.warn('Failed to insert item:', err));
        }
      }

      // 4. Save to local history
      const historyRecord = {
        invoiceNo: invoiceNo.trim(),
        date: formatDisplayDate(invoiceDate),
        client: clientName.trim(),
        type: invoiceType,
        total: formatCurrencyAmount(totals.grandTotal, currency),
        created: new Date().toLocaleString(),
      };
      const updatedHistory = [historyRecord, ...historyList.filter((h) => h.invoiceNo !== historyRecord.invoiceNo)].slice(0, 100);
      setHistoryList(updatedHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      setStatusMessage({
        text: `Invoice ${invoiceNo} recorded successfully! Ready to print or download PDF.`,
        isError: false,
      });
      toast.success(`Invoice ${invoiceNo} created & recorded successfully!`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: err.message || 'Error saving invoice', isError: true });
      toast.error(err.message || 'Failed to record invoice');
    } finally {
      setSaving(false);
    }
  };

  // Print / Save PDF Handler
  const handlePrint = () => {
    if (!validateForm()) return;
    window.print();
  };

  return (
    <>
      {/* SCOPED INVOICE STYLES (MATCHING EXACT FINAL CLIENT INVOICE PDF GENERATOR) */}
      <style jsx global>{`
        :root {
          --navy: #061a3a;
          --blue: #1268e8;
          --cyan: #20c6f7;
          --line: #dce5ef;
          --light: #f5f8fc;
          --text: #172033;
          --muted: #667085;
          --green: #087443;
          --danger: #b42318;
          --white: #fff;
        }

        .pdf-invoice-sheet {
          width: 210mm;
          min-height: 297mm;
          background: #fff;
          margin: 0 auto;
          position: relative;
          padding: 18mm 15mm 16mm;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
          font-family: Inter, Arial, Helvetica, sans-serif;
          font-size: 9px;
          color: #172033;
          box-sizing: border-box;
        }

        .pdf-invoice-sheet::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2.2mm;
          background: #1268e8;
        }

        .inv-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8mm;
        }

        .inv-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .inv-brand img {
          width: 14mm;
          height: 14mm;
          object-fit: contain;
        }

        .inv-brand-name {
          font-size: 15px;
          font-weight: 800;
          color: #1c2b42;
        }

        .inv-tagline {
          font-size: 6.5px;
          color: #8a94a6;
          margin-top: 2px;
        }

        .inv-title {
          text-align: right;
        }

        .inv-title h1 {
          margin: 0;
          color: #1268e8;
          font-size: 21px;
          letter-spacing: 0.3px;
          font-weight: 900;
        }

        .inv-subtitle {
          font-size: 6.8px;
          color: #667085;
          text-transform: uppercase;
          letter-spacing: 0.35px;
          margin-top: 2px;
          font-weight: 700;
        }

        .inv-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15mm;
          margin-bottom: 7mm;
        }

        .inv-block-title {
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #2c65d8;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .inv-party {
          font-size: 7.4px;
          line-height: 1.45;
        }

        .inv-party strong {
          font-size: 8.2px;
          color: #1d2939;
        }

        .inv-meta {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2.5mm;
          margin-bottom: 8mm;
        }

        .inv-meta-box {
          background: #f6f9fc;
          border: 1px solid #e4ebf3;
          padding: 3mm;
        }

        .inv-meta-label {
          font-size: 6px;
          letter-spacing: 0.7px;
          color: #7a8699;
          text-transform: uppercase;
          margin-bottom: 2px;
          font-weight: 700;
        }

        .inv-meta-value {
          font-size: 8px;
          font-weight: 800;
          color: #27364b;
          overflow-wrap: anywhere;
        }

        .inv-items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 7mm;
        }

        .inv-items-table th {
          background: #061a3a;
          color: #fff;
          font-size: 6.2px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          padding: 3mm 2.5mm;
          text-align: left;
        }

        .inv-items-table th:nth-child(n+3),
        .inv-items-table td:nth-child(n+3) {
          text-align: right;
        }

        .inv-items-table td {
          border-bottom: 1px solid #e3e8ef;
          padding: 3.2mm 2.5mm;
          vertical-align: top;
          font-size: 7.5px;
        }

        .inv-items-table .desc strong {
          display: block;
          font-size: 8px;
          color: #1c2b42;
        }

        .inv-items-table .desc small {
          display: block;
          color: #7a8699;
          font-size: 6.4px;
          margin-top: 1px;
        }

        .inv-summary-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 10mm;
          margin-bottom: 8mm;
        }

        .inv-confirmation {
          background: linear-gradient(90deg, #f2fbff, #f8fbff);
          border-left: 1mm solid #20c6f7;
          padding: 4mm;
          font-size: 6.8px;
          line-height: 1.5;
          min-height: 31mm;
        }

        .inv-confirmation strong {
          display: block;
          color: #27364b;
          margin-bottom: 2px;
        }

        .inv-totals {
          font-size: 7.6px;
        }

        .inv-total-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          padding: 1.7mm 0;
        }

        .inv-total-row.grand {
          border-top: 1px solid #344054;
          margin-top: 1.5mm;
          padding-top: 3mm;
          font-size: 11px;
          font-weight: 900;
        }

        .inv-received {
          background: #061a3a;
          color: #fff;
          padding: 2.8mm 3mm;
          margin-top: 4mm;
          display: flex;
          justify-content: space-between;
          font-weight: 800;
        }

        .inv-balance {
          background: #edf4ff;
          color: #0b4da2;
          padding: 2.6mm 3mm;
          display: flex;
          justify-content: space-between;
          font-weight: 800;
          border: 1px solid #d3e3ff;
          border-top: 0;
        }

        .inv-lower {
          border-top: 1px solid #e3e8ef;
          padding-top: 6mm;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12mm;
        }

        .inv-lower p {
          font-size: 6.5px;
          line-height: 1.45;
          margin: 2px 0;
          color: #536174;
        }

        .inv-bank {
          font-size: 6.7px;
          line-height: 1.5;
        }

        .inv-sign-area {
          text-align: center;
          margin-top: 5mm;
          position: relative;
          min-height: 34mm;
        }

        .inv-sig-stack {
          height: 22mm;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 2mm;
        }

        .inv-stamp-img {
          width: 22mm;
          height: 22mm;
          object-fit: contain;
          mix-blend-mode: multiply;
        }

        .inv-sig-img {
          width: 34mm;
          height: 18mm;
          object-fit: contain;
          mix-blend-mode: multiply;
          margin-left: -10mm;
        }

        .inv-sign-line {
          border-top: 1px solid #98a2b3;
          padding-top: 2mm;
          font-size: 6.4px;
        }

        .inv-sign-line strong {
          display: block;
          font-size: 7px;
          color: #344054;
        }

        .inv-terms {
          margin-top: 5mm;
          border-top: 1px solid #e3e8ef;
          padding-top: 4mm;
        }

        .inv-terms-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5mm;
        }

        .inv-term-box {
          font-size: 6.2px;
          line-height: 1.45;
          color: #667085;
        }

        .inv-term-box strong {
          color: #344054;
          display: block;
          font-size: 6.5px;
          margin-bottom: 1px;
        }

        .inv-footer {
          position: absolute;
          bottom: 6mm;
          left: 15mm;
          right: 15mm;
          display: flex;
          justify-content: space-between;
          color: #98a2b3;
          font-size: 5.8px;
        }

        /* PRINT MEDIA STYLES */
        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          body {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          /* Hide all UI elements */
          body * {
            visibility: hidden !important;
          }

          /* Show only the invoice container */
          #printArea, #printArea * {
            visibility: visible !important;
          }

          #printArea {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 18mm 15mm 16mm !important;
            box-shadow: none !important;
            overflow: hidden !important;
            background: #fff !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 p-3 md:p-6 text-slate-800 dark:text-slate-100">
        <div className="max-w-[1700px] mx-auto space-y-5">
          
          {/* HEADER BANNER */}
          <div className="no-print bg-gradient-to-r from-[#061a3a] via-[#0b2b5d] to-[#1268e8] text-white rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-md">
                <img src={TECHSONANCE_COMPANY.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight">
                  TechSonance Invoice Generator & Live PDF
                </h1>
                <p className="text-xs text-blue-100/80 mt-0.5">
                  Prepare, preview, record in database and generate official TechSonance Client Invoices.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/finance/invoices"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Invoices
              </Link>
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-white border border-blue-300/30 transition shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Load Sample
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition"
              >
                <Printer className="h-4 w-4" /> Print / Save PDF
              </button>
            </div>
          </div>

          {/* TWO COLUMN GRID: FORM ON LEFT, LIVE PREVIEW ON RIGHT */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: INTERACTIVE FORM (5 Cols on XL) */}
            <div className="no-print xl:col-span-5 space-y-4">
              <form onSubmit={handleSaveInvoice} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5">
                
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-zinc-800">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#061a3a] dark:text-blue-400 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#1268e8]" /> Invoice Configuration
                  </h2>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> New / Reset
                  </button>
                </div>

                {/* 1. INVOICE META */}
                <div className="space-y-3">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Invoice Details
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Invoice Type *
                      </label>
                      <select
                        value={invoiceType}
                        onChange={(e) => setInvoiceType(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      >
                        <option>Advance Payment</option>
                        <option>Partial Payment</option>
                        <option>Full Payment</option>
                        <option>Final Payment</option>
                        <option>Milestone Payment</option>
                        <option>Recurring Payment</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Invoice No. *
                      </label>
                      <input
                        type="text"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        required
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs font-bold outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Invoice Date *
                      </label>
                      <input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        required
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Currency *
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      >
                        <option value="INR">INR — Indian Rupee (₹)</option>
                        <option value="USD">USD — US Dollar ($)</option>
                        <option value="AED">AED — UAE Dirham (د.إ)</option>
                        <option value="EUR">EUR — Euro (€)</option>
                        <option value="GBP">GBP — British Pound (£)</option>
                        <option value="CAD">CAD — Canadian Dollar (C$)</option>
                        <option value="AUD">AUD — Australian Dollar (A$)</option>
                        <option value="SGD">SGD — Singapore Dollar (S$)</option>
                        <option value="JPY">JPY — Japanese Yen (¥)</option>
                        <option value="CHF">CHF — Swiss Franc</option>
                        <option value="SAR">SAR — Saudi Riyal (﷼)</option>
                        <option value="QAR">QAR — Qatari Riyal (ر.ق)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Terms *
                      </label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      >
                        <option>Advance Payment</option>
                        <option>Due on Receipt</option>
                        <option>7 Days</option>
                        <option>15 Days</option>
                        <option>30 Days</option>
                        <option>45 Days</option>
                        <option>60 Days</option>
                        <option>Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. BILL TO (CLIENT DETAILS) */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Bill To (Client)
                    </span>
                    {clients.length > 0 && (
                      <span className="text-[10px] text-slate-400">
                        {clients.length} registered clients
                      </span>
                    )}
                  </div>

                  {clients.length > 0 && (
                    <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-200/50 dark:border-blue-900/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-extrabold text-blue-950 dark:text-blue-300">
                          Auto-fill from Client Directory
                        </label>
                        {selectedClientId && (
                          <button
                            type="button"
                            onClick={() => handleSelectClient(selectedClientId)}
                            className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="h-2.5 w-2.5" /> Re-apply client info
                          </button>
                        )}
                      </div>
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleSelectClient(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-850 text-xs font-semibold outline-none border-blue-300 dark:border-blue-800 shadow-sm text-slate-800 dark:text-slate-100"
                      >
                        <option value="">-- Direct / Custom Client Entry --</option>
                        {clients.map((c) => {
                          const company =
                            c.companyName ||
                            c.company_name ||
                            c.contactPerson ||
                            c.contact_person ||
                            c.name ||
                            (c.email ? c.email.split('@')[0] : 'Client');
                          return (
                            <option key={c.id} value={c.id}>
                              {company} {c.email ? `(${c.email})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Client / Company Name *
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. VAGSync AI Artificial Intelligence"
                        required
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs font-bold outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Country *
                      </label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="India / UAE / USA"
                        required
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Gujarat / Dubai"
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Registered Address *
                      </label>
                      <textarea
                        rows={2}
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        placeholder="Street, Building, City, Zip Code"
                        required
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        TRN / VAT / GST / Tax ID
                      </label>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="e.g. 105445626200001"
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="billing@client.com"
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="+91 / +971..."
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. LINE ITEMS */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Line Items ({items.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1268e8] hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Add Item
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-xl bg-slate-50/70 dark:bg-zinc-850 border-slate-200 dark:border-zinc-700 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[#061a3a] dark:text-slate-200 text-[11px]">
                            Item #{idx + 1}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-600 hover:text-rose-700 text-[10.5px] font-bold flex items-center gap-0.5"
                            >
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                            Description *
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                            placeholder="e.g. Software Development Services"
                            required
                            className="w-full border rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 text-xs font-semibold outline-none border-slate-200 dark:border-zinc-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                            Details / Scope
                          </label>
                          <input
                            type="text"
                            value={item.details || ''}
                            onChange={(e) => handleUpdateItem(idx, 'details', e.target.value)}
                            placeholder="Deliverables, milestone, or scope notes"
                            className="w-full border rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 text-xs outline-none border-slate-200 dark:border-zinc-700"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                              HSN / SAC
                            </label>
                            <input
                              type="text"
                              value={item.hsn || ''}
                              onChange={(e) => handleUpdateItem(idx, 'hsn', e.target.value)}
                              placeholder="998314"
                              className="w-full border rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 text-xs outline-none border-slate-200 dark:border-zinc-700"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.qty}
                              onChange={(e) => handleUpdateItem(idx, 'qty', Number(e.target.value) || 0)}
                              className="w-full border rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 text-xs text-right font-semibold outline-none border-slate-200 dark:border-zinc-700"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                              Rate ({CURRENCY_SYMBOLS[currency] || currency})
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.rate}
                              onChange={(e) => handleUpdateItem(idx, 'rate', Number(e.target.value) || 0)}
                              className="w-full border rounded-lg px-2 py-1 bg-white dark:bg-zinc-900 text-xs text-right font-bold outline-none border-slate-200 dark:border-zinc-700"
                            />
                          </div>
                        </div>

                        <div className="text-right text-[10.5px] font-extrabold text-slate-600 dark:text-slate-300 pt-1">
                          Line Total: {formatCurrencyAmount((item.qty || 0) * (item.rate || 0), currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. TAX & GST */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Tax & GST Rules
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tax Treatment
                      </label>
                      <select
                        value={taxTreatment}
                        onChange={(e) => setTaxTreatment(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      >
                        <option value="auto">Auto GST by Client Location</option>
                        <option value="exempt">GST Exempt / Export LUT</option>
                        <option value="none">No Tax (0%)</option>
                        <option value="igst">IGST</option>
                        <option value="cgstsgst">CGST + SGST</option>
                        <option value="custom">Custom Tax</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tax Rate
                      </label>
                      <select
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18% (Standard GST)</option>
                        <option value="28">28%</option>
                        <option value="custom">Custom Rate</option>
                      </select>
                    </div>

                    {taxRate === 'custom' && (
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Custom Tax %
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={customTaxRate}
                          onChange={(e) => setCustomTaxRate(e.target.value)}
                          className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                        />
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tax / Export Note Preset
                      </label>
                      <select
                        value={taxNotePreset}
                        onChange={(e) => setTaxNotePreset(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      >
                        <option value="lut">Export under LUT without payment of IGST</option>
                        <option value="gst">GST applicable as per invoice</option>
                        <option value="rcm">Reverse Charge Mechanism (RCM)</option>
                        <option value="none">No Tax Statement</option>
                        <option value="custom">Custom Tax Note</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tax Note Statement
                      </label>
                      <textarea
                        rows={2}
                        value={taxNote}
                        onChange={(e) => setTaxNote(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. PAYMENT RECORDING */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Payment & Receipts
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Status
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      >
                        <option>Unpaid</option>
                        <option>Partially Paid</option>
                        <option>Paid</option>
                        <option>Advance Received</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Amount Received
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs font-bold outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      >
                        <option>Bank Transfer</option>
                        <option>UPI</option>
                        <option>Cash</option>
                        <option>Cheque</option>
                        <option>Card</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Transaction / Reference No.
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. UTR / NEFT / IMPS / Wire Ref"
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Received From
                      </label>
                      <input
                        type="text"
                        value={receivedFrom}
                        onChange={(e) => setReceivedFrom(e.target.value)}
                        placeholder="Person or company making transfer"
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Confirmation Note
                      </label>
                      <textarea
                        rows={2}
                        value={paymentConfirmation}
                        onChange={(e) => {
                          setPaymentConfirmation(e.target.value);
                          setConfirmationManuallyEdited(true);
                        }}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. NOTES & TERMS */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Notes & Terms
                  </span>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        General Notes
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional invoice notes for client"
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Terms & Conditions
                      </label>
                      <textarea
                        rows={2}
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={paymentInstructions}
                        onChange={(e) => setPaymentInstructions(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cancellation / Refund Policy
                      </label>
                      <textarea
                        rows={2}
                        value={refundPolicy}
                        onChange={(e) => setRefundPolicy(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs outline-none border-slate-200 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                {/* FORM ACTIONS */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-[#1268e8] hover:bg-[#0c56c2] text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition"
                    >
                      {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save & Record Invoice
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                    </button>
                  </div>

                  {statusMessage && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        statusMessage.isError
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {statusMessage.isError ? (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      )}
                      <span>{statusMessage.text}</span>
                    </div>
                  )}
                </div>

                {/* LOCAL HISTORY LOG */}
                {historyList.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Recent Invoices ({historyList.length})
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {historyList.slice(0, 5).map((h, i) => (
                        <div
                          key={i}
                          className="p-2 border rounded-lg bg-slate-50 dark:bg-zinc-800 text-[10px] flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-[#061a3a] dark:text-blue-400">{h.invoiceNo}</span> · {h.client}
                            <div className="text-[9px] text-slate-400">{h.date} · {h.type}</div>
                          </div>
                          <span className="font-black text-slate-700 dark:text-slate-200">{h.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* RIGHT COLUMN: LIVE A4 INVOICE PREVIEW (7 Cols on XL) */}
            <div className="xl:col-span-7 flex flex-col items-center">
              
              <div className="no-print w-full flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <Printer className="h-4 w-4 text-[#1268e8]" /> Live A4 Invoice Sheet Preview
                </span>
                <span className="text-[11px] text-slate-400">
                  Matches standard A4 (210mm × 297mm) print layout
                </span>
              </div>

              {/* A4 PRINT CONTAINER */}
              <div className="w-full overflow-x-auto pb-8 flex justify-center">
                <div id="printArea" className="pdf-invoice-sheet">
                  
                  {/* INVOICE HEADER */}
                  <div className="inv-header">
                    <div className="inv-brand">
                      <img src={TECHSONANCE_COMPANY.logoUrl} alt="TechSonance Logo" />
                      <div>
                        <div className="inv-brand-name">{TECHSONANCE_COMPANY.name}</div>
                        <div className="inv-tagline">{TECHSONANCE_COMPANY.tagline}</div>
                      </div>
                    </div>

                    <div className="inv-title">
                      <h1>INVOICE</h1>
                      <div className="inv-subtitle">
                        {INVOICE_SUBTITLES[invoiceType] || invoiceType.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* TWO-COL PARTIES */}
                  <div className="inv-two-col">
                    <div>
                      <div className="inv-block-title">Issued By</div>
                      <div className="inv-party">
                        <strong>{TECHSONANCE_COMPANY.name}</strong><br />
                        UG-15, Palladium Plaza, VIP Road, Vesu,<br />
                        Surat, Gujarat - 395007, India<br />
                        {TECHSONANCE_COMPANY.email} · {TECHSONANCE_COMPANY.website}<br />
                        GSTIN: {TECHSONANCE_COMPANY.gstin} · LLPIN: {TECHSONANCE_COMPANY.llpin}
                      </div>
                    </div>

                    <div>
                      <div className="inv-block-title">Bill To</div>
                      <div className="inv-party">
                        <strong>{clientName || '—'}</strong><br />
                        {clientAddress ? (
                          clientAddress.split('\n').map((line, idx) => (
                            <React.Fragment key={idx}>
                              {line}<br />
                            </React.Fragment>
                          ))
                        ) : (
                          <>Registered Address<br /></>
                        )}
                        {[state, country].filter(Boolean).join(', ')}<br />
                        {taxId && <>Tax ID: {taxId}<br /></>}
                        {clientEmail && <>{clientEmail}<br /></>}
                        {[contactPerson, contactNumber].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>

                  {/* META GRID */}
                  <div className="inv-meta">
                    <div className="inv-meta-box">
                      <div className="inv-meta-label">Invoice No.</div>
                      <div className="inv-meta-value">{invoiceNo || '—'}</div>
                    </div>

                    <div className="inv-meta-box">
                      <div className="inv-meta-label">Invoice Date</div>
                      <div className="inv-meta-value">{formatDisplayDate(invoiceDate)}</div>
                    </div>

                    <div className="inv-meta-box">
                      <div className="inv-meta-label">Currency</div>
                      <div className="inv-meta-value">{currency}</div>
                    </div>

                    <div className="inv-meta-box">
                      <div className="inv-meta-label">Payment Terms / Due</div>
                      <div className="inv-meta-value">
                        {paymentTerms}
                        {dueDate && (
                          <div style={{ fontSize: '6px', fontWeight: 500, color: '#667085', marginTop: '1px' }}>
                            Due {formatDisplayDate(dueDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LINE ITEMS TABLE */}
                  <table className="inv-items-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45%' }}>Description</th>
                        <th style={{ width: '12%' }}>HSN/SAC</th>
                        <th style={{ width: '8%' }}>Qty</th>
                        <th style={{ width: '15%' }}>Rate</th>
                        <th style={{ width: '20%' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="desc">
                            <strong>{item.description || '—'}</strong>
                            {item.details && <small>{item.details}</small>}
                          </td>
                          <td>{item.hsn || '—'}</td>
                          <td>{item.qty}</td>
                          <td>{formatCurrencyAmount(item.rate, currency)}</td>
                          <td>
                            <b>{formatCurrencyAmount(item.qty * item.rate, currency)}</b>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* SUMMARY & TOTALS */}
                  <div className="inv-summary-grid">
                    <div className="inv-confirmation">
                      <strong>Payment Confirmation</strong>
                      <div>{paymentConfirmation || 'No payment has been recorded for this invoice.'}</div>
                      {(paymentMethod || paymentDate || paymentRef) && (
                        <div style={{ marginTop: '4px', color: '#667085', fontSize: '6.2px' }}>
                          {[paymentMethod, paymentDate ? formatDisplayDate(paymentDate) : '', paymentRef ? `Ref: ${paymentRef}` : '']
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      )}
                    </div>

                    <div className="inv-totals">
                      <div className="inv-total-row">
                        <span>Subtotal</span>
                        <b>{formatCurrencyAmount(totals.subtotal, currency)}</b>
                      </div>

                      {/* Tax Breakdown */}
                      {activeTaxMode === 'cgstsgst' ? (
                        <>
                          <div className="inv-total-row">
                            <span>CGST ({activeTaxRate / 2}%)</span>
                            <b>{formatCurrencyAmount(totals.taxAmount / 2, currency)}</b>
                          </div>
                          <div className="inv-total-row">
                            <span>SGST ({activeTaxRate / 2}%)</span>
                            <b>{formatCurrencyAmount(totals.taxAmount / 2, currency)}</b>
                          </div>
                        </>
                      ) : activeTaxMode === 'igst' ? (
                        <div className="inv-total-row">
                          <span>IGST ({activeTaxRate}%)</span>
                          <b>{formatCurrencyAmount(totals.taxAmount, currency)}</b>
                        </div>
                      ) : activeTaxMode === 'custom' ? (
                        <div className="inv-total-row">
                          <span>Tax ({activeTaxRate}%)</span>
                          <b>{formatCurrencyAmount(totals.taxAmount, currency)}</b>
                        </div>
                      ) : (
                        <div className="inv-total-row">
                          <span>GST / Tax</span>
                          <b>0%</b>
                        </div>
                      )}

                      <div className="inv-total-row grand">
                        <span>Total</span>
                        <span>{formatCurrencyAmount(totals.grandTotal, currency)}</span>
                      </div>

                      <div className="inv-received">
                        <span>Amount Received</span>
                        <span>{formatCurrencyAmount(totals.received, currency)}</span>
                      </div>

                      <div className="inv-balance">
                        <span>Balance Due</span>
                        <span>{formatCurrencyAmount(totals.balance, currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* LOWER SECTION: NOTES & BANK DETAILS / SIGNATURE */}
                  <div className="inv-lower">
                    <div>
                      <div className="inv-block-title">Tax / Export Note</div>
                      <p>{taxNote || '—'}</p>

                      <div className="inv-block-title" style={{ marginTop: '4mm' }}>Notes</div>
                      <p>{notes || '—'}</p>
                    </div>

                    <div>
                      <div className="inv-block-title">Payment Details</div>
                      <div className="inv-bank">
                        <b>Bank:</b> {TECHSONANCE_COMPANY.bank.name}<br />
                        <b>Account Name:</b> {TECHSONANCE_COMPANY.bank.accountName}<br />
                        <b>Account No.:</b> {TECHSONANCE_COMPANY.bank.accountNo} · <b>IFSC/SWIFT:</b> {TECHSONANCE_COMPANY.bank.ifsc}<br />
                        <b>UPI ID:</b> {TECHSONANCE_COMPANY.bank.upiId}
                      </div>

                      <div className="inv-sign-area">
                        <div className="inv-sig-stack">
                          <img className="inv-stamp-img" src={TECHSONANCE_COMPANY.stampUrl} alt="TechSonance Official Stamp" />
                          <img className="inv-sig-img" src={TECHSONANCE_COMPANY.signatureUrl} alt="Authorized Signatory" />
                        </div>
                        <div className="inv-sign-line">
                          <strong>{TECHSONANCE_COMPANY.signatory.name}</strong>
                          {TECHSONANCE_COMPANY.signatory.title}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TERMS & CONDITIONS 4-BOX GRID */}
                  <div className="inv-terms">
                    <div className="inv-terms-grid">
                      <div className="inv-term-box">
                        <strong>Terms & Conditions</strong>
                        <span>{terms}</span>
                      </div>

                      <div className="inv-term-box">
                        <strong>Payment Instructions</strong>
                        <span>{paymentInstructions}</span>
                      </div>

                      <div className="inv-term-box">
                        <strong>Cancellation / Refund Policy</strong>
                        <span>{refundPolicy}</span>
                      </div>

                      <div className="inv-term-box">
                        <strong>Payment Reference</strong>
                        <span>{paymentRef || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="inv-footer">
                    <span>Thank you for your business.</span>
                    <span>{TECHSONANCE_COMPANY.name} · Confidential Commercial Document</span>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default function NewInvoiceGeneratorPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-bold text-slate-500">Loading Invoice Generator & PDF Preview...</div>}>
      <InvoiceGeneratorInner />
    </Suspense>
  );
}
