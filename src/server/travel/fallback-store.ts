// In-Memory Fallback Store for Travel Management Engine
// Used when public.travel_requests, public.travel_itineraries, or public.travel_expenses
// have not yet been migrated into Supabase schema cache.

export interface TravelRequestRecord {
  id: string;
  tenant_id: string;
  employee_id: string;
  destination: string;
  purpose: string;
  departure_date: string;
  return_date: string;
  status: string;
  visa_required: boolean;
  visa_status: string;
  advance_amount: number;
  advance_status: string;
  employee?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TravelItineraryRecord {
  id: string;
  tenant_id: string;
  travel_request_id: string;
  flight_train_details: string;
  accommodation_details: string;
  ticket_file_url?: string;
  hotel_booking_url?: string;
  created_at: string;
}

export interface TravelExpenseRecord {
  id: string;
  tenant_id: string;
  travel_request_id: string;
  description: string;
  amount: number;
  receipt_url?: string;
  status: string;
  created_at: string;
}

export function isSchemaCacheError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'object' ? (error.message || error.details || error.hint || '') : String(error);
  const code = typeof error === 'object' ? error.code : '';
  return (
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.toLowerCase().includes('schema cache') ||
    msg.toLowerCase().includes('relation') ||
    msg.toLowerCase().includes('does not exist') ||
    msg.toLowerCase().includes('travel_requests') ||
    msg.toLowerCase().includes('travel_itineraries') ||
    msg.toLowerCase().includes('travel_expenses')
  );
}

// Global in-memory storage maps
const globalRequestsMap = new Map<string, TravelRequestRecord[]>();
const globalItinerariesMap = new Map<string, TravelItineraryRecord[]>();
const globalExpensesMap = new Map<string, TravelExpenseRecord[]>();

function getInitialRequests(tenantId: string, user?: any): TravelRequestRecord[] {
  const empName = `${user?.firstName || 'Current'} ${user?.lastName || 'Employee'}`.trim();
  const empEmail = user?.email || 'employee@company.com';
  const empId = user?.id ? String(user.id) : 'emp-self';

  return [
    {
      id: 'tr-req-001',
      tenant_id: tenantId,
      employee_id: empId,
      destination: 'San Francisco, USA',
      purpose: 'Annual Partner Conference & Product Keynote presentation',
      departure_date: '2026-11-15',
      return_date: '2026-11-22',
      status: 'Pending',
      visa_required: true,
      visa_status: 'Pending',
      advance_amount: 80000.00,
      advance_status: 'Requested',
      employee: {
        first_name: user?.firstName || 'Current',
        last_name: user?.lastName || 'Employee',
        email: empEmail
      },
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'tr-req-002',
      tenant_id: tenantId,
      employee_id: empId,
      destination: 'Bangalore, India',
      purpose: 'Workforce Onboarding & Engineering Team Alignment Meetups',
      departure_date: '2026-10-10',
      return_date: '2026-10-15',
      status: 'Approved',
      visa_required: false,
      visa_status: 'N/A',
      advance_amount: 15000.00,
      advance_status: 'Disbursed',
      employee: {
        first_name: user?.firstName || 'Current',
        last_name: user?.lastName || 'Employee',
        email: empEmail
      },
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 20).toISOString()
    }
  ];
}

function getInitialItineraries(tenantId: string, requestId: string): TravelItineraryRecord[] {
  return [
    {
      id: `ti-${requestId}-01`,
      tenant_id: tenantId,
      travel_request_id: requestId,
      flight_train_details: 'Indigo 6E-2415 (Departing Surat 06:10 AM - Arriving Bangalore 08:20 AM)',
      accommodation_details: 'Grand Hyatt, Bangalore Main Wing Room 402',
      ticket_file_url: 'https://example.com/tickets/flight-ticket.pdf',
      hotel_booking_url: 'https://booking.com/hotels/grand-hyatt',
      created_at: new Date().toISOString()
    }
  ];
}

function getInitialExpenses(tenantId: string, requestId: string): TravelExpenseRecord[] {
  return [
    {
      id: `te-${requestId}-01`,
      tenant_id: tenantId,
      travel_request_id: requestId,
      description: 'Client Dinner & Partner Networking Event',
      amount: 4500.00,
      receipt_url: 'https://example.com/receipts/dinner.jpg',
      status: 'Pending',
      created_at: new Date().toISOString()
    },
    {
      id: `te-${requestId}-02`,
      tenant_id: tenantId,
      travel_request_id: requestId,
      description: 'Airport Transit Cab & Highway Toll Fees',
      amount: 1800.00,
      receipt_url: 'https://example.com/receipts/cab.jpg',
      status: 'Approved',
      created_at: new Date().toISOString()
    }
  ];
}

export const travelMemoryStore = {
  getRequests(tenantId: string, user?: any): TravelRequestRecord[] {
    if (!globalRequestsMap.has(tenantId)) {
      globalRequestsMap.set(tenantId, getInitialRequests(tenantId, user));
    }
    return globalRequestsMap.get(tenantId)!;
  },

  addRequest(tenantId: string, req: TravelRequestRecord): TravelRequestRecord {
    const list = this.getRequests(tenantId);
    list.unshift(req);
    return req;
  },

  updateRequest(tenantId: string, requestId: string, updates: Partial<TravelRequestRecord>): TravelRequestRecord | null {
    const list = this.getRequests(tenantId);
    const index = list.findIndex(r => r.id === requestId);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    return list[index];
  },

  getItineraries(tenantId: string, requestId: string): TravelItineraryRecord[] {
    const key = `${tenantId}:${requestId}`;
    if (!globalItinerariesMap.has(key)) {
      globalItinerariesMap.set(key, getInitialItineraries(tenantId, requestId));
    }
    return globalItinerariesMap.get(key)!;
  },

  addItinerary(tenantId: string, itinerary: TravelItineraryRecord): TravelItineraryRecord {
    const list = this.getItineraries(tenantId, itinerary.travel_request_id);
    list.unshift(itinerary);
    return itinerary;
  },

  getExpenses(tenantId: string, requestId: string): TravelExpenseRecord[] {
    const key = `${tenantId}:${requestId}`;
    if (!globalExpensesMap.has(key)) {
      globalExpensesMap.set(key, getInitialExpenses(tenantId, requestId));
    }
    return globalExpensesMap.get(key)!;
  },

  addExpense(tenantId: string, expense: TravelExpenseRecord): TravelExpenseRecord {
    const list = this.getExpenses(tenantId, expense.travel_request_id);
    list.unshift(expense);
    return expense;
  }
};

