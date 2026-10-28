'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { photoUrl, formatAlbumDate, GALLERY_STYLES } from './shared';

type Album = {
  id: number;
  slug: string;
  title: string;
  event_date: string | null;
  cover_photo: string | null;
  gallery_photos: { count: number }[];
};

export default function GalleryPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('gallery_albums')
      .select('id, slug, title, event_date, cover_photo, gallery_photos(count)')
      .order('sort_order')
      .order('event_date', { ascending: false })
      .then(({ data }) => {
        if (data) setAlbums(data as Album[]);
        setLoading(false);
      });
  }, []);

  return (
    <main>
      <section className="ga-hero">
        <span className="ga-eyebrow">Gallery</span>
        <h1 className="ga-title">Moments from our conferences</h1>
        <p className="ga-subtitle">Debates, ceremonies and everything in between.</p>
      </section>

      <div className="ga-container">
        {loading ? (
          <p className="ga-status">Loading albums…</p>
        ) : albums.length === 0 ? (
          <p className="ga-status">No albums yet — check back after our next conference.</p>
        ) : (
          <div className="ga-albums">
            {albums.map(album => {
              const count = album.gallery_photos?.[0]?.count ?? 0;
              return (
                <Link key={album.id} href={`/gallery/${album.slug}`} className="ga-album">
                  <div className="ga-album-cover">
                    {album.cover_photo && (
                      <img src={photoUrl(album.cover_photo.replace('/full/', '/thumb/'))} alt={album.title} loading="lazy" />
                    )}
                  </div>
                  <div className="ga-album-info">
                    <h2 className="ga-album-title">{album.title}</h2>
                    <p className="ga-album-meta">
                      {formatAlbumDate(album.event_date)}{album.event_date && ' · '}{count} photos
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{GALLERY_STYLES + `
        .ga-albums { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .ga-album { display: block; border-radius: 14px; overflow: hidden; border: 1.5px solid var(--gray-200); background: var(--white); transition: box-shadow .2s, transform .2s; }
        .ga-album:hover { box-shadow: 0 8px 32px rgba(35,39,42,.12); transform: translateY(-2px); }
        .ga-album-cover { aspect-ratio: 16 / 10; background: var(--gray-50); overflow: hidden; }
        .ga-album-cover img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s; }
        .ga-album:hover .ga-album-cover img { transform: scale(1.03); }
        .ga-album-info { padding: 1.125rem 1.25rem 1.25rem; }
        .ga-album-title { font-size: 1.0625rem; font-weight: 800; }
        .ga-album-meta { font-size: .8125rem; color: var(--gray-600); margin-top: .25rem; font-weight: 600; }
        @media (max-width: 600px) { .ga-albums { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
