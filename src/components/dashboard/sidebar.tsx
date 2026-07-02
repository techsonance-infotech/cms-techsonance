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
  DollarSign,
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
  ChevronRight
} from 'lucide-react';
import { User } from '@/lib/auth';

interface DashboardSidebarProps {
  user: User;
}

function normalizeRole(role: string) {
  const value = role.trim();
  const canonical = value.toLowerCase();

  switch (canonical) {
    case 'superadmin':
    case 'admin':
      return 'admin';
    case 'manager':
      return 'project_manager';
    case 'employee':
      return 'developer';
    case 'viewer':
      return 'client';
    default:
      return canonical;
  }
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
}

interface NavCategory {
  name: string;
  icon: any;
  items: NavItem[];
  isSingleton?: boolean;
  href?: string;
  roles?: string[];
}

const categories: NavCategory[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    isSingleton: true,
    href: '/dashboard',
    roles: ['admin', 'project_manager', 'developer', 'client'],
    items: []
  },
  {
    name: 'HR & Collaboration',
    icon: Users,
    items: [
      { name: 'Team Directory', href: '/dashboard/team', icon: UserCog, roles: ['admin'] },
      { name: 'Attendance Register', href: '/dashboard/attendance', icon: Clock, roles: ['admin', 'project_manager', 'developer', 'client'] },
      { name: 'Leaves & Time Off', href: '/dashboard/leaves', icon: Calendar, roles: ['admin', 'project_manager', 'developer', 'client'] },
      { name: 'Daily Updates', href: '/dashboard/daily-update', icon: ClipboardList, roles: ['admin', 'project_manager', 'developer'] },
      { name: 'Reimbursements', href: '/dashboard/reimbursements', icon: Receipt, roles: ['admin', 'hr_manager', 'cms_administrator', 'project_manager', 'business_development', 'developer', 'qa_engineer', 'devops_engineer', 'ui_ux_designer', 'digital_marketing', 'business_analyst'] },
    ]
  },
  {
    name: 'Projects & Tasks',
    icon: FolderKanban,
    items: [
      { name: 'Active Projects', href: '/dashboard/projects', icon: FolderKanban, roles: ['admin', 'project_manager', 'developer'] },
      { name: 'Task Board', href: '/dashboard/tasks', icon: Kanban, roles: ['admin', 'project_manager', 'developer'] },
      { name: 'Sprint Planner', href: '/dashboard/tasks/sprint-planning', icon: Kanban, roles: ['admin', 'project_manager', 'developer'] },
    ]
  },
  {
    name: 'CRM & Pipelines',
    icon: Inbox,
    items: [
      { name: 'Client Directory', href: '/dashboard/clients', icon: Users, roles: ['admin'] },
      { name: 'CRM Inbox', href: '/dashboard/inbox', icon: Inbox, roles: ['admin', 'project_manager', 'developer', 'client'] },
      { name: 'AI Email Composer', href: '/dashboard/inbox/composer', icon: PenTool, roles: ['admin', 'project_manager', 'developer'] },
      { name: 'Opportunity Forecast', href: '/dashboard/inquiry/forecast', icon: TrendingUp, roles: ['admin', 'project_manager', 'developer'] },
      { name: 'Inquiry Board', href: '/dashboard/inquiry', icon: Search, roles: ['admin', 'project_manager', 'business_development', 'developer', 'hr_manager', 'employee', 'cms_administrator', 'qa_engineer', 'devops_engineer', 'ui_ux_designer', 'digital_marketing', 'business_analyst'] },
    ]
  },
  {
    name: 'Finance Suite',
    icon: DollarSign,
    items: [
      { name: 'Finance Control', href: '/dashboard/finance', icon: DollarSign, roles: ['admin'] },
      { name: 'Financial Executive', href: '/dashboard/finance/executive', icon: DollarSign, roles: ['admin'] },
      { name: 'Invoices & Billing', href: '/dashboard/finance/invoices', icon: Receipt, roles: ['admin'] },
      { name: 'Payroll & Salary', href: '/dashboard/payroll', icon: Wallet, roles: ['admin'] },
      { name: 'Project Financials', href: '/dashboard/projects/financials', icon: DollarSign, roles: ['admin', 'project_manager'] },
    ]
  },
  {
    name: 'Operations & Tickets',
    icon: HelpCircle,
    items: [
      { name: 'Service Tickets', href: '/dashboard/service', icon: HelpCircle, roles: ['admin', 'project_manager', 'developer'] },
      { name: 'Ticket Workspace', href: '/dashboard/service/workspace', icon: ClipboardList, roles: ['admin', 'project_manager', 'developer'] },
      { name: 'Field Command Center', href: '/dashboard/service/command-center', icon: Map, roles: ['admin', 'project_manager', 'developer'] },
      { name: 'Support Dossier', href: '/dashboard/support', icon: HelpCircle, roles: ['admin', 'project_manager', 'developer', 'client'] },
      { name: 'Support Analytics', href: '/dashboard/support/analytics', icon: Activity, roles: ['admin', 'project_manager'] },
      { name: 'Help Desk Queue', href: '/dashboard/help-desk', icon: HelpCircle, roles: ['admin', 'project_manager', 'developer'] },
      { name: 'Agent Dashboard', href: '/dashboard/help-desk/agent', icon: HelpCircle, roles: ['admin', 'project_manager', 'developer'] },
    ]
  },
  {
    name: 'Industry Verticals',
    icon: Building2,
    items: [
      { name: 'Academic Curriculum', href: '/dashboard/education/curriculum', icon: BookOpen, roles: ['admin', 'project_manager'] },
      { name: 'Student Management', href: '/dashboard/education/students', icon: GraduationCap, roles: ['admin', 'project_manager'] },
      { name: 'Retail Inventory', href: '/dashboard/retail/inventory', icon: ClipboardList, roles: ['admin'] },
      { name: 'Safety Reorder', href: '/dashboard/retail/inventory/reorder', icon: ClipboardList, roles: ['admin'] },
      { name: 'Store Operations', href: '/dashboard/retail/stores', icon: Building2, roles: ['admin'] },
      { name: 'Construction BOQ', href: '/dashboard/construction/boq', icon: Building2, roles: ['admin', 'project_manager'] },
      { name: 'Construction RFIs', href: '/dashboard/construction/rfis', icon: FolderKanban, roles: ['admin', 'project_manager'] },
      { name: 'Gym Analytics', href: '/dashboard/service/gym-analytics', icon: Dumbbell, roles: ['admin', 'project_manager'] },
      { name: 'Gym Trainer Control', href: '/dashboard/service/gym-trainer', icon: CalendarDays, roles: ['admin', 'project_manager'] },
    ]
  },
  {
    name: 'Telemetry & Security',
    icon: Shield,
    items: [
      { name: 'Network Telemetry', href: '/dashboard/service/network', icon: Wifi, roles: ['admin', 'project_manager'] },
      { name: 'Security Monitor', href: '/dashboard/service/security-monitor', icon: Shield, roles: ['admin'] },
    ]
  },
  {
    name: 'System Settings',
    icon: Settings,
    items: [
      { name: 'Global Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
      { name: 'Security Command', href: '/dashboard/settings/security', icon: Shield, roles: ['admin'] },
      { name: 'Automation Builder', href: '/dashboard/settings/automation-builder', icon: Settings, roles: ['admin'] },
      { name: 'Content Manager', href: '/dashboard/content', icon: FileText, roles: ['admin'] },
    ]
  }
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const normalizedRole = normalizeRole(user.role);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [companyName, setCompanyName] = useState('TechSonance InfoTech');

  useEffect(() => {
    async function fetchCompanyName() {
      try {
        const response = await fetch('/api/company-settings');
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.data?.companyName) {
            setCompanyName(resData.data.companyName);
          }
        }
      } catch (err) {
        console.error('Failed to load company name in sidebar:', err);
      }
    }
    fetchCompanyName();
  }, []);

  useEffect(() => {
    const updatedOpen: Record<string, boolean> = {};
    categories.forEach((cat) => {
      const hasActive = cat.items.some((item) => {
        const itemRoles = item.roles || [];
        if (!itemRoles.includes(normalizedRole)) return false;
        return pathname === item.href || pathname.startsWith(item.href + '/');
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
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-full">
      <div className="flex items-center gap-3 h-16 px-6 border-b border-sidebar-border">
        <div className="relative h-9 w-9 bg-white rounded-xl p-1 flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden shrink-0">
          <Image src="/logo-icon.png" alt="TechSonance" fill className="object-contain p-1" />
        </div>
        <span className="font-bold text-base text-sidebar-foreground tracking-tight">{companyName}</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {categories.map((cat) => {
          if (cat.isSingleton) {
            const hasRole = cat.roles?.includes(normalizedRole);
            if (!hasRole) return null;
            const CatIcon = cat.icon;
            const isActive = pathname === cat.href;

            return (
              <div key={cat.name} className="space-y-1">
                <Link
                  href={cat.href || '#'}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
                  )}
                >
                  <CatIcon className={cn('h-5 w-5', isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60')} />
                  <span>{cat.name}</span>
                </Link>
              </div>
            );
          }

          const visibleItems = cat.items.filter((item) =>
            item.roles.includes(normalizedRole)
          );

          if (visibleItems.length === 0) return null;

          const isOpen = !!openCategories[cat.name];
          const CatIcon = cat.icon;

          // Check if any visible item inside this category is active
          const isCatActive = visibleItems.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + '/')
          );

          return (
            <div key={cat.name} className="space-y-1">
              <button
                onClick={() => toggleCategory(cat.name)}
                className={cn(
                  'w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                  isCatActive
                    ? 'text-sidebar-primary-foreground bg-sidebar-primary/50 font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <CatIcon className={cn('h-5 w-5', isCatActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60')} />
                  <span>{cat.name}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-sidebar-foreground/50" />
                )}
              </button>

              {isOpen && (
                <ul className="pl-4 space-y-1 border-l border-sidebar-border ml-6 py-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const ItemIcon = item.icon;

                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150',
                            isActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                              : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
                          )}
                        >
                          <ItemIcon className={cn('h-4 w-4 shrink-0', isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/50')} />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Link href="/dashboard/profile" className="flex items-center gap-3 p-2 hover:bg-sidebar-accent rounded-xl transition-all duration-150">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f87941] text-white font-bold text-sm shadow-sm">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
              {normalizedRole.replaceAll('_', ' ')}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
