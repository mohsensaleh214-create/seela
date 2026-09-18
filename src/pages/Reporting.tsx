import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { staffName } from '@/lib/selectors';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const MUTED = '#C8C3B4';
const LEVEL_COLOR = { monitored: '#2F7D4F', elevated: '#A66300', immediate: '#A32A2A' } as const;

function ChartCard({ title, sentence, children }: { title: string; sentence: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <CardTitle>{title}</CardTitle>
      <p className="mt-1 text-[14px] text-ink-muted">{sentence}</p>
      <p className="mt-1 text-[12px] text-ink-muted">Click a bar to see exactly which cases make it up.</p>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function StatTile({
  title,
  sentence,
  value,
  detail,
  to,
  linkLabel,
}: {
  title: string;
  sentence: string;
  value: string;
  detail?: string;
  to?: string;
  linkLabel?: string;
}) {
  const navigate = useNavigate();
  return (
    <Card
      className={`flex flex-col p-5 ${to ? 'cursor-pointer hover:border-line-strong' : ''}`}
      onClick={to ? () => navigate(to) : undefined}
      role={to ? 'button' : undefined}
      tabIndex={to ? 0 : undefined}
      onKeyDown={
        to
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(to);
              }
            }
          : undefined
      }
    >
      <CardTitle>{title}</CardTitle>
      <p className="mt-1 text-[14px] text-ink-muted">{sentence}</p>
      <p className="mt-3 text-[36px] font-semibold leading-none text-ink">{value}</p>
      {detail && <p className="mt-1 text-[13px] text-ink-muted">{detail}</p>}
      {to && (
        <p className="mt-2 flex items-center gap-1 text-[13px] font-medium text-safeguarding">
          {linkLabel ?? 'See the cases'}
          <ArrowRight size={13} aria-hidden />
        </p>
      )}
    </Card>
  );
}

export function Reporting() {
  const { state } = useApp();
  const { show } = useToast();
  const navigate = useNavigate();

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of state.cases) map.set(c.category, (map.get(c.category) ?? 0) + 1);
    return Array.from(map.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
  }, [state.cases]);

  const byLevel = useMemo(() => {
    const map = { monitored: 0, elevated: 0, immediate: 0 };
    for (const c of state.cases) map[c.level] += 1;
    return (['monitored', 'elevated', 'immediate'] as const).map((level) => ({ level, count: map[level] }));
  }, [state.cases]);

  const byStaff = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of state.cases) map.set(c.reportedById, (map.get(c.reportedById) ?? 0) + 1);
    return Array.from(map.entries())
      .map(([id, count]) => ({ id, name: staffName(state.staff.find((s) => s.id === id)), count }))
      .sort((a, b) => b.count - a.count);
  }, [state.cases, state.staff]);

  const avgTriageHours = useMemo(() => {
    const triaged = state.cases.filter((c) => c.triagedAt);
    if (triaged.length === 0) return null;
    const total = triaged.reduce((sum, c) => sum + (new Date(c.triagedAt!).getTime() - new Date(c.reportedAt).getTime()), 0);
    return total / triaged.length / 36e5;
  }, [state.cases]);

  const avgCloseDays = useMemo(() => {
    const closed = state.cases.filter((c) => c.closedAt && c.reportedAt);
    if (closed.length === 0) return null;
    const total = closed.reduce((sum, c) => sum + (new Date(c.closedAt!).getTime() - new Date(c.reportedAt).getTime()), 0);
    return total / closed.length / 86400000;
  }, [state.cases]);

  const contactRate = useMemo(() => {
    const eligible = state.cases.filter((c) => c.status !== 'untriaged' && (c.level === 'elevated' || c.level === 'immediate'));
    if (eligible.length === 0) return null;
    const withContact = eligible.filter((c) => state.contactRecords.some((r) => r.caseId === c.id && (!r.isException || r.authorisedById)));
    return (withContact.length / eligible.length) * 100;
  }, [state.cases, state.contactRecords]);

  return (
    <>
      <PageHeader
        title="Reporting"
        description="Prebuilt views over the current dummy data. No configuration needed."
        actions={
          <Button variant="secondary" icon={<Download size={15} />} onClick={() => show('Export started (stub) — this would generate a PDF.', 'info')}>
            Export to PDF
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Concerns by category" sentence="What kind of concern is being raised most, across the whole term.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid horizontal={false} stroke="#E2DFD5" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6B6B61' }} axisLine={{ stroke: '#E2DFD5' }} tickLine={false} />
              <YAxis type="category" dataKey="category" width={140} tick={{ fontSize: 12, fill: '#42423C' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F2F0E9' }} contentStyle={{ borderRadius: 8, borderColor: '#E2DFD5', fontSize: 13 }} />
              <Bar
                dataKey="count"
                fill={MUTED}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                cursor="pointer"
                onClick={(entry: { payload?: { category: string } }) =>
                  entry.payload && navigate(`/safeguarding/register?category=${encodeURIComponent(entry.payload.category)}`)
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cases by level of concern" sentence="How many current and past cases sit at each level.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byLevel} margin={{ top: 8 }}>
              <CartesianGrid vertical={false} stroke="#E2DFD5" />
              <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#42423C' }} axisLine={{ stroke: '#E2DFD5' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B6B61' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F2F0E9' }} contentStyle={{ borderRadius: 8, borderColor: '#E2DFD5', fontSize: 13 }} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                maxBarSize={64}
                cursor="pointer"
                onClick={(entry: { payload?: { level: string } }) => entry.payload && navigate(`/safeguarding/register?level=${entry.payload.level}`)}
              >
                {byLevel.map((entry) => (
                  <Cell key={entry.level} fill={LEVEL_COLOR[entry.level]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <StatTile
          title="Average time to triage"
          sentence="How long a report waits before it is seen and given a level of concern."
          value={avgTriageHours === null ? '—' : `${avgTriageHours.toFixed(1)}h`}
          to="/safeguarding/triage"
          linkLabel="See the triage queue"
        />
        <StatTile
          title="Average time to close"
          sentence="From report to evidenced closure, for cases that have been closed."
          value={avgCloseDays === null ? '—' : `${avgCloseDays.toFixed(0)} days`}
          to="/safeguarding/register?status=closed"
          linkLabel="See closed cases"
        />
        <StatTile
          title="Contact-home completion rate"
          sentence="Elevated and immediate cases where a parent or carer was reached, or an exception was authorised."
          value={contactRate === null ? '—' : `${contactRate.toFixed(0)}%`}
          to="/safeguarding/register?status=open"
          linkLabel="See open cases"
        />

        <ChartCard title="Staff reporting spread" sentence="Who is raising concerns — a wide spread is healthy; a single name is worth a conversation.">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStaff} margin={{ top: 8 }}>
              <CartesianGrid vertical={false} stroke="#E2DFD5" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#42423C' }} axisLine={{ stroke: '#E2DFD5' }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B6B61' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F2F0E9' }} contentStyle={{ borderRadius: 8, borderColor: '#E2DFD5', fontSize: 13 }} />
              <Bar
                dataKey="count"
                fill={MUTED}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                cursor="pointer"
                onClick={(entry: { payload?: { id: string } }) => entry.payload && navigate(`/safeguarding/register?reportedBy=${entry.payload.id}`)}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}
