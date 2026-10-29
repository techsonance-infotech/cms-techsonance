'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, 
  LogOut, 
  Moon, 
  Sun, 
  Menu, 
  Search, 
  Calendar, 
  User as UserIcon, 
  Settings, 
  Clock,
  Sparkles,
  Building,
  Briefcase,
  Loader2,
  ChevronRight,
  Users,
  Wallet,
  Command,
  Bot,
  ShieldCheck,
  Cpu,
  Network,
  TrendingUp,
  HeartHandshake,
  Headphones,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@/lib/auth';
import { useTheme } from 'next-themes';
import { clearClientSession, getStoredSessionToken } from '@/lib/client-session';
import { StatusBadge } from '@/components/ui/status-badge';

interface DashboardHeaderProps {
  user: User;
  onMenuClick?: () => void;
}

export function DashboardHeader({ user, onMenuClick }: DashboardHeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');
  
  // Command Palette State
  const [openPalette, setOpenPalette] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [shortcutLabel, setShortcutLabel] = useState('⌘K');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (!openPalette) {
      setAiResponse(null);
      setIsAiLoading(false);
      setPaletteSearch('');
    }
  }, [openPalette]);

  const handleAiSearch = async () => {
    if (!paletteSearch.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          action: 'chat',
          query: paletteSearch,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiResponse(json.answer || 'No response received from AI.');
      } else {
        setAiResponse('Failed to contact AI Assistant. Please check if model keys are configured.');
      }
    } catch (err) {
      console.error('AI search query failed:', err);
      setAiResponse('An error occurred while communicating with the AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = getStoredSessionToken();
      if (!token) return;
      const res = await fetch('/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch header notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Only poll when tab is active and visible to user, and use a less aggressive 90s interval
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchNotifications();
      }
    }, 90000);
    
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    try {
      const token = getStoredSessionToken();
      await Promise.all(
        unread.map(n =>
          fetch(`/api/notifications?id=${n.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ isRead: true })
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      try {
        const token = getStoredSessionToken();
        await fetch(`/api/notifications?id=${n.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isRead: true })
        });
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    
    if (n.link) {
      router.push(n.link);
    } else {
      router.push('/dashboard/notifications');
    }
  };

  const formatNotificationTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  // Logout routine
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const token = getStoredSessionToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(err => console.error('Sign-out request failed:', err));
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearClientSession();
      // Explicitly remove session cookie
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;';
      router.push('/login');
      router.refresh();
    }
  };

  // Date and Time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Saturday, 23 May 2026 format
      setDateString(now.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }));

      // 09:30 PM format
      setTimeString(now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Shortcut key detection (OS-aware)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      setShortcutLabel(isMac ? '⌘K' : 'Ctrl+K');
    }
  }, []);

  // Global Command Palette Hotkey Listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpenPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close command palette when clicking outside the dialog area anywhere on the page
  useEffect(() => {
    if (!openPalette) return;
    const handleDocumentClick = (e: MouseEvent) => {
      const modalCard = document.getElementById('command-palette-card');
      const searchTrigger = document.getElementById('header-search-trigger');
      
      if (modalCard && !modalCard.contains(e.target as Node) && 
          searchTrigger && !searchTrigger.contains(e.target as Node)) {
        setOpenPalette(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [openPalette]);

  // Fetch all projects & clients from the API for command palette search
  useEffect(() => {
    if (!openPalette) return;

    setPaletteSearch('');
    setSelectedIndex(0);

    const loadPaletteData = async () => {
      try {
        const token = getStoredSessionToken();
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Fetch projects
        const projRes = await fetch('/api/projects?limit=100', { headers });
        if (projRes.ok) {
          const raw = await projRes.json();
          setAllProjects(Array.isArray(raw) ? raw : (raw.data ?? []));
        }

        // Fetch clients
        const clientRes = await fetch('/api/clients?limit=100', { headers });
        if (clientRes.ok) {
          const raw = await clientRes.json();
          setAllClients(Array.isArray(raw) ? raw : (raw.data ?? []));
        }
      } catch (err) {
        console.error('Command Palette fetch failed:', err);
      }
    };

    loadPaletteData();
  }, [openPalette]);

  // Greeting helper
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Command Palette items & actions definition
  const staticItems = [
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'Workspace main overview and KPIs',
      category: 'Navigation',
      icon: Building,
      action: () => router.push('/dashboard')
    },
    {
      id: 'nav-projects',
      title: 'Go to Projects',
      description: 'Kanban board, sprints, and tasks',
      category: 'Navigation',
      icon: Briefcase,
      action: () => router.push('/dashboard/projects')
    },
    {
      id: 'nav-clients',
      title: 'Go to Clients',
      description: 'Customer list and communication panel',
      category: 'Navigation',
      icon: Users,
      action: () => router.push('/dashboard/clients')
    },
    {
      id: 'nav-employees',
      title: 'Go to Employees Roster',
      description: 'Employee details, document vault, and hierarchy',
      category: 'Navigation',
      icon: UserIcon,
      action: () => router.push('/dashboard/employees')
    },
    {
      id: 'nav-reimbursements',
      title: 'Go to Claims & Reimbursements',
      description: 'Submit and approve team expense claims',
      category: 'Navigation',
      icon: Wallet,
      action: () => router.push('/dashboard/reimbursements')
    },
    {
      id: 'nav-requests',
      title: 'Go to Employee Request Center',
      description: 'Submit & approve requests, hardware, leaves & WFH',
      category: 'Navigation',
      icon: Inbox,
      action: () => router.push('/dashboard/employees/requests')
    },
    {
      id: 'nav-service-desk',
      title: 'Go to HR Service Desk',
      description: 'Support tickets, HR cases, KB articles & SLAs',
      category: 'Navigation',
      icon: Headphones,
      action: () => router.push('/dashboard/hr-service-desk')
    },
    {
      id: 'nav-wellness',
      title: 'Go to Employee Wellness Operations',
      description: 'EAP hotline, mental health, pulse surveys & burnout radar',
      category: 'Navigation',
      icon: HeartHandshake,
      action: () => router.push('/dashboard/employees/wellness')
    },
    {
      id: 'nav-compliance',
      title: 'Go to Compliance Operations',
      description: '14 compliance domains, audit findings & CAPA plans',
      category: 'Navigation',
      icon: ShieldCheck,
      action: () => router.push('/dashboard/employees/compliance')
    },
    {
      id: 'nav-automation',
      title: 'Go to HR Automation Engine',
      description: '21 automated triggers, execution logs & AI daily digest',
      category: 'Navigation',
      icon: Cpu,
      action: () => router.push('/dashboard/hr-automation')
    },
    {
      id: 'nav-ai-copilot',
      title: 'Go to AI Copilot Hub',
      description: '19 AI engines, NL Assistant & Fraud Shields',
      category: 'Navigation',
      icon: Bot,
      action: () => router.push('/dashboard/ai-copilot')
    },
    {
      id: 'nav-analytics',
      title: 'Go to Analytics & BI',
      description: '14 operational dashboards, SLAs, WFH & expense trends',
      category: 'Navigation',
      icon: TrendingUp,
      action: () => router.push('/dashboard/analytics')
    },
    {
      id: 'nav-settings',
      title: 'Go to Agency Settings',
      description: 'Organization info, policies, and schemas',
      category: 'Navigation',
      icon: Settings,
      action: () => router.push('/dashboard/settings')
    },
    {
      id: 'action-theme',
      title: 'Toggle Light/Dark Theme',
      description: 'Switch between light and dark visual themes',
      category: 'System Actions',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark')
    },
    {
      id: 'action-logout',
      title: 'Sign Out',
      description: 'Log out of current cockpit session safely',
      category: 'System Actions',
      icon: LogOut,
      action: handleLogout
    }
  ];

  // Dynamic project search filtering
  const filteredProjects = allProjects.filter((p: any) =>
    p.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(paletteSearch.toLowerCase())
  ).map((p: any) => ({
    id: `project-${p.id}`,
    title: p.name,
    description: `Project • Status: ${p.status.toUpperCase()} • ${p.description || 'No description'}`,
    category: 'Projects',
    icon: Briefcase,
    action: () => router.push(`/dashboard/projects`)
  }));

  // Dynamic client search filtering
  const filteredClients = allClients.filter((c: any) =>
    c.companyName.toLowerCase().includes(paletteSearch.toLowerCase()) ||
    (c.contactName || '').toLowerCase().includes(paletteSearch.toLowerCase())
  ).map((c: any) => ({
    id: `client-${c.id}`,
    title: c.companyName,
    description: `Client • Contact: ${c.contactName} • ${c.industry || 'Business Services'}`,
    category: 'Clients',
    icon: Users,
    action: () => router.push(`/dashboard/clients`)
  }));

  // Combine static actions with matching projects & clients
  const matchingItems = [
    ...staticItems.filter(item => 
      item.title.toLowerCase().includes(paletteSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(paletteSearch.toLowerCase())
    ),
    ...filteredProjects,
    ...filteredClients
  ];

  if (paletteSearch.trim().length > 1) {
    matchingItems.unshift({
      id: 'ai-copilot-search',
      title: `Ask AI Copilot: "${paletteSearch}"`,
      description: 'Get natural language insights about employees, payroll, or ask general questions',
      category: 'AI Assistant',
      icon: Sparkles,
      action: () => {
        void handleAiSearch();
      }
    });
  }

  // Reset selected item index whenever search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [paletteSearch]);

  // Handle keyboard navigation inside the palette modal
  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, matchingItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + matchingItems.length) % Math.max(1, matchingItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingItems[selectedIndex]) {
        matchingItems[selectedIndex].action();
        if (matchingItems[selectedIndex].id !== 'ai-copilot-search') {
          setOpenPalette(false);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpenPalette(false);
    }
  };

  return (
    <header className="h-20 border-b bg-card/75 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 transition-all duration-200">
      {/* Left: Greeting + Date Details */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden md:flex flex-col gap-0.5">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5 font-display tracking-tight">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            {getGreeting()}, <span className="text-primary font-bold">{user.firstName}</span>!
          </h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateString || 'Loading date...'}
            </span>
            <span className="h-3 w-px bg-muted" />
            <span className="flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" />
              {timeString}
            </span>
          </div>
        </div>
      </div>

      {/* Center Section: Centered, wide command palette search trigger matching image design */}
      <div className="flex-1 flex justify-center max-w-lg md:max-w-xl lg:max-w-2xl mx-auto w-full px-4">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <input
            id="header-search-trigger"
            type="text"
            placeholder="Search actions, tools, macros, or dashboards..."
            readOnly
            onClick={() => setOpenPalette(true)}
            className="w-full pl-11 pr-16 py-3 text-xs bg-slate-50 dark:bg-zinc-900/60 border border-border/80 dark:border-border/40 rounded-full hover:border-primary/50 dark:hover:border-primary/40 focus:border-primary shadow-xs cursor-pointer select-none transition-all duration-200 text-slate-900 dark:text-zinc-100"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-muted/80 border border-muted-foreground/10 text-[9px] font-mono text-muted-foreground select-none pointer-events-none">
            {shortcutLabel}
          </kbd>
        </div>
      </div>

      {/* Right Actions: Quick actions, Alerts, and Production Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Theme Toggler */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-xl hover:bg-accent/80 transition-colors shrink-0"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => { if (open) { void fetchNotifications(); } }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-accent/80 transition-colors shrink-0">
              <Bell className="h-5 w-5" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border border-background animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2 rounded-xl shadow-2xl border border-muted z-50 bg-card/95 backdrop-blur-md max-h-[450px] overflow-y-auto">
            <div className="flex items-center justify-between p-2 pb-3 border-b border-muted">
              <span className="text-xs font-black text-foreground">In-App Notification Center</span>
              {notifications.some(n => !n.isRead) && (
                <button onClick={markAllRead} className="text-[10px] font-bold text-[#f87941] hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="py-1 divide-y divide-muted/40">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => {
                      void handleNotificationClick(n);
                    }}
                    className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-accent/50 focus:bg-accent/50 cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between w-full font-bold">
                      <span className="text-foreground flex items-center gap-1.5">
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-[#f87941]" />}
                        {n.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">{formatNotificationTime(n.createdAt)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{n.message}</p>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No notifications
                </div>
              )}
            </div>
            <div className="p-2 border-t border-muted text-center">
              <Link href="/dashboard/notifications">
                <span className="text-[10px] font-bold text-[#f87941] hover:underline block cursor-pointer">
                  View All Notifications
                </span>
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="h-6 w-px bg-muted" />

        {/* Production-Ready User Profile Settings Section */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-muted/60 hover:border-primary/50 transition-colors shrink-0">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm font-display shadow-xs overflow-hidden">
                {user.avatarUrl ? (
                  <img 
                    src={(() => {
                      const url = user.avatarUrl;
                      if (url.startsWith('/api/')) {
                        const token = typeof window !== 'undefined' ? getStoredSessionToken() : null;
                        return token ? `${url}&token=${encodeURIComponent(token)}` : url;
                      }
                      return url;
                    })()} 
                    alt={`${user.firstName} ${user.lastName}`} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{user.firstName[0]}{user.lastName[0]}</span>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-2xl border border-muted z-50 bg-card/95 backdrop-blur-md">
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm overflow-hidden">
                  {user.avatarUrl ? (
                    <img 
                      src={(() => {
                        const url = user.avatarUrl;
                        if (url.startsWith('/api/')) {
                          const token = typeof window !== 'undefined' ? getStoredSessionToken() : null;
                          return token ? `${url}&token=${encodeURIComponent(token)}` : url;
                        }
                        return url;
                      })()} 
                      alt={`${user.firstName} ${user.lastName}`} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{user.firstName[0]}{user.lastName[0]}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-muted/60" />
            
            {/* Navigation links inside dropdown */}
            <DropdownMenuItem asChild className="p-2.5 rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <Link href="/dashboard/profile" className="flex items-center gap-2 w-full text-xs font-medium">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="p-2.5 rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <Link href="/dashboard/settings" className="flex items-center gap-2 w-full text-xs font-medium">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Agency Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="p-2.5 rounded-lg hover:bg-accent cursor-pointer transition-colors">
              <Link href="/dashboard" className="flex items-center gap-2 w-full text-xs font-medium">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>Workspace Hub</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-muted/60" />
            
            <DropdownMenuItem 
              onClick={handleLogout} 
              disabled={loggingOut}
              className="p-2.5 rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/20 dark:focus:text-red-400 cursor-pointer font-medium transition-colors text-xs flex items-center gap-2"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <LogOut className="h-4 w-4 shrink-0" />
              )}
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    {/* Global Command Palette Modal */}
    {openPalette && (
      <div 
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200"
        onClick={() => setOpenPalette(false)}
      >
        <div 
          id="command-palette-card"
          className="bg-card/95 border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden backdrop-blur-md flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Area */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border/60">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              placeholder="Search resources, actions, pages..."
              value={paletteSearch}
              onChange={(e) => setPaletteSearch(e.target.value)}
              onKeyDown={handlePaletteKeyDown}
              className="w-full bg-transparent border-none outline-none text-sm placeholder-muted-foreground focus:ring-0 text-slate-900 dark:text-white"
            />
            <span className="px-2 py-0.5 rounded bg-muted/80 border border-muted-foreground/10 text-[10px] font-mono text-muted-foreground select-none">
              ESC
            </span>
          </div>

          {/* Scrollable Results List */}
          <div className="overflow-y-auto p-2 space-y-4 max-h-[50vh]">
            {isAiLoading && (
              <div className="py-12 px-6 flex flex-col items-center justify-center gap-4">
                <Sparkles className="h-10 w-10 text-primary animate-spin" />
                <div className="space-y-2 text-center w-full max-w-md">
                  <div className="h-4 bg-muted/80 animate-pulse rounded-full w-3/4 mx-auto" />
                  <div className="h-3 bg-muted/80 animate-pulse rounded-full w-1/2 mx-auto" />
                  <div className="h-3 bg-muted/80 animate-pulse rounded-full w-2/3 mx-auto" />
                </div>
                <span className="text-xs font-bold text-muted-foreground animate-pulse">Consulting AI Knowledge Base...</span>
              </div>
            )}

            {!isAiLoading && aiResponse && (
              <div className="p-3 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-muted">
                  <Sparkles className="h-4 w-4 text-[#f87941]" />
                  <span className="text-xs font-black text-foreground">AI Copilot Answer</span>
                  <button 
                    onClick={() => {
                      setAiResponse(null);
                      setSelectedIndex(0);
                    }}
                    className="ml-auto text-[10px] font-bold text-[#f87941] hover:underline"
                  >
                    Clear Answer
                  </button>
                </div>
                <div className="text-xs leading-relaxed text-slate-800 dark:text-zinc-200 bg-muted/30 p-4 rounded-xl border border-muted/80 whitespace-pre-wrap font-medium">
                  {aiResponse}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] h-8 rounded-lg font-bold"
                    onClick={() => {
                      void navigator.clipboard.writeText(aiResponse);
                    }}
                  >
                    Copy Response
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] h-8 rounded-lg font-bold ml-auto"
                    onClick={() => {
                      setAiResponse(null);
                      setSelectedIndex(0);
                    }}
                  >
                    Back to Search
                  </Button>
                </div>
              </div>
            )}

            {!isAiLoading && !aiResponse && (
              <>
                {/* Grouped results */}
                {matchingItems.length > 0 ? (
                  <div className="space-y-1">
                    {Array.from(new Set(matchingItems.map(item => item.category))).map(category => {
                      const categoryItems = matchingItems.filter(item => item.category === category);
                      return (
                        <div key={category} className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-3 mt-3 mb-1">
                            {category}
                          </div>
                          {categoryItems.map(item => {
                            const index = matchingItems.indexOf(item);
                            const ItemIcon = item.icon;
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  item.action();
                                  if (item.id !== 'ai-copilot-search') {
                                    setOpenPalette(false);
                                  }
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors duration-150 ${
                                  index === selectedIndex 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'text-slate-700 dark:text-zinc-300 hover:bg-accent/40'
                                }`}
                              >
                                <div className={`p-2 rounded-lg ${
                                  index === selectedIndex ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
                                } transition-colors`}>
                                  <ItemIcon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold truncate">{item.title}</span>
                                  {item.description && (
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[450px]">
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                                {index === selectedIndex && (
                                  <span className="ml-auto text-[10px] text-primary font-bold flex items-center gap-0.5 animate-in slide-in-from-right-1 duration-150">
                                    Select <ChevronRight className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Command className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
                    <span className="font-bold">No results found for "{paletteSearch}"</span>
                    <span>Try typing another query or look for navigation pages</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer help guide */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-zinc-800/80 bg-muted/10 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
            <div className="flex items-center gap-4">
              <span>↑↓ to navigate</span>
              <span>↵ to select</span>
              <span>esc to close</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[9px] bg-muted/50 px-2 py-0.5 rounded border border-muted-foreground/10">
              <Command className="h-3 w-3" /> {shortcutLabel}
            </div>
          </div>
        </div>
      </div>
    )}
  </header>
  );
}
