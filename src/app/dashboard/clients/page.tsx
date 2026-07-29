'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Building2 } from 'lucide-react';
import { InlineTableSkeleton } from '@/components/ui/dashboard-skeleton';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { useRouter } from 'next/navigation';
import { getDashboardType, type UserRole } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EntityCard } from '@/components/ui/entity-card';
import { getStoredSessionToken, getStoredUser } from '@/lib/client-session';

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
  const pageSize = 9; // Grid friendly size

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
        setClients(Array.isArray(result) ? result : (result.data ?? []));
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const token = getStoredSessionToken();
    const user = getStoredUser();
    const role = user?.role as UserRole;
    
    if (!token || !role) {
      router.push('/login');
      return;
    }

    setAuthorized(true);
    fetchClients();
  }, [router, fetchClients]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(0);
  };

  if (!authorized) {
    return <InlineTableSkeleton rows={5} columns={7} />;
  }

  const filteredClients = clients.filter((client) => {
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
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your client relationships, details, and active billing contacts."
        actions={[
          <Button key="add" onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-primary/95 text-white font-bold border-none">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        ]}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clients' }]}
      />

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Client Profiles</CardTitle>
            <CardDescription>
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} recorded in directory
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name or contact..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-card/60 backdrop-blur-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-4">
          {loading ? (
            <InlineTableSkeleton rows={5} columns={7} />
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-16 bg-card/30 rounded-2xl border border-dashed border-muted">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30 animate-pulse" />
              <h3 className="mt-4 text-lg font-semibold">No clients found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? 'Try adjusting your search criteria' : 'Add your first client profile to get started'}
              </p>
              {!search && (
                <Button onClick={() => setShowAddDialog(true)} variant="outline" className="mt-4 border-primary text-primary hover:bg-primary/10 font-bold">
                  Onboard Your First Client
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedClients.map((client) => (
                  <EntityCard
                    key={client.id}
                    title={client.companyName}
                    subtitle={client.industry || 'General Sector'}
                    badge={<StatusBadge status={client.status} />}
                    metadata={[
                      { label: 'Primary Contact', value: client.contactPerson },
                      { label: 'Email', value: client.email },
                    ]}
                    href={`/dashboard/clients/${client.id}`}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-muted/30 pt-6 mt-6">
                  <p className="text-xs text-muted-foreground">
                    Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filteredClients.length)} of {filteredClients.length} clients
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
