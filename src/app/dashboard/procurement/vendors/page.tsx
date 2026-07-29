'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  Users, Plus, Calendar, FileText, Sparkles, 
  RefreshCw, CheckCircle2, Star, ShieldCheck, Mail, 
  Phone, MapPin, BarChart3, MessageSquare, Clock
} from 'lucide-react';

export default function PsaVendorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'performance'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isEditContractOpen, setIsEditContractOpen] = useState(false);
  const [isDeleteContractConfirmOpen, setIsDeleteContractConfirmOpen] = useState(false);
  const [contractStatus, setContractStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);

  // Vendor Form
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  // Contract Form
  const [contractTitle, setContractTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [contractFileUrl, setContractFileUrl] = useState('');

  // Performance Form
  const [slaScore, setSlaScore] = useState('5');
  const [qualityScore, setQualityScore] = useState('5');
  const [commScore, setCommScore] = useState('5');
  const [remarks, setRemarks] = useState('');

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/procurement/vendors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setVendors(json.data || []);
        if (json.data && json.data.length > 0 && !selectedVendor) {
          setSelectedVendor(json.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vendors directory.');
    }
  };

  const fetchContractsAndPerformance = async (vId: string) => {
    try {
      const token = localStorage.getItem('session_token');
      const [contractsRes, performanceRes] = await Promise.all([
        fetch(`/api/procurement/vendors/contracts?vendorId=${vId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/procurement/vendors/performance?vendorId=${vId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (contractsRes.ok) {
        const cJson = await contractsRes.json();
        setContracts(cJson.data || []);
      }
      if (performanceRes.ok) {
        const pJson = await performanceRes.json();
        setPerformance(pJson.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchVendors();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      fetchContractsAndPerformance(selectedVendor.id);
    }
  }, [selectedVendor]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !vendorEmail) {
      toast.error('Please specify vendor name and email.');
      return;
    }
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/procurement/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: vendorName,
          contactEmail: vendorEmail,
          phone: vendorPhone,
          address: vendorAddress,
          paymentTerms
        })
      });

      if (res.ok) {
        toast.success('Vendor profile registered successfully.');
        setIsVendorOpen(false);
        setVendorName('');
        setVendorEmail('');
        setVendorPhone('');
        setVendorAddress('');
        fetchVendors();
      } else {
        toast.error('Failed to create vendor.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !vendorName || !vendorEmail) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/procurement/vendors', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: selectedVendor.id,
          name: vendorName,
          contactEmail: vendorEmail,
          phone: vendorPhone,
          address: vendorAddress,
          paymentTerms
        })
      });

      if (res.ok) {
        toast.success('Vendor profile updated.');
        setIsEditVendorOpen(false);
        fetchVendors();
      } else {
        toast.error('Failed to update vendor.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating vendor profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!selectedVendor) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/procurement/vendors?vendorId=${selectedVendor.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success('Vendor profile deleted.');
        setIsDeleteConfirmOpen(false);
        setSelectedVendor(null);
        fetchVendors();
      } else {
        toast.error('Failed to delete vendor profile.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting vendor profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !contractTitle || !startDate || !endDate || !contractValue) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/procurement/vendors/contracts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          contractId: selectedContract.id,
          title: contractTitle,
          startDate,
          endDate,
          value: parseFloat(contractValue),
          contractFileUrl,
          status: contractStatus
        })
      });

      if (res.ok) {
        toast.success('Contract updated successfully.');
        setIsEditContractOpen(false);
        if (selectedVendor) {
          fetchContractsAndPerformance(selectedVendor.id);
        }
      } else {
        toast.error('Failed to update contract.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating contract.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!selectedContract) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/procurement/vendors/contracts?contractId=${selectedContract.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success('Contract deleted successfully.');
        setIsDeleteContractConfirmOpen(false);
        setSelectedContract(null);
        if (selectedVendor) {
          fetchContractsAndPerformance(selectedVendor.id);
        }
      } else {
        toast.error('Failed to delete contract.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting contract.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !contractTitle || !startDate || !endDate || !contractValue) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/procurement/vendors/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: selectedVendor.id,
          title: contractTitle,
          startDate,
          endDate,
          value: parseFloat(contractValue),
          contractFileUrl
        })
      });

      if (res.ok) {
        toast.success('Legal contract terms signed successfully.');
        setIsContractOpen(false);
        setContractTitle('');
        setStartDate('');
        setEndDate('');
        setContractValue('');
        setContractFileUrl('');
        fetchContractsAndPerformance(selectedVendor.id);
      } else {
        toast.error('Failed to save contract.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving contract.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePerformanceReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !remarks) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/procurement/vendors/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: selectedVendor.id,
          slaScore: parseInt(slaScore),
          qualityScore: parseInt(qualityScore),
          communicationScore: parseInt(commScore),
          remarks
        })
      });

      if (res.ok) {
        toast.success('Performance audit log submitted.');
        setIsPerformanceOpen(false);
        setRemarks('');
        fetchContractsAndPerformance(selectedVendor.id);
      } else {
        toast.error('Failed to file review scorecard.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error logging performance scorecard.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiAutoDraftContract = () => {
    if (!contractTitle) {
      toast.error('Please enter a Contract Title to generate draft context.');
      return;
    }
    setContractTitle(`Master Service Agreement - ${contractTitle}`);
    setContractFileUrl('https://example.com/contracts/legal_draft_auto.pdf');
    toast.success('Legal draft URL auto-assigned!');
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Performance averages
  const avgSla = performance.length > 0 ? performance.reduce((acc, p) => acc + p.sla_score, 0) / performance.length : 5;
  const avgQuality = performance.length > 0 ? performance.reduce((acc, p) => acc + p.quality_score, 0) / performance.length : 5;
  const avgComm = performance.length > 0 ? performance.reduce((acc, p) => acc + p.communication_score, 0) / performance.length : 5;

  if (loading && vendors.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-foreground p-1 border-t border-border flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0">
        <PageHeader 
          title="PSA Vendor Directory"
          description="Maintain supplier contacts, draft legal consultation agreements, track SLA performance, and review ratings."
          actions={[
            <Button 
              key="ref" 
              variant="outline" 
              onClick={fetchVendors}
              className="border-border text-foreground font-bold hover:bg-accent flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" /> Refresh
            </Button>,
            <Button 
              key="add" 
              onClick={() => setIsVendorOpen(true)}
              className="bg-primary hover:bg-primary/95 text-white font-bold border-none"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Vendor
            </Button>
          ]}
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Vendor Directory' }]}
        />
      </div>

      {/* Main split dashboard workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden mt-4">
        
        {/* Left column: Vendors Directory */}
        <div className="lg:col-span-1 border border-border/80 rounded-2xl bg-card overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-border/80 bg-accent/10 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Supplier Index Directory</h3>
            <div className="relative">
              <Input 
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 bg-card border-border text-xs rounded-xl h-8"
              />
            </div>
          </div>
          
          <div className="divide-y divide-border/60 flex-1">
            {filteredVendors.map(ven => (
              <div 
                key={ven.id}
                onClick={() => setSelectedVendor(ven)}
                className={`p-4 transition-colors cursor-pointer text-xs ${
                  selectedVendor?.id === ven.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-accent/25'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="font-bold text-foreground text-sm line-clamp-1">{ven.name}</span>
                  <Badge variant="outline" className="text-[9px] font-extrabold border-border text-muted-foreground uppercase">
                    {ven.payment_terms}
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed truncate">{ven.contact_email}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase">{ven.phone || 'No phone'}</p>
              </div>
            ))}
            {filteredVendors.length === 0 && (
              <p className="p-8 text-center text-xs text-muted-foreground italic">No vendors found.</p>
            )}
          </div>
        </div>

        {/* Right column: Tabbed Cockpit details */}
        <div className="lg:col-span-2 border border-border/80 rounded-2xl bg-card flex flex-col overflow-hidden">
          {selectedVendor ? (
            <>
              {/* Profile Header */}
              <div className="p-6 border-b border-border bg-accent/10 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-lg font-black text-foreground">{selectedVendor.name}</h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">Payment terms: {selectedVendor.payment_terms}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="xs" 
                    variant="outline" 
                    onClick={() => {
                      setVendorName(selectedVendor.name);
                      setVendorEmail(selectedVendor.contact_email);
                      setVendorPhone(selectedVendor.phone || '');
                      setVendorAddress(selectedVendor.address || '');
                      setPaymentTerms(selectedVendor.payment_terms);
                      setIsEditVendorOpen(true);
                    }}
                    className="border-border text-foreground text-[10px] font-bold h-8"
                  >
                    Edit Vendor
                  </Button>
                  <Button 
                    size="xs" 
                    variant="destructive"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="font-bold text-[10px] h-8 border-none"
                  >
                    Delete Vendor
                  </Button>
                </div>
              </div>

              {/* Sub-tabs header */}
              <div className="border-b border-border px-6 py-2 flex bg-accent/5 shrink-0">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2 pt-1 text-xs font-bold border-b-2 mr-6 transition-all ${
                    activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Contacts & Settings
                </button>
                <button
                  onClick={() => setActiveTab('contracts')}
                  className={`pb-2 pt-1 text-xs font-bold border-b-2 mr-6 transition-all ${
                    activeTab === 'contracts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Contracts ({contracts.length})
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`pb-2 pt-1 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'performance' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Performance Ratings ({performance.length})
                </button>
              </div>

              {/* Scrollable Sub-tab Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Tab 1: Overview */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none bg-accent/15">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Supplier Contacts</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-xs font-semibold">
                        <div className="flex justify-between items-center border-b border-border/40 pb-2">
                          <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-4 w-4" /> Email</span>
                          <span>{selectedVendor.contact_email}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border/40 pb-2">
                          <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-4 w-4" /> Phone</span>
                          <span>{selectedVendor.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between items-start pt-1">
                          <span className="text-muted-foreground flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Address</span>
                          <span className="text-right leading-relaxed max-w-[60%]">{selectedVendor.address || '-'}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none bg-accent/15">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PSA Scorecards</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-xs font-bold">
                        <div className="flex justify-between items-center border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">SLA Adherence</span>
                          <div className="flex items-center gap-1 text-primary">
                            <span>{avgSla.toFixed(1)}</span> <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Product Quality</span>
                          <div className="flex items-center gap-1 text-primary">
                            <span>{avgQuality.toFixed(1)}</span> <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Communication</span>
                          <div className="flex items-center gap-1 text-primary">
                            <span>{avgComm.toFixed(1)}</span> <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Tab 2: Contracts */}
                {activeTab === 'contracts' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Consulting & Supply Agreements</h4>
                      <Button 
                        size="sm" 
                        onClick={() => setIsContractOpen(true)}
                        className="bg-primary hover:bg-primary/95 text-white font-bold text-xs"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Log Contract
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {contracts.map((con) => (
                        <Card key={con.id} className="border-none bg-accent/10 p-5 space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="font-bold text-sm text-foreground">{con.title}</h5>
                            <Badge className="bg-emerald-50 text-emerald-700 font-extrabold uppercase border-none text-[9px]">
                              {con.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-xs font-semibold border-y border-border/40 py-3">
                            <div className="space-y-1">
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Start date</span>
                              <span>{con.start_date}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">End date</span>
                              <span>{con.end_date}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Value</span>
                              <span>₹{parseFloat(con.value).toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-4 pt-1.5">
                            {con.contract_file_url ? (
                              <a href={con.contract_file_url} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                                <FileText className="h-4 w-4" /> Download PDF Contract
                              </a>
                            ) : (
                              <div />
                            )}
                            <div className="flex gap-2">
                              <Button 
                                size="xs" 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedContract(con);
                                  setContractTitle(con.title);
                                  setStartDate(con.start_date);
                                  setEndDate(con.end_date);
                                  setContractValue(con.value.toString());
                                  setContractFileUrl(con.contract_file_url || '');
                                  setContractStatus(con.status);
                                  setIsEditContractOpen(true);
                                }}
                                className="border-border text-foreground text-[10px] font-bold h-7"
                              >
                                Edit
                              </Button>
                              <Button 
                                size="xs" 
                                variant="destructive"
                                onClick={() => {
                                  setSelectedContract(con);
                                  setIsDeleteContractConfirmOpen(true);
                                }}
                                className="font-bold text-[10px] h-7 border-none"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {contracts.length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-6">No contracts signed with this supplier.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Performance Scorecards */}
                {activeTab === 'performance' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quality Check Reviews</h4>
                      <Button 
                        size="sm" 
                        onClick={() => setIsPerformanceOpen(true)}
                        className="bg-primary hover:bg-primary/95 text-white font-bold text-xs"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Submit Scorecard
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {performance.map((perf) => (
                        <Card key={perf.id} className="border-none bg-accent/10 p-5 space-y-4">
                          <div className="grid grid-cols-3 gap-2 text-xs font-bold text-center">
                            <div className="bg-accent/40 p-2 rounded-xl border border-border/40">
                              <span className="text-muted-foreground block text-[9px] uppercase">SLA Adherence</span>
                              <span className="text-primary mt-1 block">{perf.sla_score} / 5</span>
                            </div>
                            <div className="bg-accent/40 p-2 rounded-xl border border-border/40">
                              <span className="text-muted-foreground block text-[9px] uppercase">Product Quality</span>
                              <span className="text-primary mt-1 block">{perf.quality_score} / 5</span>
                            </div>
                            <div className="bg-accent/40 p-2 rounded-xl border border-border/40">
                              <span className="text-muted-foreground block text-[9px] uppercase">Communication</span>
                              <span className="text-primary mt-1 block">{perf.communication_score} / 5</span>
                            </div>
                          </div>

                          <div className="text-xs font-medium bg-card p-3.5 rounded-xl border border-border/30 italic leading-relaxed text-muted-foreground">
                            "{perf.remarks}"
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase">
                            <span>Reviewed by: {perf.reviewer ? `${perf.reviewer.first_name} ${perf.reviewer.last_name}` : 'Unknown'}</span>
                            <span>{new Date(perf.created_at).toLocaleDateString()}</span>
                          </div>
                        </Card>
                      ))}
                      {performance.length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-6">No performance scorecard reviews filed.</p>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-muted-foreground italic gap-2">
              <Users className="h-8 w-8 text-muted-foreground/60" />
              <span>Select a vendor profile from the directory to review details.</span>
            </div>
          )}
        </div>

      </div>

      {/* Dialog: Edit Vendor */}
      <Dialog open={isEditVendorOpen} onOpenChange={setIsEditVendorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Supplier Vendor</DialogTitle>
            <DialogDescription>Update contact information, payment terms, or address guidelines.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditVendor} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Supplier Company Name *</label>
              <Input 
                placeholder="e.g. Cisco India Systems"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Contact Email Address *</label>
              <Input 
                type="email"
                placeholder="sales@cisco-india.com"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <Input 
                  placeholder="+91 80 2341 5566"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-semibold"
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Corporate Address</label>
              <Textarea 
                placeholder="Enter vendor corporate address details..."
                value={vendorAddress}
                onChange={(e) => setVendorAddress(e.target.value)}
                className="resize-none bg-accent/30 border-border text-xs rounded-xl h-16"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditVendorOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Updates'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Confirm */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Supplier Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-bold text-foreground">{selectedVendor?.name}</span>? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleDeleteVendor} variant="destructive" className="font-bold border-none" disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Contract */}
      <Dialog open={isEditContractOpen} onOpenChange={setIsEditContractOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vendor Contract</DialogTitle>
            <DialogDescription>Update contract titles, values, durations, and billing statuses.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditContract} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Contract Title *</label>
              <Input 
                placeholder="e.g. Master Service Agreement"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Start Date *</label>
                <Input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">End Date *</label>
                <Input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Total Contract Value *</label>
                <Input 
                  type="number"
                  placeholder="₹0.00"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Contract Status *</label>
                <select
                  value={contractStatus}
                  onChange={(e) => setContractStatus(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-semibold"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">PDF Voucher File URL</label>
              <Input 
                placeholder="https://example.com/contract.pdf"
                value={contractFileUrl}
                onChange={(e) => setContractFileUrl(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditContractOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Updates'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Contract Confirm */}
      <Dialog open={isDeleteContractConfirmOpen} onOpenChange={setIsDeleteContractConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Supplier Contract</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete contract <span className="font-bold text-foreground">{selectedContract?.title}</span>? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteContractConfirmOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleDeleteContract} variant="destructive" className="font-bold border-none" disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add Vendor */}
      <Dialog open={isVendorOpen} onOpenChange={setIsVendorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Supplier Vendor</DialogTitle>
            <DialogDescription>Submit supplier names, emails, contacts, and payout payment terms.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateVendor} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Supplier Company Name *</label>
              <Input 
                placeholder="e.g. Cisco India Systems"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Contact Email Address *</label>
              <Input 
                type="email"
                placeholder="sales@cisco-india.com"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <Input 
                  placeholder="+91 80 2341 5566"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-semibold"
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Corporate Address</label>
              <Textarea 
                placeholder="Enter vendor corporate address details..."
                value={vendorAddress}
                onChange={(e) => setVendorAddress(e.target.value)}
                className="resize-none bg-accent/30 border-border text-xs rounded-xl h-16"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsVendorOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                {submitting ? 'Registering...' : 'Register Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add Contract */}
      <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Vendor Contract Terms</DialogTitle>
            <DialogDescription>Submit contract titles, dates, value, and voucher files.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateContract} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase">Contract Title *</label>
                <Button type="button" size="xs" variant="outline" className="text-primary hover:text-primary/95 text-[10px] font-black flex items-center gap-1" onClick={handleAiAutoDraftContract}>
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" /> AI Rationale Draft
                </Button>
              </div>
              <Input 
                placeholder="e.g. Master Service Agreement"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Start Date *</label>
                <Input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">End Date *</label>
                <Input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Total Contract Value *</label>
              <Input 
                type="number"
                placeholder="₹0.00"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">PDF Voucher File URL</label>
              <Input 
                placeholder="https://example.com/contract.pdf"
                value={contractFileUrl}
                onChange={(e) => setContractFileUrl(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsContractOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                {submitting ? 'Registering...' : 'Save Contract'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add Performance Review */}
      <Dialog open={isPerformanceOpen} onOpenChange={setIsPerformanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>File Quality Check Review Card</DialogTitle>
            <DialogDescription>Submit rating scales for SLA compliance, product quality, and communication.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePerformanceReview} className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block text-center">SLA Adherence</label>
                <select
                  value={slaScore}
                  onChange={(e) => setSlaScore(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold"
                >
                  <option value="1">1 Star</option>
                  <option value="2">2 Star</option>
                  <option value="3">3 Star</option>
                  <option value="4">4 Star</option>
                  <option value="5">5 Star</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block text-center">Product Quality</label>
                <select
                  value={qualityScore}
                  onChange={(e) => setQualityScore(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold"
                >
                  <option value="1">1 Star</option>
                  <option value="2">2 Star</option>
                  <option value="3">3 Star</option>
                  <option value="4">4 Star</option>
                  <option value="5">5 Star</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block text-center">Communication</label>
                <select
                  value={commScore}
                  onChange={(e) => setCommScore(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold"
                >
                  <option value="1">1 Star</option>
                  <option value="2">2 Star</option>
                  <option value="3">3 Star</option>
                  <option value="4">4 Star</option>
                  <option value="5">5 Star</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Review Comments / Remarks *</label>
              <Textarea 
                placeholder="e.g. Resolved critical setup tickets within PMO constraints..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="resize-none bg-accent/30 border-border text-xs rounded-xl h-24"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPerformanceOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                {submitting ? 'Submitting...' : 'File Review'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
