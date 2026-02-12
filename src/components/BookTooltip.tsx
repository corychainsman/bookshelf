import type { Book } from '../types';
import { ratingToMoons } from '../data';
import { TOPIC_COLORS } from '../colors';

interface Props {
  book: Book;
  x: number;
  y: number;
}

export function BookTooltip({ book, x, y }: Props) {
  // Keep tooltip on screen: flip left if near right edge, flip up if near bottom
  const flipX = x > window.innerWidth  - 360;
  const flipY = y > window.innerHeight - 280;

  return (
    <div
      className="fixed z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 shadow-2xl pointer-events-none"
      style={{
        left:   flipX ? x - 16 : x + 16,
        top:    flipY ? y - 16 : y + 16,
        transform: `${flipX ? 'translateX(-100%)' : ''} ${flipY ? 'translateY(-100%)' : ''}`,
        width: 300,
      }}
    >
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
  );
}
