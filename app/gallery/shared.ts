// Photos live in the public 'gallery' storage bucket; rows in gallery_albums / gallery_photos point at them
export const photoUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/${path}`;

export function formatAlbumDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export const GALLERY_STYLES = `
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
  body { font-family: var(--font); color: var(--black); background: var(--white); }
  a { text-decoration: none; color: inherit; }


  /* Hero */
  .ga-hero { background: var(--black); padding: 4.5rem 2rem; text-align: center; }
  .ga-eyebrow { font-size: .75rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--aqua); margin-bottom: .75rem; display: block; }
  .ga-title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; color: var(--white); letter-spacing: -.02em; line-height: 1.15; }
  .ga-subtitle { font-size: 1rem; color: rgba(255,255,255,.6); margin-top: .75rem; }

  .ga-container { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem 6rem; }
  .ga-status { text-align: center; padding: 4rem 1rem; color: var(--gray-600); }

  @media (max-width: 600px) {
    .ga-hero { padding: 3rem 1rem; }
    .ga-container { padding: 2rem 1rem 4rem; }
  }
`;
