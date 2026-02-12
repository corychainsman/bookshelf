import { useEffect, useRef } from 'react';
import type { Book } from '../types';
import { ratingToMoons } from '../data';
import { TOPIC_COLORS } from '../colors';

interface Props {
  book: Book;
  x: number;
  y: number;
}

export function BookTooltip({ book, x, y }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Mount → showPopover, unmount → hidePopover (top-layer, never clipped)
  useEffect(() => {
    const el = ref.current as any;
    if (!el?.showPopover) return;
    el.showPopover();
    return () => { try { el.hidePopover(); } catch {} };
  }, []);

  // Clamp to viewport with a safe margin
  const PAD = 8;
  const TIP_W = 316;  // 300px content + borders/shadow
  const TIP_H = 340;  // generous height estimate
  const left = Math.max(PAD, Math.min(x + 16, window.innerWidth  - TIP_W - PAD));
  const top  = Math.max(PAD, Math.min(y + 16, window.innerHeight - TIP_H - PAD));

  return (
    <div
      ref={ref}
      // @ts-expect-error: popover attr not yet in React 18 JSX types
      popover="manual"
      style={{
        // Reset UA popover defaults
        position: 'fixed',
        inset: 'auto',
        margin: 0,
        padding: 0,
        border: 'none',
        background: 'transparent',
        overflow: 'visible',
        left,
        top,
        width: 300,
        color: 'var(--text-primary)',
        pointerEvents: 'none',
      }}
    >
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 shadow-2xl">
        <div className="flex gap-3">
          {book.image_url && (
            <img
              src={book.image_url}
              alt=""
              className="rounded object-contain flex-shrink-0"
              style={{ width: 56, maxHeight: 90 }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-snug">{book.full_title}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
              {book.author.join(', ')}
            </p>
            <p className="text-sm mt-1">{ratingToMoons(book.rating)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-xs">
          {book.start_date && (
            <div>
              <p className="text-[var(--text-secondary)] mb-0.5">Started</p>
              <p>{book.start_date}</p>
            </div>
          )}
          {book.end_date && (
            <div>
              <p className="text-[var(--text-secondary)] mb-0.5">Finished</p>
              <p>{book.end_date}</p>
            </div>
          )}
          <div>
            <p className="text-[var(--text-secondary)] mb-0.5">Format</p>
            <p>{book.format === 'audiobook' ? '🎧 Audiobook' : '📖 Ebook'}</p>
          </div>
          {book.where_i_got_it && (
            <div>
              <p className="text-[var(--text-secondary)] mb-0.5">Source</p>
              <p>{book.where_i_got_it}</p>
            </div>
          )}
        </div>

        {book.topics && book.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {book.topics.map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  background: (TOPIC_COLORS[t] || '#6b7280') + '33',
                  color: TOPIC_COLORS[t] || '#9ca3af',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
