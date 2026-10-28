'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { photoUrl, formatAlbumDate, GALLERY_STYLES } from '../shared';

type Album = { id: number; title: string; event_date: string | null; cover_photo: string | null };

type Photo = {
  id: number;
  path: string;
  thumb_path: string;
  width: number;
  height: number;
};

export default function AlbumPage() {
  const { slug } = useParams<{ slug: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: albumData } = await supabase
        .from('gallery_albums')
        .select('id, title, event_date, cover_photo')
        .eq('slug', slug)
        .single();

      if (albumData) {
        setAlbum(albumData);
        const { data: photoData } = await supabase
          .from('gallery_photos')
          .select('id, path, thumb_path, width, height')
          .eq('album_id', albumData.id)
          .order('sort_order');
        if (photoData) setPhotos(photoData);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((dir: number) => {
    setOpen(i => (i === null ? null : (i + dir + photos.length) % photos.length));
  }, [photos.length]);

  // Keyboard controls and scroll lock while the viewer is open
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, step]);

  // Preload the neighbours so swiping feels instant
  useEffect(() => {
    if (open === null || photos.length < 2) return;
    [1, -1].forEach(d => {
      const img = new Image();
      img.src = photoUrl(photos[(open + d + photos.length) % photos.length].path);
    });
  }, [open, photos]);

  const current = open !== null ? photos[open] : null;

  return (
    <main>
      {loading ? (
        <p className="ga-status">Loading photos…</p>
      ) : !album ? (
        <div className="ga-status">
          <p>We couldn&apos;t find that album.</p>
          <Link href="/gallery" className="ga-link">Back to the gallery</Link>
        </div>
      ) : (
        <>
          <section
            className={`ga-hero ${album.cover_photo ? 'ga-hero--cover' : ''}`}
            style={album.cover_photo ? { backgroundImage: `linear-gradient(rgba(35,39,42,.55), rgba(35,39,42,.8)), url(${photoUrl(album.cover_photo)})` } : undefined}
          >
            <span className="ga-eyebrow">{formatAlbumDate(album.event_date) || 'Gallery'}</span>
            <h1 className="ga-title">{album.title}</h1>
            <p className="ga-subtitle">{photos.length} photos</p>
          </section>

          <div className="ga-container">
            <div className="ga-grid">
              {photos.map((p, i) => (
                <button key={p.id} className="ga-photo" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1}`}>
                  <img src={photoUrl(p.thumb_path)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {current && open !== null && (
        <div
          className="ga-viewer"
          onClick={close}
          onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <button className="ga-viewer-close" onClick={close} aria-label="Close">✕</button>
          <span className="ga-viewer-count">{open + 1} / {photos.length}</span>
          <button className="ga-viewer-nav ga-viewer-nav--prev" onClick={e => { e.stopPropagation(); step(-1); }} aria-label="Previous photo">‹</button>
          <img
            key={current.id}
            src={photoUrl(current.path)}
            alt=""
            className="ga-viewer-img"
            onClick={e => e.stopPropagation()}
          />
          <button className="ga-viewer-nav ga-viewer-nav--next" onClick={e => { e.stopPropagation(); step(1); }} aria-label="Next photo">›</button>
        </div>
      )}

      <style>{GALLERY_STYLES + `
        .ga-hero--cover { background-size: cover; background-position: center 35%; padding: 8rem 2rem 6rem; }
        .ga-hero--cover .ga-subtitle { color: rgba(255,255,255,.8); }
        .ga-link { display: inline-block; margin-top: 1rem; color: var(--blue); font-weight: 700; }

        .ga-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .ga-photo { display: block; width: 100%; aspect-ratio: 3 / 2; padding: 0; border: none; background: var(--gray-50); border-radius: 10px; overflow: hidden; cursor: zoom-in; }
        .ga-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s; }
        .ga-photo:hover img { transform: scale(1.03); }

        .ga-viewer { position: fixed; inset: 0; z-index: 300; background: rgba(20,22,24,.96); display: flex; align-items: center; justify-content: center; padding: 3.5rem 4.5rem; }
        .ga-viewer-img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; box-shadow: 0 10px 40px rgba(0,0,0,.4); animation: ga-fade .2s ease; }
        @keyframes ga-fade { from { opacity: 0; } to { opacity: 1; } }
        .ga-viewer-close { position: absolute; top: 1rem; right: 1rem; width: 40px; height: 40px; border-radius: 50%; border: none; background: rgba(255,255,255,.1); color: var(--white); font-size: 1rem; cursor: pointer; }
        .ga-viewer-close:hover { background: rgba(255,255,255,.2); }
        .ga-viewer-count { position: absolute; top: 1.4rem; left: 1.25rem; color: rgba(255,255,255,.6); font-size: .8125rem; font-weight: 700; letter-spacing: .06em; }
        .ga-viewer-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; border: none; background: rgba(255,255,255,.1); color: var(--white); font-size: 1.75rem; line-height: 1; cursor: pointer; }
        .ga-viewer-nav:hover { background: var(--blue); }
        .ga-viewer-nav--prev { left: 1rem; }
        .ga-viewer-nav--next { right: 1rem; }

        @media (max-width: 900px) { .ga-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) {
          .ga-grid { gap: .5rem; }
          .ga-hero--cover { padding: 5rem 1rem 4rem; }
          .ga-photo { border-radius: 6px; }
          .ga-viewer { padding: 3.5rem .5rem; }
          .ga-viewer-nav { display: none; }
        }
      `}</style>
    </main>
  );
}
