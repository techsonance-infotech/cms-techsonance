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
  Loader2
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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Project Search handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    setShowResults(true);

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/projects?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const projects = Array.isArray(data) ? data : (data.data ?? []);
        
        // Match query against project name or description
        const filtered = projects.filter((p: any) => 
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.description || '').toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 5));
      }
    } catch (err) {
      console.error('Global search fetch failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Greeting helper
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
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

      {/* Right: Search UI + Quick Actions + User Menu grouped together in ml-auto to prevent massive gaps */}
      <div className="flex items-center gap-4 ml-auto w-full max-w-xl md:max-w-2xl justify-end">
        {/* Global Project Search UI with Popup Results */}
        <div ref={searchContainerRef} className="relative w-full max-w-[180px] sm:max-w-xs md:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              className="pl-9 pr-4 py-1.5 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border-muted/80 rounded-xl transition-all duration-200 w-full"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Floating results overlay */}
          {showResults && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 border border-muted rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-muted bg-muted/10 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Global Projects</span>
                <span className="text-[10px] text-muted-foreground font-mono">{searchResults.length} matches</span>
              </div>
              <div className="p-1 max-h-64 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1">
                    <Briefcase className="h-8 w-8 text-muted-foreground/30" />
                    <span>No matching projects found</span>
                  </div>
                ) : (
                  searchResults.map((project) => (
                    <Link 
                      key={project.id} 
                      href={`/dashboard/projects`} 
                      onClick={() => setShowResults(false)}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/80 transition-colors cursor-pointer group">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {project.name}
                          </span>
                          {project.description && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                              {project.description}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={project.status} className="scale-90" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
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
    </div>
  </header>
  );
}
