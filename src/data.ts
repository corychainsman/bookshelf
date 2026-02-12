import { Book, Filters } from './types';
import { topicMap } from './topicMap';

let cachedBooks: Book[] | null = null;

export async function loadBooks(): Promise<Book[]> {
  if (cachedBooks) return cachedBooks;
  const res = await fetch('/books.json');
  const raw = await res.json();
  cachedBooks = raw.map((b: any) => ({
    ...b,
    author: Array.isArray(b.author) ? b.author : b.author ? [b.author] : [],
    rating: b.rating != null ? Number(b.rating) : null,
    topics: topicMap[b._filename] || ['Uncategorized'],
  }));
  return cachedBooks!;
}

export function getYears(books: Book[]): string[] {
  const years = new Set<string>();
  books.forEach((b) => {
    if (b.end_date) years.add(b.end_date.slice(0, 4));
    if (b.start_date) years.add(b.start_date.slice(0, 4));
  });
  return Array.from(years).sort().reverse();
}

export function getAllTopics(books: Book[]): string[] {
  const topics = new Set<string>();
  books.forEach((b) => b.topics?.forEach((t) => topics.add(t)));
  return Array.from(topics).sort();
}

export function filterBooks(books: Book[], filters: Filters): Book[] {
  let result = [...books];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (b) =>
        b.full_title.toLowerCase().includes(q) ||
        b.author.some((a) => a.toLowerCase().includes(q))
    );
  }

  if (filters.year && filters.year !== 'all') {
    result = result.filter(
      (b) =>
        b.end_date?.startsWith(filters.year) ||
        b.start_date?.startsWith(filters.year)
    );
  }

  if (filters.format && filters.format !== 'all') {
    result = result.filter((b) => b.format === filters.format);
  }

  if (filters.source && filters.source !== 'all') {
    result = result.filter((b) => b.where_i_got_it === filters.source);
  }

  if (filters.topic && filters.topic !== 'all') {
    result = result.filter((b) => b.topics?.includes(filters.topic));
  }

  if (filters.ratingMin > 0) {
    result = result.filter((b) => b.rating != null && b.rating >= filters.ratingMin);
  }

  if (filters.ratingMax < 10) {
    result = result.filter((b) => b.rating != null && b.rating <= filters.ratingMax);
  }

  // Sort
  result.sort((a, b) => {
    let cmp = 0;
    switch (filters.sortBy) {
      case 'date':
        cmp = (a.end_date || '').localeCompare(b.end_date || '');
        break;
      case 'rating':
        cmp = (a.rating || 0) - (b.rating || 0);
        break;
      case 'title':
        cmp = a.full_title.localeCompare(b.full_title);
        break;
    }
    return filters.sortDir === 'desc' ? -cmp : cmp;
  });

  return result;
}

export function ratingToMoons(rating: number | null): string {
  if (rating == null) return '—';
  if (rating >= 10) return '🌕🌕🌕🌕🌕';
  if (rating >= 9) return '🌕🌕🌕🌕🌗';
  if (rating >= 8) return '🌕🌕🌕🌕🌑';
  if (rating >= 7) return '🌕🌕🌕🌗🌑';
  if (rating >= 6) return '🌕🌕🌕🌑🌑';
  if (rating >= 5) return '🌕🌕🌗🌑🌑';
  if (rating >= 4) return '🌕🌕🌑🌑🌑';
  if (rating >= 3) return '🌕🌗🌑🌑🌑';
  if (rating >= 2) return '🌕🌑🌑🌑🌑';
  if (rating >= 1) return '🌗🌑🌑🌑🌑';
  return '🌑🌑🌑🌑🌑';
}
