import type { Book } from '../types';
import { ratingToMoons } from '../data';
import { useState } from 'react';
import { TOPIC_COLORS } from '../colors';

interface Props {
  books: Book[];
}

function BookCard({ book }: { book: Book }) {
  const [imgError, setImgError] = useState(false);

  const dateRange = [book.start_date, book.end_date].filter(Boolean).join(' → ');

  return (
    <div className="bg-[var(--bg-card)] rounded-xl overflow-hidden hover:bg-[var(--bg-hover)] transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col">
      {/* Cover */}
      <div className="relative aspect-[2/3] bg-[var(--bg-secondary)] overflow-hidden">
        {book.image_url && !imgError ? (
          <img
            src={book.image_url}
            alt={book.full_title}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center">
            <span className="text-[var(--text-secondary)] text-sm">{book.full_title}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2">{book.full_title}</h3>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-1">{book.author.join(', ')}</p>

        <div className="text-sm">{ratingToMoons(book.rating)}</div>

        {/* Format + Source */}
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-[var(--text-secondary)]">
          <span>{book.format === 'audiobook' ? '🎧 Audiobook' : '📖 Ebook'}</span>
          {book.where_i_got_it && <span>· {book.where_i_got_it}</span>}
        </div>

        {/* Dates */}
        {dateRange && (
          <p className="text-xs text-[var(--text-secondary)]">{dateRange}</p>
        )}

        {/* Topics */}
        {book.topics && book.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
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

export function BookGrid({ books }: Props) {
  return (
    <div>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{books.length} books</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {books.map((book) => (
          <BookCard key={book._filename} book={book} />
        ))}
      </div>
    </div>
  );
}
