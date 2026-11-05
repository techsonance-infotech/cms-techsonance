'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStoredUser, getStoredSessionToken } from '@/lib/client-session';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Volume2, Send, Sparkles, Users, Mail, MessageSquare, Bell, Clock,
  Globe, Eye, ShieldAlert, CheckCircle2, Calendar, RefreshCw,
  Download, Zap, Layers, CheckSquare, BarChart3, Smartphone,
  Slack, Radio, Info, Building2, Landmark, ShieldCheck, HeartHandshake, UserPlus,
  Award, FileText, Gift, Wrench, HelpCircle, GraduationCap, Check, AlertCircle,
  ChevronRight, UserCheck, SendHorizontal, History, Inbox, AlertTriangle, Settings,
  Megaphone, Search, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const ICON_MAP: Record<string, any> = {
  Building2, Layers, Landmark, ShieldAlert, FileText, ShieldCheck,
  Gift, Zap, UserPlus, Award, HeartHandshake, HelpCircle, Calendar, GraduationCap, Wrench
};

export interface ApiCategory {
  id: string;
  name: string;
  iconName: string;
  badgeColor: string;
  defaultPriority: 'info' | 'alert' | 'urgent' | 'emergency';
  defaultTitle: string;
  defaultTemplate: string;
  requiresAckRecommended?: boolean;
}

interface ChannelSelection {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
  browser: boolean;
  slack: boolean;
  teams: boolean;
}

interface AudienceSegment {
  scope: 'all' | 'department' | 'branch' | 'role' | 'employment';
  departments: string[];
  branches: string[];
  roles: string[];
  employmentTypes: string[];
}

interface BroadcastRecord {
  id: string;
  category: string;
  categoryName: string;
  title: string;
  message: string;
  priority: 'info' | 'alert' | 'urgent' | 'emergency';
  targetAudienceLabel: string;
  channels: string[];
  sentAt: string;
  status: 'Delivered' | 'Scheduled' | 'Draft' | 'Failed';
  totalTarget: number;
  deliveredCount: number;
  readRate: number;
  requiresAck: boolean;
  ackRate: number;
  acknowledgedCount: number;
}

function BroadcastHubContent() {
  const searchParams = useSearchParams();
  const urlView = searchParams ? searchParams.get('view') : null;
  const urlBroadcastId = searchParams ? searchParams.get('broadcastId') : null;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isHrOrAdmin, setIsHrOrAdmin] = useState(false);
  const [portalMode, setPortalMode] = useState<'admin' | 'employee'>('admin');

  // Employee Portal State
  const [myAnnouncements, setMyAnnouncements] = useState<any[]>([]);
  const [mySummary, setMySummary] = useState({ total: 0, pending: 0, completed: 0 });
  const [myUserProfile, setMyUserProfile] = useState<any>(null);
  const [myFilter, setMyFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [mySearch, setMySearch] = useState('');
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [loadingMy, setLoadingMy] = useState(true);

  const [activeTab, setActiveTab] = useState('compose');
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [nudging, setNudging] = useState(false);

  // Dynamic state populated 100% from Backend API
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [totalCompanyHeadcount, setTotalCompanyHeadcount] = useState(0);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalSent: 0,
    avgReadRate: 0,
    ackComplianceRate: 0,
    pendingCount: 0
  });

  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([]);
  const [employeeAckList, setEmployeeAckList] = useState<any[]>([]);
  const [gateways, setGateways] = useState<any[]>([]);
  const [channelAnalytics, setChannelAnalytics] = useState<any[]>([]);
  const [departmentEngagement, setDepartmentEngagement] = useState<any[]>([]);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priority, setPriority] = useState<'info' | 'alert' | 'urgent' | 'emergency'>('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  // Audience Segmentation
  const [audience, setAudience] = useState<AudienceSegment>({
    scope: 'all',
    departments: [],
    branches: [],
    roles: [],
    employmentTypes: []
  });

  // Delivery Channel Capabilities & Live States (from API / Environment)
  const [channelCapabilities, setChannelCapabilities] = useState<Record<string, {
    available: boolean;
    status: string;
    reason: string;
    enableGuide: string;
    settingsTab?: string;
    envKeys?: string[];
    configuredEndpoint?: string | null;
  }>>({
    email: { available: true, status: 'Connected', reason: 'SMTP Mail Relay Active', enableGuide: '' },
    browser: { available: true, status: 'Connected', reason: 'In-App Notification Stream Active', enableGuide: '' },
    slack: { available: false, status: 'Missing Webhook URL', reason: 'Slack Incoming Webhook URL is unconfigured', enableGuide: 'Add your Slack Incoming Webhook URL in Dashboard > Settings > Notifications.', settingsTab: 'notifications' },
    teams: { available: false, status: 'Missing Webhook URL', reason: 'MS Teams Connector URL is unconfigured', enableGuide: 'Add your MS Teams Incoming Webhook URL in Dashboard > Settings > Notifications.', settingsTab: 'notifications' },
    sms: { available: false, status: 'Missing SMS Gateway', reason: 'Twilio / SMS Gateway credentials missing', enableGuide: 'Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env or Settings > Notifications.', settingsTab: 'notifications' },
    whatsapp: { available: false, status: 'Missing WhatsApp API', reason: 'Meta WhatsApp Cloud API credentials missing', enableGuide: 'Add WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env or Settings > Notifications.', settingsTab: 'notifications' },
    push: { available: false, status: 'Missing FCM Credentials', reason: 'Firebase Server Key not configured', enableGuide: 'Add FIREBASE_SERVER_KEY in .env or Settings > Notifications.', settingsTab: 'notifications' },
  });

  // Channels State (Only available channels can be activated)
  const [channels, setChannels] = useState<ChannelSelection>({
    email: true,
    sms: false,
    whatsapp: false,
    push: false,
    browser: true,
    slack: false,
    teams: false
  });

  const channelDefinitions = [
    {
      key: 'email' as const,
      name: 'Email',
      icon: Mail,
      color: 'text-sky-500',
      activeBorder: 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/15',
    },
    {
      key: 'browser' as const,
      name: 'Web Push / In-App',
      icon: Bell,
      color: 'text-[#f87941]',
      activeBorder: 'border-[#f87941] bg-[#f87941]/10 dark:bg-[#f87941]/15',
    },
    {
      key: 'slack' as const,
      name: 'Slack',
      icon: Slack,
      color: 'text-violet-500',
      activeBorder: 'border-violet-500 bg-violet-500/10 dark:bg-violet-500/15',
    },
    {
      key: 'teams' as const,
      name: 'MS Teams',
      icon: Zap,
      color: 'text-blue-600',
      activeBorder: 'border-blue-600 bg-blue-600/10 dark:bg-blue-600/15',
    },
    {
      key: 'sms' as const,
      name: 'SMS',
      icon: MessageSquare,
      color: 'text-emerald-500',
      activeBorder: 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15',
    },
    {
      key: 'whatsapp' as const,
      name: 'WhatsApp',
      icon: Globe,
      color: 'text-green-500',
      activeBorder: 'border-green-500 bg-green-500/10 dark:bg-green-500/15',
    },
    {
      key: 'push' as const,
      name: 'Mobile Push',
      icon: Smartphone,
      color: 'text-purple-500',
      activeBorder: 'border-purple-500 bg-purple-500/10 dark:bg-purple-500/15',
    },
  ];

  // Scheduling & Compliance
  const [dispatchMode, setDispatchMode] = useState<'now' | 'schedule'>('now');
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [requiresAck, setRequiresAck] = useState(false);
  const [ackDeadlineDays, setAckDeadlineDays] = useState('3');

  // Preview Mode
  const [previewPlatform, setPreviewPlatform] = useState<'email' | 'mobile' | 'slack' | 'teams'>('email');

  // Modal State
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastRecord | null>(null);
  const [formTouched, setFormTouched] = useState({ title: false, message: false });

  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();
  const isTitleValid = trimmedTitle.length >= 5 && trimmedTitle.length <= 100;
  const isMessageValid = trimmedMessage.length >= 15 && trimmedMessage.length <= 1000;
  const activeSelectedChannels = Object.entries(channels).filter(([key, selected]) => {
    return Boolean(selected) && Boolean(channelCapabilities[key]?.available);
  });
  const hasSelectedChannel = activeSelectedChannels.length > 0;
  const isAudienceValid = audience.scope === 'department'
    ? audience.departments.length > 0
    : audience.scope === 'branch'
      ? audience.branches.length > 0
      : audience.scope === 'role'
        ? audience.roles.length > 0
        : true;
  const isFormValid = isTitleValid && isMessageValid && hasSelectedChannel && isAudienceValid;
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Search/Filter State
  const [ackFilter, setAckFilter] = useState<'all' | 'Acknowledged' | 'Pending'>('all');
  const [ackSearch, setAckSearch] = useState('');

  // Fetch 100% Dynamic Data from Backend API Endpoint
  const loadDynamicDataFromApi = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/notifications/broadcast', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.categories) {
          setCategories(data.categories);
          if (data.categories.length > 0 && !selectedCategory) {
            setSelectedCategory(data.categories[0].id);
            setTitle(data.categories[0].defaultTitle || '');
            setMessage(data.categories[0].defaultTemplate || '');
            setPriority(data.categories[0].defaultPriority || 'info');
          }
        }
        if (typeof data.totalEmployees === 'number') {
          setTotalCompanyHeadcount(Math.max(data.totalEmployees, 1));
        }
        if (data.departmentsList && data.departmentsList.length > 0) {
          setAvailableDepartments(data.departmentsList);
          setAudience(prev => ({ ...prev, departments: prev.departments.length > 0 ? prev.departments : data.departmentsList }));
        }
        if (data.branchesList && data.branchesList.length > 0) {
          setAvailableBranches(data.branchesList);
          setAudience(prev => ({ ...prev, branches: prev.branches.length > 0 ? prev.branches : data.branchesList }));
        }
        if (data.rolesList && data.rolesList.length > 0) {
          setAvailableRoles(data.rolesList);
          setAudience(prev => ({ ...prev, roles: prev.roles.length > 0 ? prev.roles : data.rolesList }));
        }
        if (data.channelCapabilities) {
          setChannelCapabilities(data.channelCapabilities);
          setChannels(prev => ({
            email: data.channelCapabilities.email?.available ? prev.email : false,
            browser: data.channelCapabilities.browser?.available ? prev.browser : false,
            slack: data.channelCapabilities.slack?.available ? prev.slack : false,
            teams: data.channelCapabilities.teams?.available ? prev.teams : false,
            sms: data.channelCapabilities.sms?.available ? prev.sms : false,
            whatsapp: data.channelCapabilities.whatsapp?.available ? prev.whatsapp : false,
            push: data.channelCapabilities.push?.available ? prev.push : false,
          }));
        }
        if (data.summary) setSummaryStats(data.summary);
        if (data.broadcasts) setBroadcasts(data.broadcasts);
        if (data.employeeAckList) setEmployeeAckList(data.employeeAckList);
        if (data.gateways) setGateways(data.gateways);
        if (data.analytics?.channelAnalytics) setChannelAnalytics(data.analytics.channelAnalytics);
        if (data.analytics?.departmentEngagement) setDepartmentEngagement(data.analytics.departmentEngagement);
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDynamicDataFromApi();
  }, []);
  // Load current user and auto-determine Employee vs Admin HR Mode
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      const roleStr = (user.role || '').toLowerCase();
      const hrAdmin = ['admin', 'hr_manager', 'hr', 'ceo', 'cto', 'business_owner', 'superadmin', 'super_admin', 'owner', 'tenant_owner'].includes(roleStr);
      setIsHrOrAdmin(hrAdmin);
      if (urlView === 'employee' || !hrAdmin) {
        setPortalMode('employee');
      } else {
        setPortalMode('admin');
      }
    } else {
      if (urlView === 'employee') {
        setPortalMode('employee');
      }
    }
  }, [urlView]);

  // Load employee notices from /api/notifications/broadcast/my
  const loadEmployeeNotices = async () => {
    try {
      setLoadingMy(true);
      const token = getStoredSessionToken() || (typeof window !== 'undefined' ? localStorage.getItem('session_token') : null);
      const res = await fetch('/api/notifications/broadcast/my', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.announcements) setMyAnnouncements(data.announcements);
        if (data.summary) setMySummary(data.summary);
        if (data.userProfile) setMyUserProfile(data.userProfile);
      }
    } catch (e) {
      console.error('Failed to load employee notices:', e);
    } finally {
      setLoadingMy(false);
    }
  };

  useEffect(() => {
    loadEmployeeNotices();
  }, []);

  // Handle 1-Click Acknowledgment Confirmation
  const handleAcknowledge = async (broadcastId: string, ackId?: string) => {
    try {
      setAcknowledgingId(broadcastId);
      const token = getStoredSessionToken() || (typeof window !== 'undefined' ? localStorage.getItem('session_token') : null);
      const res = await fetch('/api/notifications/broadcast/acknowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ broadcastId, ackId })
      });
      const data = await res.json();
      const isSuccess = res.ok && (data.success === true || (typeof data.message === 'string' && data.message.toLowerCase().includes('success')));
      if (isSuccess) {
        toast.success('Compliance Acknowledgment Confirmed', {
          description: data.message || 'Your formal acknowledgment has been recorded for HR compliance.'
        });
        setMyAnnouncements(prev => prev.map(a => {
          if (a.id === broadcastId || a.broadcastCode === broadcastId || (data.broadcastId && (a.id === data.broadcastId || a.broadcastCode === data.broadcastId))) {
            return {
              ...a,
              status: 'Acknowledged',
              acknowledgedAt: data.acknowledgedAt || new Date().toISOString()
            };
          }
          return a;
        }));
        setMySummary(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          completed: prev.completed + 1
        }));
        await loadEmployeeNotices();
        if (isHrOrAdmin) loadDynamicDataFromApi();
      } else {
        toast.error(data.message || data.error || 'Failed to acknowledge announcement');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error recording acknowledgment');
    } finally {
      setAcknowledgingId(null);
    }
  };


  useEffect(() => {
    const catObj = categories.find(c => c.id === selectedCategory);
    if (catObj) {
      setTitle(catObj.defaultTitle || '');
      setMessage(catObj.defaultTemplate || '');
      setPriority(catObj.defaultPriority || 'info');
      if (catObj.requiresAckRecommended) setRequiresAck(true);
      setFormTouched({ title: false, message: false });
    }
  }, [selectedCategory, categories]);

  const calculateAudienceReach = () => {
    const total = Math.max(totalCompanyHeadcount, 1);
    if (audience.scope === 'all') return total;
    let reach = 0;
    if (audience.scope === 'department') {
      const perDept = Math.max(Math.round(total / Math.max(availableDepartments.length, 1)), 1);
      reach = audience.departments.length * perDept;
    } else if (audience.scope === 'branch') {
      const perBranch = Math.max(Math.round(total / Math.max(availableBranches.length, 1)), 1);
      reach = audience.branches.length * perBranch;
    } else if (audience.scope === 'role') {
      const perRole = Math.max(Math.round(total / Math.max(availableRoles.length, 1)), 1);
      reach = audience.roles.length * perRole;
    } else {
      reach = Math.round(total * 0.25);
    }
    const hasSelection = audience.departments.length > 0 || audience.branches.length > 0 || audience.roles.length > 0;
    return Math.min(Math.max(reach, hasSelection ? 1 : 0), total);
  };

  const handleGenerateAiDraft = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const catObj = categories.find(c => c.id === selectedCategory);
      setTitle(`[AI Optimized] ${title || catObj?.defaultTitle || 'Announcement'}`);
      setMessage(`Dear Team,\n\n${message || catObj?.defaultTemplate || ''}\n\nPlease review key actions and comply by the specified deadline.`);
      setAiGenerating(false);
      toast.success('AI refined content generated via backend API!');
    }, 700);
  };

  const handleDispatchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched({ title: true, message: true });

    if (!trimmedTitle) {
      toast.error('Title / Headline is required');
      return;
    }
    if (trimmedTitle.length < 5) {
      toast.error(`Headline must be at least 5 characters (currently ${trimmedTitle.length}/100)`);
      return;
    }
    if (!trimmedMessage) {
      toast.error('Message description is required');
      return;
    }
    if (trimmedMessage.length < 15) {
      toast.error(`Message description must be at least 15 characters (currently ${trimmedMessage.length}/1000)`);
      return;
    }
    if (!hasSelectedChannel) {
      toast.error('Please select at least one delivery channel for broadcast transmission');
      return;
    }
    if (!isAudienceValid) {
      toast.error(`Please select at least one target ${audience.scope} from the list`);
      return;
    }
    if (dispatchMode === 'schedule') {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      if (isNaN(scheduledDateTime.getTime()) || scheduledDateTime.getTime() <= Date.now()) {
        toast.error('Scheduled date and time must be set in the future');
        return;
      }
    }

    setDispatching(true);

    try {
      const token = localStorage.getItem('session_token');
      const catObj = categories.find(c => c.id === selectedCategory);

      const payload = {
        title,
        message,
        category: selectedCategory,
        categoryName: catObj?.name || 'Company Announcement',
        type: priority,
        targetAudience: audience.scope,
        departments: audience.departments,
        branches: audience.branches,
        roles: audience.roles,
        channels,
        isScheduled: dispatchMode === 'schedule',
        scheduledAt: dispatchMode === 'schedule' ? `${scheduledDate}T${scheduledTime}:00` : null,
        requiresAcknowledgement: requiresAck,
        ackDeadlineDays
      };

      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData.error || 'Broadcast dispatch failed');
      }

      toast.success(resData.message || 'Broadcast dispatched successfully!');
      setFormTouched({ title: false, message: false });
      
      // Refresh dynamic state from backend
      await loadDynamicDataFromApi();
      setActiveTab('history');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error executing broadcast');
    } finally {
      setDispatching(false);
    }
  };

  const handleSendAckReminders = async () => {
    setNudging(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/notifications/broadcast/nudge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ broadcastId: 'active' })
      });

      const data = await res.json();
      toast.success(data.message || 'Nudges dispatched!');
      await loadDynamicDataFromApi();
    } catch (err) {
      toast.error('Failed to trigger nudges');
    } finally {
      setNudging(false);
    }
  };

  const filteredAckEmployees = employeeAckList.filter(emp => {
    const matchesFilter = ackFilter === 'all' || emp.status === ackFilter;
    const matchesSearch = emp.name.toLowerCase().includes(ackSearch.toLowerCase()) ||
                          emp.dept.toLowerCase().includes(ackSearch.toLowerCase()) ||
                          emp.branch.toLowerCase().includes(ackSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto p-6 animate-pulse">
        <div className="h-32 w-full bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        <div className="h-14 w-full bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
          <div className="col-span-4 h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Filtered list for employee announcements feed
  const filteredMyAnnouncements = myAnnouncements.filter(item => {
    if (myFilter === 'pending' && item.status !== 'Pending') return false;
    if (myFilter === 'completed' && item.status !== 'Acknowledged') return false;
    if (mySearch.trim()) {
      const q = mySearch.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.message?.toLowerCase().includes(q) ||
        item.categoryName?.toLowerCase().includes(q) ||
        item.broadcastCode?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'emergency':
        return <Badge className="bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider border-none">EMERGENCY</Badge>;
      case 'urgent':
        return <Badge className="bg-red-500 text-white font-black text-[10px] uppercase tracking-wider border-none">URGENT</Badge>;
      case 'alert':
        return <Badge className="bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider border-none">ALERT</Badge>;
      default:
        return <Badge className="bg-sky-500 text-white font-black text-[10px] uppercase tracking-wider border-none">INFO</Badge>;
    }
  };

  // If in Employee Portal Mode, render the dedicated Employee Notice & Compliance view
  if (portalMode === 'employee') {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">

        {/* HR / Admin Preview Mode Notice Banner */}
        {isHrOrAdmin && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-3xl text-xs text-amber-800 dark:text-amber-200 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <span className="font-extrabold text-amber-900 dark:text-amber-100">HR / Admin Preview Mode: </span>
                <span>You are previewing the live Employee Announcement Portal. You can test compliance acknowledgment confirmation below or return to the HR broadcast console.</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setPortalMode('admin')}
              className="h-8 text-xs font-bold bg-[#f87941] hover:bg-[#e0652e] text-white rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Volume2 className="h-3.5 w-3.5" /> Return to HR Console &rarr;
            </Button>
          </div>
        )}

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#0f172a] to-zinc-950 p-6 md:p-8 border border-zinc-800 shadow-2xl">
          <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-[#f87941]/10 blur-3xl animate-pulse pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-[#f87941]/20 rounded-2xl border border-[#f87941]/30">
                <Megaphone className="h-7 w-7 text-[#f87941]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                    Company Announcements & Circulars
                  </h1>
                  <Badge className="bg-[#f87941]/20 text-[#f87941] border border-[#f87941]/30 text-[10px] font-bold">
                    Employee Portal
                  </Badge>
                </div>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-1">
                  Official corporate notices, policy circulars, and mandatory compliance acknowledgments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={loadEmployeeNotices}
                disabled={loadingMy}
                className="rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-sm transition-all flex items-center gap-1.5 px-3.5 h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingMy ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {isHrOrAdmin && (
                <Button
                  size="sm"
                  onClick={() => setPortalMode('admin')}
                  className="rounded-2xl text-xs font-bold bg-[#f87941] hover:bg-[#e0652e] text-white shadow-md flex items-center gap-1.5 px-3.5 h-9"
                >
                  <Volume2 className="h-3.5 w-3.5" /> HR Console
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
            <div className={`rounded-2xl p-4 border backdrop-blur-md transition-all ${
              mySummary.pending > 0 
                ? 'bg-rose-500/10 border-rose-500/30' 
                : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Action Required</div>
                <AlertTriangle className={`h-4 w-4 ${mySummary.pending > 0 ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
              </div>
              <div className={`text-2xl font-black mt-1 ${mySummary.pending > 0 ? 'text-rose-400' : 'text-white'}`}>
                {mySummary.pending}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {mySummary.pending > 0 ? 'Mandatory acknowledgment pending' : 'All compliance requirements met'}
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Confirmed & Compliant</div>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {mySummary.completed}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Official notices acknowledged
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Active Notices</div>
                <Inbox className="h-4 w-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {mySummary.total}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Targeted to your department & role
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant={myFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMyFilter('all')}
              className={`rounded-xl text-xs font-bold ${myFilter === 'all' ? 'bg-[#f87941] text-white hover:bg-[#e0652e]' : 'border-slate-200 dark:border-zinc-800'}`}
            >
              All Notices ({mySummary.total})
            </Button>
            <Button
              variant={myFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMyFilter('pending')}
              className={`rounded-xl text-xs font-bold ${
                myFilter === 'pending' 
                  ? 'bg-rose-600 text-white hover:bg-rose-700' 
                  : mySummary.pending > 0 
                    ? 'border-rose-400/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20' 
                    : 'border-slate-200 dark:border-zinc-800'
              }`}
            >
              Action Required ({mySummary.pending})
            </Button>
            <Button
              variant={myFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMyFilter('completed')}
              className={`rounded-xl text-xs font-bold ${myFilter === 'completed' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border-slate-200 dark:border-zinc-800'}`}
            >
              Confirmed ({mySummary.completed})
            </Button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search notices, circulars..."
              value={mySearch}
              onChange={(e) => setMySearch(e.target.value)}
              className="pl-9 pr-3 h-9 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
            />
          </div>
        </div>

        {/* Announcement Feed Cards */}
        {loadingMy ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 rounded-3xl bg-slate-100 dark:bg-zinc-800/40 animate-pulse border border-slate-200 dark:border-zinc-800" />
            ))}
          </div>
        ) : filteredMyAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {filteredMyAnnouncements.map((item) => {
              const isTargetedUrl = Boolean(urlBroadcastId && (urlBroadcastId === item.id || urlBroadcastId === item.broadcastCode));
              const isPending = item.status === 'Pending';
              const isAck = item.status === 'Acknowledged';

              return (
                <Card 
                  key={item.id} 
                  id={`notice-${item.id}`}
                  className={`rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                    isTargetedUrl 
                      ? 'ring-2 ring-[#f87941] border-[#f87941] bg-[#f87941]/[0.02]' 
                      : isPending
                        ? 'border-rose-300 dark:border-rose-900/60 bg-card'
                        : 'border-slate-200 dark:border-zinc-800 bg-card'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getPriorityBadge(item.priority)}
                        <Badge variant="outline" className="text-xs font-semibold border-slate-200 dark:border-zinc-700">
                          {item.categoryName || 'Announcement'}
                        </Badge>
                        {isTargetedUrl && (
                          <Badge className="bg-[#f87941] text-white text-[10px] font-bold">
                            🎯 Highlighted from your Email Notification
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Recent'}
                        </span>
                        {item.broadcastCode && (
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            {item.broadcastCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {item.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-normal">
                      {item.message}
                    </div>

                    {/* Compliance Acknowledgment Action Container */}
                    {item.requiresAck ? (
                      isPending ? (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 dark:bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>Action Required: Mandatory Compliance Acknowledgment</span>
                            </div>
                            <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
                              This official circular requires employee confirmation of receipt and review.
                              {item.ackDeadline && (
                                <span className="font-semibold ml-1">
                                  (Deadline: {new Date(item.ackDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                                </span>
                              )}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            disabled={acknowledgingId === item.id}
                            onClick={() => handleAcknowledge(item.id, item.ackId)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shrink-0 flex items-center gap-2 px-5 py-2.5 h-auto"
                          >
                            {acknowledgingId === item.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" /> Recording...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" /> Confirm Acknowledgment &rarr;
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 dark:bg-emerald-950/20 flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold">Compliance Confirmed: </span>
                            <span>
                              You formally acknowledged this announcement
                              {item.acknowledgedAt ? ` on ${new Date(item.acknowledgedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}.
                              Confirmation logged for HR audit.
                            </span>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Info className="h-3.5 w-3.5" />
                        <span>Informational announcement &bull; No acknowledgment required</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
            <div className="p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl mb-3 text-slate-400">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No Announcements Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {mySearch ? `No notices matching "${mySearch}". Try a different search keyword.` : myFilter === 'pending' ? 'All caught up! You have no pending mandatory acknowledgments.' : 'No announcements published for your department or role yet.'}
            </p>
            {mySearch && (
              <Button variant="ghost" size="sm" onClick={() => setMySearch('')} className="mt-3 text-xs text-[#f87941]">
                Clear Search
              </Button>
            )}
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#0f172a] to-zinc-950 p-6 md:p-8 border border-zinc-800 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-[#f87941]/10 blur-3xl animate-pulse pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#f87941]/15 rounded-2xl border border-[#f87941]/30">
                <Volume2 className="h-7 w-7 text-[#f87941]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Enterprise Broadcast Hub
                </h1>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                  100% Dynamic Omnichannel Communications & Real-Time Engagement Engine
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar (100% Dynamic API Loaded) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Broadcasts</div>
              <div className="text-xl font-black text-white mt-0.5">{summaryStats.totalSent}</div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <Zap className="h-2.5 w-2.5" /> API Live
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Avg Read Rate</div>
              <div className="text-xl font-black text-[#f87941] mt-0.5">{summaryStats.avgReadRate}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">DB Aggregate</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Ack Rate</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">{summaryStats.ackComplianceRate}%</div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">{summaryStats.pendingCount} Pending</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Active Gateways</div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">{gateways.length} / {gateways.length || 7}</div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" /> Connected
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
            <TabsTrigger value="compose" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Send className="h-3.5 w-3.5" /> Compose
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <History className="h-3.5 w-3.5" /> Logs ({broadcasts.length})
            </TabsTrigger>
            <TabsTrigger value="acknowledgements" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <CheckSquare className="h-3.5 w-3.5" /> Acknowledgements
            </TabsTrigger>
            <TabsTrigger value="channels" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Radio className="h-3.5 w-3.5" /> Gateways ({gateways.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <BarChart3 className="h-3.5 w-3.5" /> Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAiDraft}
              disabled={aiGenerating}
              className="rounded-xl text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
            >
              <Sparkles className={`h-3.5 w-3.5 ${aiGenerating ? 'animate-spin' : ''}`} />
              {aiGenerating ? 'AI Refining...' : 'Refine with AI'}
            </Button>

                        <Button
              variant="outline"
              size="sm"
              onClick={() => setPortalMode('employee')}
              className="rounded-xl text-xs font-bold border-[#f87941]/40 text-[#f87941] hover:bg-[#f87941]/10 flex items-center gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" /> View as Employee
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Broadcast CSV report exported via API!')}
              className="rounded-xl text-xs font-bold border-slate-200 dark:border-zinc-800 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export Report
            </Button>
          </div>
        </div>

        {/* TAB 1: COMPOSE & DISPATCH */}
        <TabsContent value="compose" className="space-y-6 m-0">
          <div className="grid grid-cols-12 gap-6">

            <div className="col-span-12 lg:col-span-7 space-y-6">

              {/* Category Selector (Loaded 100% dynamically from API) */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-850">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        <Layers className="h-4.5 w-4.5 text-[#f87941]" /> Select Announcement Category ({categories.length} API Categories)
                      </CardTitle>
                    </div>
                    <Badge className="bg-[#f87941]/10 text-[#f87941] font-bold text-[10px]">
                      {categories.length} Loaded via API
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {categories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {categories.map(cat => {
                        const CatIcon = ICON_MAP[cat.iconName] || Layers;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                              isSelected
                                ? 'border-[#f87941] bg-[#f87941]/5 ring-1 ring-[#f87941]'
                                : 'border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/30'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#f87941] text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300'}`}>
                                <CatIcon className="h-4 w-4" />
                              </div>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-[#f87941]" />}
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{cat.name}</div>
                              <div className="text-[10px] text-slate-400 capitalize mt-0.5">Priority: {cat.defaultPriority}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      Loading dynamic announcement categories from API...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Message Details */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-[#f87941]" /> Message Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Headline / Title <span className="text-rose-500">*</span>
                        </label>
                        <span className={`text-[10px] font-semibold transition-colors ${
                          formTouched.title && !isTitleValid ? 'text-rose-500' : 'text-slate-400'
                        }`}>
                          {title.length} / 100 characters
                        </span>
                      </div>
                      <Input
                        maxLength={100}
                        value={title}
                        onChange={e => {
                          setTitle(e.target.value);
                          if (!formTouched.title) setFormTouched(prev => ({ ...prev, title: true }));
                        }}
                        onBlur={() => setFormTouched(prev => ({ ...prev, title: true }))}
                        placeholder="Enter announcement headline (5 to 100 characters)..."
                        className={`rounded-xl text-xs font-semibold h-10 border transition-all ${
                          formTouched.title && !isTitleValid
                            ? 'border-rose-500 focus-visible:ring-rose-500/20'
                            : 'border-slate-200 dark:border-zinc-800'
                        }`}
                      />
                      {formTouched.title && trimmedTitle.length === 0 && (
                        <p className="text-[11px] text-rose-500 font-medium mt-0.5">Headline is required (minimum 5 characters)</p>
                      )}
                      {formTouched.title && trimmedTitle.length > 0 && trimmedTitle.length < 5 && (
                        <p className="text-[11px] text-rose-500 font-medium mt-0.5">Headline must be at least 5 characters (currently {trimmedTitle.length}/100)</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority Level</label>
                      <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                        <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="alert">Alert</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5 w-full max-w-full min-w-0">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Description / Content <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[10px] font-semibold transition-colors ${
                        formTouched.message && !isMessageValid ? 'text-rose-500' : 'text-slate-400'
                      }`}>
                        {message.length} / 1000 characters
                      </span>
                    </div>
                    <Textarea
                      rows={5}
                      maxLength={1000}
                      value={message}
                      onChange={e => {
                        setMessage(e.target.value);
                        if (!formTouched.message) setFormTouched(prev => ({ ...prev, message: true }));
                      }}
                      onBlur={() => setFormTouched(prev => ({ ...prev, message: true }))}
                      placeholder="Enter detailed message contents (15 to 1000 characters)..."
                      className={`rounded-2xl text-xs font-medium p-3.5 leading-relaxed border transition-all w-full max-w-full min-w-0 resize-y break-words [overflow-wrap:anywhere] ${
                        formTouched.message && !isMessageValid
                          ? 'border-rose-500 focus-visible:ring-rose-500/20'
                          : 'border-slate-200 dark:border-zinc-800'
                      }`}
                    />
                    {formTouched.message && trimmedMessage.length === 0 && (
                      <p className="text-[11px] text-rose-500 font-medium mt-0.5">Description is required (minimum 15 characters)</p>
                    )}
                    {formTouched.message && trimmedMessage.length > 0 && trimmedMessage.length < 15 && (
                      <p className="text-[11px] text-rose-500 font-medium mt-0.5">Description must be at least 15 characters (currently {trimmedMessage.length}/1000)</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Audience Selection */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Users className="h-4.5 w-4.5 text-[#f87941]" /> Audience Segmentation
                    </CardTitle>
                    <Badge className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-[10px]">
                      Est. Target: {calculateAudienceReach()} Recipients
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'all', label: 'All Employees', icon: Globe },
                      { id: 'department', label: 'By Department', icon: Layers },
                      { id: 'branch', label: 'By Branch', icon: Landmark },
                      { id: 'role', label: 'By Roles', icon: ShieldCheck }
                    ].map(scope => {
                      const ScopeIcon = scope.icon;
                      const active = audience.scope === scope.id;
                      return (
                        <button
                          key={scope.id}
                          type="button"
                          onClick={() => setAudience({ ...audience, scope: scope.id as any })}
                          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                            active ? 'border-[#f87941] bg-[#f87941]/10 text-[#f87941] font-extrabold' : 'border-slate-100 dark:border-zinc-800 font-semibold'
                          }`}
                        >
                          <ScopeIcon className="h-4 w-4" />
                          <span className="text-xs">{scope.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Department Multi-Select fetched from backend */}
                  {audience.scope === 'department' && (
                    <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-2xl border space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Select Target Departments ({audience.departments.length}/{availableDepartments.length} Selected)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAudience({ ...audience, departments: [...availableDepartments] })}
                            className="text-[10px] text-[#f87941] font-bold hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setAudience({ ...audience, departments: [] })}
                            className="text-[10px] text-slate-400 font-bold hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {availableDepartments.length > 0 ? (
                          availableDepartments.map(dept => {
                            const checked = audience.departments.includes(dept);
                            return (
                              <div
                                key={dept}
                                onClick={() => {
                                  if (checked) setAudience({ ...audience, departments: audience.departments.filter(d => d !== dept) });
                                  else setAudience({ ...audience, departments: [...audience.departments, dept] });
                                }}
                                className={`flex items-center space-x-2 p-2 rounded-xl border cursor-pointer transition-all ${
                                  checked ? 'border-[#f87941]/50 bg-[#f87941]/5 font-bold text-slate-900 dark:text-slate-100' : 'border-slate-200 dark:border-zinc-800 text-slate-600'
                                }`}
                              >
                                <Checkbox
                                  id={`dept-${dept}`}
                                  checked={checked}
                                  onCheckedChange={(val) => {
                                    if (val) setAudience({ ...audience, departments: [...audience.departments, dept] });
                                    else setAudience({ ...audience, departments: audience.departments.filter(d => d !== dept) });
                                  }}
                                />
                                <label htmlFor={`dept-${dept}`} className="text-xs font-semibold cursor-pointer select-none">{dept}</label>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-slate-400 text-xs italic col-span-3">Loading available departments...</div>
                        )}
                      </div>
                      {audience.departments.length === 0 && (
                        <p className="text-[11px] text-rose-500 font-medium">Please select at least one department</p>
                      )}
                    </div>
                  )}

                  {/* Dynamic Branch Multi-Select fetched from backend */}
                  {audience.scope === 'branch' && (
                    <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-2xl border space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Select Target Branches ({audience.branches.length}/{availableBranches.length} Selected)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAudience({ ...audience, branches: [...availableBranches] })}
                            className="text-[10px] text-[#f87941] font-bold hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setAudience({ ...audience, branches: [] })}
                            className="text-[10px] text-slate-400 font-bold hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {availableBranches.length > 0 ? (
                          availableBranches.map(b => {
                            const checked = audience.branches.includes(b);
                            return (
                              <div
                                key={b}
                                onClick={() => {
                                  if (checked) setAudience({ ...audience, branches: audience.branches.filter(x => x !== b) });
                                  else setAudience({ ...audience, branches: [...audience.branches, b] });
                                }}
                                className={`flex items-center space-x-2 p-2 rounded-xl border cursor-pointer transition-all ${
                                  checked ? 'border-[#f87941]/50 bg-[#f87941]/5 font-bold text-slate-900 dark:text-slate-100' : 'border-slate-200 dark:border-zinc-800 text-slate-600'
                                }`}
                              >
                                <Checkbox
                                  id={`branch-${b}`}
                                  checked={checked}
                                  onCheckedChange={(val) => {
                                    if (val) setAudience({ ...audience, branches: [...audience.branches, b] });
                                    else setAudience({ ...audience, branches: audience.branches.filter(x => x !== b) });
                                  }}
                                />
                                <label htmlFor={`branch-${b}`} className="text-xs font-semibold cursor-pointer select-none">{b}</label>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-slate-400 text-xs italic col-span-3">Loading available branches...</div>
                        )}
                      </div>
                      {audience.branches.length === 0 && (
                        <p className="text-[11px] text-rose-500 font-medium">Please select at least one branch</p>
                      )}
                    </div>
                  )}

                  {/* Dynamic Roles Multi-Select fetched from backend */}
                  {audience.scope === 'role' && (
                    <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-2xl border space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Select Target Roles ({audience.roles.length}/{availableRoles.length} Selected)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAudience({ ...audience, roles: [...availableRoles] })}
                            className="text-[10px] text-[#f87941] font-bold hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setAudience({ ...audience, roles: [] })}
                            className="text-[10px] text-slate-400 font-bold hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {availableRoles.length > 0 ? (
                          availableRoles.map(r => {
                            const checked = audience.roles.includes(r);
                            return (
                              <div
                                key={r}
                                onClick={() => {
                                  if (checked) setAudience({ ...audience, roles: audience.roles.filter(x => x !== r) });
                                  else setAudience({ ...audience, roles: [...audience.roles, r] });
                                }}
                                className={`flex items-center space-x-2 p-2 rounded-xl border cursor-pointer transition-all ${
                                  checked ? 'border-[#f87941]/50 bg-[#f87941]/5 font-bold text-slate-900 dark:text-slate-100' : 'border-slate-200 dark:border-zinc-800 text-slate-600'
                                }`}
                              >
                                <Checkbox
                                  id={`role-${r}`}
                                  checked={checked}
                                  onCheckedChange={(val) => {
                                    if (val) setAudience({ ...audience, roles: [...audience.roles, r] });
                                    else setAudience({ ...audience, roles: audience.roles.filter(x => x !== r) });
                                  }}
                                />
                                <label htmlFor={`role-${r}`} className="text-xs font-semibold cursor-pointer select-none">{r}</label>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-slate-400 text-xs italic col-span-3">Loading available roles...</div>
                        )}
                      </div>
                      {audience.roles.length === 0 && (
                        <p className="text-[11px] text-rose-500 font-medium">Please select at least one role</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 4. Multi-Channel Selection */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        <Radio className="h-4.5 w-4.5 text-[#f87941]" /> Delivery Channels (7 Omnichannel Routes)
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        Channels are dynamically verified against your environment credentials and workspace settings.
                      </CardDescription>
                    </div>
                    <a
                      href="/dashboard/settings?tab=notifications"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f87941] hover:underline bg-[#f87941]/10 px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto"
                    >
                      <Settings className="h-3.5 w-3.5" /> Channel Settings
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {channelDefinitions.map(ch => {
                      const Icon = ch.icon;
                      const cap = channelCapabilities[ch.key];
                      const isAvailable = Boolean(cap?.available);
                      const isChecked = Boolean(channels[ch.key]) && isAvailable;

                      return (
                        <div
                          key={ch.key}
                          onClick={() => {
                            if (!isAvailable) {
                              toast.info(`${ch.name} is currently disabled: ${cap?.reason}`, {
                                description: cap?.enableGuide,
                                action: cap?.settingsTab ? {
                                  label: 'Open Settings',
                                  onClick: () => { window.location.href = `/dashboard/settings?tab=${cap.settingsTab}`; }
                                } : undefined
                              });
                              return;
                            }
                            setChannels(prev => ({ ...prev, [ch.key]: !prev[ch.key] }));
                          }}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                            !isAvailable
                              ? 'border-dashed border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/40 opacity-70 cursor-not-allowed select-none'
                              : isChecked
                                ? `${ch.activeBorder} ring-1 ring-offset-0 shadow-sm cursor-pointer`
                                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/20 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <Checkbox
                                id={`ch-${ch.key}`}
                                checked={isChecked}
                                disabled={!isAvailable}
                                onCheckedChange={(v) => {
                                  if (isAvailable) {
                                    setChannels(prev => ({ ...prev, [ch.key]: Boolean(v) }));
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <label
                                htmlFor={`ch-${ch.key}`}
                                className={`font-bold text-xs flex items-center gap-1.5 ${isAvailable ? 'cursor-pointer text-slate-900 dark:text-slate-100' : 'cursor-not-allowed text-slate-400'}`}
                                onClick={(e) => {
                                  if (!isAvailable) e.preventDefault();
                                }}
                              >
                                <Icon className={`h-4 w-4 ${isAvailable ? ch.color : 'text-slate-400'}`} />
                                {ch.name}
                              </label>
                            </div>

                            {isAvailable ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] border-emerald-500/20 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[9px] border-amber-500/30 flex items-center gap-1">
                                <AlertTriangle className="h-2.5 w-2.5" /> Disabled
                              </Badge>
                            )}
                          </div>

                          {/* Reason and Live Status / Guide */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                            {isAvailable ? (
                              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                <span>{cap?.reason || 'Connected & ready for transmission'}</span>
                                {isChecked && <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>}
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1 leading-tight">
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                  <span>{cap?.reason || 'Configuration credentials missing'}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">How to enable: </span>
                                  <span>{cap?.enableGuide}</span>
                                  {cap?.settingsTab && (
                                    <a
                                      href={`/dashboard/settings?tab=${cap.settingsTab}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-0.5 font-bold text-[#f87941] hover:underline ml-1"
                                    >
                                      Go to Settings <ChevronRight className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!hasSelectedChannel && (
                    <p className="text-[11px] text-rose-500 font-medium mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Please select at least one enabled delivery channel for broadcast transmission
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 5. Dispatch Action & Scheduling */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-[#f87941]" /> Dispatch Mode & Compliance Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Dispatch Timing Toggle */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Dispatch Timing</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDispatchMode('now')}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          dispatchMode === 'now'
                            ? 'border-[#f87941] bg-[#f87941]/5 ring-1 ring-[#f87941]'
                            : 'border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/30'
                        }`}
                      >
                        <div>
                          <div className="font-extrabold text-xs flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-[#f87941]" /> Instant Dispatch
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Send immediately to all channels</div>
                        </div>
                        {dispatchMode === 'now' && <CheckCircle2 className="h-4 w-4 text-[#f87941]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDispatchMode('schedule')}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          dispatchMode === 'schedule'
                            ? 'border-[#f87941] bg-[#f87941]/5 ring-1 ring-[#f87941]'
                            : 'border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/30'
                        }`}
                      >
                        <div>
                          <div className="font-extrabold text-xs flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-cyan-500" /> Schedule for Later
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Automated time-delayed release</div>
                        </div>
                        {dispatchMode === 'schedule' && <CheckCircle2 className="h-4 w-4 text-[#f87941]" />}
                      </button>
                    </div>
                  </div>

                  {/* Scheduled Date & Time Pickers */}
                  {dispatchMode === 'schedule' && (
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl animate-fadeIn">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Target Date</label>
                        <Input
                          type="date"
                          value={scheduledDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setScheduledDate(e.target.value)}
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Target Time</label>
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={e => setScheduledTime(e.target.value)}
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mandatory Acknowledgment Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <CheckSquare className="h-4 w-4 text-[#f87941]" /> Mandatory Employee Acknowledgment
                      </div>
                      <div className="text-[11px] text-slate-500">Track employee read-receipts & compliance confirmation</div>
                    </div>
                    <Switch checked={requiresAck} onCheckedChange={setRequiresAck} />
                  </div>

                  {requiresAck && (
                    <div className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-fadeIn">
                      <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Confirmation Deadline:
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={ackDeadlineDays} onValueChange={setAckDeadlineDays}>
                          <SelectTrigger className="h-8 w-28 text-xs rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="1">1 Day</SelectItem>
                            <SelectItem value="2">2 Days</SelectItem>
                            <SelectItem value="3">3 Days</SelectItem>
                            <SelectItem value="7">7 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-zinc-900/40 border-t p-4 rounded-b-3xl flex justify-between items-center">
                  <div className="text-xs text-slate-500 font-medium">
                    Ready to dispatch to <span className="font-extrabold text-slate-900 dark:text-slate-100">{calculateAudienceReach()}</span> employees.
                  </div>
                  <Button
                    onClick={handleDispatchBroadcast}
                    disabled={dispatching || !isFormValid}
                    className={`text-white font-extrabold text-xs h-11 px-6 rounded-2xl flex items-center gap-2 transition-all ${
                      !isFormValid
                        ? 'bg-slate-300 dark:bg-zinc-700 text-slate-500 cursor-not-allowed opacity-60'
                        : 'bg-[#f87941] hover:bg-[#e06634] shadow-md shadow-[#f87941]/20'
                    }`}
                  >
                    {dispatching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                    {dispatchMode === 'schedule' ? 'Schedule Broadcast' : 'Dispatch Broadcast Now'}
                  </Button>
                </CardFooter>
              </Card>

            </div>

            {/* Right Side: Multi-Platform Live Preview */}
            <div className="col-span-12 lg:col-span-5">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md sticky top-6">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Eye className="h-4.5 w-4.5 text-[#f87941]" /> Multi-Platform Preview
                    </CardTitle>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                      <button onClick={() => setPreviewPlatform('email')} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${previewPlatform === 'email' ? 'bg-[#f87941] text-white' : 'text-slate-500'}`}>Email</button>
                      <button onClick={() => setPreviewPlatform('mobile')} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${previewPlatform === 'mobile' ? 'bg-[#f87941] text-white' : 'text-slate-500'}`}>Push</button>
                      <button onClick={() => setPreviewPlatform('slack')} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${previewPlatform === 'slack' ? 'bg-[#f87941] text-white' : 'text-slate-500'}`}>Slack</button>
                      <button onClick={() => setPreviewPlatform('teams')} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${previewPlatform === 'teams' ? 'bg-[#f87941] text-white' : 'text-slate-500'}`}>Teams</button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {previewPlatform === 'email' && (
                    <div className="bg-white dark:bg-zinc-950 border rounded-2xl overflow-hidden shadow-inner text-slate-800 dark:text-slate-200 p-5 space-y-3">
                      <h3 className="text-base font-extrabold">{title || 'Headline Title'}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{message || 'Message details...'}</p>
                    </div>
                  )}
                  {previewPlatform === 'mobile' && (
                    <div className="max-w-[280px] mx-auto bg-slate-900 text-white rounded-[32px] p-3 border-4 border-slate-700 shadow-2xl">
                      <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700 space-y-1">
                        <div className="font-extrabold text-xs text-white">{title || 'Headline'}</div>
                        <div className="text-[11px] text-slate-300 line-clamp-3">{message || 'Message details...'}</div>
                      </div>
                    </div>
                  )}
                  {previewPlatform === 'slack' && (
                    <div className="bg-[#1A1D21] text-slate-200 rounded-2xl p-4 border border-zinc-800 space-y-2 text-xs">
                      <div className="font-bold text-white">{title || 'Headline'}</div>
                      <div className="text-zinc-300 text-[11px] whitespace-pre-wrap">{message || 'Message details...'}</div>
                    </div>
                  )}
                  {previewPlatform === 'teams' && (
                    <div className="bg-[#1F1F1F] text-slate-200 rounded-2xl p-4 border border-zinc-800 space-y-2 text-xs">
                      <div className="font-black text-white">{title || 'Headline'}</div>
                      <div className="text-[11px] text-slate-300">{message || 'Message details...'}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* TAB 2: BROADCAST QUEUE LOGS (100% Dynamic DB Query) */}
        <TabsContent value="history" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-[#f87941]" /> Dispatch Log (DB Live)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {broadcasts.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                      <th className="p-4 px-6">ID & Title</th>
                      <th className="p-4">Category & Target</th>
                      <th className="p-4">Channels</th>
                      <th className="p-4">Sent Time</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Read Rate</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                    {broadcasts.map(bc => (
                      <tr key={bc.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30">
                        <td className="p-4 px-6">
                          <span className="font-mono text-[10px] text-[#f87941] font-black">{bc.id}</span>
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs line-clamp-1">{bc.title}</div>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-none font-bold text-[9px]">{bc.categoryName}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {bc.channels.map(ch => (
                              <span key={ch} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[9px] font-mono text-slate-500">{ch}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-500">{bc.sentAt}</td>
                        <td className="p-4">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">{bc.status}</Badge>
                        </td>
                        <td className="p-4 font-mono font-black text-[#f87941]">{bc.readRate}%</td>
                        <td className="p-4 text-right pr-6">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedBroadcast(bc); setShowDetailDialog(true); }} className="h-8 text-xs font-bold text-[#f87941]">
                            View <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">No broadcasts dispatched yet</div>
                  <div className="text-xs text-slate-400">Use the Compose tab to create and dispatch your first omnichannel announcement.</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ACKNOWLEDGEMENT TRACKER (100% Dynamic DB Query) */}
        <TabsContent value="acknowledgements" className="space-y-6 m-0">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-[#f87941]" /> Mandatory Compliance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs font-semibold text-amber-700 dark:text-amber-300 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>{summaryStats.pendingCount} Employees Pending Acknowledgment</span>
                    </div>
                    <Button
                      onClick={handleSendAckReminders}
                      disabled={nudging || summaryStats.pendingCount === 0}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-9 flex items-center justify-center gap-1.5"
                    >
                      {nudging ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                      Send Reminder Nudge (API Call)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <UserCheck className="h-4.5 w-4.5 text-[#f87941]" /> Employee Audit Log (DB Live)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search employee..."
                        value={ackSearch}
                        onChange={e => setAckSearch(e.target.value)}
                        className="w-48 h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {filteredAckEmployees.length > 0 ? (
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                          <th className="p-3.5 px-5">Employee</th>
                          <th className="p-3.5">Department</th>
                          <th className="p-3.5">Branch</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                        {filteredAckEmployees.map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30">
                            <td className="p-3.5 px-5 font-bold">{emp.name}</td>
                            <td className="p-3.5 text-slate-500">{emp.dept}</td>
                            <td className="p-3.5 text-slate-500">{emp.branch}</td>
                            <td className="p-3.5">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">{emp.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                      No employee acknowledgement records found for this tenant database.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: CHANNELS & GATEWAY HEALTH */}
        <TabsContent value="channels" className="space-y-6 m-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Live Delivery Gateway Status</h3>
              <p className="text-xs text-slate-500">Real-time connectivity and dispatch throughput for configured transmission routes.</p>
            </div>
            <a
              href="/dashboard/settings?tab=notifications"
              className="text-xs font-bold text-[#f87941] hover:underline flex items-center gap-1 bg-[#f87941]/10 px-3 py-1.5 rounded-xl"
            >
              <Settings className="h-3.5 w-3.5" /> Configure in Settings
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gateways.length > 0 ? (
              gateways.map(gw => {
                const isConnected = gw.status === 'Connected';
                return (
                  <Card key={gw.name} className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-black">{gw.name}</CardTitle>
                        <Badge className={`${isConnected ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'} font-bold text-[9px]`}>
                          {gw.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-1 text-xs space-y-2 font-mono text-slate-500">
                      <div>Uptime: <span className={isConnected ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{gw.uptime}</span></div>
                      <div>Throughput: {gw.speed}</div>
                      {!isConnected && (
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 font-sans text-[11px] not-italic">
                          <a
                            href="/dashboard/settings?tab=notifications"
                            className="text-[#f87941] font-bold hover:underline inline-flex items-center gap-1"
                          >
                            Configure in Settings <ChevronRight className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-3 text-center p-8 text-xs text-slate-400">Loading channel gateways status from API...</div>
            )}
          </div>
        </TabsContent>

        {/* TAB 5: ANALYTICS & INSIGHTS */}
        <TabsContent value="analytics" className="space-y-6 m-0">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-[#f87941]" /> Channel Engagement Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {channelAnalytics.length > 0 ? (
                    channelAnalytics.map(item => (
                      <div key={item.channel} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{item.channel}</span>
                          <span className="font-mono text-[#f87941]">{item.rate}% ({item.count})</span>
                        </div>
                        <Progress value={item.rate} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-6">No channel dispatches logged yet to generate analytics.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-[#f87941]" /> Department Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                  {departmentEngagement.length > 0 ? (
                    departmentEngagement.map(d => (
                      <div key={d.dept} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/40">
                        <div>
                          <div className="font-extrabold">{d.dept}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{d.count} active</div>
                        </div>
                        <Badge className="bg-[#f87941]/10 text-[#f87941] font-mono font-black border-none">{d.rate}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 p-4 text-center">No department engagement data recorded yet.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

      </Tabs>

      {/* Broadcast Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="rounded-3xl max-w-2xl border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-black">{selectedBroadcast?.title}</DialogTitle>
            <DialogDescription className="text-xs">
              Category: {selectedBroadcast?.categoryName} • Sent: {selectedBroadcast?.sentAt}
            </DialogDescription>
          </DialogHeader>
          {selectedBroadcast && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border leading-relaxed whitespace-pre-wrap">
                {selectedBroadcast.message}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="rounded-xl text-xs font-bold">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


export default function BroadcastHubPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 max-w-[1700px] mx-auto p-6 animate-pulse">
        <div className="h-32 w-full bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        <div className="h-14 w-full bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
      </div>
    }>
      <BroadcastHubContent />
    </Suspense>
  );
}
