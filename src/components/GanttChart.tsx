import type { Book } from '../types';
import { BookTooltip } from './BookTooltip';
import { useMemo, useState, useRef, useEffect } from 'react';
import { TOPIC_COLORS, FORMAT_COLORS, SOURCE_PALETTE, RATING_COLORS } from '../colors';

interface Props {
  books: Book[];
  selectedYear?: string;
  zoom: number;
  onZoomChange: (z: number) => void;
  rowScale: number;
  onRowScaleChange: (s: number) => void;
  colorBy: string;
}

const BASE_WIDTH = 2000;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 30;

export function GanttChart({ books, selectedYear, zoom, onZoomChange, rowScale, onRowScaleChange, colorBy }: Props) {
  const [hoveredBook, setHoveredBook] = useState<Book | null>(null);
  const [clipTitles, setClipTitles] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPinchDist = useRef<number | null>(null);

  const { booksWithDates, minDate, maxDate, totalDays } = useMemo(() => {
    const valid = books
      .filter((b) => b.start_date && b.end_date)
      .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));

    let min: Date, max: Date;

    if (selectedYear && selectedYear !== 'all') {
      const year = parseInt(selectedYear);
      min = new Date(year, 0, 1);   // Jan 1
      max = new Date(year, 11, 31); // Dec 31
    } else {
      if (valid.length === 0) return { booksWithDates: [], minDate: new Date(), maxDate: new Date(), totalDays: 1 };
      const dates = valid.flatMap((b) => [new Date(b.start_date!), new Date(b.end_date!)]);
      min = new Date(Math.min(...dates.map((d) => d.getTime())));
      max = new Date(Math.max(...dates.map((d) => d.getTime())));
      min.setDate(1);
      max.setMonth(max.getMonth() + 1, 0);
    }

    const days = (max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24);
    return { booksWithDates: valid, minDate: min, maxDate: max, totalDays: days };
  }, [books, selectedYear]);

  const months = useMemo(() => {
    const result: { label: string; offset: number; width: number; isYearStart: boolean }[] = [];
    const cursor = new Date(minDate);
    while (cursor <= maxDate) {
      const start = (cursor.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const end = Math.min(
        (nextMonth.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
        totalDays
      );
      const isYearStart = cursor.getMonth() === 0;
      // January shows full year, all other months just show short month name
      const label = isYearStart
        ? cursor.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) // "Jan 2025"
        : cursor.toLocaleDateString('en-US', { month: 'short' });                 // "Feb"
      result.push({
        label,
        offset: (start / totalDays) * 100,
        width: ((end - start) / totalDays) * 100,
        isYearStart,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }, [minDate, maxDate, totalDays]);

  const sourceColorMap = useMemo(() => {
    const sources = [...new Set(books.map((b) => b.where_i_got_it).filter(Boolean))].sort();
    const map: Record<string, string> = {};
    sources.forEach((s, i) => { map[s] = SOURCE_PALETTE[i % SOURCE_PALETTE.length]; });
    return map;
  }, [books]);

  const getBarColor = (book: Book): string => {
    if (colorBy === 'format') return FORMAT_COLORS[book.format] || '#6366f1';
    if (colorBy === 'rating') return RATING_COLORS[book.rating ?? 5];
    if (colorBy === 'source') return sourceColorMap[book.where_i_got_it] || '#6b7280';
    // topic (default)
    const firstTopic = book.topics?.[0];
    return (firstTopic && TOPIC_COLORS[firstTopic]) || '#6b7280';
  };

  // Legend entries for current colorBy mode
  const legend = useMemo((): { label: string; color: string }[] => {
    if (colorBy === 'format') {
      return Object.entries(FORMAT_COLORS).map(([k, v]) => ({ label: k[0].toUpperCase() + k.slice(1), color: v }));
    }
    if (colorBy === 'rating') return [];
    if (colorBy === 'source') {
      return Object.entries(sourceColorMap).map(([k, v]) => ({ label: k, color: v }));
    }
    // topic
    const used = new Set(books.flatMap((b) => b.topics || []));
    return Object.entries(TOPIC_COLORS)
      .filter(([k]) => used.has(k))
      .map(([k, v]) => ({ label: k, color: v }));
  }, [colorBy, books, sourceColorMap]);

  const ROW_HEIGHT    = Math.round(32 * rowScale);
  const BAR_H         = Math.round(20 * rowScale);
  const BAR_H_HOVER   = Math.round(28 * rowScale);
  const THUMB_H       = Math.round(18 * rowScale);
  const THUMB_W       = Math.round(14 * rowScale);
  const THUMB_LEFT    = Math.round(2  * rowScale);
  const TITLE_LEFT_NO_THUMB = Math.round(4  * rowScale);
  const TITLE_LEFT_THUMB    = Math.round(THUMB_LEFT + THUMB_W + 2);
  const FONT_SIZE     = Math.round(10 * rowScale);
  const THUMB_PX_MIN  = Math.round(22 * rowScale);
  const TITLE_PX_MIN  = Math.round(70 * rowScale);
  const chartWidth    = BASE_WIDTH * zoom;

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  // Keep refs for zoom/callback so event listeners don't go stale
  const zoomRef = useRef(zoom);
  const onZoomChangeRef = useRef(onZoomChange);
  const lastZoomUpdate = useRef(0);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { onZoomChangeRef.current = onZoomChange; }, [onZoomChange]);

  const pinchDist = (t: TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const applyZoom = (newZoom: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    const now = performance.now();
    if (now - lastZoomUpdate.current < 16) return; // throttle to ~60fps
    lastZoomUpdate.current = now;
    zoomRef.current = clamped;
    onZoomChangeRef.current(clamped);
  };

  // All zoom gestures via native listeners so we can call preventDefault()
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        applyZoom(zoomRef.current * factor);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastPinchDist.current = pinchDist(e.touches);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDist.current !== null && lastPinchDist.current > 0) {
        e.preventDefault();
        const dist = pinchDist(e.touches);
        const delta = dist / lastPinchDist.current;
        if (isFinite(delta) && delta > 0) applyZoom(zoomRef.current * delta);
        lastPinchDist.current = dist;
      }
    };

    const onTouchEnd = () => { lastPinchDist.current = null; };

    el.addEventListener('wheel',      onWheel,      { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false }); // passive:false so preventDefault works
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd);
    return () => {
      el.removeEventListener('wheel',      onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, []); // runs once; uses refs for current values

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <p className="text-sm text-[var(--text-secondary)]">{booksWithDates.length} books with dates</p>

        {/* Legend */}
        {legend.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}

        {/* Row scale slider */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Size:</span>
          <input
            type="range"
            min={0.5} max={4} step={0.25}
            value={rowScale}
            onChange={(e) => onRowScaleChange(Number(e.target.value))}
            className="w-24 accent-[var(--accent)]"
          />
          <span className="text-xs text-[var(--text-secondary)] w-8">{rowScale}×</span>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[var(--text-secondary)]">Zoom:</span>
          <button
            onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom / 1.3))}
            className="text-xs px-2 py-1 rounded bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >−</button>
          <span className="text-xs text-[var(--text-secondary)] w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom * 1.3))}
            className="text-xs px-2 py-1 rounded bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >+</button>
          {zoom !== 1 && (
            <button
              onClick={() => onZoomChange(1)}
              className="text-xs px-2 py-1 rounded bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >Reset</button>
          )}
          <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={clipTitles}
              onChange={e => setClipTitles(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Clip titles
          </label>
          <span className="text-xs text-[var(--text-secondary)] opacity-50 hidden sm:inline">· Pinch to zoom</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-auto bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]"
        style={{ maxHeight: '75vh', touchAction: 'pan-x pan-y' }}
        onMouseMove={handleMouseMove}
      >
        {/* Month headers — sticky so always visible while scrolling down */}
        <div className="sticky top-0 z-10 flex bg-[var(--bg-secondary)] border-b border-[var(--border)]" style={{ minWidth: `${chartWidth}px` }}>
          {months.map((m, i) => {
            const colPx = (m.width / 100) * chartWidth;
            // Jan needs more room ("Jan 2025" is wider); other months just need ~22px
            const minPxToShow = m.isYearStart ? 50 : 22;
            return (
              <div
                key={i}
                className={`text-xs py-2 px-1 text-center border-r border-[var(--border)] overflow-hidden ${
                  m.isYearStart
                    ? 'text-[var(--text-primary)] font-semibold border-l-2 border-l-[var(--accent)]'
                    : 'text-[var(--text-secondary)]'
                }`}
                style={{ width: `${m.width}%`, minWidth: 0 }}
              >
                {colPx >= minPxToShow ? m.label : ''}
              </div>
            );
          })}
        </div>

        {/* Bars */}
        <div className="relative" style={{ minWidth: `${chartWidth}px`, height: booksWithDates.length * ROW_HEIGHT }}>
          {/* Grid lines — same flex layout as header for pixel-perfect alignment */}
          <div className="absolute top-0 bottom-0 left-0 right-0 flex pointer-events-none">
            {months.map((m, i) => (
              <div
                key={i}
                className={`flex-shrink-0 h-full border-r border-[var(--border)]/30 ${
                  m.isYearStart ? 'border-l-2 border-l-[var(--accent)]' : ''
                }`}
                style={{ width: `${m.width}%` }}
              />
            ))}
          </div>

          {booksWithDates.map((book, i) => {
            const startDay = (new Date(book.start_date!).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
            const endDay = (new Date(book.end_date!).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
            const left = (startDay / totalDays) * 100;
            const width = Math.max(((endDay - startDay) / totalDays) * 100, 0.3);
            const pixelWidth = (width / 100) * chartWidth;

            return (
              <div
                key={book._filename}
                className="absolute flex items-center"
                style={{ top: i * ROW_HEIGHT, left: `${left}%`, width: `${width}%`, height: ROW_HEIGHT }}
                onMouseEnter={() => setHoveredBook(book)}
                onMouseLeave={() => setHoveredBook(null)}
              >
                <div
                  className="rounded-md cursor-pointer transition-all hover:opacity-90 w-full"
                  style={{ background: getBarColor(book), opacity: 0.8, height: BAR_H }}
                  onMouseEnter={() => {
                    (document.activeElement as HTMLElement)?.blur?.();
                  }}
                />
                {book.image_url && pixelWidth > THUMB_PX_MIN && (
                  <img
                    src={book.image_url}
                    alt=""
                    className="absolute pointer-events-none rounded-[2px]"
                    style={{ left: THUMB_LEFT, top: '50%', transform: 'translateY(-50%)', height: THUMB_H, width: 'auto', maxWidth: THUMB_W, objectFit: 'cover' }}
                  />
                )}
                <span
                  className="absolute text-white pointer-events-none"
                  style={{
                    fontWeight: 300,
                    fontSize: FONT_SIZE,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: book.image_url && pixelWidth > THUMB_PX_MIN ? TITLE_LEFT_THUMB : TITLE_LEFT_NO_THUMB,
                    maxWidth: `calc(95% - ${book.image_url && pixelWidth > THUMB_PX_MIN ? TITLE_LEFT_THUMB : TITLE_LEFT_NO_THUMB}px)`,
                    overflow: clipTitles ? 'hidden' : 'visible',
                    textOverflow: clipTitles ? 'ellipsis' : 'clip',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {book.full_title}
                </span>
              </div>
            );
          })}
        </div>

        {hoveredBook && (
          <BookTooltip book={hoveredBook} x={tooltipPos.x} y={tooltipPos.y} />
        )}
      </div>
    </div>
  );
}
