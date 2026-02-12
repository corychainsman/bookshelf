import { useState, useEffect, useMemo } from 'react';
import type { Book, Filters, ViewMode } from './types';
import { loadBooks, getYears, getAllTopics, filterBooks } from './data';
import { FilterBar } from './components/FilterBar';
import { BookGrid } from './components/BookGrid';
import { GanttChart } from './components/GanttChart';
import { TrendsView } from './components/TrendsView';

const defaultFilters: Filters = {
  search: '',
  year: 'all',
  format: 'all',
  source: 'all',
  ratingMin: 0,
  ratingMax: 10,
  topic: 'all',
  sortBy: 'date',
  sortDir: 'desc',
};

function parseFiltersFromUrl(params: URLSearchParams): Filters {
  return {
    search: params.get('search') || '',
    year: params.get('year') || 'all',
    format: params.get('format') || 'all',
    source: params.get('source') || 'all',
    ratingMin: Number(params.get('ratingMin') ?? 0),
    ratingMax: Number(params.get('ratingMax') ?? 10),
    topic: params.get('topic') || 'all',
    sortBy: (params.get('sortBy') as Filters['sortBy']) || 'date',
    sortDir: (params.get('sortDir') as Filters['sortDir']) || 'desc',
  };
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize all state from URL params on first load
  const [filters, setFilters] = useState<Filters>(() =>
    parseFiltersFromUrl(new URLSearchParams(window.location.search))
  );
  const [view, setView] = useState<ViewMode>(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    return (v as ViewMode) || 'grid';
  });
  const [zoom, setZoom] = useState<number>(() => {
    const z = new URLSearchParams(window.location.search).get('zoom');
    return z ? Number(z) : 1;
  });
  const [rowScale, setRowScale] = useState<number>(() => {
    const s = new URLSearchParams(window.location.search).get('scale');
    return s ? Number(s) : 1;
  });
  const [colorBy, setColorBy] = useState<string>(() =>
    new URLSearchParams(window.location.search).get('colorby') || 'topic'
  );

  useEffect(() => {
    loadBooks().then((b) => {
      setBooks(b);
      setLoading(false);
    });
  }, []);

  // Sync all state → URL whenever anything changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== 'grid')            params.set('view', view);
    if (filters.search)             params.set('search', filters.search);
    if (filters.year !== 'all')     params.set('year', filters.year);
    if (filters.format !== 'all')   params.set('format', filters.format);
    if (filters.source !== 'all')   params.set('source', filters.source);
    if (filters.ratingMin !== 0)    params.set('ratingMin', String(filters.ratingMin));
    if (filters.ratingMax !== 10)   params.set('ratingMax', String(filters.ratingMax));
    if (filters.topic !== 'all')    params.set('topic', filters.topic);
    if (filters.sortBy !== 'date')  params.set('sortBy', filters.sortBy);
    if (filters.sortDir !== 'desc') params.set('sortDir', filters.sortDir);
    if (zoom !== 1)                 params.set('zoom', String(Math.round(zoom * 100) / 100));
    if (rowScale !== 1)             params.set('scale', String(rowScale));
    if (colorBy !== 'topic')        params.set('colorby', colorBy);

    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [view, filters, zoom, rowScale, colorBy]);

  // Reset zoom when year filter changes
  const handleFiltersChange = (newFilters: Filters) => {
    if (newFilters.year !== filters.year) setZoom(1);
    setFilters(newFilters);
  };

  const years = useMemo(() => getYears(books), [books]);
  const topics = useMemo(() => getAllTopics(books), [books]);
  const filtered = useMemo(() => filterBooks(books, filters), [books, filters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-secondary)] text-lg">Loading books…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--bg-primary)]/90 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              📚 Library
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {books.length} books read
            </p>
          </div>

          <nav className="flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
            {[
              { id: 'grid' as ViewMode, label: '📖 Grid' },
              { id: 'gantt' as ViewMode, label: '📊 Timeline' },
              { id: 'trends' as ViewMode, label: '📈 Trends' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  view === tab.id
                    ? 'bg-[var(--accent)] text-white shadow-lg shadow-indigo-500/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {view !== 'trends' && (
          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            years={years}
            topics={topics}
            showSort={view === 'grid'}
            colorBy={view === 'gantt' ? colorBy : undefined}
            onColorByChange={view === 'gantt' ? setColorBy : undefined}
          />
        )}

        {view === 'grid' && <BookGrid books={filtered} />}
        {view === 'gantt' && (
          <GanttChart
            books={filtered}
            selectedYear={filters.year}
            zoom={zoom}
            onZoomChange={setZoom}
            rowScale={rowScale}
            onRowScaleChange={setRowScale}
            colorBy={colorBy}
          />
        )}
        {view === 'trends' && <TrendsView books={books} />}
      </main>
    </div>
  );
}
