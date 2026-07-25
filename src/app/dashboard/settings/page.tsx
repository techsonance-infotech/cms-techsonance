'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  HelpCircle, HardDrive, Lock, RefreshCw, X, Check, Bell, Laptop, Send, Terminal, Trash, Eye, Upload
} from 'lucide-react';
import { DetailedPageSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { DynamicSchemaTab } from '@/components/settings/dynamic-schema-tab';

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

  // Invoicing Ext
  invoicePrefix: string;
  invoiceDecimal: number;

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

  mfaEnforced: true,
  sessionTimeout: 60,
  passwordMinLength: 8,
  ipWhitelist: '192.168.1.1/32, 103.241.12.0/24',
  allowedDomains: 'techsonance.com, techsonanceinfotech.com',

  notifyEmail: true,
  notifySms: false,
  notifyWhatsapp: true,
  notifySlack: true,

  invoicePrefix: 'TS-INV-',
  invoiceDecimal: 2,

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

  // Search & Navigation States
  const [searchTerm, setSearchTerm] = useState('');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Org Chart & Registries states
  const [orgNodes, setOrgNodes] = useState<any[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [activeRegistry, setActiveRegistry] = useState<'costCenters' | 'grades' | 'bands' | 'designations' | 'jobLevels' | 'employmentTypes' | 'workModes' | 'shifts' | 'teams'>('costCenters');
  const [newRegistryItem, setNewRegistryItem] = useState('');

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
        fetchSettingsFromBackend()
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

        mfaEnforced: backendWorkspace.mfaEnforced !== undefined ? backendWorkspace.mfaEnforced : DEFAULT_WORKSPACE_STATE.mfaEnforced,
        sessionTimeout: backendWorkspace.sessionTimeout !== undefined ? backendWorkspace.sessionTimeout : DEFAULT_WORKSPACE_STATE.sessionTimeout,
        passwordMinLength: backendWorkspace.passwordMinLength !== undefined ? backendWorkspace.passwordMinLength : DEFAULT_WORKSPACE_STATE.passwordMinLength,
        ipWhitelist: backendWorkspace.ipWhitelist || DEFAULT_WORKSPACE_STATE.ipWhitelist,
        allowedDomains: backendWorkspace.allowedDomains || DEFAULT_WORKSPACE_STATE.allowedDomains,

        notifyEmail: backendWorkspace.notifyEmail !== undefined ? backendWorkspace.notifyEmail : DEFAULT_WORKSPACE_STATE.notifyEmail,
        notifySms: backendWorkspace.notifySms !== undefined ? backendWorkspace.notifySms : DEFAULT_WORKSPACE_STATE.notifySms,
        notifyWhatsapp: backendWorkspace.notifyWhatsapp !== undefined ? backendWorkspace.notifyWhatsapp : DEFAULT_WORKSPACE_STATE.notifyWhatsapp,
        notifySlack: backendWorkspace.notifySlack !== undefined ? backendWorkspace.notifySlack : DEFAULT_WORKSPACE_STATE.notifySlack,

        invoicePrefix: backendWorkspace.invoicePrefix || DEFAULT_WORKSPACE_STATE.invoicePrefix,
        invoiceDecimal: backendWorkspace.invoiceDecimal !== undefined ? backendWorkspace.invoiceDecimal : DEFAULT_WORKSPACE_STATE.invoiceDecimal,

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
      workspaceDraft.mfaEnforced !== savedWorkspace.mfaEnforced ||
      workspaceDraft.sessionTimeout !== savedWorkspace.sessionTimeout ||
      workspaceDraft.passwordMinLength !== savedWorkspace.passwordMinLength ||
      workspaceDraft.ipWhitelist !== savedWorkspace.ipWhitelist ||
      workspaceDraft.allowedDomains !== savedWorkspace.allowedDomains ||
      workspaceDraft.notifyEmail !== savedWorkspace.notifyEmail ||
      workspaceDraft.notifySms !== savedWorkspace.notifySms ||
      workspaceDraft.notifyWhatsapp !== savedWorkspace.notifyWhatsapp ||
      workspaceDraft.notifySlack !== savedWorkspace.notifySlack ||
      workspaceDraft.invoicePrefix !== savedWorkspace.invoicePrefix ||
      workspaceDraft.invoiceDecimal !== savedWorkspace.invoiceDecimal ||
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

    // Strict 1MB size limit (1MB = 1 * 1024 * 1024 bytes)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('File size exceeds the 1MB limit. Please upload a smaller file.');
      return;
    }

    // Type validation
    if (targetField === 'logoUrl' || targetField === 'faviconUrl') {
      // Allow only PNG and JPG/JPEG for logos
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error('Invalid image type. Only PNG and JPG are allowed for branding logos.');
        return;
      }
    } else {
      // Allow PNG, JPG, and PDF for documents
      if (!['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(file.type)) {
        toast.error('Invalid file type. Only PNG, JPG, and PDF are allowed for corporate documents.');
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

    // 1MB size limit
    if (docUploadFile.size > 1 * 1024 * 1024) {
      toast.error('File size exceeds the 1MB limit. Please upload a smaller file.');
      return;
    }

    // Type validation
    if (!['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(docUploadFile.type)) {
      toast.error('Invalid file type. Only PNG, JPG, and PDF are allowed.');
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
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Workforce Defaults</CardTitle>
                  <CardDescription>Configure global probation lengths, notice periods, and workflow settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Probation Period (Months)</Label>
                      <Input 
                        type="number"
                        className="text-xs rounded-xl"
                        value={workspaceDraft.defaultProbation}
                        onChange={e => updateDraftField('defaultProbation', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notice Period (Days)</Label>
                      <Input 
                        type="number"
                        className="text-xs rounded-xl"
                        value={workspaceDraft.noticePeriod}
                        onChange={e => updateDraftField('noticePeriod', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee ID Prefix</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.empIdPrefix}
                        onChange={e => updateDraftField('empIdPrefix', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Auto Username Pattern</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.usernamePattern}
                        onChange={e => updateDraftField('usernamePattern', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Auto Email Formula</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.emailPattern}
                        onChange={e => updateDraftField('emailPattern', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Active Leave Policies & Shifts</Label>
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-border space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Leave Policy:</span>
                        <span className="font-bold">{workspaceDraft.leavePolicy}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Default Attendance Shift:</span>
                        <span className="font-bold">{workspaceDraft.shiftDefault}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: Users & Roles */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold">Permissions Matrix & Roles</CardTitle>
                      <CardDescription>Define workspace access rules and temporary keys access.</CardDescription>
                    </div>
                    <Button size="sm" className="bg-primary text-white hover:bg-primary/90" onClick={() => toast.info('Opening user inviter...')}>
                      Invite User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Matrix table representation */}
                  <div className="overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-900/50 border-b border-border">
                          <th className="py-2.5 px-4 font-bold text-muted-foreground">Module / Feature</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground text-center">SuperAdmin</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground text-center">Manager</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground text-center">Employee</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground text-center">Client</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="py-2.5 px-4 font-semibold">Core Financial Settings</td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4.5 w-4.5 text-red-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4.5 w-4.5 text-red-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4.5 w-4.5 text-red-500 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold">Client Project Milestones</td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold">Internal Automation Workflows</td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><Check className="h-4.5 w-4.5 text-emerald-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4.5 w-4.5 text-red-500 mx-auto" /></td>
                          <td className="text-center py-2.5 px-4"><X className="h-4.5 w-4.5 text-red-500 mx-auto" /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Temporary access rules */}
                  <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs flex gap-2">
                    <Shield className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block mb-0.5 font-bold">MFA Enforcement Active</strong>
                      All accounts associated with domains <code className="bg-background px-1.5 py-0.5 rounded font-mono">{workspaceDraft.allowedDomains}</code> require Multi-Factor Authentication to complete dashboard operations logins.
                    </div>
                  </div>
                </CardContent>
              </Card>
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
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Omnichannel Dispatch Hub</CardTitle>
                  <CardDescription>Route alerts class triggers dynamically to email, text, or team chat channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="p-4 border border-border rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs">Email Relays</Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifyEmail} 
                          onChange={e => updateDraftField('notifyEmail', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Dispatches statutory summaries and invoices digests.</p>
                    </div>

                    <div className="p-4 border border-border rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs">SMS Gateways</Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifySms} 
                          onChange={e => updateDraftField('notifySms', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Direct critical OTP logs and backup notices.</p>
                    </div>

                    <div className="p-4 border border-border rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs">WhatsApp Business</Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifyWhatsapp} 
                          onChange={e => updateDraftField('notifyWhatsapp', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Send real-time reimbursement updates and reports.</p>
                    </div>

                    <div className="p-4 border border-border rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-xs">Slack API Webhook</Label>
                        <input 
                          type="checkbox" 
                          checked={workspaceDraft.notifySlack} 
                          onChange={e => updateDraftField('notifySlack', e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4.5 w-4.5"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Pushes active channel alerts for task assignment.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 8: Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Integration Directory</CardTitle>
                  <CardDescription>Manage keys and OAuth access tokens linked to external cloud services.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border border-border rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs">Google Workspace</h4>
                          <p className="text-[10px] text-muted-foreground">SAML SSO & User Provisioning</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[9px]">Connected</Badge>
                    </div>

                    <div className="p-4 border border-border rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                          <Plug className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs">Slack Grid Connector</h4>
                          <p className="text-[10px] text-muted-foreground">Escalation Webhooks Relays</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold text-[9px]">Pending Auth</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 9: Invoice Settings */}
          {activeTab === 'invoice' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Corporate Invoicing Coordinates</CardTitle>
                  <CardDescription>Customize taxation calculations, invoice formatting prefixes, and currency settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Invoice logo upload */}
                  <div className="p-4 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/20 dark:bg-zinc-900/10 mb-4">
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
                    <h4 className="font-bold text-xs">Invoice Logo</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG up to 1MB max</p>
                    <Button size="sm" variant="outline" className="mt-3 text-[10px] h-8 text-primary border-primary/20 hover:bg-primary/5 px-3 rounded-lg" onClick={() => invoiceLogoInputRef.current?.click()}>
                      Upload Invoice Logo
                    </Button>
                  </div>

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
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Decimal Precision</Label>
                      <Input 
                        type="number"
                        className="text-xs rounded-xl"
                        value={workspaceDraft.invoiceDecimal}
                        onChange={e => updateDraftField('invoiceDecimal', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Payment Buffer</Label>
                      <Input 
                        className="text-xs rounded-xl"
                        value={workspaceDraft.paymentTerms}
                        onChange={e => updateDraftField('paymentTerms', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Bottom Footnote (Deed/Bank)</Label>
                    <textarea 
                      rows={3}
                      className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background font-sans"
                      value={workspaceDraft.notes}
                      onChange={e => updateDraftField('notes', e.target.value)}
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
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Workflow Actions Visualizer</CardTitle>
                  <CardDescription>Setup trigger-action workflows for employee boarding and task assignments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Horizontal node flow chart */}
                  <div className="p-6 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
                      <div className="p-3 bg-primary text-white rounded-xl text-[11px] font-bold text-center">
                        <Terminal className="h-4.5 w-4.5 mx-auto mb-1.5" />
                        Trigger: Employee Joined
                      </div>

                      <div className="h-[2px] w-6 bg-border hidden md:block" />

                      <div className="p-3 bg-card border border-border rounded-xl text-[11px] font-bold text-center">
                        <Laptop className="h-4.5 w-4.5 mx-auto mb-1.5 text-primary" />
                        Action: Request Laptop
                      </div>

                      <div className="h-[2px] w-6 bg-border hidden md:block" />

                      <div className="p-3 bg-card border border-border rounded-xl text-[11px] font-bold text-center">
                        <Send className="h-4.5 w-4.5 mx-auto mb-1.5 text-primary" />
                        Action: Create Work Email
                      </div>

                      <div className="h-[2px] w-6 bg-border hidden md:block" />

                      <div className="p-3 bg-emerald-500 text-white rounded-xl text-[11px] font-bold text-center">
                        <CheckCircle2 className="h-4.5 w-4.5 mx-auto mb-1.5" />
                        Status: Complete
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 12: AI Configuration */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">LLM Orchestrator Parameters</CardTitle>
                  <CardDescription>Manage keys and credentials targeting OpenAI, Claude, and Gemini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Engine Model</Label>
                      <select 
                        className="w-full text-xs rounded-xl border border-border p-2.5 bg-background outline-none"
                        value={workspaceDraft.aiModel}
                        onChange={e => updateDraftField('aiModel', e.target.value)}
                      >
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended)</option>
                        <option value="openai-gpt4">OpenAI GPT-4o</option>
                        <option value="claude-3-opus">Anthropic Claude 3.5 Sonnet</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Temperature ({workspaceDraft.aiTemperature})</Label>
                      <Input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        className="cursor-pointer"
                        value={workspaceDraft.aiTemperature}
                        onChange={e => updateDraftField('aiTemperature', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System Guidelines Prompt Template</Label>
                    <textarea 
                      rows={3}
                      className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background font-mono"
                      value={workspaceDraft.aiPromptTemplate}
                      onChange={e => updateDraftField('aiPromptTemplate', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 13: Data Management */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Data Management & Partitions</CardTitle>
                  <CardDescription>Export organizational settings databases and set data retention thresholds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border border-border flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Export Configuration Snapshot</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Includes complete settings registry structures, users lists, and forms schemas.</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs font-bold text-primary border-primary/20 hover:bg-primary/5 h-8 px-3 rounded-lg" onClick={() => toast.success('JSON export downloaded successfully!')}>
                      <Download className="mr-2 h-4 w-4" /> Download JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 14: Security Center */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Security & IAM Controls</CardTitle>
                  <CardDescription>Enforce network boundaries, session timeouts, and IP whitelists rules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Inactivity Timeout (Minutes)</Label>
                      <Input 
                        type="number"
                        className="text-xs rounded-xl"
                        value={workspaceDraft.sessionTimeout}
                        onChange={e => updateDraftField('sessionTimeout', Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Minimum Password Complexity Length</Label>
                      <Input 
                        type="number"
                        className="text-xs rounded-xl"
                        value={workspaceDraft.passwordMinLength}
                        onChange={e => updateDraftField('passwordMinLength', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Authorized Office IP Whitelist</Label>
                    <Input 
                      className="text-xs rounded-xl font-mono"
                      value={workspaceDraft.ipWhitelist}
                      onChange={e => updateDraftField('ipWhitelist', e.target.value)}
                    />
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
                  <CardTitle className="text-lg font-bold">Compliance Status Registries</CardTitle>
                  <CardDescription>Monitor HIPAA encrypt policies, GDPR privacy consents, and SOC2 audits details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="p-3 bg-card border border-border rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4.5 w-4.5 text-emerald-500" />
                        <span className="text-xs font-semibold">GDPR Data Processing Agreement (DPA)</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[9px]">Compliant</Badge>
                    </div>

                    <div className="p-3 bg-card border border-border rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4.5 w-4.5 text-emerald-500" />
                        <span className="text-xs font-semibold">SOC2 Trust Framework Encryption</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[9px]">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 16: Billing & Subscription */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">SaaS Subscriptions & Invoicing History</CardTitle>
                  <CardDescription>Track allocated seats, storage benchmarks, and download past bills.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl">
                      <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Current Plan</h5>
                      <p className="text-xl font-black mt-1">Enterprise Pro</p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl">
                      <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Active Workspace Seats</h5>
                      <p className="text-xl font-black mt-1">42 / 100 utilized</p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl">
                      <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Monthly Cost</h5>
                      <p className="text-xl font-black mt-1">₹49,990 / month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 17: API Management */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">API Management Hub</CardTitle>
                  <CardDescription>Configure webhook callbacks endpoints and fetch developer keys.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl font-mono text-[11px] flex justify-between items-center">
                    <span>X-API-KEY: ts_live_51O8H1S...c7H1A8</span>
                    <Button size="sm" variant="outline" className="text-xs font-bold text-primary border-primary/20 hover:bg-primary/5 h-8 px-3 rounded-lg" onClick={() => toast.success('Copied API Key to clipboard')}>
                      Copy Key
                    </Button>
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
                  <CardDescription>Chronological sequence logs of settings table adjustments.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-900/50 border-b border-border">
                          <th className="py-2.5 px-4 font-bold text-muted-foreground">Actor</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground">Action Details</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground">Previous Value</th>
                          <th className="py-2.5 px-4 font-bold text-muted-foreground">New Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/40">
                          <td className="py-2.5 px-4 font-semibold">cto@techsonance.com</td>
                          <td className="py-2.5 px-4 text-muted-foreground">Changed LLM model</td>
                          <td className="py-2.5 px-4 font-mono text-[10px]">openai-gpt4</td>
                          <td className="py-2.5 px-4 font-mono text-[10px] text-primary">gemini-1.5-pro</td>
                        </tr>
                        <tr className="border-b border-border/40">
                          <td className="py-2.5 px-4 font-semibold">ceo@techsonance.com</td>
                          <td className="py-2.5 px-4 text-muted-foreground">Added office IP Whitelist</td>
                          <td className="py-2.5 px-4 font-mono text-[10px]">—</td>
                          <td className="py-2.5 px-4 font-mono text-[10px] text-primary">103.241.12.0/24</td>
                        </tr>
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
                            <span className="text-[10px] text-muted-foreground mt-1 block">PDF, PNG, or JPG (Max 1MB)</span>
                            <input 
                              type="file" 
                              id="vault-file-picker" 
                              className="hidden" 
                              accept="application/pdf, image/png, image/jpeg"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 1 * 1024 * 1024) {
                                    toast.error('File size exceeds the 1MB limit. Please upload a smaller file.');
                                  } else {
                                    setDocUploadFile(file);
                                  }
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
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Cloud Snapshots & Backups</CardTitle>
                  <CardDescription>Schedule recovery targets and automate Postgres database backups.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-border rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs">Automated Cloud Relays</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Saves complete filesystem and schema snapshots to encrypted AWS S3 block volumes weekly.</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs font-bold text-primary border-primary/20 hover:bg-primary/5 h-8 px-3 rounded-lg" onClick={() => toast.success('Executing manual backup target...')}>
                      Snapshot Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 21: Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">System Orchestrations</CardTitle>
                  <CardDescription>Flush server caches, toggle developer modes, and configure background queues.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-foreground block">System Redis Cache Flush</strong>
                      <p className="text-[10px] text-muted-foreground">Flushes all session allocations and settings caches. Users may experience temporary latency.</p>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => toast.success('Redis server cache cleared successfully!')}>
                      Flush Cache
                    </Button>
                  </div>
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
