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
  Command
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
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

  // Logout routine
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const token = getStoredSessionToken();
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      clearClientSession();
      router.push('/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
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
        const token = localStorage.getItem('session_token');
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
      id: 'nav-team',
      title: 'Go to Team Roster',
      description: 'Employee details, document vault, and hierarchy',
      category: 'Navigation',
      icon: UserIcon,
      action: () => router.push('/dashboard/team')
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
        setOpenPalette(false);
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
        <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
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
        <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-accent/80 transition-colors shrink-0">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border border-background animate-pulse" />
        </Button>

        <span className="h-6 w-px bg-muted" />

        {/* Production-Ready User Profile Settings Section */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-muted/60 hover:border-primary/50 transition-colors shrink-0">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm font-display shadow-xs">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-2xl border border-muted z-50 bg-card/95 backdrop-blur-md">
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {user.firstName[0]}{user.lastName[0]}
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
              <LogOut className="h-4 w-4 shrink-0" />
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
            {/* Grouped results */}
            {matchingItems.length > 0 && (
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
                              setOpenPalette(false);
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
            )}

            {matchingItems.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Command className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
                <span className="font-bold">No results found for "{paletteSearch}"</span>
                <span>Try typing another query or look for navigation pages</span>
              </div>
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
