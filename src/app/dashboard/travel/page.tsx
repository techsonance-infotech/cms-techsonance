'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
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
  Sparkles, RefreshCw, Eye, Landmark, Globe
} from 'lucide-react';

export default function TravelManagementDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'itinerary' | 'expenses'>('requests');

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

  const fetchTravelRequests = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/travel/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data || []);
        if (json.data && json.data.length > 0 && !selectedRequest) {
          setSelectedRequest(json.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load travel requests.');
    }
  };

  const fetchItinerariesAndExpenses = async (reqId: string) => {
    try {
      const token = localStorage.getItem('session_token');
      const [itineraryRes, expenseRes] = await Promise.all([
        fetch(`/api/travel/itinerary?requestId=${reqId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/travel/expenses?requestId=${reqId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
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
    if (selectedRequest) {
      fetchItinerariesAndExpenses(selectedRequest.id);
    }
  }, [selectedRequest]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !purpose || !departureDate || !returnDate) {
      toast.error('Please specify destination, purpose, and timing dates.');
      return;
    }
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/travel/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
        fetchTravelRequests();
      } else {
        toast.error('Failed to register travel request.');
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
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/travel/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, ...fields })
      });

      if (res.ok) {
        toast.success('Request parameters updated.');
        fetchTravelRequests();
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
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/travel/itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/travel/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
      `Business alignment trip to ${destination}. Attending corporate milestone reviews, discussing core system integration parameters, and aligning operational KPIs with local stakeholders.`
    );
    toast.success('Purpose formatted!');
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
        <StatsSkeleton count={3} />
      </div>
    );
  }

  // Summary counts
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const totalAdvances = requests.reduce((acc, r) => acc + (r.advance_status === 'Disbursed' ? parseFloat(r.advance_amount) : 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-foreground p-1 border-t border-border flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0">
        <PageHeader 
          title="Travel Management"
          description="Log trip requests, record hotel or flight itineraries, check visa clearances, and file expense settlements."
          actions={[
            <Button 
              key="ref" 
              variant="outline" 
              onClick={fetchTravelRequests}
              className="border-border text-foreground font-bold hover:bg-accent flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" /> Refresh
            </Button>,
            <Button 
              key="add" 
              onClick={() => setIsRequestOpen(true)}
              className="bg-primary hover:bg-primary/95 text-white font-bold border-none"
            >
              <Plus className="mr-2 h-4 w-4" /> Request Trip
            </Button>
          ]}
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Travel Management' }]}
        />
      </div>

      {/* KPI Stats Bento */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <Card className="border-none shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Approvals</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Pending manager reviews</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Approved Trips</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
              <Plane className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">{approvedCount}</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Active upcoming travels</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Advances Disbursed</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-slate-100">
              <Landmark className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">₹{totalAdvances.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Pre-allocated cash advances</p>
          </CardContent>
        </Card>
      </div>

      {/* Main split dashboard workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden mt-4">
        
        {/* Left column: Trips list */}
        <div className="lg:col-span-1 border border-border/80 rounded-2xl bg-card overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-border/80 bg-accent/10">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Travel Log Directory</h3>
          </div>
          <div className="divide-y divide-border/60 flex-1">
            {requests.map(req => (
              <div 
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={`p-4 transition-colors cursor-pointer text-xs ${
                  selectedRequest?.id === req.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-accent/25'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="font-bold text-foreground text-sm line-clamp-1">{req.destination}</span>
                  <Badge className={`px-2 py-0.5 rounded-full border-none text-[9px] font-extrabold uppercase ${
                    req.status === 'Approved' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : req.status === 'Pending'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {req.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground line-clamp-2 leading-relaxed mb-3">{req.purpose}</p>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold">
                  <span>Start: {req.departure_date}</span>
                  <span>End: {req.return_date}</span>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <p className="p-8 text-center text-xs text-muted-foreground italic">No corporate trips found.</p>
            )}
          </div>
        </div>

        {/* Right column: Trip Details Cockpit */}
        <div className="lg:col-span-2 border border-border/80 rounded-2xl bg-card flex flex-col overflow-hidden">
          {selectedRequest ? (
            <>
              {/* Detailed Header */}
              <div className="p-6 border-b border-border bg-accent/10 flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
                <div>
                  <h3 className="text-lg font-black text-foreground">{selectedRequest.destination}</h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    Requester: {selectedRequest.employee ? `${selectedRequest.employee.first_name} ${selectedRequest.employee.last_name}` : 'Corporate'}
                  </p>
                </div>
                
                {/* Approver actions if Pending */}
                {selectedRequest.status === 'Pending' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleStatusAction(selectedRequest.id, { status: 'Rejected' })}
                      className="bg-rose-50 text-rose-700 hover:bg-rose-100 border-none font-bold text-xs h-9 px-4 rounded-xl"
                    >
                      Reject Trip
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleStatusAction(selectedRequest.id, { status: 'Approved' })}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl"
                    >
                      Approve Trip
                    </Button>
                  </div>
                )}
              </div>

              {/* Sub-tabs header */}
              <div className="border-b border-border px-6 py-2 flex bg-accent/5 shrink-0">
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`pb-2 pt-1 text-xs font-bold border-b-2 mr-6 transition-all ${
                    activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Overview & Actions
                </button>
                <button
                  onClick={() => setActiveTab('itinerary')}
                  className={`pb-2 pt-1 text-xs font-bold border-b-2 mr-6 transition-all ${
                    activeTab === 'itinerary' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Itineraries & Accommodation ({itineraries.length})
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`pb-2 pt-1 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Trip Expenses ({expenses.length})
                </button>
              </div>

              {/* Scrollable Sub-tab Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Tab 1: Overview */}
                {activeTab === 'requests' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none bg-accent/15">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">General Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-xs font-semibold">
                        <div className="flex justify-between items-center border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Destination</span>
                          <span>{selectedRequest.destination}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Departure Date</span>
                          <span>{selectedRequest.departure_date}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Return Date</span>
                          <span>{selectedRequest.return_date}</span>
                        </div>
                        <div className="flex justify-between items-start pt-1">
                          <span className="text-muted-foreground">Purpose</span>
                          <span className="text-right leading-relaxed max-w-[60%]">{selectedRequest.purpose}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none bg-accent/15">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visa & Cash Advance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-xs font-semibold">
                        <div className="flex justify-between items-center border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Visa Requirement</span>
                          <span>{selectedRequest.visa_required ? 'Required' : 'Not Required'}</span>
                        </div>
                        {selectedRequest.visa_required && (
                          <div className="flex justify-between items-center border-b border-border/40 pb-2">
                            <span className="text-muted-foreground">Visa Status</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary">{selectedRequest.visa_status}</span>
                              {selectedRequest.visa_status === 'Pending' && (
                                <Button 
                                  size="xs" 
                                  onClick={() => handleStatusAction(selectedRequest.id, { visaStatus: 'Approved' })}
                                  className="bg-emerald-600 text-white hover:bg-emerald-700 h-6 text-[9px] px-2"
                                >
                                  Mark Approved
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Advance Request</span>
                          <span>₹{parseFloat(selectedRequest.advance_amount).toLocaleString()}</span>
                        </div>
                        {parseFloat(selectedRequest.advance_amount) > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Advance Status</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary">{selectedRequest.advance_status}</span>
                              {selectedRequest.advance_status === 'Requested' && (
                                <Button 
                                  size="xs" 
                                  onClick={() => handleStatusAction(selectedRequest.id, { advanceStatus: 'Disbursed' })}
                                  className="bg-emerald-600 text-white hover:bg-emerald-700 h-6 text-[9px] px-2"
                                >
                                  Disburse Cash
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Tab 2: Itineraries */}
                {activeTab === 'itinerary' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered Bookings</h4>
                      {selectedRequest.status === 'Approved' && (
                        <Button 
                          size="sm" 
                          onClick={() => setIsAddItineraryOpen(true)}
                          className="bg-primary hover:bg-primary/95 text-white font-bold text-xs"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Log Booking
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {itineraries.map((it) => (
                        <Card key={it.id} className="border-none bg-accent/10 p-5 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                            <div className="space-y-1">
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Transit details</span>
                              <span>{it.flight_train_details}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Accommodation</span>
                              <span>{it.accommodation_details}</span>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-border/40 flex gap-4 text-xs">
                            {it.ticket_file_url && (
                              <a href={it.ticket_file_url} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline flex items-center gap-1">
                                <Plane className="h-4 w-4" /> Download Ticket
                              </a>
                            )}
                            {it.hotel_booking_url && (
                              <a href={it.hotel_booking_url} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline flex items-center gap-1">
                                <Globe className="h-4 w-4" /> Hotel Booking Portal
                              </a>
                            )}
                          </div>
                        </Card>
                      ))}
                      {itineraries.length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-6">No transit bookings logged for this trip.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Expenses */}
                {activeTab === 'expenses' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Incurred Cost Settlements</h4>
                      {selectedRequest.status === 'Approved' && (
                        <Button 
                          size="sm" 
                          onClick={() => setIsAddExpenseOpen(true)}
                          className="bg-primary hover:bg-primary/95 text-white font-bold text-xs"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Submit Expense
                        </Button>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-accent/40 text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Receipt</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-foreground font-semibold">
                          {expenses.map((ex) => (
                            <tr key={ex.id} className="hover:bg-accent/20">
                              <td className="px-4 py-3 font-bold">{ex.description}</td>
                              <td className="px-4 py-3">₹{parseFloat(ex.amount).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                {ex.receipt_url ? (
                                  <a href={ex.receipt_url} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                                    View Receipt
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground italic">None</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className="bg-amber-50 text-amber-700 font-extrabold uppercase border-none text-[9px]">
                                  {ex.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {expenses.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-xs text-muted-foreground italic">No expenses submitted for this trip yet.</td>
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
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-muted-foreground italic gap-2">
              <Plane className="h-8 w-8 text-muted-foreground/60" />
              <span>Select a travel record from the directory to review details.</span>
            </div>
          )}
        </div>

      </div>

      {/* Dialog: Create Travel Request */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Plane className="h-5 w-5 text-primary" />
              </div>
              New Corporate Travel Request
            </DialogTitle>
            <DialogDescription>Submit departure timings, visa clearances, and cash advance allocations.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRequest} className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Destination City & Country *</label>
              <Input 
                placeholder="e.g. London, United Kingdom"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase">Purpose of Travel *</label>
                <Button type="button" size="xs" variant="outline" className="text-primary hover:text-primary/95 text-[10px] font-black flex items-center gap-1" onClick={handleAiFormatDetails}>
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" /> AI Business Refiner
                </Button>
              </div>
              <Textarea 
                placeholder="Enter client alignment meeting objectives, PMO audits..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="resize-none text-xs bg-accent/30 border-border rounded-xl h-24"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Departure Date *</label>
                <Input 
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Return Date *</label>
                <Input 
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="flex items-center space-x-2.5">
                <input 
                  type="checkbox"
                  id="visaRequired"
                  checked={visaRequired}
                  onChange={(e) => setVisaRequired(e.target.checked)}
                  className="rounded border-border bg-accent/30 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                />
                <label htmlFor="visaRequired" className="text-xs font-bold text-foreground cursor-pointer uppercase">International Visa Required</label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Travel Cash Advance Amount</label>
                <Input 
                  type="number"
                  placeholder="₹0.00"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                {submitting ? 'Submitting...' : 'File Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Log Booking / Itinerary */}
      <Dialog open={isAddItineraryOpen} onOpenChange={setIsAddItineraryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Transit & Hotel Bookings</DialogTitle>
            <DialogDescription>Submit flight details, hotel confirmations, and booking vouchers.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddItinerary} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Transit Details (Flight / Train) *</label>
              <Input 
                placeholder="e.g. Flight Indigo 6E-2415 (DEP 06:10 AM)"
                value={flightTrainDetails}
                onChange={(e) => setFlightTrainDetails(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Accommodation Details *</label>
              <Input 
                placeholder="e.g. Grand Hyatt Bangalore Main Wing"
                value={accommodationDetails}
                onChange={(e) => setAccommodationDetails(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Ticket Voucher File URL</label>
              <Input 
                placeholder="https://example.com/ticket.pdf"
                value={ticketFileUrl}
                onChange={(e) => setTicketFileUrl(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Hotel Booking Portal URL</label>
              <Input 
                placeholder="https://booking.com/hotel-referral"
                value={hotelBookingUrl}
                onChange={(e) => setHotelBookingUrl(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddItineraryOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                {submitting ? 'Registering...' : 'Save Booking'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Submit Expense */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Travel Expense Invoice</DialogTitle>
            <DialogDescription>Submit trip bills, restaurant invoices, and local transit expenses.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddExpense} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Expense Description *</label>
              <Input 
                placeholder="e.g. Client Dinner at Bangalore Club"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Expense Amount *</label>
              <Input 
                type="number"
                placeholder="₹0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Receipt Document URL</label>
              <Input 
                placeholder="https://example.com/receipt.jpg"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="bg-accent/30 border-border text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                {submitting ? 'Registering...' : 'File Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
