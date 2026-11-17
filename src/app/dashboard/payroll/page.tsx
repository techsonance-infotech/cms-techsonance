"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Download,
  Check,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Settings2,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  Wallet,
  Printer,
  Mail,
  RefreshCw,
  Search,
  FileText,
  CheckCircle2,
  Trash2,
  Building2,
  Send,
  Eye,
  History as HistoryIcon,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

// --- Interfaces ---
interface Employee {
  id: number;
  userId: number;
  employeeId: string;
  department?: string;
  designation?: string;
  salary?: number;
  hourlyRate?: number;
  ctc?: number;
  employmentType?: string;
  dateOfJoining?: string;
  workLocation?: string;
  panNumber?: string;
  uanNumber?: string;
  pfNumber?: string;
  esiNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  officeEmail?: string;
  phone?: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface AttendanceSummary {
  employeeId: number;
  employeeName: string;
  presentDays: number;
  halfDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  holidayDays: number;
  workPercentage: number;
  baseSalary: number;
  calculatedSalary: number;
}

interface Payroll {
  id: number;
  employeeId: number;
  month: string;
  year: number;
  baseSalary: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  totalWorkingDays: number;
  calculatedSalary: number;
  deductions: number;
  bonuses: number;
  netSalary: number;
  status: string;
  generatedAt: string;
  notes?: string;
}

interface DynamicCompanySettings {
  companyName: string;
  tagline: string;
  address: string;
  email: string;
  website: string;
  gstin: string;
  llpin: string;
  logoUrl: string;
  stampUrl: string;
  signatureUrl: string;
  signatoryName: string;
  signatoryTitle: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankBranch: string;
}

export interface SalarySlipFormState {
  selectedEmpId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  employmentType: string;
  joiningDate: string;
  workLocation: string;
  manager: string;
  email: string;
  phone: string;
  pan: string;
  uan: string;
  pfNo: string;
  esiNo: string;
  salaryMonth: string;
  payDate: string;
  slipNo: string;
  taxRegime: string;
  calendarDays: number;
  weeklyOffs: number;
  publicHolidays: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  paidLeave: number;
  unpaidLeave: number;
  halfDays: number;
  wfhDays: number;
  lopBasis: 'working' | 'calendar';
  monthlySalary: number;
  structureMode: 'auto' | 'manual';
  basicPct: number;
  hraPct: number;
  daPct: number;
  pfApplicable: 'yes' | 'no';
  pfBase: 'basic' | 'statutory' | 'custom';
  employeePfPct: number;
  employerPfPct: number;
  pfCap: number;
  customPfWage: number;
  gratuityApplicable: 'yes' | 'no';
  gratuityPct: number;
  employerEsi: 'no' | 'yes';
  employerEsiPct: number;
  pt: number;
  tds: number;
  loan: number;
  otherDed: number;
  holidayList: string;
  leaveDetails: string;
  bankName: string;
  bankAccount: string;
  ifsc: string;
  bankBranch: string;
  notes: string;
  signatoryName: string;
  signatoryTitle: string;
}

export interface SlipRecord extends Omit<SalarySlipFormState, 'manager' | 'signatoryName' | 'signatoryTitle' | 'selectedEmpId'> {
  id: string;
  annualCTC: number;
  updatedAt: string;
  calculation?: any;
  selectedEmpId?: string;
  manager?: string;
  signatoryName?: string;
  signatoryTitle?: string;
}

export const getCurrentYearMonth = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const currentYm = getCurrentYearMonth();

export const getTodayDateString = (d = new Date()) =>
  d.toISOString().slice(0, 10);

export const createInitialFormState = (now = new Date()): SalarySlipFormState => {
  const currentYm = getCurrentYearMonth(now);
  const todayStr = getTodayDateString(now);
  return {
    selectedEmpId: '',
    employeeCode: '',
    employeeName: '',
    designation: '',
    department: '',
    employmentType: 'Full Time',
    joiningDate: '2026-01-05',
    workLocation: 'Surat, Gujarat',
    manager: '',
    email: '',
    phone: '',
    pan: '',
    uan: '',
    pfNo: '',
    esiNo: '',
    salaryMonth: currentYm,
    payDate: todayStr,
    slipNo: `TS-SAL-${now.getFullYear()}-00001`,
    taxRegime: 'new',
    calendarDays: 31,
    weeklyOffs: 5,
    publicHolidays: 0,
    workingDays: 26,
    presentDays: 21,
    absentDays: 0,
    paidLeave: 5,
    unpaidLeave: 0,
    halfDays: 0,
    wfhDays: 0,
    lopBasis: 'working',
    monthlySalary: 15000,
    structureMode: 'auto',
    basicPct: 50,
    hraPct: 50,
    daPct: 0,
    pfApplicable: 'no',
    pfBase: 'basic',
    employeePfPct: 12,
    employerPfPct: 12,
    pfCap: 15000,
    customPfWage: 0,
    gratuityApplicable: 'yes',
    gratuityPct: 4.81,
    employerEsi: 'no',
    employerEsiPct: 3.25,
    pt: 0,
    tds: 0,
    loan: 0,
    otherDed: 0,
    holidayList: '',
    leaveDetails: 'Earned / Paid Leave — 5 — Paid',
    bankName: '',
    bankAccount: '',
    ifsc: '',
    bankBranch: '',
    notes: 'This salary slip is computer generated and does not require a physical signature unless required by company policy.',
    signatoryName: '',
    signatoryTitle: '',
  };
};

// Helper formatting functions matching the reference HTML
const money = (v: number) =>
  (Number(v) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const rupee = (v: number) => '₹' + money(v);

function fmtDate(x?: string | null): string {
  if (!x) return '—';
  const clean = x.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return x;
}

function monthLabel(x?: string | null): string {
  if (!x) return '—';
  const parts = x.split('-');
  if (parts.length >= 2) {
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = new Date(y, m - 1, 1);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
  }
  return x;
}

function daysInMonth(m?: string | null): number {
  if (!m) return 30;
  const parts = m.split('-').map(Number);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return new Date(parts[0], parts[1], 0).getDate();
  }
  return 30;
}

function maskAccount(a?: string | null): string {
  if (!a) return '—';
  return a.length > 4 ? '•••• ' + a.slice(-4) : a;
}

function amountWords(num: number): string {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Zero Rupees Only';
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function two(x: number) {
    if (x < 20) return ones[x];
    return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
  }

  function three(x: number) {
    return x >= 100 ? ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + two(x % 100) : '') : two(x);
  }

  let crore = Math.floor(num / 1e7);
  num %= 1e7;
  let lakh = Math.floor(num / 1e5);
  num %= 1e5;
  let thousand = Math.floor(num / 1e3);
  num %= 1e3;

  let out = '';
  if (crore) out += three(crore) + ' Crore ';
  if (lakh) out += three(lakh) + ' Lakh ';
  if (thousand) out += three(thousand) + ' Thousand ';
  if (num) out += three(num);
  return out.trim() + ' Rupees Only';
}

export default function PayrollPage() {
  const currentYm = getCurrentYearMonth();
  const [activeTab, setActiveTab] = useState<'generator' | 'ledger'>('generator');

  // Master Data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Dynamic Company Settings State (No hardcoding)
  const [companySettings, setCompanySettings] = useState<DynamicCompanySettings>({
    companyName: '',
    tagline: '',
    address: '',
    email: '',
    website: '',
    gstin: '',
    llpin: '',
    logoUrl: '',
    stampUrl: '',
    signatureUrl: '',
    signatoryName: '',
    signatoryTitle: '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    bankBranch: '',
  });

  // Generator Form state matching reference HTML
  const [form, setForm] = useState<SalarySlipFormState>(() => createInitialFormState());

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const quickStampRef = useRef<HTMLInputElement>(null);
  const quickSigRef = useRef<HTMLInputElement>(null);

  const sanitizeSig = (v?: string | null) => (!v || v === '/branding/tenant-signature.png' ? '' : v);
  const sanitizeStamp = (v?: string | null) => (!v || v === '/branding/tenant-stamp.png' ? '' : v);
  const sanitizeLogo = (v?: string | null) => (!v || v === '/branding/tenant-logo.png' ? '' : v);

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'stamp' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      toast.loading(`Uploading ${field}...`);
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', 'logo');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: fd
      });
      const data = await res.json();
      if (res.ok && (data.url || data.data?.url)) {
        const fileUrl = data.data?.url || data.url;
        toast.dismiss();
        toast.success(`${field === 'stamp' ? 'Stamp' : 'Signature'} uploaded successfully!`);
        if (field === 'stamp') {
          setCompanySettings(prev => ({ ...prev, stampUrl: fileUrl }));
          if (typeof window !== 'undefined') localStorage.setItem('tenant_stamp_url', fileUrl);
          window.dispatchEvent(new CustomEvent('branding-updated', { detail: { stampUrl: fileUrl } }));
          fetch('/api/workspace-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ stampUrl: fileUrl })
          }).catch(() => {});
        } else {
          setCompanySettings(prev => ({ ...prev, signatureUrl: fileUrl }));
          if (typeof window !== 'undefined') localStorage.setItem('tenant_signature_url', fileUrl);
          window.dispatchEvent(new CustomEvent('branding-updated', { detail: { digitalSignatureUrl: fileUrl } }));
          fetch('/api/workspace-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ digitalSignatureUrl: fileUrl, digitalSignatureEnabled: true })
          }).catch(() => {});
        }
      } else {
        toast.dismiss();
        toast.error(data.message || 'Upload failed');
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Upload failed');
    }
  };
  const [historyList, setHistoryList] = useState<SlipRecord[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyMonthFilter, setHistoryMonthFilter] = useState('');

  // --- Payroll Ledger Tab State ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [generatedPayrolls, setGeneratedPayrolls] = useState<Payroll[]>([]);
  const [activePayrollJobId, setActivePayrollJobId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'bonus' | 'deduction'>('bonus');

  // Load Initial Settings & DB Data
  useEffect(() => {
    loadMasterData();
    fetchCompanySettings();
    loadHistory();

    const handleBrandingUpdate = (e: any) => {
      const detail = e.detail;
      if (!detail) {
        fetchCompanySettings();
        return;
      }
      setCompanySettings((prev) => ({
        ...prev,
        stampUrl: sanitizeStamp(detail.stampUrl) || prev.stampUrl,
        signatureUrl: sanitizeSig(detail.digitalSignatureUrl) || (detail.digitalSignatureUrl === '' ? '' : prev.signatureUrl),
        signatoryName: detail.signatoryName || prev.signatoryName,
        signatoryTitle: detail.signatoryTitle || prev.signatoryTitle,
        logoUrl: sanitizeLogo(detail.logoUrl) || prev.logoUrl,
        tagline: detail.tagline || prev.tagline,
      }));
      if (detail.signatoryName) setForm((f) => ({ ...f, signatoryName: detail.signatoryName }));
      if (detail.signatoryTitle) setForm((f) => ({ ...f, signatoryTitle: detail.signatoryTitle }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('branding-updated', handleBrandingUpdate);
      window.addEventListener('logo-updated', handleBrandingUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('branding-updated', handleBrandingUpdate);
        window.removeEventListener('logo-updated', handleBrandingUpdate);
      }
    };
  }, []);

  const loadMasterData = async () => {
    try {
      setLoadingInitial(true);
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const [empRes, usrRes] = await Promise.all([
        fetch('/api/employees?limit=200', { headers, credentials: 'include' }),
        fetch('/api/users?limit=200', { headers, credentials: 'include' }),
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        const list = Array.isArray(empData) ? empData : empData.data || [];
        setEmployees(list);
      }
      if (usrRes.ok) {
        const usrData = await usrRes.json();
        const list = Array.isArray(usrData) ? usrData : usrData.data || [];
        setUsers(list);
      }
    } catch (err) {
      console.error('Error loading master data:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const fetchCompanySettings = async () => {
    // 1. Instant hydration from client storage cache
    if (typeof window !== 'undefined') {
      const rawCachedSig = localStorage.getItem('tenant_signature_url');
      if (rawCachedSig === '/branding/tenant-signature.png') {
        localStorage.removeItem('tenant_signature_url');
      }
      const rawCachedStamp = localStorage.getItem('tenant_stamp_url');
      if (rawCachedStamp === '/branding/tenant-stamp.png') {
        localStorage.removeItem('tenant_stamp_url');
      }
      const rawCachedLogo = localStorage.getItem('tenant_logo_url');
      if (rawCachedLogo === '/branding/tenant-logo.png') {
        localStorage.removeItem('tenant_logo_url');
      }

      const cachedLogo = sanitizeLogo(localStorage.getItem('tenant_logo_url'));
      const cachedStamp = sanitizeStamp(localStorage.getItem('tenant_stamp_url'));
      const cachedSig = sanitizeSig(localStorage.getItem('tenant_signature_url'));
      const cachedSigName = localStorage.getItem('tenant_signatory_name');
      const cachedSigTitle = localStorage.getItem('tenant_signatory_title');
      const cachedTagline = localStorage.getItem('tenant_tagline');

      if (cachedLogo || cachedStamp || cachedSig || cachedSigName || cachedSigTitle || cachedTagline) {
        setCompanySettings((prev) => ({
          ...prev,
          logoUrl: cachedLogo || prev.logoUrl,
          stampUrl: cachedStamp || prev.stampUrl,
          signatureUrl: cachedSig || prev.signatureUrl,
          signatoryName: cachedSigName || prev.signatoryName,
          signatoryTitle: cachedSigTitle || prev.signatoryTitle,
          tagline: cachedTagline || prev.tagline,
        }));
        if (cachedSigName) setForm((f) => ({ ...f, signatoryName: cachedSigName }));
        if (cachedSigTitle) setForm((f) => ({ ...f, signatoryTitle: cachedSigTitle }));
      }
    }

    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      // 2. Fetch company-settings
      const res = await fetch('/api/company-settings', { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const s = data.data || data;
        if (s) {
          setCompanySettings((prev) => ({
            companyName: s.companyName || s.legalName || s.tenant?.name || prev.companyName,
            tagline: s.tagline || prev.tagline,
            address: s.address || prev.address,
            email: s.email || prev.email,
            website: s.website || prev.website,
            gstin: s.gstin || prev.gstin,
            llpin: s.cinNumber || s.msmeNumber || prev.llpin,
            logoUrl: sanitizeLogo(s.logoUrl) || prev.logoUrl,
            stampUrl: sanitizeStamp(s.stampUrl) || prev.stampUrl,
            signatureUrl: sanitizeSig(s.digitalSignatureUrl) || prev.signatureUrl,
            signatoryName: s.signatoryName || prev.signatoryName,
            signatoryTitle: s.signatoryTitle || prev.signatoryTitle,
            bankName: s.bankDetails?.name || s.bankName || prev.bankName,
            bankAccount: s.bankDetails?.accountNo || s.bankAccount || prev.bankAccount,
            bankIfsc: s.bankDetails?.ifsc || s.bankIfsc || prev.bankIfsc,
            bankBranch: s.bankDetails?.branch || prev.bankBranch,
          }));
          if (s.signatoryName) setForm((f) => ({ ...f, signatoryName: s.signatoryName }));
          if (s.signatoryTitle) setForm((f) => ({ ...f, signatoryTitle: s.signatoryTitle }));
        }
      }

      // 3. Fetch workspace-settings for extended custom settings
      const wsRes = await fetch('/api/workspace-settings', { headers, credentials: 'include' });
      if (wsRes.ok) {
        const wsJson = await wsRes.json();
        const wsData = wsJson.data || wsJson;
        if (wsData) {
          setCompanySettings((prev) => ({
            ...prev,
            logoUrl: sanitizeLogo(wsData.logoUrl) || prev.logoUrl,
            stampUrl: sanitizeStamp(wsData.stampUrl) || prev.stampUrl,
            signatureUrl: sanitizeSig(wsData.digitalSignatureUrl) || prev.signatureUrl,
            signatoryName: wsData.signatoryName || prev.signatoryName,
            signatoryTitle: wsData.signatoryTitle || prev.signatoryTitle,
            tagline: wsData.tagline || prev.tagline,
            bankName: wsData.bankDetails?.name || prev.bankName,
            bankAccount: wsData.bankDetails?.accountNo || prev.bankAccount,
            bankIfsc: wsData.bankDetails?.ifsc || prev.bankIfsc,
            bankBranch: wsData.bankDetails?.branch || prev.bankBranch,
          }));
          if (wsData.signatoryName) setForm((f) => ({ ...f, signatoryName: wsData.signatoryName }));
          if (wsData.signatoryTitle) setForm((f) => ({ ...f, signatoryTitle: wsData.signatoryTitle }));
        }
      }
    } catch (err) {
      console.error('Error fetching company settings:', err);
    }
  };

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('TS_SALARY_SLIPS_HIST');
      if (saved) {
        setHistoryList(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveHistoryToStorage = (newList: SlipRecord[]) => {
    try {
      setHistoryList(newList);
      localStorage.setItem('TS_SALARY_SLIPS_HIST', JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  // --- Auto-fill from DB Handler ---
  const handleAutoFillFromEmployee = async (empIdStr: string) => {
    const empId = Number(empIdStr);
    const emp = employees.find((e) => e.id === empId || e.employeeId === empIdStr);
    if (!emp) return;

    const user = users.find((u) => u.id === emp.userId);
    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : emp.employeeId;
    const email = emp.officeEmail || user?.email || '';
    const phone = emp.phone || user?.phone || '';

    // Calculate month days & public holidays for current form.salaryMonth
    const month = form.salaryMonth || currentYm || getCurrentYearMonth();
    const calDays = daysInMonth(month);
    const [y, m] = month.split('-').map(Number);

    // Count weekend days in this month
    let offs = 0;
    for (let day = 1; day <= calDays; day++) {
      const d = new Date(y, m - 1, day);
      if (d.getDay() === 0 || d.getDay() === 6) offs++; // Sun or Sat
    }

    // Try fetching real attendance and leave data from DB
    toast.loading('Fetching attendance and statutory records for ' + fullName + '...');
    let fetchedPresent = calDays - offs;
    let fetchedAbsent = 0;
    let fetchedPaidLeave = 0;
    let fetchedUnpaidLeave = 0;
    let fetchedHalfDays = 0;
    let holidayCount = 0;
    let holText = '';
    let leaveText = '';

    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const startDate = `${month}-01`;
      const endDate = `${month}-${String(calDays).padStart(2, '0')}`;

      const [attRes, holRes, leaveRes] = await Promise.all([
        fetch(`/api/attendance?startDate=${startDate}&endDate=${endDate}&employeeId=${emp.id}`, { headers }),
        fetch(`/api/company-holidays?startDate=${startDate}&endDate=${endDate}&limit=50`, { headers }),
        fetch(`/api/leave-requests?startDate=${startDate}&endDate=${endDate}&status=approved&limit=100`, { headers }),
      ]);

      if (holRes.ok) {
        const holData = await holRes.json();
        const holList = holData.data || holData || [];
        holidayCount = Array.isArray(holList) ? holList.length : 0;
        holText = Array.isArray(holList)
          ? holList.map((h: any) => `${fmtDate(h.date)} — ${h.name || h.title || 'Holiday'}`).join('\n')
          : '';
      }

      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        const leaves = Array.isArray(leaveData.data || leaveData) ? leaveData.data || leaveData : [];
        const empLeaves = leaves.filter((l: any) => l.employeeId === emp.id);
        empLeaves.forEach((l: any) => {
          const isUnpaid = String(l.leaveType).toLowerCase().includes('unpaid') || String(l.leaveType) === 'LWP';
          const dur = Number(l.duration || l.days || 1);
          if (isUnpaid) fetchedUnpaidLeave += dur;
          else fetchedPaidLeave += dur;
        });
        if (empLeaves.length > 0) {
          leaveText = empLeaves.map((l: any) => `${l.leaveType || 'Leave'} — ${l.duration || 1} day(s)`).join('\n');
        }
      }

      if (attRes.ok) {
        const attData = await attRes.json();
        const records = Array.isArray(attData) ? attData : attData.data || [];
        if (records.length > 0) {
          let p = 0;
          let a = 0;
          let h = 0;
          records.forEach((r: any) => {
            const st = String(r.status).toLowerCase();
            if (st === 'present') p++;
            else if (st === 'half_day' || st === 'halfday') h++;
            else if (st === 'absent') a++;
          });
          fetchedPresent = p;
          fetchedHalfDays = h;
          fetchedAbsent = a;
        }
      }
    } catch (e) {
      console.warn('Attendance auto-fetch fallback:', e);
    }

    const calculatedWorking = Math.max(0, calDays - offs - holidayCount);
    const gross = Number(emp.salary) || 15000;
    const ptAmt = gross > 12000 ? 200 : 0; // Standard PT slab

    setForm((prev) => ({
      ...prev,
      selectedEmpId: String(emp.id),
      employeeCode: emp.employeeId || prev.employeeCode,
      employeeName: fullName || prev.employeeName,
      designation: emp.designation || prev.designation,
      department: emp.department || prev.department,
      employmentType: emp.employmentType ? emp.employmentType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : prev.employmentType,
      joiningDate: emp.dateOfJoining ? emp.dateOfJoining.slice(0, 10) : prev.joiningDate,
      workLocation: emp.workLocation || prev.workLocation,
      email: email || prev.email,
      phone: phone || prev.phone,
      pan: emp.panNumber || prev.pan,
      uan: emp.uanNumber || prev.uan,
      pfNo: emp.pfNumber || prev.pfNo,
      esiNo: emp.esiNumber || prev.esiNo,
      bankName: emp.bankName || companySettings.bankName || prev.bankName,
      bankAccount: emp.accountNumber || prev.bankAccount,
      ifsc: emp.ifscCode || companySettings.bankIfsc || prev.ifsc,
      bankBranch: emp.branchName || prev.bankBranch,
      monthlySalary: gross,
      calendarDays: calDays,
      weeklyOffs: offs,
      publicHolidays: holidayCount,
      workingDays: calculatedWorking,
      presentDays: fetchedPresent,
      absentDays: fetchedAbsent,
      paidLeave: fetchedPaidLeave,
      unpaidLeave: fetchedUnpaidLeave,
      halfDays: fetchedHalfDays,
      pt: ptAmt,
      holidayList: holText || prev.holidayList,
      leaveDetails: leaveText || (fetchedPaidLeave > 0 ? `Paid Leaves — ${fetchedPaidLeave} Day(s)` : 'None'),
      slipNo: `TS-SAL-${month.replace('-', '')}-${(emp.employeeId || '00001').replace(/[^0-9]/g, '').padStart(5, '0')}`,
    }));

    toast.dismiss();
    toast.success(`Loaded profile and monthly attendance for ${fullName}`);
  };

  // --- Calculations (matching reference HTML) ---
  const calc = useMemo(() => {
    const gross = Number(form.monthlySalary) || 0;
    const basicPct = (Number(form.basicPct) || 0) / 100;
    const hraPct = (Number(form.hraPct) || 0) / 100;
    const daPct = (Number(form.daPct) || 0) / 100;

    const basic = gross * basicPct;
    const da = gross * daPct;
    const hra = basic * hraPct;
    const special = Math.max(0, gross - basic - da - hra);

    const pfOn = form.pfApplicable === 'yes';
    let pfBase = form.pfBase === 'custom' ? Number(form.customPfWage) || 0 : form.pfBase === 'statutory' ? 0 : basic + da;
    const employeePfPct = (Number(form.employeePfPct) || 0) / 100;
    const employerPfPct = (Number(form.employerPfPct) || 0) / 100;

    let statutoryBase = 0;
    let employerPf = 0;
    let employerEsi = 0;
    let gratuity = 0;

    if (pfOn) {
      statutoryBase = form.pfBase === 'statutory' ? basic + da : pfBase;
      if (Number(form.pfCap) > 0) statutoryBase = Math.min(statutoryBase, Number(form.pfCap));
      employerPf = statutoryBase * employerPfPct;
    }

    if (form.gratuityApplicable === 'yes') {
      gratuity = basic * ((Number(form.gratuityPct) || 0) / 100);
    }
    if (form.employerEsi === 'yes') {
      employerEsi = gross * ((Number(form.employerEsiPct) || 0) / 100);
    }

    const remuneration = gross + employerPf;
    const threshold = remuneration * 0.5;
    const wageComponents = basic + da;
    const allowancePool = Math.max(0, gross - wageComponents);
    const excess = Math.max(0, allowancePool - threshold);
    const adjustedWage = Math.max(wageComponents, threshold);

    let employeePf = 0;
    if (form.pfBase === 'statutory') {
      statutoryBase = adjustedWage;
      if (Number(form.pfCap) > 0) statutoryBase = Math.min(statutoryBase, Number(form.pfCap));
      employeePf = pfOn ? statutoryBase * employeePfPct : 0;
      employerPf = pfOn ? statutoryBase * employerPfPct : 0;
    } else {
      employeePf = pfOn ? Math.min(pfBase, Number(form.pfCap) > 0 ? Number(form.pfCap) : Infinity) * employeePfPct : 0;
    }

    const c = Number(form.calendarDays) || 0;
    const off = Number(form.weeklyOffs) || 0;
    const hol = Number(form.publicHolidays) || 0;
    const working = Math.max(0, Number(form.workingDays) || Math.max(0, c - off - hol));
    const present = Number(form.presentDays) || 0;
    const absent = Number(form.absentDays) || 0;
    const paidLeave = Number(form.paidLeave) || 0;
    const unpaidLeave = Number(form.unpaidLeave) || 0;
    const half = Number(form.halfDays) || 0;

    const lop = Math.max(0, absent + unpaidLeave + half * 0.5);
    const divisor = form.lopBasis === 'calendar' ? Math.max(1, c) : Math.max(1, working);
    const lopAdj = (gross / divisor) * lop;
    const grossPayable = Math.max(0, gross - lopAdj);

    const pt = Number(form.pt) || 0;
    const tds = Number(form.tds) || 0;
    const loan = Number(form.loan) || 0;
    const other = Number(form.otherDed) || 0;
    const totalDed = employeePf + pt + tds + loan + other;
    const net = Math.max(0, grossPayable - totalDed);
    const employerCost = gross + employerPf + gratuity + employerEsi;
    const ctc = employerCost * 12;

    return {
      gross,
      basic,
      da,
      hra,
      special,
      employeePf,
      employerPf,
      gratuity,
      employerEsi,
      remuneration,
      threshold,
      wageComponents,
      excess,
      adjustedWage,
      working,
      present,
      absent,
      paidLeave,
      unpaidLeave,
      lop,
      lopAdj,
      grossPayable,
      pt,
      tds,
      loan,
      other,
      totalDed,
      net,
      employerCost,
      ctc,
      calendar: c,
      off,
      hol,
      half,
      basis: form.lopBasis,
    };
  }, [form]);

  // Handle Form Change
  const updateForm = (key: string, val: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'salaryMonth') {
        const cal = daysInMonth(val);
        next.calendarDays = cal;
        next.workingDays = Math.max(0, cal - next.weeklyOffs - next.publicHolidays);
      }
      return next;
    });
  };

  // Generate & Save Slip Record to History
  const handleSaveSlip = (silent = false) => {
    if (!form.employeeName || !form.employeeCode) {
      toast.error('Employee Code and Name are required');
      return false;
    }

    const rec: SlipRecord = {
      ...form,
      id: `slip-${Date.now()}`,
      annualCTC: calc.ctc,
      calculation: calc,
      updatedAt: new Date().toISOString(),
    };

    const next = [rec, ...historyList.filter((x) => x.slipNo !== rec.slipNo)].slice(0, 100);
    saveHistoryToStorage(next);
    if (!silent) toast.success(`Saved slip ${rec.slipNo} for ${rec.employeeName}`);
    return true;
  };

  // Print / Save as PDF
  const handlePrintSlip = () => {
    handleSaveSlip(true);
    window.print();
  };

  // Helper to safely extract live rendered base64 from on-screen DOM elements
  const getRenderedImageDataUri = (selector: string): string => {
    try {
      const img = document.querySelector(selector) as HTMLImageElement | null;
      if (!img) return '';
      if (img.src && img.src.startsWith('data:image/')) return img.src;
      if (!img.complete || img.naturalWidth === 0) return '';
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  };

  // In-memory base64 converter to guarantee canvas is never tainted
  const toDataUri = async (url: string): Promise<string> => {
    if (!url || url.startsWith('data:')) return url;
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      if (url.includes('/api/upload')) {
        try {
          const jsonRes = await fetch(url, { credentials: 'include', headers });
          if (jsonRes.ok) {
            const body = await jsonRes.json();
            const resolvedUrl = body?.data?.url || body?.data?.secureUrl || body?.secureUrl;
            if (resolvedUrl) url = resolvedUrl;
          }
        } catch {}
      }

      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return url;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      });
    } catch {
      return url;
    }
  };

  // Helper to generate pixel-perfect PDF snapshot directly from #printArea
  const generateSlipPdfSnapshot = async (): Promise<string | undefined> => {
    try {
      const printEl = document.getElementById('printArea');
      if (!printEl) return undefined;

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // 1. Create a clone in an off-screen container to pre-process images safely
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.zIndex = '-9999';
      container.style.opacity = '1';
      container.style.pointerEvents = 'none';
      container.style.width = '794px';
      container.style.background = '#ffffff';

      const clone = printEl.cloneNode(true) as HTMLElement;
      clone.style.width = '210mm';
      clone.style.minHeight = '297mm';
      clone.style.background = '#ffffff';
      container.appendChild(clone);
      document.body.appendChild(container);

      try {
        // Strip out screen-only buttons (like "Change", "Upload here")
        clone.querySelectorAll('.screen-only').forEach((el) => el.remove());

        // 2. Pre-inject live on-screen canvas base64 images to bypass network/CORS entirely
        const liveLogo = getRenderedImageDataUri('#printArea .brand img');
        const liveStamp = getRenderedImageDataUri('#printArea .seal img');
        const liveSig = getRenderedImageDataUri('#printArea .signature img');

        const brandImg = clone.querySelector('.brand img') as HTMLImageElement | null;
        if (brandImg && liveLogo) brandImg.src = liveLogo;
        const sealImg = clone.querySelector('.seal img') as HTMLImageElement | null;
        if (sealImg && liveStamp) sealImg.src = liveStamp;
        const sigImg = clone.querySelector('.signature img') as HTMLImageElement | null;
        if (sigImg && liveSig) sigImg.src = liveSig;

        // Pre-convert any remaining images in the clone to local base64 data URIs
        const imgs = Array.from(clone.querySelectorAll('img'));
        await Promise.all(
          imgs.map(async (img) => {
            const rawSrc = img.getAttribute('src');
            if (rawSrc && !rawSrc.startsWith('data:')) {
              const dataUri = await toDataUri(rawSrc);
              if (dataUri && dataUri.startsWith('data:')) {
                img.src = dataUri;
              }
            }
          })
        );

        // Wait for all images in the clone to fully decode
        await Promise.all(
          Array.from(clone.querySelectorAll('img')).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
            });
          })
        );

        // 3. Render clone to canvas with clean same-origin data
        const canvas = await html2canvas(clone, {
          scale: 2, // 2x crisp DPI for ultra-clear print typography & images
          useCORS: true,
          allowTaint: false, // Disallow tainting so toDataURL never throws SecurityError
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1200,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(pageHeight, imgHeight));
        return pdf.output('datauristring');
      } finally {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    } catch (err) {
      console.error('Could not generate client-side PDF snapshot from #printArea:', err);
      return undefined;
    }
  };

  // Send Email of Payslip to Employee (attaching exact rendered #printArea PDF)
  const handleEmailPayslip = async () => {
    if (!form.email || !form.email.includes('@')) {
      toast.error('Valid employee email address is required to dispatch payslip');
      return;
    }

    try {
      setIsSendingEmail(true);
      toast.loading(`Capturing exact salary slip PDF & sending to ${form.email}...`);

      // 0. Extract live rendered base64 from on-screen DOM elements
      const liveLogo = getRenderedImageDataUri('#printArea .brand img');
      const liveStamp = getRenderedImageDataUri('#printArea .seal img');
      const liveSig = getRenderedImageDataUri('#printArea .signature img');

      // 1. Capture exact A4 PDF from currently displayed preview (#printArea)
      const pdfBase64 = await generateSlipPdfSnapshot();

      const [logoDataUri, stampDataUri, sigDataUri] = await Promise.all([
        liveLogo ? Promise.resolve(liveLogo) : (companySettings.logoUrl ? toDataUri(companySettings.logoUrl) : Promise.resolve('')),
        liveStamp ? Promise.resolve(liveStamp) : (companySettings.stampUrl ? toDataUri(companySettings.stampUrl) : Promise.resolve('')),
        liveSig ? Promise.resolve(liveSig) : (companySettings.signatureUrl ? toDataUri(companySettings.signatureUrl) : Promise.resolve('')),
      ]);

      const token = getStoredSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/payroll/send-payslip', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          to: form.email,
          pdfBase64,
          employeeName: form.employeeName,
          employeeCode: form.employeeCode,
          designation: form.designation,
          department: form.department,
          employmentType: form.employmentType,
          joiningDate: form.joiningDate,
          pan: form.pan,
          uan: form.uan,
          salaryMonth: monthLabel(form.salaryMonth),
          slipNo: form.slipNo,
          payDate: form.payDate,
          taxRegime: form.taxRegime,
          calendarDays: calc.calendar,
          workingDays: calc.working,
          presentDays: calc.present,
          absentDays: calc.absent,
          paidLeave: calc.paidLeave,
          unpaidLeave: calc.unpaidLeave,
          paidDays: Math.max(0, calc.present + calc.paidLeave),
          basic: calc.basic,
          hra: calc.hra,
          da: calc.da,
          special: calc.special,
          gross: calc.gross,
          employeePf: calc.employeePf,
          employerPf: calc.employerPf,
          pt: calc.pt,
          tds: calc.tds,
          loan: calc.loan,
          otherDed: calc.other,
          totalDed: calc.totalDed,
          lopAdj: calc.lopAdj,
          grossPayable: calc.grossPayable,
          netPay: rupee(calc.net),
          netPayNum: calc.net,
          amountInWords: amountWords(calc.net),
          bankName: form.bankName,
          bankAccount: form.bankAccount,
          ifsc: form.ifsc,
          bankBranch: form.bankBranch,
          notes: form.notes,
          signatoryName: form.signatoryName || companySettings.signatoryName,
          signatoryTitle: form.signatoryTitle || companySettings.signatoryTitle,
          companyName: companySettings.companyName,
          companyAddress: companySettings.address,
          companyEmail: companySettings.email,
          companyWebsite: companySettings.website,
          companyGstin: companySettings.gstin,
          companyLlpin: companySettings.llpin,
          // Full calculation payload for server-side fallback
          annualCTC: calc.ctc,
          remuneration: calc.remuneration,
          threshold: calc.threshold,
          wageComponents: calc.wageComponents,
          excess: calc.excess,
          adjustedWage: calc.adjustedWage,
          employerCost: calc.employerCost,
          gratuity: calc.gratuity,
          employerEsi: calc.employerEsi,
          weeklyOffs: calc.off,
          publicHolidays: calc.hol,
          lopDays: calc.lop,
          basicPct: form.basicPct,
          daPct: form.daPct,
          hraPct: form.hraPct,
          logoUrl: logoDataUri || companySettings.logoUrl,
          stampUrl: stampDataUri || companySettings.stampUrl,
          signatureUrl: sigDataUri || companySettings.signatureUrl,
        }),
      });

      toast.dismiss();
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || `Salary slip dispatched successfully to ${form.email}!`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to dispatch email');
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message || 'Error sending payslip email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Load Slip from History
  const handleLoadFromHistory = (item: SlipRecord) => {
    const base = createInitialFormState();
    setForm({
      ...base,
      ...item,
      selectedEmpId: item.selectedEmpId || '',
      manager: item.manager || '',
      signatoryName: item.signatoryName || '',
      signatoryTitle: item.signatoryTitle || '',
    });
    toast.info(`Loaded slip ${item.slipNo} for ${item.employeeName}`);
  };

  // Save Signatory Globally
  const handleSaveSignatoryGlobal = async () => {
    try {
      toast.loading('Saving signatory designation globally...');
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        signatoryName: form.signatoryName,
        signatoryTitle: form.signatoryTitle,
      };

      const [res, wsRes] = await Promise.all([
        fetch('/api/company-settings', {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        }),
        fetch('/api/workspace-settings', {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        }),
      ]);

      toast.dismiss();
      if (res.ok || wsRes.ok) {
        setCompanySettings((prev) => ({
          ...prev,
          signatoryName: form.signatoryName,
          signatoryTitle: form.signatoryTitle,
        }));
        if (typeof window !== 'undefined') {
          if (form.signatoryName) localStorage.setItem('tenant_signatory_name', form.signatoryName);
          if (form.signatoryTitle) localStorage.setItem('tenant_signatory_title', form.signatoryTitle);
          window.dispatchEvent(new CustomEvent('branding-updated', { detail: payload }));
        }
        toast.success('Signatory designation saved globally for all salary slips and invoices!');
      } else {
        toast.error('Failed to update global company settings');
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message || 'Error updating settings');
    }
  };

  const handleResetForm = () => {
    setForm(createInitialFormState());
    toast.info('Form reset to default');
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    return historyList.filter((r) => {
      const matchSearch =
        !q ||
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        r.slipNo.toLowerCase().includes(q);
      const matchMonth = !historyMonthFilter || r.salaryMonth === historyMonthFilter;
      return matchSearch && matchMonth;
    });
  }, [historyList, historySearch, historyMonthFilter]);

  return (
    <div className="space-y-6">
      {/* Dynamic Print Stylesheet matching TechSonance_Professional_Salary_Slip_Generator.html */}
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --navy: #071A4D;
          --blue: #1257D6;
          --cyan: #38BDF8;
          --light: #F3F7FC;
          --line: #D9E4F2;
          --text: #172033;
          --muted: #667085;
          --green: #067647;
          --danger: #B42318;
          --amber: #B54708;
          --white: #fff;
        }
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            width: 210mm !important;
            min-height: 297mm !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printArea, #printArea * {
            visibility: visible !important;
          }
          #printArea {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 9mm 11mm 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          .screen-only {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          table {
            break-inside: auto !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .section-head, .info-card, .net-box {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* Top Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wallet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Payroll & Salary Slip Suite
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate compliant A4 payslips, auto-calculate attendance & statutory wages, and dispatch emails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'generator' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('generator')}
            className={activeTab === 'generator' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
          >
            <FileText className="mr-1.5 h-4 w-4" />
            Salary Slip Generator
          </Button>
          <Button
            variant={activeTab === 'ledger' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('ledger')}
            className={activeTab === 'ledger' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Payroll Ledger & Runs
          </Button>
        </div>
      </div>

      {/* TAB 1: SALARY SLIP GENERATOR & PREVIEW */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          {/* Top Banner with dynamic logo & title */}
          <div className="rounded-xl bg-gradient-to-r from-[#071A4D] to-[#1257D6] text-white p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md screen-only">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl shadow-sm h-14 w-14 flex items-center justify-center shrink-0">
                {companySettings.logoUrl ? (
                  <img
                    src={companySettings.logoUrl}
                    alt={companySettings.companyName || 'Logo'}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Building2 className="h-7 w-7 text-indigo-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold leading-tight">
                  {companySettings.companyName ? `${companySettings.companyName} — Salary Slip Generator` : 'Professional Salary Slip Generator'}
                </h2>
                <p className="text-xs text-blue-100 opacity-90 mt-0.5">
                  Dynamic statutory wage bifurcation • Live A4 PDF preview • Attendance sync • Email delivery
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium"
                onClick={handlePrintSlip}
              >
                <Printer className="mr-1.5 h-4 w-4 text-cyan-300" />
                Print / Save PDF
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                onClick={handleEmailPayslip}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />}
                Email Payslip
              </Button>
            </div>
          </div>

          {/* Generator Layout: 440px Form Controls (Left) + A4 Live Preview (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-[450px_minmax(0,1fr)] gap-6 items-start">
            
            {/* LEFT PANEL: SALARY SLIP DETAILS */}
            <div className="space-y-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm screen-only">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
                <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-indigo-500" />
                  Salary Slip Details & Master
                </h3>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Live Sync
                </span>
              </div>

              {/* Employee Lookup Dropdown */}
              <div className="space-y-1.5 bg-indigo-50/70 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                <Label className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                  <span>⚡ Quick Select & Auto-Fill from DB</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                    {employees.length} employees available
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={form.selectedEmpId}
                    onValueChange={(val) => {
                      updateForm('selectedEmpId', val);
                      handleAutoFillFromEmployee(val);
                    }}
                  >
                    <SelectTrigger className="bg-white dark:bg-zinc-800 text-xs h-9">
                      <SelectValue placeholder="Select employee to auto-fill..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => {
                        const u = users.find((usr) => usr.id === emp.userId);
                        const label = u ? `${u.firstName} ${u.lastName} (${emp.employeeId})` : emp.employeeId;
                        return (
                          <SelectItem key={emp.id} value={String(emp.id)} className="text-xs">
                            {label} {emp.designation ? `— ${emp.designation}` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-2.5 text-xs bg-white dark:bg-zinc-800 border-indigo-200"
                    title="Reload Master & Attendance"
                    onClick={() => {
                      if (form.selectedEmpId) handleAutoFillFromEmployee(form.selectedEmpId);
                      else toast.info('Select an employee first');
                    }}
                  >
                    <Zap className="h-3.5 w-3.5 text-indigo-600" />
                  </Button>
                </div>
              </div>

              {/* SECTION: Employee Master */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b pb-1">
                  Employee Identity & Work Profile
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[11px] font-semibold">Employee Code *</Label>
                    <Input
                      value={form.employeeCode}
                      onChange={(e) => updateForm('employeeCode', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Employee Name *</Label>
                    <Input
                      value={form.employeeName}
                      onChange={(e) => updateForm('employeeName', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Designation *</Label>
                    <Input
                      value={form.designation}
                      onChange={(e) => updateForm('designation', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Department</Label>
                    <Input
                      value={form.department}
                      onChange={(e) => updateForm('department', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Employment Type</Label>
                    <Input
                      value={form.employmentType}
                      onChange={(e) => updateForm('employmentType', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Joining Date</Label>
                    <Input
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => updateForm('joiningDate', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">PAN</Label>
                    <Input
                      value={form.pan}
                      onChange={(e) => updateForm('pan', e.target.value)}
                      className="h-8 text-xs mt-1 uppercase"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">UAN</Label>
                    <Input
                      value={form.uan}
                      onChange={(e) => updateForm('uan', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">PF Account No.</Label>
                    <Input
                      value={form.pfNo}
                      onChange={(e) => updateForm('pfNo', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">ESI No.</Label>
                    <Input
                      value={form.esiNo}
                      onChange={(e) => updateForm('esiNo', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[11px] font-semibold">Official Email (for payslip dispatch)</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: Payroll Period */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b pb-1">
                  Payroll Period & Slip Meta
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[11px] font-semibold">Salary Month *</Label>
                    <Input
                      type="month"
                      value={form.salaryMonth}
                      onChange={(e) => updateForm('salaryMonth', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Pay Date</Label>
                    <Input
                      type="date"
                      value={form.payDate}
                      onChange={(e) => updateForm('payDate', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Salary Slip No.</Label>
                    <Input
                      value={form.slipNo}
                      onChange={(e) => updateForm('slipNo', e.target.value)}
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Tax Regime</Label>
                    <Select
                      value={form.taxRegime}
                      onValueChange={(val) => updateForm('taxRegime', val)}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new" className="text-xs">New Tax Regime</SelectItem>
                        <SelectItem value="old" className="text-xs">Old Tax Regime</SelectItem>
                        <SelectItem value="na" className="text-xs">Not Specified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* SECTION: Attendance & Leave */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b pb-1 flex items-center justify-between">
                  <span>Attendance & Leave Summary</span>
                  <span className="text-[10px] lowercase font-normal text-slate-400">editable</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] font-semibold">Calendar Days</Label>
                    <Input
                      type="number"
                      value={form.calendarDays}
                      onChange={(e) => updateForm('calendarDays', Number(e.target.value))}
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold">Weekly Offs</Label>
                    <Input
                      type="number"
                      value={form.weeklyOffs}
                      onChange={(e) => updateForm('weeklyOffs', Number(e.target.value))}
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold">Public Holidays</Label>
                    <Input
                      type="number"
                      value={form.publicHolidays}
                      onChange={(e) => updateForm('publicHolidays', Number(e.target.value))}
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold">Working Days</Label>
                    <Input
                      type="number"
                      value={form.workingDays}
                      onChange={(e) => updateForm('workingDays', Number(e.target.value))}
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold">Present Days</Label>
                    <Input
                      type="number"
                      value={form.presentDays}
                      onChange={(e) => updateForm('presentDays', Number(e.target.value))}
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold">Absent Days</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={form.absentDays}
                      onChange={(e) => updateForm('absentDays', Number(e.target.value))}
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold">Paid Leave</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={form.paidLeave}
                      onChange={(e) => updateForm('paidLeave', Number(e.target.value))}
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold">Unpaid / LOP</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={form.unpaidLeave}
                      onChange={(e) => updateForm('unpaidLeave', Number(e.target.value))}
                      className="h-7 text-xs mt-0.5 text-rose-600 font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold">Half Days</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={form.halfDays}
                      onChange={(e) => updateForm('halfDays', Number(e.target.value))}
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs pt-1">
                  <span className="font-semibold text-slate-600 dark:text-zinc-400 text-[11px]">LOP Basis:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="lopBasis"
                      checked={form.lopBasis === 'working'}
                      onChange={() => updateForm('lopBasis', 'working')}
                    />
                    <span className="text-xs">Working Days</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="lopBasis"
                      checked={form.lopBasis === 'calendar'}
                      onChange={() => updateForm('lopBasis', 'calendar')}
                    />
                    <span className="text-xs">Calendar Days</span>
                  </label>
                </div>
              </div>

              {/* SECTION: Salary & Bifurcation */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b pb-1">
                  Monthly Gross & Wage Bifurcation
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <Label className="text-[11px] font-semibold">Monthly Gross Salary (₹) *</Label>
                    <Input
                      type="number"
                      value={form.monthlySalary}
                      onChange={(e) => updateForm('monthlySalary', Number(e.target.value))}
                      className="h-9 text-sm font-bold text-indigo-600 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Structure Mode</Label>
                    <Select
                      value={form.structureMode}
                      onValueChange={(val: any) => updateForm('structureMode', val)}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto" className="text-xs">Auto 50% Rule</SelectItem>
                        <SelectItem value="manual" className="text-xs">Manual Override</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Basic % of Gross</Label>
                    <Input
                      type="number"
                      value={form.basicPct}
                      onChange={(e) => updateForm('basicPct', Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">HRA % of Basic</Label>
                    <Input
                      type="number"
                      value={form.hraPct}
                      onChange={(e) => updateForm('hraPct', Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">DA % of Gross</Label>
                    <Input
                      type="number"
                      value={form.daPct}
                      onChange={(e) => updateForm('daPct', Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: Statutory & Deductions */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b pb-1">
                  Statutory Components & Deductions
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[11px] font-semibold">PF Applicable</Label>
                    <Select
                      value={form.pfApplicable}
                      onValueChange={(val: any) => updateForm('pfApplicable', val)}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes" className="text-xs">Yes (12%)</SelectItem>
                        <SelectItem value="no" className="text-xs">No (Exempt)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Professional Tax (PT)</Label>
                    <Input
                      type="number"
                      value={form.pt}
                      onChange={(e) => updateForm('pt', Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">TDS / Income Tax</Label>
                    <Input
                      type="number"
                      value={form.tds}
                      onChange={(e) => updateForm('tds', Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Salary Advance / Loan</Label>
                    <Input
                      type="number"
                      value={form.loan}
                      onChange={(e) => updateForm('loan', Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: Bank & Notes */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b pb-1">
                  Employee Bank & Disbursal Details
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[11px] font-semibold">Bank Name</Label>
                    <Input
                      value={form.bankName}
                      onChange={(e) => updateForm('bankName', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Account Number</Label>
                    <Input
                      value={form.bankAccount}
                      onChange={(e) => updateForm('bankAccount', e.target.value)}
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">IFSC Code</Label>
                    <Input
                      value={form.ifsc}
                      onChange={(e) => updateForm('ifsc', e.target.value)}
                      className="h-8 text-xs mt-1 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Branch Name</Label>
                    <Input
                      value={form.bankBranch}
                      onChange={(e) => updateForm('bankBranch', e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[11px] font-semibold">Payroll Notes</Label>
                    <Textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => updateForm('notes', e.target.value)}
                      className="text-xs mt-1 resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: Signatory & Stamp Branding */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b pb-1 flex items-center justify-between">
                  <span>Signatory & Stamp Authorization</span>
                  <a
                    href="/dashboard/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] lowercase text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-normal"
                    title="Upload or change official company stamp and signature"
                  >
                    ⚙️ Upload Stamp & Signature
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[11px] font-semibold">Signatory Full Name</Label>
                    <Input
                      value={form.signatoryName}
                      onChange={(e) => updateForm('signatoryName', e.target.value)}
                      className="h-8 text-xs mt-1"
                      placeholder="e.g. Authorized Signatory Name"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Signatory Designation / Title</Label>
                    <Input
                      value={form.signatoryTitle}
                      onChange={(e) => updateForm('signatoryTitle', e.target.value)}
                      className="h-8 text-xs mt-1"
                      placeholder="e.g. Director / Authorized Signatory"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between pt-1">
                    <p className="text-[10px] text-slate-400">
                      Editable for this slip, or save once as default for all slips & invoices.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleSaveSignatoryGlobal}
                      className="text-[10px] h-6 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200"
                    >
                      Save as Global Default
                    </Button>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleSaveSlip(false)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-9"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Save / Update Slip
                  </Button>
                  <Button
                    onClick={handlePrintSlip}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9"
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                    Print / PDF
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResetForm}
                    className="text-xs h-8 text-slate-600 border-slate-200"
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleEmailPayslip}
                    disabled={isSendingEmail}
                    className="text-xs h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  >
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    Email to Employee
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: LIVE A4 PREVIEW CONTAINER (#printArea) */}
            <div className="preview-wrap overflow-auto pb-8">
              <div
                id="printArea"
                className="preview w-[210mm] min-h-[297mm] bg-white text-[#172033] mx-auto p-[9mm_11mm_10mm] relative shadow-lg rounded-sm border border-slate-200 dark:border-none font-sans text-[7.5px]"
                style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}
              >
                {/* Header */}
                <div className="slip-head flex items-start justify-between gap-3 pb-3 mb-1 border-b-2 border-[#071A4D]">
                  {/* Brand (Dynamic) */}
                  <div className="brand flex items-start gap-2.5 max-w-[42%] min-w-0">
                    {companySettings.logoUrl ? (
                      <img
                        src={companySettings.logoUrl}
                        alt={companySettings.companyName || 'Logo'}
                        className="w-12 h-12 object-contain shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h1 className="text-[13px] font-bold text-[#071A4D] leading-tight m-0 break-words">
                        {companySettings.companyName || 'Company Name'}
                      </h1>
                      <div className="text-[7.2px] text-[#475467] leading-[1.35] m-0 mt-0.5 break-words">
                        {companySettings.address ? (
                          <div>{companySettings.address}</div>
                        ) : (
                          <div className="italic text-slate-400">Address not configured</div>
                        )}
                        {(companySettings.email || companySettings.website) && (
                          <div className="truncate">
                            {[companySettings.email && `Email: ${companySettings.email}`, companySettings.website].filter(Boolean).join(' • ')}
                          </div>
                        )}
                        {(companySettings.gstin || companySettings.llpin) && (
                          <div className="truncate font-medium">
                            {[companySettings.gstin && `GSTIN: ${companySettings.gstin}`, companySettings.llpin && `LLPIN/CIN: ${companySettings.llpin}`].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="title text-center flex flex-col justify-center min-w-[26%] shrink-0">
                    <h2 className="text-[17px] font-black tracking-wider text-[#071A4D] m-0">
                      SALARY SLIP
                    </h2>
                    <div className="text-[8px] text-[#667085] font-semibold mt-0.5">
                      Salary Month: {monthLabel(form.salaryMonth)}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="meta text-right text-[8px] leading-[1.55] flex flex-col justify-center min-w-[28%] shrink-0">
                    <div>
                      <b className="text-[#071A4D]">Slip No:</b> <span>{form.slipNo || '—'}</span>
                    </div>
                    <div>
                      <b className="text-[#071A4D]">Pay Date:</b> <span>{fmtDate(form.payDate)}</span>
                    </div>
                    <div>
                      <b className="text-[#071A4D]">Tax Regime:</b>{' '}
                      <span>{form.taxRegime === 'new' ? 'New Tax Regime' : form.taxRegime === 'old' ? 'Old Tax Regime' : 'Not Specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Employee Information */}
                <div className="section-head bg-[#eef4ff] text-[#071A4D] text-[8px] font-black uppercase tracking-[0.55px] p-[5px_7px] border-l-[3px] border-[#1257D6] mt-2">
                  Employee Information
                </div>
                <div className="info-grid grid grid-cols-4 gap-1.5 mt-1.5">
                  <div className="info-card border border-[#D9E4F2] rounded p-[5px_6px] min-h-[36px]">
                    <div className="text-[6.5px] uppercase tracking-[0.45px] text-[#667085] font-bold">Employee Name</div>
                    <div className="text-[8.5px] font-extrabold text-[#172033] mt-0.5 break-words">{form.employeeName || '—'}</div>
                  </div>
                  <div className="info-card border border-[#D9E4F2] rounded p-[5px_6px] min-h-[36px]">
                    <div className="text-[6.5px] uppercase tracking-[0.45px] text-[#667085] font-bold">Employee Code</div>
                    <div className="text-[8.5px] font-extrabold text-[#172033] mt-0.5 break-words">{form.employeeCode || '—'}</div>
                  </div>
                  <div className="info-card border border-[#D9E4F2] rounded p-[5px_6px] min-h-[36px]">
                    <div className="text-[6.5px] uppercase tracking-[0.45px] text-[#667085] font-bold">Designation</div>
                    <div className="text-[8.5px] font-extrabold text-[#172033] mt-0.5 break-words">{form.designation || '—'}</div>
                  </div>
                  <div className="info-card border border-[#D9E4F2] rounded p-[5px_6px] min-h-[36px]">
                    <div className="text-[6.5px] uppercase tracking-[0.45px] text-[#667085] font-bold">Department</div>
                    <div className="text-[8.5px] font-extrabold text-[#172033] mt-0.5 break-words">{form.department || '—'}</div>
                  </div>
                  <div className="info-card border border-[#D9E4F2] rounded p-[5px_6px] min-h-[36px]">
                    <div className="text-[6.5px] uppercase tracking-[0.45px] text-[#667085] font-bold">Employment Type</div>
                    <div className="text-[8.5px] font-extrabold text-[#172033] mt-0.5 break-words">{form.employmentType || '—'}</div>
                  </div>
                  <div className="info-card border border-[#D9E4F2] rounded p-[5px_6px] min-h-[36px]">
                    <div className="text-[6.5px] uppercase tracking-[0.45px] text-[#667085] font-bold">Joining Date</div>
                    <div className="text-[8.5px] font-extrabold text-[#172033] mt-0.5 break-words">{fmtDate(form.joiningDate)}</div>
                  </div>
                  <div className="info-card border border-[#D9E4F2] rounded p-[5px_6px] min-h-[36px]">
                    <div className="text-[6.5px] uppercase tracking-[0.45px] text-[#667085] font-bold">PAN</div>
                    <div className="text-[8.5px] font-extrabold text-[#172033] mt-0.5 break-words">{form.pan || '—'}</div>
                  </div>
                  <div className="info-card border border-[#D9E4F2] rounded p-[5px_6px] min-h-[36px]">
                    <div className="text-[6.5px] uppercase tracking-[0.45px] text-[#667085] font-bold">UAN</div>
                    <div className="text-[8.5px] font-extrabold text-[#172033] mt-0.5 break-words">{form.uan || '—'}</div>
                  </div>
                </div>

                {/* Section: Attendance & Leave Summary */}
                <div className="section-head bg-[#eef4ff] text-[#071A4D] text-[8px] font-black uppercase tracking-[0.55px] p-[5px_7px] border-l-[3px] border-[#1257D6] mt-2">
                  Attendance & Leave Summary
                </div>
                <table className="w-full border-collapse border border-[#dfe7f1] mt-1 text-[7px]">
                  <thead>
                    <tr className="bg-[#f7f9fc] text-[#344054] uppercase font-black text-center">
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Calendar Days</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Weekly Offs</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Public Holidays</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Working Days</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Present</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Absent</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Paid Leave</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Unpaid Leave</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">LOP Days</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Paid Days</th>
                    </tr>
                  </thead>
                  <tbody className="text-center font-bold">
                    <tr>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{calc.calendar}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{calc.off}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{calc.hol}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{calc.working}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{calc.present}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{calc.absent}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{calc.paidLeave}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{calc.unpaidLeave}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{calc.lop}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px] font-extrabold text-[#071A4D]">
                        {Math.max(0, calc.present + calc.paidLeave)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Section: Automatic Salary Bifurcation */}
                <div className="section-head bg-[#eef4ff] text-[#071A4D] text-[8px] font-black uppercase tracking-[0.55px] p-[5px_7px] border-l-[3px] border-[#1257D6] mt-2">
                  Automatic Salary Bifurcation
                </div>
                <table className="w-full border-collapse border border-[#dfe7f1] mt-1 text-[7.5px]">
                  <thead>
                    <tr className="bg-[#f7f9fc] text-[#344054] uppercase font-black text-left">
                      <th className="border border-[#dfe7f1] p-[4px_5px]">Salary Component</th>
                      <th className="border border-[#dfe7f1] p-[4px_5px] text-right">Monthly (₹)</th>
                      <th className="border border-[#dfe7f1] p-[4px_5px] text-right">Annual (₹)</th>
                      <th className="border border-[#dfe7f1] p-[4px_5px]">Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-[#dfe7f1] p-[4px_5px]">Basic Pay</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.basic)}</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.basic * 12)}</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-[#667085]">{form.basicPct}% of gross</td>
                    </tr>
                    <tr>
                      <td className="border border-[#dfe7f1] p-[4px_5px]">Dearness Allowance (DA)</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.da)}</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.da * 12)}</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-[#667085]">{form.daPct}% of gross</td>
                    </tr>
                    <tr>
                      <td className="border border-[#dfe7f1] p-[4px_5px]">House Rent Allowance (HRA)</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.hra)}</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.hra * 12)}</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-[#667085]">{form.hraPct}% of Basic</td>
                    </tr>
                    <tr>
                      <td className="border border-[#dfe7f1] p-[4px_5px]">Special / Balancing Allowance</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.special)}</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.special * 12)}</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-[#667085]">Automatic balance</td>
                    </tr>
                    <tr className="bg-[#f4f8ff] font-black text-[#071A4D]">
                      <td className="border border-[#dfe7f1] p-[4px_5px]">Gross Monthly Salary</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-right">{money(calc.gross)}</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px] text-right">{money(calc.gross * 12)}</td>
                      <td className="border border-[#dfe7f1] p-[4px_5px]">Agreed Salary</td>
                    </tr>
                  </tbody>
                </table>

                {/* Section: Statutory Wage Rule & Employer Cost */}
                <div className="section-head bg-[#eef4ff] text-[#071A4D] text-[8px] font-black uppercase tracking-[0.55px] p-[5px_7px] border-l-[3px] border-[#1257D6] mt-2">
                  Statutory Wage Rule & Employer Cost
                </div>
                <table className="w-full border-collapse border border-[#dfe7f1] mt-1 text-[7px]">
                  <thead>
                    <tr className="bg-[#f7f9fc] text-[#344054] uppercase font-black text-center">
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Total Remuneration (50% Test)</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px] text-right">50% Threshold</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px] text-right">Wage Components</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px] text-right">Excess Allowance</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px] text-right">Adjusted Wage Base</th>
                    </tr>
                  </thead>
                  <tbody className="text-center font-bold">
                    <tr>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{money(calc.remuneration)}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px] text-right">{money(calc.threshold)}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px] text-right">{money(calc.wageComponents)}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px] text-right">{money(calc.excess)}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px] text-right font-extrabold text-[#071A4D]">{money(calc.adjustedWage)}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="w-full border-collapse border border-[#dfe7f1] mt-1 text-[7px]">
                  <thead>
                    <tr className="bg-[#f7f9fc] text-[#344054] uppercase font-black text-center">
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Employer PF</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Gratuity</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Employer ESI</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Employer Cost / Month</th>
                      <th className="border border-[#dfe7f1] p-[3.5px_4px]">Annual CTC</th>
                    </tr>
                  </thead>
                  <tbody className="text-center font-bold">
                    <tr>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{money(calc.employerPf)}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{money(calc.gratuity)}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px]">{money(calc.employerEsi)}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px] font-extrabold text-[#071A4D]">{money(calc.employerCost)}</td>
                      <td className="border border-[#dfe7f1] p-[3.5px_4px] font-extrabold text-[#071A4D]">{money(calc.ctc)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Two Column: Earnings vs Deductions */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {/* Earnings */}
                  <div>
                    <div className="section-head bg-[#eef4ff] text-[#071A4D] text-[8px] font-black uppercase tracking-[0.55px] p-[5px_7px] border-l-[3px] border-[#1257D6]">
                      Earnings / Payable
                    </div>
                    <table className="w-full border-collapse border border-[#dfe7f1] mt-1 text-[7.5px]">
                      <tbody>
                        <tr>
                          <td className="border border-[#dfe7f1] p-[4px_5px]">Gross Salary</td>
                          <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.gross)}</td>
                        </tr>
                        <tr>
                          <td className="border border-[#dfe7f1] p-[4px_5px] text-rose-600">Attendance / LOP Adjustment</td>
                          <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium text-rose-600">-{money(calc.lopAdj)}</td>
                        </tr>
                        <tr className="bg-[#f4f8ff] font-black text-[#071A4D]">
                          <td className="border border-[#dfe7f1] p-[4px_5px]">Gross Salary Payable</td>
                          <td className="border border-[#dfe7f1] p-[4px_5px] text-right">{money(calc.grossPayable)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Deductions */}
                  <div>
                    <div className="section-head bg-[#eef4ff] text-[#071A4D] text-[8px] font-black uppercase tracking-[0.55px] p-[5px_7px] border-l-[3px] border-[#1257D6]">
                      Employee Deductions
                    </div>
                    <table className="w-full border-collapse border border-[#dfe7f1] mt-1 text-[7.5px]">
                      <tbody>
                        <tr>
                          <td className="border border-[#dfe7f1] p-[4px_5px]">Employee PF</td>
                          <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.employeePf)}</td>
                        </tr>
                        <tr>
                          <td className="border border-[#dfe7f1] p-[4px_5px]">Professional Tax (PT)</td>
                          <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.pt)}</td>
                        </tr>
                        <tr>
                          <td className="border border-[#dfe7f1] p-[4px_5px]">TDS / Income Tax</td>
                          <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.tds)}</td>
                        </tr>
                        <tr>
                          <td className="border border-[#dfe7f1] p-[4px_5px]">Salary Advance / Loan</td>
                          <td className="border border-[#dfe7f1] p-[4px_5px] text-right font-medium">{money(calc.loan)}</td>
                        </tr>
                        <tr className="bg-[#f4f8ff] font-black text-[#071A4D]">
                          <td className="border border-[#dfe7f1] p-[4px_5px]">Total Deductions</td>
                          <td className="border border-[#dfe7f1] p-[4px_5px] text-right text-rose-600">-{money(calc.totalDed)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Net Box */}
                <div className="net-box flex items-center justify-between border-[1.5px] border-[#071A4D] rounded-md p-[7px_10px] bg-[#f8fbff] mt-2">
                  <div>
                    <div className="text-[8px] uppercase tracking-[0.6px] text-[#071A4D] font-black">
                      Net Salary Payable
                    </div>
                    <div className="text-[6.5px] text-[#667085] mt-0.5">
                      Amount after attendance adjustment and employee deductions
                    </div>
                  </div>
                  <div className="text-[16px] text-[#071A4D] font-black tracking-tight">
                    {rupee(calc.net)}
                  </div>
                </div>

                {/* Amount in words */}
                <div className="amount-words text-[7.2px] mt-1.5 p-[4.5px_7px] border border-dashed border-[#cbd5e1] rounded bg-[#fbfcfe] text-[#172033]">
                  <b>Amount in words:</b> {amountWords(calc.net)}
                </div>

                {/* Bank / Payment Details */}
                <div className="section-head bg-[#eef4ff] text-[#071A4D] text-[8px] font-black uppercase tracking-[0.55px] p-[5px_7px] border-l-[3px] border-[#1257D6] mt-2">
                  Bank / Payment Details
                </div>
                <table className="w-full border-collapse border border-[#dfe7f1] mt-1 text-[7px]">
                  <tbody>
                    <tr>
                      <td className="border border-[#dfe7f1] p-[3.5px_5px] w-1/4">
                        <b>Bank:</b> <span className="font-semibold">{form.bankName || '—'}</span>
                      </td>
                      <td className="border border-[#dfe7f1] p-[3.5px_5px] w-1/4">
                        <b>Account:</b> <span className="font-semibold font-mono">{maskAccount(form.bankAccount)}</span>
                      </td>
                      <td className="border border-[#dfe7f1] p-[3.5px_5px] w-1/4">
                        <b>IFSC:</b> <span className="font-semibold font-mono uppercase">{form.ifsc || '—'}</span>
                      </td>
                      <td className="border border-[#dfe7f1] p-[3.5px_5px] w-1/4">
                        <b>Branch:</b> <span className="font-semibold">{form.bankBranch || '—'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Payroll Notes */}
                <div className="section-head bg-[#eef4ff] text-[#071A4D] text-[8px] font-black uppercase tracking-[0.55px] p-[5px_7px] border-l-[3px] border-[#1257D6] mt-2">
                  Payroll Notes
                </div>
                <div className="text-[6.8px] text-[#667085] leading-[1.4] mt-1 bg-slate-50/50 p-1.5 rounded border border-slate-100">
                  {form.notes || 'This salary slip is computer generated and does not require a physical signature unless required by company policy.'}
                </div>

                {/* Footer Grid: Seal + Signature + Acknowledgement */}
                <div className="footer-grid grid grid-cols-3 gap-2 mt-2 pt-1 items-end">
                  {/* Seal */}
                  <div className="seal flex items-center justify-center min-h-[58px]">
                    {companySettings.stampUrl ? (
                      <img
                        src={companySettings.stampUrl}
                        alt="Company Seal"
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="border border-dashed border-amber-300 dark:border-amber-600/50 bg-amber-50/80 dark:bg-amber-950/20 rounded p-1.5 text-center text-amber-700 dark:text-amber-300 text-[7px] w-32 screen-only">
                        <span className="font-semibold">Stamp not uploaded</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <button
                            type="button"
                            onClick={() => quickStampRef.current?.click()}
                            className="underline font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 cursor-pointer"
                          >
                            Upload here
                          </button>
                          <span>·</span>
                          <a
                            href="/dashboard/settings"
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-slate-600 dark:text-slate-400 hover:text-indigo-800"
                          >
                            Settings
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Authorized Signature */}
                  <div className="signature text-center min-h-[58px] flex flex-col justify-end">
                    {companySettings.signatureUrl ? (
                      <div className="relative group mx-auto">
                        <img
                          src={companySettings.signatureUrl}
                          alt="Authorized Signature"
                          className="max-w-[110px] max-h-[36px] object-contain mx-auto mb-1"
                        />
                        <button
                          type="button"
                          onClick={() => quickSigRef.current?.click()}
                          title="Change signature"
                          className="absolute -top-1 -right-4 opacity-0 group-hover:opacity-100 bg-white shadow rounded px-1 py-0.5 text-[6px] text-blue-600 border border-blue-200 screen-only cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-amber-300 dark:border-amber-600/50 bg-amber-50/80 dark:bg-amber-950/20 rounded p-1.5 text-center text-amber-700 dark:text-amber-300 text-[7px] mb-1 screen-only">
                        <span className="font-semibold">Signature not uploaded</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <button
                            type="button"
                            onClick={() => quickSigRef.current?.click()}
                            className="underline font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 cursor-pointer"
                          >
                            Upload here
                          </button>
                          <span>·</span>
                          <a
                            href="/dashboard/settings"
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-slate-600 dark:text-slate-400 hover:text-indigo-800"
                          >
                            Settings
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="line border-t border-[#98a2b3] w-3/4 mx-auto mb-0.5" />
                    <div className="text-[6.8px] text-[#475467] leading-tight">
                      <b>{form.signatoryName || companySettings.signatoryName || 'Authorized Signatory'}</b>
                      <br />
                      {form.signatoryTitle || companySettings.signatoryTitle || 'Designation'}
                      {companySettings.companyName && (
                        <>
                          <br />
                          <span className="text-[6.2px] text-[#667085]">For {companySettings.companyName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Employee Acknowledgement */}
                  <div className="signature text-center min-h-[58px] flex flex-col justify-end">
                    <div className="h-[36px]" />
                    <div className="line border-t border-[#98a2b3] w-3/4 mx-auto mb-0.5" />
                    <div className="text-[6.8px] text-[#475467]">
                      Employee Acknowledgement
                    </div>
                  </div>
                </div>

                {/* Bottom Legal / Statutory Disclaimer */}
                <div className="text-[6.2px] text-[#98a2b3] leading-[1.3] mt-2 pt-1 border-t border-slate-100 text-justify">
                  Statutory salary components are configurable. The 50% wage-rule calculation is presented as a payroll computation aid and should be reviewed against the applicable law, notifications and company payroll policy. TDS is manually entered unless payroll tax calculation is independently configured for the relevant financial year.
                </div>
              </div>
            </div>
          </div>

          {/* History Panel (Bottom) */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm screen-only">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4 text-indigo-500" />
                  Salary Slip History & Records
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quickly view, reprint, or reload previously issued salary slips.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search name, code, slip no..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                {historyList.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      if (confirm('Clear all saved slip history?')) {
                        saveHistoryToStorage([]);
                      }
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No salary slips generated yet. Fill details above and click &quot;Save / Update Slip&quot; or &quot;Print / PDF&quot;.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/50 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center font-bold text-indigo-600 text-xs">
                        {item.employeeName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-white">
                          {item.employeeName} <span className="font-normal text-slate-400">({item.employeeCode})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {monthLabel(item.salaryMonth)} • Slip: <span className="font-mono">{item.slipNo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {rupee(item.calculation?.net || item.monthlySalary)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {fmtDate(item.updatedAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-indigo-600 border-indigo-200"
                          onClick={() => handleLoadFromHistory(item)}
                        >
                          <Eye className="mr-1 h-3 w-3" /> Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-slate-600"
                          onClick={() => {
                            handleLoadFromHistory(item);
                            setTimeout(() => window.print(), 100);
                          }}
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-rose-500 hover:text-rose-700"
                          onClick={() => {
                            const next = historyList.filter((x) => x.id !== item.id);
                            saveHistoryToStorage(next);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAYROLL LEDGER & BATCH PROCESSING */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Monthly Payroll Runs & Ledger</CardTitle>
                  <CardDescription>
                    Batch calculate monthly disbursements from timesheets, apply statutory adjustments, and export schedules.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(val) => setSelectedMonth(Number(val))}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={String(m)} className="text-xs">
                          {new Date(2026, m - 1, 1).toLocaleDateString('en-IN', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(selectedYear)}
                    onValueChange={(val) => setSelectedYear(Number(val))}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map((yr) => (
                        <SelectItem key={yr} value={String(yr)} className="text-xs">
                          {yr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => {
                      toast.info('Fetched ledger records for selected month.');
                    }}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-md border border-slate-200 dark:border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-zinc-850/50 text-xs">
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Present / Half</TableHead>
                      <TableHead>Paid / Unpaid Leaves</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => {
                      const u = users.find((usr) => usr.id === emp.userId);
                      const name = u ? `${u.firstName} ${u.lastName}` : emp.employeeId;
                      const base = Number(emp.salary) || 15000;
                      const currentLedgerYm = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
                      const hasSlip = historyList.some(
                        (h) => (h.employeeCode === emp.employeeId || h.employeeName === name) && h.salaryMonth === currentLedgerYm
                      );

                      return (
                        <TableRow key={emp.id} className="text-xs hover:bg-slate-50/50">
                          <TableCell className="font-semibold text-slate-800 dark:text-white">
                            {name}
                            <div className="text-[10px] text-slate-400 font-normal">{emp.employeeId}</div>
                          </TableCell>
                          <TableCell>{emp.department || '—'}</TableCell>
                          <TableCell className="font-mono">{rupee(base)}</TableCell>
                          <TableCell>21 / 0</TableCell>
                          <TableCell>5 / 0</TableCell>
                          <TableCell className="font-mono font-bold text-slate-800 dark:text-slate-100">
                            {rupee(base)}
                          </TableCell>
                          <TableCell>
                            {hasSlip ? (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 font-medium">
                                Slip Generated
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 font-medium">
                                Need to Give Salary
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="xs"
                              variant="ghost"
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              onClick={() => {
                                handleAutoFillFromEmployee(String(emp.id));
                                setActiveTab('generator');
                              }}
                              title="Open in Slip Generator"
                            >
                              <FileText className="mr-1 h-3.5 w-3.5" />
                              View Slip
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden file inputs for direct branding upload */}
      <input
        type="file"
        ref={quickStampRef}
        className="hidden"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={(e) => handleQuickUpload(e, 'stamp')}
      />
      <input
        type="file"
        ref={quickSigRef}
        className="hidden"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={(e) => handleQuickUpload(e, 'signature')}
      />
    </div>
  );
}
