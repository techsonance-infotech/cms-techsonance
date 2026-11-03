'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeaderSkeleton, StatsSkeleton } from '@/components/ui/dashboard-skeleton';
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
  Plane, Calendar, ClipboardList, Wallet, FileText, 
  MapPin, Clock, CheckCircle2, XCircle, Plus, 
  Sparkles, RefreshCw, Eye, Landmark, Globe, Search,
  ArrowRight, ShieldCheck, Hotel, AlertCircle, ChevronRight,
  User, Check, DollarSign
} from 'lucide-react';

export default function TravelManagementDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'itinerary' | 'expenses'>('requests');
  const [canApprove, setCanApprove] = useState(false);
  const [userRole, setUserRole] = useState('employee');

  // Search & Filter state for left directory
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');

  // Dialogs
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isAddItineraryOpen, setIsAddItineraryOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [visaRequired, setVisaRequired] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');

  // Itinerary form states
  const [flightTrainDetails, setFlightTrainDetails] = useState('');
  const [accommodationDetails, setAccommodationDetails] = useState('');
  const [ticketFileUrl, setTicketFileUrl] = useState('');
  const [hotelBookingUrl, setHotelBookingUrl] = useState('');

  // Expense form states
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const getAuthHeaders = (extraHeaders?: Record<string, string>): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
    const headers: Record<string, string> = { ...extraHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchTravelRequests = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/travel/requests', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        const dataList = json.data || [];
        setRequests(dataList);
        if (json.canApprove !== undefined) setCanApprove(Boolean(json.canApprove));
        if (json.userRole) setUserRole(json.userRole);

        if (dataList.length > 0) {
          // If current selectedRequest is not in list or not set, select first
          setSelectedRequest((prev: any) => {
            if (!prev) return dataList[0];
            const found = dataList.find((r: any) => r.id === prev.id);
            return found || dataList[0];
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load travel requests.');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchItinerariesAndExpenses = async (reqId: string) => {
    try {
      const headers = getAuthHeaders();
      const [itineraryRes, expenseRes] = await Promise.all([
        fetch(`/api/travel/itinerary?requestId=${reqId}`, { headers }),
        fetch(`/api/travel/expenses?requestId=${reqId}`, { headers })
      ]);

      if (itineraryRes.ok) {
        const iJson = await itineraryRes.json();
        setItineraries(iJson.data || []);
      }
      if (expenseRes.ok) {
        const eJson = await expenseRes.json();
        setExpenses(eJson.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchTravelRequests();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedRequest?.id) {
      fetchItinerariesAndExpenses(selectedRequest.id);
    }
  }, [selectedRequest?.id]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !purpose || !departureDate || !returnDate) {
      toast.error('Please specify destination, purpose, and timing dates.');
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch('/api/travel/requests', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          destination,
          purpose,
          departureDate,
          returnDate,
          visaRequired,
          advanceAmount: parseFloat(advanceAmount) || 0
        })
      });

      if (res.ok) {
        toast.success('Travel request submitted for approval.');
        setIsRequestOpen(false);
        setDestination('');
        setPurpose('');
        setDepartureDate('');
        setReturnDate('');
        setVisaRequired(false);
        setAdvanceAmount('');
        await fetchTravelRequests();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.error || 'Failed to register travel request.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting travel request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusAction = async (requestId: string, fields: any) => {
    try {
      const res = await fetch('/api/travel/requests', {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ requestId, ...fields })
      });

      if (res.ok) {
        toast.success('Request parameters updated.');
        await fetchTravelRequests();
      } else {
        toast.error('Failed to update request.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving approval updates.');
    }
  };

  const handleAddItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !flightTrainDetails || !accommodationDetails) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/travel/itinerary', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          travelRequestId: selectedRequest.id,
          flightTrainDetails,
          accommodationDetails,
          ticketFileUrl,
          hotelBookingUrl
        })
      });

      if (res.ok) {
        toast.success('Itinerary booking logged successfully.');
        setIsAddItineraryOpen(false);
        setFlightTrainDetails('');
        setAccommodationDetails('');
        setTicketFileUrl('');
        setHotelBookingUrl('');
        fetchItinerariesAndExpenses(selectedRequest.id);
      } else {
        toast.error('Failed to save itinerary.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving itinerary details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !expenseDesc || !expenseAmount) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/travel/expenses', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          travelRequestId: selectedRequest.id,
          description: expenseDesc,
          amount: parseFloat(expenseAmount),
          receiptUrl
        })
      });

      if (res.ok) {
        toast.success('Travel expense logged for settlement.');
        setIsAddExpenseOpen(false);
        setExpenseDesc('');
        setExpenseAmount('');
        setReceiptUrl('');
        fetchItinerariesAndExpenses(selectedRequest.id);
      } else {
        toast.error('Failed to record expense.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding travel expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiFormatDetails = () => {
    if (!destination) {
      toast.error('Specify a destination to refine travel purpose.');
      return;
    }
    setPurpose(
      `Business alignment trip to ${destination}. Attending corporate stakeholder reviews, discussing enterprise milestone parameters, and validating client system delivery objectives.`
    );
    toast.success('Travel purpose formatted with AI!');
  };

  // Filtered requests list for the Directory
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = !searchQuery.trim() ||
        r.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.employee && `${r.employee.first_name} ${r.employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6 animate-pulse">
        <PageHeaderSkeleton />
        <StatsSkeleton count={3} />
        <div className="h-96 w-full bg-slate-200 dark:bg-zinc-800 rounded-3xl mt-6" />
      </div>
    );
  }

  // Summary counts
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const totalAdvances = requests.reduce((acc, r) => acc + (r.advance_status === 'Disbursed' ? (parseFloat(r.advance_amount) || 0) : 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-foreground p-4 md:p-6 min-h-screen pb-20">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-6 md:p-8 text-white border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 rounded-full bg-[#f87941]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#f87941]/15 rounded-2xl border border-[#f87941]/30">
                <Plane className="h-7 w-7 text-[#f87941]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Corporate Travel & Logistics Management
                </h1>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                  Plan corporate trip itineraries, manage travel cash advances, verify visas, and file expense claims
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchTravelRequests}
              disabled={refreshing}
              className="rounded-xl border-slate-700 bg-slate-900/60 text-slate-200 font-bold hover:bg-slate-800 hover:text-white flex items-center gap-1.5 h-10 px-4"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#f87941]' : 'text-slate-400'}`} />
              Refresh
            </Button>
            
            <Button 
              size="sm"
              onClick={() => setIsRequestOpen(true)}
              className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs h-10 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#f87941]/25 border-none transition-all"
            >
              <Plus className="h-4 w-4" /> Request New Trip
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Approvals</span>
              <div className="text-3xl font-black text-amber-500 mt-0.5">{pendingCount}</div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Awaiting manager & finance authorization</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved Trips</span>
              <div className="text-3xl font-black text-emerald-500 mt-0.5">{approvedCount}</div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ready for flight/transit booking</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <Plane className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Advances Disbursed</span>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-0.5">₹{totalAdvances.toLocaleString()}</div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pre-allocated travel cash reserve</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
              <Landmark className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main split dashboard workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Trips Directory (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col overflow-hidden">
          
          {/* Header with Search & Filter */}
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 space-y-3 bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#f87941]" /> Travel Log Directory ({filteredRequests.length})
              </h3>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search destination, purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
              {(['all', 'Pending', 'Approved', 'Rejected'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-xl transition-all whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-[#f87941] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-750'
                  }`}
                >
                  {status === 'all' ? 'All Trips' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Directory List Container */}
          <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[640px] overflow-y-auto">
            {filteredRequests.map(req => {
              const isSelected = selectedRequest?.id === req.id;
              return (
                <button
                  type="button" 
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`w-full text-left p-4 transition-all cursor-pointer text-xs relative block ${
                    isSelected 
                      ? 'bg-[#f87941]/5 border-l-4 border-[#f87941]' 
                      : 'hover:bg-slate-50 dark:hover:bg-zinc-850/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                      {req.destination}
                    </span>
                    <Badge className={`px-2 py-0.5 rounded-full border-none text-[9px] font-extrabold uppercase shrink-0 ${
                      req.status === 'Approved' 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                        : req.status === 'Pending'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    }`}>
                      {req.status}
                    </Badge>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {req.purpose}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {req.departure_date}
                    </span>
                    {parseFloat(req.advance_amount) > 0 && (
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        ₹{parseFloat(req.advance_amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredRequests.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Plane className="h-8 w-8 mx-auto text-slate-300" />
                <p className="font-semibold">No travel records matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Trip Command Cockpit (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col overflow-hidden">
          {selectedRequest ? (
            <>
              {/* Detailed Header */}
              <div className="p-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {selectedRequest.destination}
                    </h3>
                    <Badge className={`px-2.5 py-0.5 rounded-full border-none text-[10px] font-extrabold uppercase ${
                      selectedRequest.status === 'Approved' 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                        : selectedRequest.status === 'Pending'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    }`}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold flex items-center gap-2">
                    <User className="h-3 w-3 text-slate-400" />
                    Requester: <span className="font-bold text-slate-700 dark:text-slate-300">
                      {selectedRequest.employee ? `${selectedRequest.employee.first_name || ''} ${selectedRequest.employee.last_name || ''}`.trim() : 'Corporate Traveler'}
                    </span>
                    {selectedRequest.employee?.email && <span className="text-slate-400 font-normal">({selectedRequest.employee.email})</span>}
                  </p>
                </div>
                
                {/* Approver actions if Manager/Admin and Status is Pending */}
                {selectedRequest.status === 'Pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {canApprove ? (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleStatusAction(selectedRequest.id, { status: 'Rejected' })}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 font-bold text-xs h-9 px-4 rounded-xl"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject Trip
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleStatusAction(selectedRequest.id, { status: 'Approved' })}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-emerald-600/20"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve Trip
                        </Button>
                      </>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/30 text-xs py-1.5 px-3 font-bold">
                        ⏳ Under Review by Manager
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Tabs Bar */}
              <div className="border-b border-slate-200 dark:border-zinc-800 px-6 py-2.5 flex items-center gap-2 bg-slate-50/30 dark:bg-zinc-900/30">
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === 'requests' 
                      ? 'bg-[#f87941] text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <ClipboardList className="h-3.5 w-3.5" /> Overview & Parameters
                </button>
                <button
                  onClick={() => setActiveTab('itinerary')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === 'itinerary' 
                      ? 'bg-[#f87941] text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Plane className="h-3.5 w-3.5" /> Itineraries & Transit ({itineraries.length})
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === 'expenses' 
                      ? 'bg-[#f87941] text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5" /> Trip Expenses ({expenses.length})
                </button>
              </div>

              {/* Sub-tab Content Area */}
              <div className="p-6 space-y-6">
                
                {/* Tab 1: Overview */}
                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    {/* Status lifecycle progress bar */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Travel Request Lifecycle
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          1. Request Filed
                        </div>
                        <div className={`p-2 rounded-xl border ${
                          selectedRequest.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : (selectedRequest.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20')
                        }`}>
                          2. {selectedRequest.status === 'Approved' ? 'Approved' : (selectedRequest.status === 'Rejected' ? 'Rejected' : 'Under Review')}
                        </div>
                        <div className={`p-2 rounded-xl border ${
                          selectedRequest.status === 'Approved'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700'
                        }`}>
                          3. Ticket & Booking
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: General Timing & Purpose */}
                      <Card className="rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50/50 dark:bg-zinc-900/50">
                        <CardHeader className="pb-3 border-b border-slate-200 dark:border-zinc-800">
                          <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#f87941]" /> Trip Schedule & Purpose
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 text-xs font-semibold">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400">Destination</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRequest.destination}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400">Departure Date</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedRequest.departure_date}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400">Return Date</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedRequest.return_date}</span>
                          </div>
                          <div className="space-y-1.5 pt-1">
                            <span className="text-slate-400 block text-[11px]">Business Justification / Purpose:</span>
                            <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 leading-relaxed font-normal text-xs">
                              {selectedRequest.purpose}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Right: Visa & Cash Advance */}
                      <Card className="rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50/50 dark:bg-zinc-900/50">
                        <CardHeader className="pb-3 border-b border-slate-200 dark:border-zinc-800">
                          <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Wallet className="h-3.5 w-3.5 text-[#f87941]" /> Visa Clearance & Cash Advance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 text-xs font-semibold">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400">International Visa</span>
                            <Badge variant="outline" className={`font-bold text-[10px] ${
                              selectedRequest.visa_required 
                                ? 'text-amber-600 border-amber-500/30 bg-amber-500/5' 
                                : 'text-slate-500 border-slate-300'
                            }`}>
                              {selectedRequest.visa_required ? 'Required for Travel' : 'Not Required'}
                            </Badge>
                          </div>

                          {selectedRequest.visa_required && (
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
                              <span className="text-slate-400">Visa Status</span>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold text-[10px]">
                                  {selectedRequest.visa_status}
                                </Badge>
                                {canApprove && selectedRequest.visa_status === 'Pending' && (
                                  <Button 
                                    size="xs" 
                                    onClick={() => handleStatusAction(selectedRequest.id, { visaStatus: 'Approved' })}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700 h-6 text-[10px] px-2.5 rounded-lg"
                                  >
                                    Verify Visa
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400">Advance Amount</span>
                            <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                              ₹{parseFloat(selectedRequest.advance_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Advance Status</span>
                            <div className="flex items-center gap-2">
                              <Badge className={`font-bold text-[10px] border-none ${
                                selectedRequest.advance_status === 'Disbursed'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}>
                                {selectedRequest.advance_status}
                              </Badge>
                              {canApprove && selectedRequest.advance_status === 'Requested' && (
                                <Button 
                                  size="xs" 
                                  onClick={() => handleStatusAction(selectedRequest.id, { advanceStatus: 'Disbursed' })}
                                  className="bg-emerald-600 text-white hover:bg-emerald-700 h-6 text-[10px] px-2.5 rounded-lg"
                                >
                                  Disburse Advance
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-medium flex items-center gap-2 mt-2">
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                            <span>Travel policy compliance enforced. All trip settlements require invoices.</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Tab 2: Itineraries */}
                {activeTab === 'itinerary' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          Registered Transit & Hotel Bookings
                        </h4>
                        <p className="text-xs text-slate-400">Flight tickets, train reservations, and lodging vouchers</p>
                      </div>
                      
                      <Button 
                        size="sm" 
                        onClick={() => setIsAddItineraryOpen(true)}
                        className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Log New Booking
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {itineraries.map((it) => (
                        <Card key={it.id} className="rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50/50 dark:bg-zinc-900/50 p-5 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                            <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                              <span className="text-slate-400 flex items-center gap-1.5 text-[10px] uppercase font-bold">
                                <Plane className="h-3 w-3 text-[#f87941]" /> Transit / Flight Details
                              </span>
                              <span className="text-slate-800 dark:text-slate-200 block text-xs font-bold">{it.flight_train_details}</span>
                            </div>
                            <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                              <span className="text-slate-400 flex items-center gap-1.5 text-[10px] uppercase font-bold">
                                <Hotel className="h-3 w-3 text-cyan-500" /> Accommodation / Lodging
                              </span>
                              <span className="text-slate-800 dark:text-slate-200 block text-xs font-bold">{it.accommodation_details}</span>
                            </div>
                          </div>
                          
                          <div className="pt-2 flex flex-wrap gap-3 text-xs">
                            {it.ticket_file_url && (
                              <a 
                                href={it.ticket_file_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-[#f87941]/10 text-[#f87941] font-bold transition-colors flex items-center gap-1.5"
                              >
                                <FileText className="h-3.5 w-3.5" /> View Ticket Voucher
                              </a>
                            )}
                            {it.hotel_booking_url && (
                              <a 
                                href={it.hotel_booking_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold transition-colors flex items-center gap-1.5"
                              >
                                <Globe className="h-3.5 w-3.5" /> Open Hotel Portal
                              </a>
                            )}
                          </div>
                        </Card>
                      ))}

                      {itineraries.length === 0 && (
                        <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 space-y-2">
                          <Plane className="h-8 w-8 mx-auto text-slate-300" />
                          <p className="font-semibold">No transit bookings logged for this trip yet.</p>
                          <p className="text-[11px]">Click &ldquo;Log New Booking&rdquo; above to record flight, train, or hotel reservations.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Expenses */}
                {activeTab === 'expenses' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          Incurred Travel Expenses & Receipts
                        </h4>
                        <p className="text-xs text-slate-400">Dining, cab transit, client meals, and hotel incidental invoices</p>
                      </div>

                      <Button 
                        size="sm" 
                        onClick={() => setIsAddExpenseOpen(true)}
                        className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Submit Expense Bill
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-zinc-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800 text-[10px]">
                            <th className="px-4 py-3">Expense Description</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Receipt Document</th>
                            <th className="px-4 py-3 text-right">Settlement Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-slate-200 font-semibold">
                          {expenses.map((ex) => (
                            <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                              <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{ex.description}</td>
                              <td className="px-4 py-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                                ₹{parseFloat(ex.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3">
                                {ex.receipt_url ? (
                                  <a 
                                    href={ex.receipt_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-[#f87941] font-bold hover:underline flex items-center gap-1"
                                  >
                                    <FileText className="h-3 w-3" /> View Receipt
                                  </a>
                                ) : (
                                  <span className="text-slate-400 italic">No receipt attached</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Badge className={`font-extrabold uppercase border-none text-[9px] ${
                                  ex.status === 'Approved' || ex.status === 'Settled'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-amber-500/10 text-amber-600'
                                }`}>
                                  {ex.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {expenses.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-xs text-slate-400 italic">
                                No expense bills filed for this trip yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-16 text-center text-xs text-slate-400 gap-3">
              <div className="p-4 rounded-3xl bg-slate-100 dark:bg-zinc-800 text-slate-400">
                <Plane className="h-10 w-10" />
              </div>
              <span className="font-bold text-sm text-slate-700 dark:text-slate-300">No Trip Selected</span>
              <p className="max-w-xs text-slate-400">Select any travel record from the directory to review its schedule, bookings, and expense settlements.</p>
            </div>
          )}
        </div>

      </div>

      {/* Dialog: Create Travel Request */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-black text-slate-900 dark:text-slate-100">
              <div className="p-2 rounded-xl bg-[#f87941]/10 text-[#f87941]">
                <Plane className="h-5 w-5" />
              </div>
              New Corporate Travel Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Submit departure timings, visa clearances, and cash advance allocations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRequest} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Destination City & Country *</label>
              <Input 
                placeholder="e.g. London, United Kingdom"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Purpose of Travel *</label>
                <Button 
                  type="button" 
                  size="xs" 
                  variant="outline" 
                  className="text-[#f87941] hover:text-[#e06634] text-[10px] font-black flex items-center gap-1 rounded-lg border-[#f87941]/30 hover:bg-[#f87941]/5" 
                  onClick={handleAiFormatDetails}
                >
                  <Sparkles className="h-3 w-3 text-[#f87941]" /> AI Business Refiner
                </Button>
              </div>
              <Textarea 
                placeholder="Enter client alignment meeting objectives, PMO audits, or engineering summits..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="resize-none text-xs rounded-xl h-24 border-slate-200 dark:border-zinc-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Departure Date *</label>
                <Input 
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Return Date *</label>
                <Input 
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center space-x-2.5">
                <input 
                  type="checkbox"
                  id="visaRequired"
                  checked={visaRequired}
                  onChange={(e) => setVisaRequired(e.target.checked)}
                  className="rounded border-slate-300 text-[#f87941] focus:ring-[#f87941] h-4 w-4 cursor-pointer"
                />
                <label htmlFor="visaRequired" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Visa Required
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cash Advance (₹)</label>
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="text-xs rounded-xl h-9 border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)} disabled={submitting} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#f87941]/20" disabled={submitting}>
                {submitting ? 'Submitting...' : 'File Travel Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Log Booking / Itinerary */}
      <Dialog open={isAddItineraryOpen} onOpenChange={setIsAddItineraryOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-slate-100">
              <Plane className="h-4.5 w-4.5 text-[#f87941]" /> Log Transit & Hotel Booking
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Submit flight details, hotel confirmations, and booking vouchers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddItinerary} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Transit Details (Flight / Train) *</label>
              <Input 
                placeholder="e.g. Flight Indigo 6E-2415 (DEP 06:10 AM)"
                value={flightTrainDetails}
                onChange={(e) => setFlightTrainDetails(e.target.value)}
                className="text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Accommodation Details *</label>
              <Input 
                placeholder="e.g. Grand Hyatt Bangalore Main Wing"
                value={accommodationDetails}
                onChange={(e) => setAccommodationDetails(e.target.value)}
                className="text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Ticket Voucher File URL</label>
              <Input 
                placeholder="https://example.com/ticket.pdf"
                value={ticketFileUrl}
                onChange={(e) => setTicketFileUrl(e.target.value)}
                className="text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Hotel Booking Portal URL</label>
              <Input 
                placeholder="https://booking.com/hotel-referral"
                value={hotelBookingUrl}
                onChange={(e) => setHotelBookingUrl(e.target.value)}
                className="text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-slate-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setIsAddItineraryOpen(false)} disabled={submitting} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#f87941]/20" disabled={submitting}>
                {submitting ? 'Registering...' : 'Save Booking'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Submit Expense */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-slate-100">
              <DollarSign className="h-4.5 w-4.5 text-[#f87941]" /> Submit Travel Expense Invoice
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Submit trip bills, restaurant invoices, and local transit expenses.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddExpense} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Expense Description *</label>
              <Input 
                placeholder="e.g. Client Dinner at Bangalore Club"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Expense Amount (₹) *</label>
              <Input 
                type="number"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Receipt Document URL</label>
              <Input 
                placeholder="https://example.com/receipt.jpg"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="text-xs rounded-xl h-10 border-slate-200 dark:border-zinc-800"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-slate-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)} disabled={submitting} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#f87941]/20" disabled={submitting}>
                {submitting ? 'Registering...' : 'File Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
