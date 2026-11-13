'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { PageHeaderSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  IndianRupee, 
  Calendar, 
  RefreshCw, 
  Edit3, 
  CheckCircle, 
  Mail, 
  Phone, 
  Briefcase, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { getStoredSessionToken } from '@/lib/client-session';

export default function OfferWorkspacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Edit Offer Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [editSalary, setEditSalary] = useState<number | string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchOffers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/recruitment/offers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setOffers(json.data || []);
      } else {
        toast.error('Failed to load offer logs.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load offer logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleUpdateStatus = async (offerId: string, status: string) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/recruitment/offers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          offerId,
          status
        })
      });

      if (res.ok) {
        toast.success(
          status === 'Accepted'
            ? 'Offer accepted! Candidate promoted to Preboarding.'
            : `Offer status updated to: ${status}`
        );
        fetchOffers();
      } else {
        toast.error('Failed to update offer workflow.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error executing offer update.');
    }
  };

  const handleOpenEdit = (offer: any) => {
    setSelectedOffer(offer);
    setEditSalary(offer.base_salary || 0);
    setEditDate(offer.joining_date ? offer.joining_date.split('T')[0] : '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    setUpdating(true);
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/recruitment/offers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          offerId: selectedOffer.id,
          baseSalary: Number(editSalary),
          joiningDate: editDate
        })
      });

      if (res.ok) {
        toast.success('Offer terms successfully updated!');
        setEditModalOpen(false);
        fetchOffers();
      } else {
        toast.error('Failed to update offer terms.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating offer terms.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOffers = offers.filter((offer) => {
    if (statusFilter === 'ALL') return true;
    return offer.status === statusFilter;
  });

  const pendingCount = offers.filter((o) => o.status === 'Pending Approval').length;
  const approvedCount = offers.filter((o) => o.status === 'Approved').length;
  const acceptedCount = offers.filter((o) => o.status === 'Accepted').length;

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-foreground p-1 border-t border-border">
      
      {/* Header */}
      <PageHeader 
        title="Offer Approvals"
        description="Verify comp structures, sign NDA/MSA letters, and trigger employee preboarding schedules."
        actions={[
          <Button 
            key="refresh" 
            variant="outline" 
            size="sm"
            onClick={() => fetchOffers(true)}
            disabled={refreshing}
            className="border-border text-foreground font-semibold hover:bg-accent flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>,
          <Button 
            key="kanban" 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard/recruitment/kanban')}
            className="border-border text-foreground font-semibold hover:bg-accent flex items-center gap-1.5"
          >
            Kanban Board
          </Button>,
          <Button 
            key="back" 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard/recruitment')}
            className="border-border text-foreground font-bold hover:bg-accent"
          >
            Dashboard
          </Button>
        ]}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recruitment', href: '/dashboard/recruitment' }, { label: 'Offer Management' }]}
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <Button 
          variant={statusFilter === 'ALL' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setStatusFilter('ALL')}
          className="text-xs font-bold rounded-lg h-8"
        >
          All Offers ({offers.length})
        </Button>
        <Button 
          variant={statusFilter === 'Pending Approval' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setStatusFilter('Pending Approval')}
          className="text-xs font-bold rounded-lg h-8 flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Pending Approval ({pendingCount})
        </Button>
        <Button 
          variant={statusFilter === 'Approved' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setStatusFilter('Approved')}
          className="text-xs font-bold rounded-lg h-8 flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Approved ({approvedCount})
        </Button>
        <Button 
          variant={statusFilter === 'Accepted' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setStatusFilter('Accepted')}
          className="text-xs font-bold rounded-lg h-8 flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Accepted / Preboarding ({acceptedCount})
        </Button>
      </div>

      {/* Offers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOffers.map((offer) => {
          const app = offer.job_applications;
          const candidate = app?.candidate_profiles;
          const requisition = app?.job_requisitions;
          if (!candidate) return null;
          
          return (
            <Card key={offer.id} className="border border-border/60 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow bg-card rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                    Salary Pack
                  </Badge>
                  <Badge className={`px-2.5 py-0.5 rounded-full border-none text-[9px] font-black uppercase tracking-wider ${
                    offer.status === 'Accepted'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : offer.status === 'Approved'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      : offer.status === 'Pending Approval'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {offer.status}
                  </Badge>
                </div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span>Offer letter - {candidate.first_name} {candidate.last_name}</span>
                </CardTitle>
                <CardDescription className="text-xs mt-1 space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{requisition?.title || 'General Vacancy'}</span>
                    {requisition?.department && (
                      <span className="text-muted-foreground font-normal">({requisition.department})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-[11px] pt-1">
                    {candidate.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {candidate.email}
                      </span>
                    )}
                    {candidate.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {candidate.phone}
                      </span>
                    )}
                    {app?.match_score && (
                      <Badge variant="outline" className="text-[10px] font-bold py-0 h-4 border-emerald-500/30 text-emerald-600">
                        {app.match_score}% Match
                      </Badge>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-5 pt-4">
                
                {/* Financial and Date details */}
                <div className="grid grid-cols-2 gap-4 bg-accent/40 rounded-xl p-4 border border-border/40 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5 text-primary" /> Base Compensation
                    </span>
                    <p className="font-extrabold text-foreground text-sm">
                      ₹{Number(offer.base_salary || 0).toLocaleString('en-IN')}/yr
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> Joining Date
                    </span>
                    <p className="font-extrabold text-foreground text-sm">
                      {offer.joining_date 
                        ? new Date(offer.joining_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
                        : 'Immediate'}
                    </p>
                  </div>
                </div>

                {/* Multi-tier Approval checklists */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Workflow Approval Checklist
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {(offer.approval_chain || []).filter((n: any) => n.status === 'Approved').length} of {(offer.approval_chain || []).length} completed
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(offer.approval_chain || []).map((appNode: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-semibold p-2 border border-border/40 bg-background/50 rounded-lg">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          {appNode.approver} signoff
                        </span>
                        <Badge className={`border-none text-[8px] font-black uppercase px-2 py-0.5 ${
                          appNode.status === 'Approved' 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}>
                          {appNode.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-border flex flex-wrap gap-2">
                  {offer.status === 'Pending Approval' && (
                    <Button 
                      className="bg-primary hover:bg-primary/95 text-white font-bold text-xs py-1.5 flex-1 border-none shadow-sm"
                      onClick={() => handleUpdateStatus(offer.id, 'Approved')}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Approve Offer
                    </Button>
                  )}
                  {offer.status === 'Approved' && (
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 flex-1 border-none shadow-sm"
                      onClick={() => handleUpdateStatus(offer.id, 'Accepted')}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Sign & Accept Offer
                    </Button>
                  )}
                  {offer.status === 'Accepted' && (
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 font-bold px-3 py-1 text-xs">
                      Candidate in Preboarding
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs border-border font-semibold flex items-center gap-1"
                    onClick={() => handleOpenEdit(offer)}
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit Terms
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                    onClick={() => router.push('/dashboard/recruitment/kanban')}
                  >
                    Kanban
                  </Button>
                </div>

              </CardContent>
            </Card>
          );
        })}

        {filteredOffers.length === 0 && (
          <div className="col-span-full border border-dashed border-border/80 rounded-2xl p-12 text-center bg-card/50">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground">No Offers Matching Filter</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Candidates moved to the &ldquo;Offer&rdquo; stage on your Kanban board or Candidates directory automatically appear here for compensation verification and multi-stage signoffs.
            </p>
            <Button 
              size="sm" 
              className="mt-4 bg-primary text-white font-semibold text-xs"
              onClick={() => router.push('/dashboard/recruitment/kanban')}
            >
              Go to Candidate Pipeline
            </Button>
          </div>
        )}
      </div>

      {/* Edit Terms Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Offer Compensation & Terms</DialogTitle>
            <DialogDescription className="text-xs">
              Update annual base salary and projected joining date for{' '}
              <span className="font-bold text-foreground">
                {selectedOffer?.job_applications?.candidate_profiles?.first_name}{' '}
                {selectedOffer?.job_applications?.candidate_profiles?.last_name}
              </span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Annual Base Compensation (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  placeholder="e.g. 1800000"
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Projected Joining Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setEditModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={updating}
                className="bg-primary text-white text-xs font-semibold"
              >
                {updating ? 'Saving...' : 'Save Offer Terms'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

