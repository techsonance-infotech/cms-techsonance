'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Check, 
  Upload, 
  FileText, 
  Shield, 
  DollarSign, 
  Users, 
  Briefcase, 
  User, 
  PhoneCall, 
  Info,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  FolderOpen,
  Trash2,
  Clock,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';
import {
  personalStepSchema,
  workStepSchema,
  payrollStepSchema,
  accessStepSchema,
  emergencyStepSchema,
  additionalStepSchema,
  UPLOAD_LIMITS,
  validatePersonalIdByGovtId,
  getGovtIdPlaceholder,
  resolveSystemRole,
  cleanUsername,
  buildBaseUsername,
  sanitizeDraftFormData,
} from '@/shared/validation/employee';

interface EmployeeDraftSummary {
  id: string;
  displayName: string;
  email?: string | null;
  department?: string | null;
  designation?: string | null;
  employeeIdPreview?: string | null;
  currentStep: string;
  completionPercent: number;
  formData: Record<string, any>;
  updatedAt: string;
  createdByName?: string | null;
  updatedByName?: string | null;
}

const createInitialFormData = () => ({
  userId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: 'Male',
  username: '',
  officeEmail: '',
  password: '',
  role: 'developer',
  employeeId: '',
  maritalStatus: '',
  bloodGroup: '',
  nationality: '',
  govtIdType: 'Aadhaar Card',
  personalIdNumber: '',
  department: '',
  designation: '',
  employmentType: 'Full-Time',
  dateOfJoining: new Date().toISOString().split('T')[0],
  dateOfBirth: '',
  managerId: '',
  buddy: '',
  mentor: '',
  status: 'active',
  probationPeriod: '',
  confirmationDate: '',
  workLocation: '',
  workShift: '',
  noticePeriod: '',
  salary: '',
  hourlyRate: '',
  ctc: '',
  currency: 'INR',
  bankName: '',
  bankAccountNumber: '',
  ifscCode: '',
  branchName: '',
  pfNumber: '',
  uanNumber: '',
  esiNumber: '',
  panNumber: '',
  aadhaarNumber: '',
  aadhaarCardUrl: '',
  panCardUrl: '',
  addressProofUrl: '',
  educationCertificateUrl: '',
  experienceCertificateUrl: '',
  resumeUrl: '',
  permissions: '["read:dashboard","read:employees"]',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  emergencyContactAddress: '',
  languagesKnown: '',
  linkedinProfile: '',
  githubProfile: '',
  previousCompany: '',
  referralSource: '',
  notes: '',
});

interface Manager {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  designation?: string;
}

const STEPS = [
  { id: 'personal', name: 'Personal Info', icon: User, desc: 'Name, contact, ID details' },
  { id: 'work', name: 'Work Profile', icon: Briefcase, desc: 'Role, department, manager' },
  { id: 'payroll', name: 'Payroll & CTC', icon: DollarSign, desc: 'Salary, bank account, taxes' },
  { id: 'documents', name: 'Documents', icon: FileText, desc: 'KYC, resume, certificates' },
  { id: 'access', name: 'System Access', icon: Shield, desc: 'Credentials & permissions' },
  { id: 'emergency', name: 'Emergency Contact', icon: PhoneCall, desc: 'Primary contact person' },
  { id: 'additional', name: 'Additional Info', icon: Info, desc: 'Social profile & bio' },
  { id: 'review', name: 'Review & Submit', icon: Check, desc: 'Verify all details' },
];

const AVAILABLE_PERMISSIONS = [
  { key: 'read:dashboard', name: 'Read Dashboard Overview', desc: 'Allows viewing general workspace statistics, workforce charts, and insights.' },
  { key: 'write:dashboard', name: 'Edit Dashboard Layout', desc: 'Allows rearranging dashboard metrics and visual settings.' },
  { key: 'read:employees', name: 'View Employees Directory', desc: 'Allows browsing the employee directory list and basic profiles.' },
  { key: 'write:employees', name: 'Manage & Onboard Employees', desc: 'Allows adding, editing, offboarding, and deleting employee records.' },
  { key: 'read:financials', name: 'View Salaries & Payroll', desc: 'Allows viewing salary components, CTC values, and bank info.' },
  { key: 'write:financials', name: 'Manage Salaries & Payroll', desc: 'Allows editing compensation values, payroll parameters, and bank details.' },
  { key: 'read:documents', name: 'View Uploaded Documents', desc: 'Allows downloading KYC files, certificates, and uploaded resumes.' },
  { key: 'write:documents', name: 'Manage Documents', desc: 'Allows deleting or re-uploading system documents and assets.' },
  { key: 'read:settings', name: 'View Workspace Settings', desc: 'Allows viewing workspace metadata and global parameters.' },
  { key: 'write:settings', name: 'Modify Workspace Settings', desc: 'Allows configuring organization prefix settings, IP whitelist, and SMTP.' },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['read:dashboard', 'write:dashboard', 'read:employees', 'write:employees', 'read:financials', 'write:financials', 'read:documents', 'write:documents', 'read:settings', 'write:settings'],
  cms_administrator: ['read:dashboard', 'write:dashboard', 'read:employees', 'write:employees', 'read:financials', 'write:financials', 'read:documents', 'write:documents', 'read:settings', 'write:settings'],
  hr_manager: ['read:dashboard', 'read:employees', 'write:employees', 'read:financials', 'write:financials', 'read:documents', 'write:documents'],
  project_manager: ['read:dashboard', 'read:employees', 'read:documents'],
  developer: ['read:dashboard', 'read:employees'],
  qa_engineer: ['read:dashboard', 'read:employees'],
  devops_engineer: ['read:dashboard', 'read:employees'],
  ui_ux_designer: ['read:dashboard', 'read:employees'],
  intern: ['read:dashboard', 'read:employees'],
  business_development: ['read:dashboard', 'read:employees'],
  digital_marketing: ['read:dashboard', 'read:employees'],
  business_analyst: ['read:dashboard', 'read:employees'],
  management: ['read:dashboard', 'read:employees', 'read:documents', 'read:financials'],
  architect: ['read:dashboard', 'read:employees'],
  client: ['read:dashboard'],
};

export default function NewEmployeePage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState('personal');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employeeEditId, setEmployeeEditId] = useState<string | null>(null);
  const [govtIdType, setGovtIdType] = useState('Aadhaar Card');
  const [showPassword, setShowPassword] = useState(false);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [generatingUsername, setGeneratingUsername] = useState(false);
  const [usernameSuggestion, setUsernameSuggestion] = useState<string | null>(null);
  const [usernameConflictError, setUsernameConflictError] = useState<string | null>(null);
  const [usernamePattern, setUsernamePattern] = useState('first.last');
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
  const [editDataLoaded, setEditDataLoaded] = useState(false);
  const usernameGenSeqRef = useRef(0);

  // Database Drafts state (multi-employee, multi-device)
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<EmployeeDraftSummary[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [showDraftsPanel, setShowDraftsPanel] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [draftMigrationPending, setDraftMigrationPending] = useState(false);
  const draftSaveLockRef = useRef(false);
  const lastSavedDraftHashRef = useRef<string>('');
  const draftRestoringRef = useRef(false);

  // Load workspace username pattern in both add and edit modes
  useEffect(() => {
    async function loadUsernamePattern() {
      try {
        const token = getStoredSessionToken();
        const settingsRes = await fetch('/api/workspace-settings', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          const settingsData = settings.data || settings;
          if (settingsData?.usernamePattern) {
            setUsernamePattern(settingsData.usernamePattern);
          }
        }
      } catch (err) {
        console.error('Error loading username pattern:', err);
      }
    }
    loadUsernamePattern();
  }, []);

  // Auto-generate employee ID and load default probation/notice values on load in creation mode
  useEffect(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlEditId = urlParams?.get('id');
    const urlDraftId = urlParams?.get('draft');
    if (employeeEditId || urlEditId || urlDraftId) return;

    async function autoGenerateEmployeeId() {
      try {
        const token = getStoredSessionToken();
        let prefix = 'EMP';
        let defaultProbationVal = '3';
        let defaultNoticeVal = '90';

        const settingsRes = await fetch('/api/workspace-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          const settingsData = settings.data || settings;
          if (settingsData.empIdPrefix) {
            prefix = settingsData.empIdPrefix;
          }
          if (settingsData.defaultProbation !== undefined && settingsData.defaultProbation !== null) {
            defaultProbationVal = String(settingsData.defaultProbation);
          }
          if (settingsData.noticePeriod !== undefined && settingsData.noticePeriod !== null) {
            defaultNoticeVal = String(settingsData.noticePeriod);
          }
        }

        const empRes = await fetch('/api/employees?limit=1', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let nextSerial = 1001;
        if (empRes.ok) {
          const empJson = await empRes.json();
          const total = empJson.meta?.total ?? 0;
          nextSerial = 1000 + total + 1;
        }

        setFormData(prev => ({
          ...prev,
          employeeId: `${prefix}${nextSerial}`,
          probationPeriod: defaultProbationVal,
          noticePeriod: defaultNoticeVal
        }));
      } catch (err) {
        console.error('Error auto-generating Employee ID:', err);
      }
    }
    autoGenerateEmployeeId();
  }, [employeeEditId]);
  
  // Section observer refs
  const sectionRefs = {
    personal: useRef<HTMLDivElement>(null),
    work: useRef<HTMLDivElement>(null),
    payroll: useRef<HTMLDivElement>(null),
    documents: useRef<HTMLDivElement>(null),
    access: useRef<HTMLDivElement>(null),
    emergency: useRef<HTMLDivElement>(null),
    additional: useRef<HTMLDivElement>(null),
    review: useRef<HTMLDivElement>(null),
  };

  // Form State
  const [formData, setFormData] = useState({
    userId: '',
    // User Profile
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    username: '',
    officeEmail: '',
    password: '',
    role: 'developer',

    // Employee Profile
    employeeId: '',
    maritalStatus: '',
    bloodGroup: '',
    nationality: '',
    govtIdType: 'Aadhaar Card',
    personalIdNumber: '',
    department: '',
    designation: '',
    employmentType: 'Full-Time',
    dateOfJoining: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    managerId: '',
    buddy: '',
    mentor: '',
    status: 'active',
    probationPeriod: '',
    confirmationDate: '',
    workLocation: '',
    workShift: '',
    noticePeriod: '',

    // Compensation & Payroll
    salary: '',
    hourlyRate: '',
    ctc: '',
    currency: 'INR',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    branchName: '',
    pfNumber: '',
    uanNumber: '',
    esiNumber: '',
    panNumber: '',
    aadhaarNumber: '',

    // Documents Urls
    aadhaarCardUrl: '',
    panCardUrl: '',
    addressProofUrl: '',
    educationCertificateUrl: '',
    experienceCertificateUrl: '',
    resumeUrl: '',

    permissions: '["read:dashboard","read:employees"]',

    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    emergencyContactAddress: '',

    // Additional Info
    languagesKnown: '',
    linkedinProfile: '',
    githubProfile: '',
    previousCompany: '',
    referralSource: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Auto-generate password based on Employee ID in creation mode
  useEffect(() => {
    const urlEditId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null;
    if (!employeeEditId && !urlEditId && formData.employeeId) {
      setFormData(prev => ({
        ...prev,
        password: `Welcome@${prev.employeeId}`
      }));
    }
  }, [formData.employeeId, employeeEditId]);

  // Extract query parameters safe from window object
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('id');
      const draftId = params.get('draft');
      if (editId) {
        setEmployeeEditId(editId);
      } else {
        void fetchSavedDrafts();
        if (draftId) {
          void loadDraftById(draftId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSavedDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/employees/drafts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setSavedDrafts(Array.isArray(json.data) ? json.data : []);
        if (json.meta?.migrationRequired) {
          setDraftMigrationPending(true);
        }
      }
    } catch (err) {
      console.error('Error fetching employee drafts:', err);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const applyDraftToForm = (draft: EmployeeDraftSummary, showToast: boolean = true) => {
    draftRestoringRef.current = true;
    const baseDefaults = createInitialFormData();
    const raw = (draft.formData || {}) as Record<string, any>;
    const merged: typeof baseDefaults = { ...baseDefaults };
    (Object.keys(baseDefaults) as Array<keyof typeof baseDefaults>).forEach((key) => {
      if (key === 'password') return; // Never hydrate password from draft
      if (raw[key] !== undefined && raw[key] !== null) {
        merged[key] = String(raw[key]);
      }
    });
    if (merged.employeeId) {
      merged.password = `Welcome@${merged.employeeId}`;
    }

    setGovtIdType(merged.govtIdType || 'Aadhaar Card');
    setUsernameManuallyEdited(Boolean(merged.username));
    setFormData(merged);
    setActiveStep(draft.currentStep || 'personal');
    setActiveDraftId(draft.id);
    setLastDraftSavedAt(draft.updatedAt || null);
    setErrors({});
    setUsernameConflictError(null);
    setUsernameSuggestion(null);
    lastSavedDraftHashRef.current = JSON.stringify({
      currentStep: draft.currentStep || 'personal',
      formData: sanitizeDraftFormData(merged),
    });

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('draft', draft.id);
      window.history.replaceState(null, '', url.toString());
    }

    setShowDraftsPanel(false);
    if (showToast) {
      toast.success(`Resumed draft: ${draft.displayName}`);
    }
    setTimeout(() => {
      draftRestoringRef.current = false;
    }, 400);
  };

  const loadDraftById = async (draftId: string) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/drafts?id=${encodeURIComponent(draftId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          applyDraftToForm(json.data, true);
        }
      } else {
        toast.error('Saved draft could not be found.');
      }
    } catch (err) {
      console.error('Error loading draft by ID:', err);
    }
  };

  const saveDraftToDatabase = async (options?: { silent?: boolean }) => {
    if (employeeEditId || draftSaveLockRef.current || draftMigrationPending) return;
    const sanitized = sanitizeDraftFormData(formData);
    const snapshotHash = JSON.stringify({ currentStep: activeStep, formData: sanitized });

    if (options?.silent && snapshotHash === lastSavedDraftHashRef.current) {
      return;
    }

    draftSaveLockRef.current = true;
    setSavingDraft(true);
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const endpoint = activeDraftId
        ? `/api/employees/drafts?id=${encodeURIComponent(activeDraftId)}`
        : '/api/employees/drafts';
      const method = activeDraftId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify({
          id: activeDraftId || undefined,
          currentStep: activeStep,
          formData: sanitized,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error || errJson.message || 'Failed to save draft';
        if (msg.toLowerCase().includes('migration')) {
          setDraftMigrationPending(true);
        }
        if (!options?.silent) {
          toast.error(msg);
        }
        return;
      }

      const json = await res.json();
      const savedDraft: EmployeeDraftSummary | undefined = json.data;
      if (savedDraft?.id) {
        setActiveDraftId(savedDraft.id);
        setLastDraftSavedAt(savedDraft.updatedAt || new Date().toISOString());
        lastSavedDraftHashRef.current = snapshotHash;

        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          if (url.searchParams.get('draft') !== savedDraft.id) {
            url.searchParams.set('draft', savedDraft.id);
            window.history.replaceState(null, '', url.toString());
          }
        }

        setSavedDrafts((prev) => {
          const rest = prev.filter((d) => d.id !== savedDraft.id);
          return [savedDraft, ...rest];
        });

        if (!options?.silent) {
          toast.success('Draft saved! You can resume anytime from any device.');
        }
      }
    } catch (err) {
      console.error('Error saving employee draft:', err);
      if (!options?.silent) {
        toast.error('Unable to save draft right now.');
      }
    } finally {
      draftSaveLockRef.current = false;
      setSavingDraft(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/drafts?id=${encodeURIComponent(draftId)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setSavedDrafts((prev) => prev.filter((d) => d.id !== draftId));
        if (activeDraftId === draftId) {
          setActiveDraftId(null);
          setLastDraftSavedAt(null);
          lastSavedDraftHashRef.current = '';
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('draft');
            window.history.replaceState(null, '', url.toString());
          }
        }
        toast.success('Draft discarded');
      } else {
        toast.error('Failed to discard draft');
      }
    } catch (err) {
      console.error('Error deleting draft:', err);
      toast.error('Failed to discard draft');
    }
  };

  const handleStartBlankForm = () => {
    setActiveDraftId(null);
    setLastDraftSavedAt(null);
    lastSavedDraftHashRef.current = '';
    setUsernameManuallyEdited(false);
    setErrors({});
    setUsernameConflictError(null);
    setUsernameSuggestion(null);
    setGovtIdType('Aadhaar Card');
    setFormData((prev) => ({
      ...createInitialFormData(),
      employeeId: prev.employeeId,
      probationPeriod: prev.probationPeriod,
      noticePeriod: prev.noticePeriod,
    }));
    setActiveStep('personal');
    setShowDraftsPanel(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('draft');
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Auto-save draft to database in creation mode (debounced 2.5s after meaningful edits)
  useEffect(() => {
    const urlEditId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null;
    if (employeeEditId || urlEditId || submitting || draftRestoringRef.current || draftMigrationPending) return;

    const hasMeaningfulData = Boolean(
      formData.firstName.trim() ||
      formData.lastName.trim() ||
      formData.email.trim() ||
      formData.phone.trim() ||
      formData.department.trim() ||
      formData.designation.trim()
    );
    if (!hasMeaningfulData) return;

    const timer = setTimeout(() => {
      void saveDraftToDatabase({ silent: true });
    }, 2500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, activeStep, employeeEditId, submitting, draftMigrationPending]);

  // Fetch employee details when in edit mode
  useEffect(() => {
    if (!employeeEditId) return;

    async function fetchEmployeeDetails() {
      try {
        const token = getStoredSessionToken();
        const res = await fetch(`/api/employees?id=${employeeEditId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const employee = await res.json();
          if (employee) {
            if (employee.govtIdType) {
              setGovtIdType(employee.govtIdType);
            }
            const resolvedRole = resolveSystemRole(employee.role, employee.designation);
            const resolvedPermissions =
              Array.isArray(employee.permissions) && employee.permissions.length > 0
                ? JSON.stringify(employee.permissions)
                : JSON.stringify(DEFAULT_ROLE_PERMISSIONS[resolvedRole] || ['read:dashboard', 'read:employees']);
            const resolvedUserId = employee.userId
              ? String(employee.userId)
              : (employee.authUserId || employee.user_id || '');
            setHasExistingAccount(Boolean(employee.hasAccount ?? (resolvedUserId || employee.email)));
            const existingUsername = (employee.username || '').trim();
            // Preserve an existing username in edit mode; if blank, allow auto-generation from name
            setUsernameManuallyEdited(Boolean(existingUsername));
            setFormData({
              userId: resolvedUserId,
              firstName: employee.firstName || '',
              middleName: employee.middleName || '',
              lastName: employee.lastName || '',
              email: employee.email || '',
              phone: employee.phone || '',
              gender: employee.gender || 'Male',
              username: existingUsername,
              officeEmail: employee.officeEmail || '',
              password: '', // Kept empty for editing; password is already configured on the account
              role: resolvedRole,
              employeeId: employee.employeeId || '',
              maritalStatus: employee.maritalStatus || '',
              bloodGroup: employee.bloodGroup || '',
              nationality: employee.nationality || '',
              govtIdType: employee.govtIdType || 'Aadhaar Card',
              personalIdNumber: employee.personalIdNumber || '',
              department: employee.department || '',
              designation: employee.designation || '',
              employmentType: employee.employmentType === 'full_time' || employee.employmentType === 'Full Time' || employee.employmentType === 'Full-Time' ? 'Full-Time' : employee.employmentType === 'part_time' || employee.employmentType === 'Part Time' || employee.employmentType === 'Part-Time' ? 'Part-Time' : employee.employmentType === 'contract' || employee.employmentType === 'Contract' ? 'Contract' : employee.employmentType === 'intern' || employee.employmentType === 'Intern' ? 'Intern' : 'Full-Time',
              dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.split('T')[0] : '',
              dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
              managerId: employee.managerId ? String(employee.managerId) : '',
              buddy: employee.buddy || employee.buddyName || '',
              mentor: employee.mentor || employee.mentorName || '',
              status: employee.status || 'active',
              probationPeriod: employee.probationPeriod ? String(employee.probationPeriod) : '',
              confirmationDate: employee.confirmationDate ? employee.confirmationDate.split('T')[0] : '',
              workLocation: employee.workLocation || '',
              workShift: employee.workShift || '',
              noticePeriod: employee.noticePeriod ? String(employee.noticePeriod) : '',
              salary: employee.salary ? String(employee.salary) : '',
              hourlyRate: employee.hourlyRate ? String(employee.hourlyRate) : '',
              ctc: employee.ctc ? String(employee.ctc) : '',
              currency: employee.currency || 'INR',
              bankName: employee.bankName || '',
              bankAccountNumber: employee.bankAccountNumber || '',
              ifscCode: employee.ifscCode || '',
              branchName: employee.branchName || '',
              pfNumber: employee.pfNumber || '',
              uanNumber: employee.uanNumber || '',
              esiNumber: employee.esiNumber || '',
              panNumber: employee.panNumber || '',
              aadhaarNumber: employee.aadhaarNumber || '',
              aadhaarCardUrl: employee.aadhaarCardUrl || '',
              panCardUrl: employee.panCardUrl || '',
              addressProofUrl: employee.addressProofUrl || '',
              educationCertificateUrl: employee.educationCertificateUrl || '',
              experienceCertificateUrl: employee.experienceCertificateUrl || '',
              resumeUrl: employee.resumeUrl || '',
              permissions: resolvedPermissions,
              emergencyContactName: employee.emergencyContactName || '',
              emergencyContactRelationship: employee.emergencyContactRelationship || '',
              emergencyContactPhone: employee.emergencyContactPhone || '',
              emergencyContactAddress: employee.emergencyContactAddress || '',
              languagesKnown: employee.languagesKnown || '',
              linkedinProfile: employee.linkedinProfile || '',
              githubProfile: employee.githubProfile || '',
              previousCompany: employee.previousCompany || '',
              referralSource: employee.referralSource || '',
              notes: employee.notes || '',
            });
            setEditDataLoaded(true);
          }
        }
      } catch (err) {
        console.error('Error fetching employee details:', err);
      }
    }
    fetchEmployeeDetails();
  }, [employeeEditId]);

  // Fetch potential managers from organization employees and users
  useEffect(() => {
    async function fetchManagers() {
      setLoadingManagers(true);
      try {
        const token =
          getStoredSessionToken() ||
          (typeof window !== 'undefined'
            ? localStorage.getItem('session_token') || sessionStorage.getItem('session_token')
            : null);
        const headers: Record<string, string> = {};
        if (token && token !== 'null' && token !== 'undefined') {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const candidateMap = new Map<string, any>();

        // 1. Fetch all employees in organization
        try {
          const empRes = await fetch('/api/employees?limit=1000', {
            headers,
            credentials: 'include',
          });
          if (empRes.ok) {
            const empJson = await empRes.json();
            const empList = Array.isArray(empJson) ? empJson : (empJson.data || []);
            empList.forEach((e: any) => {
              const id = e.userId || e.id;
              if (id) {
                candidateMap.set(String(id), {
                  id: Number(id),
                  employeeId: e.id,
                  firstName: e.firstName || '',
                  lastName: e.lastName || '',
                  email: e.email || '',
                  role: e.designation || e.role || 'Employee',
                  designation: e.designation || e.department || '',
                });
              }
            });
          }
        } catch (err) {
          console.error('Error fetching employees for managers:', err);
        }

        // 2. Fetch users directory to include Admins/Managers not in employees table
        try {
          const userRes = await fetch('/api/users?limit=100', {
            headers,
            credentials: 'include',
          });
          if (userRes.ok) {
            const userJson = await userRes.json();
            const userList = userJson.data || [];
            userList.forEach((u: any) => {
              const id = u.id;
              if (id && !candidateMap.has(String(id))) {
                candidateMap.set(String(id), {
                  id: Number(id),
                  firstName: u.firstName || '',
                  lastName: u.lastName || '',
                  email: u.email || '',
                  role: u.role || 'User',
                  designation: u.role || '',
                });
              }
            });
          }
        } catch (err) {
          console.error('Error fetching users for managers:', err);
        }

        const allCandidates = Array.from(candidateMap.values());
        setColleagues(allCandidates);

        // Filter: prioritize Admins, Managers, Leads if available, but fallback to all candidates so the dropdown is NEVER empty
        const mgrs = allCandidates.filter((u: any) => {
          const r = `${u.role || ''} ${u.designation || ''}`.toLowerCase();
          return (
            r.includes('admin') ||
            r.includes('manager') ||
            r.includes('lead') ||
            r.includes('head') ||
            r.includes('director') ||
            r.includes('vp') ||
            r.includes('chief') ||
            r.includes('president')
          );
        });

        setManagers(mgrs.length > 0 ? mgrs : allCandidates);
      } catch (err) {
        console.error('Error fetching managers:', err);
      } finally {
        setLoadingManagers(false);
      }
    }
    fetchManagers();
  }, []);

  // Step-specific validation using shared Zod schemas
  const validateStep = (stepId: string): Record<string, string> => {
    const stepErrors: Record<string, string> = {};
    let result: any = null;

    if (stepId === 'personal') {
      result = personalStepSchema.safeParse({
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        maritalStatus: formData.maritalStatus,
        bloodGroup: formData.bloodGroup,
        nationality: formData.nationality,
        govtIdType: formData.govtIdType || govtIdType,
        personalIdNumber: formData.personalIdNumber,
      });
    } else if (stepId === 'work') {
      result = workStepSchema.safeParse({
        employeeId: formData.employeeId,
        department: formData.department,
        designation: formData.designation,
        employmentType: formData.employmentType,
        dateOfJoining: formData.dateOfJoining,
        dateOfBirth: formData.dateOfBirth,
        managerId: formData.managerId,
        buddy: formData.buddy,
        mentor: formData.mentor,
        status: formData.status,
        probationPeriod: formData.probationPeriod,
        confirmationDate: formData.confirmationDate,
        workLocation: formData.workLocation,
        workShift: formData.workShift,
        noticePeriod: formData.noticePeriod,
      });
    } else if (stepId === 'payroll') {
      result = payrollStepSchema.safeParse({
        salary: formData.salary,
        hourlyRate: formData.hourlyRate,
        ctc: formData.ctc,
        currency: formData.currency,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        ifscCode: formData.ifscCode,
        branchName: formData.branchName,
        pfNumber: formData.pfNumber,
        uanNumber: formData.uanNumber,
        esiNumber: formData.esiNumber,
        panNumber: formData.panNumber,
        aadhaarNumber: formData.aadhaarNumber,
      });
    } else if (stepId === 'access') {
      result = accessStepSchema(Boolean(employeeEditId)).safeParse({
        role: formData.role,
        username: formData.username,
        officeEmail: formData.officeEmail,
        password: formData.password,
      });
    } else if (stepId === 'emergency') {
      result = emergencyStepSchema.safeParse({
        emergencyContactName: formData.emergencyContactName,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactAddress: formData.emergencyContactAddress,
        employeePhone: formData.phone,
      });
    } else if (stepId === 'additional') {
      result = additionalStepSchema.safeParse({
        languagesKnown: formData.languagesKnown,
        linkedinProfile: formData.linkedinProfile,
        githubProfile: formData.githubProfile,
        previousCompany: formData.previousCompany,
        referralSource: formData.referralSource,
        notes: formData.notes,
      });
    }

    if (result && !result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (field && !stepErrors[field]) {
          stepErrors[field] = issue.message;
        }
      }
    }

    if (stepId === 'access' && usernameConflictError && !stepErrors.username) {
      stepErrors.username = usernameConflictError;
    }

    setErrors((prev) => {
      // Clear previous errors for this step's schema keys, then apply new errors
      const updated = { ...prev };
      if (Object.keys(stepErrors).length > 0) {
        Object.assign(updated, stepErrors);
      }
      return updated;
    });

    return stepErrors;
  };

  // Real-time uniqueness check for username allocation
  const checkUsernameAvailability = async (rawValue: string) => {
    const normalized = cleanUsername(rawValue);
    if (!normalized) {
      setUsernameConflictError(null);
      setUsernameSuggestion(null);
      return;
    }

    // Only check backend if format itself is valid
    const formatCheck = accessStepSchema(true).shape.username.safeParse(normalized);
    if (!formatCheck.success) {
      setUsernameConflictError(null);
      setUsernameSuggestion(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const token = getStoredSessionToken();
      const params = new URLSearchParams({ checkUsername: normalized });
      if (formData.userId && formData.userId.trim()) {
        params.set('excludeUserId', formData.userId.trim());
      }
      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.available === false) {
          const msg = data.message || 'This username is already taken. Please choose a different username.';
          setUsernameConflictError(msg);
          setUsernameSuggestion(data.suggestion || null);
          setErrors((prev) => ({ ...prev, username: msg }));
        } else {
          setUsernameConflictError(null);
          setUsernameSuggestion(null);
          setErrors((prev) => {
            const copy = { ...prev };
            delete copy.username;
            return copy;
          });
        }
      }
    } catch (err) {
      console.error('Error checking username availability:', err);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Generate a guaranteed-unique username from first/last/middle name using workspace formula
  const generateUniqueUsernameFromName = async (
    firstName: string,
    lastName: string,
    middleName?: string,
    excludeUserId?: string
  ) => {
    const base = buildBaseUsername(firstName, lastName, middleName, usernamePattern);
    if (!base) return;

    const seq = ++usernameGenSeqRef.current;
    setGeneratingUsername(true);
    try {
      const token = getStoredSessionToken();
      const params = new URLSearchParams({ checkUsername: base });
      if (excludeUserId && excludeUserId.trim()) {
        params.set('excludeUserId', excludeUserId.trim());
      }
      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      let resolved = base;
      if (res.ok) {
        const data = await res.json();
        resolved =
          data.available === false && data.suggestion
            ? data.suggestion
            : (data.username || base);
      }

      if (seq !== usernameGenSeqRef.current) return;

      setFormData((prev) => ({ ...prev, username: resolved }));
      setUsernameConflictError(null);
      setUsernameSuggestion(null);
      setErrors((prev) => {
        if (!prev.username) return prev;
        const copy = { ...prev };
        delete copy.username;
        return copy;
      });
    } catch (err) {
      console.error('Error auto-generating unique username:', err);
      if (seq === usernameGenSeqRef.current) {
        setFormData((prev) => ({ ...prev, username: base }));
      }
    } finally {
      if (seq === usernameGenSeqRef.current) {
        setGeneratingUsername(false);
      }
    }
  };

  // Auto-generate username from First & Last Name (add mode, and edit mode when empty)
  // Respects manual edits so admins can customize their own username freely
  useEffect(() => {
    const urlEditId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null;
    const isEdit = Boolean(employeeEditId || urlEditId);
    if (isEdit && !editDataLoaded) return;
    if (usernameManuallyEdited) return;

    const base = buildBaseUsername(formData.firstName, formData.lastName, formData.middleName, usernamePattern);
    if (!base) return;

    const timer = setTimeout(() => {
      void generateUniqueUsernameFromName(
        formData.firstName,
        formData.lastName,
        formData.middleName,
        formData.userId
      );
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.firstName,
    formData.middleName,
    formData.lastName,
    formData.userId,
    usernamePattern,
    usernameManuallyEdited,
    employeeEditId,
    editDataLoaded,
  ]);

  // Inline blur handler for immediate field-level feedback
  const handleFieldBlur = (name: string) => {
    const stepErrors = validateStep(activeStep);
    setErrors((prev) => {
      const copy = { ...prev };
      if (stepErrors[name]) {
        copy[name] = stepErrors[name];
      } else {
        delete copy[name];
      }
      // Keep cross-field CTC error in sync when Monthly Base Salary changes
      if (name === 'salary') {
        if (stepErrors.ctc) {
          copy.ctc = stepErrors.ctc;
        } else {
          delete copy.ctc;
        }
      }
      return copy;
    });
    if (name === 'username') {
      void checkUsernameAvailability(formData.username);
    }
  };

  const handlePrevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === activeStep);
    if (currentIndex > 0) {
      setActiveStep(STEPS[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextStep = () => {
    const stepErrors = validateStep(activeStep);
    if (Object.keys(stepErrors).length > 0) {
      const errorMsg = Object.values(stepErrors).join(' • ');
      toast.error(errorMsg);
      return;
    }
    const currentIndex = STEPS.findIndex((s) => s.id === activeStep);
    if (currentIndex < STEPS.length - 1) {
      setActiveStep(STEPS[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepId: string) => {
    const targetIdx = STEPS.findIndex((s) => s.id === stepId);
    const currentIdx = STEPS.findIndex((s) => s.id === activeStep);

    if (targetIdx > currentIdx) {
      const stepErrors = validateStep(activeStep);
      if (Object.keys(stepErrors).length > 0) {
        const errorMsg = Object.values(stepErrors).join(' • ');
        toast.error(errorMsg);
        return;
      }
    }

    setActiveStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'username') {
      // Admin typed a custom username; stop auto-overwriting unless they clear it or click Auto-generate
      setUsernameManuallyEdited(value.trim().length > 0);
      setUsernameConflictError(null);
      setUsernameSuggestion(null);
    }
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Document Upload Handler using unified shared upload limits
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const hasAllowedExtension = UPLOAD_LIMITS.ALLOWED_EXTENSIONS.some(ext => fileNameLower.endsWith(ext));
    const hasAllowedMime = (UPLOAD_LIMITS.ALLOWED_MIME_TYPES as readonly string[]).includes(file.type) ||
                           file.type.startsWith('image/') ||
                           file.type === 'application/pdf' ||
                           file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!hasAllowedExtension || !hasAllowedMime) {
      toast.error('Only PDF, DOCX, and images (JPG, JPEG, PNG, WEBP) are accepted.');
      return;
    }

    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
    const maxSize = isImage ? UPLOAD_LIMITS.MAX_IMAGE_SIZE_BYTES : UPLOAD_LIMITS.MAX_DOCUMENT_SIZE_BYTES;
    if (file.size > maxSize) {
      const limitMb = Math.round(maxSize / (1024 * 1024));
      toast.error(`File size exceeds the limit of ${limitMb} MB`);
      return;
    }

    setUploadingField(fieldName);
    try {
      const token = getStoredSessionToken();
      const payload = new FormData();
      payload.append('file', file);
      payload.append('kind', 'employee_document');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: payload
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'File upload failed');
      }

      const uploadResult = await res.json();
      const uploadedUrl = uploadResult.data?.url || uploadResult.url;

      if (!uploadedUrl) {
        throw new Error('Upload response did not return a valid file URL.');
      }

      setFormData((prev) => ({
        ...prev,
        [fieldName]: uploadedUrl,
      }));
      toast.success(`${file.name} uploaded successfully!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred during file upload.');
    } finally {
      setUploadingField(null);
    }
  };

  const validateForm = (): { allErrors: Record<string, string>; firstStep: string | null } => {
    const allErrors: Record<string, string> = {};
    let firstStep: string | null = null;
    const stepOrder = ['personal', 'work', 'payroll', 'documents', 'access', 'emergency', 'additional'];

    for (const step of stepOrder) {
      const stepErrors = validateStep(step);
      if (Object.keys(stepErrors).length > 0) {
        Object.assign(allErrors, stepErrors);
        if (!firstStep) {
          firstStep = step;
        }
      }
    }

    setErrors(allErrors);
    return { allErrors, firstStep };
  };

  const handleSubmit = async () => {
    const { allErrors: formErrors, firstStep } = validateForm();
    if (Object.keys(formErrors).length > 0) {
      const errorMsg = Object.values(formErrors).join(' • ');
      toast.error(`Please fix validation errors: ${errorMsg}`);
      if (firstStep) {
        setActiveStep(firstStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setSubmitting(true);
    try {
      const token = getStoredSessionToken();
      const normEmploymentType = (formData.employmentType || '').toLowerCase().replace('-', '_');

      if (employeeEditId) {
        // --- EDIT MODE FLOW ---
        // Helper to extract granular validation issues
        const extractApiErrorMessage = (errorData: any, fallback: string): string => {
          if (!errorData) return fallback;
          if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            const msgs = errorData.errors
              .map((err: any) => {
                const path = Array.isArray(err.path) ? err.path.join('.') : err.path;
                return path ? `${path}: ${err.message}` : err.message;
              })
              .filter(Boolean);
            if (msgs.length > 0) return msgs.join(', ');
          }
          if (errorData.errors && typeof errorData.errors === 'object') {
            return Object.entries(errorData.errors)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
          }
          return errorData.error || errorData.message || fallback;
        };

        // 1. Update User (supports both legacy numeric userId and auth UUID)
        if (formData.userId && formData.userId.trim()) {
          const userPayload: Record<string, any> = {
            email: formData.email.trim(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            role: formData.role || 'developer',
            phone: formData.phone?.trim() || null,
            middleName: formData.middleName?.trim() || null,
            gender: formData.gender || null,
            username: formData.username?.trim() ? cleanUsername(formData.username) : null,
            officeEmail: formData.officeEmail?.trim() || null,
          };
          if (formData.password?.trim() && formData.password.trim().length >= 8) {
            userPayload.password = formData.password.trim();
          }

          const userHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token && token !== 'null' && token !== 'undefined') {
            userHeaders['Authorization'] = `Bearer ${token}`;
          }

          const userRes = await fetch(`/api/users?id=${formData.userId}`, {
            method: 'PUT',
            headers: userHeaders,
            credentials: 'include',
            body: JSON.stringify(userPayload)
          });

          if (!userRes.ok) {
            const errorData = await userRes.json();
            console.error('User update error data:', errorData);
            const detailedMsg = extractApiErrorMessage(errorData, 'Failed to update user account details');
            throw new Error(`[User Update] ${detailedMsg}`);
          }
        }

        // 2. Update Employee Profile
        const safeManagerId = formData.managerId && !isNaN(Number(formData.managerId)) && Number(formData.managerId) > 0 
          ? Number(formData.managerId) 
          : null;
        const safeStatus = (formData.status || 'active').toLowerCase().replace(/[\s-]+/g, '_');
        const safeSalary = formData.salary ? Number(String(formData.salary).replace(/[^0-9.-]/g, '')) || null : null;
        const safeHourlyRate = formData.hourlyRate ? Number(String(formData.hourlyRate).replace(/[^0-9.-]/g, '')) || null : null;
        const safeCtc = formData.ctc ? Number(String(formData.ctc).replace(/[^0-9.-]/g, '')) || null : null;
        const safeProbation = formData.probationPeriod ? Number(String(formData.probationPeriod).replace(/[^0-9.-]/g, '')) || null : null;
        const safeNotice = formData.noticePeriod ? Number(String(formData.noticePeriod).replace(/[^0-9.-]/g, '')) || null : null;

        const employeePayload = {
          employeeId: formData.employeeId.trim(),
          department: formData.department.trim(),
          designation: formData.designation.trim(),
          employmentType: normEmploymentType,
          dateOfJoining: formData.dateOfJoining ? formData.dateOfJoining.split('T')[0] : '',
          dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : null,
          managerId: safeManagerId,
          buddy: formData.buddy || null,
          buddyName: formData.buddy || null,
          mentor: formData.mentor || null,
          mentorName: formData.mentor || null,
          status: safeStatus,
          probationPeriod: safeProbation,
          confirmationDate: formData.confirmationDate ? formData.confirmationDate.split('T')[0] : null,
          workLocation: formData.workLocation || null,
          workShift: formData.workShift || null,
          noticePeriod: safeNotice,
          
          salary: safeSalary,
          hourlyRate: safeHourlyRate,
          ctc: safeCtc,
          currency: formData.currency,
          bankName: formData.bankName || null,
          bankAccountNumber: formData.bankAccountNumber || null,
          ifscCode: formData.ifscCode || null,
          branchName: formData.branchName || null,
          pfNumber: formData.pfNumber || null,
          uanNumber: formData.uanNumber || null,
          esiNumber: formData.esiNumber || null,
          panNumber: formData.panNumber || null,
          aadhaarNumber: formData.aadhaarNumber || null,

          aadhaarCardUrl: formData.aadhaarCardUrl || null,
          panCardUrl: formData.panCardUrl || null,
          addressProofUrl: formData.addressProofUrl || null,
          educationCertificateUrl: formData.educationCertificateUrl || null,
          experienceCertificateUrl: formData.experienceCertificateUrl || null,
          resumeUrl: formData.resumeUrl || null,

          permissions: formData.permissions ? (typeof formData.permissions === 'string' ? JSON.parse(formData.permissions) : formData.permissions) : null,

          emergencyContactName: formData.emergencyContactName || null,
          emergencyContactRelationship: formData.emergencyContactRelationship || null,
          emergencyContactPhone: formData.emergencyContactPhone || null,
          emergencyContactAddress: formData.emergencyContactAddress || null,

          languagesKnown: formData.languagesKnown || null,
          linkedinProfile: formData.linkedinProfile || null,
          githubProfile: formData.githubProfile || null,
          previousCompany: formData.previousCompany || null,
          referralSource: formData.referralSource || null,
          notes: formData.notes || null,
          gender: formData.gender || null,
          maritalStatus: formData.maritalStatus || null,
          bloodGroup: formData.bloodGroup || null,
          nationality: formData.nationality || null,
          govtIdType: formData.govtIdType || govtIdType,
          personalIdNumber: formData.personalIdNumber || null,
          middleName: formData.middleName || null,
          officeEmail: formData.officeEmail || null,
        };

        const empHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token && token !== 'null' && token !== 'undefined') {
          empHeaders['Authorization'] = `Bearer ${token}`;
        }

        const employeeRes = await fetch(`/api/employees?id=${employeeEditId}`, {
          method: 'PUT',
          headers: empHeaders,
          credentials: 'include',
          body: JSON.stringify(employeePayload)
        });

        if (!employeeRes.ok) {
          const errorData = await employeeRes.json();
          console.error('Employee update error data:', errorData);
          const detailedMsg = extractApiErrorMessage(errorData, 'Failed to update employee profile mapping');
          throw new Error(`[Employee Update] ${detailedMsg}`);
        }

        toast.success('Employee profile successfully updated!');
        router.push(`/dashboard/employees/${employeeEditId}`);
      } else {
        // --- CREATION MODE FLOW ---
        // 1. Create User
        const userPayload = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          phone: formData.phone || undefined,
          username: formData.username?.trim() ? cleanUsername(formData.username) : undefined,
          middleName: formData.middleName || undefined,
          gender: formData.gender,
          officeEmail: formData.officeEmail || undefined,
        };

        const userRes = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userPayload)
        });

        if (!userRes.ok) {
          const errorData = await userRes.json();
          throw new Error(errorData.error || errorData.message || 'Failed to register authentication user account');
        }

        const createdUser = await userRes.json();
        const newUserId = createdUser.id; // Legacy numeric user ID

        // 2. Create Employee Linked Profile
        const employeePayload = {
          userId: newUserId,
          employeeId: formData.employeeId,
          department: formData.department,
          designation: formData.designation,
          employmentType: normEmploymentType,
          dateOfJoining: formData.dateOfJoining,
          dateOfBirth: formData.dateOfBirth || undefined,
          managerId: formData.managerId ? Number(formData.managerId) : undefined,
          buddy: formData.buddy || undefined,
          buddyName: formData.buddy || undefined,
          mentor: formData.mentor || undefined,
          mentorName: formData.mentor || undefined,
          status: formData.status,
          probationPeriod: formData.probationPeriod ? Number(formData.probationPeriod) : undefined,
          confirmationDate: formData.confirmationDate || undefined,
          workLocation: formData.workLocation || undefined,
          workShift: formData.workShift || undefined,
          noticePeriod: formData.noticePeriod ? Number(formData.noticePeriod) : undefined,
          
          salary: formData.salary ? Number(formData.salary) : undefined,
          hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
          ctc: formData.ctc ? Number(formData.ctc) : undefined,
          currency: formData.currency,
          bankName: formData.bankName || undefined,
          bankAccountNumber: formData.bankAccountNumber || undefined,
          ifscCode: formData.ifscCode || undefined,
          branchName: formData.branchName || undefined,
          pfNumber: formData.pfNumber || undefined,
          uanNumber: formData.uanNumber || undefined,
          esiNumber: formData.esiNumber || undefined,
          panNumber: formData.panNumber || undefined,
          aadhaarNumber: formData.aadhaarNumber || undefined,

          aadhaarCardUrl: formData.aadhaarCardUrl || undefined,
          panCardUrl: formData.panCardUrl || undefined,
          addressProofUrl: formData.addressProofUrl || undefined,
          educationCertificateUrl: formData.educationCertificateUrl || undefined,
          experienceCertificateUrl: formData.experienceCertificateUrl || undefined,
          resumeUrl: formData.resumeUrl || undefined,

          permissions: formData.permissions ? JSON.parse(formData.permissions) : undefined,

          emergencyContactName: formData.emergencyContactName || undefined,
          emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
          emergencyContactPhone: formData.emergencyContactPhone || undefined,
          emergencyContactAddress: formData.emergencyContactAddress || undefined,

          languagesKnown: formData.languagesKnown || undefined,
          linkedinProfile: formData.linkedinProfile || undefined,
          githubProfile: formData.githubProfile || undefined,
          previousCompany: formData.previousCompany || undefined,
          referralSource: formData.referralSource || undefined,
          notes: formData.notes || undefined,
          gender: formData.gender,
          maritalStatus: formData.maritalStatus || undefined,
          bloodGroup: formData.bloodGroup || undefined,
          nationality: formData.nationality || undefined,
          govtIdType: formData.govtIdType || govtIdType,
          personalIdNumber: formData.personalIdNumber || undefined,
          middleName: formData.middleName || undefined,
          officeEmail: formData.officeEmail || undefined,
        };

        const employeeRes = await fetch('/api/employees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(employeePayload)
        });

        if (!employeeRes.ok) {
          const errorData = await employeeRes.json();
          throw new Error(errorData.message || 'Failed to create employee profile mapping');
        }

        // Remove completed draft from database after successful onboarding
        if (activeDraftId) {
          try {
            await fetch(`/api/employees/drafts?id=${encodeURIComponent(activeDraftId)}`, {
              method: 'DELETE',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
          } catch (draftCleanupErr) {
            console.warn('Could not clean up submitted draft:', draftCleanupErr);
          }
        }

        toast.success('Employee successfully onboarded!');
        router.push('/dashboard/employees');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'An error occurred during submission.';
      toast.error(msg);
      if (msg.toLowerCase().includes('username')) {
        setUsernameConflictError(msg);
        setErrors((prev) => ({ ...prev, username: msg }));
        setActiveStep('access');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (msg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: msg }));
        setActiveStep('personal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (msg.toLowerCase().includes('phone')) {
        setErrors((prev) => ({ ...prev, phone: msg }));
        setActiveStep('personal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#fdfcfc] md:text-3xl">
              {employeeEditId ? 'Edit Employee Profile' : 'Add New Employee'}
            </h1>
            {!employeeEditId && activeDraftId && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/25">
                <Clock className="h-3 w-3" />
                {savingDraft
                  ? 'Saving draft...'
                  : lastDraftSavedAt
                    ? `Draft saved ${new Date(lastDraftSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Draft active'}
              </span>
            )}
            {!employeeEditId && !activeDraftId && savingDraft && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving draft...
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-[#b1b1b1] mt-1">
            {employeeEditId
              ? 'Update employee details and system credentials in the organization.'
              : 'Create a complete employee profile. Progress auto-saves as a draft so you can resume anytime from any device.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!employeeEditId && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDraftsPanel((prev) => !prev)}
                className="border-[#e6e4e6]/40 dark:border-[#2f3035]/60 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2 cursor-pointer"
              >
                <FolderOpen className="h-4 w-4 text-[#f87941]" />
                Saved Drafts
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-[#f87941]/15 text-[#f87941]">
                  {savedDrafts.length}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={savingDraft || draftMigrationPending}
                onClick={() => void saveDraftToDatabase({ silent: false })}
                className="border-[#f87941]/40 text-[#f87941] hover:bg-[#f87941]/10 font-semibold flex items-center gap-2 cursor-pointer"
              >
                {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Draft
              </Button>
            </>
          )}
          <Link href={employeeEditId ? `/dashboard/employees/${employeeEditId}` : "/dashboard/employees"}>
            <Button variant="outline" className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> {employeeEditId ? 'Back to Employee Profile' : 'Back to Employees'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Collapsible Saved Drafts Drawer (Multi-employee & multi-device) */}
      {!employeeEditId && showDraftsPanel && (
        <Card className="mb-8 bg-white dark:bg-[#1E1F22] border border-[#f87941]/30 shadow-sm animate-in fade-in duration-200">
          <CardHeader className="pb-3 border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-[#f87941]" />
                Saved Employee Drafts ({savedDrafts.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-[#b1b1b1]">
                Resume an incomplete employee onboarding form from any device, or start a blank form.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {activeDraftId && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleStartBlankForm}
                  className="text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Start Blank Form
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void fetchSavedDrafts()}
                disabled={loadingDrafts}
                className="text-xs cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingDrafts ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {draftMigrationPending ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Database migration <code>20261118_employee_drafts.sql</code> has not been applied yet. Run the migration in Supabase to enable multi-device database drafts.
              </p>
            ) : loadingDrafts ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading saved drafts...
              </div>
            ) : savedDrafts.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-[#b1b1b1] py-3">
                No saved employee drafts yet. Start filling the form or click <strong>Save Draft</strong> to save your progress.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedDrafts.map((draft) => {
                  const stepLabel = STEPS.find((s) => s.id === draft.currentStep)?.name || draft.currentStep;
                  const isCurrent = activeDraftId === draft.id;
                  return (
                    <div
                      key={draft.id}
                      className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-colors ${
                        isCurrent
                          ? 'border-[#f87941] bg-[#f87941]/5'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-slate-900/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-[#fdfcfc] truncate">
                            {draft.displayName}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f87941] text-white shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {[draft.email, draft.department, draft.designation].filter(Boolean).join(' • ') || 'Basic info pending'}
                        </p>
                        <div className="pt-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                            <span>Step: <strong className="text-slate-700 dark:text-slate-200">{stepLabel}</strong></span>
                            <span className="font-semibold text-[#f87941]">{draft.completionPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#f87941] rounded-full transition-all"
                              style={{ width: `${Math.max(4, draft.completionPercent)}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 pt-1">
                          Updated {new Date(draft.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          {draft.updatedByName ? ` by ${draft.updatedByName}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => applyDraftToForm(draft, true)}
                          className="h-7 text-xs bg-[#f87941] hover:bg-[#e06634] text-white flex-1 cursor-pointer"
                        >
                          {isCurrent ? 'Continue Editing' : 'Resume Draft'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleDeleteDraft(draft.id)}
                          aria-label={`Delete draft ${draft.displayName}`}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        {/* Left Side: Sticky Progress Tracker */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 scrollbar-none">
          <div className="flex flex-col gap-1 border-l border-[#e6e4e6]/30 dark:border-[#2f3035]/30 ml-4 py-2">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === step.id;
              const isCompleted = idx < STEPS.findIndex((s) => s.id === activeStep);
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  className="flex items-start gap-4 pl-4 py-3 text-left relative transition-all duration-300 group outline-none"
                >
                  {/* Indicator Line segment */}
                  <div className={`absolute left-[-1px] top-0 bottom-0 w-[2px] transition-all duration-300 ${
                    isActive ? 'bg-[#f87941]' : 'bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                  }`} />
                  
                  {/* Step index sphere */}
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full border transition-all duration-300 text-xs font-bold ${
                    isActive 
                      ? 'border-[#f87941] bg-[#f87941] text-white shadow-[0_0_12px_rgba(248,121,65,0.2)]' 
                      : isCompleted
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : 'border-[#e6e4e6]/30 dark:border-[#2f3035]/30 bg-white dark:bg-[#1E1F22] text-[#b1b1b1] group-hover:border-[#e6e4e6]/50 dark:group-hover:border-[#2f3035]/50 group-hover:text-slate-700 dark:group-hover:text-zinc-100'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
                  </div>

                  <div>
                    <span className={`block text-sm font-semibold transition-all duration-300 ${
                      isActive ? 'text-[#f87941] font-bold' : 'text-[#b1b1b1] group-hover:text-slate-700 dark:group-hover:text-zinc-100'
                    }`}>
                      {step.name}
                    </span>
                    <span className="block text-xs text-[#b1b1b1]/70 mt-0.5 line-clamp-1">{step.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Section Content */}
        <div className="lg:col-span-9 flex flex-col gap-8">

        {/* Right Side: Active Section Content */}
        <div className="lg:col-span-9 flex flex-col gap-8">
          {/* Section 1: Personal Info */}
          {activeStep === 'personal' && (
          <div ref={sectionRefs.personal} id="personal" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#f87941]" /> Personal Information
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Basic personal, identification, and contact information.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="firstName" className="text-slate-700 dark:text-[#fdfcfc]">First Name <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('firstName')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <span className="text-xs text-red-500 mt-1 block">{errors.firstName}</span>}
                </div>
                <div>
                  <Label htmlFor="middleName" className="text-slate-700 dark:text-[#fdfcfc]">Middle Name</Label>
                  <Input 
                    id="middleName" 
                    name="middleName" 
                    value={formData.middleName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('middleName')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter middle name"
                  />
                  {errors.middleName && <span className="text-xs text-red-500 mt-1 block">{errors.middleName}</span>}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-slate-700 dark:text-[#fdfcfc]">Last Name <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('lastName')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <span className="text-xs text-red-500 mt-1 block">{errors.lastName}</span>}
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-700 dark:text-[#fdfcfc]">Primary Email <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('email')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="personal@company.com"
                  />
                  {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-slate-700 dark:text-[#fdfcfc]">Phone Number <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('phone')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter 10-digit mobile number"
                  />
                  {errors.phone && <span className="text-xs text-red-500 mt-1 block">{errors.phone}</span>}
                </div>
                <div>
                  <Label htmlFor="gender" className="text-slate-700 dark:text-[#fdfcfc]">Gender</Label>
                  <select 
                    id="gender" 
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="Male" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Male</option>
                    <option value="Female" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Female</option>
                    <option value="Other" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-slate-700 dark:text-[#fdfcfc]">Date of Birth</Label>
                  <Input 
                    id="dateOfBirth" 
                    name="dateOfBirth" 
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('dateOfBirth')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2" 
                  />
                  {errors.dateOfBirth && <span className="text-xs text-red-500 mt-1 block">{errors.dateOfBirth}</span>}
                </div>
                <div>
                  <Label htmlFor="maritalStatus" className="text-slate-700 dark:text-[#fdfcfc]">Marital Status</Label>
                  <select 
                    id="maritalStatus" 
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Select status</option>
                    <option value="Single" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Single</option>
                    <option value="Married" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Married</option>
                    <option value="Divorced" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Divorced</option>
                    <option value="Widowed" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Widowed</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="bloodGroup" className="text-slate-700 dark:text-[#fdfcfc]">Blood Group</Label>
                  <select 
                    id="bloodGroup" 
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Select Blood Group</option>
                    <option value="A+" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">A+</option>
                    <option value="A-" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">A-</option>
                    <option value="B+" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">B+</option>
                    <option value="B-" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">B-</option>
                    <option value="AB+" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">AB+</option>
                    <option value="AB-" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">AB-</option>
                    <option value="O+" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">O+</option>
                    <option value="O-" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">O-</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="nationality" className="text-slate-700 dark:text-[#fdfcfc]">Nationality</Label>
                  <select 
                    id="nationality" 
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Select Nationality</option>
                    <option value="Indian" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Indian</option>
                    <option value="American" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">American</option>
                    <option value="British" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">British</option>
                    <option value="Canadian" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Canadian</option>
                    <option value="Australian" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Australian</option>
                    <option value="Singaporean" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Singaporean</option>
                    <option value="German" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">German</option>
                    <option value="French" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">French</option>
                    <option value="Other" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="govtIdType" className="text-slate-700 dark:text-[#fdfcfc]">Govt ID Type</Label>
                  <select 
                    id="govtIdType" 
                    value={formData.govtIdType || govtIdType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setGovtIdType(newType);
                      setFormData((prev) => ({ ...prev, govtIdType: newType }));
                      if (formData.personalIdNumber) {
                        const err = validatePersonalIdByGovtId(formData.personalIdNumber, newType);
                        setErrors((prev) => {
                          const copy = { ...prev };
                          if (err) copy.personalIdNumber = err;
                          else delete copy.personalIdNumber;
                          return copy;
                        });
                      } else if (errors.personalIdNumber) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.personalIdNumber;
                          return copy;
                        });
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Social Security Number">Social Security Number</option>
                    <option value="Passport">Passport</option>
                    <option value="Driver License">Driver License</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-3">
                  <Label htmlFor="personalIdNumber" className="text-slate-700 dark:text-[#fdfcfc]">Personal ID Number ({formData.govtIdType || govtIdType})</Label>
                  <Input 
                    id="personalIdNumber" 
                    name="personalIdNumber" 
                    value={formData.personalIdNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('personalIdNumber')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder={getGovtIdPlaceholder(formData.govtIdType || govtIdType)}
                  />
                  {errors.personalIdNumber && <span className="text-xs text-red-500 mt-1 block">{errors.personalIdNumber}</span>}
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                    disabled={true}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 2: Work Info */}
          {activeStep === 'work' && (
          <div ref={sectionRefs.work} id="work" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#f87941]" /> Work Profile
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Positioning, manager relationship, location, and dates.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="employeeId" className="text-slate-700 dark:text-[#fdfcfc]">Employee ID <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="employeeId" 
                    name="employeeId" 
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('employeeId')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="EMP-0000"
                  />
                  {errors.employeeId && <span className="text-xs text-red-500 mt-1 block">{errors.employeeId}</span>}
                </div>
                <div>
                  <Label htmlFor="department" className="text-slate-700 dark:text-[#fdfcfc]">Department <span className="text-[#f87941]">*</span></Label>
                  <select 
                    id="department" 
                    name="department" 
                    value={formData.department}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('department')}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Select Department</option>
                    <option value="Engineering" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Engineering</option>
                    <option value="HR" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">HR</option>
                    <option value="Design" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Design</option>
                    <option value="Marketing" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Marketing</option>
                    <option value="Sales" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Sales</option>
                    <option value="Finance" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Finance</option>
                    <option value="Operations" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Operations</option>
                    <option value="Support" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Support</option>
                    <option value="Legal" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Legal</option>
                  </select>
                  {errors.department && <span className="text-xs text-red-500 mt-1 block">{errors.department}</span>}
                </div>
                <div>
                  <Label htmlFor="designation" className="text-slate-700 dark:text-[#fdfcfc]">Designation <span className="text-[#f87941]">*</span></Label>
                  <select 
                    id="designation" 
                    name="designation" 
                    value={formData.designation}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('designation')}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Select Designation</option>
                    <option value="Software Engineer" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Software Engineer</option>
                    <option value="Senior Software Engineer" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Senior Software Engineer</option>
                    <option value="Tech Lead" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Tech Lead</option>
                    <option value="Staff Engineer" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Staff Engineer</option>
                    <option value="Engineering Manager" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Engineering Manager</option>
                    <option value="Product Manager" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Product Manager</option>
                    <option value="HR Specialist" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">HR Specialist</option>
                    <option value="HR Manager" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">HR Manager</option>
                    <option value="UI/UX Designer" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">UI/UX Designer</option>
                    <option value="Creative Director" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Creative Director</option>
                    <option value="Financial Analyst" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Financial Analyst</option>
                    <option value="Sales Executive" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Sales Executive</option>
                    <option value="Marketing Manager" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Marketing Manager</option>
                  </select>
                  {errors.designation && <span className="text-xs text-red-500 mt-1 block">{errors.designation}</span>}
                </div>
                <div>
                  <Label htmlFor="employmentType" className="text-slate-700 dark:text-[#fdfcfc]">Employment Type</Label>
                  <select 
                    id="employmentType" 
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="Full-Time" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Full-Time</option>
                    <option value="Part-Time" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Part-Time</option>
                    <option value="Contract" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Contract</option>
                    <option value="Intern" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Intern</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dateOfJoining" className="text-slate-700 dark:text-[#fdfcfc]">Date of Joining <span className="text-[#f87941]">*</span></Label>
                  <Input 
                    id="dateOfJoining" 
                    name="dateOfJoining" 
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('dateOfJoining')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2" 
                  />
                  {errors.dateOfJoining && <span className="text-xs text-red-500 mt-1 block">{errors.dateOfJoining}</span>}
                </div>
                <div>
                  <Label htmlFor="managerId" className="text-slate-700 dark:text-[#fdfcfc]">Reporting Manager</Label>
                  <select 
                    id="managerId" 
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                    disabled={loadingManagers}
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                      {loadingManagers ? 'Loading managers...' : 'Select Reporting Manager'}
                    </option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id} className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                        {m.firstName} {m.lastName} {m.designation ? `(${m.designation})` : m.role ? `(${m.role})` : m.email ? `(${m.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="buddy" className="text-slate-700 dark:text-[#fdfcfc]">Buddy Assigned</Label>
                  <select
                    id="buddy"
                    name="buddy"
                    value={formData.buddy}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                    disabled={loadingManagers}
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                      {loadingManagers ? 'Loading colleagues...' : 'Select Onboarding Buddy (or None)'}
                    </option>
                    {formData.buddy && !colleagues.some(c => `${c.firstName} ${c.lastName}`.trim() === formData.buddy) && (
                      <option value={formData.buddy} className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                        {formData.buddy} (Current)
                      </option>
                    )}
                    {colleagues.map((c: any) => {
                      const fullName = `${c.firstName} ${c.lastName}`.trim();
                      const label = `${fullName} ${c.designation ? `(${c.designation})` : c.role ? `(${c.role})` : ''}`.trim();
                      return (
                        <option key={`buddy-${c.id}`} value={fullName} className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <Label htmlFor="mentor" className="text-slate-700 dark:text-[#fdfcfc]">Mentor Assigned</Label>
                  <select
                    id="mentor"
                    name="mentor"
                    value={formData.mentor}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                    disabled={loadingManagers}
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                      {loadingManagers ? 'Loading colleagues...' : 'Select Mentor (or None)'}
                    </option>
                    {formData.mentor && !colleagues.some(c => `${c.firstName} ${c.lastName}`.trim() === formData.mentor) && (
                      <option value={formData.mentor} className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                        {formData.mentor} (Current)
                      </option>
                    )}
                    {colleagues.map((c: any) => {
                      const fullName = `${c.firstName} ${c.lastName}`.trim();
                      const label = `${fullName} ${c.designation ? `(${c.designation})` : c.role ? `(${c.role})` : ''}`.trim();
                      return (
                        <option key={`mentor-${c.id}`} value={fullName} className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <Label htmlFor="probationPeriod" className="text-slate-700 dark:text-[#fdfcfc]">Probation Period (months)</Label>
                  <Input 
                    id="probationPeriod" 
                    name="probationPeriod" 
                    type="number"
                    value={formData.probationPeriod}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. 6"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmationDate" className="text-slate-700 dark:text-[#fdfcfc]">Confirmation Date</Label>
                  <Input 
                    id="confirmationDate" 
                    name="confirmationDate" 
                    type="date"
                    value={formData.confirmationDate}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2" 
                  />
                </div>
                <div>
                  <Label htmlFor="workLocation" className="text-slate-700 dark:text-[#fdfcfc]">Work Location</Label>
                  <Input 
                    id="workLocation" 
                    name="workLocation" 
                    value={formData.workLocation}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. Bangalore Office"
                  />
                </div>
                <div>
                  <Label htmlFor="workShift" className="text-slate-700 dark:text-[#fdfcfc]">Work Shift</Label>
                  <select 
                    id="workShift" 
                    name="workShift"
                    value={formData.workShift}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Select Shift</option>
                    <option value="Day Shift" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Day Shift (9 AM - 6 PM)</option>
                    <option value="Night Shift" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Night Shift (10 PM - 7 AM)</option>
                    <option value="Morning Shift" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Morning Shift (6 AM - 3 PM)</option>
                    <option value="Evening Shift" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Evening Shift (2 PM - 11 PM)</option>
                    <option value="Rotating Shift" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Rotating Shift</option>
                    <option value="Flexible Hours" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Flexible Hours</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="noticePeriod" className="text-slate-700 dark:text-[#fdfcfc]">Notice Period (days)</Label>
                  <Input 
                    id="noticePeriod" 
                    name="noticePeriod" 
                    type="number"
                    value={formData.noticePeriod}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. 90"
                  />
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 3: Compensation & Payroll */}
          {activeStep === 'payroll' && (
          <div ref={sectionRefs.payroll} id="payroll" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#f87941]" /> Compensation & Payroll
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Salary structure, bank details, tax compliance numbers.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="salary" className="text-slate-700 dark:text-[#fdfcfc]">Monthly Base Salary</Label>
                  <Input 
                    id="salary" 
                    name="salary" 
                    type="number"
                    min="0"
                    max="100000000"
                    step="0.01"
                    value={formData.salary}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('salary')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.salary ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="e.g. 50000"
                  />
                  {errors.salary && <span className="text-xs text-red-500 mt-1 block">{errors.salary}</span>}
                </div>
                <div>
                  <Label htmlFor="hourlyRate" className="text-slate-700 dark:text-[#fdfcfc]">Hourly Rate</Label>
                  <Input 
                    id="hourlyRate" 
                    name="hourlyRate" 
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('hourlyRate')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.hourlyRate ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="e.g. 500"
                  />
                  {errors.hourlyRate && <span className="text-xs text-red-500 mt-1 block">{errors.hourlyRate}</span>}
                </div>
                <div>
                  <Label htmlFor="ctc" className="text-slate-700 dark:text-[#fdfcfc]">CTC (Cost to Company) Annual</Label>
                  <Input 
                    id="ctc" 
                    name="ctc" 
                    type="number"
                    min="0"
                    max="1000000000"
                    step="0.01"
                    value={formData.ctc}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('ctc')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.ctc ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="e.g. 600000"
                  />
                  {errors.ctc && <span className="text-xs text-red-500 mt-1 block">{errors.ctc}</span>}
                </div>
                <div>
                  <Label htmlFor="currency" className="text-slate-700 dark:text-[#fdfcfc]">Salary Currency</Label>
                  <select 
                    id="currency" 
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('currency')}
                    className={`flex h-10 w-full rounded-md border bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none ${
                      errors.currency ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                  >
                    <option value="INR" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">INR (₹)</option>
                    <option value="USD" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">USD ($)</option>
                    <option value="EUR" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">EUR (€)</option>
                    <option value="GBP" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">GBP (£)</option>
                    <option value="AED" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">AED (د.إ)</option>
                    <option value="SGD" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">SGD ($)</option>
                    <option value="CAD" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">CAD ($)</option>
                    <option value="AUD" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">AUD ($)</option>
                  </select>
                  {errors.currency && <span className="text-xs text-red-500 mt-1 block">{errors.currency}</span>}
                </div>
                <div>
                  <Label htmlFor="bankName" className="text-slate-700 dark:text-[#fdfcfc]">Bank Name</Label>
                  <Input 
                    id="bankName" 
                    name="bankName" 
                    maxLength={100}
                    value={formData.bankName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('bankName')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.bankName ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="e.g. Union Bank of India"
                  />
                  {errors.bankName && <span className="text-xs text-red-500 mt-1 block">{errors.bankName}</span>}
                </div>
                <div>
                  <Label htmlFor="bankAccountNumber" className="text-slate-700 dark:text-[#fdfcfc]">Account Number</Label>
                  <Input 
                    id="bankAccountNumber" 
                    name="bankAccountNumber" 
                    maxLength={22}
                    value={formData.bankAccountNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('bankAccountNumber')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.bankAccountNumber ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="9–18 digit account number"
                  />
                  {errors.bankAccountNumber && <span className="text-xs text-red-500 mt-1 block">{errors.bankAccountNumber}</span>}
                </div>
                <div>
                  <Label htmlFor="ifscCode" className="text-slate-700 dark:text-[#fdfcfc]">IFSC Code</Label>
                  <Input 
                    id="ifscCode" 
                    name="ifscCode" 
                    maxLength={11}
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('ifscCode')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 uppercase ${
                      errors.ifscCode ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="e.g. SBIN0001234"
                  />
                  {errors.ifscCode && <span className="text-xs text-red-500 mt-1 block">{errors.ifscCode}</span>}
                </div>
                <div>
                  <Label htmlFor="branchName" className="text-slate-700 dark:text-[#fdfcfc]">Branch Name</Label>
                  <Input 
                    id="branchName" 
                    name="branchName" 
                    maxLength={100}
                    value={formData.branchName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('branchName')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.branchName ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="e.g. MG Road Branch, Bengaluru"
                  />
                  {errors.branchName && <span className="text-xs text-red-500 mt-1 block">{errors.branchName}</span>}
                </div>
                <div>
                  <Label htmlFor="pfNumber" className="text-slate-700 dark:text-[#fdfcfc]">Provident Fund (PF) No.</Label>
                  <Input 
                    id="pfNumber" 
                    name="pfNumber" 
                    maxLength={30}
                    value={formData.pfNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('pfNumber')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 uppercase ${
                      errors.pfNumber ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="e.g. MH/BAN/0012345/000/0000123"
                  />
                  {errors.pfNumber && <span className="text-xs text-red-500 mt-1 block">{errors.pfNumber}</span>}
                </div>
                <div>
                  <Label htmlFor="uanNumber" className="text-slate-700 dark:text-[#fdfcfc]">Universal Account Number (UAN)</Label>
                  <Input 
                    id="uanNumber" 
                    name="uanNumber" 
                    maxLength={14}
                    value={formData.uanNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('uanNumber')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.uanNumber ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="12-digit UAN (e.g. 100123456789)"
                  />
                  {errors.uanNumber && <span className="text-xs text-red-500 mt-1 block">{errors.uanNumber}</span>}
                </div>
                <div>
                  <Label htmlFor="esiNumber" className="text-slate-700 dark:text-[#fdfcfc]">ESI Number</Label>
                  <Input 
                    id="esiNumber" 
                    name="esiNumber" 
                    maxLength={21}
                    value={formData.esiNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('esiNumber')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.esiNumber ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="10-digit IP No. or 17-digit ESIC"
                  />
                  {errors.esiNumber && <span className="text-xs text-red-500 mt-1 block">{errors.esiNumber}</span>}
                </div>
                <div>
                  <Label htmlFor="panNumber" className="text-slate-700 dark:text-[#fdfcfc]">PAN Number</Label>
                  <Input 
                    id="panNumber" 
                    name="panNumber" 
                    maxLength={10}
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('panNumber')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 uppercase ${
                      errors.panNumber ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="e.g. ABCDE1234F"
                  />
                  {errors.panNumber && <span className="text-xs text-red-500 mt-1 block">{errors.panNumber}</span>}
                </div>
                <div>
                  <Label htmlFor="aadhaarNumber" className="text-slate-700 dark:text-[#fdfcfc]">Aadhaar Number</Label>
                  <Input 
                    id="aadhaarNumber" 
                    name="aadhaarNumber" 
                    maxLength={14}
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('aadhaarNumber')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.aadhaarNumber ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="12-digit number"
                  />
                  {errors.aadhaarNumber && <span className="text-xs text-red-500 mt-1 block">{errors.aadhaarNumber}</span>}
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 4: Documents & Compliance */}
          {activeStep === 'documents' && (
          <div ref={sectionRefs.documents} id="documents" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#f87941]" /> Documents & Compliance
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Onboarding attachments, proof of identity, educational qualifications.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {[
                  { id: 'aadhaarCardUrl', label: 'Aadhaar Card Copy' },
                  { id: 'panCardUrl', label: 'PAN Card Copy' },
                  { id: 'addressProofUrl', label: 'Address Proof' },
                  { id: 'educationCertificateUrl', label: 'Educational Certificates' },
                  { id: 'experienceCertificateUrl', label: 'Experience Letters' },
                  { id: 'resumeUrl', label: 'Resume/CV' },
                ].map((doc) => (
                  <div key={doc.id} className="border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg p-4 bg-[#e6e4e6]/5 dark:bg-[#2f3035]/5 flex flex-col justify-between min-h-[140px] hover:border-[#f87941]/50 transition-colors">
                    <div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.label}</span>
                      <p className="text-xs text-slate-500 dark:text-[#b1b1b1] mt-1">Upload verified PDF or image copy.</p>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <Label htmlFor={doc.id} className="cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 text-slate-700 dark:text-[#fdfcfc] px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors">
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                        {uploadingField === doc.id ? 'Uploading...' : 'Choose File'}
                      </Label>
                      <input 
                        type="file" 
                        id={doc.id} 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, doc.id)}
                        disabled={uploadingField !== null}
                      />
                      {formData[doc.id as keyof typeof formData] ? (
                        <span className="text-xs text-[#f87941] flex items-center gap-1.5 font-medium">
                          <Check className="h-3.5 w-3.5" /> Uploaded
                        </span>
                      ) : (
                        <span className="text-xs text-[#b1b1b1]">No file uploaded</span>
                      )}
                    </div>
                  </div>
                ))}
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-2 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 5: System Access */}
          {activeStep === 'access' && (
          <div ref={sectionRefs.access} id="access" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#f87941]" /> System Access & Credentials
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Establish authentication parameters and roles.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="username" className="text-slate-700 dark:text-[#fdfcfc]">Username</Label>
                    <button
                      type="button"
                      disabled={generatingUsername || (!formData.firstName.trim() && !formData.lastName.trim())}
                      onClick={() => {
                        setUsernameManuallyEdited(false);
                        void generateUniqueUsernameFromName(
                          formData.firstName,
                          formData.lastName,
                          formData.middleName,
                          formData.userId
                        );
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f87941] hover:text-[#e06634] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Auto-generate a unique username from First and Last Name"
                    >
                      <RefreshCw className={`h-3 w-3 ${generatingUsername ? 'animate-spin' : ''}`} />
                      Auto-generate
                    </button>
                  </div>
                  <Input 
                    id="username" 
                    name="username" 
                    value={formData.username}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('username')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.username ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="e.g. john.doe"
                  />
                  {(checkingUsername || generatingUsername) && (
                    <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> {generatingUsername ? 'Generating unique username...' : 'Checking username availability...'}
                    </span>
                  )}
                  {errors.username && <span className="text-xs text-red-500 mt-1 block">{errors.username}</span>}
                  {!errors.username && !checkingUsername && !generatingUsername && (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {!usernameManuallyEdited && formData.username
                        ? 'Auto-generated from name (editable — you can customize your own).'
                        : 'You can enter a custom username or click Auto-generate.'}
                    </span>
                  )}
                  {usernameSuggestion && (
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Available suggestion:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, username: usernameSuggestion }));
                          setUsernameManuallyEdited(true);
                          setUsernameConflictError(null);
                          setUsernameSuggestion(null);
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.username;
                            return copy;
                          });
                        }}
                        className="px-2 py-0.5 rounded bg-[#f87941]/10 text-[#f87941] font-semibold hover:bg-[#f87941]/20 transition-colors cursor-pointer"
                      >
                        Use {usernameSuggestion}
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="officeEmail" className="text-slate-700 dark:text-[#fdfcfc]">Office/Work Email</Label>
                  <Input 
                    id="officeEmail" 
                    name="officeEmail" 
                    type="email"
                    value={formData.officeEmail}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('officeEmail')}
                    className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 ${
                      errors.officeEmail ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                    }`}
                    placeholder="john@company.com"
                  />
                  {errors.officeEmail && <span className="text-xs text-red-500 mt-1 block">{errors.officeEmail}</span>}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="password" className="text-slate-700 dark:text-[#fdfcfc]">
                      {employeeEditId ? 'Change Password (optional)' : 'Initial Password'} {!employeeEditId && <span className="text-[#f87941]">*</span>}
                    </Label>
                    {employeeEditId && hasExistingAccount && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Configured
                      </span>
                    )}
                  </div>
                  <div className="relative mt-2">
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur('password')}
                      className={`bg-white dark:bg-slate-950 border text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] pr-10 ${
                        errors.password ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'
                      }`}
                      placeholder={employeeEditId ? '•••••••• (unchanged — enter only to reset)' : '••••••••'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>}
                  {employeeEditId ? (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Password is already set on this account. Leave empty to keep it unchanged.
                    </span>
                  ) : formData.employeeId ? (
                    <span className="text-[10px] text-[#f87941]/90 mt-1 block font-semibold">
                      Auto-generated: Welcome@{formData.employeeId}
                    </span>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="role" className="text-slate-700 dark:text-[#fdfcfc]">System Role</Label>
                  <select 
                    id="role" 
                    name="role"
                    value={formData.role}
                    onChange={(e) => {
                      const selectedRole = e.target.value;
                      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[selectedRole] || ['read:dashboard', 'read:employees'];
                      setFormData(prev => ({
                        ...prev,
                        role: selectedRole,
                        permissions: JSON.stringify(defaultPerms)
                      }));
                    }}
                    className="flex h-10 w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] focus:border-[#f87941] mt-2 outline-none"
                  >
                    <option value="admin" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Admin</option>
                    <option value="hr_manager" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">HR Manager</option>
                    <option value="cms_administrator" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">CMS Administrator</option>
                    <option value="project_manager" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Project Manager</option>
                    <option value="developer" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Developer</option>
                    <option value="qa_engineer" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">QA Engineer</option>
                    <option value="devops_engineer" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">DevOps Engineer</option>
                    <option value="ui_ux_designer" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">UI/UX Designer</option>
                    <option value="intern" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Intern</option>
                    <option value="business_development" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Business Development</option>
                    <option value="digital_marketing" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Digital Marketing</option>
                    <option value="business_analyst" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Business Analyst</option>
                    <option value="management" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Management</option>
                    <option value="architect" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Architect</option>
                    <option value="client" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Client</option>
                  </select>
                </div>
                <div className="md:col-span-3 mt-4">
                  <Label className="text-slate-700 dark:text-[#fdfcfc] font-bold text-sm block mb-4">
                    Active System Access Permissions
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const parsedPerms = (() => {
                        try {
                          return JSON.parse(formData.permissions) || [];
                        } catch {
                          return [];
                        }
                      })();
                      const isChecked = parsedPerms.includes(perm.key);
                      return (
                        <div 
                          key={perm.key}
                          onClick={() => {
                            let nextPerms = [...parsedPerms];
                            if (nextPerms.includes(perm.key)) {
                              nextPerms = nextPerms.filter(p => p !== perm.key);
                            } else {
                              nextPerms.push(perm.key);
                            }
                            setFormData(prev => ({
                              ...prev,
                              permissions: JSON.stringify(nextPerms)
                            }));
                          }}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                            isChecked 
                              ? 'border-[#f87941] bg-[#f87941]/5 shadow-[0_2px_8px_rgba(248,121,65,0.05)]' 
                              : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-300 ${
                            isChecked 
                              ? 'border-[#f87941] bg-[#f87941] text-white' 
                              : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-slate-950'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{perm.name}</span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{perm.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 6: Emergency Contact */}
          {activeStep === 'emergency' && (
          <div ref={sectionRefs.emergency} id="emergency" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-[#f87941]" /> Emergency Contact
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Primary family member or legal contact details.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="emergencyContactName" className="text-slate-700 dark:text-[#fdfcfc]">Contact Name</Label>
                  <Input 
                    id="emergencyContactName" 
                    name="emergencyContactName" 
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('emergencyContactName')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter full name"
                  />
                  {errors.emergencyContactName && <span className="text-xs text-red-500 mt-1 block">{errors.emergencyContactName}</span>}
                </div>
                <div>
                  <Label htmlFor="emergencyContactRelationship" className="text-slate-700 dark:text-[#fdfcfc]">Relationship</Label>
                  <Input 
                    id="emergencyContactRelationship" 
                    name="emergencyContactRelationship" 
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('emergencyContactRelationship')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. Spouse, Father"
                  />
                  {errors.emergencyContactRelationship && <span className="text-xs text-red-500 mt-1 block">{errors.emergencyContactRelationship}</span>}
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone" className="text-slate-700 dark:text-[#fdfcfc]">Phone Number</Label>
                  <Input 
                    id="emergencyContactPhone" 
                    name="emergencyContactPhone" 
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('emergencyContactPhone')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Enter phone number"
                  />
                  {errors.emergencyContactPhone && <span className="text-xs text-red-500 mt-1 block">{errors.emergencyContactPhone}</span>}
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="emergencyContactAddress" className="text-slate-700 dark:text-[#fdfcfc]">Full Residential Address</Label>
                  <textarea 
                    id="emergencyContactAddress" 
                    name="emergencyContactAddress" 
                    value={formData.emergencyContactAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="flex w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 outline-none" 
                    placeholder="Enter full address details"
                  />
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 7: Additional Info */}
          {activeStep === 'additional' && (
          <div ref={sectionRefs.additional} id="additional" className="scroll-mt-24">
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <Info className="h-5 w-5 text-[#f87941]" /> Additional Information
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Social footprints, languages, referrals, and custom notes.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <Label htmlFor="languagesKnown" className="text-slate-700 dark:text-[#fdfcfc]">Languages Known</Label>
                  <Input 
                    id="languagesKnown" 
                    name="languagesKnown" 
                    value={formData.languagesKnown}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. English, Hindi"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedinProfile" className="text-slate-700 dark:text-[#fdfcfc]">LinkedIn Profile URL</Label>
                  <Input 
                    id="linkedinProfile" 
                    name="linkedinProfile" 
                    value={formData.linkedinProfile}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('linkedinProfile')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="https://linkedin.com/in/..."
                  />
                  {errors.linkedinProfile && <span className="text-xs text-red-500 mt-1 block">{errors.linkedinProfile}</span>}
                </div>
                <div>
                  <Label htmlFor="githubProfile" className="text-slate-700 dark:text-[#fdfcfc]">GitHub Profile URL</Label>
                  <Input 
                    id="githubProfile" 
                    name="githubProfile" 
                    value={formData.githubProfile}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('githubProfile')}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="https://github.com/..."
                  />
                  {errors.githubProfile && <span className="text-xs text-red-500 mt-1 block">{errors.githubProfile}</span>}
                </div>
                <div>
                  <Label htmlFor="previousCompany" className="text-slate-700 dark:text-[#fdfcfc]">Previous Company</Label>
                  <Input 
                    id="previousCompany" 
                    name="previousCompany" 
                    value={formData.previousCompany}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="Previous Employer Name"
                  />
                </div>
                <div>
                  <Label htmlFor="referralSource" className="text-slate-700 dark:text-[#fdfcfc]">Referral Source / Channel</Label>
                  <Input 
                    id="referralSource" 
                    name="referralSource" 
                    value={formData.referralSource}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-slate-950 border-gray-200 dark:border-zinc-800 text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2" 
                    placeholder="e.g. Job Board, In-house"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="notes" className="text-slate-700 dark:text-[#fdfcfc]">Internal HR Notes</Label>
                  <textarea 
                    id="notes" 
                    name="notes" 
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="flex w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-[#fdfcfc] placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#f87941] mt-2 outline-none" 
                    placeholder="Any specific comments or notes regarding candidates onboarding..."
                  />
                </div>
                {/* Wizard Navigation Footer */}
                <div className="col-span-1 md:col-span-3 flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                  >
                    Save & Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Section 8: Review & Confirm */}
          {activeStep === 'review' && (
          <div ref={sectionRefs.review} id="review" className="scroll-mt-24">
            <Card className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-[#f87941]/30 shadow-sm">
              <CardHeader className="border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-[#fdfcfc] flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#f87941]" /> Review & Confirm
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-[#b1b1b1]">Please review primary information prior to profile compilation.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col gap-6">
                <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg p-4 border border-gray-200 dark:border-zinc-800/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-[#b1b1b1] block">Onboarding Name</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {formData.firstName} {formData.middleName} {formData.lastName || '(None)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#b1b1b1] block">Personal Email</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{formData.email || '(None)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#b1b1b1] block">Employee ID & Role</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {formData.employeeId || '(None)'} ({formData.designation || '(None)'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#b1b1b1] block">System Access Role</span>
                    <span className="text-[#f87941] font-semibold">{formData.role}</span>
                  </div>
                </div>

                {/* Wizard Navigation Footer */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <div className="flex gap-4">
                    <Link href={employeeEditId ? `/dashboard/employees/${employeeEditId}` : "/dashboard/employees"}>
                      <Button variant="outline" className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 text-slate-700 dark:text-[#fdfcfc]">
                        Cancel
                      </Button>
                    </Link>
                    <Button 
                      onClick={handleSubmit} 
                      className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)] transition-all duration-300"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> {employeeEditId ? 'Saving Changes...' : 'Onboarding...'}
                        </>
                      ) : (
                        <>
                          {employeeEditId ? 'Save Changes' : 'Complete Onboarding'} <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
