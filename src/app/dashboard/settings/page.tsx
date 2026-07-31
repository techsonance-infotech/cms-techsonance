'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, Save, Building2, Palette, Users, Plug, Plus, Key, 
  User as UserIcon, Calendar, Mail, Shield, Briefcase, Phone, 
  Banknote, Award, Globe, Fingerprint, Activity, Database, 
  MapPin, CheckCircle2, AlertTriangle, Server, 
  Settings, Sparkles, Sliders, Play, Brain, Download, Network,
  History, Search, Undo, Redo, FileCheck, Layers, FileText, 
  HelpCircle, HardDrive, Lock, RefreshCw, X, Check, Bell, Laptop, Send, Terminal, Trash, Eye, Upload,
  ChevronLeft, Clock
} from 'lucide-react';
import { DetailedPageSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { DynamicSchemaTab } from '@/components/settings/dynamic-schema-tab';
import { Switch } from '@/components/ui/switch';

import { passwordChangeFormSchema, type PasswordChangeFormValues } from '@/lib/forms/schemas';
import { UserRole, hasFullAccess } from '@/lib/permissions';
import { getStoredSessionToken } from '@/lib/client-session';

interface DocumentVaultItem {
  name: string;
  size: string;
  type: string;
  fileUrl: string;
  expiry: string;
}

// Define the comprehensive Workspace State schema combining DB configurations and persistent metadata
interface WorkspaceState {
  // DB Company Settings
  companyName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  smtpHost?: string;
  smtpPort?: number | null;
  smtpUser?: string;
  smtpPassword?: string;

  // DB Business Settings (Invoice Settings)
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  gstNo: string;
  pan: string;
  tan: string;
  registrationNo: string;
  termsAndConditions: string;
  notes: string;
  paymentTerms: string;

  // Overview Ext
  legalName: string;
  workspaceName: string;
  orgCode: string;
  businessType: string;
  industry: string;
  timezone: string;
  language: string;
  country: string;
  currency: string;
  fiscalYear: string;

  // Org Profile Ext
  cinNumber: string;
  msmeNumber: string;
  supportEmail: string;
  supportPhone: string;
  officeHours: string;
  emergencyContact: string;

  // Defaults
  defaultProbation: number;
  noticePeriod: number;
  empIdPrefix: string;
  usernamePattern: string;
  emailPattern: string;
  leavePolicy: string;
  shiftDefault: string;
  joiningWorkflow?: string;
  confirmationWorkflow?: string;
  autoEmpId?: boolean;
  workingHours?: number;
  weekendRules?: string;
  passwordPolicy?: string;
  devicePolicy?: string;
  loginRestrictions?: string;

  // Security
  mfaEnforced: boolean;
  sessionTimeout: number;
  passwordMinLength: number;
  ipWhitelist: string;
  allowedDomains: string;

  // Notifications
  notifyEmail: boolean;
  notifySms: boolean;
  notifyWhatsapp: boolean;
  notifySlack: boolean;
  notifyPush: boolean;
  notifyTeams: boolean;
  notifyDiscord: boolean;
  notifyWebhook: boolean;
  notifyBrowser: boolean;
  slackWebhookUrl: string;
  teamsWebhookUrl: string;
  discordWebhookUrl: string;
  webhookEndpointUrl: string;
  notificationTemplates: { id: string; name: string; trigger: string; channels: string[]; template: string }[];
  escalationRules: { id: string; name: string; condition: string; action: string }[];
  reminderRules: { id: string; name: string; condition: string; action: string }[];
  digestEmails: boolean;
  digestFrequency: string;

  // Invoicing Ext
  invoicePrefix: string;
  invoiceDecimal: number;
  invoiceNumberStart?: number | null;
  quotationPrefix?: string | null;
  purchasePrefix?: string | null;
  creditNotePrefix?: string | null;
  gstEnabled?: boolean | null;
  gstRateDefault?: number | null;
  taxConfiguration?: { name: string; rate: number; type: string }[] | null;
  invoiceFooter?: string | null;
  invoiceTerms?: string | null;
  defaultPaymentTerms?: string | null;
  paymentGateway?: string | null;
  paymentGatewayConfig?: Record<string, any> | null;
  qrCodeEnabled?: boolean | null;
  qrCodeUrl?: string | null;
  digitalSignatureEnabled?: boolean | null;
  digitalSignatureUrl?: string | null;
  invoiceTemplate?: string | null;
  multiCurrencyEnabled?: boolean | null;
  supportedCurrencies?: string[] | null;

  // AI Configuration
  aiModel: string;
  aiTemperature: number;
  aiPromptTemplate: string;
  aiAssistantName: string;

  // Document Vault list
  uploadedDocuments: DocumentVaultItem[];
  registrationCertificateUrl?: string | null;
  panCardUrl?: string | null;
  gstCertificateUrl?: string | null;

  // Appearance Extensions
  themeMode?: string;
  sidebarStyle?: string;
  navigationStyle?: string;
  dashboardLayout?: string;
  widgetConfig?: string;
  cardDensity?: string;
  compactMode?: boolean;
  loginScreenStyle?: string;
  registerScreenStyle?: string;
  emailTemplateStyle?: string;
  pdfBrandingStyle?: string;
  invoiceBrandingStyle?: string;
  primaryFont?: string;
  borderRadius?: string;
  animationsEnabled?: boolean;

  // Structure Registry Extensions
  costCenters?: string[];
  grades?: string[];
  bands?: string[];
  designations?: string[];
  jobLevels?: string[];
  employmentTypes?: string[];
  workModes?: string[];
  shifts?: string[];
  teams?: string[];
}

const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  companyName: 'TechSonance Infotech',
  email: 'admin@techsonance.com',
  phone: '9876543210',
  address: '404 Corporate Suite, Sector 62, Noida, UP, India',
  website: 'https://techsonance.com',
  primaryColor: '#F87941',
  secondaryColor: '#F9B095',
  logoUrl: '',
  faviconUrl: '',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: 'relay@techsonance.com',
  smtpPassword: '',

  businessName: 'TechSonance Infotech LLP',
  businessEmail: 'billing@techsonance.com',
  businessPhone: '9876543210',
  businessAddress: '404 Corporate Suite, Sector 62, Noida, UP, India',
  gstNo: '09AAAAA1111A1Z1',
  pan: 'ABCDE1234F',
  tan: 'MUMB12345C',
  registrationNo: 'U72900MH2026PTC123456',
  termsAndConditions: 'All invoices are payable within 30 days of generation.',
  notes: 'HDFC Bank - A/C: 50200012345678 - IFSC: HDFC0001234',
  paymentTerms: 'Net 30',

  legalName: 'TechSonance Infotech Private Limited',
  workspaceName: 'techsonance-main',
  orgCode: 'TS-IND-01',
  businessType: 'Private Limited',
  industry: 'Software Development & IT Consultancy',
  timezone: 'Asia/Kolkata (GMT+5:30)',
  language: 'English (India)',
  country: 'India',
  currency: 'INR (₹)',
  fiscalYear: 'April to March',

  cinNumber: 'L72200DL2026PLC123456',
  msmeNumber: 'UDYAM-DL-01-0012345',
  supportEmail: 'support@techsonance.com',
  supportPhone: '+91 98765 43211',
  officeHours: '09:00 AM - 06:00 PM',
  emergencyContact: 'HR Helpline: +91 98765 43219',

  defaultProbation: 6,
  noticePeriod: 90,
  empIdPrefix: 'TS-',
  usernamePattern: 'first.last',
  emailPattern: 'username@techsonance.com',
  leavePolicy: 'Standard Privilege Leaves (24 days)',
  shiftDefault: 'General Engineering Shift (09:30 AM - 06:30 PM)',
  joiningWorkflow: 'Standard Paperless Onboarding',
  confirmationWorkflow: 'Manager Review required',
  autoEmpId: true,
  workingHours: 9,
  weekendRules: 'Saturday & Sunday Off',
  passwordPolicy: 'High Security (Minimum 12 chars, alphanumeric)',
  devicePolicy: 'Unrestricted personal and corporate devices allowed',
  loginRestrictions: 'Allowed at all times from trusted locations',

  mfaEnforced: true,
  sessionTimeout: 60,
  passwordMinLength: 8,
  ipWhitelist: '192.168.1.1/32, 103.241.12.0/24',
  allowedDomains: 'techsonance.com, techsonanceinfotech.com',

  notifyEmail: true,
  notifySms: false,
  notifyWhatsapp: true,
  notifySlack: true,
  notifyPush: false,
  notifyTeams: false,
  notifyDiscord: false,
  notifyWebhook: false,
  notifyBrowser: false,
  slackWebhookUrl: '',
  teamsWebhookUrl: '',
  discordWebhookUrl: '',
  webhookEndpointUrl: '',
  notificationTemplates: [
    { id: '1', name: 'Employee Onboarded Greeting', trigger: 'employee_joined', channels: ['email', 'slack'], template: 'Welcome to the team, {{firstName}}!' },
    { id: '2', name: 'Task Overdue Notification', trigger: 'task_overdue', channels: ['email', 'push'], template: 'Warning: The task {{taskName}} has passed its due date.' }
  ],
  escalationRules: [
    { id: '1', name: 'Unresolved High Ticket Escalation', condition: 'Ticket status is Open for > 24 hours', action: 'Notify Department Head' }
  ],
  reminderRules: [
    { id: '1', name: 'Daily Timesheet Reminder', condition: 'Timesheet not logged by 6:00 PM', action: 'Send Slack Notification to Employee' }
  ],
  digestEmails: false,
  digestFrequency: 'weekly',

  invoicePrefix: 'TS-INV-',
  invoiceDecimal: 2,
  invoiceNumberStart: 1,
  quotationPrefix: 'TS-QTN-',
  purchasePrefix: 'TS-PO-',
  creditNotePrefix: 'TS-CN-',
  gstEnabled: false,
  gstRateDefault: 18.00,
  taxConfiguration: [],
  invoiceFooter: 'Thank you for your business!',
  invoiceTerms: '1. Please pay within 15 days of invoice date. 2. Late payments incur a 1.5% fee.',
  defaultPaymentTerms: 'Net 15',
  paymentGateway: 'stripe',
  paymentGatewayConfig: {},
  qrCodeEnabled: false,
  qrCodeUrl: '',
  digitalSignatureEnabled: false,
  digitalSignatureUrl: '',
  invoiceTemplate: 'modern',
  multiCurrencyEnabled: false,
  supportedCurrencies: [],

  aiModel: 'gemini-1.5-pro',
  aiTemperature: 0.2,
  aiPromptTemplate: 'Act as a secure enterprise coding assistant. Follow strict compliance protocols...',
  aiAssistantName: 'Antigravity Workspace Engine',

  uploadedDocuments: [],
  registrationCertificateUrl: null,
  panCardUrl: null,
  gstCertificateUrl: null,

  // Appearance defaults
  themeMode: 'Follow System Settings',
  sidebarStyle: 'Classic Sidebar',
  navigationStyle: 'Left Side Navigation',
  dashboardLayout: 'Standard Grid Layout',
  widgetConfig: 'Default Analytics Layout',
  cardDensity: 'Cozy (Standard padding)',
  compactMode: false,
  loginScreenStyle: 'Modern Glassmorphic',
  registerScreenStyle: 'Classic Elegant',
  emailTemplateStyle: 'Corporate Minimalist',
  pdfBrandingStyle: 'Modern Signature',
  invoiceBrandingStyle: 'Clean Minimalist',
  primaryFont: 'Inter (Default)',
  borderRadius: '12px',
  animationsEnabled: true,

  // Registry defaults
  costCenters: ['CC-ENG-01', 'CC-QA-02', 'CC-MKT-03', 'CC-HR-04'],
  grades: ['G1', 'G2', 'G3', 'G4', 'G5'],
  bands: ['Band A', 'Band B', 'Band C'],
  designations: ['Software Engineer', 'Product Manager', 'QA Engineer', 'HR Associate', 'CEO'],
  jobLevels: ['L1 (Junior)', 'L2 (Mid)', 'L3 (Senior)', 'L4 (Lead)', 'L5 (Director)'],
  employmentTypes: ['Full-Time', 'Part-Time', 'Contractor', 'Intern'],
  workModes: ['Work From Office', 'Work From Home (Remote)', 'Hybrid (2 days office)'],
  shifts: ['General engineering Shift', 'US Night Shift', 'UK Afternoon Shift'],
  teams: ['Engineering Core', 'QA Core', 'Product Design', 'People Operations']
};

// Keyword mapping for Smart Settings Search
const SETTINGS_KEYWORDS: Record<string, string[]> = {
  overview: ['logo', 'favicon', 'workspace', 'url', 'timezone', 'language', 'fiscal', 'currency', 'overview'],
  company: ['legal', 'trade', 'gst', 'pan', 'cin', 'tan', 'msme', 'address', 'branch', 'emergency', 'profile'],
  structure: ['cost center', 'department', 'unit', 'org chart', 'reporting', 'grades', 'levels', 'teams', 'structure'],
  defaults: ['probation', 'notice period', 'leave', 'holiday', 'attendance', 'working hours', 'employee prefix', 'defaults'],
  users: ['invitations', 'groups', 'roles', 'permissions', 'mfa', 'timeout', 'password policy', 'allowed domains', 'users'],
  appearance: ['theme', 'accent', 'dark mode', 'sidebar', 'density', 'font', 'branding', 'animations', 'appearance'],
  notifications: ['email template', 'whatsapp', 'slack alert', 'teams', 'webhook notification', 'digest', 'notifications'],
  integrations: ['zoom', 'stripe', 'razorpay', 'paypal', 'slack integration', 'github', 'oauth apps', 'jira', 'integrations'],
  invoice: ['invoice prefix', 'quotation', 'gst settings', 'tax configuration', 'digital signature', 'invoice'],
  dynamic: ['custom forms', 'form builder', 'repeater fields', 'workflow rules', 'json preview', 'dynamic'],
  automation: ['workflow builder', 'trigger action', 'laptop assign', 'email automation', 'delay', 'automation'],
  ai: ['openai', 'gemini', 'claude', 'tokens', 'prompt templates', 'assistant', 'ai'],
  data: ['export', 'import', 'retention', 'archive', 'storage usage', 'cleanup', 'data'],
  security: ['ip restrictions', 'allowed devices', 'failed logins', 'encryption', 'data masking', 'security'],
  compliance: ['gdpr', 'soc2', 'iso27001', 'hipaa', 'legal documents', 'processing agreement', 'compliance'],
  billing: ['seats', 'plans', 'renewals', 'invoices list', 'payment methods', 'billing'],
  api: ['api keys', 'rate limits', 'sdk', 'playground', 'webhook logs', 'api'],
  audit: ['action logs', 'actor ip', 'browser changes', 'undo action', 'audit'],
  documents: ['policy files', 'insurance deeds', 'certificates repository', 'documents'],
  backup: ['restore point', 'manual backup', 'database snapshot', 'schedule cloud', 'backup'],
  advanced: ['maintenance mode', 'developer logs', 'cache flush', 'cron scheduler', 'advanced']
};

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  tenantId?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Workspace configurations states loaded from backend endpoints
  const [savedWorkspace, setSavedWorkspace] = useState<WorkspaceState>(DEFAULT_WORKSPACE_STATE);
  const [workspaceDraft, setWorkspaceDraft] = useState<WorkspaceState>(DEFAULT_WORKSPACE_STATE);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<WorkspaceState[]>([]);
  const [redoStack, setRedoStack] = useState<WorkspaceState[]>([]);

  // SaaS Billing States
  const [billingSub, setBillingSub] = useState<any>(null);
  const [saasInvoices, setSaasInvoices] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [taxIdInput, setTaxIdInput] = useState('');
  const [billingAddressInput, setBillingAddressInput] = useState<any>({ line1: '', city: '', state: '', postal_code: '', country: '' });

  // Invoice Local Settings Inputs
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [newCurrencyInput, setNewCurrencyInput] = useState('');

  // Extended Settings State Hooks
  // 1. Integrations Tab
  const [connectedIntegrations, setConnectedIntegrations] = useState<any[]>([]);
  const [isConfiguringIntegration, setIsConfiguringIntegration] = useState<any>(null);
  const [integrationConfigInput, setIntegrationConfigInput] = useState<any>({ clientId: '', clientSecret: '', webhookUrl: '' });
  const [integrationsSearch, setIntegrationsSearch] = useState('');
  const [integrationsCategory, setIntegrationsCategory] = useState('all');

  // 2. AI Settings Tab
  const [aiSettings, setAiSettings] = useState<any>({ ai_model: 'gemini-1.5-pro', ai_temperature: 0.7, ai_prompt_template: '', ai_assistant_name: 'Antigravity Assistant' });
  const [kbFiles, setKbFiles] = useState<any[]>([]);
  const [tokenLogs, setTokenLogs] = useState<any[]>([]);
  const [aiUsage, setAiUsage] = useState<any>({ limit: 100000, used: 0, creditsRemaining: 0 });
  const [newKbFileName, setNewKbFileName] = useState('');
  const [newKbFileUrl, setNewKbFileUrl] = useState('');
  const [newKbFileSize, setNewKbFileSize] = useState('');

  // 3. Developer Keys Tab
  const [developerApiKeys, setDeveloperApiKeys] = useState<any[]>([]);
  const [developerWebhooks, setDeveloperWebhooks] = useState<any[]>([]);
  const [developerOAuthApps, setDeveloperOAuthApps] = useState<any[]>([]);
  const [developerApiLogs, setDeveloperApiLogs] = useState<any[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['employee.created']);
  const [playgroundPath, setPlaygroundPath] = useState('/api/v1/employees');
  const [playgroundMethod, setPlaygroundMethod] = useState('GET');
  const [playgroundBody, setPlaygroundBody] = useState('{}');
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);

  // 4. Advanced Settings Tab
  const [advancedSettings, setAdvancedSettings] = useState<any>({
    developer_mode: false,
    maintenance_mode: false,
    feature_flags: {},
    beta_features: [],
    experimental_features: [],
    cache_settings: {},
    cdn_settings: {},
    health_status: {}
  });
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<any>({ pending: 0, active: 0, completed: 0, failed: 0 });
  const [healthDiagnostics, setHealthDiagnostics] = useState<any>(null);

  // 5. Backups & Recovery Tab
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [backupInterval, setBackupInterval] = useState<string>('weekly');

  // 6. Settings Audit Logs Tab
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);

  // 7. Compliance Tab
  const [complianceDraft, setComplianceDraft] = useState<any>({
    gdpr_enabled: false,
    soc2_enabled: false,
    iso_enabled: false,
    hipaa_enabled: false,
    data_residency: 'US-East',
    consent_required: false,
    cookie_policy: '',
    retention_years: 7
  });

  // 8. Security Center Tab
  const [securityDraft, setSecurityDraft] = useState<any>({
    min_password_length: 8,
    require_symbols: true,
    mfa_enabled: false,
    sso_enabled: false,
    allowed_ips: '',
    allowed_countries: ''
  });
  const [loginHistoryList, setLoginHistoryList] = useState<any[]>([]);

  // 9. Data Management Tab
  const [storageStats, setStorageStats] = useState<any>({
    storageUsedGb: 0,
    storageLimitGb: 50,
    deletedRecordsCount: 0,
    databaseSizeMb: 0,
    indexesSizeMb: 0
  });

  // Backups, Audits, Compliance, Security, Data Management Handlers
  const fetchBackupsDetails = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/backups', { headers });
      if (res.ok) {
        const json = await res.json();
        setBackupsList(json.data || []);
        if (json.data && json.data.length > 0) {
          const matched = json.data.find((b: any) => b.backup_type === 'automatic');
          if (matched) setBackupInterval(matched.schedule_interval || 'weekly');
        }
      }
    } catch (err) {
      console.error('Failed to load backups list:', err);
    }
  };

  const handleCreateBackup = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'create' })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchBackupsDetails();
      } else {
        toast.error('Failed to create manual recovery point');
      }
    } catch (err) {
      toast.error('Backup trigger request failed');
    }
  };

  const handleToggleBackupSchedule = async (val: string) => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'toggle-schedule', scheduleInterval: val })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setBackupInterval(val);
        fetchBackupsDetails();
      } else {
        toast.error('Failed to adjust scheduled intervals');
      }
    } catch (err) {
      toast.error('Backup schedule request error');
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'restore', backupId })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
      } else {
        toast.error('Snapshot restore rejected by sandbox');
      }
    } catch (err) {
      toast.error('Snapshot restore execution error');
    }
  };

  const fetchAuditLogsDetails = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/audit-logs', { headers });
      if (res.ok) {
        const json = await res.json();
        setAuditLogsList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load audit settings change logs:', err);
    }
  };

  const handleUndoAudit = async (logId: string) => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/audit-logs', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'undo', logId })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchAuditLogsDetails();
      } else {
        toast.error('Unable to revert this setting');
      }
    } catch (err) {
      toast.error('Undo setting change execution failed');
    }
  };

  const fetchComplianceDetails = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/compliance', { headers });
      if (res.ok) {
        const json = await res.json();
        setComplianceDraft(json.data || {});
      }
    } catch (err) {
      console.error('Failed to load compliance configurations:', err);
    }
  };

  const handleSaveCompliance = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/compliance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          gdprEnabled: complianceDraft.gdpr_enabled,
          soc2Enabled: complianceDraft.soc2_enabled,
          isoEnabled: complianceDraft.iso_enabled,
          hipaaEnabled: complianceDraft.hipaa_enabled,
          dataResidency: complianceDraft.data_residency,
          consentRequired: complianceDraft.consent_required,
          cookiePolicy: complianceDraft.cookie_policy,
          retentionYears: complianceDraft.retention_years
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchComplianceDetails();
      } else {
        toast.error('Failed to update compliance settings');
      }
    } catch (err) {
      toast.error('Compliance save request error');
    }
  };

  const fetchSecurityDetails = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/security', { headers });
      if (res.ok) {
        const json = await res.json();
        setSecurityDraft(json.data.settings || {});
        setLoginHistoryList(json.data.loginHistory || []);
      }
    } catch (err) {
      console.error('Failed to load security center details:', err);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/security', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          minPasswordLength: securityDraft.min_password_length,
          requireSymbols: securityDraft.require_symbols,
          mfaEnabled: securityDraft.mfa_enabled,
          ssoEnabled: securityDraft.sso_enabled,
          allowedIps: securityDraft.allowed_ips,
          allowedCountries: securityDraft.allowed_countries
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchSecurityDetails();
      } else {
        toast.error('Failed to save security policies');
      }
    } catch (err) {
      toast.error('Security save request error');
    }
  };

  const fetchDataManagementDetails = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/data-management', { headers });
      if (res.ok) {
        const json = await res.json();
        setStorageStats(json.data || {});
      }
    } catch (err) {
      console.error('Failed to load data metrics:', err);
    }
  };

  const handleCleanDb = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/data-management', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'clean-db' })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchDataManagementDetails();
      } else {
        toast.error('Database cleaning failed');
      }
    } catch (err) {
      toast.error('Cleaning DB execution error');
    }
  };

  const handleExportConfig = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/data-management', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'export' })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
      } else {
        toast.error('Config export failed');
      }
    } catch (err) {
      toast.error('Config export execution error');
    }
  };

  // API Call Execution Helpers
  const fetchIntegrationsDetails = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/integrations', { headers });
      if (res.ok) {
        const json = await res.json();
        setConnectedIntegrations(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load integrations:', err);
    }
  };

  const handleConnectIntegration = async (providerSlug: string, config: any) => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'connect', providerSlug, config }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setIsConfiguringIntegration(null);
        fetchIntegrationsDetails();
      } else {
        toast.error('Failed to configure integration');
      }
    } catch (err: any) {
      toast.error('Error binding integration connection');
    }
  };

  const handleDisconnectIntegration = async (providerSlug: string) => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'disconnect', providerSlug }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchIntegrationsDetails();
      } else {
        toast.error('Failed to disconnect integration');
      }
    } catch (err: any) {
      toast.error('Error disconnecting integration connection');
    }
  };

  const fetchAiSettingsAndKb = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/ai/config', { headers });
      if (res.ok) {
        const json = await res.json();
        setAiSettings(json.data.settings || {});
        setKbFiles(json.data.kbFiles || []);
        setTokenLogs(json.data.tokenLogs || []);
        setAiUsage(json.data.usage || {});
      }
    } catch (err) {
      console.error('Failed to load AI details:', err);
    }
  };

  const handleSaveAiSettings = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'save-config',
          aiModel: aiSettings.ai_model,
          aiTemperature: aiSettings.ai_temperature,
          aiPromptTemplate: aiSettings.ai_prompt_template,
          aiAssistantName: aiSettings.ai_assistant_name
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchAiSettingsAndKb();
      } else {
        toast.error('Failed to update AI configuration');
      }
    } catch (err: any) {
      toast.error('Error saving AI config parameters');
    }
  };

  const handleUploadKb = async () => {
    if (!newKbFileName || !newKbFileUrl) return toast.warning('File Name and URL are required');
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'upload-kb',
          fileName: newKbFileName,
          fileUrl: newKbFileUrl,
          fileSize: newKbFileSize || '120 KB'
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setNewKbFileName('');
        setNewKbFileUrl('');
        setNewKbFileSize('');
        fetchAiSettingsAndKb();
      } else {
        toast.error('Failed to catalog knowledge source');
      }
    } catch (err: any) {
      toast.error('Error upload cataloging document');
    }
  };

  const handleDeleteKb = async (fileId: string) => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete-kb', fileId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchAiSettingsAndKb();
      } else {
        toast.error('Failed to delete knowledge document');
      }
    } catch (err: any) {
      toast.error('Error deleting document');
    }
  };

  const fetchDeveloperKeysDetails = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/developer/keys', { headers });
      if (res.ok) {
        const json = await res.json();
        setDeveloperApiKeys(json.data.apiKeys || []);
        setDeveloperWebhooks(json.data.webhooks || []);
        setDeveloperOAuthApps(json.data.oauthApps || []);
        setDeveloperApiLogs(json.data.apiLogs || []);
      }
    } catch (err) {
      console.error('Failed to load developer keys:', err);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newApiKeyName) return toast.warning('API key name is required');
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'create-key', keyName: newApiKeyName }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setNewApiKeyName('');
        // Render raw key to user
        toast.info(`Raw Live Token: ${json.rawKey} (Copy immediately!)`, { duration: 10000 });
        fetchDeveloperKeysDetails();
      } else {
        toast.error('Failed to generate key');
      }
    } catch (err: any) {
      toast.error('Error generating token');
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete-key', keyId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchDeveloperKeysDetails();
      } else {
        toast.error('Failed to revoke API key');
      }
    } catch (err: any) {
      toast.error('Error revoking token');
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl) return toast.warning('Webhook destination URL is required');
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'create-webhook', url: newWebhookUrl, events: newWebhookEvents }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        setNewWebhookUrl('');
        fetchDeveloperKeysDetails();
      } else {
        toast.error('Failed to register webhook');
      }
    } catch (err: any) {
      toast.error('Error registering callback');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete-webhook', webhookId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchDeveloperKeysDetails();
      } else {
        toast.error('Failed to revoke webhook endpoint');
      }
    } catch (err: any) {
      toast.error('Error revoking webhook');
    }
  };

  const handleRunPlayground = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'send-playground',
          playgroundPath,
          playgroundMethod,
          playgroundBody: JSON.parse(playgroundBody || '{}')
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPlaygroundResponse(json.response);
        toast.success('API response generated successfully!');
        fetchDeveloperKeysDetails();
      } else {
        toast.error('API execution failed');
      }
    } catch (err: any) {
      toast.error('JSON body is invalid or endpoint error occurred');
    }
  };

  const fetchAdvancedSettingsDetails = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/advanced/settings', { headers });
      if (res.ok) {
        const json = await res.json();
        setAdvancedSettings(json.data.settings || {});
        setCronJobs(json.data.cronJobs || []);
        setQueueStats(json.data.queues || {});
      }
    } catch (err) {
      console.error('Failed to load advanced settings:', err);
    }
  };

  const handleSaveAdvancedSettings = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/advanced/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'save-advanced',
          developerMode: advancedSettings.developer_mode,
          maintenanceMode: advancedSettings.maintenance_mode,
          featureFlags: advancedSettings.feature_flags,
          betaFeatures: advancedSettings.beta_features,
          experimentalFeatures: advancedSettings.experimental_features,
          cacheSettings: advancedSettings.cache_settings,
          cdnSettings: advancedSettings.cdn_settings
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchAdvancedSettingsDetails();
      } else {
        toast.error('Failed to update advanced settings');
      }
    } catch (err: any) {
      toast.error('Error saving developer options');
    }
  };

  const handleFlushCaches = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/advanced/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'flush-cache' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
      } else {
        toast.error('Failed to flush caches');
      }
    } catch (err: any) {
      toast.error('Cache flush execution error');
    }
  };

  const handleTriggerQueues = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/advanced/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'trigger-queue' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
      } else {
        toast.error('Failed to trigger background workers');
      }
    } catch (err: any) {
      toast.error('Workers execution error');
    }
  };

  const handleRunHealthChecks = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/advanced/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'health-check' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setHealthDiagnostics(json.healthStatus);
        toast.success(json.message);
        fetchAdvancedSettingsDetails();
      } else {
        toast.error('Health diagnostics check failed');
      }
    } catch (err: any) {
      toast.error('Diagnostics execution error');
    }
  };

  const fetchBillingDetails = async () => {
    try {
      setBillingLoading(true);
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/billing?t=${Date.now()}`, { headers, cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setBillingSub(json.data.subscription);
          setSaasInvoices(json.data.invoices || []);
          setTaxIdInput(json.data.subscription.taxId || '');
          setBillingAddressInput(json.data.subscription.billingAddress || { line1: '', city: '', state: '', postal_code: '', country: '' });
        }
      }
    } catch (err) {
      console.error('Failed to fetch billing details:', err);
    } finally {
      setBillingLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return toast.warning('Please enter a coupon code');
    try {
      setBillingLoading(true);
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/billing', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'apply-coupon', couponCode }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBillingSub(json.data);
        toast.success(json.message || 'Coupon applied successfully!');
        setCouponCode('');
        fetchBillingDetails();
      } else {
        toast.error(json.message || 'Failed to apply coupon');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply coupon');
    } finally {
      setBillingLoading(false);
    }
  };

  const handlePlanMigration = async (planCode: string) => {
    try {
      setBillingLoading(true);
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/billing', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'upgrade', planCode }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBillingSub(json.data);
        toast.success(json.message || 'Plan migrated successfully!');
        fetchBillingDetails(); // Reload history
      } else {
        toast.error(json.message || 'Failed to migrate plan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to migrate plan');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleAddonsUpdate = async (addonId: string, add: boolean) => {
    try {
      setBillingLoading(true);
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const currentAddons = billingSub?.addons || [];
      let nextAddons = [...currentAddons];
      if (add) {
        if (!nextAddons.find((a: any) => a.id === addonId)) {
          nextAddons.push({ id: addonId, qty: 1 });
        }
      } else {
        nextAddons = nextAddons.filter((a: any) => a.id !== addonId);
      }

      const res = await fetch('/api/billing', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'addons', addons: nextAddons }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBillingSub(json.data);
        toast.success(json.message || 'Add-ons updated successfully!');
      } else {
        toast.error(json.message || 'Failed to update add-ons');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update add-ons');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleSaveBillingDetails = async () => {
    try {
      setBillingLoading(true);
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/billing', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ taxId: taxIdInput, billingAddress: billingAddressInput }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBillingSub(json.data);
        toast.success(json.message || 'Billing details updated successfully!');
      } else {
        toast.error(json.message || 'Failed to update billing details');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update billing details');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleBindPaymentCard = async () => {
    try {
      setBillingLoading(true);
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const cardDetails = { brand: 'Visa', last4: '4242' };
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'payment-method', ...cardDetails }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBillingSub(json.data);
        toast.success(json.message || 'Mock payment method bound successfully!');
      } else {
        toast.error(json.message || 'Failed to bind payment method');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to bind payment method');
    } finally {
      setBillingLoading(false);
    }
  };

  // Search & Navigation States
  const [searchTerm, setSearchTerm] = useState('');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Automation Workflows States
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Notification templates and rules helpers
  const addTemplate = () => {
    const newTpl = {
      id: Date.now().toString(),
      name: 'New Notification Template',
      trigger: 'employee_joined',
      channels: ['email'],
      template: 'Welcome message template...'
    };
    updateDraftField('notificationTemplates', [...(workspaceDraft.notificationTemplates || []), newTpl]);
    toast.success('Notification template stub added!');
  };

  const updateTemplate = (id: string, updatedFields: any) => {
    const list = (workspaceDraft.notificationTemplates || []).map(t => t.id === id ? { ...t, ...updatedFields } : t);
    updateDraftField('notificationTemplates', list);
  };

  const removeTemplate = (id: string) => {
    const list = (workspaceDraft.notificationTemplates || []).filter(t => t.id !== id);
    updateDraftField('notificationTemplates', list);
    toast.success('Notification template removed!');
  };

  const addEscalationRule = () => {
    const newRule = {
      id: Date.now().toString(),
      name: 'New Escalation Rule',
      condition: 'Ticket status is Open for > 12 hours',
      action: 'Notify Supervisor'
    };
    updateDraftField('escalationRules', [...(workspaceDraft.escalationRules || []), newRule]);
    toast.success('Escalation rule stub added!');
  };

  const updateEscalationRule = (id: string, updatedFields: any) => {
    const list = (workspaceDraft.escalationRules || []).map(r => r.id === id ? { ...r, ...updatedFields } : r);
    updateDraftField('escalationRules', list);
  };

  const removeEscalationRule = (id: string) => {
    const list = (workspaceDraft.escalationRules || []).filter(r => r.id !== id);
    updateDraftField('escalationRules', list);
    toast.success('Escalation rule removed!');
  };

  const addReminderRule = () => {
    const newRule = {
      id: Date.now().toString(),
      name: 'New Reminder Rule',
      condition: 'Timesheet missing by Friday 5:00 PM',
      action: 'Send Slack Notification to Employee'
    };
    updateDraftField('reminderRules', [...(workspaceDraft.reminderRules || []), newRule]);
    toast.success('Reminder rule stub added!');
  };

  const updateReminderRule = (id: string, updatedFields: any) => {
    const list = (workspaceDraft.reminderRules || []).map(r => r.id === id ? { ...r, ...updatedFields } : r);
    updateDraftField('reminderRules', list);
  };
  const removeReminderRule = (id: string) => {
    const list = (workspaceDraft.reminderRules || []).filter(t => t.id !== id);
    updateDraftField('reminderRules', list);
    toast.success('Reminder rule removed!');
  };

  // Workflow Automation CRUD & Editor API helpers
  const fetchWorkflows = async () => {
    setWorkflowsLoading(true);
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/automation/workflows', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setWorkflows(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch automation workflows');
      }
    } catch (err: any) {
      console.error('fetchWorkflows failed:', err);
      toast.error(err.message || 'Error connecting to workflows API');
    } finally {
      setWorkflowsLoading(false);
    }
  };

  const saveWorkflow = async (wf: any) => {
    if (!wf.name || !wf.trigger_event) {
      toast.error('Name and trigger event are required');
      return;
    }
    const isNew = !wf.id;
    const url = isNew ? '/api/automation/workflows' : `/api/automation/workflows?id=${wf.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    try {
      const token = getStoredSessionToken();
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: wf.name,
          trigger_event: wf.trigger_event,
          conditions: wf.conditions || [],
          actions: wf.actions || [],
          is_active: wf.is_active !== undefined ? wf.is_active : true
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Workflow ${isNew ? 'created' : 'updated'} successfully!`);
        setEditingWorkflow(null);
        fetchWorkflows();
      } else {
        toast.error(data.message || 'Failed to save workflow');
      }
    } catch (err: any) {
      console.error('saveWorkflow failed:', err);
      toast.error(err.message || 'Error saving workflow');
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/automation/workflows?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Workflow deleted successfully');
        fetchWorkflows();
      } else {
        toast.error(data.message || 'Failed to delete workflow');
      }
    } catch (err: any) {
      console.error('deleteWorkflow failed:', err);
      toast.error(err.message || 'Error deleting workflow');
    }
  };

  const toggleWorkflowActive = async (wf: any) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/automation/workflows?id=${wf.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !wf.is_active })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Workflow ${!wf.is_active ? 'activated' : 'deactivated'}`);
        fetchWorkflows();
      } else {
        toast.error(data.message || 'Failed to update workflow state');
      }
    } catch (err: any) {
      console.error('toggleWorkflowActive failed:', err);
      toast.error(err.message || 'Error toggling workflow state');
    }
  };

  useEffect(() => {
    if (activeTab === 'automation') {
      fetchWorkflows();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'billing') {
      fetchBillingDetails();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchIntegrationsDetails();
    }
    if (activeTab === 'ai') {
      fetchAiSettingsAndKb();
    }
    if (activeTab === 'api') {
      fetchDeveloperKeysDetails();
    }
    if (activeTab === 'advanced') {
      fetchAdvancedSettingsDetails();
    }
    if (activeTab === 'backup') {
      fetchBackupsDetails();
    }
    if (activeTab === 'audit') {
      fetchAuditLogsDetails();
    }
    if (activeTab === 'compliance') {
      fetchComplianceDetails();
    }
    if (activeTab === 'security') {
      fetchSecurityDetails();
    }
    if (activeTab === 'data') {
      fetchDataManagementDetails();
    }
  }, [activeTab]);

  const searchParams = useSearchParams();

  useEffect(() => {
    let tabParam = searchParams.get('tab');
    if (tabParam) {
      if (tabParam === 'privacy') {
        tabParam = 'compliance';
      } else if (tabParam === 'backups') {
        tabParam = 'backup';
      }
      setActiveTab(tabParam);
    }
    const regParam = searchParams.get('registry');
    if (regParam) {
      setActiveRegistry(regParam as any);
    }
  }, [searchParams]);

  // Org Chart & Registries states
  const [orgNodes, setOrgNodes] = useState<any[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [activeRegistry, setActiveRegistry] = useState<'costCenters' | 'grades' | 'bands' | 'designations' | 'jobLevels' | 'employmentTypes' | 'workModes' | 'shifts' | 'teams'>('costCenters');
  const [newRegistryItem, setNewRegistryItem] = useState('');

  // Users & Roles states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    password: 'SecurePassword123!',
    firstName: '',
    lastName: '',
    role: 'developer' as const,
    phone: '',
    username: ''
  });

  // Document Vault Form States
  const [isDocUploadModalOpen, setIsDocUploadModalOpen] = useState(false);
  const [docUploadName, setDocUploadName] = useState('');
  const [docUploadCategory, setDocUploadCategory] = useState('Policies');
  const [docUploadExpiry, setDocUploadExpiry] = useState('Permanent');
  const [docUploadFile, setDocUploadFile] = useState<File | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [onboardingUploadTarget, setOnboardingUploadTarget] = useState<'gst' | 'pan' | 'reg' | null>(null);

  const fetchOrgChartData = async () => {
    setOrgLoading(true);
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/org-chart', { headers });
      if (!res.ok) throw new Error('Failed to load organization chart');
      const resJson = await res.json();
      if (resJson.success && Array.isArray(resJson.data)) {
        setOrgNodes(resJson.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Could not load reporting structure');
    } finally {
      setOrgLoading(false);
    }
  };

  const handleNodeDrop = async (droppedNodeId: number, targetNodeId: number | null) => {
    // Optimistic UI update
    const previousNodes = [...orgNodes];
    const targetNode = targetNodeId ? orgNodes.find(n => n.id === targetNodeId) : null;
    const droppedNode = orgNodes.find(n => n.id === droppedNodeId);

    if (!droppedNode) return;
    if (droppedNodeId === targetNodeId) return;

    // Check if target is a descendant of dropped to prevent cycles
    const isDescendant = (parent: number, child: number): boolean => {
      const cNode = orgNodes.find(n => n.id === child);
      if (!cNode || !cNode.managerId) return false;
      const parentNode = orgNodes.find(n => n.userId === cNode.managerId);
      if (!parentNode) return false;
      if (parentNode.id === parent) return true;
      return isDescendant(parent, parentNode.id);
    };

    if (targetNodeId && isDescendant(droppedNodeId, targetNodeId)) {
      toast.error('Cannot set a subordinate as a reporting manager');
      return;
    }

    // Set updated local state
    setOrgNodes(prev => prev.map(n => {
      if (n.id === droppedNodeId) {
        return { ...n, managerId: targetNode ? targetNode.userId : null };
      }
      return n;
    }));

    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/org-chart', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ employeeId: droppedNodeId, parentEmployeeId: targetNodeId }),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.message || 'Failed to update manager link');
      }
      toast.success(`${droppedNode.name} now reports to ${targetNode ? targetNode.name : 'Board/CEO'}`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Could not save structural changes: ${err.message}`);
      setOrgNodes(previousNodes); // Rollback
    }
  };

  const addRegistryItem = () => {
    if (!newRegistryItem.trim()) return;
    const currentList = workspaceDraft[activeRegistry] || [];
    if (currentList.includes(newRegistryItem.trim())) {
      toast.error('Item already exists in the registry');
      return;
    }
    const updatedList = [...currentList, newRegistryItem.trim()];
    updateDraftField(activeRegistry, updatedList);
    setNewRegistryItem('');
    toast.success(`Added ${newRegistryItem} to registry`);
  };

  const removeRegistryItem = (itemToRemove: string) => {
    const currentList = workspaceDraft[activeRegistry] || [];
    const updatedList = currentList.filter((item: string) => item !== itemToRemove);
    updateDraftField(activeRegistry, updatedList);
    toast.success(`Removed ${itemToRemove} from registry`);
  };

  // Trigger loading when tab is selected
  useEffect(() => {
    if (activeTab === 'structure') {
      fetchOrgChartData();
    }
  }, [activeTab]);

  // Hidden refs for upload fields
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const invoiceLogoInputRef = useRef<HTMLInputElement>(null);
  const docVaultInputRef = useRef<HTMLInputElement>(null);
  const onboardingInputRef = useRef<HTMLInputElement>(null);

  // Password Update Form State
  const [changingPassword, setChangingPassword] = useState(false);
  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Load backend credentials/settings on init
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [userRes] = await Promise.all([
        fetchCurrentUser(),
        fetchSettingsFromBackend(),
        fetchTenantUsers()
      ]);
      if (userRes && !hasFullAccess(userRes.role)) {
        // Will render Access Denied view securely
      }
    } catch (err: any) {
      console.error('CRITICAL: fetchInitialData failed:', err);
      toast.error(`System settings load failed: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/users?limit=100', { headers });
      if (response.ok) {
        const resJson = await response.json();
        setUsersList(resJson.data || []);
      }
    } catch (err) {
      console.error('Failed to load workspace users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSuspendToggle = async (user: any) => {
    toast.loading(`${user.isActive ? 'Deactivating' : 'Activating'} user account...`, { id: 'user-action' });
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/users?id=${user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      if (response.ok) {
        toast.success(`User account status updated successfully!`, { id: 'user-action' });
        fetchTenantUsers();
      } else {
        const errorJson = await response.json().catch(() => ({}));
        toast.error(`Failed to update account: ${errorJson.error || errorJson.message || 'Server error'}`, { id: 'user-action' });
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred.', { id: 'user-action' });
    }
  };

  const handleRoleChange = async (user: any, newRole: string) => {
    toast.loading(`Updating user role to ${newRole}...`, { id: 'user-role' });
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/users?id=${user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          role: newRole,
        }),
      });

      if (response.ok) {
        toast.success(`User role updated to ${newRole}!`, { id: 'user-role' });
        fetchTenantUsers();
      } else {
        const errorJson = await response.json().catch(() => ({}));
        toast.error(`Failed to update role: ${errorJson.error || errorJson.message || 'Server error'}`, { id: 'user-role' });
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred.', { id: 'user-role' });
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
      toast.error('Please fill in all required fields (Email, First Name, Last Name).');
      return;
    }
    if (inviteForm.password.length < 12) {
      toast.error('Password must be at least 12 characters long.');
      return;
    }

    toast.loading('Inviting new user to workspace...', { id: 'user-invite' });
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: inviteForm.email,
          password: inviteForm.password,
          firstName: inviteForm.firstName,
          lastName: inviteForm.lastName,
          role: inviteForm.role,
          phone: inviteForm.phone || null,
          username: inviteForm.username || null,
          isActive: true
        }),
      });

      if (response.ok) {
        toast.success(`User invited successfully!`, { id: 'user-invite' });
        setShowInviteModal(false);
        setInviteForm({
          email: '',
          password: 'SecurePassword123!',
          firstName: '',
          lastName: '',
          role: 'developer',
          phone: '',
          username: ''
        });
        fetchTenantUsers();
      } else {
        const errorJson = await response.json().catch(() => ({}));
        toast.error(`Invitation failed: ${errorJson.error || errorJson.message || 'Server error'}`, { id: 'user-invite' });
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while sending invite.', { id: 'user-invite' });
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/auth/me?t=${Date.now()}`, {
        headers,
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        return data.user as User;
      }
    } catch {
      toast.error('Session loading failed');
    }
    return null;
  };

  const fetchSettingsFromBackend = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [companyRes, businessRes, workspaceRes] = await Promise.all([
        fetch(`/api/company-settings?t=${Date.now()}`, { headers, cache: 'no-store' }),
        fetch(`/api/business-settings?t=${Date.now()}`, { headers, cache: 'no-store' }),
        fetch(`/api/workspace-settings?t=${Date.now()}`, { headers, cache: 'no-store' })
      ]);

      if (!companyRes.ok) {
        throw new Error(`Company settings loading failed with status ${companyRes.status}`);
      }
      if (!businessRes.ok) {
        throw new Error(`Business settings loading failed with status ${businessRes.status}`);
      }
      if (!workspaceRes.ok) {
        throw new Error(`Workspace settings loading failed with status ${workspaceRes.status}`);
      }

      const companyText = await companyRes.text();
      const businessText = await businessRes.text();
      const workspaceText = await workspaceRes.text();

      const companyJson = JSON.parse(companyText);
      const businessJson = JSON.parse(businessText);
      const workspaceJson = JSON.parse(workspaceText);

      let backendCompany = companyJson.data || {};
      let backendBusiness = businessJson.data || {};
      let backendWorkspace = workspaceJson.data || {};

      // Merge DB states with the extended configurations loaded dynamically
      const merged: WorkspaceState = {
        // Company
        companyName: backendCompany.companyName || DEFAULT_WORKSPACE_STATE.companyName,
        email: backendCompany.email || DEFAULT_WORKSPACE_STATE.email,
        phone: backendCompany.phone || DEFAULT_WORKSPACE_STATE.phone,
        address: backendCompany.address || DEFAULT_WORKSPACE_STATE.address,
        website: backendCompany.website || DEFAULT_WORKSPACE_STATE.website,
        primaryColor: backendCompany.primaryColor || DEFAULT_WORKSPACE_STATE.primaryColor,
        secondaryColor: backendCompany.secondaryColor || DEFAULT_WORKSPACE_STATE.secondaryColor,
        logoUrl: backendCompany.logoUrl || DEFAULT_WORKSPACE_STATE.logoUrl,
        faviconUrl: backendWorkspace.faviconUrl || DEFAULT_WORKSPACE_STATE.faviconUrl,
        smtpHost: backendCompany.smtpHost || DEFAULT_WORKSPACE_STATE.smtpHost,
        smtpPort: backendCompany.smtpPort || DEFAULT_WORKSPACE_STATE.smtpPort,
        smtpUser: backendCompany.smtpUser || DEFAULT_WORKSPACE_STATE.smtpUser,

        // Business
        businessName: backendBusiness.businessName || backendCompany.companyName || DEFAULT_WORKSPACE_STATE.businessName,
        businessEmail: backendBusiness.businessEmail || backendBusiness.email || backendCompany.email || DEFAULT_WORKSPACE_STATE.businessEmail,
        businessPhone: backendBusiness.businessPhone || backendBusiness.phone || backendCompany.phone || DEFAULT_WORKSPACE_STATE.businessPhone,
        businessAddress: backendBusiness.businessAddress || backendBusiness.address || backendCompany.address || DEFAULT_WORKSPACE_STATE.businessAddress,
        gstNo: backendBusiness.gstNo || backendCompany.gstin || DEFAULT_WORKSPACE_STATE.gstNo,
        pan: backendBusiness.pan || backendCompany.pan || DEFAULT_WORKSPACE_STATE.pan,
        tan: backendBusiness.tan || DEFAULT_WORKSPACE_STATE.tan,
        registrationNo: backendBusiness.registrationNo || DEFAULT_WORKSPACE_STATE.registrationNo,
        termsAndConditions: backendBusiness.termsAndConditions || DEFAULT_WORKSPACE_STATE.termsAndConditions,
        notes: backendBusiness.notes || DEFAULT_WORKSPACE_STATE.notes,
        paymentTerms: backendBusiness.paymentTerms || DEFAULT_WORKSPACE_STATE.paymentTerms,

        // Extended
        legalName: backendWorkspace.legalName || backendCompany.companyName || DEFAULT_WORKSPACE_STATE.legalName,
        workspaceName: backendWorkspace.workspaceName || backendCompany.tenant?.slug || DEFAULT_WORKSPACE_STATE.workspaceName,
        orgCode: backendWorkspace.orgCode || (backendCompany.tenant?.name ? backendCompany.tenant.name.split(' ').map((w: string) => w[0]).join('').toUpperCase() + '-IND-01' : DEFAULT_WORKSPACE_STATE.orgCode),
        businessType: backendWorkspace.businessType || DEFAULT_WORKSPACE_STATE.businessType,
        industry: backendWorkspace.industry || DEFAULT_WORKSPACE_STATE.industry,
        timezone: backendWorkspace.timezone || DEFAULT_WORKSPACE_STATE.timezone,
        language: backendWorkspace.language || DEFAULT_WORKSPACE_STATE.language,
        country: backendWorkspace.country || DEFAULT_WORKSPACE_STATE.country,
        currency: backendWorkspace.currency || DEFAULT_WORKSPACE_STATE.currency,
        fiscalYear: backendWorkspace.fiscalYear || DEFAULT_WORKSPACE_STATE.fiscalYear,

        cinNumber: backendWorkspace.cinNumber || DEFAULT_WORKSPACE_STATE.cinNumber,
        msmeNumber: backendWorkspace.msmeNumber || DEFAULT_WORKSPACE_STATE.msmeNumber,
        supportEmail: backendWorkspace.supportEmail || DEFAULT_WORKSPACE_STATE.supportEmail,
        supportPhone: backendWorkspace.supportPhone || DEFAULT_WORKSPACE_STATE.supportPhone,
        officeHours: backendWorkspace.officeHours || DEFAULT_WORKSPACE_STATE.officeHours,
        emergencyContact: backendWorkspace.emergencyContact || DEFAULT_WORKSPACE_STATE.emergencyContact,

        defaultProbation: backendWorkspace.defaultProbation !== undefined ? backendWorkspace.defaultProbation : DEFAULT_WORKSPACE_STATE.defaultProbation,
        noticePeriod: backendWorkspace.noticePeriod !== undefined ? backendWorkspace.noticePeriod : DEFAULT_WORKSPACE_STATE.noticePeriod,
        empIdPrefix: backendWorkspace.empIdPrefix || DEFAULT_WORKSPACE_STATE.empIdPrefix,
        usernamePattern: backendWorkspace.usernamePattern || DEFAULT_WORKSPACE_STATE.usernamePattern,
        emailPattern: backendWorkspace.emailPattern || DEFAULT_WORKSPACE_STATE.emailPattern,
        leavePolicy: backendWorkspace.leavePolicy || DEFAULT_WORKSPACE_STATE.leavePolicy,
        shiftDefault: backendWorkspace.shiftDefault || DEFAULT_WORKSPACE_STATE.shiftDefault,
        joiningWorkflow: backendWorkspace.joiningWorkflow || DEFAULT_WORKSPACE_STATE.joiningWorkflow,
        confirmationWorkflow: backendWorkspace.confirmationWorkflow || DEFAULT_WORKSPACE_STATE.confirmationWorkflow,
        autoEmpId: backendWorkspace.autoEmpId !== undefined ? backendWorkspace.autoEmpId : DEFAULT_WORKSPACE_STATE.autoEmpId,
        workingHours: backendWorkspace.workingHours !== undefined ? backendWorkspace.workingHours : DEFAULT_WORKSPACE_STATE.workingHours,
        weekendRules: backendWorkspace.weekendRules || DEFAULT_WORKSPACE_STATE.weekendRules,
        passwordPolicy: backendWorkspace.passwordPolicy || DEFAULT_WORKSPACE_STATE.passwordPolicy,
        devicePolicy: backendWorkspace.devicePolicy || DEFAULT_WORKSPACE_STATE.devicePolicy,
        loginRestrictions: backendWorkspace.loginRestrictions || DEFAULT_WORKSPACE_STATE.loginRestrictions,

        mfaEnforced: backendWorkspace.mfaEnforced !== undefined ? backendWorkspace.mfaEnforced : DEFAULT_WORKSPACE_STATE.mfaEnforced,
        sessionTimeout: backendWorkspace.sessionTimeout !== undefined ? backendWorkspace.sessionTimeout : DEFAULT_WORKSPACE_STATE.sessionTimeout,
        passwordMinLength: backendWorkspace.passwordMinLength !== undefined ? backendWorkspace.passwordMinLength : DEFAULT_WORKSPACE_STATE.passwordMinLength,
        ipWhitelist: backendWorkspace.ipWhitelist || DEFAULT_WORKSPACE_STATE.ipWhitelist,
        allowedDomains: backendWorkspace.allowedDomains || DEFAULT_WORKSPACE_STATE.allowedDomains,

        notifyEmail: backendWorkspace.notifyEmail !== undefined ? backendWorkspace.notifyEmail : DEFAULT_WORKSPACE_STATE.notifyEmail,
        notifySms: backendWorkspace.notifySms !== undefined ? backendWorkspace.notifySms : DEFAULT_WORKSPACE_STATE.notifySms,
        notifyWhatsapp: backendWorkspace.notifyWhatsapp !== undefined ? backendWorkspace.notifyWhatsapp : DEFAULT_WORKSPACE_STATE.notifyWhatsapp,
        notifySlack: backendWorkspace.notifySlack !== undefined ? backendWorkspace.notifySlack : DEFAULT_WORKSPACE_STATE.notifySlack,
        notifyPush: backendWorkspace.notifyPush !== undefined ? backendWorkspace.notifyPush : DEFAULT_WORKSPACE_STATE.notifyPush,
        notifyTeams: backendWorkspace.notifyTeams !== undefined ? backendWorkspace.notifyTeams : DEFAULT_WORKSPACE_STATE.notifyTeams,
        notifyDiscord: backendWorkspace.notifyDiscord !== undefined ? backendWorkspace.notifyDiscord : DEFAULT_WORKSPACE_STATE.notifyDiscord,
        notifyWebhook: backendWorkspace.notifyWebhook !== undefined ? backendWorkspace.notifyWebhook : DEFAULT_WORKSPACE_STATE.notifyWebhook,
        notifyBrowser: backendWorkspace.notifyBrowser !== undefined ? backendWorkspace.notifyBrowser : DEFAULT_WORKSPACE_STATE.notifyBrowser,
        slackWebhookUrl: backendWorkspace.slackWebhookUrl || DEFAULT_WORKSPACE_STATE.slackWebhookUrl,
        teamsWebhookUrl: backendWorkspace.teamsWebhookUrl || DEFAULT_WORKSPACE_STATE.teamsWebhookUrl,
        discordWebhookUrl: backendWorkspace.discordWebhookUrl || DEFAULT_WORKSPACE_STATE.discordWebhookUrl,
        webhookEndpointUrl: backendWorkspace.webhookEndpointUrl || DEFAULT_WORKSPACE_STATE.webhookEndpointUrl,
        notificationTemplates: backendWorkspace.notificationTemplates || DEFAULT_WORKSPACE_STATE.notificationTemplates,
        escalationRules: backendWorkspace.escalationRules || DEFAULT_WORKSPACE_STATE.escalationRules,
        reminderRules: backendWorkspace.reminderRules || DEFAULT_WORKSPACE_STATE.reminderRules,
        digestEmails: backendWorkspace.digestEmails !== undefined ? backendWorkspace.digestEmails : DEFAULT_WORKSPACE_STATE.digestEmails,
        digestFrequency: backendWorkspace.digestFrequency || DEFAULT_WORKSPACE_STATE.digestFrequency,

        invoicePrefix: backendWorkspace.invoicePrefix || DEFAULT_WORKSPACE_STATE.invoicePrefix,
        invoiceDecimal: backendWorkspace.invoiceDecimal !== undefined ? backendWorkspace.invoiceDecimal : DEFAULT_WORKSPACE_STATE.invoiceDecimal,
        invoiceNumberStart: backendWorkspace.invoiceNumberStart !== undefined ? backendWorkspace.invoiceNumberStart : DEFAULT_WORKSPACE_STATE.invoiceNumberStart,
        quotationPrefix: backendWorkspace.quotationPrefix || DEFAULT_WORKSPACE_STATE.quotationPrefix,
        purchasePrefix: backendWorkspace.purchasePrefix || DEFAULT_WORKSPACE_STATE.purchasePrefix,
        creditNotePrefix: backendWorkspace.creditNotePrefix || DEFAULT_WORKSPACE_STATE.creditNotePrefix,
        gstEnabled: backendWorkspace.gstEnabled !== undefined ? backendWorkspace.gstEnabled : DEFAULT_WORKSPACE_STATE.gstEnabled,
        gstRateDefault: backendWorkspace.gstRateDefault !== undefined ? backendWorkspace.gstRateDefault : DEFAULT_WORKSPACE_STATE.gstRateDefault,
        taxConfiguration: backendWorkspace.taxConfiguration || DEFAULT_WORKSPACE_STATE.taxConfiguration,
        invoiceFooter: backendWorkspace.invoiceFooter || DEFAULT_WORKSPACE_STATE.invoiceFooter,
        invoiceTerms: backendWorkspace.invoiceTerms || DEFAULT_WORKSPACE_STATE.invoiceTerms,
        defaultPaymentTerms: backendWorkspace.defaultPaymentTerms || DEFAULT_WORKSPACE_STATE.defaultPaymentTerms,
        paymentGateway: backendWorkspace.paymentGateway || DEFAULT_WORKSPACE_STATE.paymentGateway,
        paymentGatewayConfig: backendWorkspace.paymentGatewayConfig || DEFAULT_WORKSPACE_STATE.paymentGatewayConfig,
        qrCodeEnabled: backendWorkspace.qrCodeEnabled !== undefined ? backendWorkspace.qrCodeEnabled : DEFAULT_WORKSPACE_STATE.qrCodeEnabled,
        qrCodeUrl: backendWorkspace.qrCodeUrl || DEFAULT_WORKSPACE_STATE.qrCodeUrl,
        digitalSignatureEnabled: backendWorkspace.digitalSignatureEnabled !== undefined ? backendWorkspace.digitalSignatureEnabled : DEFAULT_WORKSPACE_STATE.digitalSignatureEnabled,
        digitalSignatureUrl: backendWorkspace.digitalSignatureUrl || DEFAULT_WORKSPACE_STATE.digitalSignatureUrl,
        invoiceTemplate: backendWorkspace.invoiceTemplate || DEFAULT_WORKSPACE_STATE.invoiceTemplate,
        multiCurrencyEnabled: backendWorkspace.multiCurrencyEnabled !== undefined ? backendWorkspace.multiCurrencyEnabled : DEFAULT_WORKSPACE_STATE.multiCurrencyEnabled,
        supportedCurrencies: backendWorkspace.supportedCurrencies || DEFAULT_WORKSPACE_STATE.supportedCurrencies,

        aiModel: backendWorkspace.aiModel || DEFAULT_WORKSPACE_STATE.aiModel,
        aiTemperature: backendWorkspace.aiTemperature !== undefined ? backendWorkspace.aiTemperature : DEFAULT_WORKSPACE_STATE.aiTemperature,
        aiPromptTemplate: backendWorkspace.aiPromptTemplate || DEFAULT_WORKSPACE_STATE.aiPromptTemplate,
        aiAssistantName: backendWorkspace.aiAssistantName || DEFAULT_WORKSPACE_STATE.aiAssistantName,

        uploadedDocuments: backendWorkspace.uploadedDocuments || DEFAULT_WORKSPACE_STATE.uploadedDocuments,
        registrationCertificateUrl: backendCompany.registrationCertificateUrl || null,
        panCardUrl: backendCompany.panCardUrl || null,
        gstCertificateUrl: backendCompany.gstCertificateUrl || null,

        // Appearance
        themeMode: backendWorkspace.themeMode || DEFAULT_WORKSPACE_STATE.themeMode,
        sidebarStyle: backendWorkspace.sidebarStyle || DEFAULT_WORKSPACE_STATE.sidebarStyle,
        navigationStyle: backendWorkspace.navigationStyle || DEFAULT_WORKSPACE_STATE.navigationStyle,
        dashboardLayout: backendWorkspace.dashboardLayout || DEFAULT_WORKSPACE_STATE.dashboardLayout,
        widgetConfig: backendWorkspace.widgetConfig || DEFAULT_WORKSPACE_STATE.widgetConfig,
        cardDensity: backendWorkspace.cardDensity || DEFAULT_WORKSPACE_STATE.cardDensity,
        compactMode: backendWorkspace.compactMode !== undefined ? backendWorkspace.compactMode : DEFAULT_WORKSPACE_STATE.compactMode,
        loginScreenStyle: backendWorkspace.loginScreenStyle || DEFAULT_WORKSPACE_STATE.loginScreenStyle,
        registerScreenStyle: backendWorkspace.registerScreenStyle || DEFAULT_WORKSPACE_STATE.registerScreenStyle,
        emailTemplateStyle: backendWorkspace.emailTemplateStyle || DEFAULT_WORKSPACE_STATE.emailTemplateStyle,
        pdfBrandingStyle: backendWorkspace.pdfBrandingStyle || DEFAULT_WORKSPACE_STATE.pdfBrandingStyle,
        invoiceBrandingStyle: backendWorkspace.invoiceBrandingStyle || DEFAULT_WORKSPACE_STATE.invoiceBrandingStyle,
        primaryFont: backendWorkspace.primaryFont || DEFAULT_WORKSPACE_STATE.primaryFont,
        borderRadius: backendWorkspace.borderRadius || DEFAULT_WORKSPACE_STATE.borderRadius,
        animationsEnabled: backendWorkspace.animationsEnabled !== undefined ? backendWorkspace.animationsEnabled : DEFAULT_WORKSPACE_STATE.animationsEnabled,

        // Structure Registries
        costCenters: backendWorkspace.costCenters || DEFAULT_WORKSPACE_STATE.costCenters,
        grades: backendWorkspace.grades || DEFAULT_WORKSPACE_STATE.grades,
        bands: backendWorkspace.bands || DEFAULT_WORKSPACE_STATE.bands,
        designations: backendWorkspace.designations || DEFAULT_WORKSPACE_STATE.designations,
        jobLevels: backendWorkspace.jobLevels || DEFAULT_WORKSPACE_STATE.jobLevels,
        employmentTypes: backendWorkspace.employmentTypes || DEFAULT_WORKSPACE_STATE.employmentTypes,
        workModes: backendWorkspace.workModes || DEFAULT_WORKSPACE_STATE.workModes,
        shifts: backendWorkspace.shifts || DEFAULT_WORKSPACE_STATE.shifts,
        teams: backendWorkspace.teams || DEFAULT_WORKSPACE_STATE.teams,
      };

      setSavedWorkspace(merged);
      setWorkspaceDraft(merged);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('CRITICAL: fetchSettingsFromBackend failed:', err);
      toast.error(`Database settings sync failed: ${err?.message || err}`);
    }
  };

  // State Change triggers Draft mode
  const updateDraftField = (field: keyof WorkspaceState, value: any) => {
    // Push current draft to undo stack
    setUndoStack(prev => [...prev.slice(-30), workspaceDraft]); // Cap undo stack at 30
    setRedoStack([]); // Clear redo stack on manual edit

    const updated = { ...workspaceDraft, [field]: value };
    setWorkspaceDraft(updated);
    setHasUnsavedChanges(true);
  };

  // Undo & Redo Commands
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, workspaceDraft]);
    setWorkspaceDraft(previous);
    setHasUnsavedChanges(JSON.stringify(previous) !== JSON.stringify(savedWorkspace));
    toast.info('Undo setting action applied');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, workspaceDraft]);
    setWorkspaceDraft(next);
    setHasUnsavedChanges(JSON.stringify(next) !== JSON.stringify(savedWorkspace));
    toast.info('Redo setting action applied');
  };

  // Discard local changes
  const handleDiscardChanges = () => {
    setWorkspaceDraft(savedWorkspace);
    setHasUnsavedChanges(false);
    setUndoStack([]);
    setRedoStack([]);
    toast.info('Draft changes discarded. Restored saved state.');
  };

  const handleSaveDraft = () => {
    toast.success('Workspace settings draft saved successfully!');
  };

  // Publish changes to backend APIs (Only calls endpoints where values have actually changed)
  const handlePublishChanges = async () => {
    const sanitizeStr = (str: string) => str.replace(/<[^>]*>/g, '').trim();

    // 1. Evaluate Company Settings alterations
    const hasCompanyChanged = 
      workspaceDraft.companyName !== savedWorkspace.companyName ||
      workspaceDraft.email !== savedWorkspace.email ||
      workspaceDraft.phone !== savedWorkspace.phone ||
      workspaceDraft.address !== savedWorkspace.address ||
      workspaceDraft.website !== savedWorkspace.website ||
      workspaceDraft.primaryColor !== savedWorkspace.primaryColor ||
      workspaceDraft.secondaryColor !== savedWorkspace.secondaryColor ||
      workspaceDraft.logoUrl !== savedWorkspace.logoUrl ||
      workspaceDraft.smtpHost !== savedWorkspace.smtpHost ||
      workspaceDraft.smtpPort !== savedWorkspace.smtpPort ||
      workspaceDraft.smtpUser !== savedWorkspace.smtpUser ||
      workspaceDraft.smtpPassword !== savedWorkspace.smtpPassword ||
      workspaceDraft.gstNo !== savedWorkspace.gstNo ||
      workspaceDraft.pan !== savedWorkspace.pan ||
      workspaceDraft.gstCertificateUrl !== savedWorkspace.gstCertificateUrl ||
      workspaceDraft.panCardUrl !== savedWorkspace.panCardUrl ||
      workspaceDraft.registrationCertificateUrl !== savedWorkspace.registrationCertificateUrl;

    // 2. Evaluate Invoicing / Business Settings alterations
    const hasBusinessChanged = 
      workspaceDraft.businessName !== savedWorkspace.businessName ||
      workspaceDraft.businessEmail !== savedWorkspace.businessEmail ||
      workspaceDraft.businessPhone !== savedWorkspace.businessPhone ||
      workspaceDraft.businessAddress !== savedWorkspace.businessAddress ||
      workspaceDraft.gstNo !== savedWorkspace.gstNo ||
      workspaceDraft.pan !== savedWorkspace.pan ||
      workspaceDraft.tan !== savedWorkspace.tan ||
      workspaceDraft.registrationNo !== savedWorkspace.registrationNo ||
      workspaceDraft.termsAndConditions !== savedWorkspace.termsAndConditions ||
      workspaceDraft.notes !== savedWorkspace.notes ||
      workspaceDraft.paymentTerms !== savedWorkspace.paymentTerms;

    // 3. Evaluate extended configuration settings alterations
    const hasWorkspaceChanged = 
      workspaceDraft.legalName !== savedWorkspace.legalName ||
      workspaceDraft.workspaceName !== savedWorkspace.workspaceName ||
      workspaceDraft.orgCode !== savedWorkspace.orgCode ||
      workspaceDraft.businessType !== savedWorkspace.businessType ||
      workspaceDraft.industry !== savedWorkspace.industry ||
      workspaceDraft.timezone !== savedWorkspace.timezone ||
      workspaceDraft.language !== savedWorkspace.language ||
      workspaceDraft.country !== savedWorkspace.country ||
      workspaceDraft.currency !== savedWorkspace.currency ||
      workspaceDraft.fiscalYear !== savedWorkspace.fiscalYear ||
      workspaceDraft.cinNumber !== savedWorkspace.cinNumber ||
      workspaceDraft.msmeNumber !== savedWorkspace.msmeNumber ||
      workspaceDraft.supportEmail !== savedWorkspace.supportEmail ||
      workspaceDraft.supportPhone !== savedWorkspace.supportPhone ||
      workspaceDraft.officeHours !== savedWorkspace.officeHours ||
      workspaceDraft.emergencyContact !== savedWorkspace.emergencyContact ||
      workspaceDraft.defaultProbation !== savedWorkspace.defaultProbation ||
      workspaceDraft.noticePeriod !== savedWorkspace.noticePeriod ||
      workspaceDraft.empIdPrefix !== savedWorkspace.empIdPrefix ||
      workspaceDraft.usernamePattern !== savedWorkspace.usernamePattern ||
      workspaceDraft.emailPattern !== savedWorkspace.emailPattern ||
      workspaceDraft.leavePolicy !== savedWorkspace.leavePolicy ||
      workspaceDraft.shiftDefault !== savedWorkspace.shiftDefault ||
      workspaceDraft.joiningWorkflow !== savedWorkspace.joiningWorkflow ||
      workspaceDraft.confirmationWorkflow !== savedWorkspace.confirmationWorkflow ||
      workspaceDraft.autoEmpId !== savedWorkspace.autoEmpId ||
      workspaceDraft.workingHours !== savedWorkspace.workingHours ||
      workspaceDraft.weekendRules !== savedWorkspace.weekendRules ||
      workspaceDraft.passwordPolicy !== savedWorkspace.passwordPolicy ||
      workspaceDraft.devicePolicy !== savedWorkspace.devicePolicy ||
      workspaceDraft.loginRestrictions !== savedWorkspace.loginRestrictions ||
      workspaceDraft.mfaEnforced !== savedWorkspace.mfaEnforced ||
      workspaceDraft.sessionTimeout !== savedWorkspace.sessionTimeout ||
      workspaceDraft.passwordMinLength !== savedWorkspace.passwordMinLength ||
      workspaceDraft.ipWhitelist !== savedWorkspace.ipWhitelist ||
      workspaceDraft.allowedDomains !== savedWorkspace.allowedDomains ||
      workspaceDraft.notifyEmail !== savedWorkspace.notifyEmail ||
      workspaceDraft.notifySms !== savedWorkspace.notifySms ||
      workspaceDraft.notifyWhatsapp !== savedWorkspace.notifyWhatsapp ||
      workspaceDraft.notifySlack !== savedWorkspace.notifySlack ||
      workspaceDraft.notifyPush !== savedWorkspace.notifyPush ||
      workspaceDraft.notifyTeams !== savedWorkspace.notifyTeams ||
      workspaceDraft.notifyDiscord !== savedWorkspace.notifyDiscord ||
      workspaceDraft.notifyWebhook !== savedWorkspace.notifyWebhook ||
      workspaceDraft.notifyBrowser !== savedWorkspace.notifyBrowser ||
      workspaceDraft.slackWebhookUrl !== savedWorkspace.slackWebhookUrl ||
      workspaceDraft.teamsWebhookUrl !== savedWorkspace.teamsWebhookUrl ||
      workspaceDraft.discordWebhookUrl !== savedWorkspace.discordWebhookUrl ||
      workspaceDraft.webhookEndpointUrl !== savedWorkspace.webhookEndpointUrl ||
      JSON.stringify(workspaceDraft.notificationTemplates) !== JSON.stringify(savedWorkspace.notificationTemplates) ||
      JSON.stringify(workspaceDraft.escalationRules) !== JSON.stringify(savedWorkspace.escalationRules) ||
      JSON.stringify(workspaceDraft.reminderRules) !== JSON.stringify(savedWorkspace.reminderRules) ||
      workspaceDraft.digestEmails !== savedWorkspace.digestEmails ||
      workspaceDraft.digestFrequency !== savedWorkspace.digestFrequency ||
      workspaceDraft.invoicePrefix !== savedWorkspace.invoicePrefix ||
      workspaceDraft.invoiceDecimal !== savedWorkspace.invoiceDecimal ||
      workspaceDraft.invoiceNumberStart !== savedWorkspace.invoiceNumberStart ||
      workspaceDraft.quotationPrefix !== savedWorkspace.quotationPrefix ||
      workspaceDraft.purchasePrefix !== savedWorkspace.purchasePrefix ||
      workspaceDraft.creditNotePrefix !== savedWorkspace.creditNotePrefix ||
      workspaceDraft.gstEnabled !== savedWorkspace.gstEnabled ||
      workspaceDraft.gstRateDefault !== savedWorkspace.gstRateDefault ||
      JSON.stringify(workspaceDraft.taxConfiguration) !== JSON.stringify(savedWorkspace.taxConfiguration) ||
      workspaceDraft.invoiceFooter !== savedWorkspace.invoiceFooter ||
      workspaceDraft.invoiceTerms !== savedWorkspace.invoiceTerms ||
      workspaceDraft.defaultPaymentTerms !== savedWorkspace.defaultPaymentTerms ||
      workspaceDraft.paymentGateway !== savedWorkspace.paymentGateway ||
      JSON.stringify(workspaceDraft.paymentGatewayConfig) !== JSON.stringify(savedWorkspace.paymentGatewayConfig) ||
      workspaceDraft.qrCodeEnabled !== savedWorkspace.qrCodeEnabled ||
      workspaceDraft.qrCodeUrl !== savedWorkspace.qrCodeUrl ||
      workspaceDraft.digitalSignatureEnabled !== savedWorkspace.digitalSignatureEnabled ||
      workspaceDraft.digitalSignatureUrl !== savedWorkspace.digitalSignatureUrl ||
      workspaceDraft.invoiceTemplate !== savedWorkspace.invoiceTemplate ||
      workspaceDraft.multiCurrencyEnabled !== savedWorkspace.multiCurrencyEnabled ||
      JSON.stringify(workspaceDraft.supportedCurrencies) !== JSON.stringify(savedWorkspace.supportedCurrencies) ||
      workspaceDraft.aiModel !== savedWorkspace.aiModel ||
      workspaceDraft.aiTemperature !== savedWorkspace.aiTemperature ||
      workspaceDraft.aiPromptTemplate !== savedWorkspace.aiPromptTemplate ||
      workspaceDraft.aiAssistantName !== savedWorkspace.aiAssistantName ||
      workspaceDraft.faviconUrl !== savedWorkspace.faviconUrl ||
      JSON.stringify(workspaceDraft.uploadedDocuments) !== JSON.stringify(savedWorkspace.uploadedDocuments);

    const promises = [];
    const callsMade: string[] = [];
    const token = getStoredSessionToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (hasCompanyChanged) {
      callsMade.push('Company Details');
      const companyPayload = {
        companyName: sanitizeStr(workspaceDraft.companyName),
        email: sanitizeStr(workspaceDraft.email),
        phone: workspaceDraft.phone ? workspaceDraft.phone.replace(/\D/g, '') : null,
        address: sanitizeStr(workspaceDraft.address),
        website: sanitizeStr(workspaceDraft.website),
        primaryColor: sanitizeStr(workspaceDraft.primaryColor),
        secondaryColor: sanitizeStr(workspaceDraft.secondaryColor),
        logoUrl: sanitizeStr(workspaceDraft.logoUrl),
        smtpHost: sanitizeStr(workspaceDraft.smtpHost || ''),
        smtpPort: workspaceDraft.smtpPort ? Number(workspaceDraft.smtpPort) : null,
        smtpUser: sanitizeStr(workspaceDraft.smtpUser || ''),
        smtpPassword: workspaceDraft.smtpPassword || null,
        gstin: sanitizeStr(workspaceDraft.gstNo),
        pan: sanitizeStr(workspaceDraft.pan),
        registrationCertificateUrl: workspaceDraft.registrationCertificateUrl ? sanitizeStr(workspaceDraft.registrationCertificateUrl) : null,
        panCardUrl: workspaceDraft.panCardUrl ? sanitizeStr(workspaceDraft.panCardUrl) : null,
        gstCertificateUrl: workspaceDraft.gstCertificateUrl ? sanitizeStr(workspaceDraft.gstCertificateUrl) : null,
      };

      promises.push(
        fetch('/api/company-settings', {
          method: 'PUT',
          headers,
          body: JSON.stringify(companyPayload),
        })
      );
    }

    if (hasBusinessChanged) {
      callsMade.push('Billing Profiles');
      const businessPayload = {
        businessName: sanitizeStr(workspaceDraft.businessName),
        email: sanitizeStr(workspaceDraft.businessEmail),
        phone: workspaceDraft.businessPhone ? workspaceDraft.businessPhone.replace(/\D/g, '') : null,
        address: sanitizeStr(workspaceDraft.businessAddress),
        gstNo: sanitizeStr(workspaceDraft.gstNo),
        pan: sanitizeStr(workspaceDraft.pan),
        tan: sanitizeStr(workspaceDraft.tan),
        registrationNo: sanitizeStr(workspaceDraft.registrationNo),
        termsAndConditions: sanitizeStr(workspaceDraft.termsAndConditions),
        notes: sanitizeStr(workspaceDraft.notes),
        paymentTerms: sanitizeStr(workspaceDraft.paymentTerms),
        logoUrl: sanitizeStr(workspaceDraft.logoUrl || '')
      };

      promises.push(
        fetch('/api/business-settings', {
          method: 'POST',
          headers,
          body: JSON.stringify(businessPayload),
        })
      );
    }

    if (hasWorkspaceChanged) {
      callsMade.push('Workspace Metadata');
      promises.push(
        fetch('/api/workspace-settings', {
          method: 'PUT',
          headers,
          body: JSON.stringify(workspaceDraft),
        })
      );
    }

    if (promises.length === 0) {
      toast.info('No changes detected in workspace configs.');
      setHasUnsavedChanges(false);
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {
        setSavedWorkspace(workspaceDraft);
        setHasUnsavedChanges(false);
        setUndoStack([]);
        setRedoStack([]);
        toast.success(`Published changes successfully: ${callsMade.join(', ')}`);
      } else {
        toast.error('Some updates failed to synchronize.');
      }
    } catch {
      toast.error('Error occurred during secure cloud publish sync');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut listener (Ctrl + S -> Save, Ctrl + Z -> Undo, Ctrl + Y -> Redo)
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) handlePublishChanges();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [workspaceDraft, hasUnsavedChanges, undoStack, redoStack]);

  // File Upload Helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'logoUrl' | 'faviconUrl' | 'documents') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type) || 
                    file.name.toLowerCase().endsWith('.png') || 
                    file.name.toLowerCase().endsWith('.jpg') || 
                    file.name.toLowerCase().endsWith('.jpeg');

    const isDoc = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type) ||
                  file.name.toLowerCase().endsWith('.pdf') ||
                  file.name.toLowerCase().endsWith('.docx');

    if (targetField === 'logoUrl' || targetField === 'faviconUrl') {
      if (!isImage) {
        toast.error('Invalid image type. Only PNG and JPG/JPEG are allowed for branding logos.');
        return;
      }
      if (file.size > 1 * 1024 * 1024) {
        toast.error('File size exceeds the 1MB limit for images.');
        return;
      }
    } else {
      if (!isImage && !isDoc) {
        toast.error('Invalid file type. Only PDF, DOCX, and images (PNG, JPG) are allowed for corporate documents.');
        return;
      }
      const limit = isImage ? 1 * 1024 * 1024 : 2 * 1024 * 1024;
      if (file.size > limit) {
        toast.error(`File size exceeds the limit of ${isImage ? '1MB' : '2MB'}.`);
        return;
      }
    }

    const kind = targetField === 'documents' ? 'employee_document' : 'avatar';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);

    const token = getStoredSessionToken();
    const headers: Record<string, string> = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    toast.info(`Uploading file: ${file.name}...`);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const resJson = await res.json();
      const isSuccess = res.ok && (resJson.success === true || !!resJson.url || !!resJson.data?.url);

      if (isSuccess) {
        const fileUrl = resJson.data?.url || resJson.url || '';
        toast.success(`${file.name} uploaded successfully!`);
        
        if (targetField === 'logoUrl') {
          updateDraftField('logoUrl', fileUrl);
        } else if (targetField === 'faviconUrl') {
          updateDraftField('faviconUrl', fileUrl);
        } else if (targetField === 'documents') {
          // Format file size
          const formatBytes = (bytes: number) => {
            if (!bytes) return '0 Bytes';
            const k = 1024;
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            const sizes = ['Bytes', 'KB', 'MB'];
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
          };

          const newDoc: DocumentVaultItem = {
            name: file.name,
            size: formatBytes(file.size),
            type: file.type.includes('pdf') ? 'Compliance PDF' : 'Branded Asset Image',
            fileUrl: fileUrl,
            expiry: 'Permanent'
          };
          updateDraftField('uploadedDocuments', [...(workspaceDraft.uploadedDocuments || []), newDoc]);
        }
      } else {
        toast.error(resJson.error || resJson.message || 'File upload failed');
      }
    } catch {
      toast.error('Network dispatch connection failure during upload');
    }
  };

  // Safe file link generator appending the active token
  const getFileUrlWithToken = (url: string) => {
    if (!url) return '';
    const token = getStoredSessionToken();
    if (url.includes('?')) {
      return `${url}&token=${token}`;
    }
    return `${url}?token=${token}`;
  };

  // Remove document helper
  const handleRemoveDocument = (index: number) => {
    const currentList = [...(workspaceDraft.uploadedDocuments || [])];
    currentList.splice(index, 1);
    updateDraftField('uploadedDocuments', currentList);
    toast.success('Document reference removed from workspace');
  };

  // Custom document vault upload handler
  const handleVaultDocumentUpload = async () => {
    if (!docUploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const fileNameLower = docUploadFile.name.toLowerCase();
    const mimeType = docUploadFile.type;
    
    const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/jpg' || 
                    fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png');
                    
    const isPdf = mimeType === 'application/pdf' || fileNameLower.endsWith('.pdf');
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileNameLower.endsWith('.docx');
    
    if (!isImage && !isPdf && !isDocx) {
      toast.error('Only PDF, DOCX, and images (JPG, JPEG, PNG) are accepted.');
      return;
    }
    
    const fileLimit = isImage ? 1 * 1024 * 1024 : 2 * 1024 * 1024;
    if (docUploadFile.size > fileLimit) {
      toast.error(`File size exceeds the limit of ${isImage ? '1 MB' : '2 MB'}`);
      return;
    }

    const formData = new FormData();
    formData.append('file', docUploadFile);
    formData.append('kind', 'employee_document');

    const token = getStoredSessionToken();
    const headers: Record<string, string> = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    toast.info(`Uploading document to vault: ${docUploadFile.name}...`);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const resJson = await res.json();
      const isSuccess = res.ok && (resJson.success === true || !!resJson.url || !!resJson.data?.url);

      if (isSuccess) {
        const fileUrl = resJson.data?.url || resJson.url || '';
        
        const formatBytes = (bytes: number) => {
          if (!bytes) return '0 Bytes';
          const k = 1024;
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          const sizes = ['Bytes', 'KB', 'MB'];
          return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        };

        const newDoc: DocumentVaultItem = {
          name: docUploadName.trim() || docUploadFile.name,
          size: formatBytes(docUploadFile.size),
          type: docUploadCategory,
          fileUrl: fileUrl,
          expiry: docUploadExpiry
        };

        updateDraftField('uploadedDocuments', [...(workspaceDraft.uploadedDocuments || []), newDoc]);
        toast.success(`Successfully registered document: ${newDoc.name}`);
        
        // Reset states and close modal
        setDocUploadFile(null);
        setDocUploadName('');
        setDocUploadCategory('Policies');
        setDocUploadExpiry('Permanent');
        setIsDocUploadModalOpen(false);
      } else {
        toast.error(resJson.error || resJson.message || 'File upload failed');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Network dispatch connection failure during upload');
    }
  };

  const handleOnboardingFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onboardingUploadTarget) return;

    // 1MB size limit
    if (file.size > 1 * 1024 * 1024) {
      toast.error('File size exceeds the 1MB limit. Please upload a smaller file.');
      return;
    }

    // Type validation
    if (!['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(file.type)) {
      toast.error('Invalid file type. Only PNG, JPG, and PDF are allowed.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', 'employee_document');

    const token = getStoredSessionToken();
    const headers: Record<string, string> = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    toast.info(`Uploading official certificate: ${file.name}...`);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const resJson = await res.json();
      const isSuccess = res.ok && (resJson.success === true || !!resJson.url || !!resJson.data?.url);

      if (isSuccess) {
        const fileUrl = resJson.data?.url || resJson.url || '';
        
        if (onboardingUploadTarget === 'gst') {
          updateDraftField('gstCertificateUrl', fileUrl);
        } else if (onboardingUploadTarget === 'pan') {
          updateDraftField('panCardUrl', fileUrl);
        } else if (onboardingUploadTarget === 'reg') {
          updateDraftField('registrationCertificateUrl', fileUrl);
        }

        toast.success(`Successfully uploaded and verified actual ${file.name}! Save changes to publish.`);
      } else {
        toast.error(resJson.error || resJson.message || 'File upload failed');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Network dispatch connection failure during upload');
    } finally {
      setOnboardingUploadTarget(null);
      if (onboardingInputRef.current) onboardingInputRef.current.value = '';
    }
  };

  // Compile both onboarding files and direct uploaded files
  const getCompiledDocuments = () => {
    const list: any[] = [];

    // Onboarding items if urls present
    if (workspaceDraft.gstCertificateUrl) {
      list.push({
        name: 'GST Registration Certificate',
        type: 'GST',
        size: '1.2 MB',
        fileUrl: workspaceDraft.gstCertificateUrl,
        expiry: 'Permanent',
        isOnboarding: true,
        onboardingKey: 'gst',
      });
    }
    if (workspaceDraft.panCardUrl) {
      list.push({
        name: 'Corporate PAN Card',
        type: 'PAN',
        size: '800 KB',
        fileUrl: workspaceDraft.panCardUrl,
        expiry: 'Permanent',
        isOnboarding: true,
        onboardingKey: 'pan',
      });
    }
    if (workspaceDraft.registrationCertificateUrl) {
      list.push({
        name: 'Corporate Registration Deed/Certificate',
        type: 'Certificates',
        size: '2.5 MB',
        fileUrl: workspaceDraft.registrationCertificateUrl,
        expiry: 'Permanent',
        isOnboarding: true,
        onboardingKey: 'reg',
      });
    }

    // Merged items
    if (Array.isArray(workspaceDraft.uploadedDocuments)) {
      workspaceDraft.uploadedDocuments.forEach((doc, idx) => {
        list.push({
          ...doc,
          index: idx,
          isOnboarding: false,
        });
      });
    }

    return list;
  };

  const handlePasswordChange = async (values: PasswordChangeFormValues) => {
    setChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Admin password updated successfully');
        passwordForm.reset();
      } else {
        toast.error(data.error || 'Failed to update credentials');
      }
    } catch {
      toast.error('Secure key change relay failed');
    } finally {
      setChangingPassword(false);
    }
  };

  // Strict RBAC Role verification: Visible only to owner, directors, and admin roles
  const isAllowedRole = currentUser && [
    'super_admin',
    'admin',
    'ceo',
    'cto',
    'director',
    'cms_administrator',
    'owner',
    'management'
  ].includes(String(currentUser.role).toLowerCase());

  if (currentUser && !isAllowedRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border border-border rounded-2xl shadow-xs">
        <div className="p-4 bg-destructive/10 text-destructive rounded-full mb-4">
          <Lock className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Access Denied</h3>
        <p className="text-xs text-muted-foreground max-w-md mt-2 leading-relaxed">
          The Workspace Settings center is only visible to Business Owners, Directors, CEOs, and Administrators. You do not have permissions to view or edit configurations for this tenant.
        </p>
        <Button onClick={() => router.push('/dashboard')} className="mt-6 bg-primary text-white hover:bg-primary/90 rounded-xl px-5 text-xs font-bold h-10">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // Group definitions for vertical navigation accordion list
  const navigationGroups = [
    {
      group: 'General',
      tabs: [
        { id: 'overview', label: 'Organization Overview', icon: Building2 },
        { id: 'company', label: 'Company Profile', icon: UserIcon },
        { id: 'structure', label: 'Organization Structure', icon: Layers },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'documents', label: 'Org Documents', icon: FileText }
      ]
    },
    {
      group: 'HR & Operations',
      tabs: [
        { id: 'defaults', label: 'Employee Defaults', icon: Calendar },
        { id: 'users', label: 'Users & Roles', icon: Users },
        { id: 'notifications', label: 'Notification Center', icon: Bell },
        { id: 'automation', label: 'Workflow Automation', icon: Play }
      ]
    },
    {
      group: 'Financials',
      tabs: [
        { id: 'invoice', label: 'Invoice Settings', icon: Banknote },
        { id: 'billing', label: 'Billing & Subscription', icon: Award }
      ]
    },
    {
      group: 'Developer & AI',
      tabs: [
        { id: 'integrations', label: 'Integrations', icon: Plug },
        { id: 'dynamic', label: 'Dynamic Schema Engine', icon: Database },
        { id: 'ai', label: 'AI Configuration', icon: Brain },
        { id: 'api', label: 'API Management', icon: Key },
        { id: 'advanced', label: 'Advanced Settings', icon: Sliders }
      ]
    },
    {
      group: 'Security & Integrity',
      tabs: [
        { id: 'security', label: 'Security Center', icon: Shield },
        { id: 'compliance', label: 'Compliance', icon: FileCheck },
        { id: 'data', label: 'Data Management', icon: HardDrive },
        { id: 'backup', label: 'Backup & Recovery', icon: RefreshCw },
        { id: 'audit', label: 'Audit Logs', icon: Activity }
      ]
    }
  ];

  // Search Filter utility
  const isTabVisible = (tabId: string) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const keywords = SETTINGS_KEYWORDS[tabId] || [];
    return keywords.some(k => k.includes(q));
  };

  // Local state elements for visuals (interactive Org Chart list mockups)
  const currentCostCenters = ['CC-ENG-01', 'CC-QA-02', 'CC-MKT-03', 'CC-HR-04'];

  if (loading) {
    return (
      <div className="space-y-6 pb-24 font-sans animate-in fade-in duration-300">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              <span className="text-muted-foreground">/</span>
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-80 bg-muted rounded-xl animate-pulse" />
        </div>

        {/* Tab navigation skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg animate-pulse bg-muted" style={{ width: `${80 + Math.random() * 60}px` }} />
          ))}
        </div>

        {/* Content skeleton - settings form */}
        <div className="space-y-6">
          {/* Card 1 */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                <div className="h-3 w-72 bg-muted/60 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 bg-muted/70 rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted rounded-xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                <div className="h-3 w-64 bg-muted/60 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-muted/70 rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading indicator text */}
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
          <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span>Loading workspace configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 font-sans">
      {/* Hidden inputs for uploads */}
      <input type="file" ref={logoInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={e => handleFileUpload(e, 'logoUrl')} />
      <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={e => handleFileUpload(e, 'faviconUrl')} />
      <input type="file" ref={invoiceLogoInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={e => handleFileUpload(e, 'logoUrl')} />
      <input type="file" ref={docVaultInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg, application/pdf" onChange={e => handleFileUpload(e, 'documents')} />
      <input type="file" ref={onboardingInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg, application/pdf" onChange={handleOnboardingFileUpload} />

      {/* Settings Center Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Settings</span>
            <span>/</span>
            <span className="text-primary">{activeTab.replace('-', ' ')}</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Workspace Configuration
            {hasUnsavedChanges && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-bold text-[10px]">
                Draft Changes Active
              </Badge>
            )}
          </h2>
        </div>

        {/* Global Settings Search Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search settings (e.g. GST, logo, LDAP, API)..."
              className="pl-9 h-10 text-xs bg-card border-border rounded-xl focus-visible:ring-primary/20"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="icon" className="rounded-xl shrink-0" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Configurations Container */}
      <div className="flex flex-col xl:flex-row gap-6 min-h-[70vh] items-start">
        
        {/* Left Side Pane: Collapsible Categories */}
        <div className="w-full xl:w-64 shrink-0 space-y-4 sticky top-6 bg-card border border-border/60 p-4 rounded-2xl shadow-xs">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">Navigation Categories</div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {navigationGroups.map(group => {
              const visibleTabs = group.tabs.filter(t => isTabVisible(t.id));
              if (visibleTabs.length === 0) return null;

              return (
                <div key={group.group} className="space-y-1">
                  <div className="text-[9px] font-extrabold text-primary dark:text-primary uppercase tracking-widest px-2 pb-1 border-b border-border/20">
                    {group.group}
                  </div>
                  {visibleTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                          isActive 
                            ? 'bg-primary/10 text-primary scale-[1.01]' 
                            : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="truncate">{tab.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground font-semibold px-2">
            <span>Version v2.6.0</span>
            <button onClick={() => void fetchInitialData()} className="text-primary hover:underline flex items-center gap-1">
              Reload settings
            </button>
          </div>
        </div>

        {/* Central Component: Dynamic Rendering of Selected Tab */}
        <div className="flex-1 w-full space-y-6">
          
          {/* TAB 1: Organization Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <div className="h-1.5 w-full bg-primary" />
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Organization Overview
                  </CardTitle>
                  <CardDescription>Verify your multi-tenant tenant identifiers and primary workspace coordinates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Upload placeholders */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="p-4 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/20 dark:bg-zinc-900/10">
                      {workspaceDraft.logoUrl ? (
                        <img 
                          src={getFileUrlWithToken(workspaceDraft.logoUrl)} 
                          alt="Logo Preview" 
                          className="w-16 h-16 rounded-xl object-contain border mb-3 bg-white" 
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground mb-3">
                          <Building2 className="h-8 w-8" />
                        </div>
                      )}
                      <h4 className="font-bold text-xs">Organization Logo</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG up to 1MB max</p>
                      <Button size="sm" variant="outline" className="mt-3 text-[10px] h-8 text-primary border-primary/20 hover:bg-primary/5 px-3 rounded-lg" onClick={() => logoInputRef.current?.click()}>
                        Upload Logo
                      </Button>
                    </div>

                    <div className="p-4 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/20 dark:bg-zinc-900/10">
                      {workspaceDraft.faviconUrl ? (
                        <img 
                          src={getFileUrlWithToken(workspaceDraft.faviconUrl)} 
                          alt="Favicon Preview" 
                          className="w-12 h-12 rounded object-contain border mb-3 bg-white" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground mb-3">
                          <Sparkles className="h-6 w-6" />
                        </div>
                      )}
                      <h4 className="font-bold text-xs">Workspace Favicon</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG up to 1MB max</p>
                      <Button size="sm" variant="outline" className="mt-3 text-[10px] h-8 text-primary border-primary/20 hover:bg-primary/5 px-3 rounded-lg" onClick={() => faviconInputRef.current?.click()}>
                        Upload Favicon
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company Public Name</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.companyName}
                        onChange={e => updateDraftField('companyName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Legal Incorporated Name</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.legalName}
                        onChange={e => updateDraftField('legalName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace Slug</Label>
                      <Input 
                        className="text-xs rounded-xl bg-slate-50 dark:bg-zinc-900/50"
                        value={workspaceDraft.workspaceName}
                        onChange={e => updateDraftField('workspaceName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace Code (Read Only)</Label>
                      <Input 
                        className="text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 cursor-not-allowed"
                        disabled
                        value={workspaceDraft.orgCode}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Organization ID</Label>
                      <Input 
                        className="text-xs rounded-xl bg-slate-50 dark:bg-zinc-900/50"
                        disabled
                        value={currentUser?.tenantId ? `UUID-${currentUser.tenantId}` : 'Loading...'}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Sector / Industry</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.industry}
                        onChange={e => updateDraftField('industry', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Entity Legal Status</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none focus-visible:ring-primary/20 h-10 font-sans"
                        value={workspaceDraft.businessType}
                        onChange={e => updateDraftField('businessType', e.target.value)}
                      >
                        <option value="Private Limited">Private Limited</option>
                        <option value="Partnership">Partnership</option>
                        <option value="LLP">LLP (Limited Liability Partnership)</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="One Person Company (OPC)">One Person Company (OPC)</option>
                        <option value="Public Limited">Public Limited</option>
                        <option value="NGO / Trust">NGO / Trust</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 font-sans">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Timezone</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none focus-visible:ring-primary/20 h-10 font-sans"
                        value={workspaceDraft.timezone}
                        onChange={e => updateDraftField('timezone', e.target.value)}
                      >
                        <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30)</option>
                        <option value="UTC (GMT+0:00)">UTC (GMT+0:00)</option>
                        <option value="America/New_York (GMT-5:00)">America/New_York (GMT-5:00)</option>
                        <option value="Europe/London (GMT+0:00)">Europe/London (GMT+0:00)</option>
                        <option value="Asia/Singapore (GMT+8:00)">Asia/Singapore (GMT+8:00)</option>
                        <option value="Asia/Dubai (GMT+4:00)">Asia/Dubai (GMT+4:00)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Currency</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none focus-visible:ring-primary/20 h-10 font-sans"
                        value={workspaceDraft.currency}
                        onChange={e => updateDraftField('currency', e.target.value)}
                      >
                        <option value="INR (₹)">INR (₹)</option>
                        <option value="USD ($)">USD ($)</option>
                        <option value="EUR (€)">EUR (€)</option>
                        <option value="GBP (£)">GBP (£)</option>
                        <option value="AED (AED)">AED (AED)</option>
                        <option value="SGD (S$)">SGD (S$)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Corporate Fiscal Year</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none focus-visible:ring-primary/20 h-10 font-sans"
                        value={workspaceDraft.fiscalYear}
                        onChange={e => updateDraftField('fiscalYear', e.target.value)}
                      >
                        <option value="April to March">April to March</option>
                        <option value="January to December">January to December</option>
                        <option value="July to June">July to June</option>
                        <option value="October to September">October to September</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: Company Profile */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Incorporation & Corporate Profile</CardTitle>
                  <CardDescription>Configure corporate registry entries, branch metrics, and headquarters information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GSTIN Number</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.gstNo}
                        onChange={e => updateDraftField('gstNo', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Corporate PAN Code</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.pan}
                        onChange={e => updateDraftField('pan', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CIN Registry Code</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.cinNumber}
                        onChange={e => updateDraftField('cinNumber', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">MSME Registration Number</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.msmeNumber}
                        onChange={e => updateDraftField('msmeNumber', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Emergency Corporate Helpline</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.emergencyContact}
                        onChange={e => updateDraftField('emergencyContact', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Support Escrow Email</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.supportEmail}
                        onChange={e => updateDraftField('supportEmail', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Support Escrow Phone</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.supportPhone}
                        onChange={e => updateDraftField('supportPhone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered HQ Address</Label>
                    <textarea 
                      rows={2}
                      className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background font-sans"
                      value={workspaceDraft.address}
                      onChange={e => updateDraftField('address', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: Organization Structure */}
          {activeTab === 'structure' && (
            <div className="space-y-6">
              {/* Card 1: Org Chart */}
              <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-slate-50/50 dark:bg-zinc-900/20 px-6 py-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        Interactive Org Chart & Cost Centers
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1">
                        Visual reporting tree of companies, cost centers, branches, and reporting nodes. Drag & Drop to restructure reporting hierarchy.
                      </CardDescription>
                    </div>
                    {orgNodes.length > 0 && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border-none font-bold text-[10px] uppercase tracking-wider py-1 px-2">
                        {orgNodes.length} Members Loaded
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {orgLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
                      <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-xs text-muted-foreground font-semibold">Resolving employee hierarchy...</span>
                    </div>
                  ) : orgNodes.length === 0 ? (
                    /* Elegant placeholder tree when no employee rows exist */
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-900/30 rounded-2xl border border-border min-h-[350px]">
                      <div className="p-3.5 bg-primary text-white font-extrabold rounded-2xl text-xs shadow-md mb-6 transition-all hover:scale-105">
                        Board of Directors (CEO / CTO)
                      </div>
                      
                      <div className="w-[2px] h-8 bg-border" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl mt-4">
                        <div className="flex flex-col items-center bg-card border border-border p-4 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-foreground">Engineering BU</span>
                          <span className="text-[10px] text-muted-foreground mt-1">Cost Center: CC-ENG-01</span>
                        </div>

                        <div className="flex flex-col items-center bg-card border border-border p-4 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-foreground">Product & Design</span>
                          <span className="text-[10px] text-muted-foreground mt-1">Cost Center: CC-QA-02</span>
                        </div>

                        <div className="flex flex-col items-center bg-card border border-border p-4 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-foreground">Sales & Marketing</span>
                          <span className="text-[10px] text-muted-foreground mt-1">Cost Center: CC-MKT-03</span>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col items-center gap-2 text-center">
                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 uppercase font-bold text-[10px] tracking-wider px-2 py-0.5">
                          Visual Mockup Mode
                        </Badge>
                        <p className="text-[11px] text-muted-foreground max-w-sm">
                          No active employee profiles found in this tenant database yet. Add employees in the workforce module to activate the live reporting hierarchy.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Live dynamic Org Chart Renderer with Drag & Drop */
                    <div className="overflow-x-auto p-4 bg-slate-50 dark:bg-zinc-900/30 rounded-2xl border border-border min-h-[400px]">
                      <div className="flex flex-col items-center min-w-[700px] py-6">
                        {/* Roots (nodes with no manager or manager not in list) */}
                        {orgNodes
                          .filter(node => !node.managerId || !orgNodes.some(n => n.userId === node.managerId))
                          .map(rootNode => {
                            const renderNodeTree = (node: any) => {
                              const children = orgNodes.filter(n => n.managerId === node.userId);
                              return (
                                <div key={node.id} className="flex flex-col items-center">
                                  {/* Draggable Card Node */}
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('text/plain', String(node.id));
                                      e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      const draggedId = Number(e.dataTransfer.getData('text/plain'));
                                      handleNodeDrop(draggedId, node.id);
                                    }}
                                    className="relative flex flex-col items-center bg-card border border-border hover:border-primary/50 hover:shadow-md rounded-2xl p-4 w-52 transition-all cursor-grab active:cursor-grabbing group shadow-sm"
                                  >
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary uppercase text-sm border border-primary/20">
                                      {node.avatarUrl ? (
                                        <img src={node.avatarUrl} alt={node.name} className="h-full w-full rounded-full object-cover" />
                                      ) : (
                                        node.name.substring(0, 2)
                                      )}
                                    </div>
                                    <h4 className="text-xs font-bold text-foreground text-center mt-2 truncate w-full">{node.name}</h4>
                                    <span className="text-[10px] text-primary font-bold text-center mt-0.5 truncate w-full">{node.designation}</span>
                                    <span className="text-[9px] text-muted-foreground text-center mt-0.5 truncate w-full">{node.department}</span>
                                    {node.costCenter && (
                                      <span className="mt-2 text-[8px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                                        {node.costCenter}
                                      </span>
                                    )}
                                  </div>

                                  {/* Connector Line if children exist */}
                                  {children.length > 0 && (
                                    <>
                                      <div className="w-[2px] h-6 bg-border" />
                                      <div className="relative flex justify-center w-full">
                                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-border w-[90%] mx-auto" />
                                        <div className="flex gap-8 pt-6 relative">
                                          {children.map(child => renderNodeTree(child))}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            };
                            return renderNodeTree(rootNode);
                          })}
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-semibold text-center border-t border-border/60 pt-4">
                        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span>HTML5 drag reporting nodes and drop onto manager cards to instantly restructure reporting links.</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 2: Registries Manager */}
              <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-slate-50/50 dark:bg-zinc-900/20 px-6 py-5">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-primary" />
                    Organizational Registry Configuration
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Manage active divisions, branches, designations, shifts, and cost codes across the enterprise tenant workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Select Registry Category */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registry Domain</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={activeRegistry}
                        onChange={(e) => setActiveRegistry(e.target.value as any)}
                      >
                        <option value="costCenters">Cost Centers Codes</option>
                        <option value="grades">Employee Grades</option>
                        <option value="bands">Compensation Bands</option>
                        <option value="designations">Corporate Designations</option>
                        <option value="jobLevels">Job Seniority Levels</option>
                        <option value="employmentTypes">Employment Types</option>
                        <option value="workModes">Work Mode Policies</option>
                        <option value="shifts">Operational Work Shifts</option>
                        <option value="teams">Corporate Departments/Teams</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Register New Registry Item</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder={`Add new entry (e.g. ${
                            activeRegistry === 'costCenters' ? 'CC-RND-05' :
                            activeRegistry === 'grades' ? 'G6' :
                            activeRegistry === 'shifts' ? 'Night Shift (10 PM - 6 AM)' : 'New Corporate Node'
                          })...`}
                          className="text-xs rounded-xl"
                          value={newRegistryItem}
                          onChange={(e) => setNewRegistryItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addRegistryItem();
                          }}
                        />
                        <Button 
                          onClick={addRegistryItem} 
                          className="h-10 text-xs font-bold rounded-xl px-4 flex items-center gap-1.5"
                        >
                          <Plus className="h-4 w-4" /> Add Item
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Registered Active Items List */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Currently Configured Entries ({((workspaceDraft[activeRegistry] || []) as string[]).length})
                    </Label>
                    <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                      {((workspaceDraft[activeRegistry] || []) as string[]).map((item: string) => (
                        <div 
                          key={item} 
                          className="p-3 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-xl flex justify-between items-center transition-all hover:bg-slate-100/50 dark:hover:bg-zinc-800/20"
                        >
                          <span className="text-xs font-semibold text-foreground truncate max-w-[80%]">{item}</span>
                          <button 
                            onClick={() => removeRegistryItem(item)}
                            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                            title="Delete Item"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {((workspaceDraft[activeRegistry] || []) as string[]).length === 0 && (
                        <div className="col-span-full py-6 text-center text-xs text-muted-foreground border-2 border-dashed border-border/80 rounded-xl">
                          No items configured in this registry.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: Employee Defaults */}
          {activeTab === 'defaults' && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border shadow-xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Probation & Onboarding Workflows
                    </CardTitle>
                    <CardDescription className="text-xs">Configure probationary terms, notice periods, and operational flows.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Probation Period (Months)</Label>
                        <Input 
                          type="number"
                          className="text-xs rounded-xl h-10"
                          value={workspaceDraft.defaultProbation}
                          onChange={e => updateDraftField('defaultProbation', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notice Period (Days)</Label>
                        <Input 
                          type="number"
                          className="text-xs rounded-xl h-10"
                          value={workspaceDraft.noticePeriod}
                          onChange={e => updateDraftField('noticePeriod', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Joining Onboarding Workflow</Label>
                      <select
                        className="w-full text-xs rounded-xl border border-input bg-background px-3 h-10 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                        value={workspaceDraft.joiningWorkflow || 'Standard Paperless Onboarding'}
                        onChange={e => updateDraftField('joiningWorkflow', e.target.value)}
                      >
                        <option value="Standard Paperless Onboarding">Standard Paperless Onboarding</option>
                        <option value="Fast-track (No verification)">Fast-track (No verification)</option>
                        <option value="Custom Onboarding Flow">Custom Onboarding Flow</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmation Workflow</Label>
                      <select
                        className="w-full text-xs rounded-xl border border-input bg-background px-3 h-10 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                        value={workspaceDraft.confirmationWorkflow || 'Manager Review required'}
                        onChange={e => updateDraftField('confirmationWorkflow', e.target.value)}
                      >
                        <option value="Automatic confirmation">Automatic confirmation</option>
                        <option value="Manager Review required">Manager Review required</option>
                        <option value="HR & Manager sign-off required">HR & Manager sign-off required</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-xs rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-primary" />
                      Employee Numbering & Accounts
                    </CardTitle>
                    <CardDescription className="text-xs">Configure auto employee ID prefixes, username patterns, and email formula patterns.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-950/40 rounded-xl border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground">Auto-generate Employee ID</Label>
                        <p className="text-[10px] text-muted-foreground">Automatically increment sequential employee numbers</p>
                      </div>
                      <input 
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={workspaceDraft.autoEmpId !== false}
                        onChange={e => updateDraftField('autoEmpId', e.target.checked)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee ID Prefix</Label>
                      <Input 
                        className="text-xs rounded-xl h-10 font-mono uppercase"
                        value={workspaceDraft.empIdPrefix}
                        onChange={e => updateDraftField('empIdPrefix', e.target.value)}
                      />
                    </div>

                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Username Formula</Label>
                        <select
                          className="w-full text-xs rounded-xl border border-input bg-background px-3 h-10 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                          value={workspaceDraft.usernamePattern}
                          onChange={e => updateDraftField('usernamePattern', e.target.value)}
                        >
                          <option value="first.last">first.last (e.g. john.doe)</option>
                          <option value="first_l">first_l (e.g. john_d)</option>
                          <option value="first.middle.last">first.middle.last</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Pattern Formula</Label>
                        <select
                          className="w-full text-xs rounded-xl border border-input bg-background px-3 h-10 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                          value={workspaceDraft.emailPattern}
                          onChange={e => updateDraftField('emailPattern', e.target.value)}
                        >
                          <option value="username@techsonance.com">username@techsonance.com</option>
                          <option value="first.last@company.com">first.last@company.com</option>
                          <option value="flast@company.com">flast@company.com</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border shadow-xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Attendance Shifts & Leave Defaults
                  </CardTitle>
                  <CardDescription className="text-xs">Configure shifts, default work hours, leave policies, and weekend boundaries.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Leave Policy</Label>
                      <select
                        className="w-full text-xs rounded-xl border border-input bg-background px-3 h-10 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                        value={workspaceDraft.leavePolicy}
                        onChange={e => updateDraftField('leavePolicy', e.target.value)}
                      >
                        <option value="Standard Privilege Leaves (24 days)">Standard Privilege Leaves (24 days)</option>
                        <option value="Unlimited Sick & Privilege Leaves">Unlimited Sick & Privilege Leaves</option>
                        <option value="Casual & Sick Leaves only">Casual & Sick Leaves only</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Attendance Shift</Label>
                      <select
                        className="w-full text-xs rounded-xl border border-input bg-background px-3 h-10 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                        value={workspaceDraft.shiftDefault}
                        onChange={e => updateDraftField('shiftDefault', e.target.value)}
                      >
                        <option value="General Engineering Shift (09:30 AM - 06:30 PM)">General Engineering Shift (09:30 AM - 06:30 PM)</option>
                        <option value="Morning shift (06:00 AM - 03:00 PM)">Morning shift (06:00 AM - 03:00 PM)</option>
                        <option value="Night shift (09:00 PM - 06:00 AM)">Night shift (09:00 PM - 06:00 AM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Working Hours per Shift</Label>
                      <Input 
                        type="number"
                        className="text-xs rounded-xl h-10"
                        value={workspaceDraft.workingHours || 9}
                        onChange={e => updateDraftField('workingHours', Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Weekend Rules</Label>
                      <select
                        className="w-full text-xs rounded-xl border border-input bg-background px-3 h-10 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                        value={workspaceDraft.weekendRules || 'Saturday & Sunday Off'}
                        onChange={e => updateDraftField('weekendRules', e.target.value)}
                      >
                        <option value="Saturday & Sunday Off">Saturday & Sunday Off</option>
                        <option value="Sunday Only Off">Sunday Only Off</option>
                        <option value="Flexible Rotational Offs">Flexible Rotational Offs</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: Users & Roles */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs rounded-2xl">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <div>
                      <CardTitle className="text-lg font-bold">Workspace User Directory</CardTitle>
                      <CardDescription>Manage user profiles, toggle active status, and modify user roles in real-time.</CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-primary text-white hover:bg-primary/90 h-9 rounded-xl flex items-center gap-1.5 text-xs font-bold" 
                      onClick={() => setShowInviteModal(true)}
                    >
                      <Plus className="h-4 w-4" /> Invite New User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search interface */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="text-xs rounded-xl pl-9 h-10" 
                      placeholder="Search users by name, email, or role..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Users directory table */}
                  {loadingUsers ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 border border-border rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">Loading workspace users...</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-border rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 dark:bg-zinc-900/50 border-b border-border">
                            <th className="py-3 px-4 font-bold text-muted-foreground">User Profile</th>
                            <th className="py-3 px-4 font-bold text-muted-foreground">Assigned Role</th>
                            <th className="py-3 px-4 font-bold text-muted-foreground text-center">Status</th>
                            <th className="py-3 px-4 font-bold text-muted-foreground text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {usersList
                            .filter(u => {
                              if (!searchTerm) return true;
                              const term = searchTerm.toLowerCase();
                              return (
                                u.email?.toLowerCase().includes(term) ||
                                u.firstName?.toLowerCase().includes(term) ||
                                u.lastName?.toLowerCase().includes(term) ||
                                u.role?.toLowerCase().includes(term)
                              );
                            })
                            .map((user) => (
                              <tr key={user.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
                                      {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold text-foreground truncate">
                                        {user.firstName} {user.lastName}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    className="text-xs rounded-lg border border-input bg-background px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-mono"
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user, e.target.value)}
                                  >
                                    <option value="admin">admin</option>
                                    <option value="hr_manager">hr_manager</option>
                                    <option value="cms_administrator">cms_administrator</option>
                                    <option value="project_manager">project_manager</option>
                                    <option value="developer">developer</option>
                                    <option value="intern">intern</option>
                                  </select>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-emerald-500 shadow-xs shadow-emerald-400' : 'bg-rose-500'}`} />
                                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">
                                      {user.isActive ? 'Active' : 'Suspended'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`text-[10px] font-bold h-7 rounded-lg border transition-colors ${
                                      user.isActive 
                                        ? 'text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/20' 
                                        : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-950/20'
                                    }`}
                                    onClick={() => handleSuspendToggle(user)}
                                    disabled={currentUser?.id === user.id}
                                  >
                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          {usersList.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground border-2 border-dashed border-border/60 rounded-xl">
                                No active users found in workspace directory.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Policies Configuration */}
              <Card className="border-border shadow-xs rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Workspace Security & Access Restriction Policies
                  </CardTitle>
                  <CardDescription className="text-xs">Configure Multi-Factor Verification, Session timeouts, and IP whitelisting rules.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-950/40 rounded-xl border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground">Enforce MFA Verification</Label>
                        <p className="text-[10px] text-muted-foreground">Require Multi-Factor authentication setup on all user accounts.</p>
                      </div>
                      <input 
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={workspaceDraft.mfaEnforced !== false}
                        onChange={e => updateDraftField('mfaEnforced', e.target.checked)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Timeout (Minutes)</Label>
                      <Input 
                        type="number"
                        className="text-xs rounded-xl h-10"
                        value={workspaceDraft.sessionTimeout || 60}
                        onChange={e => updateDraftField('sessionTimeout', Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace Password Policy</Label>
                      <select
                        className="w-full text-xs rounded-xl border border-input bg-background px-3 h-10 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                        value={workspaceDraft.passwordPolicy || 'High Security (Minimum 12 chars, alphanumeric)'}
                        onChange={e => updateDraftField('passwordPolicy', e.target.value)}
                      >
                        <option value="High Security (Minimum 12 chars, alphanumeric)">High Security (Minimum 12 chars, alphanumeric)</option>
                        <option value="Medium Security (Minimum 8 chars)">Medium Security (Minimum 8 chars)</option>
                        <option value="Basic (No restrictions)">Basic (No restrictions)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Allowed Email Domains</Label>
                      <Input 
                        className="text-xs rounded-xl h-10 font-mono"
                        placeholder="e.g. company.com, childcompany.com"
                        value={workspaceDraft.allowedDomains}
                        onChange={e => updateDraftField('allowedDomains', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IP Access Whitelist</Label>
                      <Input 
                        className="text-xs rounded-xl h-10 font-mono"
                        placeholder="e.g. 192.168.1.1/32, 10.0.0.0/24"
                        value={workspaceDraft.ipWhitelist}
                        onChange={e => updateDraftField('ipWhitelist', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Device Restriction Policy</Label>
                      <select
                        className="w-full text-xs rounded-xl border border-input bg-background px-3 h-10 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                        value={workspaceDraft.devicePolicy || 'Unrestricted personal and corporate devices allowed'}
                        onChange={e => updateDraftField('devicePolicy', e.target.value)}
                      >
                        <option value="Unrestricted personal and corporate devices allowed">Unrestricted personal and corporate devices allowed</option>
                        <option value="Corporate registered MDM devices only">Corporate registered MDM devices only</option>
                        <option value="Personal BYOD devices restricted">Personal BYOD devices restricted</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Roles Permissions Matrix display */}
              <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-950/20 border-b border-border">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Role-Based Access Control (RBAC) Permissions Matrix
                  </CardTitle>
                  <CardDescription className="text-xs">Review default access permissions mapped to system roles.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/20 dark:bg-zinc-900/10 border-b border-border">
                          <th className="py-2.5 px-4 font-bold text-muted-foreground">Module / Operations Group</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground text-center">SuperAdmin</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground text-center">HR Manager</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground text-center">Project Manager</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground text-center">Developer</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground text-center">Intern</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="py-2.5 px-4 font-semibold">Corporate Financial Settings</td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold">Employee Database Management</td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold">Project Allocation & Sprints</td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold">Leave Approvals & Workflows</td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Invite User Dialog Modal overlay */}
              {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                  <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-border bg-slate-50 dark:bg-zinc-950/20 px-5 py-4">
                      <strong className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Invite Workspace User
                      </strong>
                      <button 
                        onClick={() => setShowInviteModal(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleInviteSubmit} className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">First Name *</Label>
                          <Input 
                            className="text-xs rounded-lg h-9" 
                            required
                            value={inviteForm.firstName}
                            onChange={e => setInviteForm(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Name *</Label>
                          <Input 
                            className="text-xs rounded-lg h-9" 
                            required
                            value={inviteForm.lastName}
                            onChange={e => setInviteForm(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address *</Label>
                        <Input 
                          type="email"
                          className="text-xs rounded-lg h-9" 
                          required
                          value={inviteForm.email}
                          onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workspace Username</Label>
                        <Input 
                          className="text-xs rounded-lg h-9" 
                          placeholder="e.g. john.doe"
                          value={inviteForm.username}
                          onChange={e => setInviteForm(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                          <Input 
                            className="text-xs rounded-lg h-9" 
                            placeholder="e.g. +91 9999988888"
                            value={inviteForm.phone}
                            onChange={e => setInviteForm(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Access Role *</Label>
                          <select
                            className="w-full text-xs rounded-lg border border-input bg-background px-3 h-9 focus:outline-hidden focus:ring-1 focus:ring-primary/20 font-mono"
                            value={inviteForm.role}
                            onChange={e => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                          >
                            <option value="admin">admin</option>
                            <option value="hr_manager">hr_manager</option>
                            <option value="cms_administrator">cms_administrator</option>
                            <option value="project_manager">project_manager</option>
                            <option value="developer">developer</option>
                            <option value="intern">intern</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assigned Temporary Password *</Label>
                        <Input 
                          type="text"
                          className="text-xs rounded-lg h-9 font-mono" 
                          required
                          value={inviteForm.password}
                          onChange={e => setInviteForm(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>

                      <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="text-xs h-9 rounded-xl" 
                          onClick={() => setShowInviteModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="text-xs h-9 rounded-xl bg-primary text-white hover:bg-primary/90"
                        >
                          Send Invitation
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Card 1: Core Branding & Custom Styling */}
              <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-slate-50/50 dark:bg-zinc-900/20 px-6 py-5">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Branding Details & Accent Styling
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Customize your corporate branding palette, typography defaults, border radii, and visual accents.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Colors & Fonts Grid */}
                  <div className="grid gap-6 md:grid-cols-4">
                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Accent Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          className="w-12 h-10 p-1 rounded-xl cursor-pointer"
                          value={workspaceDraft.primaryColor}
                          onChange={e => updateDraftField('primaryColor', e.target.value)}
                        />
                        <Input 
                          type="text" 
                          className="text-xs rounded-xl flex-1 font-mono"
                          value={workspaceDraft.primaryColor}
                          onChange={e => updateDraftField('primaryColor', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Secondary Brand Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          className="w-12 h-10 p-1 rounded-xl cursor-pointer"
                          value={workspaceDraft.secondaryColor}
                          onChange={e => updateDraftField('secondaryColor', e.target.value)}
                        />
                        <Input 
                          type="text" 
                          className="text-xs rounded-xl flex-1 font-mono"
                          value={workspaceDraft.secondaryColor}
                          onChange={e => updateDraftField('secondaryColor', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Brand Font</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.primaryFont}
                        onChange={e => updateDraftField('primaryFont', e.target.value)}
                      >
                        <option value="Inter (Default)">Inter (Default)</option>
                        <option value="Outfit (SaaS Standard)">Outfit (SaaS Standard)</option>
                        <option value="Fira Code (Developer Centric)">Fira Code (Developer Centric)</option>
                        <option value="Roboto (Classic Google)">Roboto (Classic Google)</option>
                        <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Border Radius (Accents)</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.borderRadius}
                        onChange={e => updateDraftField('borderRadius', e.target.value)}
                      >
                        <option value="0px">Sharp (0px)</option>
                        <option value="6px">Subtle (6px)</option>
                        <option value="12px">Standard Rounded (12px)</option>
                        <option value="16px">High Rounded (16px)</option>
                        <option value="999px">Pill / Circle (999px)</option>
                      </select>
                    </div>
                  </div>

                  {/* Logo & Favicon Assets Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Corporate Logo Asset</Label>
                        <p className="text-[10px] text-muted-foreground">Used on headers, invoices, and login screens. Max 2MB.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {workspaceDraft.logoUrl ? (
                          <div className="h-10 w-24 bg-card border border-border rounded-xl flex items-center justify-center p-1.5">
                            <img src={workspaceDraft.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-primary text-xs uppercase">Logo</div>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs font-bold text-foreground border-border rounded-xl"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          Upload Logo
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace Favicon Asset</Label>
                        <p className="text-[10px] text-muted-foreground">Used for browser tab icons. Max 500KB PNG/ICO.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {workspaceDraft.faviconUrl ? (
                          <div className="h-10 w-10 bg-card border border-border rounded-xl flex items-center justify-center p-2">
                            <img src={workspaceDraft.faviconUrl} alt="Favicon" className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-primary text-xs uppercase">Fav</div>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs font-bold text-foreground border-border rounded-xl"
                          onClick={() => faviconInputRef.current?.click()}
                        >
                          Upload Favicon
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Layout & UI Customization */}
              <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-slate-50/50 dark:bg-zinc-900/20 px-6 py-5">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-primary" />
                    Layout Sizing & Navigation Style
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Control portal layouts, navigation formats, sidebar styling, and card spacing density.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Layout Theme Mode</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.themeMode}
                        onChange={e => updateDraftField('themeMode', e.target.value)}
                      >
                        <option value="Follow System Settings">Follow System Settings</option>
                        <option value="Corporate Light Mode">Corporate Light Mode</option>
                        <option value="Night / Dark Mode">Night / Dark Mode</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Layout Sizing Density</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.cardDensity}
                        onChange={e => updateDraftField('cardDensity', e.target.value)}
                      >
                        <option value="Comfortable (Relaxed spacing)">Comfortable (Relaxed spacing)</option>
                        <option value="Cozy (Standard padding)">Cozy (Standard padding)</option>
                        <option value="Compact (High density view)">Compact (High density view)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sidebar Visual Style</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.sidebarStyle}
                        onChange={e => updateDraftField('sidebarStyle', e.target.value)}
                      >
                        <option value="Classic Sidebar">Classic Sidebar (Solid Slate)</option>
                        <option value="Glassmorphic Sidebar">Glassmorphic (Translucent)</option>
                        <option value="Compact Sidebar">Compact Icon Bar</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Navigation Style</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.navigationStyle}
                        onChange={e => updateDraftField('navigationStyle', e.target.value)}
                      >
                        <option value="Left Side Navigation">Left Side Navigation Bar</option>
                        <option value="Top Navigation Bar">Top Horizontal Header Menu</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dashboard Grid Layout</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.dashboardLayout}
                        onChange={e => updateDraftField('dashboardLayout', e.target.value)}
                      >
                        <option value="Standard Grid Layout">Standard 3-Column Grid</option>
                        <option value="Kanban Board View">Kanban Columns View</option>
                        <option value="Compact Analytics List">Compact Analytics List</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Widget Configuration</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.widgetConfig}
                        onChange={e => updateDraftField('widgetConfig', e.target.value)}
                      >
                        <option value="Default Analytics Layout">Default Analytics Layout</option>
                        <option value="Financials Focused Dashboard">Financials Focused Dashboard</option>
                        <option value="Workforce / HR Concentrated View">Workforce / HR Concentrated View</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggles for Compact & Animations */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enforce Extreme Compact Mode</Label>
                        <p className="text-[10px] text-muted-foreground">Minimizes border padding for data-heavy workflows.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 accent-primary rounded cursor-pointer"
                        checked={workspaceDraft.compactMode || false}
                        onChange={e => updateDraftField('compactMode', e.target.checked)}
                      />
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enable Micro-Animations</Label>
                        <p className="text-[10px] text-muted-foreground">Subtle transitions on button hovers and panel slide-ins.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 accent-primary rounded cursor-pointer"
                        checked={workspaceDraft.animationsEnabled || false}
                        onChange={e => updateDraftField('animationsEnabled', e.target.checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Screen & Documents Templates Styling */}
              <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-slate-50/50 dark:bg-zinc-900/20 px-6 py-5">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Templates & Custom Document Branding
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Select layouts for portals, client invoices, notification emails, and PDF exports.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Login Screen Style</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.loginScreenStyle}
                        onChange={e => updateDraftField('loginScreenStyle', e.target.value)}
                      >
                        <option value="Modern Glassmorphic">Modern Glassmorphic (Glass overlay)</option>
                        <option value="Classic Elegant Minimalist">Classic Minimalist (Pure White)</option>
                        <option value="Split Background Card">Split Pane (Visual banner left)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Register Screen Style</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.registerScreenStyle}
                        onChange={e => updateDraftField('registerScreenStyle', e.target.value)}
                      >
                        <option value="Classic Elegant">Classic Elegant Panel</option>
                        <option value="Multi-Step Wizard form">Multi-step Wizard Grid</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Template Style</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.emailTemplateStyle}
                        onChange={e => updateDraftField('emailTemplateStyle', e.target.value)}
                      >
                        <option value="Corporate Minimalist">Corporate Minimalist (Clean tables)</option>
                        <option value="Colorful Marketing Alert">Vibrant Alert Banner</option>
                        <option value="Pure Text Layout">Plain Text Fallback</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 mt-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PDF Exporter Branding</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.pdfBrandingStyle}
                        onChange={e => updateDraftField('pdfBrandingStyle', e.target.value)}
                      >
                        <option value="Modern Signature">Modern Signature (Standard footers)</option>
                        <option value="Strict Corporate Document">Strict Corporate (Watermarked header)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Branding Theme</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                        value={workspaceDraft.invoiceBrandingStyle}
                        onChange={e => updateDraftField('invoiceBrandingStyle', e.target.value)}
                      >
                        <option value="Clean Minimalist">Clean Minimalist (Light borders)</option>
                        <option value="Bold Modern Header">Bold Accent Color Banner Header</option>
                        <option value="Classic Dual Column">Classic Dual Column Grid</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 7: Notification Center */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="border-border shadow-xs overflow-hidden">
                <div className="h-1.5 w-full bg-primary" />
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Channels & Dispatcher
                  </CardTitle>
                  <CardDescription>Configure omnichannel routes, active relays, and chat notification webhooks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Channels grid */}
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {/* Email */}
                    <div className="p-4 border border-border rounded-2xl flex flex-col justify-between space-y-3 bg-card">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-primary" /> Email Notifications
                        </Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifyEmail} 
                          onChange={e => updateDraftField('notifyEmail', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Send summary logs, transaction details, and legal certificates directly to users.</p>
                    </div>

                    {/* SMS */}
                    <div className="p-4 border border-border rounded-2xl flex flex-col justify-between space-y-3 bg-card">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-primary" /> SMS Gateway Alerts
                        </Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifySms} 
                          onChange={e => updateDraftField('notifySms', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Relay OTP confirmations, critical login events, and emergency system messages.</p>
                    </div>

                    {/* WhatsApp */}
                    <div className="p-4 border border-border rounded-2xl flex flex-col justify-between space-y-3 bg-card">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs flex items-center gap-1.5">
                          <Globe className="h-4 w-4 text-primary" /> WhatsApp Business API
                        </Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifyWhatsapp} 
                          onChange={e => updateDraftField('notifyWhatsapp', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Direct support requests, payment details, and reports to employee WhatsApp phone numbers.</p>
                    </div>

                    {/* Push Notifications */}
                    <div className="p-4 border border-border rounded-2xl flex flex-col justify-between space-y-3 bg-card">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-primary" /> Push Notifications
                        </Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifyPush} 
                          onChange={e => updateDraftField('notifyPush', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Display real-time desktop or mobile updates when the app is active or in background.</p>
                    </div>

                    {/* Browser Notifications */}
                    <div className="p-4 border border-border rounded-2xl flex flex-col justify-between space-y-3 bg-card">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs flex items-center gap-1.5">
                          <Globe className="h-4 w-4 text-primary" /> Browser Alerts
                        </Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifyBrowser} 
                          onChange={e => updateDraftField('notifyBrowser', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Trigger standard HTML5 system-level notification popups inside the browser screen.</p>
                    </div>

                    {/* Slack Channel */}
                    <div className="p-4 border border-border rounded-2xl flex flex-col justify-between space-y-3 bg-card">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs flex items-center gap-1.5">
                          <Plug className="h-4 w-4 text-primary" /> Slack Webhook Integration
                        </Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifySlack} 
                          onChange={e => updateDraftField('notifySlack', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Push automated event summaries directly to your Slack channels via incoming webhooks.</p>
                    </div>

                    {/* MS Teams */}
                    <div className="p-4 border border-border rounded-2xl flex flex-col justify-between space-y-3 bg-card">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs flex items-center gap-1.5">
                          <Server className="h-4 w-4 text-primary" /> Microsoft Teams
                        </Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifyTeams} 
                          onChange={e => updateDraftField('notifyTeams', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Relay updates, task cards, and compliance alerts directly into MS Teams office channels.</p>
                    </div>

                    {/* Discord */}
                    <div className="p-4 border border-border rounded-2xl flex flex-col justify-between space-y-3 bg-card">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs flex items-center gap-1.5">
                          <Globe className="h-4 w-4 text-primary" /> Discord Bot Webhook
                        </Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifyDiscord} 
                          onChange={e => updateDraftField('notifyDiscord', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Relay logs, developer events, and support tickets notifications into Discord server channels.</p>
                    </div>

                    {/* Outbound Webhook */}
                    <div className="p-4 border border-border rounded-2xl flex flex-col justify-between space-y-3 bg-card">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs flex items-center gap-1.5">
                          <Database className="h-4 w-4 text-primary" /> Outbound JSON Webhooks
                        </Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifyWebhook} 
                          onChange={e => updateDraftField('notifyWebhook', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Dispatch generic JSON payloads to external API URLs for custom application integrations.</p>
                    </div>
                  </div>

                  {/* Webhook URLs fields */}
                  {(workspaceDraft.notifySlack || workspaceDraft.notifyTeams || workspaceDraft.notifyDiscord || workspaceDraft.notifyWebhook) && (
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-border space-y-4 mt-6">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Plug className="h-4 w-4 text-primary" /> Chat & Webhook Endpoints
                      </h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        {workspaceDraft.notifySlack && (
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Slack Webhook URL</Label>
                            <Input 
                              className="text-xs rounded-xl"
                              placeholder="https://hooks.slack.com/services/..."
                              value={workspaceDraft.slackWebhookUrl || ''}
                              onChange={e => updateDraftField('slackWebhookUrl', e.target.value)}
                            />
                          </div>
                        )}
                        {workspaceDraft.notifyTeams && (
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">MS Teams Webhook URL</Label>
                            <Input 
                              className="text-xs rounded-xl"
                              placeholder="https://outlook.office.com/webhook/..."
                              value={workspaceDraft.teamsWebhookUrl || ''}
                              onChange={e => updateDraftField('teamsWebhookUrl', e.target.value)}
                            />
                          </div>
                        )}
                        {workspaceDraft.notifyDiscord && (
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Discord Webhook URL</Label>
                            <Input 
                              className="text-xs rounded-xl"
                              placeholder="https://discord.com/api/webhooks/..."
                              value={workspaceDraft.discordWebhookUrl || ''}
                              onChange={e => updateDraftField('discordWebhookUrl', e.target.value)}
                            />
                          </div>
                        )}
                        {workspaceDraft.notifyWebhook && (
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Outbound API Endpoint URL</Label>
                            <Input 
                              className="text-xs rounded-xl"
                              placeholder="https://api.yourcompany.com/webhook"
                              value={workspaceDraft.webhookEndpointUrl || ''}
                              onChange={e => updateDraftField('webhookEndpointUrl', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Digest settings */}
                  <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/30 border border-border rounded-2xl mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-primary" /> Digest Emails Settings
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Deliver unified periodic digests rather than instant notification spam.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.digestEmails} 
                          onChange={e => updateDraftField('digestEmails', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                        />
                        <Label className="text-xs font-bold">Enabled</Label>
                      </div>
                      {workspaceDraft.digestEmails && (
                        <select 
                          className="text-xs rounded-xl border border-border p-2 bg-background font-semibold text-foreground outline-none animate-in slide-in-from-top-1 duration-200"
                          value={workspaceDraft.digestFrequency}
                          onChange={e => updateDraftField('digestFrequency', e.target.value)}
                        >
                          <option value="daily">Daily Summaries</option>
                          <option value="weekly">Weekly Summaries</option>
                          <option value="monthly">Monthly Summaries</option>
                        </select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Templates Manager */}
              <Card className="border-border shadow-xs">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Notification Templates
                    </CardTitle>
                    <CardDescription>Customize subject line text and trigger events configurations.</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs font-bold h-8 text-primary border-primary/20 hover:bg-primary/5 rounded-lg" onClick={addTemplate}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Template
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(workspaceDraft.notificationTemplates || []).length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">No templates configured yet. Click "Add Template" to start.</div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {(workspaceDraft.notificationTemplates || []).map((tpl, index) => (
                        <div key={tpl.id} className="p-4 border border-border bg-slate-50/20 dark:bg-zinc-900/10 rounded-2xl space-y-3 relative group">
                          <button onClick={() => removeTemplate(tpl.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash className="h-4 w-4" />
                          </button>
                          
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Template Name</Label>
                              <Input 
                                className="text-xs h-8 bg-card rounded-lg"
                                value={tpl.name}
                                onChange={e => updateTemplate(tpl.id, { name: e.target.value })}
                              />
                            </div>

                            <div className="grid gap-2 grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Trigger Event</Label>
                                <select 
                                  className="w-full text-xs rounded-lg border border-border p-1.5 bg-background outline-none text-foreground font-semibold h-8"
                                  value={tpl.trigger}
                                  onChange={e => updateTemplate(tpl.id, { trigger: e.target.value })}
                                >
                                  <option value="employee_joined">Employee Joined</option>
                                  <option value="task_overdue">Task Overdue</option>
                                  <option value="leave_requested">Leave Requested</option>
                                  <option value="ticket_created">Support Ticket</option>
                                  <option value="attendance_missing">Missing Attendance</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Channels</Label>
                                <div className="flex gap-2 flex-wrap items-center mt-1.5">
                                  {['email', 'sms', 'push', 'slack'].map(ch => {
                                    const active = tpl.channels.includes(ch);
                                    return (
                                      <button 
                                        key={ch}
                                        type="button"
                                        onClick={() => {
                                          const newChs = active ? tpl.channels.filter(c => c !== ch) : [...tpl.channels, ch];
                                          updateTemplate(tpl.id, { channels: newChs });
                                        }}
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase transition-all ${
                                          active 
                                            ? 'bg-primary/20 text-primary border border-primary/20' 
                                            : 'bg-slate-100 dark:bg-zinc-800 text-muted-foreground border border-transparent'
                                        }`}
                                      >
                                        {ch}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Template Body (supports variables e.g. {"{{firstName}}"})</Label>
                              <textarea 
                                rows={2}
                                className="w-full text-xs rounded-lg border border-border p-2 outline-none focus-visible:ring-primary/20 bg-card font-sans leading-relaxed text-foreground"
                                value={tpl.template}
                                onChange={e => updateTemplate(tpl.id, { template: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Escalation & Reminder Rules */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Escalations */}
                <Card className="border-border shadow-xs">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Sliders className="h-5 w-5 text-primary" />
                        Escalation Rules
                      </CardTitle>
                      <CardDescription>Setup alerts hierarchy if actions fail.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs font-bold h-8 text-primary border-primary/20 hover:bg-primary/5 rounded-lg shadow-sm" onClick={addEscalationRule}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Rule
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(workspaceDraft.escalationRules || []).length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground">No escalation rules configured.</div>
                    ) : (
                      (workspaceDraft.escalationRules || []).map((rule, idx) => (
                        <div key={rule.id} className="p-3 border border-border rounded-xl space-y-2 bg-slate-50/20 relative group">
                          <button onClick={() => removeEscalationRule(rule.id)} className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-destructive">
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                          
                          <div className="space-y-1.5 pr-6">
                            <Input 
                              className="text-xs h-7 font-bold bg-card border-none p-0 focus-visible:ring-0 shadow-none"
                              value={rule.name}
                              onChange={e => updateEscalationRule(rule.id, { name: e.target.value })}
                              placeholder="Rule Title"
                            />
                            <div className="grid gap-2 grid-cols-2 text-[10px]">
                              <div className="space-y-0.5">
                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Condition Trigger</Label>
                                <Input 
                                  className="text-xs h-7 rounded bg-card px-2"
                                  value={rule.condition}
                                  onChange={e => updateEscalationRule(rule.id, { condition: e.target.value })}
                                />
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Escalation Action</Label>
                                <Input 
                                  className="text-xs h-7 rounded bg-card px-2"
                                  value={rule.action}
                                  onChange={e => updateEscalationRule(rule.id, { action: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Reminders */}
                <Card className="border-border shadow-xs">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Reminder Rules
                      </CardTitle>
                      <CardDescription>Setup automatic calendar/timesheet logs checks.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs font-bold h-8 text-primary border-primary/20 hover:bg-primary/5 rounded-lg shadow-sm" onClick={addReminderRule}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Rule
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(workspaceDraft.reminderRules || []).length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground">No reminder rules configured.</div>
                    ) : (
                      (workspaceDraft.reminderRules || []).map((rule, idx) => (
                        <div key={rule.id} className="p-3 border border-border rounded-xl space-y-2 bg-slate-50/20 relative group">
                          <button onClick={() => removeReminderRule(rule.id)} className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-destructive">
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                          
                          <div className="space-y-1.5 pr-6">
                            <Input 
                              className="text-xs h-7 font-bold bg-card border-none p-0 focus-visible:ring-0 shadow-none"
                              value={rule.name}
                              onChange={e => updateReminderRule(rule.id, { name: e.target.value })}
                              placeholder="Rule Title"
                            />
                            <div className="grid gap-2 grid-cols-2 text-[10px]">
                              <div className="space-y-0.5">
                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Condition Trigger</Label>
                                <Input 
                                  className="text-xs h-7 rounded bg-card px-2"
                                  value={rule.condition}
                                  onChange={e => updateReminderRule(rule.id, { condition: e.target.value })}
                                />
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Reminder Action</Label>
                                <Input 
                                  className="text-xs h-7 rounded bg-card px-2"
                                  value={rule.action}
                                  onChange={e => updateReminderRule(rule.id, { action: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 8: Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {isConfiguringIntegration ? (
                <Card className="border-border shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Configure Integration: {isConfiguringIntegration.name}</CardTitle>
                    <CardDescription>Bind client keys and callback endpoints to synchronize data parameters.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client ID / Username</Label>
                      <Input 
                        placeholder="e.g. ts_client_92h1n29ha81"
                        className="text-xs rounded-xl"
                        value={integrationConfigInput.clientId}
                        onChange={e => setIntegrationConfigInput({ ...integrationConfigInput, clientId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Secret / Secret Key</Label>
                      <Input 
                        type="password"
                        placeholder="Secret key token"
                        className="text-xs rounded-xl"
                        value={integrationConfigInput.clientSecret}
                        onChange={e => setIntegrationConfigInput({ ...integrationConfigInput, clientSecret: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Redirect URI / Webhook Destination URL</Label>
                      <Input 
                        placeholder="e.g. https://api.techsonance.com/v1/webhook"
                        className="text-xs rounded-xl"
                        value={integrationConfigInput.webhookUrl}
                        onChange={e => setIntegrationConfigInput({ ...integrationConfigInput, webhookUrl: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="text-[10px] rounded-lg h-9 font-bold px-4"
                        onClick={() => handleConnectIntegration(isConfiguringIntegration.slug, integrationConfigInput)}
                      >
                        Connect Integration
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-[10px] rounded-lg h-9 border-border"
                        onClick={() => {
                          setIsConfiguringIntegration(null);
                          setIntegrationConfigInput({ clientId: '', clientSecret: '', webhookUrl: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border shadow-xs">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold">Integration Directory</CardTitle>
                        <CardDescription>Configure credentials and trigger hooks for third-party platform syncs.</CardDescription>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Input 
                          placeholder="Search service..." 
                          className="text-xs rounded-xl w-full md:w-48 h-8"
                          value={integrationsSearch}
                          onChange={e => setIntegrationsSearch(e.target.value)}
                        />
                        <select 
                          className="text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-8"
                          value={integrationsCategory}
                          onChange={e => setIntegrationsCategory(e.target.value)}
                        >
                          <option value="all">All Channels</option>
                          <option value="identity">Identity SSO</option>
                          <option value="communication">Communication</option>
                          <option value="development">Dev tools</option>
                          <option value="productivity">Productivity</option>
                          <option value="finance">Finance ERP</option>
                          <option value="infrastructure">Infrastructure</option>
                          <option value="notifications">Alert SMS</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[
                        { slug: 'google-workspace', name: 'Google Workspace', category: 'identity', desc: 'SSO, workspace directories & doc sheets.' },
                        { slug: 'microsoft-365', name: 'Microsoft 365', category: 'identity', desc: 'Azure AD auth and Outlook calendar sync.' },
                        { slug: 'slack', name: 'Slack', category: 'communication', desc: 'Relay notifications to chat channels.' },
                        { slug: 'github', name: 'GitHub', category: 'development', desc: 'Track commits, tickets and developer logs.' },
                        { slug: 'gitlab', name: 'GitLab', category: 'development', desc: 'Link pipelines and issue branches.' },
                        { slug: 'bitbucket', name: 'Bitbucket', category: 'development', desc: 'Sync project repositories.' },
                        { slug: 'jira', name: 'Jira', category: 'productivity', desc: 'Sync sprints boards and escalate tasks.' },
                        { slug: 'linear', name: 'Linear', category: 'productivity', desc: 'Fast issues tracker sync.' },
                        { slug: 'clickup', name: 'ClickUp', category: 'productivity', desc: 'Track task tables, schedules and lists.' },
                        { slug: 'asana', name: 'Asana', category: 'productivity', desc: 'Task lists & project checklists.' },
                        { slug: 'notion', name: 'Notion', category: 'productivity', desc: 'Export wikis and doc archives.' },
                        { slug: 'zoom', name: 'Zoom', category: 'communication', desc: 'Generate candidate video interviews.' },
                        { slug: 'google-meet', name: 'Google Meet', category: 'communication', desc: 'Generate calendar meet links.' },
                        { slug: 'stripe', name: 'Stripe', category: 'finance', desc: 'Process customer bills & subscriptions.' },
                        { slug: 'razorpay', name: 'Razorpay', category: 'finance', desc: 'UPI and card payments in India.' },
                        { slug: 'paypal', name: 'PayPal', category: 'finance', desc: 'Accept international wallet transfers.' },
                        { slug: 'quickbooks', name: 'QuickBooks', category: 'finance', desc: 'Sync accounting invoices.' },
                        { slug: 'xero', name: 'Xero', category: 'finance', desc: 'Automate tax reconciliations.' },
                        { slug: 'zoho-books', name: 'Zoho Books', category: 'finance', desc: 'Local invoice accounting books.' },
                        { slug: 'aws', name: 'AWS', category: 'infrastructure', desc: 'Cloud storage S3 and IAM permissions.' },
                        { slug: 'azure', name: 'Azure', category: 'infrastructure', desc: 'VM controls and Key vault storage.' },
                        { slug: 'gcp', name: 'GCP', category: 'infrastructure', desc: 'Cloud compute run engines.' },
                        { slug: 'cloudflare', name: 'Cloudflare', category: 'infrastructure', desc: 'Bypass rules and flush DNS registers.' },
                        { slug: 'twilio', name: 'Twilio', category: 'notifications', desc: 'Transmit text SMS notifications.' },
                        { slug: 'sendgrid', name: 'SendGrid', category: 'notifications', desc: 'Dispatch bulk marketing emails.' },
                        { slug: 'resend', name: 'Resend', category: 'notifications', desc: 'Modern mail API deliverability.' },
                        { slug: 'firebase', name: 'Firebase', category: 'notifications', desc: 'Send mobile app push payloads.' },
                        { slug: 'onesignal', name: 'OneSignal', category: 'notifications', desc: 'Push notification engine.' },
                        { slug: 'sap', name: 'SAP', category: 'enterprise', desc: 'Enterprise ERP resource tracking.' },
                        { slug: 'oracle', name: 'Oracle', category: 'enterprise', desc: 'Scale database architectures.' }
                      ]
                        .filter(prov => {
                          const matchesSearch = prov.name.toLowerCase().includes(integrationsSearch.toLowerCase()) || 
                                                prov.desc.toLowerCase().includes(integrationsSearch.toLowerCase());
                          const matchesCat = integrationsCategory === 'all' || prov.category === integrationsCategory;
                          return matchesSearch && matchesCat;
                        })
                        .map(prov => {
                          const conn = connectedIntegrations.find(ci => ci.provider_slug === prov.slug);
                          const isConnected = conn?.enabled;

                          return (
                            <div 
                              key={prov.slug} 
                              className={`p-4 border rounded-2xl flex flex-col justify-between transition-all ${
                                isConnected 
                                  ? 'border-indigo-500 bg-indigo-500/5' 
                                  : 'border-border bg-slate-50/10 hover:border-muted-foreground/30'
                              }`}
                            >
                              <div>
                                <h4 className="font-bold text-xs flex justify-between items-center">
                                  <span>{prov.name}</span>
                                  {isConnected ? (
                                    <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-none font-bold text-[8px] rounded-md">Connected</Badge>
                                  ) : (
                                    <Badge className="bg-slate-100 dark:bg-zinc-800 text-muted-foreground border-none font-bold text-[8px] rounded-md">Disconnected</Badge>
                                  )}
                                </h4>
                                <p className="text-[10px] text-muted-foreground mt-1.5">{prov.desc}</p>
                              </div>
                              
                              <div className="flex gap-2 mt-4 pt-2 border-t border-border/50">
                                {isConnected ? (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-7 w-full rounded-lg font-bold"
                                    onClick={() => handleDisconnectIntegration(prov.slug)}
                                  >
                                    Disconnect
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-[10px] text-primary border-primary/20 hover:bg-primary/5 h-7 w-full rounded-lg font-bold"
                                    onClick={() => {
                                      setIsConfiguringIntegration(prov);
                                      setIntegrationConfigInput({ clientId: '', clientSecret: '', webhookUrl: '' });
                                    }}
                                  >
                                    Configure
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB 9: Invoice Settings */}
          {activeTab === 'invoice' && (
            <div className="space-y-6">
              {/* Form Prefixes & Precision */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Invoicing prefix & numbering structure</CardTitle>
                  <CardDescription>Configure numbering formats, default starting sequences, and decimal rounding settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Prefix Code</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.invoicePrefix}
                        onChange={e => updateDraftField('invoicePrefix', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starting Invoice Number</Label>
                      <Input 
                        type="number"
                        className="text-xs rounded-xl"
                        value={workspaceDraft.invoiceNumberStart || 1}
                        onChange={e => updateDraftField('invoiceNumberStart', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Decimal Precision</Label>
                      <Input 
                        type="number"
                        className="text-xs rounded-xl"
                        value={workspaceDraft.invoiceDecimal}
                        onChange={e => updateDraftField('invoiceDecimal', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quotation Prefix</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.quotationPrefix || 'TS-QTN-'}
                        onChange={e => updateDraftField('quotationPrefix', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Purchase Order Prefix</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.purchasePrefix || 'TS-PO-'}
                        onChange={e => updateDraftField('purchasePrefix', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Credit Note Prefix</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.creditNotePrefix || 'TS-CN-'}
                        onChange={e => updateDraftField('creditNotePrefix', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Invoice Currency</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-10"
                        value={workspaceDraft.currency || 'INR (₹)'}
                        onChange={e => updateDraftField('currency', e.target.value)}
                      >
                        <option value="INR (₹)">INR (₹)</option>
                        <option value="USD ($)">USD ($)</option>
                        <option value="EUR (€)">EUR (€)</option>
                        <option value="GBP (£)">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Taxation & Calculation Settings */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Taxation & Calculation Configurations</CardTitle>
                  <CardDescription>Govern goods & services tax (GST) thresholds and define customized taxation formulas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-border">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs">Enable Goods & Services Tax (GST / VAT)</h4>
                      <p className="text-[10px] text-muted-foreground">Automatically append tax values to invoice balance drafts.</p>
                    </div>
                    <input 
                      type="checkbox"
                      className="w-8 h-8 accent-primary cursor-pointer"
                      checked={!!workspaceDraft.gstEnabled}
                      onChange={e => updateDraftField('gstEnabled', e.target.checked)}
                    />
                  </div>

                  {workspaceDraft.gstEnabled && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5 max-w-sm">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default GST Rate (%)</Label>
                        <Input 
                          type="number"
                          className="text-xs rounded-xl"
                          value={workspaceDraft.gstRateDefault || 18}
                          onChange={e => updateDraftField('gstRateDefault', Number(e.target.value))}
                        />
                      </div>

                      {/* Custom taxes list */}
                      <div className="space-y-3 pt-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Tax Configurations</Label>
                        
                        <div className="flex gap-2 max-w-md">
                          <Input 
                            placeholder="Tax name (e.g. Cess)"
                            className="text-xs rounded-xl"
                            value={newTaxName}
                            onChange={e => setNewTaxName(e.target.value)}
                          />
                          <Input 
                            type="number"
                            placeholder="Rate %"
                            className="text-xs rounded-xl w-24"
                            value={newTaxRate}
                            onChange={e => setNewTaxRate(e.target.value)}
                          />
                          <Button 
                            variant="outline" 
                            className="text-[10px] h-9 border-primary/20 text-primary hover:bg-primary/5 rounded-xl px-4"
                            onClick={() => {
                              if (!newTaxName || !newTaxRate) return toast.warning('Tax name and rate are required');
                              const updatedTaxes = [...(workspaceDraft.taxConfiguration || []), { name: newTaxName, rate: Number(newTaxRate), type: 'percentage' }];
                              updateDraftField('taxConfiguration', updatedTaxes);
                              setNewTaxName('');
                              setNewTaxRate('');
                              toast.success('Custom tax rate added to draft!');
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
                        </div>

                        {/* List rendering */}
                        <div className="space-y-2 max-w-md">
                          {(workspaceDraft.taxConfiguration || []).map((tax: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-900/20 border border-border rounded-xl">
                              <span className="text-xs font-bold">{tax.name} <span className="text-[10px] font-normal text-muted-foreground">({tax.rate}%)</span></span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                                onClick={() => {
                                  const updatedTaxes = (workspaceDraft.taxConfiguration || []).filter((_: any, i: number) => i !== idx);
                                  updateDraftField('taxConfiguration', updatedTaxes);
                                }}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* QR Code & Digital Signature */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">QR Codes & Digital Signature Verification</CardTitle>
                  <CardDescription>Append dynamic payment codes and verification signatures onto generated PDF sheets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* QR Code Setup */}
                    <div className="p-4 border border-border rounded-2xl space-y-4 bg-slate-50/20">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs">Append QR Code to Bill</h4>
                          <p className="text-[10px] text-muted-foreground">UPI quick payments code layout</p>
                        </div>
                        <input 
                          type="checkbox"
                          className="w-6 h-6 accent-primary cursor-pointer"
                          checked={!!workspaceDraft.qrCodeEnabled}
                          onChange={e => updateDraftField('qrCodeEnabled', e.target.checked)}
                        />
                      </div>

                      {workspaceDraft.qrCodeEnabled && (
                        <div className="space-y-3 pt-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">UPI ID or Merchant String</Label>
                          <Input 
                            placeholder="e.g. corporate@hdfcbank"
                            className="text-xs rounded-xl"
                            value={workspaceDraft.qrCodeUrl || ''}
                            onChange={e => updateDraftField('qrCodeUrl', e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Digital Signature Setup */}
                    <div className="p-4 border border-border rounded-2xl space-y-4 bg-slate-50/20">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs">Authorize Signature stamp</h4>
                          <p className="text-[10px] text-muted-foreground">Embed corporate signature watermark</p>
                        </div>
                        <input 
                          type="checkbox"
                          className="w-6 h-6 accent-primary cursor-pointer"
                          checked={!!workspaceDraft.digitalSignatureEnabled}
                          onChange={e => updateDraftField('digitalSignatureEnabled', e.target.checked)}
                        />
                      </div>

                      {workspaceDraft.digitalSignatureEnabled && (
                        <div className="space-y-3 pt-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Authorized Signature URL</Label>
                          <Input 
                            placeholder="Image URL for signature stamp"
                            className="text-xs rounded-xl"
                            value={workspaceDraft.digitalSignatureUrl || ''}
                            onChange={e => updateDraftField('digitalSignatureUrl', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Gateways & Invoicing Templates */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Invoice templates & payment gateway binds</CardTitle>
                  <CardDescription>Bind client payment processing routes and adjust client-facing PDF formatting aesthetics.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Gateways toggles */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Payment Processing Channels</Label>
                    <div className="grid gap-3 md:grid-cols-3">
                      {['stripe', 'razorpay', 'paypal'].map(gw => (
                        <div key={gw} className="flex justify-between items-center p-3 border border-border rounded-xl bg-slate-50 dark:bg-zinc-900/10">
                          <span className="text-xs font-bold capitalize">{gw}</span>
                          <input 
                            type="radio"
                            name="paymentGateway"
                            className="w-4.5 h-4.5 accent-primary cursor-pointer"
                            checked={workspaceDraft.paymentGateway === gw}
                            onChange={() => updateDraftField('paymentGateway', gw)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Template selections */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected Invoice PDF Template Style</Label>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { id: 'modern', name: 'Modern Signature', desc: 'Sleek borders with distinct typography' },
                        { id: 'classic', name: 'Classic Invoice', desc: 'Standard business layout with detailed ledger grid' },
                        { id: 'minimal', name: 'Clean Minimalist', desc: 'Minimal ink footprint, modern spacing layouts' }
                      ].map(tpl => (
                        <div 
                          key={tpl.id} 
                          onClick={() => updateDraftField('invoiceTemplate', tpl.id)}
                          className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                            workspaceDraft.invoiceTemplate === tpl.id 
                              ? 'border-primary bg-primary/5 shadow-xs' 
                              : 'border-border bg-slate-50/20 hover:border-muted-foreground/30'
                          }`}
                        >
                          <h5 className="font-bold text-xs">{tpl.name}</h5>
                          <p className="text-[10px] text-muted-foreground mt-1">{tpl.desc}</p>
                          {workspaceDraft.invoiceTemplate === tpl.id && (
                            <Badge className="bg-primary text-white border-none font-bold text-[8px] mt-2 rounded-md">Selected</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Currencies configurations */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-border">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs">Enable Multi-Currency Support</h4>
                        <p className="text-[10px] text-muted-foreground">Allows clients to receive bills and process card routes in foreign currencies.</p>
                      </div>
                      <input 
                        type="checkbox"
                        className="w-8 h-8 accent-primary cursor-pointer"
                        checked={!!workspaceDraft.multiCurrencyEnabled}
                        onChange={e => updateDraftField('multiCurrencyEnabled', e.target.checked)}
                      />
                    </div>

                    {workspaceDraft.multiCurrencyEnabled && (
                      <div className="space-y-3 pt-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Supported Currencies</Label>
                        
                        <div className="flex gap-2 max-w-sm">
                          <Input 
                            placeholder="Add Currency Code (e.g. USD, EUR)"
                            className="text-xs rounded-xl"
                            value={newCurrencyInput}
                            onChange={e => setNewCurrencyInput(e.target.value)}
                          />
                          <Button 
                            variant="outline" 
                            className="text-[10px] h-9 border-primary/20 text-primary hover:bg-primary/5 rounded-xl px-4"
                            onClick={() => {
                              if (!newCurrencyInput.trim()) return toast.warning('Please enter a currency code');
                              const nextCode = newCurrencyInput.trim().toUpperCase();
                              const currentList = workspaceDraft.supportedCurrencies || [];
                              if (currentList.includes(nextCode)) return toast.warning('Currency already added');
                              updateDraftField('supportedCurrencies', [...currentList, nextCode]);
                              setNewCurrencyInput('');
                              toast.success(`Currency ${nextCode} added to draft!`);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
                        </div>

                        {/* Badges render */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(workspaceDraft.supportedCurrencies || []).map((cur: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="border-border rounded-lg pl-2 pr-1 h-7 flex items-center text-[10px] font-bold bg-slate-50 dark:bg-zinc-900/30 gap-1">
                              <span>{cur}</span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-5 w-5 p-0 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => {
                                  const updatedList = (workspaceDraft.supportedCurrencies || []).filter((_: any, i: number) => i !== idx);
                                  updateDraftField('supportedCurrencies', updatedList);
                                }}
                              >
                                <X className="h-2.5 w-2.5" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Footnote and default terms */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Footer terms & conditions footnote</CardTitle>
                  <CardDescription>Configure standard legal notes, default payment terms, and bottom footers displayed on all invoices.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Payment Buffer (e.g. Net 30, Net 15)</Label>
                    <Input 
                      className="text-xs rounded-xl"
                      value={workspaceDraft.defaultPaymentTerms || 'Net 15'}
                      onChange={e => updateDraftField('defaultPaymentTerms', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Bottom Footnote (e.g. Bank Account details)</Label>
                    <textarea 
                      rows={3}
                      className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background font-sans"
                      value={workspaceDraft.invoiceFooter || 'Thank you for your business!'}
                      onChange={e => updateDraftField('invoiceFooter', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Terms & Conditions</Label>
                    <textarea 
                      rows={4}
                      className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background font-sans"
                      value={workspaceDraft.invoiceTerms || '1. Please pay within 15 days of invoice date. 2. Late payments incur a 1.5% fee.'}
                      onChange={e => updateDraftField('invoiceTerms', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 10: Dynamic Schema Engine */}
          {activeTab === 'dynamic' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Dynamic Forms Schema</CardTitle>
                  <CardDescription>Add customized metadata payload parameters to support tickets, tasks, or payroll items.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <DynamicSchemaTab />
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 11: Workflow Automation */}
          {activeTab === 'automation' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {editingWorkflow === null ? (
                // LIST VIEW
                <Card className="border-border shadow-xs">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Sliders className="h-5 w-5 text-primary" />
                        Workflow Automation Builder
                      </CardTitle>
                      <CardDescription>Design dynamic multi-step triggers, conditions, and action flows.</CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      className="text-xs font-bold h-8 text-white bg-primary hover:bg-primary/95 rounded-lg shadow-sm"
                      onClick={() => {
                        setEditingWorkflow({
                          name: 'New Workflow',
                          trigger_event: 'employee_joined',
                          conditions: [],
                          actions: [
                            { id: '1', type: 'assign_laptop', config: { model: 'MacBook Pro 16' } },
                            { id: '2', type: 'create_email', config: { domain: '@company.com' } },
                            { id: '3', type: 'notify_manager', config: { channel: 'email' } }
                          ],
                          is_active: true
                        });
                        setSelectedNodeId(null);
                      }}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Workflow
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {workflowsLoading ? (
                      <div className="text-center py-12 text-xs text-muted-foreground">Loading workflows...</div>
                    ) : workflows.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                        <Terminal className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                        <h3 className="text-xs font-bold text-foreground">No workflows configured yet</h3>
                        <p className="text-[10px] text-muted-foreground mt-1 max-w-xs mx-auto">Create rules sequences for automating employee joined events or email triggers.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {workflows.map(wf => (
                          <div key={wf.id} className="p-4 border border-border rounded-2xl bg-card flex flex-col justify-between space-y-4 hover:border-primary/20 transition-all">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                  {wf.name}
                                </h4>
                                <div className="text-[10px] text-muted-foreground">
                                  Trigger: <span className="font-bold text-primary">{wf.trigger_event}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${wf.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-zinc-800 text-muted-foreground'}`}>
                                  {wf.is_active ? 'Active' : 'Draft'}
                                </span>
                                <input 
                                  type="checkbox" 
                                  checked={wf.is_active}
                                  onChange={() => toggleWorkflowActive(wf)}
                                  className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                />
                              </div>
                            </div>

                            {/* Node sequence preview */}
                            <div className="flex items-center gap-1 flex-wrap py-2 border-t border-b border-border bg-slate-50/35 dark:bg-zinc-900/10 p-2.5 rounded-xl">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">Flow:</span>
                              <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">{wf.trigger_event}</span>
                              {wf.conditions && wf.conditions.length > 0 && (
                                <>
                                  <span className="text-[9px] text-muted-foreground">→</span>
                                  <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">If/Else</span>
                                </>
                              )}
                              {(wf.actions || []).map((act: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <span className="text-[9px] text-muted-foreground">→</span>
                                  <span className="text-[9px] font-bold bg-slate-100 dark:bg-zinc-800 text-foreground px-1.5 py-0.5 rounded capitalize">{act.type.replace('_', ' ')}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button size="xs" variant="outline" className="text-[10px] h-7 font-bold rounded-lg border-border" onClick={() => {
                                setEditingWorkflow(wf);
                                setSelectedNodeId(null);
                              }}>
                                Edit Workflow
                              </Button>
                              <Button size="xs" variant="outline" className="text-[10px] h-7 font-bold text-destructive hover:bg-destructive/5 rounded-lg border-destructive/10" onClick={() => deleteWorkflow(wf.id)}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                // EDITOR VIEW
                <div className="space-y-6">
                  {/* Editor Header */}
                  <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-zinc-900 border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setEditingWorkflow(null)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <h3 className="text-xs font-bold text-foreground">Visual Workflow Builder</h3>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Design conditions, actions delays, approvals triggers.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs font-bold h-8 rounded-lg" onClick={() => setEditingWorkflow(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" className="text-xs font-bold h-8 text-white bg-primary hover:bg-primary/95 rounded-lg shadow-sm" onClick={() => saveWorkflow(editingWorkflow)}>
                        Save Workflow
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Visual Timeline Canvas Column */}
                    <div className="md:col-span-2 space-y-6">
                      <Card className="border-border shadow-xs">
                        <CardHeader>
                          <CardTitle className="text-sm font-bold">Automation Timeline Canvas</CardTitle>
                          <CardDescription>Setup sequential action nodes triggered by the main event.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 relative">
                          <div className="flex flex-col items-center space-y-4 max-w-lg mx-auto">
                            {/* 1. TRIGGER NODE */}
                            <div className="w-full p-4 border border-primary/20 bg-primary/5 rounded-2xl relative shadow-xs">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-primary text-white rounded-lg">
                                    <Terminal className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="text-[9px] uppercase tracking-wider text-primary font-black">Trigger Event Node</div>
                                    <div className="text-xs font-extrabold text-foreground capitalize">{editingWorkflow.trigger_event.replace('_', ' ')}</div>
                                  </div>
                                </div>
                                <select 
                                  className="text-xs rounded-lg border border-border p-1.5 bg-background font-semibold text-foreground outline-none shadow-xs"
                                  value={editingWorkflow.trigger_event}
                                  onChange={e => setEditingWorkflow({ ...editingWorkflow, trigger_event: e.target.value })}
                                >
                                  <option value="employee_joined">Employee Joined</option>
                                  <option value="task_completed">Task Completed</option>
                                  <option value="attendance_logged">Attendance Logged</option>
                                  <option value="lead_created">Lead Created</option>
                                </select>
                              </div>
                            </div>

                            {/* Arrow down */}
                            <div className="flex flex-col items-center">
                              <div className="h-6 w-[2px] bg-border" />
                              <div className="h-1.5 w-1.5 rounded-full bg-border -mt-1" />
                            </div>

                            {/* 2. CONDITIONS NODE */}
                            <div 
                              onClick={() => setSelectedNodeId('conditions')}
                              className={`w-full p-4 border rounded-2xl cursor-pointer transition-all ${
                                selectedNodeId === 'conditions' 
                                  ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/25' 
                                  : 'border-border hover:border-amber-500/40 bg-card'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-amber-500 text-white rounded-lg">
                                    <Sliders className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="text-[9px] uppercase tracking-wider text-amber-500 font-black">If/Else Logic Node</div>
                                    <div className="text-xs font-bold text-foreground">
                                      {editingWorkflow.conditions && editingWorkflow.conditions.length > 0 
                                        ? `${editingWorkflow.conditions.length} condition checks configured`
                                        : 'Evaluate all triggers without conditions'}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                  {editingWorkflow.conditions && editingWorkflow.conditions.length > 0 ? 'Conditional' : 'Run Always'}
                                </span>
                              </div>
                            </div>

                            {/* ACTIONS TIMELINE */}
                            {(editingWorkflow.actions || []).map((node: any, idx: number) => {
                              const isSelected = selectedNodeId === node.id;
                              return (
                                <Fragment key={node.id || idx}>
                                  {/* Arrow down */}
                                  <div className="flex flex-col items-center">
                                    <div className="h-6 w-[2px] bg-border" />
                                    <div className="h-1.5 w-1.5 rounded-full bg-border -mt-1" />
                                  </div>

                                  {/* Action Node Card */}
                                  <div 
                                    onClick={() => setSelectedNodeId(node.id)}
                                    className={`w-full p-4 border rounded-2xl cursor-pointer relative group transition-all ${
                                      isSelected 
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary/25' 
                                        : 'border-border hover:border-primary/40 bg-card'
                                    }`}
                                  >
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const remaining = editingWorkflow.actions.filter((n: any) => n.id !== node.id);
                                        setEditingWorkflow({ ...editingWorkflow, actions: remaining });
                                        if (selectedNodeId === node.id) setSelectedNodeId(null);
                                      }}
                                      className="absolute top-3.5 right-3.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                    </button>

                                    <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded-lg text-white ${
                                        node.type === 'delay' ? 'bg-amber-500' :
                                        node.type === 'approval' ? 'bg-indigo-500' :
                                        node.type === 'webhook' || node.type === 'api' ? 'bg-cyan-500' :
                                        'bg-primary'
                                      }`}>
                                        {node.type === 'delay' ? <Clock className="h-4 w-4" /> :
                                         node.type === 'approval' ? <Shield className="h-4 w-4" /> :
                                         node.type === 'webhook' || node.type === 'api' ? <Plug className="h-4 w-4" /> :
                                         <Activity className="h-4 w-4" />}
                                      </div>
                                      <div>
                                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-black">Step {idx + 1}: Action Node</div>
                                        <div className="text-xs font-extrabold text-foreground capitalize">{node.type.replace('_', ' ')}</div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                          {node.type === 'delay' ? `Wait for ${node.config?.delay_value || 1} ${node.config?.delay_unit || 'days'}` :
                                           node.type === 'email' ? `Send template to ${node.config?.recipient || 'employee'}` :
                                           node.type === 'sms' ? `SMS template alert` :
                                           node.type === 'slack_channel' ? `Post message to #${node.config?.channel || 'general'}` :
                                           node.type === 'assign_laptop' ? `Request inventory laptop model: ${node.config?.model || 'Standard'}` :
                                           node.type === 'webhook' ? `Send payload to webhook URL` :
                                           'Automated execution node'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </Fragment>
                              );
                            })}

                            {/* Arrow down to Add Button */}
                            <div className="flex flex-col items-center">
                              <div className="h-6 w-[2px] bg-border" />
                              <div className="h-1.5 w-1.5 rounded-full bg-border -mt-1" />
                            </div>

                            {/* Add node buttons selector */}
                            <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-border border-dashed rounded-xl w-full flex items-center justify-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-muted-foreground mr-2">Add Step:</span>
                              <Button 
                                size="xs" 
                                variant="outline" 
                                className="text-[9px] h-6 font-black rounded-lg border-border"
                                onClick={() => {
                                  const id = Date.now().toString();
                                  const actions = [...(editingWorkflow.actions || []), { id, type: 'delay', config: { delay_value: 2, delay_unit: 'days' } }];
                                  setEditingWorkflow({ ...editingWorkflow, actions });
                                  setSelectedNodeId(id);
                                }}
                              >
                                + Delay Node
                              </Button>
                              <Button 
                                size="xs" 
                                variant="outline" 
                                className="text-[9px] h-6 font-black rounded-lg border-border"
                                onClick={() => {
                                  const id = Date.now().toString();
                                  const actions = [...(editingWorkflow.actions || []), { id, type: 'email', config: { recipient: 'employee', template_name: 'welcome' } }];
                                  setEditingWorkflow({ ...editingWorkflow, actions });
                                  setSelectedNodeId(id);
                                }}
                              >
                                + Email
                              </Button>
                              <Button 
                                size="xs" 
                                variant="outline" 
                                className="text-[9px] h-6 font-black rounded-lg border-border"
                                onClick={() => {
                                  const id = Date.now().toString();
                                  const actions = [...(editingWorkflow.actions || []), { id, type: 'sms', config: { body: 'Alert content' } }];
                                  setEditingWorkflow({ ...editingWorkflow, actions });
                                  setSelectedNodeId(id);
                                }}
                              >
                                + SMS
                              </Button>
                              <Button 
                                size="xs" 
                                variant="outline" 
                                className="text-[9px] h-6 font-black rounded-lg border-border"
                                onClick={() => {
                                  const id = Date.now().toString();
                                  const actions = [...(editingWorkflow.actions || []), { id, type: 'slack_channel', config: { channel: 'general', text: 'Workflow alert text' } }];
                                  setEditingWorkflow({ ...editingWorkflow, actions });
                                  setSelectedNodeId(id);
                                }}
                              >
                                + Slack channel
                              </Button>
                              <Button 
                                size="xs" 
                                variant="outline" 
                                className="text-[9px] h-6 font-black rounded-lg border-border"
                                onClick={() => {
                                  const id = Date.now().toString();
                                  const actions = [...(editingWorkflow.actions || []), { id, type: 'assign_laptop', config: { model: 'ThinkPad' } }];
                                  setEditingWorkflow({ ...editingWorkflow, actions });
                                  setSelectedNodeId(id);
                                }}
                              >
                                + Assign Laptop
                              </Button>
                              <Button 
                                size="xs" 
                                variant="outline" 
                                className="text-[9px] h-6 font-black rounded-lg border-border"
                                onClick={() => {
                                  const id = Date.now().toString();
                                  const actions = [...(editingWorkflow.actions || []), { id, type: 'webhook', config: { url: 'https://api.site.com' } }];
                                  setEditingWorkflow({ ...editingWorkflow, actions });
                                  setSelectedNodeId(id);
                                }}
                              >
                                + Webhook
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Node Properties Parameter Column */}
                    <div className="space-y-6">
                      <Card className="border-border shadow-xs sticky top-4">
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                            <Sliders className="h-4 w-4 text-primary" /> Properties Panel
                          </CardTitle>
                          <CardDescription>Edit details for selected canvas nodes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Workflow global settings always visible */}
                          <div className="space-y-3 pb-4 border-b border-border">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Workflow Name</Label>
                              <Input 
                                className="text-xs rounded-xl"
                                value={editingWorkflow.name}
                                onChange={e => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                                placeholder="e.g. Employee Joining Automation"
                              />
                            </div>
                            <div className="flex justify-between items-center py-1 bg-slate-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-border">
                              <Label className="text-xs font-bold">Active Status</Label>
                              <input 
                                type="checkbox" 
                                checked={editingWorkflow.is_active}
                                onChange={e => setEditingWorkflow({ ...editingWorkflow, is_active: e.target.checked })}
                                className="rounded text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Selected node edit inputs */}
                          {selectedNodeId === 'conditions' ? (
                            <div className="space-y-3 animate-in fade-in duration-200">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-extrabold text-foreground">Condition Builder</h4>
                                <Button 
                                  size="xs" 
                                  variant="outline" 
                                  className="text-[9px] h-6 text-primary border-primary/20 hover:bg-primary/5 rounded-lg"
                                  onClick={() => {
                                    const conditions = [...(editingWorkflow.conditions || []), { field: 'department', operator: 'equals', value: 'Engineering' }];
                                    setEditingWorkflow({ ...editingWorkflow, conditions });
                                  }}
                                >
                                  + Condition
                                </Button>
                              </div>

                              {(editingWorkflow.conditions || []).length === 0 ? (
                                <p className="text-[10px] text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/10 border p-3 rounded-xl leading-relaxed">No conditions added. This workflow will always execute for the trigger event.</p>
                              ) : (
                                (editingWorkflow.conditions || []).map((cond: any, idx: number) => (
                                  <div key={idx} className="p-3 border border-border rounded-xl space-y-2 relative bg-slate-50/10">
                                    <button 
                                      onClick={() => {
                                        const remaining = editingWorkflow.conditions.filter((_: any, i: number) => i !== idx);
                                        setEditingWorkflow({ ...editingWorkflow, conditions: remaining });
                                      }}
                                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash className="h-3 w-3" />
                                    </button>
                                    
                                    <div className="space-y-1">
                                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Payload Field</Label>
                                      <Input 
                                        className="text-xs h-7 rounded-lg"
                                        value={cond.field}
                                        onChange={e => {
                                          const list = [...editingWorkflow.conditions];
                                          list[idx].field = e.target.value;
                                          setEditingWorkflow({ ...editingWorkflow, conditions: list });
                                        }}
                                      />
                                    </div>
                                    <div className="grid gap-2 grid-cols-2">
                                      <div className="space-y-1">
                                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Operator</Label>
                                        <select 
                                          className="text-xs rounded-lg border border-border p-1 bg-background text-foreground font-semibold outline-none h-7 w-full"
                                          value={cond.operator}
                                          onChange={e => {
                                            const list = [...editingWorkflow.conditions];
                                            list[idx].operator = e.target.value;
                                            setEditingWorkflow({ ...editingWorkflow, conditions: list });
                                          }}
                                        >
                                          <option value="equals">Equals</option>
                                          <option value="contains">Contains</option>
                                          <option value="greater_than">Greater Than</option>
                                          <option value="less_than">Less Than</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Value</Label>
                                        <Input 
                                          className="text-xs h-7 rounded-lg"
                                          value={cond.value}
                                          onChange={e => {
                                            const list = [...editingWorkflow.conditions];
                                            list[idx].value = e.target.value;
                                            setEditingWorkflow({ ...editingWorkflow, conditions: list });
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          ) : selectedNodeId ? (
                            (() => {
                              const node = editingWorkflow.actions.find((n: any) => n.id === selectedNodeId);
                              if (!node) return <div className="text-xs text-muted-foreground py-4">Selected step was removed.</div>;
                              
                              const updateNodeConfig = (fields: any) => {
                                const list = editingWorkflow.actions.map((n: any) => 
                                  n.id === selectedNodeId ? { ...n, config: { ...n.config, ...fields } } : n
                                );
                                setEditingWorkflow({ ...editingWorkflow, actions: list });
                              };

                              return (
                                <div className="space-y-3 animate-in fade-in duration-200">
                                  <h4 className="text-xs font-extrabold text-foreground capitalize">Configure {node.type.replace('_', ' ')} Node</h4>
                                  
                                  {node.type === 'delay' && (
                                    <>
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Delay Value</Label>
                                        <Input 
                                          type="number"
                                          className="text-xs rounded-xl"
                                          value={node.config?.delay_value || 1}
                                          onChange={e => updateNodeConfig({ delay_value: Number(e.target.value) })}
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Delay Unit</Label>
                                        <select 
                                          className="w-full text-xs rounded-xl border border-border p-2 bg-background text-foreground font-semibold outline-none"
                                          value={node.config?.delay_unit || 'days'}
                                          onChange={e => updateNodeConfig({ delay_unit: e.target.value })}
                                        >
                                          <option value="hours">Hours</option>
                                          <option value="days">Days</option>
                                          <option value="weeks">Weeks</option>
                                        </select>
                                      </div>
                                    </>
                                  )}

                                  {node.type === 'email' && (
                                    <>
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Recipient Role</Label>
                                        <select 
                                          className="w-full text-xs rounded-xl border border-border p-2 bg-background text-foreground font-semibold outline-none"
                                          value={node.config?.recipient || 'employee'}
                                          onChange={e => updateNodeConfig({ recipient: e.target.value })}
                                        >
                                          <option value="employee">Employee</option>
                                          <option value="manager">Manager</option>
                                          <option value="hr">HR Administrator</option>
                                          <option value="custom">Custom Email Address</option>
                                        </select>
                                      </div>
                                      {node.config?.recipient === 'custom' && (
                                        <div className="space-y-1.5">
                                          <Label className="text-[10px] font-bold text-muted-foreground uppercase">Custom Recipient Email</Label>
                                          <Input 
                                            className="text-xs rounded-xl"
                                            value={node.config?.custom_email || ''}
                                            onChange={e => updateNodeConfig({ custom_email: e.target.value })}
                                            placeholder="operations@company.com"
                                          />
                                        </div>
                                      )}
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Template Subject Variable</Label>
                                        <Input 
                                          className="text-xs rounded-xl"
                                          value={node.config?.subject || ''}
                                          onChange={e => updateNodeConfig({ subject: e.target.value })}
                                          placeholder="e.g. Welcome {{firstName}} to CMS"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Email Body Content</Label>
                                        <textarea 
                                          rows={4}
                                          className="w-full text-xs rounded-xl border border-border p-2 outline-none bg-background text-foreground"
                                          value={node.config?.body || ''}
                                          onChange={e => updateNodeConfig({ body: e.target.value })}
                                          placeholder="Hi {{firstName}}, welcome aboard! Your desk is ready."
                                        />
                                      </div>
                                    </>
                                  )}

                                  {node.type === 'sms' && (
                                    <div className="space-y-1.5">
                                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">SMS Message Content</Label>
                                      <textarea 
                                        rows={3}
                                        className="w-full text-xs rounded-xl border border-border p-2 outline-none bg-background text-foreground"
                                        value={node.config?.body || ''}
                                        onChange={e => updateNodeConfig({ body: e.target.value })}
                                        placeholder="OTP: {{otp}} to verify log."
                                      />
                                    </div>
                                  )}

                                  {node.type === 'slack_channel' && (
                                    <>
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Slack Channel name</Label>
                                        <Input 
                                          className="text-xs rounded-xl"
                                          value={node.config?.channel || 'general'}
                                          onChange={e => updateNodeConfig({ channel: e.target.value })}
                                          placeholder="e.g. team-general"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Message text</Label>
                                        <textarea 
                                          rows={3}
                                          className="w-full text-xs rounded-xl border border-border p-2 outline-none bg-background text-foreground"
                                          value={node.config?.text || ''}
                                          onChange={e => updateNodeConfig({ text: e.target.value })}
                                          placeholder="Pushed event alert context..."
                                        />
                                      </div>
                                    </>
                                  )}

                                  {node.type === 'assign_laptop' && (
                                    <div className="space-y-1.5">
                                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Laptop Inventory Model</Label>
                                      <select 
                                        className="w-full text-xs rounded-xl border border-border p-2 bg-background text-foreground font-semibold outline-none"
                                        value={node.config?.model || 'MacBook Pro 16'}
                                        onChange={e => updateNodeConfig({ model: e.target.value })}
                                      >
                                        <option value="MacBook Pro 16">MacBook Pro 16" M3 Max</option>
                                        <option value="MacBook Air 15">MacBook Air 15" M3</option>
                                        <option value="ThinkPad X1 Carbon">Lenovo ThinkPad X1 Carbon</option>
                                        <option value="Dell XPS 15">Dell XPS 15 Intel i9</option>
                                      </select>
                                    </div>
                                  )}

                                  {node.type === 'webhook' && (
                                    <>
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Endpoint Webhook URL</Label>
                                        <Input 
                                          className="text-xs rounded-xl"
                                          value={node.config?.url || ''}
                                          onChange={e => updateNodeConfig({ url: e.target.value })}
                                          placeholder="https://api.yoursite.com/workflows"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Custom JSON Payload</Label>
                                        <textarea 
                                          rows={4}
                                          className="w-full text-xs rounded-xl border border-border p-2 outline-none bg-background text-foreground font-mono"
                                          value={node.config?.payload || '{\n  "event": "{{trigger_event}}",\n  "tenant_id": "{{tenantId}}"\n}'}
                                          onChange={e => updateNodeConfig({ payload: e.target.value })}
                                        />
                                      </div>
                                    </>
                                  )}

                                  <div className="text-[10px] text-muted-foreground pt-4 border-t border-border">
                                    Node properties are dynamically synchronized in memory. Click "Save Workflow" above to persist changes.
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="text-center py-12 text-xs text-muted-foreground">
                              <Sliders className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                              Select a node on the canvas timeline to edit its configuration fields.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 12: AI Configuration */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* AI Config card */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">LLM Orchestration & Assistant Parameters</CardTitle>
                  <CardDescription>Select providers, configure system prompts, and change default temperature parameters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Engine Model</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-10"
                        value={aiSettings.ai_model || 'gemini-1.5-pro'}
                        onChange={e => setAiSettings({ ...aiSettings, ai_model: e.target.value })}
                      >
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended)</option>
                        <option value="openai-gpt4">OpenAI GPT-4o</option>
                        <option value="claude-3-opus">Anthropic Claude 3.5 Sonnet</option>
                        <option value="azure-ai">Azure OpenAI Service</option>
                        <option value="custom-llm">Custom Local LLM Gateway</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Assistant Alias Name</Label>
                      <Input 
                        placeholder="e.g. Antigravity Assistant"
                        className="text-xs rounded-xl h-10"
                        value={aiSettings.ai_assistant_name || ''}
                        onChange={e => setAiSettings({ ...aiSettings, ai_assistant_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Temperature ({aiSettings.ai_temperature || 0.7})</Label>
                    <Input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      className="cursor-pointer"
                      value={aiSettings.ai_temperature || 0.7}
                      onChange={e => setAiSettings({ ...aiSettings, ai_temperature: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System Guidelines Prompt Template</Label>
                    <textarea 
                      rows={4}
                      className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background font-mono"
                      value={aiSettings.ai_prompt_template || ''}
                      onChange={e => setAiSettings({ ...aiSettings, ai_prompt_template: e.target.value })}
                    />
                  </div>

                  <Button 
                    size="sm" 
                    className="text-[10px] rounded-lg h-9 font-bold px-4"
                    onClick={handleSaveAiSettings}
                  >
                    Save AI Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Usage Stats Meter */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">AI Usage & Tokens Credit Balance</CardTitle>
                  <CardDescription>Track token volumes consumed and remaining account balance thresholds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl">
                      <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Tokens Consumed</h5>
                      <p className="text-xl font-black mt-1">{(aiUsage.used || 0).toLocaleString()} / {(aiUsage.limit || 100000).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl">
                      <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Credits Remaining</h5>
                      <p className="text-xl font-black mt-1">₹{(aiUsage.creditsRemaining || 0.00).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, ((aiUsage.used || 1) / (aiUsage.limit || 100000)) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Knowledge Base vector files list */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Knowledge Base & Context Documents</CardTitle>
                  <CardDescription>Feed corporate guides, policies, or PDF files into the AI Search indexes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File upload form */}
                  <div className="p-4 border border-dashed border-border rounded-2xl space-y-4 bg-slate-50/20">
                    <h5 className="font-bold text-xs">Catalog New Knowledge Document</h5>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">File Name</Label>
                        <Input 
                          placeholder="e.g. Employee_Handbook.pdf"
                          className="text-xs rounded-xl h-9"
                          value={newKbFileName}
                          onChange={e => setNewKbFileName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Document URL / Storage Key</Label>
                        <Input 
                          placeholder="e.g. /kb/employee_handbook.pdf"
                          className="text-xs rounded-xl h-9"
                          value={newKbFileUrl}
                          onChange={e => setNewKbFileUrl(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">File Size (Optional)</Label>
                        <Input 
                          placeholder="e.g. 520 KB"
                          className="text-xs rounded-xl h-9"
                          value={newKbFileSize}
                          onChange={e => setNewKbFileSize(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] rounded-lg h-8 border-indigo-500/20 text-indigo-600 hover:bg-indigo-50"
                      onClick={handleUploadKb}
                    >
                      Index Document
                    </Button>
                  </div>

                  {/* Knowledge files table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                        <tr>
                          <th className="p-3">File Name</th>
                          <th className="p-3">File URL</th>
                          <th className="p-3">Size</th>
                          <th className="p-3">Index Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {kbFiles.map((file: any) => (
                          <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                            <td className="p-3 font-bold">{file.file_name}</td>
                            <td className="p-3 text-muted-foreground">{file.file_url}</td>
                            <td className="p-3 font-mono">{file.size}</td>
                            <td className="p-3">
                              {file.is_indexed ? (
                                <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border-none text-[8px] rounded-md">Indexed</Badge>
                              ) : (
                                <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold border-none text-[8px] rounded-md">Queued</Badge>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg px-2"
                                onClick={() => handleDeleteKb(file.id)}
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* AI queries logs */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">AI Feature Request & Token Logs</CardTitle>
                  <CardDescription>Logs of AI assistant requests, parser triggers, and payroll helper prompts.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                        <tr>
                          <th className="p-3">Feature</th>
                          <th className="p-3">Prompt Request Preview</th>
                          <th className="p-3">Tokens Used</th>
                          <th className="p-3">Estimated Cost</th>
                          <th className="p-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {tokenLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                            <td className="p-3 font-bold">{log.feature}</td>
                            <td className="p-3 text-muted-foreground max-w-xs truncate">{log.prompt}</td>
                            <td className="p-3 font-mono">{log.tokensUsed.toLocaleString()}</td>
                            <td className="p-3 font-mono">₹{log.creditsCost.toFixed(3)}</td>
                            <td className="p-3 text-muted-foreground">{log.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 13: Data Management */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Storage limits stats */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Storage Allocation & Volumes</CardTitle>
                  <CardDescription>Track database snapshots size, schema partitions, and disk indexes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Database Records Size</span>
                      <p className="text-lg font-black mt-1 font-mono">{(storageStats.databaseSizeMb || 0).toFixed(1)} MB</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Database Indexes Size</span>
                      <p className="text-lg font-black mt-1 font-mono">{(storageStats.indexesSizeMb || 0).toFixed(1)} MB</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Disk Storage Used</span>
                      <p className="text-lg font-black mt-1 font-mono">{(storageStats.storageUsedGb || 0).toFixed(2)} GB / {storageStats.storageLimitGb || 50} GB</p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (((storageStats.storageUsedGb || 1) / (storageStats.storageLimitGb || 50)) * 100))}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Tools */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Maintenance & Database Cleanup Tools</CardTitle>
                  <CardDescription>Purge session logs, clean duplicate values, and download configuration files.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl gap-4">
                    <div>
                      <h4 className="font-bold text-xs">Purge Bins & Session logs</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Cleans up <span className="font-bold">{storageStats.deletedRecordsCount || 0}</span> deleted records stored in the temporary recycling bin.</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] font-bold border-indigo-500/20 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 h-8 px-4 rounded-lg"
                      onClick={handleCleanDb}
                    >
                      Empty Recycle Bin
                    </Button>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl gap-4">
                    <div>
                      <h4 className="font-bold text-xs">Export Workspace Settings Configuration</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Export custom form schemas, workspace rules, and invoicing parameters as JSON.</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="text-[10px] font-bold h-8 px-4 rounded-lg"
                      onClick={handleExportConfig}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Compile Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 14: Security Center */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Policies config card */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Security Center & IAM Controls</CardTitle>
                  <CardDescription>Configure password parameters, MFA settings, and whitelisted IP locations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Minimum Password Length</Label>
                      <Input 
                        type="number" 
                        min="6" 
                        max="32" 
                        className="text-xs rounded-xl"
                        value={securityDraft.min_password_length || 8}
                        onChange={e => setSecurityDraft({ ...securityDraft, min_password_length: Number(e.target.value) })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold">Require Special Symbols</Label>
                        <p className="text-[9px] text-muted-foreground">Passphrases must contain numbers and symbols.</p>
                      </div>
                      <Switch 
                        checked={!!securityDraft.require_symbols}
                        onCheckedChange={(checked: boolean) => setSecurityDraft({ ...securityDraft, require_symbols: checked })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold">Two-Factor Authentication (2FA / MFA)</Label>
                        <p className="text-[9px] text-muted-foreground">Force users to verify logins via Google Authenticator.</p>
                      </div>
                      <Switch 
                        checked={!!securityDraft.mfa_enabled}
                        onCheckedChange={(checked: boolean) => setSecurityDraft({ ...securityDraft, mfa_enabled: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold">SSO Federated Identities</Label>
                        <p className="text-[9px] text-muted-foreground">Enable login bindings for Google Workspace & Azure AD.</p>
                      </div>
                      <Switch 
                        checked={!!securityDraft.sso_enabled}
                        onCheckedChange={(checked: boolean) => setSecurityDraft({ ...securityDraft, sso_enabled: checked })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IP Address Restriction Range (Comma separated)</Label>
                    <textarea 
                      rows={2} 
                      placeholder="e.g. 192.168.1.1, 157.48.92.0/24"
                      className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background font-mono"
                      value={securityDraft.allowed_ips || ''}
                      onChange={e => setSecurityDraft({ ...securityDraft, allowed_ips: e.target.value })}
                    />
                  </div>

                  <Button 
                    size="sm" 
                    className="text-[10px] rounded-lg h-9 font-bold px-4"
                    onClick={handleSaveSecurity}
                  >
                    Save Security Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Login history logs */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Corporate Login Session History</CardTitle>
                  <CardDescription>Auditing failed/successful workspace authentication activities logs.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                        <tr>
                          <th className="p-3">User Email</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">IP Address</th>
                          <th className="p-3">Browser / OS</th>
                          <th className="p-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {loginHistoryList.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                            <td className="p-3 font-bold">{log.email}</td>
                            <td className="p-3">
                              {log.status === 'success' ? (
                                <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border-none text-[8px] rounded-md">Success</Badge>
                              ) : (
                                <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-bold border-none text-[8px] rounded-md">Failed</Badge>
                              )}
                            </td>
                            <td className="p-3 font-mono">{log.ip_address}</td>
                            <td className="p-3 text-muted-foreground">{log.user_agent} ({log.device_info})</td>
                            <td className="p-3 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 15: Compliance */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Regulatory & Consent Frameworks</CardTitle>
                  <CardDescription>Govern data processing compliance and local data residency partitions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold">GDPR Compliance Flag</Label>
                          <p className="text-[9px] text-muted-foreground">Enforce cookies consent and data removal logs.</p>
                        </div>
                        <Switch 
                          checked={!!complianceDraft.gdpr_enabled}
                          onCheckedChange={(checked: boolean) => setComplianceDraft({ ...complianceDraft, gdpr_enabled: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold">SOC2 Audit Framework</Label>
                          <p className="text-[9px] text-muted-foreground">Enforce storage lifecycle logs compliance checks.</p>
                        </div>
                        <Switch 
                          checked={!!complianceDraft.soc2_enabled}
                          onCheckedChange={(checked: boolean) => setComplianceDraft({ ...complianceDraft, soc2_enabled: checked })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold">ISO 27001 Certification</Label>
                          <p className="text-[9px] text-muted-foreground">Track structural settings change history.</p>
                        </div>
                        <Switch 
                          checked={!!complianceDraft.iso_enabled}
                          onCheckedChange={(checked: boolean) => setComplianceDraft({ ...complianceDraft, iso_enabled: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold">HIPAA Health Standards</Label>
                          <p className="text-[9px] text-muted-foreground">Strict encryption key rotations for health records.</p>
                        </div>
                        <Switch 
                          checked={!!complianceDraft.hipaa_enabled}
                          onCheckedChange={(checked: boolean) => setComplianceDraft({ ...complianceDraft, hipaa_enabled: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Database Data Residency Region</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-10"
                        value={complianceDraft.data_residency || 'US-East'}
                        onChange={e => setComplianceDraft({ ...complianceDraft, data_residency: e.target.value })}
                      >
                        <option value="US-East">US East (N. Virginia)</option>
                        <option value="EU-West">EU West (Ireland)</option>
                        <option value="AP-South">Asia Pacific (Mumbai)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Legal Data Retention Policy (Years)</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="25" 
                        className="text-xs rounded-xl h-10"
                        value={complianceDraft.retention_years || 7}
                        onChange={e => setComplianceDraft({ ...complianceDraft, retention_years: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold">Explicit Cookie consent agreement</Label>
                      <p className="text-[9px] text-muted-foreground">Display cookies disclaimer to guest visitors.</p>
                    </div>
                    <Switch 
                      checked={!!complianceDraft.consent_required}
                      onCheckedChange={(checked: boolean) => setComplianceDraft({ ...complianceDraft, consent_required: checked })}
                    />
                  </div>

                  {complianceDraft.consent_required && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cookie Consent Message Body</Label>
                      <textarea 
                        rows={3} 
                        className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background"
                        value={complianceDraft.cookie_policy || ''}
                        onChange={e => setComplianceDraft({ ...complianceDraft, cookie_policy: e.target.value })}
                      />
                    </div>
                  )}

                  <Button 
                    size="sm" 
                    className="text-[10px] rounded-lg h-9 font-bold px-4"
                    onClick={handleSaveCompliance}
                  >
                    Save Compliance Policies
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 16: Billing & Subscription */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Plan overview & meters */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Plan card */}
                <Card className="border-border shadow-xs">
                  <CardHeader className="pb-3">
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Plan tier</h5>
                    <CardTitle className="text-2xl font-black mt-1">
                      {billingSub?.planName || 'Free Trial'}
                    </CardTitle>
                    <CardDescription className="text-[10px] mt-0.5 capitalize">
                      Status: <span className="font-bold text-green-600">{billingSub?.status || 'Active'}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xl font-bold">
                      {billingSub?.priceAmount !== undefined ? `₹${billingSub.priceAmount.toLocaleString()}` : '₹0'}
                      <span className="text-xs font-normal text-muted-foreground"> / {billingSub?.billingInterval || 'month'}</span>
                    </p>
                    {billingSub?.currentPeriodEnd && (
                      <p className="text-[10px] text-muted-foreground pt-1">
                        Renewal Date: <span className="font-bold">{new Date(billingSub.currentPeriodEnd).toLocaleDateString()}</span>
                      </p>
                    )}
                    {billingSub?.appliedCoupon && (
                      <Badge className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-bold border-none text-[9px] mt-1.5 rounded-md block w-fit">
                        Coupon: {billingSub.appliedCoupon} (50% Off)
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-border mt-3">
                      <input 
                        type="checkbox"
                        id="autoRenewalToggle"
                        className="w-4 h-4 accent-primary cursor-pointer rounded-lg"
                        checked={!billingSub?.cancelAtPeriodEnd}
                        disabled={billingLoading}
                        onChange={async (e) => {
                          const cancel = !e.target.checked;
                          try {
                            setBillingLoading(true);
                            const token = getStoredSessionToken();
                            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                            if (token && token !== 'null' && token !== 'undefined') {
                              headers['Authorization'] = `Bearer ${token}`;
                            }
                            const res = await fetch('/api/billing', {
                              method: 'PUT',
                              headers,
                              body: JSON.stringify({ cancelAtPeriodEnd: cancel }),
                            });
                            const json = await res.json();
                            if (res.ok && json.success) {
                              setBillingSub(json.data);
                              toast.success(cancel ? 'Auto-renewal disabled' : 'Auto-renewal enabled');
                            } else {
                              toast.error('Failed to change auto-renewal status');
                            }
                          } catch (err: any) {
                            toast.error(err.message || 'Auto-renewal action failed');
                          } finally {
                            setBillingLoading(false);
                          }
                        }}
                      />
                      <label htmlFor="autoRenewalToggle" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer select-none">
                        Auto Renew Subscription
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Seats meter */}
                <Card className="border-border shadow-xs">
                  <CardHeader className="pb-3">
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Workspace Seats Usage</h5>
                    <CardTitle className="text-2xl font-black mt-1">
                      {billingSub?.seatsUsed || 0} / {billingSub?.seatsLimit || 5} <span className="text-xs font-normal text-muted-foreground">Seats</span>
                    </CardTitle>
                    <CardDescription className="text-[10px] mt-0.5">Active users registered in tenant</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((billingSub?.seatsUsed || 1) / (billingSub?.seatsLimit || 5)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground text-right">
                      {((billingSub?.seatsUsed || 1) / (billingSub?.seatsLimit || 5) * 100).toFixed(0)}% utilized
                    </p>
                  </CardContent>
                </Card>

                {/* Storage meter */}
                <Card className="border-border shadow-xs">
                  <CardHeader className="pb-3">
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Allocation Storage Meter</h5>
                    <CardTitle className="text-2xl font-black mt-1">
                      {billingSub?.storageUsedGb || 0} / {billingSub?.storageLimitGb || 5} <span className="text-xs font-normal text-muted-foreground">GB</span>
                    </CardTitle>
                    <CardDescription className="text-[10px] mt-0.5">Media vault & documents payload</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((billingSub?.storageUsedGb || 0.1) / (billingSub?.storageLimitGb || 5)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground text-right">
                      {((billingSub?.storageUsedGb || 0.1) / (billingSub?.storageLimitGb || 5) * 100).toFixed(0)}% utilized
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Plan Migration / Upgrade / Downgrade Section */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Upgrade or Downgrade Subscription tiers</CardTitle>
                  <CardDescription>Select the subscription tier that best matches your corporate workload scaling requirements.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  {[
                    { code: 'free', name: 'Free Trial', price: '₹0', seats: '5 seats limit', storage: '5 GB media limit', desc: 'Evaluation sandboxed tier for small units.' },
                    { code: 'growth', name: 'Growth Plan', price: '₹14,990', seats: '25 seats limit', storage: '25 GB media limit', desc: 'For scaling companies needing dynamic features.' },
                    { code: 'enterprise_pro', name: 'Enterprise Pro', price: '₹49,990', seats: '100 seats limit', storage: '100 GB media limit', desc: 'Unlimited workflows, maximum bandwidth & support.' }
                  ].map(plan => {
                    const isCurrent = billingSub?.planCode === plan.code;
                    return (
                      <div 
                        key={plan.code} 
                        className={`p-4 border rounded-2xl flex flex-col justify-between transition-all ${
                          isCurrent 
                            ? 'border-primary bg-primary/5 shadow-xs' 
                            : 'border-border bg-slate-50/10 hover:border-muted-foreground/30'
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-sm flex justify-between items-center">
                            <span>{plan.name}</span>
                            {isCurrent && <Badge className="bg-primary text-white border-none font-bold text-[8px] rounded-md">Active</Badge>}
                          </h4>
                          <p className="text-lg font-black mt-2">{plan.price}<span className="text-xs font-normal text-muted-foreground"> / month</span></p>
                          <p className="text-[10px] text-muted-foreground mt-2">{plan.desc}</p>
                          <ul className="text-[10px] space-y-1 mt-3 font-sans list-disc pl-4 text-muted-foreground">
                            <li>{plan.seats}</li>
                            <li>{plan.storage}</li>
                          </ul>
                        </div>
                        <Button 
                          size="sm" 
                          variant={isCurrent ? "outline" : "default"} 
                          className="mt-5 text-[10px] rounded-lg w-full h-8 font-bold"
                          disabled={isCurrent || billingLoading}
                          onClick={() => handlePlanMigration(plan.code)}
                        >
                          {isCurrent ? 'Current Plan' : 'Select Plan'}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Add-ons Configurations */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Workspace Add-ons</CardTitle>
                  <CardDescription>Purchase individual scaling units without migrating your core base tier plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: 'extra-storage-50gb', name: 'Extra Storage (+50 GB)', price: '₹1,490 / month', desc: 'Adds 50 GB storage capacity to your digital file vaults.' },
                    { id: 'extra-seats-10', name: 'Extra Seats (+10 users)', price: '₹2,990 / month', desc: 'Add 10 additional worker seats to your workspace permissions.' }
                  ].map(addon => {
                    const activeAddons = billingSub?.addons || [];
                    const isChecked = !!activeAddons.find((a: any) => a.id === addon.id);
                    return (
                      <div key={addon.id} className="flex justify-between items-center p-4 border border-border rounded-xl bg-slate-50/20">
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-xs flex items-center gap-1.5">
                            <span>{addon.name}</span>
                            <Badge className="bg-slate-100 dark:bg-zinc-800 text-[9px] border-none font-bold text-muted-foreground rounded-md">{addon.price}</Badge>
                          </h5>
                          <p className="text-[10px] text-muted-foreground">{addon.desc}</p>
                        </div>
                        <input 
                          type="checkbox"
                          className="w-5 h-5 accent-primary cursor-pointer"
                          checked={isChecked}
                          disabled={billingLoading}
                          onChange={e => handleAddonsUpdate(addon.id, e.target.checked)}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Payment Methods & Coupons */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Card Payment Card */}
                <Card className="border-border shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Billing Payment Methods</CardTitle>
                    <CardDescription>Manage cards bound for recurring subscription billing payments.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {billingSub?.paymentMethodLast4 ? (
                      <div className="p-4 border border-border rounded-2xl flex items-center justify-between bg-slate-50 dark:bg-zinc-900/40">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-md flex items-center justify-center text-[10px] font-bold">
                            {billingSub.paymentMethodBrand}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs">ending in •••• {billingSub.paymentMethodLast4}</h5>
                            <p className="text-[9px] text-muted-foreground">Expires permanent token</p>
                          </div>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-bold">Primary</Badge>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-border rounded-2xl text-center text-muted-foreground text-xs py-6">
                        No credit or debit cards bound yet.
                      </div>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] rounded-lg h-8 border-primary/20 text-primary hover:bg-primary/5"
                      disabled={billingLoading}
                      onClick={handleBindPaymentCard}
                    >
                      {billingSub?.paymentMethodLast4 ? 'Update Card' : 'Add Payment Card'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Promo Coupons */}
                <Card className="border-border shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Promo Coupons & Referral codes</CardTitle>
                    <CardDescription>Activate special price markdowns or discount coupons.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="e.g. WELCOME50"
                        className="text-xs rounded-xl"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        className="text-[10px] rounded-lg h-9 font-bold px-4"
                        disabled={billingLoading}
                        onClick={handleApplyCoupon}
                      >
                        Apply Code
                      </Button>
                    </div>
                    <p className="text-[9px] text-muted-foreground">
                      Use code <span className="font-bold text-primary">WELCOME50</span> to apply 50% discount to all core plans.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* SaaS billing addresses / taxes */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">SaaS Invoicing Tax Profiles</CardTitle>
                  <CardDescription>Adjust GSTIN/PAN and corporate addresses used when generating bills for *your* workspace.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5 max-w-sm">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Corporate Tax ID / GSTIN</Label>
                    <Input 
                      placeholder="e.g. 09AAAAA1111A1Z1"
                      className="text-xs rounded-xl"
                      value={taxIdInput}
                      onChange={e => setTaxIdInput(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Address Street Line</Label>
                      <Input 
                        placeholder="e.g. 404 Corporate Suite"
                        className="text-xs rounded-xl"
                        value={billingAddressInput.line1 || ''}
                        onChange={e => setBillingAddressInput({ ...billingAddressInput, line1: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">City</Label>
                      <Input 
                        placeholder="e.g. Noida"
                        className="text-xs rounded-xl"
                        value={billingAddressInput.city || ''}
                        onChange={e => setBillingAddressInput({ ...billingAddressInput, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">State</Label>
                      <Input 
                        placeholder="e.g. Uttar Pradesh"
                        className="text-xs rounded-xl"
                        value={billingAddressInput.state || ''}
                        onChange={e => setBillingAddressInput({ ...billingAddressInput, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Postal Code</Label>
                      <Input 
                        placeholder="e.g. 201301"
                        className="text-xs rounded-xl"
                        value={billingAddressInput.postal_code || ''}
                        onChange={e => setBillingAddressInput({ ...billingAddressInput, postal_code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Country</Label>
                      <Input 
                        placeholder="e.g. India"
                        className="text-xs rounded-xl"
                        value={billingAddressInput.country || ''}
                        onChange={e => setBillingAddressInput({ ...billingAddressInput, country: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="text-[10px] rounded-lg h-8 font-bold px-4"
                    disabled={billingLoading}
                    onClick={handleSaveBillingDetails}
                  >
                    Save Tax Profile Details
                  </Button>
                </CardContent>
              </Card>

              {/* SaaS billing invoices list */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Subscription Payment History</CardTitle>
                  <CardDescription>Download past SaaS invoices generated for your active subscriptions.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                        <tr>
                          <th className="p-4">Invoice ID</th>
                          <th className="p-4">Billing Date</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {saasInvoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                            <td className="p-4 font-bold">{inv.invoiceNumber}</td>
                            <td className="p-4 text-muted-foreground">{inv.billingDate}</td>
                            <td className="p-4 font-bold">{inv.currency} {inv.amount.toLocaleString()}</td>
                            <td className="p-4">
                              <Badge className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-bold border-none text-[9px] capitalize rounded-md">
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 text-[10px] font-bold text-primary hover:bg-primary/5 rounded-lg px-3"
                                onClick={() => {
                                  toast.info(`Simulated PDF download for invoice ${inv.invoiceNumber}`);
                                }}
                              >
                                <Download className="h-3.5 w-3.5 mr-1" /> PDF
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 17: API Management */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {/* API Keys Manager */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Developer API Keys</CardTitle>
                  <CardDescription>Generate private credentials to programmatically query workspace indices.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Create Key Form */}
                  <div className="flex gap-2 max-w-md">
                    <Input 
                      placeholder="API Key Label (e.g. Production ERP)"
                      className="text-xs rounded-xl h-9"
                      value={newApiKeyName}
                      onChange={e => setNewApiKeyName(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      className="text-[10px] rounded-lg h-9 font-bold px-4"
                      onClick={handleCreateApiKey}
                    >
                      Generate Key
                    </Button>
                  </div>

                  {/* Keys list */}
                  <div className="space-y-2 max-w-xl">
                    {developerApiKeys.map((key: any) => (
                      <div key={key.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-900/10 border border-border rounded-xl font-sans text-xs">
                        <div>
                          <h5 className="font-bold text-xs">{key.key_name}</h5>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{key.prefix}••••••••••••••••••••</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg px-2 text-[10px] font-bold"
                          onClick={() => handleDeleteApiKey(key.id)}
                        >
                          Revoke Key
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Webhooks Manager */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Callback Webhook Subscriptions</CardTitle>
                  <CardDescription>Receive real-time automated HTTP POST payloads at external endpoint channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Create Webhook Form */}
                  <div className="space-y-3 max-w-xl">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Webhook Target Destination URL (https://...)"
                        className="text-xs rounded-xl h-9"
                        value={newWebhookUrl}
                        onChange={e => setNewWebhookUrl(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        className="text-[10px] rounded-lg h-9 font-bold px-4"
                        onClick={handleCreateWebhook}
                      >
                        Register
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Subscribed Events:</Label>
                      <Badge className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold border-none text-[8px] rounded-md">employee.created</Badge>
                      <Badge className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold border-none text-[8px] rounded-md">employee.updated</Badge>
                    </div>
                  </div>

                  {/* Webhooks list */}
                  <div className="space-y-2 max-w-xl">
                    {developerWebhooks.map((wh: any) => (
                      <div key={wh.id} className="p-3 bg-slate-50 dark:bg-zinc-900/10 border border-border rounded-xl font-sans text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold font-mono text-[10px] truncate max-w-xs">{wh.url}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg px-2 text-[9px] font-bold"
                            onClick={() => handleDeleteWebhook(wh.id)}
                          >
                            Remove
                          </Button>
                        </div>
                        <p className="text-[9px] text-muted-foreground font-mono">Signing Secret: <span className="font-bold">{wh.secret}</span></p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* OAuth Apps */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Workspace Client OAuth Applications</CardTitle>
                  <CardDescription>Authorize secure tenant SSO logins for custom external dashboards.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {developerOAuthApps.map((app: any) => (
                    <div key={app.id} className="p-4 border border-border rounded-2xl bg-slate-50/20 space-y-2 font-sans text-xs">
                      <h5 className="font-bold text-xs flex justify-between items-center">
                        <span>{app.name}</span>
                        <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-none font-bold text-[8px] rounded-md">Active</Badge>
                      </h5>
                      <p className="text-[10px] text-muted-foreground">Redirect URI: <span className="font-mono">{app.redirectUri}</span></p>
                      <div className="grid gap-2 md:grid-cols-2 pt-1 font-mono text-[9px] text-muted-foreground">
                        <div>Client ID: <span className="font-bold">{app.clientId}</span></div>
                        <div>Client Secret: <span className="font-bold">{app.clientSecret}</span></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Playground Simulator */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Developer API Playground</CardTitle>
                  <CardDescription>Simulate incoming developer payload cycles inside the sandbox container.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Method</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-10"
                        value={playgroundMethod}
                        onChange={e => setPlaygroundMethod(e.target.value)}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-bold">Endpoint Path</Label>
                      <Input 
                        placeholder="/api/v1/employees"
                        className="text-xs rounded-xl h-10"
                        value={playgroundPath}
                        onChange={e => setPlaygroundPath(e.target.value)}
                      />
                    </div>
                  </div>

                  {playgroundMethod !== 'GET' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">JSON Request Body Payload</Label>
                      <textarea 
                        rows={3}
                        className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background font-mono"
                        value={playgroundBody}
                        onChange={e => setPlaygroundBody(e.target.value)}
                      />
                    </div>
                  )}

                  <Button 
                    size="sm" 
                    className="text-[10px] rounded-lg h-9 font-bold px-4"
                    onClick={handleRunPlayground}
                  >
                    Execute API Request
                  </Button>

                  {playgroundResponse && (
                    <div className="p-4 bg-zinc-950 text-green-400 border border-border rounded-2xl overflow-auto font-mono text-[10px] max-h-80">
                      <h5 className="text-[9px] text-muted-foreground uppercase font-bold mb-2">Sandbox Playground Response: HTTP {playgroundResponse.status || '200'}</h5>
                      <pre>{JSON.stringify(playgroundResponse, null, 2)}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Developer API logs */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Incoming developer API access logs</CardTitle>
                  <CardDescription>Trace endpoint latency speed and HTTP response values triggered by API keys.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                        <tr>
                          <th className="p-3">Method</th>
                          <th className="p-3">Path Endpoint</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Latency</th>
                          <th className="p-3">IP Address</th>
                          <th className="p-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {developerApiLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                            <td className="p-3 font-bold font-mono">{log.method}</td>
                            <td className="p-3 text-muted-foreground font-mono">{log.path}</td>
                            <td className="p-3">
                              <Badge className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-bold border-none text-[8px] rounded-md">{log.status_code} OK</Badge>
                            </td>
                            <td className="p-3 font-mono">{log.duration_ms} ms</td>
                            <td className="p-3 text-muted-foreground font-mono">{log.ip_address}</td>
                            <td className="p-3 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 18: Audit Logs */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Workspace Configuration Auditing</CardTitle>
                  <CardDescription>Chronological sequence logs of settings table adjustments and operations.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                        <tr>
                          <th className="p-3">Actor / Who</th>
                          <th className="p-3">Action / What</th>
                          <th className="p-3">Old Value</th>
                          <th className="p-3">New Value</th>
                          <th className="p-3">IP & Client Device</th>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {auditLogsList.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-muted-foreground/60 italic">
                              No settings changes recorded yet in audit system.
                            </td>
                          </tr>
                        ) : (
                          auditLogsList.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                              <td className="p-3 font-bold">{log.action_by}</td>
                              <td className="p-3">{log.action_name}</td>
                              <td className="p-3 font-mono text-[10px] max-w-[120px] truncate">{log.old_value || '—'}</td>
                              <td className="p-3 font-mono text-[10px] max-w-[120px] truncate text-primary">{log.new_value || '—'}</td>
                              <td className="p-3">
                                <span className="font-mono">{log.ip_address || '127.0.0.1'}</span>
                                {log.device_info && <p className="text-[9px] text-muted-foreground mt-0.5">{log.device_info}</p>}
                              </td>
                              <td className="p-3 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                              <td className="p-3 text-right">
                                {log.old_value ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 text-[10px] rounded-lg font-bold border-primary/20 text-primary hover:bg-primary/5 px-2.5"
                                    onClick={() => handleUndoAudit(log.id)}
                                  >
                                    Undo
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-[10px]">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 19: Organization Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Category Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                {['All', 'Policies', 'HR', 'Finance', 'Legal', 'Certificates', 'Insurance', 'GST', 'PAN', 'Agreements', 'Licenses'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                      activeCategoryFilter === cat
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-card text-muted-foreground border-border hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-slate-50/50 dark:bg-zinc-900/20 px-6 py-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Official Document Repository Vault
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1">
                        Encrypted storage container of corporate insurance files, legal deeds, licenses, and onboarding registers.
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-primary text-white hover:bg-primary/90 text-xs font-bold h-9 px-4 rounded-xl shadow-sm flex items-center gap-1.5"
                      onClick={() => setIsDocUploadModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" /> Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-3">
                    {getCompiledDocuments()
                      .filter(doc => activeCategoryFilter === 'All' || doc.type === activeCategoryFilter)
                      .length > 0 ? (
                        getCompiledDocuments()
                          .filter(doc => activeCategoryFilter === 'All' || doc.type === activeCategoryFilter)
                          .map((doc, idx) => (
                            <div 
                              key={doc.name + idx} 
                              className="p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-zinc-800/10 transition-all gap-4"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                  {doc.type === 'Insurance' ? (
                                    <Shield className="h-5 w-5 text-primary" />
                                  ) : doc.type === 'Legal' || doc.type === 'Agreements' ? (
                                    <FileText className="h-5 w-5 text-primary" />
                                  ) : (
                                    <Briefcase className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-xs text-foreground truncate">{doc.name}</h5>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2">
                                      {doc.type}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{doc.size}</span>
                                    <span className="text-muted-foreground text-[10px]">•</span>
                                    <span className="text-[10px] font-semibold text-muted-foreground">
                                      {doc.isOnboarding ? 'Onboarding Phase Document' : 'Uploaded Workspace Asset'}
                                    </span>
                                    {doc.isOnboarding && (
                                      <>
                                        <span className="text-muted-foreground text-[10px]">•</span>
                                        <Badge className={doc.fileUrl?.startsWith('/uploads/mock_') ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2"}>
                                          {doc.fileUrl?.startsWith('/uploads/mock_') ? 'Mock Template' : 'Verified Actual'}
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] font-bold border-border mr-2 bg-card text-foreground px-2 py-0.5">
                                  Expires: {doc.expiry}
                                </Badge>
                                
                                {doc.fileUrl ? (
                                  <a 
                                    href={getFileUrlWithToken(doc.fileUrl)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2 rounded-xl border border-border bg-card hover:bg-slate-50 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-all shadow-xs"
                                    title="View / Download File"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </a>
                                ) : (
                                  <button disabled className="p-2 rounded-xl border border-border bg-card text-muted-foreground/30 cursor-not-allowed shadow-xs">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                )}

                                 {doc.isOnboarding && (
                                   <button 
                                     onClick={() => {
                                       setOnboardingUploadTarget(doc.onboardingKey);
                                       setTimeout(() => onboardingInputRef.current?.click(), 100);
                                     }}
                                     className="p-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all shadow-xs flex items-center gap-1.5 text-[10px] font-bold mr-1"
                                     title={doc.fileUrl?.startsWith('/uploads/mock_') ? "Upload Actual Verified Certificate" : "Update Verified Certificate File"}
                                   >
                                     <Upload className="h-3.5 w-3.5" />
                                     <span>{doc.fileUrl?.startsWith('/uploads/mock_') ? 'Upload Actual' : 'Update File'}</span>
                                   </button>
                                 )}

                                {doc.isOnboarding ? (
                                  <button 
                                    disabled 
                                    className="p-2 rounded-xl border border-border bg-muted/30 text-muted-foreground/35 cursor-not-allowed shadow-xs"
                                    title="Onboarding files cannot be removed"
                                  >
                                    <Lock className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleRemoveDocument(doc.index)}
                                    className="p-2 rounded-xl border border-border bg-card hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-500 transition-all shadow-xs"
                                    title="Remove Reference"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                    ) : (
                      <div className="text-center py-12 text-xs text-muted-foreground border-2 border-dashed border-border/80 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/10">
                        <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/45" />
                        No official documents found under "{activeCategoryFilter}" filter.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Floating Upload Document Modal */}
              {isDocUploadModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                    <button 
                      onClick={() => setIsDocUploadModalOpen(false)}
                      className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    
                    <div className="space-y-1 mb-5">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Shield className="h-4.5 w-4.5 text-primary" />
                        Upload Document to Workspace Vault
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Files are stored securely in tenant containers. Limits: PDF/PNG/JPG up to 1MB.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Document Name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Document Title</Label>
                        <Input 
                          placeholder="e.g. General Liability Insurance Policy"
                          className="text-xs rounded-xl"
                          value={docUploadName}
                          onChange={e => setDocUploadName(e.target.value)}
                        />
                      </div>

                      {/* Grid Category & Expiry */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                          <select 
                            className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none font-sans font-semibold text-foreground focus-visible:ring-primary/20"
                            value={docUploadCategory}
                            onChange={e => setDocUploadCategory(e.target.value)}
                          >
                            <option value="Policies">Policies</option>
                            <option value="HR">HR Documents</option>
                            <option value="Finance">Finance / Taxes</option>
                            <option value="Legal">Legal Files</option>
                            <option value="Certificates">Certificates</option>
                            <option value="Insurance">Insurance</option>
                            <option value="GST">GST Registration</option>
                            <option value="PAN">PAN Card Registry</option>
                            <option value="Agreements">Agreements</option>
                            <option value="Licenses">Operating Licenses</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expiry Date</Label>
                          <Input 
                            placeholder="e.g. Permanent or 2027-12-31"
                            className="text-xs rounded-xl"
                            value={docUploadExpiry}
                            onChange={e => setDocUploadExpiry(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* File Selector Dropzone */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Document File</Label>
                        {docUploadFile ? (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block truncate">{docUploadFile.name}</span>
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-500 block">{(docUploadFile.size / 1024).toFixed(1)} KB • {docUploadFile.type}</span>
                            </div>
                            <button 
                              onClick={() => setDocUploadFile(null)}
                              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline px-2"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => document.getElementById('vault-file-picker')?.click()}
                            className="border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 rounded-2xl p-6 text-center cursor-pointer transition-all"
                          >
                            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/45" />
                            <span className="text-xs font-bold text-foreground block">Select file from system</span>
                            <span className="text-[10px] text-muted-foreground mt-1 block">PDF, DOCX, PNG, or JPG (Images: Max 1MB, Docs: Max 2MB)</span>
                            <input 
                              type="file" 
                              id="vault-file-picker" 
                              className="hidden" 
                              accept="application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/png, image/jpeg"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const fileNameLower = file.name.toLowerCase();
                                  const mimeType = file.type;
                                  const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/jpg' || 
                                                  fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png');
                                  const isPdf = mimeType === 'application/pdf' || fileNameLower.endsWith('.pdf');
                                  const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileNameLower.endsWith('.docx');
                                  
                                  if (!isImage && !isPdf && !isDocx) {
                                    toast.error('Only PDF, DOCX, and images (JPG, JPEG, PNG) are accepted.');
                                    e.target.value = '';
                                    return;
                                  }
                                  const fileLimit = isImage ? 1 * 1024 * 1024 : 2 * 1024 * 1024;
                                  if (file.size > fileLimit) {
                                    toast.error(`File size exceeds the limit of ${isImage ? '1 MB' : '2 MB'}`);
                                    e.target.value = '';
                                    return;
                                  }
                                  setDocUploadFile(file);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 mt-6 border-t border-border pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs font-bold rounded-xl h-9 px-4"
                        onClick={() => setIsDocUploadModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        className="text-xs font-bold rounded-xl h-9 px-4 bg-primary text-white hover:bg-primary/90"
                        onClick={handleVaultDocumentUpload}
                      >
                        Upload & Register
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 20: Backup & Recovery */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Trigger and Schedule options */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Cloud Snapshots & Backups</CardTitle>
                  <CardDescription>Configure auto recurrence frequencies and trigger manual target recovery points.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl gap-4">
                    <div>
                      <h4 className="font-bold text-xs">Automated Cloud Backups Frequency</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Encrypts and relays schema structures to corporate cloud repositories.</p>
                    </div>
                    <select 
                      className="text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-9"
                      value={backupInterval}
                      onChange={e => handleToggleBackupSchedule(e.target.value)}
                    >
                      <option value="daily">Daily Cron schedule</option>
                      <option value="weekly">Weekly Cron schedule</option>
                      <option value="monthly">Monthly Cron schedule</option>
                      <option value="none">Deactivated / Off</option>
                    </select>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl gap-4">
                    <div>
                      <h4 className="font-bold text-xs">Execute Manual Database Snapshot</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Generate a complete system restore point snapshot targeting current workspace state immediately.</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="text-[10px] font-bold h-9 px-4 rounded-lg"
                      onClick={handleCreateBackup}
                    >
                      Snapshot Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Snapshots Table */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Available Recovery Snapshots</CardTitle>
                  <CardDescription>Select past restore points to roll back database structures.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                        <tr>
                          <th className="p-3">File name</th>
                          <th className="p-3">Sizing</th>
                          <th className="p-3">Backup Type</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Created At</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {backupsList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-muted-foreground/60 italic">
                              No snapshots created yet. Click "Snapshot Now" to build one!
                            </td>
                          </tr>
                        ) : (
                          backupsList.map((bk: any) => (
                            <tr key={bk.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                              <td className="p-3 font-bold font-mono truncate max-w-xs">{bk.file_name}</td>
                              <td className="p-3 font-mono">{bk.file_size}</td>
                              <td className="p-3">
                                <Badge className="bg-slate-100 dark:bg-zinc-800 text-muted-foreground border-none font-bold text-[8px] rounded-md capitalize">{bk.backup_type}</Badge>
                              </td>
                              <td className="p-3">
                                {bk.status === 'completed' ? (
                                  <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border-none text-[8px] rounded-md">Completed</Badge>
                                ) : bk.status === 'in_progress' ? (
                                  <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold border-none text-[8px] rounded-md">In Progress</Badge>
                                ) : (
                                  <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-bold border-none text-[8px] rounded-md">Failed</Badge>
                                )}
                              </td>
                              <td className="p-3 text-muted-foreground">{new Date(bk.created_at).toLocaleString()}</td>
                              <td className="p-3 text-right flex justify-end gap-1.5">
                                {bk.download_url && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/10 rounded-lg px-2 text-[10px] font-bold"
                                    onClick={() => toast.success(`Starting download: ${bk.file_name}`)}
                                  >
                                    Download
                                  </Button>
                                )}
                                {bk.status === 'completed' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 border-primary/20 text-primary hover:bg-primary/5 rounded-lg px-2 text-[10px] font-bold"
                                    onClick={() => handleRestoreBackup(bk.id)}
                                  >
                                    Restore
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 21: Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Toggles */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">System Mode Configurations</CardTitle>
                  <CardDescription>Govern environment states, feature releases, and system availability flags.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-border">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs">Developer Mode</h4>
                      <p className="text-[10px] text-muted-foreground">Expose API playground tools and advanced developer features to administrator panels.</p>
                    </div>
                    <Switch 
                      checked={!!advancedSettings.developer_mode} 
                      onCheckedChange={(checked: boolean) => setAdvancedSettings({ ...advancedSettings, developer_mode: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-border">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs">Maintenance Mode</h4>
                      <p className="text-[10px] text-muted-foreground">Put the client interface into static offline pages. Admins can bypass restrictions.</p>
                    </div>
                    <Switch 
                      checked={!!advancedSettings.maintenance_mode} 
                      onCheckedChange={(checked: boolean) => setAdvancedSettings({ ...advancedSettings, maintenance_mode: checked })}
                    />
                  </div>

                  <Button 
                    size="sm" 
                    className="text-[10px] rounded-lg h-9 font-bold px-4"
                    onClick={handleSaveAdvancedSettings}
                  >
                    Save Advanced Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Cache and Queues */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">System Cache & Workers Queues</CardTitle>
                  <CardDescription>Clear session keys or force task distributions across background nodes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-foreground block">System Redis Cache Flush</strong>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Clears out configuration buffers. Users might experience minor initial latency.</p>
                      </div>
                      <Button size="sm" variant="destructive" className="h-8 font-bold text-[10px]" onClick={handleFlushCaches}>
                        Flush Cache
                      </Button>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-border text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-foreground block">Dispatch Queues Workers</strong>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Force execute queue channels and synchronize backlogs immediately.</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 font-bold text-[10px] border-primary/20 text-primary hover:bg-primary/5" onClick={handleTriggerQueues}>
                        Trigger Workers
                      </Button>
                    </div>
                  </div>

                  {/* Queue Stats */}
                  <div className="grid gap-3 grid-cols-4 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-900/20 rounded-xl border text-center">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Pending</span>
                      <p className="text-base font-black mt-1 font-mono">{queueStats.pending || 0}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-zinc-900/20 rounded-xl border text-center">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Active</span>
                      <p className="text-base font-black mt-1 font-mono text-indigo-600">{queueStats.active || 0}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-zinc-900/20 rounded-xl border text-center">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Completed</span>
                      <p className="text-base font-black mt-1 font-mono text-green-600">{queueStats.completed || 0}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-zinc-900/20 rounded-xl border text-center">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Failed</span>
                      <p className="text-base font-black mt-1 font-mono text-red-500">{queueStats.failed || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cron Jobs */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Active Cron Job Scheduler</CardTitle>
                  <CardDescription>Track recurrence timelines and last execution records for background schedules.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                        <tr>
                          <th className="p-3">Job Name</th>
                          <th className="p-3">Schedule Interval</th>
                          <th className="p-3">Last Executed</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {cronJobs.map((job: any) => (
                          <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                            <td className="p-3 font-bold">{job.name}</td>
                            <td className="p-3 font-mono">{job.schedule}</td>
                            <td className="p-3 text-muted-foreground">{job.lastRun}</td>
                            <td className="p-3">
                              <Badge className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-bold border-none text-[8px] rounded-md">{job.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Environment Health diagnostics */}
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Environment & CDN Health Diagnostics</CardTitle>
                  <CardDescription>Perform active latency checks and inspect server storage thresholds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-900/30 border rounded-2xl flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-xs">Workspace Node Environment: <span className="font-mono text-indigo-600 font-bold">Production</span></h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Asset payloads are distributed via global edge CDN links.</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[10px] rounded-lg h-8 border-primary/20 text-primary hover:bg-primary/5"
                      onClick={handleRunHealthChecks}
                    >
                      Run Health Check
                    </Button>
                  </div>

                  {healthDiagnostics && (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pt-2">
                      <div className="p-3 border rounded-xl bg-slate-50 dark:bg-zinc-900/10">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Postgres Database</span>
                        <p className="font-bold text-xs mt-0.5 text-green-600 capitalize">{healthDiagnostics.database}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">Latency: {healthDiagnostics.dbLatencyMs} ms</p>
                      </div>

                      <div className="p-3 border rounded-xl bg-slate-50 dark:bg-zinc-900/10">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Cloud CDN Storage</span>
                        <p className="font-bold text-xs mt-0.5 text-indigo-600 capitalize">{healthDiagnostics.cdnStatus}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">Edge response: {healthDiagnostics.cdnLatencyMs} ms</p>
                      </div>

                      <div className="p-3 border rounded-xl bg-slate-50 dark:bg-zinc-900/10">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Storage Disk space</span>
                        <p className="font-bold text-xs mt-0.5 text-foreground">{healthDiagnostics.diskUsage}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">Memory: {healthDiagnostics.serverMemory}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Core Tab: Change Password (Always Visible & Managed separately) */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Change Corporate Password</CardTitle>
                  <CardDescription>Update your workspace administrator login credentials securely.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <div className="space-y-4 max-w-md">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <Label htmlFor="currentPassword">Current Password *</Label>
                            <FormControl>
                              <Input
                                id="currentPassword"
                                type="password"
                                {...field}
                                placeholder="Enter your current password"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <Label htmlFor="newPassword">New Password *</Label>
                            <FormControl>
                              <Input
                                id="newPassword"
                                type="password"
                                {...field}
                                placeholder="Enter new password (min 6 characters)"
                              />
                            </FormControl>
                            <p className="text-[10px] text-muted-foreground">
                              Password must be at least 6 characters long
                            </p>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                            <FormControl>
                              <Input
                                id="confirmPassword"
                                type="password"
                                {...field}
                                placeholder="Re-enter new password"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <Button onClick={() => void passwordForm.handleSubmit(handlePasswordChange, () => toast.error('Please fix the password form before submitting'))()} disabled={changingPassword} className="bg-primary hover:bg-primary/95 text-white">
                        {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                        Update Password
                      </Button>
                    </div>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

        </div>

        {/* Foldable Right Info Panel */}
        {rightPanelOpen && (
          <div className="w-full xl:w-80 shrink-0 space-y-6 sticky top-6 bg-card border border-border/60 p-5 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h4 className="font-bold text-xs flex items-center gap-1.5">
                <History className="h-4 w-4 text-primary" />
                Action Desk
              </h4>
              <button onClick={() => setRightPanelOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Undo/Redo Controls */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Undo/Redo Workspace History</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8" disabled={undoStack.length === 0} onClick={handleUndo}>
                  <Undo className="mr-1.5 h-3.5 w-3.5" /> Undo ({undoStack.length})
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8" disabled={redoStack.length === 0} onClick={handleRedo}>
                  <Redo className="mr-1.5 h-3.5 w-3.5" /> Redo ({redoStack.length})
                </Button>
              </div>
            </div>

            {/* Settings Context Help */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Smart Helper documentation</div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-border text-[11px] leading-relaxed text-muted-foreground">
                {activeTab === 'overview' && 'Overview helps adjust global workspace names, timezones, and corporate fiscal cycles.'}
                {activeTab === 'company' && 'Company profiles are attached to official documents and GSTIN registries.'}
                {activeTab === 'invoice' && 'Invoicing controls prefix patterns like TS-INV-001 decimal calculations.'}
                {activeTab === 'security' && 'Security center dictates MFA restrictions and session logout timeouts.'}
                {!['overview', 'company', 'invoice', 'security'].includes(activeTab) && 'Configure settings parameters. Tab adjustments save to local memory draft layers instantly.'}
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Workspace Shortcuts</div>
              <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                <button onClick={() => setActiveTab('password')} className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-foreground font-semibold">Change Pass</button>
                <button onClick={() => setActiveTab('security')} className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-foreground font-semibold">Security Settings</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Persistent Bottom Action Bar for Unsaved Changes */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 flex justify-between items-center z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-extrabold text-foreground">You have unsaved workspace changes</p>
              <p className="text-[10px] text-muted-foreground hidden sm:block">Draft edits exist locally. Publish changes to sync database logs.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleDiscardChanges}>Discard</Button>
            <Button variant="outline" size="sm" className="text-xs h-8 px-3 rounded-lg" onClick={handleSaveDraft}>Save Draft</Button>
            <Button size="sm" disabled={saving} onClick={handlePublishChanges} className="bg-primary text-white hover:bg-primary/95 text-xs h-8 px-4 rounded-lg">
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
              Publish Changes
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
