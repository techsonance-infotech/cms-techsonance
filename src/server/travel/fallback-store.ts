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

function getInitialRequests(_tenantId: string, _user?: any): TravelRequestRecord[] {
  return [];
}

function getInitialItineraries(_tenantId: string, _requestId: string): TravelItineraryRecord[] {
  return [];
}

function getInitialExpenses(_tenantId: string, _requestId: string): TravelExpenseRecord[] {
  return [];
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

