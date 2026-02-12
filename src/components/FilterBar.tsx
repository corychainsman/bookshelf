import type { Filters } from '../types';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  years: string[];
  topics: string[];
  showSort?: boolean;
  colorBy?: string;
  onColorByChange?: (v: string) => void;
}

export function FilterBar({ filters, onChange, years, topics, showSort = true, colorBy, onColorByChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap gap-3 items-center p-4 bg-[var(--bg-secondary)] rounded-xl mb-6">
      <input
        type="text"
        placeholder="Search title or author…"
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
        className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm w-56 placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
      />

      <select
        value={filters.year}
        onChange={(e) => set({ year: e.target.value })}
        className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      >
        <option value="all">All Years</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <select
        value={filters.format}
        onChange={(e) => set({ format: e.target.value })}
        className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      >
        <option value="all">All Formats</option>
        <option value="audiobook">Audiobook</option>
        <option value="ebook">Ebook</option>
      </select>

      <select
        value={filters.source}
        onChange={(e) => set({ source: e.target.value })}
        className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      >
        <option value="all">All Sources</option>
        <option value="Libby">Libby</option>
        <option value="Hoopla">Hoopla</option>
      </select>

      <select
        value={filters.topic}
        onChange={(e) => set({ topic: e.target.value })}
        className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      >
        <option value="all">All Topics</option>
        {topics.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {showSort && (
        <>
          <select
            value={filters.sortBy}
            onChange={(e) => set({ sortBy: e.target.value as any })}
            className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="rating">Sort by Rating</option>
            <option value="title">Sort by Title</option>
          </select>
          <button
            onClick={() => set({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' })}
            className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors"
          >
            {filters.sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </>
      )}

      {colorBy !== undefined && onColorByChange && (
        <select
          value={colorBy}
          onChange={(e) => onColorByChange(e.target.value)}
          className="bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--accent)]/50 rounded-lg px-3 py-2 text-sm ml-auto"
        >
          <option value="topic">Color: Topic</option>
          <option value="format">Color: Format</option>
          <option value="source">Color: Source</option>
          <option value="rating">Color: Rating</option>
        </select>
      )}
    </div>
  );
}
