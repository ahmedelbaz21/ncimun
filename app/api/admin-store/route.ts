import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role: store orders are hidden from delegates, so the admin dashboard reads them here
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STATUSES = ['paid', 'flagged', 'ready', 'delivered'];

export async function GET() {
  const [{ data: orders, error: ordersError }, { data: stock, error: stockError }] = await Promise.all([
    supabase.from('store_orders_overview').select('*'),
    supabase.from('store_stock_overview').select('*'),
  ]);

  if (ordersError || stockError) {
    return NextResponse.json({ error: (ordersError || stockError)!.message }, { status: 500 });
  }

  // Receipt screenshots are in a private bucket; links expire after an hour
  const paths = (orders ?? []).map(o => o.payment_screenshot).filter(Boolean);
  const receiptUrls: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from('payment-screenshots').createSignedUrls(paths, 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) receiptUrls[s.path] = s.signedUrl;
  }

  return NextResponse.json(
    {
      orders: (orders ?? []).map(o => ({ ...o, receipt_url: receiptUrls[o.payment_screenshot] ?? null })),
      stock: stock ?? [],
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: NextRequest) {
  const { action, orderId, status } = await req.json();
  if (!Number.isInteger(orderId)) return NextResponse.json({ error: 'Invalid order.' }, { status: 400 });

  if (action === 'cancel') {
    const { error } = await supabase.rpc('cancel_store_order', { p_order_id: orderId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === 'status' && STATUSES.includes(status)) {
    const { error } = await supabase.from('store_orders').update({ status }).eq('id', orderId).neq('status', 'cancelled');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
