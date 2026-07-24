import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const PENDING_DELEGATES = [
  { first_name: 'Ahmed', email: 'ahmednaserelbaz@gmail.com' },
];

export async function POST(req: NextRequest) {
  const results = [];

  for (const delegate of PENDING_DELEGATES) {
    try {
      await transporter.sendMail({
        from: `NCIMUN <${process.env.GMAIL_USER}>`,
        to: delegate.email,
        subject: '⏳ Early Bird Deadline Almost Over — Complete Your Payment',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:2rem;color:#23272A;">
            <div style="background:#23272A;border-radius:8px;padding:1rem 1.5rem;margin-bottom:1.5rem;display:inline-block;">
              <span style="color:#84DBD5;font-weight:900;font-size:1.25rem;letter-spacing:.05em;">NCIMUN</span>
            </div>

            <h1 style="font-size:1.4rem;font-weight:900;margin:0 0 1rem;color:#23272A;">
              Hi ${delegate.first_name}, your spot is waiting! 🎟
            </h1>

            <p style="font-size:.9375rem;line-height:1.7;color:#444;margin-bottom:1rem;">
              You're registered for <strong>NCIMUN Summer Camp 2026</strong> but your payment hasn't been confirmed yet.
            </p>

            <p style="font-size:.9375rem;line-height:1.7;color:#444;margin-bottom:1.5rem;">
              The <strong>Early Bird price of 2,750 EGP</strong> is expiring soon. After the deadline, the price returns to <strong>3,000 EGP</strong>. Don't miss out — complete your payment now to lock in your discount and secure your spot.
            </p>

            <div style="background:#F8E98D;border-radius:10px;padding:1rem 1.5rem;margin-bottom:1.5rem;">
              <p style="margin:0;font-weight:700;font-size:.9375rem;color:#23272A;">💳 Payment options</p>
              <p style="margin:.5rem 0 0;font-size:.875rem;color:#23272A;">
                Instapay: <a href="https://ipn.eg/S/ncimun/instapay/06DDhz" style="color:#5F96CA;font-weight:600;">Pay via link</a><br/>
                Telda: <strong>ahmedelbaz21</strong>
              </p>
            </div>

            <a href="https://ncimun.com/payment-instructions?conference=summer-camp-2026"
               style="display:inline-block;background:#5F96CA;color:white;padding:.875rem 2rem;border-radius:8px;font-weight:700;text-decoration:none;font-size:1rem;margin-bottom:1.5rem;">
              Complete payment →
            </a>

            <p style="font-size:.875rem;color:#888;line-height:1.6;">
              After paying, upload your screenshot on the portal to confirm your registration instantly.<br/>
              Questions? Contact us at ncimun.eg@gmail.com or 010 3162 3162.
            </p>

            <hr style="border:none;border-top:1px solid #eee;margin:1.5rem 0;"/>
            <p style="font-size:.75rem;color:#aaa;margin:0;">
              New Capital International Model United Nations · The Knowledge Hub, New Administrative Capital, Egypt
            </p>
          </div>
        `,
      });
      results.push({ email: delegate.email, status: 'sent' });
    } catch (err: any) {
      results.push({ email: delegate.email, status: 'failed', error: err.message });
    }
  }

  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;

  return NextResponse.json({ sent, failed, results });
}

/*const PENDING_DELEGATES = [
  
   { first_name: 'Seif', email: 'seifaelkholy@gmail.com' },
  { first_name: 'Yehia', email: 'hendyehia10@gmail.com' },
  { first_name: 'Hamza', email: 'hamzaexternal@gmail.com' },
  { first_name: 'Lilian', email: 'lilisami649@gmail.com' },
  { first_name: 'Salma', email: 'sqlmafallata@gmail.com' },
  { first_name: 'Julie', email: 'juliejoseph208@gmail.com' },
  { first_name: 'Malak', email: 'monekhalifa123@gmail.com' },
  { first_name: 'Mostafa', email: 'mosta.amr@gmail.com' },
  { first_name: 'Mariam', email: 'lolo123ess@gmail.com' },
  { first_name: 'Farida', email: 'marim.abdlmonem@yahoo.com' },
  { first_name: 'Mayada', email: 'mayada_karem@hotmail.com' },
  { first_name: 'Abdel-Rahman', email: 'drhalazaher@yahoo.com' },
  { first_name: 'Layla', email: 'layla.fhhi@gmail.com' },
  { first_name: 'Aseel', email: 'roma2020.re@gmail.com' },
  { first_name: 'Maryam', email: 'mariorizk72@gmail.com' },
  { first_name: 'Ali', email: 'hendali9018@gmail.com' },
  { first_name: 'Loujain', email: 'Minloojy209@gmail.com' }, 
];*/

