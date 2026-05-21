'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Mail, Phone, Building2, Eye } from 'lucide-react';
import { InlineTableSkeleton } from '@/components/ui/dashboard-skeleton';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDashboardType, type UserRole } from '@/lib/permissions';

interface Client {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  industry: string | null;
  status: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pageSize = 10;

  // Guard: prevents the auth + fetch cycle from running more than once
  // (fixes React StrictMode double-invoke and router reference instability)
  const initializedRef = useRef(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/clients?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        // API returns { success, data: [...], meta } for list endpoint
        setClients(Array.isArray(result) ? result : (result.data ?? []));
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, []); // no deps — token is read from localStorage, not state

  useEffect(() => {
    // Prevent double-execution (React StrictMode / hot-reload)
    if (initializedRef.current) return;
    initializedRef.current = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('session_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (getDashboardType(data.user.role as UserRole) !== 'admin') {
          router.push('/dashboard');
          return;
        }
        setAuthorized(true);
        // Single fetch after confirmed auth — no duplicate calls
        fetchClients();
      } catch {
        router.push('/dashboard');
      }
    };

    checkAuth();
  }, [fetchClients, router]); // stable refs — fetchClients is useCallback, router is stable in App Router

  // Reset page on search change — done inline, no extra useEffect needed
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(0);
  };

  const filteredClients = clients.filter((client) => {
    if (!search) return true; // skip filtering entirely when no search term
    const q = search.toLowerCase();
    return (
      client.companyName.toLowerCase().includes(q) ||
      client.contactPerson.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const paginatedClients = filteredClients.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  return (
    <div className="space-y-8">
      {/* Premium Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>CRM Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Strategic Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your corporate accounts, contractual lifecycles, and operational velocity.
          </p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all rounded-lg py-2.5 px-4"
        >
          <Plus className="h-4 w-4" />
          Onboard Client
        </Button>
      </div>

      {/* Advanced Filter Box */}
      <Card className="bg-card/40 backdrop-blur-md border-slate-100 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Client Directory</CardTitle>
              <CardDescription>
                {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} active in system
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, person or email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 focus-visible:ring-indigo-500 rounded-lg text-sm transition-all w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <InlineTableSkeleton rows={5} columns={7} />
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/30 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/60 animate-bounce" />
              <h3 className="mt-4 text-lg font-bold">No clients found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                {search ? 'Try adjusting your search terms to find the client.' : 'Get started by adding your first enterprise client.'}
              </p>
              {!search && (
                <Button onClick={() => setShowAddDialog(true)} variant="outline" className="mt-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50/50">
                  Onboard Your First Client
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Premium Bento/Grid List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedClients.map((client) => (
                  <Card
                    key={client.id}
                    className="group relative overflow-hidden bg-card/60 hover:bg-card border-slate-150 dark:border-slate-800 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 rounded-xl"
                  >
                    {/* Visual Color Bar Indicator */}
                    <div className="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {client.companyName}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium truncate">{client.industry || 'General Sector'}</span>
                          </p>
                        </div>
                        
                        <Badge
                          className={`shadow-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border-none ${
                            client.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {client.status}
                        </Badge>
                      </div>

                      {/* Contact & MSA details card block */}
                      <div className="space-y-3 mb-6 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                            <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Primary Contact</p>
                            <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{client.contactPerson}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{client.email}</p>
                          </div>
                        </div>

                        {client.phone && (
                          <div className="flex items-center gap-3 pt-1">
                            <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
                              <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Phone</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{client.phone}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Open Hub Button */}
                      <Link href={`/dashboard/clients/${client.id}`} className="block">
                        <Button 
                          className="w-full bg-slate-900 hover:bg-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-600 text-white font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-md rounded-lg py-2" 
                          variant="default"
                        >
                          <Eye className="h-4 w-4" />
                          Open Hub
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Beautiful Pagination Footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6 mt-8">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-slate-900 dark:text-white">{currentPage * pageSize + 1}</span>–
                    <span className="font-semibold text-slate-900 dark:text-white">{Math.min((currentPage + 1) * pageSize, filteredClients.length)}</span> of{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">{filteredClients.length}</span> clients
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="rounded-lg"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="rounded-lg"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ClientFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchClients}
      />
    </div>
  );
}

