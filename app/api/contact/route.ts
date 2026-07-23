import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'NCIMUN Contact <onboarding@resend.dev>',
      to: 'ncimun.eg@gmail.com',
      replyTo: email,
      subject: `New message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Contact email error:', err);
    return NextResponse.json({ error: 'Failed to send.' }, { status: 500 });
  }
}