import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    throw new BadRequestError('Missing requestId parameter');
  }

  const supabase = getAdminRouteSupabase();

  let { data: itineraries, error } = await supabase
    .from('travel_itineraries')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('travel_request_id', requestId);

  if (error) throw error;

  // Insert seed itinerary if empty
  if (!itineraries || itineraries.length === 0) {
    const seeds = [
      {
        tenant_id: tenantId,
        travel_request_id: requestId,
        flight_train_details: 'Indigo 6E-2415 (Departing Surat 06:10 AM - Arriving Bangalore 08:20 AM)',
        accommodation_details: 'Grand Hyatt, Bangalore Main Wing Room 402',
        ticket_file_url: 'https://example.com/tickets/indigo_bangalore.pdf',
        hotel_booking_url: 'https://booking.com/hotels/grand_hyatt_blr'
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('travel_itineraries')
      .insert(seeds)
      .select('*');

    if (!insertErr && inserted) {
      itineraries = inserted;
    }
  }

  return NextResponse.json({ success: true, data: itineraries });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { travelRequestId, flightTrainDetails, accommodationDetails, ticketFileUrl, hotelBookingUrl } = body;

  if (!travelRequestId || !flightTrainDetails || !accommodationDetails) {
    throw new BadRequestError('Missing required travel itinerary parameters');
  }

  const supabase = getAdminRouteSupabase();

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

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
