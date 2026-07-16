import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for storage uploads (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('screenshot') as File;
    const delegateId = formData.get('delegate_id') as string;
    const conferenceSlug = formData.get('conference_slug') as string;
    const paymentMethod = formData.get('payment_method') as string;

    if (!file || !delegateId || !conferenceSlug || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${conferenceSlug}/${delegateId}_${paymentMethod}_${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) throw new Error(error.message);

    // Get the storage path (not a public URL since bucket is private)
    const storagePath = data.path;

    return NextResponse.json({ storagePath });

  } catch (err: any) {
    console.error('Storage upload error:', err.message);
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 500 });
  }
}