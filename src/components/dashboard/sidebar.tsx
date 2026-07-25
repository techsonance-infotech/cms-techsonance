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
  ChevronRight,
  ChevronLeft,
  Network,
  Star,
  Upload,
  ScrollText,
  Contact,
  BadgeCheck,
  BarChart3,
  UserPlus,
} from 'lucide-react';
import { User } from '@/lib/auth';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardSidebarProps {
  user: User;
  isMobile?: boolean;
  onClose?: () => void;
  companyName?: string | null;
}

function normalizeRole(role: string) {
  if (!role) return 'client';
  const canonical = role.trim().toLowerCase().replace(/[\s-]+/g, '_');

  switch (canonical) {
    case 'superadmin':
    case 'super_admin':
    case 'admin':
    case 'owner':
    case 'business_owner':
    case 'tenant_owner':
    case 'ceo':
    case 'cto':
    case 'director':
    case 'cms_administrator':
    case 'management':
      return 'admin';
    case 'manager':
    case 'project_manager':
    case 'business_analyst':
    case 'scrum_master':
      return 'project_manager';
    case 'hr':
    case 'hr_manager':
      return 'hr_manager';
    case 'accountant':
    case 'finance':
      return 'accountant';
    case 'business_development':
    case 'sales':
    case 'sales_manager':
      return 'business_development';
    case 'viewer':
    case 'client':
    case 'guest':
      return 'client';
    default:
      // Developers, QA, DevOps, designers, etc.
      return 'developer';
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
    roles: ['admin', 'project_manager', 'developer', 'client', 'hr_manager', 'accountant', 'business_development'],
    items: []
  },
  {
    name: 'Employees',
    icon: Users,
    items: [
      { name: 'Workforce Dashboard', href: '/dashboard/employees', icon: BarChart3, roles: ['admin', 'project_manager', 'hr_manager'] },
      { name: 'Employee Directory', href: '/dashboard/employees/directory', icon: Contact, roles: ['admin', 'project_manager', 'hr_manager', 'developer'] },
      { name: 'Add Employee', href: '/dashboard/employees/new', icon: UserPlus, roles: ['admin', 'hr_manager'] },
      { name: 'Org Chart', href: '/dashboard/employees/org-chart', icon: Network, roles: ['admin', 'project_manager', 'developer', 'hr_manager', 'accountant', 'business_development'] },
      { name: 'Reviews & Appraisals', href: '/dashboard/employees/reviews', icon: Star, roles: ['admin', 'project_manager', 'hr_manager'] },
      { name: 'Bulk Import', href: '/dashboard/employees/import', icon: Upload, roles: ['admin', 'hr_manager'] },
      { name: 'Audit Logs', href: '/dashboard/employees/audit-logs', icon: ScrollText, roles: ['admin'] },
    ]
  },
  {
    name: 'HR Operations',
    icon: BadgeCheck,
    items: [
      { name: 'Attendance Register', href: '/dashboard/attendance', icon: Clock, roles: ['admin', 'project_manager', 'developer', 'hr_manager', 'client'] },
      { name: 'Leaves & Time Off', href: '/dashboard/leaves', icon: Calendar, roles: ['admin', 'project_manager', 'developer', 'hr_manager', 'client'] },
      { name: 'Daily Updates', href: '/dashboard/daily-update', icon: ClipboardList, roles: ['admin', 'project_manager', 'developer'] },
      { name: 'Reimbursements', href: '/dashboard/reimbursements', icon: Receipt, roles: ['admin', 'project_manager', 'developer', 'hr_manager', 'accountant'] },
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
      { name: 'Client Directory', href: '/dashboard/clients', icon: Users, roles: ['admin', 'project_manager', 'business_development'] },
      { name: 'CRM Inbox', href: '/dashboard/inbox', icon: Inbox, roles: ['admin', 'project_manager', 'developer', 'client', 'business_development'] },
      { name: 'AI Email Composer', href: '/dashboard/inbox/composer', icon: PenTool, roles: ['admin', 'project_manager', 'business_development'] },
      { name: 'Opportunity Forecast', href: '/dashboard/inquiry/forecast', icon: TrendingUp, roles: ['admin', 'project_manager', 'business_development'] },
      { name: 'Inquiry Board', href: '/dashboard/inquiry', icon: Search, roles: ['admin', 'project_manager', 'business_development', 'developer', 'hr_manager', 'accountant', 'client'] },
    ]
  },
  {
    name: 'Finance Suite',
    icon: DollarSign,
    items: [
      { name: 'Finance Control', href: '/dashboard/finance', icon: DollarSign, roles: ['admin', 'accountant'] },
      { name: 'Financial Executive', href: '/dashboard/finance/executive', icon: DollarSign, roles: ['admin', 'accountant'] },
      { name: 'Invoices & Billing', href: '/dashboard/finance/invoices', icon: Receipt, roles: ['admin', 'accountant', 'project_manager'] },
      { name: 'Payroll & Salary', href: '/dashboard/payroll', icon: Wallet, roles: ['admin', 'accountant', 'hr_manager'] },
      { name: 'Project Financials', href: '/dashboard/projects/financials', icon: DollarSign, roles: ['admin', 'project_manager', 'accountant'] },
    ]
  },
  {
    name: 'Operations & Tickets',
    icon: HelpCircle,
    items: [
      { name: 'Service Tickets', href: '/dashboard/service', icon: HelpCircle, roles: ['admin', 'project_manager', 'developer', 'client'] },
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
      { name: 'Retail Inventory', href: '/dashboard/retail/inventory', icon: ClipboardList, roles: ['admin', 'project_manager'] },
      { name: 'Safety Reorder', href: '/dashboard/retail/inventory/reorder', icon: ClipboardList, roles: ['admin', 'project_manager'] },
      { name: 'Store Operations', href: '/dashboard/retail/stores', icon: Building2, roles: ['admin', 'project_manager'] },
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
      { name: 'Network Telemetry', href: '/dashboard/service/network', icon: Wifi, roles: ['admin', 'project_manager', 'developer'] },
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
            <span className="font-bold text-sm text-white tracking-tight leading-snug flex-1 select-none animate-in fade-in duration-300">
              {companyName}
            </span>
          )}
        </div>

      <nav className={cn(
        "flex-1 overflow-y-auto space-y-1 transition-all duration-300",
        activeCollapsed ? "p-3 flex flex-col items-center" : "p-4"
      )}>
        {categories.map((cat) => {
          if (cat.isSingleton) {
            const hasRole = cat.roles?.includes(normalizedRole);
            if (!hasRole) return null;
            const CatIcon = cat.icon;
            const isActive = pathname === cat.href;

            const itemContent = (
              <Link
                href={cat.href || '#'}
                onClick={() => isMobile && onClose?.()}
                className={cn(
                  'flex items-center rounded-xl text-sm font-semibold transition-all duration-150',
                  activeCollapsed ? 'h-10 w-10 justify-center' : 'w-full gap-3 px-3.5 py-2.5',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
                )}
              >
                <CatIcon className={cn('h-5 w-5 shrink-0', isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60')} />
                {!activeCollapsed && <span>{cat.name}</span>}
              </Link>
            );

            return (
              <div key={cat.name} className="w-full space-y-1">
                {activeCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {itemContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                      {cat.name}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  itemContent
                )}
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

          const categoryTrigger = (
            <button
              className={cn(
                'flex items-center justify-center rounded-xl transition-all duration-150 h-10 w-10 mx-auto outline-none',
                isCatActive
                  ? 'text-sidebar-primary-foreground bg-sidebar-primary/50 font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary-foreground'
              )}
            >
              <CatIcon className={cn('h-5 w-5 shrink-0', isCatActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60')} />
            </button>
          );

          if (activeCollapsed) {
            return (
              <div key={cat.name} className="w-full space-y-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="w-full cursor-pointer">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {categoryTrigger}
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          {cat.name}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    sideOffset={12}
                    className="w-56 p-2 rounded-xl shadow-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3 py-1.5 text-xs font-bold text-sidebar-foreground/50 border-b border-sidebar-border mb-1 select-none font-sans">
                      {cat.name}
                    </div>
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
                            <span>{item.name}</span>
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
                          onClick={() => isMobile && onClose?.()}
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

      <div className={cn("border-t border-sidebar-border transition-all duration-300", activeCollapsed ? "p-3" : "p-4")}>
        {activeCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/profile"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f87941] text-white font-bold text-sm shadow-sm mx-auto hover:scale-105 transition-transform duration-150"
              >
                {user.firstName[0]}{user.lastName[0]}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              <div className="text-left font-sans">
                <p className="font-semibold">{user.firstName} {user.lastName}</p>
                <p className="text-[10px] text-primary-foreground/75 capitalize">{normalizedRole.replaceAll('_', ' ')}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link
            href="/dashboard/profile"
            onClick={() => isMobile && onClose?.()}
            className="flex items-center gap-3 p-2 hover:bg-sidebar-accent rounded-xl transition-all duration-150"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f87941] text-white font-bold text-sm shadow-sm">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0 font-sans">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                {normalizedRole.replaceAll('_', ' ')}
              </p>
            </div>
          </Link>
        )}
      </div>
    </aside>
    </TooltipProvider>
  );
}
