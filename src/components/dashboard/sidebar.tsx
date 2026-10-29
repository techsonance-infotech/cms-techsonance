'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCog,
  IndianRupee,
  FileText,
  Settings,
  Building2,
  Kanban,
  ClipboardList,
  Search,
  UserCircle,
  HelpCircle,
  Wallet,
  Receipt,
  Fingerprint,
  Wifi,
  Calendar,
  Clock,
  Inbox,
  PenTool,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Shield,
  Map,
  Dumbbell,
  Activity,
  CalendarDays,
  Terminal,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Network,
  Star,
  Upload,
  ScrollText,
  ArrowRightLeft,
  Home,
  MessageSquare,
  Contact,
  BadgeCheck,
  BarChart3,
  UserPlus,
  Laptop,
  ListTodo,
  Trash2,
  HeartHandshake,
  ShieldCheck,
  Cpu,
  Briefcase,
  Layers,
  MapPin,
  Award,
  Play,
  Bell,
  QrCode,
  Plane,
  ShoppingCart,
  Bot,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { User } from '@/lib/auth';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface DashboardSidebarProps {
  user: User;
  isMobile?: boolean;
  onClose?: () => void;
  companyName?: string;
}

const normalizeRole = (roleStr?: string): string => {
  if (!roleStr) return 'developer';
  const role = roleStr.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (role === 'superadmin' || role === 'super_admin' || role === 'owner') {
    return 'admin';
  }
  if (role === 'manager') {
    return 'project_manager';
  }
  return role;
};

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
}

interface NavCategory {
  name: string;
  icon: any;
  items: NavItem[];
  isSingleton?: boolean;
  href?: string;
  roles?: string[];
}

// Helper to determine exact route matching vs prefix matching
const isPathActive = (itemHref: string, currentPath: string, searchParams?: any): boolean => {
  // If itemHref has a query param (e.g. ?tab=...)
  if (itemHref.includes('?')) {
    const [pathPart, queryPart] = itemHref.split('?');
    if (currentPath !== pathPart) return false;
    
    // Check if query params match using environment-safe string splitting
    if (!searchParams) return false;
    
    const pairs = queryPart.split('&');
    let allMatch = true;
    for (let i = 0; i < pairs.length; i++) {
      const [key, val] = pairs[i].split('=');
      if (searchParams.get(key) !== val) {
        allMatch = false;
        break;
      }
    }
    return allMatch;
  }
  
  if (!itemHref.includes('?')) {
    if (searchParams && searchParams.get('tab')) {
      const activeTab = searchParams.get('tab');
      if (itemHref === '/dashboard/ai-copilot' && activeTab !== 'insights') {
        return false;
      }
      if (itemHref === '/dashboard/employees/audit-logs' && activeTab !== 'timeline') {
        return false;
      }
      if (itemHref === '/dashboard/settings' && !['overview', 'overview-tab'].includes(activeTab)) {
        return false;
      }
    }
  }

  if (itemHref === '/dashboard/recruitment' && currentPath.startsWith('/dashboard/recruitment/analytics')) {
    return false;
  }
  if (itemHref === '/dashboard/attendance' && currentPath.startsWith('/dashboard/attendance/analytics')) {
    return false;
  }
  if (itemHref === '/dashboard/hr-operations' && currentPath.startsWith('/dashboard/hr-operations/analytics')) {
    return false;
  }
  if (itemHref === '/dashboard/projects' && currentPath.startsWith('/dashboard/projects/analytics')) {
    return false;
  }
  if (itemHref === '/dashboard/finance' && currentPath.startsWith('/dashboard/finance/analytics')) {
    return false;
  }
  if (itemHref === '/dashboard/finance' && currentPath.startsWith('/dashboard/finance/quotations')) {
    return false;
  }
  if (itemHref === '/dashboard/crm' && currentPath.startsWith('/dashboard/crm/analytics')) {
    return false;
  }
  if (itemHref === '/dashboard/employees') {
    return currentPath === '/dashboard/employees' || currentPath === '/dashboard/employees/';
  }
  return currentPath === itemHref || currentPath.startsWith(itemHref + '/');
};

const categories: NavCategory[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    isSingleton: true,
    href: '/dashboard',
    roles: ['admin', 'project_manager', 'developer', 'client', 'hr_manager', 'accountant', 'business_development', 'employee', 'intern', 'ceo', 'cto', 'business_owner'],
    items: []
  },
  {
    name: 'Workforce Hub',
    icon: Users,
    items: [
      { name: 'Workforce Overview', href: '/dashboard/employees', icon: BarChart3, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Organization Chart', href: '/dashboard/employees/org-chart', icon: Network, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee'] },
      { name: 'Employee Directory', href: '/dashboard/employees/directory', icon: Contact, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Add Employee', href: '/dashboard/employees/new', icon: UserPlus, roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Employee Movement', href: '/dashboard/employees/movement', icon: ArrowRightLeft, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Onboarding Center', href: '/dashboard/employees/onboarding', icon: ListTodo, roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Offboarding Center', href: '/dashboard/employees/offboarding', icon: Trash2, roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Employee Documents', href: '/dashboard/employees/documents', icon: FileText, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee'] },
      { name: 'Employee Assets', href: '/dashboard/employees/assets', icon: Laptop, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee'] },
      { name: 'Reviews & Appraisals', href: '/dashboard/employees/reviews', icon: Star, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Goals & OKRs', href: '/dashboard/employees/reviews?tab=goals', icon: Star, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Career & Succession', href: '/dashboard/employees/reviews?tab=career', icon: Award, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Bulk Import', href: '/dashboard/employees/import', icon: Upload, roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'] }
    ]
  },
  {
    name: 'Recruitment & Talent',
    icon: Briefcase,
    items: [
      { name: 'Recruitment Dashboard', href: '/dashboard/recruitment', icon: BarChart3, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Job Requisitions', href: '/dashboard/recruitment/jobs', icon: Briefcase, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Career Portal', href: '/dashboard/recruitment/portal', icon: Home, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Candidate Pipeline', href: '/dashboard/recruitment/candidates', icon: Kanban, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Candidate Directory', href: '/dashboard/recruitment/candidates?tab=directory', icon: Users, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Interview Management', href: '/dashboard/recruitment/interviews', icon: Clock, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Offer Management', href: '/dashboard/recruitment/offers', icon: FileText, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Talent Pool', href: '/dashboard/recruitment/talent-pool', icon: Star, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Campus Hiring', href: '/dashboard/recruitment/campus', icon: GraduationCap, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] }
    ]
  },
  {
    name: 'Time & Attendance',
    icon: Clock,
    items: [
      { name: 'Attendance Dashboard', href: '/dashboard/attendance', icon: BarChart3, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'My Attendance', href: '/dashboard/attendance/register', icon: Clock, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Shift Management', href: '/dashboard/employees/shifts', icon: Clock, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Timesheet Operations', href: '/dashboard/employees/timesheets', icon: Clock, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Leaves & Time Off', href: '/dashboard/leaves', icon: Calendar, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Work From Home', href: '/dashboard/employees/wfh', icon: Home, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Holiday Calendar', href: '/dashboard/employees/holidays', icon: CalendarDays, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Attendance Policies', href: '/dashboard/attendance/policies', icon: ScrollText, roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'] }
    ]
  },
  {
    name: 'HR Operations',
    icon: BadgeCheck,
    items: [
      { name: 'Operations Dashboard', href: '/dashboard/hr-operations', icon: BarChart3, roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'HR Service Desk', href: '/dashboard/hr-service-desk', icon: HelpCircle, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Employee Request Center', href: '/dashboard/employees/requests', icon: MessageSquare, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee'] },
      { name: 'Broadcast Hub', href: '/dashboard/employees/broadcast', icon: Inbox, roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Document Vault', href: '/dashboard/employees/documents', icon: FileText, roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Asset Tracker', href: '/dashboard/employees/assets', icon: Laptop, roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Training & Skills', href: '/dashboard/employees/training', icon: GraduationCap, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Wellness Operations', href: '/dashboard/employees/wellness', icon: HeartHandshake, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Visitor Passes', href: '/dashboard/visitors', icon: QrCode, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Knowledge Base & SOPs', href: '/dashboard/knowledge-base', icon: BookOpen, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] }
    ]
  },
  {
    name: 'Projects & Delivery',
    icon: FolderKanban,
    items: [
      { name: 'Project Dashboard', href: '/dashboard/projects', icon: BarChart3, roles: ['admin', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Active Projects', href: '/dashboard/projects/active', icon: FolderKanban, roles: ['admin', 'project_manager', 'developer', 'employee', 'intern', 'ceo', 'cto', 'business_owner'] },
      { name: 'Project Portfolio', href: '/dashboard/projects/portfolio', icon: Layers, roles: ['admin', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Task Board', href: '/dashboard/tasks', icon: Kanban, roles: ['admin', 'project_manager', 'developer', 'employee', 'intern', 'ceo', 'cto', 'business_owner'] },
      { name: 'Sprint Planner', href: '/dashboard/tasks/sprint-planning', icon: Kanban, roles: ['admin', 'project_manager', 'developer', 'employee', 'intern', 'ceo', 'cto', 'business_owner'] },
      { name: 'Resource Planner', href: '/dashboard/employees/resource-allocation', icon: ClipboardList, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Capacity Planner', href: '/dashboard/projects/capacity', icon: Activity, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'PSA Planner', href: '/dashboard/employees/resource-allocation?tab=psa', icon: ClipboardList, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Timesheets', href: '/dashboard/employees/timesheets', icon: Clock, roles: ['admin', 'project_manager', 'developer', 'employee', 'intern', 'ceo', 'cto', 'business_owner'] }
    ]
  },
  {
    name: 'Finance',
    icon: IndianRupee,
    items: [
      { name: 'Finance Dashboard', href: '/dashboard/finance', icon: BarChart3, roles: ['admin', 'accountant', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Invoices & Billing', href: '/dashboard/finance/invoices', icon: Receipt, roles: ['admin', 'accountant', 'project_manager', 'ceo', 'cto', 'business_owner'] },

      { name: 'Payroll & Salary', href: '/dashboard/payroll', icon: Wallet, roles: ['admin', 'accountant', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Reimbursements', href: '/dashboard/reimbursements', icon: Receipt, roles: ['admin', 'project_manager', 'hr_manager', 'accountant', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Expenses', href: '/dashboard/reimbursements?tab=expenses', icon: IndianRupee, roles: ['admin', 'project_manager', 'hr_manager', 'accountant', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Project Financials', href: '/dashboard/projects/financials', icon: IndianRupee, roles: ['admin', 'project_manager', 'accountant', 'ceo', 'cto', 'business_owner'] },
      { name: 'Procurement & Purchase', href: '/dashboard/procurement', icon: ShoppingCart, roles: ['admin', 'accountant', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Vendor Directory', href: '/dashboard/procurement/vendors', icon: Users, roles: ['admin', 'accountant', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Travel Management', href: '/dashboard/travel', icon: Plane, roles: ['admin', 'accountant', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner', 'developer', 'employee', 'intern'] },
      { name: 'Financial Reports', href: '/dashboard/finance/executive', icon: TrendingUp, roles: ['admin', 'accountant', 'hr_manager', 'ceo', 'cto', 'business_owner'] }
    ]
  },
  {
    name: 'CRM & Sales',
    icon: Inbox,
    roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'business_development'],
    items: [
      { name: 'CRM Dashboard', href: '/dashboard/crm', icon: BarChart3, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'business_development'] },
      { name: 'Client Directory', href: '/dashboard/clients', icon: Users, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'business_development'] },
      { name: 'Client Inquiries', href: '/dashboard/inquiry', icon: Search, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'business_development'] },
      { name: 'Contacts', href: '/dashboard/contacts', icon: Contact, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'business_development'] },
      { name: 'Sales Pipeline', href: '/dashboard/sales-pipeline', icon: TrendingUp, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'business_development'] },
      { name: 'Quotations', href: '/dashboard/finance/quotations', icon: ScrollText, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'business_development'] },
      { name: 'CRM Inbox', href: '/dashboard/inbox', icon: Inbox, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'business_development'] },
      { name: 'AI Email Composer', href: '/dashboard/inbox/composer', icon: PenTool, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'business_development'] },
      { name: 'Sales Forecast', href: '/dashboard/inquiry/forecast', icon: TrendingUp, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'business_development'] }
    ]
  },
  {
    name: 'Analytics & BI',
    icon: TrendingUp,
    roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner', 'accountant'],
    items: [
      { name: 'Executive Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner', 'accountant'] },
      { name: 'HR Analytics', href: '/dashboard/hr-operations/analytics', icon: Users, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Recruitment Analytics', href: '/dashboard/recruitment/analytics', icon: Briefcase, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Attendance Analytics', href: '/dashboard/attendance/analytics', icon: Clock, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Finance Analytics', href: '/dashboard/finance/analytics', icon: IndianRupee, roles: ['admin', 'accountant', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Project Analytics', href: '/dashboard/projects/analytics', icon: FolderKanban, roles: ['admin', 'project_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'CRM Analytics', href: '/dashboard/crm/analytics', icon: TrendingUp, roles: ['admin', 'project_manager', 'ceo', 'cto', 'business_owner', 'business_development'] },
      { name: 'Custom Reports', href: '/dashboard/custom-reports', icon: ScrollText, roles: ['admin', 'hr_manager', 'project_manager', 'ceo', 'cto', 'business_owner'] }
    ]
  },
  {
    name: 'AI Hub',
    icon: Star,
    roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'],
    items: [
      { name: 'AI Copilot', href: '/dashboard/ai-copilot', icon: Cpu, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'AI Assistant', href: '/dashboard/ai-copilot?tab=assistant', icon: Bot, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'AI Automations', href: '/dashboard/hr-automation', icon: Zap, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'AI Prompt Library', href: '/dashboard/ai-copilot?tab=prompts', icon: BookOpen, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'AI Usage Analytics', href: '/dashboard/ai-copilot?tab=usage', icon: TrendingUp, roles: ['admin', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner'] }
    ]
  },
  {
    name: 'Security & Compliance',
    icon: ShieldCheck,
    roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'],
    items: [
      { name: 'Compliance Operations', href: '/dashboard/employees/compliance', icon: ShieldCheck, roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'] },
      { name: 'Audit Logs', href: '/dashboard/employees/audit-logs', icon: ScrollText, roles: ['admin', 'ceo', 'cto', 'business_owner'] },
      { name: 'Activity Monitor', href: '/dashboard/employees/audit-logs?tab=timeline', icon: Activity, roles: ['admin', 'ceo', 'cto', 'business_owner'] },
      { name: 'Security Center', href: '/dashboard/settings?tab=security', icon: Shield, roles: ['admin', 'ceo', 'cto', 'business_owner'] },
      { name: 'Data Privacy', href: '/dashboard/settings?tab=compliance', icon: ShieldCheck, roles: ['admin', 'ceo', 'cto', 'business_owner'] },
      { name: 'Backup & Recovery', href: '/dashboard/settings?tab=backup', icon: RefreshCw, roles: ['admin', 'ceo', 'cto', 'business_owner'] }
    ]
  },
  {
    name: 'Business Settings',
    icon: Settings,
    isSingleton: true,
    href: '/dashboard/settings',
    roles: ['admin', 'hr_manager', 'ceo', 'cto', 'business_owner'],
    items: []
  }
];

const getModuleByCategoryName = (name: string): string => {
  switch (name.toLowerCase().trim()) {
    case 'dashboard': return 'dashboard';
    case 'workforce hub': return 'workforce_hub';
    case 'recruitment & talent': return 'recruitment';
    case 'time & attendance': return 'time_attendance';
    case 'hr operations': return 'hr_operations';
    case 'projects & delivery': return 'projects_delivery';
    case 'finance': return 'finance_claims';
    case 'crm & sales': return 'crm_sales';
    case 'analytics & bi': return 'analytics_bi';
    case 'ai hub': return 'ai_hub';
    case 'security & compliance': return 'security_compliance';
    case 'business settings': return 'administration';
    default: return '';
  }
};

export function DashboardSidebar({ user, isMobile = false, onClose, companyName: propsCompanyName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const normalizedRole = normalizeRole(user.role);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [companyName, setCompanyName] = useState(propsCompanyName || 'TechSonance InfoTech');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar collapse preference on mount (only if not on mobile)
  useEffect(() => {
    if (!isMobile && typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar_collapsed');
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    }
  }, [isMobile]);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  const activeCollapsed = isMobile ? false : isCollapsed;

  useEffect(() => {
    if (propsCompanyName) {
      setCompanyName(propsCompanyName);
    }
  }, [propsCompanyName]);

  useEffect(() => {
    const updatedOpen: Record<string, boolean> = {};
    categories.forEach((cat) => {
      const hasActive = cat.items.some((item) => {
        const itemRoles = item.roles || [];
        if (!itemRoles.includes(normalizedRole)) return false;
        return isPathActive(item.href, pathname, searchParams);
      });
      if (hasActive) {
        updatedOpen[cat.name] = true;
      }
    });
    setOpenCategories((prev) => ({ ...prev, ...updatedOpen }));
  }, [pathname, normalizedRole, searchParams]);

  const toggleCategory = (catName: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-full transition-all duration-300 ease-in-out relative flex flex-col shrink-0 z-20",
        isMobile 
          ? "w-full" 
          : cn("hidden lg:flex", activeCollapsed ? "w-20" : "w-64")
      )}>
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-24 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm hover:bg-sidebar-accent hover:text-sidebar-primary-foreground transition-all duration-150 cursor-pointer focus:outline-none"
            aria-label={activeCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {activeCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        <div className={cn(
          "flex items-center bg-gradient-to-r from-[#F87941] to-[#F4662B] text-white border-b border-[#F4662B]/10 shadow-sm shrink-0 transition-all duration-300 ease-in-out h-16",
          activeCollapsed ? "px-4 justify-center" : "px-6 gap-3"
        )}>
          <div className="relative h-9 w-9 bg-white/95 rounded-xl p-1.5 flex items-center justify-center border border-white/20 shadow-sm overflow-hidden shrink-0 transition-transform duration-200 hover:scale-[1.03]">
            <Image src="/logo-icon.png" alt="TechSonance" fill className="object-contain p-1.5" />
          </div>
          {!activeCollapsed && (
            <span className="font-bold text-sm text-white tracking-tight leading-snug flex-1 select-none animate-in fade-in duration-300 truncate">
              {companyName}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 scrollbar-thin scrollbar-thumb-sidebar-border">
          {categories.map((cat) => {
            const catRoles = cat.roles || [];
            const isSingleton = cat.isSingleton;

            const userPerms = (user as any).permissions;
            if (userPerms) {
              const modName = getModuleByCategoryName(cat.name);
              if (modName && userPerms[modName] && userPerms[modName].read === false) {
                return null;
              }
            }

            if (!userPerms && catRoles.length > 0 && !catRoles.includes(normalizedRole)) {
              return null;
            }

            if (isSingleton) {

              const isActive = pathname === cat.href || (cat.href !== '/dashboard' && pathname.startsWith(cat.href + '/'));
              const Icon = cat.icon;

              if (activeCollapsed) {
                return (
                  <Tooltip key={cat.name}>
                    <TooltipTrigger asChild>
                      <Link
                        href={cat.href || '#'}
                        onClick={() => isMobile && onClose?.()}
                        className={cn(
                          'flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-150 mx-auto',
                          isActive
                            ? 'bg-[#F87941] text-white font-semibold shadow-sm'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs bg-sidebar-foreground text-sidebar-background">
                      {cat.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <div key={cat.name} className="w-full">
                  <Link
                    href={cat.href || '#'}
                    onClick={() => isMobile && onClose?.()}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-[#F87941] text-white font-semibold shadow-sm'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-sidebar-foreground/70')} />
                    <span className="truncate whitespace-nowrap">{cat.name}</span>
                  </Link>
                </div>
              );
            }

            const visibleItems = cat.items.filter((item) => {
              const userPerms = (user as any).permissions;
              if (userPerms) {
                if (item.href === '/dashboard/attendance') {
                  const ta = userPerms.time_attendance;
                  if (!ta || !ta.approve) return false;
                }
                if (item.href === '/dashboard/attendance/register') {
                  const ta = userPerms.time_attendance;
                  if (!ta || !ta.read) return false;
                }
              }

              const itemRoles = item.roles || [];
              if (itemRoles.length === 0) return true;
              return itemRoles.includes(normalizedRole);
            });

            if (visibleItems.length === 0) {
              return null;
            }

            const isOpen = !!openCategories[cat.name];
            const isCatActive = visibleItems.some((item) => isPathActive(item.href, pathname, searchParams));
            const CatIcon = cat.icon;

            if (activeCollapsed) {
              return (
                <div key={cat.name} className="flex justify-center w-full my-0.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-150 focus:outline-none',
                          isCatActive
                            ? 'bg-[#F87941] text-white font-semibold shadow-sm'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
                        )}
                        aria-label={cat.name}
                      >
                        <CatIcon className="h-4 w-4 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" sideOffset={12} className="w-52 p-1.5 rounded-xl bg-sidebar border border-sidebar-border shadow-lg">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-sidebar-foreground/50 uppercase tracking-wider border-b border-sidebar-border mb-1 truncate">
                        {cat.name}
                      </div>
                      {visibleItems.map((item) => {
                        const isActive = isPathActive(item.href, pathname, searchParams);
                        const ItemIcon = item.icon;

                        return (
                          <DropdownMenuItem
                            key={item.name}
                            asChild
                            className="focus:bg-sidebar-accent focus:text-sidebar-primary-foreground rounded-lg p-0"
                          >
                            <Link
                              href={item.href}
                              onClick={() => isMobile && onClose?.()}
                              className={cn(
                                'flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors font-sans',
                                isActive
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
                              )}
                            >
                              <ItemIcon className="h-4 w-4 shrink-0" />
                              <span className="truncate whitespace-nowrap">{item.name}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            }

            return (
              <div key={cat.name} className="w-full space-y-1">
                <button
                  onClick={() => toggleCategory(cat.name)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 text-left',
                    isCatActive
                      ? 'text-sidebar-primary-foreground bg-sidebar-primary/50 font-semibold'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <CatIcon className={cn('h-4 w-4 shrink-0', isCatActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60')} />
                    <span className="truncate whitespace-nowrap">{cat.name}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50 ml-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-sidebar-foreground/50 ml-2" />
                  )}
                </button>

                {isOpen && (
                  <ul className="pl-4 space-y-1 border-l border-sidebar-border ml-5 py-1">
                    {visibleItems.map((item) => {
                      const isActive = isPathActive(item.href, pathname, searchParams);
                      const ItemIcon = item.icon;

                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={() => isMobile && onClose?.()}
                            className={cn(
                              'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150',
                              isActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                                : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
                            )}
                          >
                            <ItemIcon className={cn('h-4 w-4 shrink-0', isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/50')} />
                            <span className="truncate whitespace-nowrap">{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </TooltipProvider>
  );
}
