import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { isSchemaCacheError, travelMemoryStore } from '@/server/travel/fallback-store';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    throw new BadRequestError('Missing requestId parameter');
  }

  const supabase = getAdminRouteSupabase();

  try {
    let { data: itineraries, error } = await supabase
      .from('travel_itineraries')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('travel_request_id', requestId);

    if (error) {
      if (isSchemaCacheError(error)) {
        console.warn('travel_itineraries table not in schema cache. Using fallback store:', error.message);
        return NextResponse.json({
          success: true,
          data: travelMemoryStore.getItineraries(tenantId, requestId),
          source: 'memory_fallback'
        });
      }
      throw error;
    }

    if (!itineraries || itineraries.length === 0) {
      // Return memory itineraries if none found in DB yet
      return NextResponse.json({
        success: true,
        data: travelMemoryStore.getItineraries(tenantId, requestId)
      });
    }

    return NextResponse.json({ success: true, data: itineraries });
  } catch (err: any) {
    if (isSchemaCacheError(err)) {
      return NextResponse.json({
        success: true,
        data: travelMemoryStore.getItineraries(tenantId, requestId),
        source: 'memory_fallback'
      });
    }
    throw err;
  }
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { travelRequestId, flightTrainDetails, accommodationDetails, ticketFileUrl, hotelBookingUrl } = body;

  if (!travelRequestId || !flightTrainDetails || !accommodationDetails) {
    throw new BadRequestError('Missing required travel itinerary parameters');
  }

  const supabase = getAdminRouteSupabase();

  try {
    const { data, error } = await supabase
      .from('travel_itineraries')
      .insert({
        tenant_id: tenantId,
        travel_request_id: travelRequestId,
        flight_train_details: flightTrainDetails,
        accommodation_details: accommodationDetails,
        ticket_file_url: ticketFileUrl,
        hotel_booking_url: hotelBookingUrl
      })
      .select('*')
      .single();

    if (error) {
      if (isSchemaCacheError(error)) {
        const memoryRecord = {
          id: `ti-${Date.now()}`,
          tenant_id: tenantId,
          travel_request_id: travelRequestId,
          flight_train_details: flightTrainDetails,
          accommodation_details: accommodationDetails,
          ticket_file_url: ticketFileUrl,
          hotel_booking_url: hotelBookingUrl,
          created_at: new Date().toISOString()
        };
        travelMemoryStore.addItinerary(tenantId, memoryRecord);
        return NextResponse.json({ success: true, data: memoryRecord, source: 'memory_fallback' }, { status: 201 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    if (isSchemaCacheError(err)) {
      const memoryRecord = {
        id: `ti-${Date.now()}`,
        tenant_id: tenantId,
        travel_request_id: travelRequestId,
        flight_train_details: flightTrainDetails,
        accommodation_details: accommodationDetails,
        ticket_file_url: ticketFileUrl,
        hotel_booking_url: hotelBookingUrl,
        created_at: new Date().toISOString()
      };
      travelMemoryStore.addItinerary(tenantId, memoryRecord);
      return NextResponse.json({ success: true, data: memoryRecord, source: 'memory_fallback' }, { status: 201 });
    }
    throw err;
  }
}, { requireAuth: true });
