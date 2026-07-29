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
import { FileText, IndianRupee, User, CheckCircle, ShieldCheck, Mail, Calendar, ArrowRight } from 'lucide-react';

export default function OfferWorkspacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);

  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/recruitment/offers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setOffers(json.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load offer logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleUpdateStatus = async (offerId: string, status: string) => {
    try {
      const token = localStorage.getItem('session_token');
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
        toast.success(`Offer workflow updated: ${status}`);
        fetchOffers();
      } else {
        toast.error('Failed to update offer workflow.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error executing offer update.');
    }
  };

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
            key="back" 
            variant="outline" 
            onClick={() => router.push('/dashboard/recruitment')}
            className="border-border text-foreground font-bold hover:bg-accent"
          >
            Dashboard
          </Button>
        ]}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recruitment', href: '/dashboard/recruitment' }, { label: 'Offer Management' }]}
      />

      {/* Offers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offers.map((offer) => {
          const app = offer.job_applications;
          const candidate = app?.candidate_profiles;
          if (!candidate) return null;
          
          return (
            <Card key={offer.id} className="border-none shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                    Salary Pack
                  </Badge>
                  <Badge className={`px-2 py-0.5 rounded-full border-none text-[9px] font-extrabold uppercase ${
                    offer.status === 'Accepted'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : offer.status === 'Pending Approval'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-650'
                  }`}>
                    {offer.status}
                  </Badge>
                </div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span>Offer letter - {candidate.first_name} {candidate.last_name}</span>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Position: {app?.job_requisitions?.title || 'General Vacancy'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                
                {/* Financial and Date details */}
                <div className="grid grid-cols-2 gap-4 bg-accent/40 rounded-xl p-4 border border-border/40 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5" /> Base Compensation
                    </span>
                    <p className="font-extrabold text-foreground text-sm">₹{offer.base_salary?.toLocaleString()}/yr</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Joining Date
                    </span>
                    <p className="font-extrabold text-foreground text-sm">
                      {new Date(offer.joining_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                </div>

                {/* Multi-tier Approval checklists */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workflow Approval Checklist</h4>
                  <div className="space-y-2">
                    {(offer.approval_chain || []).map((appNode: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-semibold p-2 border border-border/30 rounded-lg">
                        <span className="text-muted-foreground">{appNode.approver} signoff</span>
                        <Badge className={`border-none text-[8px] font-black uppercase px-2 py-0.2 ${
                          appNode.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {appNode.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border flex gap-2">
                  {offer.status === 'Pending Approval' && (
                    <Button 
                      className="bg-primary hover:bg-primary/95 text-white font-bold text-xs py-1.5 flex-1 border-none"
                      onClick={() => handleUpdateStatus(offer.id, 'Approved')}
                    >
                      Approve Offer
                    </Button>
                  )}
                  {offer.status === 'Approved' && (
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 flex-1 border-none"
                      onClick={() => handleUpdateStatus(offer.id, 'Accepted')}
                    >
                      Sign & Accept Offer
                    </Button>
                  )}
                  <Button variant="outline" className="text-xs border-border" onClick={() => router.push('/dashboard/recruitment/kanban')}>
                    Go to Kanban
                  </Button>
                </div>

              </CardContent>
            </Card>
          );
        })}
        {offers.length === 0 && (
          <p className="text-center text-xs text-muted-foreground italic col-span-2 py-10">No active offers requiring approval sign-offs.</p>
        )}
      </div>

    </div>
  );
}
