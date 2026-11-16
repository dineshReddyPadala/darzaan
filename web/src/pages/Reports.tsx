import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { QualityByWorker } from '../components/qc/QualityByWorker';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { useApp } from '../contexts/AppContext';
import { stages } from '../data/production';
import type { Employee } from '../types';
import { readHydration } from '../services/sync';
import { inr } from '../utils/format';
import { isActive } from '../utils/orders';
import { pageClass, panelClass } from '../utils/styles';
type Tab = 'sales' | 'production' | 'quality' | 'delivery' | 'customer';
const axis = {
  fontSize: 12,
  fill: '#8A8670'
};
const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #ECE8DF',
  fontSize: 13,
  background: '#FFFFFF'
};
export function Reports() {
  const {
    orders
  } = useApp();
  const [tab, setTab] = useState<Tab>('sales');
  const savedReports = readHydration<{ revenueByWeek?: { week: string; revenue: number; orders: number }[]; qcByStation?: { station: string; rejectRate: number; reworkHrs: number }[]; onTimeByWeek?: { week: string; onTime: number; express: number }[]; customerMetrics?: { label: string; value: string; delta: string }[] }>('reports');
  const series = savedReports && !Array.isArray(savedReports) ? savedReports : undefined;
  const salesWeeks = series?.revenueByWeek ?? [];
  const stationQuality = series?.qcByStation ?? [];
  const deliveryWeeks = series?.onTimeByWeek ?? [];
  const customerRows = series?.customerMetrics ?? [];
  const people = readHydration<Employee[]>('team') ?? [];
  const last = salesWeeks.length ? salesWeeks[salesWeeks.length - 1] : undefined;
  const prev = salesWeeks.length > 1 ? salesWeeks[salesWeeks.length - 2] : undefined;
  const byStage = stages.slice(0, stages.findIndex((st) => st.key === 'logistics') + 1).map((s) => ({
    stage: s.label.replace('Production ', '').replace(' / Dyeing', ''),
    count: orders.filter(isActive).flatMap((o) => o.garments).filter((g) => g.stage === s.key).length
  }));
  const workers = people.filter((e) => e.avgCycleHrs > 0 && e.station !== 'QC' && e.station !== 'Packaging' && e.station !== 'Logistics');
  return <div className={pageClass}>
      <PageHeader title="Reports" subtitle="Last 8 weeks" />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{
      key: 'sales',
      label: 'Sales'
    }, {
      key: 'production',
      label: 'Production'
    }, {
      key: 'quality',
      label: 'Quality'
    }, {
      key: 'delivery',
      label: 'Delivery'
    }, {
      key: 'customer',
      label: 'Customer'
    }]} />
      <div className="pt-6">
        {tab === 'sales' && !last && <p className={`${panelClass} px-5 py-8 text-sm text-ink-muted`}>No sales recorded yet.</p>}
        {tab === 'sales' && last && <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className={`${panelClass} p-5`}>
              <p className="text-sm text-ink-muted">Revenue this week</p>
              <p className="text-3xl font-semibold tabular">{inr(last.revenue)}</p>
              {prev && prev.revenue > 0 && <p className="text-sm text-success">+{Math.round((last.revenue - prev.revenue) / prev.revenue * 100)}% vs last week</p>}
              <div className="mt-4 h-64">
                <ResponsiveContainer>
                  <LineChart data={salesWeeks} margin={{
                left: 0,
                right: 8,
                top: 8
              }}>
                    <CartesianGrid stroke="#F1EEEA" vertical={false} />
                    <XAxis dataKey="week" tick={axis} axisLine={false} tickLine={false} />
                    <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${v / 100000}L`} width={48} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => inr(v)} />
                    <Line type="monotone" dataKey="revenue" stroke="#5B6B2F" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className={`${panelClass} divide-y divide-line`}>
              {[['Orders this week', String(last.orders)], ['Average order value', last.orders ? inr(last.revenue / last.orders) : '—']].map(([k, v]) => <div key={k} className="px-5 py-4">
                  <p className="text-sm text-ink-muted">{k}</p>
                  <p className="text-xl font-semibold tabular">{v}</p>
                </div>)}
            </section>
          </div>}

        {tab === 'production' && <div className="grid gap-6 lg:grid-cols-2">
            <section className={`${panelClass} p-5`}>
              <h3 className="mb-4 text-[16px] font-semibold">Garments by stage now</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={byStage} layout="vertical" margin={{
                left: 8
              }}>
                    <XAxis type="number" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="stage" tick={axis} axisLine={false} tickLine={false} width={96} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#2B2A20" radius={[0, 6, 6, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className={panelClass}>
              <h3 className="border-b border-line px-5 py-4 text-[16px] font-semibold">Worker productivity</h3>
              <ul className="divide-y divide-line">
                {workers.map((e) => <li key={e.id} className="grid grid-cols-[1fr_80px_80px] items-center gap-3 px-5 py-3">
                    <div><p className="text-[15px] font-medium">{e.name}</p><p className="text-sm text-ink-subtle">{e.station}</p></div>
                    <p className="text-right text-sm tabular"><span className="font-semibold">{e.tasksThisWeek}</span> tasks</p>
                    <p className="text-right text-sm tabular text-ink-muted">{e.avgCycleHrs} h avg</p>
                  </li>)}
              </ul>
            </section>
          </div>}

        {tab === 'quality' && <div className="grid gap-6 lg:grid-cols-2">
            <section className={`${panelClass} p-5`}>
              <h3 className="mb-4 text-[16px] font-semibold">QC rejection rate by station</h3>
              {stationQuality.length === 0 && <p className="text-sm text-ink-muted">No inspections recorded yet.</p>}
              {stationQuality.length > 0 && <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={stationQuality}>
                    <CartesianGrid stroke="#F1EEEA" vertical={false} />
                    <XAxis dataKey="station" tick={axis} axisLine={false} tickLine={false} />
                    <YAxis tick={axis} axisLine={false} tickLine={false} unit="%" width={40} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="rejectRate" name="Reject rate %" fill="#5B6B2F" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>}
            </section>
            {stationQuality.length > 0 && <section className={panelClass}>
              <h3 className="border-b border-line px-5 py-4 text-[16px] font-semibold">Rework this month</h3>
              <p className="px-5 py-4 text-sm text-ink-muted">{stationQuality.reduce((s, q) => s + q.reworkHrs, 0).toFixed(1)} hours</p>
            </section>}
            <QualityByWorker orders={orders} />
          </div>}

        {tab === 'delivery' && deliveryWeeks.length === 0 && <p className={`${panelClass} px-5 py-8 text-sm text-ink-muted`}>No deliveries recorded yet.</p>}
        {tab === 'delivery' && deliveryWeeks.length > 0 && <section className={`${panelClass} p-5`}>
            <h3 className="text-[16px] font-semibold">On-time delivery</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={deliveryWeeks}>
                  <CartesianGrid stroke="#F1EEEA" vertical={false} />
                  <XAxis dataKey="week" tick={axis} axisLine={false} tickLine={false} />
                  <YAxis domain={[75, 100]} tick={axis} axisLine={false} tickLine={false} unit="%" width={44} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{
                fontSize: 13
              }} />
                  <Line type="monotone" dataKey="onTime" name="Regular" stroke="#2B2A20" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="express" name="Express" stroke="#A5560F" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>}

        {tab === 'customer' && customerRows.length === 0 && <p className={`${panelClass} px-5 py-8 text-sm text-ink-muted`}>No customer figures recorded yet.</p>}
        {tab === 'customer' && customerRows.length > 0 && <section className={`${panelClass} grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4`}>
            {customerRows.map((m) => <div key={m.label} className="p-5">
                <p className="text-sm text-ink-muted">{m.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular">{m.value}</p>
                <p className="text-sm text-success">{m.delta} vs last month</p>
              </div>)}
          </section>}
      </div>
    </div>;
}