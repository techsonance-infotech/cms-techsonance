'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
const isPathActive = (itemHref: string, currentPath: string): boolean => {
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
    roles: ['admin', 'project_manager', 'developer', 'client', 'hr_manager', 'accountant', 'business_development', 'employee', 'intern'],
    items: []
  },
  {
    name: 'Employee Self Service',
    icon: UserCircle,
    items: [
      { name: 'My Profile', href: '/dashboard/profile', icon: UserCircle, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Attendance', href: '/dashboard/attendance', icon: Clock, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Leave', href: '/dashboard/leaves', icon: Calendar, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Payroll', href: '/dashboard/payroll', icon: Wallet, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Documents', href: '/dashboard/employees/documents', icon: FileText, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Assets', href: '/dashboard/employees/assets', icon: Laptop, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Claims', href: '/dashboard/reimbursements', icon: Receipt, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Learning', href: '/dashboard/employees/training', icon: GraduationCap, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Goals', href: '/dashboard/employees/reviews', icon: Star, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Performance', href: '/dashboard/employees/reviews', icon: BarChart3, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Requests', href: '/dashboard/employees/requests', icon: MessageSquare, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Approvals', href: '/dashboard/employees/requests', icon: ShieldCheck, roles: ['developer', 'employee', 'intern'] },
      { name: 'My Team', href: '/dashboard/employees/directory', icon: Users, roles: ['developer', 'employee', 'intern'] },
      { name: 'Holiday Calendar', href: '/dashboard/employees/holidays', icon: Calendar, roles: ['developer', 'employee', 'intern'] },
      { name: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: BookOpen, roles: ['developer', 'employee', 'intern'] }
    ]
  },
  {
    name: 'Manager Self Service',
    icon: ClipboardList,
    items: [
      { name: 'Manager Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['project_manager'] },
      { name: 'Team Attendance', href: '/dashboard/attendance', icon: Clock, roles: ['project_manager'] },
      { name: 'Team Leave', href: '/dashboard/leaves', icon: Calendar, roles: ['project_manager'] },
      { name: 'Approvals', href: '/dashboard/employees/requests', icon: ShieldCheck, roles: ['project_manager'] },
      { name: 'Performance', href: '/dashboard/employees/reviews', icon: Star, roles: ['project_manager'] },
      { name: 'Timesheets', href: '/dashboard/employees/timesheets', icon: Clock, roles: ['project_manager'] },
      { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban, roles: ['project_manager'] },
      { name: 'Team Calendar', href: '/dashboard/employees/holidays', icon: Calendar, roles: ['project_manager'] },
      { name: 'Organization', href: '/dashboard/employees/org-chart', icon: Network, roles: ['project_manager'] },
      { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp, roles: ['project_manager'] }
    ]
  },
  {
    name: 'Workforce Hub',
    icon: Users,
    items: [
      { name: 'Workforce Overview', href: '/dashboard/employees', icon: BarChart3, roles: ['admin', 'project_manager', 'hr_manager'] },
      { name: 'Employee Directory', href: '/dashboard/employees/directory', icon: Contact, roles: ['admin', 'project_manager', 'hr_manager'] },
      { name: 'Add Employee', href: '/dashboard/employees/new', icon: UserPlus, roles: ['admin', 'hr_manager'] },
      { name: 'Onboarding Center', href: '/dashboard/employees/onboarding', icon: ListTodo, roles: ['admin', 'hr_manager'] },
      { name: 'Offboarding Center', href: '/dashboard/employees/offboarding', icon: Trash2, roles: ['admin', 'hr_manager'] },
      { name: 'Org Chart', href: '/dashboard/employees/org-chart', icon: Network, roles: ['admin', 'project_manager', 'hr_manager'] },
      { name: 'Employee Movement', href: '/dashboard/employees/movement', icon: ArrowRightLeft, roles: ['admin', 'project_manager', 'hr_manager'] },
      { name: 'Reviews & Appraisals', href: '/dashboard/employees/reviews', icon: Star, roles: ['admin', 'project_manager', 'hr_manager'] },
      { name: 'Bulk Import', href: '/dashboard/employees/import', icon: Upload, roles: ['admin', 'hr_manager'] }
    ]
  },
  {
    name: 'Time & Attendance',
    icon: Clock,
    items: [
      { name: 'Attendance Register', href: '/dashboard/attendance', icon: Clock, roles: ['admin', 'project_manager', 'hr_manager'] },
      { name: 'Shift Management', href: '/dashboard/employees/shifts', icon: Clock, roles: ['admin', 'hr_manager', 'project_manager'] },
      { name: 'Timesheet Operations', href: '/dashboard/employees/timesheets', icon: Clock, roles: ['admin', 'project_manager', 'hr_manager'] },
      { name: 'Leaves & Time Off', href: '/dashboard/leaves', icon: Calendar, roles: ['admin', 'project_manager', 'hr_manager'] },
      { name: 'Work From Home', href: '/dashboard/employees/wfh', icon: Home, roles: ['admin', 'hr_manager', 'project_manager'] },
      { name: 'Holiday Calendar', href: '/dashboard/employees/holidays', icon: Calendar, roles: ['admin', 'hr_manager', 'project_manager'] }
    ]
  },
  {
    name: 'HR Operations',
    icon: BadgeCheck,
    items: [
      { name: 'Operations Dashboard', href: '/dashboard/hr-operations', icon: BarChart3, roles: ['admin', 'hr_manager'] },
      { name: 'HR Service Desk', href: '/dashboard/hr-service-desk', icon: HelpCircle, roles: ['admin', 'hr_manager', 'project_manager'] },
      { name: 'Request Center', href: '/dashboard/employees/requests', icon: MessageSquare, roles: ['admin', 'hr_manager', 'project_manager'] },
      { name: 'Broadcast Hub', href: '/dashboard/employees/broadcast', icon: Inbox, roles: ['admin', 'hr_manager'] },
      { name: 'Document Vault', href: '/dashboard/employees/documents', icon: FileText, roles: ['admin', 'hr_manager'] },
      { name: 'Asset Tracker', href: '/dashboard/employees/assets', icon: Laptop, roles: ['admin', 'hr_manager'] },
      { name: 'Training & Skills', href: '/dashboard/employees/training', icon: GraduationCap, roles: ['admin', 'hr_manager', 'project_manager'] },
      { name: 'Wellness Operations', href: '/dashboard/employees/wellness', icon: HeartHandshake, roles: ['admin', 'hr_manager', 'project_manager'] },
      { name: 'Recruitment & ATS', href: '/dashboard/recruitment', icon: Briefcase, roles: ['admin', 'hr_manager', 'project_manager'] },
      { name: 'Knowledge Base & SOPs', href: '/dashboard/knowledge-base', icon: BookOpen, roles: ['admin', 'hr_manager', 'project_manager'] },
      { name: 'Visitor Passes', href: '/dashboard/visitors', icon: QrCode, roles: ['admin', 'hr_manager', 'project_manager'] }
    ]
  },
  {
    name: 'Projects & Delivery',
    icon: FolderKanban,
    items: [
      { name: 'Active Projects', href: '/dashboard/projects', icon: FolderKanban, roles: ['admin', 'project_manager', 'developer', 'employee', 'intern'] },
      { name: 'Task Board', href: '/dashboard/tasks', icon: Kanban, roles: ['admin', 'project_manager', 'developer', 'employee', 'intern'] },
      { name: 'Sprint Planner', href: '/dashboard/tasks/sprint-planning', icon: Kanban, roles: ['admin', 'project_manager', 'developer', 'employee', 'intern'] },
      { name: 'Resource & PSA Planner', href: '/dashboard/employees/resource-allocation', icon: ClipboardList, roles: ['admin', 'project_manager', 'hr_manager'] }
    ]
  },
  {
    name: 'Finance & Claims',
    icon: IndianRupee,
    items: [
      { name: 'Finance Control', href: '/dashboard/finance', icon: IndianRupee, roles: ['admin', 'accountant', 'hr_manager'] },
      { name: 'Financial Executive', href: '/dashboard/finance/executive', icon: IndianRupee, roles: ['admin', 'accountant', 'hr_manager'] },
      { name: 'Invoices & Billing', href: '/dashboard/finance/invoices', icon: Receipt, roles: ['admin', 'accountant', 'project_manager'] },
      { name: 'Reimbursements', href: '/dashboard/reimbursements', icon: Receipt, roles: ['admin', 'project_manager', 'hr_manager', 'accountant'] },
      { name: 'Payroll & Salary', href: '/dashboard/payroll', icon: Wallet, roles: ['admin', 'accountant', 'hr_manager'] },
      { name: 'Project Financials', href: '/dashboard/projects/financials', icon: IndianRupee, roles: ['admin', 'project_manager', 'accountant'] },
      { name: 'Travel Management', href: '/dashboard/travel', icon: Plane, roles: ['admin', 'accountant', 'hr_manager', 'project_manager'] },
      { name: 'Procurement & Purchase', href: '/dashboard/procurement', icon: ShoppingCart, roles: ['admin', 'accountant', 'hr_manager', 'project_manager'] },
      { name: 'Vendor Directory', href: '/dashboard/procurement/vendors', icon: Users, roles: ['admin', 'accountant', 'hr_manager', 'project_manager'] }
    ]
  },
  {
    name: 'CRM & Pipelines',
    icon: Inbox,
    items: [
      { name: 'CRM Dashboard', href: '/dashboard/crm', icon: BarChart3, roles: ['admin', 'project_manager', 'business_development'] },
      { name: 'Client Directory', href: '/dashboard/clients', icon: Users, roles: ['admin', 'project_manager', 'business_development'] },
      { name: 'CRM Inbox', href: '/dashboard/inbox', icon: Inbox, roles: ['admin', 'project_manager', 'business_development'] },
      { name: 'AI Email Composer', href: '/dashboard/inbox/composer', icon: PenTool, roles: ['admin', 'project_manager', 'business_development'] },
      { name: 'Opportunity Forecast', href: '/dashboard/inquiry/forecast', icon: TrendingUp, roles: ['admin', 'project_manager', 'business_development'] },
      { name: 'Inquiry Board', href: '/dashboard/inquiry', icon: Search, roles: ['admin', 'project_manager', 'business_development'] },
      { name: 'Content Manager', href: '/dashboard/content', icon: FileText, roles: ['admin'] }
    ]
  },
  {
    name: 'Analytics & Reports',
    icon: TrendingUp,
    isSingleton: true,
    href: '/dashboard/analytics',
    roles: ['admin', 'hr_manager', 'project_manager', 'accountant'],
    items: []
  },
  {
    name: 'AI Copilot Hub',
    icon: Star,
    isSingleton: true,
    href: '/dashboard/ai-copilot',
    roles: ['admin', 'project_manager', 'hr_manager', 'developer', 'employee', 'intern'],
    items: []
  },
  {
    name: 'Administration Masters',
    icon: Settings,
    items: [
      { name: 'Organization', href: '/dashboard/settings?tab=overview', icon: Building2, roles: ['admin', 'hr_manager'] },
      { name: 'Departments', href: '/dashboard/settings?tab=structure&registry=teams', icon: Layers, roles: ['admin', 'hr_manager'] },
      { name: 'Branches & Locations', href: '/dashboard/settings?tab=structure', icon: MapPin, roles: ['admin', 'hr_manager'] },
      { name: 'Designations', href: '/dashboard/settings?tab=structure&registry=designations', icon: Briefcase, roles: ['admin', 'hr_manager'] },
      { name: 'Grades & Bands', href: '/dashboard/settings?tab=structure&registry=grades', icon: Award, roles: ['admin', 'hr_manager'] },
      { name: 'Employment Types', href: '/dashboard/settings?tab=structure&registry=employmentTypes', icon: ClipboardList, roles: ['admin', 'hr_manager'] },
      { name: 'Legal Entities', href: '/dashboard/settings?tab=company', icon: Shield, roles: ['admin', 'hr_manager'] },
      { name: 'Cost Centres', href: '/dashboard/settings?tab=structure&registry=costCenters', icon: IndianRupee, roles: ['admin', 'hr_manager'] },
      { name: 'Holiday Groups', href: '/dashboard/employees/holidays', icon: Calendar, roles: ['admin', 'hr_manager'] },
      { name: 'Policies', href: '/dashboard/leaves', icon: Calendar, roles: ['admin', 'hr_manager'] },
      { name: 'Shifts', href: '/dashboard/settings?tab=structure&registry=shifts', icon: Clock, roles: ['admin', 'hr_manager'] },
      { name: 'Approval Flows', href: '/dashboard/settings?tab=automation', icon: Play, roles: ['admin', 'hr_manager'] },
      { name: 'Roles & Permissions', href: '/dashboard/settings?tab=users', icon: Users, roles: ['admin', 'hr_manager'] },
      { name: 'Notification Templates', href: '/dashboard/settings?tab=notifications', icon: Bell, roles: ['admin', 'hr_manager'] },
      { name: 'Email Templates', href: '/dashboard/inbox', icon: Inbox, roles: ['admin', 'hr_manager'] },
      { name: 'Document Templates', href: '/dashboard/employees/documents', icon: FileText, roles: ['admin', 'hr_manager'] },
      { name: 'Number Series', href: '/dashboard/settings?tab=invoice', icon: Receipt, roles: ['admin', 'hr_manager'] }
    ]
  },
  {
    name: 'System & Audit',
    icon: Settings,
    items: [
      { name: 'HR Automation Engine', href: '/dashboard/hr-automation', icon: Cpu, roles: ['admin', 'hr_manager'] },
      { name: 'Compliance Operations', href: '/dashboard/employees/compliance', icon: ShieldCheck, roles: ['admin', 'hr_manager'] },
      { name: 'Contract Management', href: '/dashboard/contracts', icon: FileText, roles: ['admin', 'hr_manager'] },
      { name: 'Notification Center', href: '/dashboard/notifications', icon: Bell, roles: ['admin', 'hr_manager'] },
      { name: 'Audit Logs', href: '/dashboard/employees/audit-logs', icon: ScrollText, roles: ['admin'] },
      { name: 'Business Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'] }
    ]
  }
];

export function DashboardSidebar({ user, isMobile = false, onClose, companyName: propsCompanyName }: DashboardSidebarProps) {
  const pathname = usePathname();
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
        return isPathActive(item.href, pathname);
      });
      if (hasActive) {
        updatedOpen[cat.name] = true;
      }
    });
    setOpenCategories((prev) => ({ ...prev, ...updatedOpen }));
  }, [pathname, normalizedRole]);

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

            if (isSingleton) {
              if (catRoles.length > 0 && !catRoles.includes(normalizedRole)) {
                return null;
              }

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
              const itemRoles = item.roles || [];
              if (itemRoles.length === 0) return true;
              return itemRoles.includes(normalizedRole);
            });

            if (visibleItems.length === 0) {
              return null;
            }

            const isOpen = !!openCategories[cat.name];
            const isCatActive = visibleItems.some((item) => isPathActive(item.href, pathname));
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
                        const isActive = isPathActive(item.href, pathname);
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
                      const isActive = isPathActive(item.href, pathname);
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
