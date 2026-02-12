import type { Book } from '../types';
import { TOPIC_COLORS } from '../colors';
import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';

interface Props {
  books: Book[];
}


const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-2 shadow-xl text-sm">
      <p className="font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function TrendsView({ books }: Props) {
  // Reading pace by quarter
  const paceData = useMemo(() => {
    const quarters: Record<string, number> = {};
    books.forEach((b) => {
      if (!b.end_date) return;
      const d = new Date(b.end_date);
      const q = `${d.getFullYear()} Q${Math.ceil((d.getMonth() + 1) / 3)}`;
      quarters[q] = (quarters[q] || 0) + 1;
    });
    return Object.entries(quarters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, count]) => ({ quarter, count }));
  }, [books]);

  // Rating distribution
  const ratingData = useMemo(() => {
    const counts: Record<number, number> = {};
    books.forEach((b) => {
      if (b.rating != null) counts[b.rating] = (counts[b.rating] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([rating, count]) => ({ rating: `${rating}/10`, count }));
  }, [books]);

  // Topic frequency
  const topicData = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => b.topics?.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([topic, count]) => ({ topic, count }));
  }, [books]);

  // Topics over time (by year)
  const topicsOverTime = useMemo(() => {
    const yearTopics: Record<string, Record<string, number>> = {};
    books.forEach((b) => {
      if (!b.end_date) return;
      const year = b.end_date.slice(0, 4);
      if (!yearTopics[year]) yearTopics[year] = {};
      b.topics?.forEach((t) => {
        yearTopics[year][t] = (yearTopics[year][t] || 0) + 1;
      });
    });
    const topTopics = topicData.slice(0, 10).map((t) => t.topic);
    return Object.entries(yearTopics)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, topics]) => ({
        year,
        ...Object.fromEntries(topTopics.map((t) => [t, topics[t] || 0])),
      }));
  }, [books, topicData]);

  // Format over time
  const formatOverTime = useMemo(() => {
    const yearFormat: Record<string, { audiobook: number; ebook: number }> = {};
    books.forEach((b) => {
      if (!b.end_date) return;
      const year = b.end_date.slice(0, 4);
      if (!yearFormat[year]) yearFormat[year] = { audiobook: 0, ebook: 0 };
      yearFormat[year][b.format]++;
    });
    return Object.entries(yearFormat)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, f]) => ({ year, ...f }));
  }, [books]);

  // Top authors
  const authorData = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => b.author.forEach((a) => (counts[a] = (counts[a] || 0) + 1)));
    return Object.entries(counts)
      .filter(([, c]) => c > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([author, count]) => ({ author, count }));
  }, [books]);

  // Average reading duration by year
  const durationData = useMemo(() => {
    const yearDurations: Record<string, number[]> = {};
    books.forEach((b) => {
      if (!b.start_date || !b.end_date) return;
      const days = (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24);
      if (days < 0 || days > 365) return;
      const year = b.end_date.slice(0, 4);
      if (!yearDurations[year]) yearDurations[year] = [];
      yearDurations[year].push(days);
    });
    return Object.entries(yearDurations)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, durations]) => ({
        year,
        avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
      }));
  }, [books]);

  const topTopics = topicData.slice(0, 10).map((t) => t.topic);

  return (
    <div className="space-y-10">
      {/* Reading Pace */}
      <section>
        <h2 className="text-lg font-semibold mb-4">📈 Reading Pace (Books per Quarter)</h2>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={paceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="quarter" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Books" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Topics Over Time */}
      <section>
        <h2 className="text-lg font-semibold mb-4">🧠 What Were You Thinking About? (Topics Over Time)</h2>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={topicsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {topTopics.map((topic) => (
                <Area
                  key={topic}
                  type="monotone"
                  dataKey={topic}
                  stackId="1"
                  stroke={TOPIC_COLORS[topic] || '#6366f1'}
                  fill={TOPIC_COLORS[topic] || '#6366f1'}
                  fillOpacity={0.7}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Topic Frequency */}
      <section>
        <h2 className="text-lg font-semibold mb-4">📚 Topic Frequency</h2>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topicData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis dataKey="topic" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Books" radius={[0, 4, 4, 0]}>
                {topicData.map((entry) => (
                  <Cell key={entry.topic} fill={TOPIC_COLORS[entry.topic] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <section>
          <h2 className="text-lg font-semibold mb-4">⭐ Rating Distribution</h2>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="rating" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Books" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Format Over Time */}
        <section>
          <h2 className="text-lg font-semibold mb-4">🎧 Format Over Time</h2>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="audiobook" name="Audiobook" fill="#8b5cf6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="ebook" name="Ebook" fill="#3b82f6" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Top Authors */}
        <section>
          <h2 className="text-lg font-semibold mb-4">✍️ Most Read Authors</h2>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={authorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis dataKey="author" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Books" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Reading Duration */}
        <section>
          <h2 className="text-lg font-semibold mb-4">⏱️ Avg Reading Duration (Days)</h2>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="avg" stroke="#f97316" name="Average" strokeWidth={2} />
                <Line type="monotone" dataKey="median" stroke="#06b6d4" name="Median" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Fun Stats */}
      <section>
        <h2 className="text-lg font-semibold mb-4">🎯 Quick Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Books" value={books.length.toString()} />
          <StatCard
            label="Avg Rating"
            value={(
              books.filter((b) => b.rating != null).reduce((s, b) => s + (b.rating || 0), 0) /
              books.filter((b) => b.rating != null).length
            ).toFixed(1)}
          />
          <StatCard
            label="Audiobooks"
            value={`${Math.round((books.filter((b) => b.format === 'audiobook').length / books.length) * 100)}%`}
          />
          <StatCard
            label="Top Topic"
            value={topicData[0]?.topic || '—'}
          />
          <StatCard
            label="Top Author"
            value={authorData[0]?.author?.split(' ').pop() || '—'}
          />
          <StatCard
            label="Unique Authors"
            value={new Set(books.flatMap((b) => b.author)).size.toString()}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)] text-center">
      <p className="text-2xl font-bold text-[var(--accent-hover)]">{value}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{label}</p>
    </div>
  );
}
