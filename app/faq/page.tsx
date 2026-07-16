'use client';

import { useState } from 'react';
import Link from 'next/link';

type FAQ = {
  q: string;
  a: string;
};

const FAQS: { category: string; items: FAQ[] }[] = [
  {
    category: 'Registration',
    items: [
      {
        q: 'How do I register for NCIMUN Summer Camp?',
        a: 'Create an account on the portal, fill in your delegate profile and emergency contact, then head to the Conferences page and click "Get tickets" on the Summer Camp. You\'ll select your council preferences and transport, then complete payment to confirm your spot.',
      },
      {
        q: 'Can I register more than once with the same account?',
        a: 'Your account is permanent and reusable across all NCIMUN conferences. You only need to register once — after that you can purchase tickets for any future conference directly from your profile.',
      },
      {
        q: 'I forgot my password — how do I reset it?',
        a: 'Click "Log in" on the homepage, then "Forgot password?" You\'ll receive a reset link to your registered email address.',
      },
    ],
  },
  {
    category: 'Payment',
    items: [
      {
        q: 'How much does the Summer Camp cost?',
        a: 'The Summer Camp registration fee is 2,750EGP & standard registration fee is 3,300 EGP. Transportation is included at no additional cost.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We currently accept Instapay (ncimun@instapay) and Telda (ahmedelbaz21). After sending payment, upload a screenshot of your receipt on the payment page to confirm your registration.',
      },
      {
        q: 'I paid but didn\'t receive a confirmation — what do I do?',
        a: 'Make sure you uploaded your payment screenshot on the portal after completing the transfer.you find theportal in your profile under "My Tickets". If you did and still haven\'t received confirmation, contact us at ncimun@gmail.com or 010 3162 3162.',
      },
      {
        q: 'What is the refund policy?',
        a: 'In case of cancellation, NCIMUN offers a 30% refund. This is because 70% of the payment is allocated immediately toward venue, logistics, and conference expenses. Exceptions are made for medical reasons upon presentation of valid documentation.',
      },
    ],
  },
  {
    category: 'Councils',
    items: [
      {
        q: 'How are council allocations decided?',
        a: 'Allocations are made automatically based on your preferences and council capacity. If your first preference has space, you\'ll be placed there. If it\'s full, we\'ll place you in your second preference.',
      },
      {
        q: 'What if both my council preferences are full?',
        a: 'If both councils are at capacity, you\'ll be notified and we\'ll contact you directly to arrange an alternative placement.',
      },
      {
        q: 'Can I change my council preference after registering?',
        a: 'Council preferences cannot be changed after registration as allocations are made automatically upon payment. If you have a special circumstance, contact us and we\'ll do our best to accommodate you.',
      },
    ],
  },
  {
    category: 'Transportation',
    items: [
      {
        q: 'Is transportation included in the registration fee?',
        a: 'Yes — transportation is fully included in the Summer Camp registration fee at no additional cost.',
      },
      {
        q: 'What happens if I miss my bus?',
        a: 'Buses depart at their scheduled times and will not wait. If you miss your bus, you\'ll need to make your own way to The Knowledge Hub. Contact us immediately if this happens.',
      },
      {
        q: 'Can I change my pickup point after registering?',
        a: 'Pickup point changes are subject to availability. Contact us at ncimun@gmail.com or 010 3162 3162 as soon as possible and we\'ll try to accommodate the change.',
      },
    ],
  },
  {
    category: 'On the day',
    items: [
        {
            q: 'What should I bring on the first day?',
            a: 'Just show up — we\'ll take care of the rest. A warm welcome awaits you on day one. We\'ll share everything you need to know before the conference starts.',
        },
        {
            q: 'What is the dress code?',
            a: 'For regular conference and committee days, business formal is required — suits, blazers, and formal attire. However, during training days and Summer Camp sessions, delegates are free to wear any appropriate casual clothing.',
        },
        ],
  },
  {
    category: 'General',
    items: [
      {
        q: 'Who can join MUN?',
        a: 'NCIMUN is open to students in Grades 7 through 12. Whether you\'re a first-timer or a seasoned delegate, there\'s a council for you. All you need is curiosity, a willingness to debate, and the drive to make a difference.',
      },
      {
        q: 'What is Model United Nations?',
        a: 'Model United Nations (MUN) is an academic simulation of the United Nations where students represent countries and debate real-world issues. Participants research positions, deliver speeches, and draft resolutions — building public speaking, critical thinking, and negotiation skills in the process.',
      },
      {
        q: 'Is NCIMUN suitable for first-time MUN delegates?',
        a: 'Absolutely. NCIMUN welcomes delegates of all experience levels. Our staff and chairs are trained to support first-timers throughout the conference. Don\'t let inexperience hold you back — everyone starts somewhere.',
      },
      {
        q: 'How do I contact the NCIMUN team?',
        a: 'You can reach us by email at ncimun@gmail.com, by phone at 010 3162 3162, or via Instagram @ncimun_tkh. We\'re also available through the Contact page on this portal.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <main className="fq-root">
      {/* ── Nav ── */}
      <nav className="fq-nav">
        <div className="fq-nav-inner">
          <Link href="/">
            <img src="/logo.png" alt="NCIMUN" className="fq-nav-logo" />
          </Link>
          <Link href="/" className="fq-nav-back">← Back to homepage</Link>
        </div>
      </nav>

      {/* ── Header ── */}
      <div className="fq-header">
        <div className="fq-header-inner">
          <p className="fq-eyebrow">Got questions?</p>
          <h1 className="fq-title">Frequently asked questions</h1>
          <p className="fq-subtitle">
            Everything you need to know about NCIMUN, Summer Camp, registration, and more.
            Can't find your answer? <Link href="/contact" className="fq-header-link">Contact us</Link>.
          </p>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="fq-container">
        {FAQS.map((section) => (
          <div key={section.category} className="fq-section">
            <h2 className="fq-section-title">{section.category}</h2>
            <div className="fq-items">
              {section.items.map((item, i) => {
                const key = `${section.category}-${i}`;
                const isOpen = openIndex === key;
                return (
                  <div key={key} className={`fq-item ${isOpen ? 'fq-item--open' : ''}`}>
                    <button className="fq-question" onClick={() => toggle(key)}>
                      <span>{item.q}</span>
                      <span className={`fq-icon ${isOpen ? 'fq-icon--open' : ''}`}>+</span>
                    </button>
                    {isOpen && (
                      <div className="fq-answer">{item.a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Still have questions ── */}
        <div className="fq-cta">
          <h2 className="fq-cta-title">Still have questions?</h2>
          <p className="fq-cta-desc">Our team is happy to help. Reach out and we'll get back to you as soon as possible.</p>
          <Link href="/contact" className="fq-btn-primary">Contact us →</Link>
        </div>
      </div>

      <style>{`
        :root {
          --blue:   #5F96CA;
          --aqua:   #84DBD5;
          --black:  #23272A;
          --white:  #FFFFFF;
          --gray-50:  #F8F9FA;
          --gray-200: #E9ECEF;
          --gray-400: #ADB5BD;
          --gray-600: #6C757D;
          --font: 'Avenir', 'Avenir Next', 'Century Gothic', sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); background: var(--gray-50); color: var(--black); }
        a { text-decoration: none; color: inherit; }

        /* Nav */
        .fq-nav {
          background: var(--white); border-bottom: 1px solid var(--gray-200);
          position: sticky; top: 0; z-index: 100;
        }
        .fq-nav-inner {
          max-width: 1100px; margin: 0 auto; padding: 0 2rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .fq-nav-logo { height: 36px; display: block; }
        .fq-nav-back { font-size: .875rem; font-weight: 600; color: var(--gray-600); transition: color .15s; }
        .fq-nav-back:hover { color: var(--black); }

        /* Header */
        .fq-header { background: var(--black); padding: 5rem 2rem; }
        .fq-header-inner { max-width: 680px; margin: 0 auto; text-align: center; }
        .fq-eyebrow {
          font-size: .75rem; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--aqua); margin-bottom: .75rem; display: block;
        }
        .fq-title {
          font-size: clamp(2rem, 6vw, 3.5rem); font-weight: 900;
          color: var(--white); letter-spacing: -.02em; margin-bottom: 1rem;
        }
        .fq-subtitle { font-size: 1rem; color: rgba(255,255,255,.6); line-height: 1.7; }
        .fq-header-link { color: var(--aqua); font-weight: 600; }
        .fq-header-link:hover { text-decoration: underline; }

        /* Container */
        .fq-container {
          max-width: 780px; margin: 0 auto;
          padding: 4rem 2rem 6rem;
          display: flex; flex-direction: column; gap: 3rem;
        }

        /* Section */
        .fq-section { display: flex; flex-direction: column; gap: 1rem; }
        .fq-section-title {
          font-size: .75rem; font-weight: 800; letter-spacing: .12em;
          text-transform: uppercase; color: var(--blue);
          padding-bottom: .75rem; border-bottom: 2px solid var(--gray-200);
        }

        /* Items */
        .fq-items { display: flex; flex-direction: column; gap: .5rem; }
        .fq-item {
          background: var(--white); border: 1.5px solid var(--gray-200);
          border-radius: 10px; overflow: hidden;
          transition: border-color .15s;
        }
        .fq-item--open { border-color: var(--blue); }
        .fq-question {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 1.125rem 1.25rem; gap: 1rem;
          background: none; border: none; cursor: pointer;
          font-family: var(--font); font-size: .9375rem; font-weight: 700;
          color: var(--black); text-align: left;
          transition: color .15s;
        }
        .fq-question:hover { color: var(--blue); }
        .fq-icon {
          font-size: 1.25rem; font-weight: 400; color: var(--gray-400);
          flex-shrink: 0; transition: transform .2s, color .15s;
          line-height: 1;
        }
        .fq-icon--open { transform: rotate(45deg); color: var(--blue); }
        .fq-answer {
          padding: 0 1.25rem 1.25rem;
          font-size: .9rem; color: var(--gray-600); line-height: 1.75;
          border-top: 1px solid var(--gray-200); padding-top: 1rem;
          margin-top: 0;
        }

        /* CTA */
        .fq-cta {
          background: var(--black); border-radius: 14px; padding: 2.5rem;
          text-align: center; display: flex; flex-direction: column;
          align-items: center; gap: 1rem;
        }
        .fq-cta-title { font-size: 1.25rem; font-weight: 900; color: var(--white); }
        .fq-cta-desc { font-size: .9rem; color: rgba(255,255,255,.6); line-height: 1.6; max-width: 380px; }
        .fq-btn-primary {
          background: var(--blue); color: var(--white);
          padding: .75rem 2rem; border-radius: 8px;
          font-size: .9375rem; font-weight: 700; font-family: var(--font);
          display: inline-block; transition: opacity .15s;
        }
        .fq-btn-primary:hover { opacity: .88; }

        @media (max-width: 600px) {
          .fq-container { padding: 3rem 1rem 5rem; }
        }
      `}</style>
    </main>
  );
}