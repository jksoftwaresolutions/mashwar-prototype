import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ArrowLeft, ArrowRight, Bell, Car, CarFront, ChartPie, CheckCircle2, CreditCard, Eye, FileBarChart, Headphones, LayoutGrid, Map as MapIcon, Menu, Plus, Radio, Route, Search, Settings, Star, Ticket, TrendingUp, Users, UserRound, X, Activity, Wallet,
} from 'lucide-react'
import { CATEGORIES, PLACES, estimate, inDays, tripTotal, fmtDate, fmtTime, timeAgo, useStore, type Driver, type Trip, type Ticket as Tk, type Coupon } from './store'
import { useLocale } from './i18n/locale'
import { MARKET, captainNet, commissionPct, currencySymbol } from './config/market'
import MapCanvas, { pointAlong, routePts, type MapCar } from './components/MapCanvas'
import { Avatar, Btn, Card, ConfirmationModal, Drawer, Logo, Modal, Pill, RideStatusTimeline, Segmented, Stars, StatusBadge, Toggle, cx } from './components/ui'
import { LangSwitch, ResetButton, RoleSwitcher } from './components/shell'

type Page = 'overview' | 'trips' | 'live' | 'drivers' | 'riders' | 'vehicles' | 'payments' | 'coupons' | 'ratings' | 'support' | 'reports' | 'settings'
const NAV: [Page, typeof Car, string, string][] = [
  ['overview', LayoutGrid, 'نظرة عامة', 'Overview'], ['trips', Route, 'الرحلات', 'Trips'], ['live', Radio, 'الرحلات المباشرة', 'Live operations'], ['drivers', UserRound, 'الكباتن', 'Captains'],
  ['riders', Users, 'الركاب', 'Riders'], ['vehicles', CarFront, 'المركبات', 'Vehicles'], ['payments', CreditCard, 'المدفوعات', 'Payments'], ['coupons', Ticket, 'العروض والكوبونات', 'Promotions'],
  ['ratings', Star, 'التقييمات', 'Ratings'], ['support', Headphones, 'الدعم والشكاوى', 'Support'], ['reports', FileBarChart, 'التقارير', 'Reports'], ['settings', Settings, 'الإعدادات', 'Settings'],
]
const C = { navy: '#101B2E', em: '#0FAF92', gold: '#D7A867', blue: '#3B82F6', red: '#E25B53', grid: '#EEF1F5' }
const tip = { contentStyle: { borderRadius: 12, border: '1px solid #E7EBF1', fontSize: 12, boxShadow: '0 10px 30px -10px rgba(16,27,46,.2)' } }

export default function AdminApp() {
  const { t, setRole, dir, notices, markRead } = useStore()
  const [page, setPage] = useState<Page>('overview')
  const [menu, setMenu] = useState(false)
  const [bell, setBell] = useState(false)
  const [q, setQ] = useState('')
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft
  const unread = notices.filter((n) => n.role === 'admin' && !n.read).length
  const go = (p: Page) => { setPage(p); setMenu(false) }
  const sidebar = (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="px-5 py-5"><Logo light /></div>
      <div className="px-5 pb-2 text-[10px] font-bold tracking-widest text-white/30">{t('لوحة التشغيل', 'OPERATIONS')}</div>
      <nav className="thin-scroll flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map(([id, I, ar, en]) => (
          <button key={id} onClick={() => go(id)} className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', page === id ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white')}>
            <I size={17} className={page === id ? 'text-emerald' : ''} /><span className="flex-1 text-start">{t(ar, en)}</span>
            {id === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald" />}
          </button>
        ))}
      </nav>
      <div className="m-3 rounded-2xl bg-white/5 p-4">
        <div className="text-xs font-semibold">{t('نموذج تفاعلي', 'Interactive prototype')}</div>
        <div className="mt-1 text-[11px] leading-5 text-white/45">{t('بيانات محاكاة لأغراض العرض', 'Simulated data for demonstration')}</div>
        <button onClick={() => setRole('showcase')} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald"><Back size={13} />{t('العودة للعرض', 'Back to showcase')}</button>
      </div>
    </div>
  )
  return (
    <div className="flex min-h-[100dvh] bg-bg">
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 lg:block">{sidebar}</aside>
      {menu && <div className="fixed inset-0 z-[60] lg:hidden"><div className="absolute inset-0 bg-navy/50" onClick={() => setMenu(false)} /><div className="anim-fade absolute inset-y-0 start-0 w-64">{sidebar}</div></div>}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setMenu(true)} className="grid h-9 w-9 place-items-center rounded-xl border border-line lg:hidden" aria-label={t('القائمة', 'Menu')}><Menu size={18} /></button>
          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="search" aria-label={t('بحث', 'Search')} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && q && go('trips')} placeholder={t('ابحث عن رحلة، كابتن أو راكب…', 'Search trips, captains, riders…')} className="h-10 w-full rounded-xl border border-line bg-bg ps-9 pe-3 text-sm outline-none focus:border-emerald focus:bg-white" />
          </div>
          <div className="ms-auto flex items-center gap-2">
            <div className="hidden xl:block"><RoleSwitcher compact /></div>
            <LangSwitch /><ResetButton label={false} />
            <div className="relative">
              <button onClick={() => { setBell(!bell); if (bell) markRead('admin') }} className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-white" aria-label={t('common.notifications')}><Bell size={17} />{unread > 0 && <span className="absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#E25B53] px-1 text-[9px] font-bold text-white">{unread}</span>}</button>
              {bell && (
                <div className="anim-fade-up absolute end-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-2 shadow-2xl">
                  <div className="flex items-center justify-between px-3 py-2"><span className="text-sm font-bold">{t('common.notifications')}</span><button onClick={() => { markRead('admin'); setBell(false) }} className="text-xs font-semibold text-emerald">{t('تحديد الكل كمقروء', 'Mark all read')}</button></div>
                  <div className="thin-scroll max-h-80 overflow-y-auto">
                    {notices.filter((n) => n.role === 'admin').slice(0, 10).map((n) => (
                      <div key={n.id} className="flex gap-2.5 rounded-xl px-3 py-2.5 hover:bg-bg"><span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-line' : 'bg-emerald')} /><div><div className="text-[13px] leading-5">{t(n.ar, n.en)}</div><div className="text-[11px] text-muted">{timeAgo(t, n.at)}</div></div></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-s border-line ps-3"><Avatar initials={t('رم', 'RM')} size={34} tone="gold" /><div className="hidden leading-tight sm:block"><div className="text-xs font-bold">{t('ريم المالكي', 'Reem Almalki')}</div><div className="text-[10px] text-muted">{t('مديرة العمليات', 'Operations lead')}</div></div></div>
          </div>
        </header>
        <div className="xl:hidden border-b border-line bg-white px-4 py-2"><RoleSwitcher compact /></div>
        <main key={page} className="anim-fade mx-auto max-w-[1440px] p-4 sm:p-6">
          {page === 'overview' && <Overview go={go} />}
          {page === 'trips' && <Trips initialQ={q} />}
          {page === 'live' && <Live />}
          {page === 'drivers' && <Drivers />}
          {page === 'riders' && <Riders />}
          {page === 'vehicles' && <Vehicles />}
          {page === 'payments' && <Payments />}
          {page === 'coupons' && <Coupons />}
          {page === 'ratings' && <Ratings />}
          {page === 'support' && <Support />}
          {page === 'reports' && <Reports />}
          {page === 'settings' && <PricingSettings />}
        </main>
      </div>
    </div>
  )
}

function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-bold text-navy">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
export function StatCard({ label, value, delta, icon: I, tone = 'navy' }: { label: string; value: string; delta?: string; icon: typeof Car; tone?: 'navy' | 'em' | 'gold' | 'blue' }) {
  const bg = { navy: 'bg-navy text-white', em: 'bg-mint text-emerald-d', gold: 'bg-[#FBF3E6] text-[#9A6B2A]', blue: 'bg-[#EAF2FF] text-[#2E5FB8]' }[tone]
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2"><span className="text-xs text-muted sm:text-sm">{label}</span><span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10', bg)}><I size={16} /></span></div>
      <div className="mt-2 truncate text-xl font-bold tracking-tight text-navy sm:mt-3 sm:text-[26px]" dir="auto">{value}</div>
      {delta && <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald"><TrendingUp size={13} /><span dir="ltr">{delta}</span></div>}
    </Card>
  )
}
export function ChartCard({ title, sub, children, action, className }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <Card className={cx('min-w-0 p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="font-bold text-ink">{title}</h3>{sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}</div>{action}</div>
      {children}
    </Card>
  )
}
function SearchBox({ value, onChange, ph }: { value: string; onChange: (v: string) => void; ph: string }) {
  return <div className="relative"><Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" /><input type="search" aria-label={ph} value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} className="h-10 w-full rounded-xl border border-line bg-white ps-9 pe-3 text-sm outline-none focus:border-emerald sm:w-64" /></div>
}
export function DataTable<T>({ rows, cols, onRow, empty }: { rows: T[]; cols: { h: string; r: (x: T) => React.ReactNode; cls?: string }[]; onRow?: (x: T) => void; empty?: string }) {
  const { t } = useLocale()
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm tabular-nums">
          <thead><tr className="border-b border-line bg-bg/60 text-start text-xs text-muted">{cols.map((c) => <th key={c.h} className={cx('px-4 py-3 text-start font-semibold', c.cls)}>{c.h}</th>)}</tr></thead>
          <tbody>
            {rows.map((x, i) => <tr key={i} onClick={() => onRow?.(x)} className={cx('border-b border-line/70 last:border-0', onRow && 'cursor-pointer hover:bg-bg/60')}>{cols.map((c) => <td key={c.h} className={cx('px-4 py-3.5', c.cls)}>{c.r(x)}</td>)}</tr>)}
          </tbody>
        </table>
        {rows.length === 0 && <div className="py-16 text-center text-sm text-muted">{empty ?? t('لا توجد نتائج مطابقة', 'No matching results')}</div>}
      </div>
    </Card>
  )
}

const useNames = () => {
  const { drivers, riders, t } = useStore()
  return {
    dn: (id?: string) => { const d = drivers.find((x) => x.id === id); return d ? t(d.nameAr, d.nameEn) : '—' },
    rn: (id: string) => { const r = riders.find((x) => x.id === id); return r ? t(r.nameAr, r.nameEn) : '—' },
  }
}

/* ---------- Overview ---------- */
const SERIES = {
  today: Array.from({ length: 12 }, (_, i) => ({ k: `${(i * 2).toString().padStart(2, '0')}:00`, ke: `${(i * 2).toString().padStart(2, '0')}:00`, rev: [3.2, 1.4, .9, 2.1, 6.8, 9.4, 8.1, 9.9, 11.2, 12.8, 10.4, 7.1][i] * 1000, rides: [110, 52, 31, 74, 230, 318, 270, 334, 382, 430, 351, 240][i] })),
  week: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((k, i) => ({ k, ke: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i], rev: [71, 78, 74, 82, 86, 102, 94][i] * 1000, rides: [2410, 2620, 2530, 2790, 2910, 3420, 3180][i] })),
  month: Array.from({ length: 10 }, (_, i) => ({ k: `${i * 3 + 1}`, ke: `${i * 3 + 1}`, rev: [240, 252, 238, 266, 281, 274, 296, 310, 302, 326][i] * 1000, rides: [8100, 8420, 8060, 8890, 9310, 9120, 9820, 10240, 9980, 10760][i] })),
}
function Overview({ go }: { go: (p: Page) => void }) {
  const { t, trips, drivers, money, notices, lang } = useStore()
  const { dn, rn } = useNames()
  const [f, setF] = useState<'today' | 'week' | 'month'>('today')
  const liveDone = trips.filter((x) => x.live && x.status === 'completed')
  const active = trips.filter((x) => ['requested', 'accepted', 'arrived', 'in_progress'].includes(x.status)).length
  const base = { today: [2786, 98420], week: [19860, 587000], month: [92700, 2785000] }[f]
  const totalTrips = base[0] + liveDone.length
  const rev = base[1] + liveDone.reduce((s, x) => s + tripTotal(x), 0)
  const online = drivers.filter((d) => d.status !== 'offline').length * 48 + 7
  const pie = [{ n: t('مكتملة', 'Completed'), v: 82, c: C.em }, { n: t('جارية', 'Active'), v: 9, c: C.blue }, { n: t('ملغاة', 'Cancelled'), v: 7, c: C.red }, { n: t('بانتظار', 'Pending'), v: 2, c: C.gold }]
  const cars: MapCar[] = drivers.map((d) => ({ id: d.id, x: d.x, y: d.y, status: d.status }))
  return (
    <>
      <PageTitle title={t('نظرة عامة', 'Overview')} sub={t('ملخص أداء المنصة في الرياض', 'Platform performance in Riyadh')}>
        <Segmented value={f} onChange={setF} options={[{ id: 'today', label: t('اليوم', 'Today') }, { id: 'week', label: t('الأسبوع', 'Week') }, { id: 'month', label: t('الشهر', 'Month') }]} />
      </PageTitle>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label={t('إجمالي الرحلات', 'Total trips')} value={totalTrips.toLocaleString('en-US')} delta={'+8.2%'} icon={Route} />
        <StatCard label={t('الرحلات النشطة', 'Active trips')} value={String(184 + active)} delta={'+3.1%'} icon={Activity} tone="blue" />
        <StatCard label={t('الكباتن المتصلون', 'Online captains')} value={online.toLocaleString('en-US')} delta={'+5.4%'} icon={UserRound} tone="em" />
        <StatCard label={t('إجمالي الإيرادات', 'Total revenue')} value={money(rev)} delta={'+11.4%'} icon={Wallet} tone="gold" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title={t('الإيرادات والرحلات', 'Revenue & rides')} sub={t('بيانات توضيحية', 'Illustrative data')}>
          <div className="h-72" dir="ltr">
            <ResponsiveContainer><AreaChart data={SERIES[f]}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.em} stopOpacity={.25} /><stop offset="1" stopColor={C.em} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey={lang === 'ar' ? 'k' : 'ke'} tick={{ fontSize: 11, fill: '#718096' }} axisLine={false} tickLine={false} reversed={lang === 'ar'} />
              <YAxis yAxisId="a" tick={{ fontSize: 11, fill: '#718096' }} axisLine={false} tickLine={false} orientation={lang === 'ar' ? 'right' : 'left'} tickFormatter={(v) => `${v / 1000}k`} />
              <YAxis yAxisId="b" hide /><Tooltip {...tip} />
              <Area yAxisId="a" type="monotone" dataKey="rev" name={t('الإيرادات', 'Revenue')} stroke={C.em} strokeWidth={2.5} fill="url(#g1)" />
              <Area yAxisId="b" type="monotone" dataKey="rides" name={t('الرحلات', 'Rides')} stroke={C.navy} strokeWidth={2} fill="transparent" strokeDasharray="4 4" />
            </AreaChart></ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title={t('حالات الرحلات', 'Ride status')}>
          <div className="h-44" dir="ltr"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="v" nameKey="n" isAnimationActive={false} innerRadius={52} outerRadius={78} paddingAngle={3}>{pie.map((p) => <Cell key={p.n} fill={p.c} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer></div>
          <div className="mt-2 grid grid-cols-2 gap-2">{pie.map((p) => <div key={p.n} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.c }} /><span className="flex-1 text-muted">{p.n}</span><span className="font-bold">{p.v}%</span></div>)}</div>
        </ChartCard>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title={t('أحدث الرحلات', 'Recent rides')} action={<Btn variant="outline" className="h-8 px-3 text-xs" onClick={() => go('trips')}>{t('عرض الكل', 'View all')}</Btn>}>
          <div className="thin-scroll -mx-5 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><tbody>
            {trips.slice(0, 6).map((x) => (
              <tr key={x.id} className="border-t border-line/70"><td className="px-5 py-3 font-mono text-xs text-muted" dir="ltr">{x.id}</td><td className="py-3 font-semibold">{rn(x.riderId)}</td><td className="py-3 text-muted">{dn(x.driverId)}</td><td className="py-3 text-xs">{t(x.dest.ar, x.dest.en)}</td><td className="py-3 font-semibold">{money(tripTotal(x))}</td><td className="px-5 py-3"><StatusBadge s={x.status} /></td></tr>
            ))}
          </tbody></table></div>
        </ChartCard>
        <ChartCard title={t('خريطة التشغيل', 'Operations map')} action={<Btn variant="soft" className="h-8 px-3 text-xs" onClick={() => go('live')}><Eye size={13} />{t('مباشر', 'Live')}</Btn>}>
          <MapCanvas className="h-60 rounded-2xl" cars={cars} focus={{ x: 400, y: 320 }} zoom={1} labels={false} />
        </ChartCard>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title={t('أفضل الكباتن أداءً', 'Top captains')}>
          <div className="space-y-3">{[...drivers].filter((d) => d.rating).sort((a, b) => b.rating - a.rating).slice(0, 5).map((d, i) => (
            <div key={d.id} className="flex items-center gap-3"><span className="w-4 text-xs font-bold text-muted">{i + 1}</span><Avatar initials={t(d.initials, d.nameEn[0])} size={34} /><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{t(d.nameAr, d.nameEn)}</div><div className="text-[11px] text-muted">{d.rides.toLocaleString()} {t('رحلة', 'rides')}</div></div><span className="flex items-center gap-1 text-sm font-bold"><Star size={13} className="fill-gold text-gold" />{d.rating}</span></div>
          ))}</div>
        </ChartCard>
        <ChartCard title={t('سجل النشاط التشغيلي', 'Activity timeline')}>
          <ol className="thin-scroll max-h-72 space-y-3 overflow-y-auto">{notices.filter((n) => n.role === 'admin').slice(0, 8).map((n) => (
            <li key={n.id} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald ring-4 ring-mint" /><div><div className="text-[13px] leading-5">{t(n.ar, n.en)}</div><div className="text-[11px] text-muted">{timeAgo(t, n.at)} · {fmtDate(n.at, lang)}</div></div></li>
          ))}</ol>
        </ChartCard>
        <ChartCard title={t('إجراءات سريعة', 'Quick actions')}>
          <div className="grid grid-cols-2 gap-2.5">{([['drivers', UserRound, t('اعتماد كباتن', 'Approve captains')], ['coupons', Ticket, t('إنشاء كوبون', 'New coupon')], ['settings', Settings, t('تعديل الأسعار', 'Edit pricing')], ['support', Headphones, t('التذاكر المفتوحة', 'Open tickets')], ['reports', ChartPie, t('التقارير', 'Reports')], ['live', MapIcon, t('المتابعة المباشرة', 'Live map')]] as const).map(([p, I, l]) => (
            <button key={p} onClick={() => go(p)} className="flex flex-col items-start gap-2 rounded-2xl border border-line p-3.5 text-start text-xs font-semibold transition hover:border-emerald/40 hover:bg-mint/30"><span className="grid h-8 w-8 place-items-center rounded-lg bg-bg text-navy"><I size={15} /></span>{l}</button>
          ))}</div>
        </ChartCard>
      </div>
    </>
  )
}

/* ---------- Trips ---------- */
function Trips({ initialQ }: { initialQ: string }) {
  const { t, trips, money, lang } = useStore()
  const { dn, rn } = useNames()
  const [q, setQ] = useState(initialQ)
  const [s, setS] = useState<'all' | Trip['status'] | 'active'>('all')
  const [open, setOpen] = useState<string | null>(null)
  const rows = trips.filter((x) => (s === 'all' || (s === 'active' ? ['requested', 'accepted', 'arrived', 'in_progress'].includes(x.status) : x.status === s)) && (!q || (x.id + rn(x.riderId) + dn(x.driverId) + x.dest.ar + x.dest.en + x.pickup.ar + x.pickup.en).toLowerCase().includes(q.toLowerCase())))
  const trip = trips.find((x) => x.id === open)
  return (
    <>
      <PageTitle title={t('إدارة الرحلات', 'Trip management')} sub={t(`${trips.length} رحلة في السجل · تتحدث مباشرة مع العرض`, `${trips.length} trips · updates live with the demo`)}>
        <SearchBox value={q} onChange={setQ} ph={t('رقم الرحلة أو الاسم', 'Trip ID or name')} />
        <Segmented value={s} onChange={setS} options={[{ id: 'all', label: t('الكل', 'All') }, { id: 'active', label: t('نشطة', 'Active') }, { id: 'completed', label: t('مكتملة', 'Done') }, { id: 'cancelled', label: t('ملغاة', 'Cancelled') }]} />
      </PageTitle>
      <DataTable rows={rows} onRow={(x) => setOpen(x.id)} cols={[
        { h: t('رقم الرحلة', 'Trip ID'), r: (x) => <span className="flex items-center gap-2 font-mono text-xs" dir="ltr">{x.live && <span className="h-1.5 w-1.5 rounded-full bg-emerald" />}{x.id}</span> },
        { h: t('الراكب', 'Rider'), r: (x) => <span className="font-semibold">{rn(x.riderId)}</span> },
        { h: t('الكابتن', 'Captain'), r: (x) => dn(x.driverId) },
        { h: t('من', 'From'), r: (x) => <span className="text-xs">{t(x.pickup.ar, x.pickup.en)}</span> },
        { h: t('إلى', 'To'), r: (x) => <span className="text-xs">{t(x.dest.ar, x.dest.en)}</span> },
        { h: t('السعر', 'Fare'), r: (x) => <span className="font-semibold">{money(tripTotal(x))}</span> },
        { h: t('الحالة', 'Status'), r: (x) => <StatusBadge s={x.status} /> },
        { h: t('الوقت', 'Time'), r: (x) => <span className="text-xs text-muted">{fmtDate(x.createdAt, lang)} · {fmtTime(x.createdAt)}</span> },
      ]} />
      <Drawer open={!!trip} onClose={() => setOpen(null)} title={t('تفاصيل الرحلة', 'Trip details')}>{trip && <TripDetail trip={trip} />}</Drawer>
    </>
  )
}
function TripDetail({ trip }: { trip: Trip }) {
  const { t, money, lang } = useLocale()
  const { dn, rn } = useNames()
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><span className="font-mono text-sm" dir="ltr">{trip.id}</span><StatusBadge s={trip.status} /></div>
      <MapCanvas className="h-48 rounded-2xl" pickup={trip.pickup} dest={trip.dest} route={routePts(trip.pickup, trip.dest)} progress={trip.status === 'completed' ? 1 : trip.progress} focus={{ x: (trip.pickup.x + trip.dest.x) / 2, y: (trip.pickup.y + trip.dest.y) / 2 }} zoom={1.2} labels={false} />
      {trip.status !== 'cancelled' && <RideStatusTimeline status={trip.status} />}
      <div className="divide-y divide-line rounded-2xl border border-line text-sm">
        {[[t('الراكب', 'Rider'), rn(trip.riderId)], [t('الكابتن', 'Captain'), dn(trip.driverId)], [t('من', 'From'), t(trip.pickup.ar, trip.pickup.en)], [t('إلى', 'To'), t(trip.dest.ar, trip.dest.en)], [t('الفئة', 'Category'), t(CATEGORIES.find((c) => c.id === trip.category)!.ar, CATEGORIES.find((c) => c.id === trip.category)!.en)], [t('المسافة', 'Distance'), `${trip.km} km · ${trip.mins} min`], [t('الدفع', 'Payment'), trip.payment === 'card' ? t('payment.card') : t('payment.cash')], [t('الأجرة', 'Fare'), money(trip.fare)], [t('الخصم', 'Discount'), trip.discount ? `${trip.coupon} · -${money(trip.discount)}` : '—'], [t('وقت الطلب', 'Requested'), `${fmtDate(trip.createdAt, lang)} · ${fmtTime(trip.createdAt)}`], [t('وقت الانتهاء', 'Ended'), trip.endedAt ? fmtTime(trip.endedAt) : '—']].map(([a, b]) => (
          <div key={a} className="flex justify-between gap-4 px-4 py-2.5"><span className="text-muted">{a}</span><span className="text-end font-semibold">{b}</span></div>
        ))}
      </div>
      <div className="rounded-2xl bg-bg p-4"><div className="text-xs font-bold text-muted">{t('تقييم الراكب', 'Rider rating')}</div>{trip.rating ? <><div className="mt-2"><Stars value={trip.rating} size={18} /></div>{trip.review && <p className="mt-2 text-sm">"{trip.review}"</p>}</> : <div className="mt-1 text-sm text-muted">{t('لم يتم التقييم بعد', 'Not rated yet')}</div>}</div>
    </div>
  )
}

/* ---------- Live ---------- */
function Live() {
  const { t, trips, drivers, money } = useStore()
  const { dn, rn } = useNames()
  const active = trips.filter((x) => ['requested', 'accepted', 'arrived', 'in_progress'].includes(x.status))
  const [sel, setSel] = useState<string | null>(null)
  const [flt, setFlt] = useState<'all' | Driver['status']>('all')
  const cur = active.find((x) => x.id === sel) ?? active[0]
  const pos = (x: Trip) => { const d = drivers.find((y) => y.id === x.driverId); const s = d ? { x: d.x, y: d.y } : x.pickup; return x.status === 'in_progress' ? pointAlong(routePts(x.pickup, x.dest), x.progress) : x.status === 'requested' ? { ...s, angle: 0 } : pointAlong(routePts(s, x.pickup), x.approach) }
  const allCars: MapCar[] = drivers.map((d) => {
    const tr = active.find((x) => x.driverId === d.id)
    const p = tr ? pos(tr) : { x: d.x, y: d.y, angle: 0 }
    return { id: d.id, x: p.x, y: p.y, angle: p.angle, status: tr ? (tr.status === 'in_progress' ? 'ontrip' : 'enroute') : d.status }
  })
  const cars = allCars.filter((d) => flt === 'all' || d.status === flt)
  const counts = { available: 0, enroute: 0, ontrip: 0, offline: 0 } as Record<Driver['status'], number>
  allCars.forEach((c) => counts[c.status!]++)
  const legend: [Driver['status'], string, string][] = [['available', t('متاح', 'Available'), '#0FAF92'], ['enroute', t('في الطريق', 'En route'), '#D7A867'], ['ontrip', t('في رحلة', 'On trip'), '#3B82F6'], ['offline', t('غير متصل', 'Offline'), '#94A3B8']]
  return (
    <>
      <PageTitle title={t('الرحلات المباشرة', 'Live operations')} sub={t('مواقع ومسارات محاكاة — ليست بيانات تتبّع حقيقية', 'Simulated positions — not real tracking data')}>
        <Segmented value={flt} onChange={setFlt} options={[{ id: 'all', label: t('الكل', 'All') }, ...legend.map(([id, l]) => ({ id, label: l }))]} />
      </PageTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="relative overflow-hidden">
          <MapCanvas className="h-[420px] sm:h-[520px] xl:h-[640px]" cars={cars} controls controlsClass="end-4 top-4" selectedCar={cur?.driverId} onCar={(id) => { const tr = active.find((x) => x.driverId === id); if (tr) setSel(tr.id) }}
            extraRoutes={active.map((x) => ({ pts: routePts(x.pickup, x.dest), color: x.id === cur?.id ? C.em : '#94A3B8', active: x.id === cur?.id }))}
            pickup={cur?.pickup} dest={cur?.dest} focus={{ x: 400, y: 320 }} />
          <div className="absolute start-4 top-4 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-bold text-navy"><span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-emerald" /><span className="h-2 w-2 rounded-full bg-emerald" /></span>{t('تشغيل مباشر', 'Live operations')}</div>
            <div className="mt-0.5 text-[10px] text-muted">{active.length} {t('رحلات نشطة الآن', 'active rides now')}</div>
          </div>
          <div className="absolute bottom-4 start-4 flex flex-wrap gap-2 rounded-2xl bg-white/90 p-2.5 shadow-lg backdrop-blur">
            {legend.map(([id, l, c]) => <span key={id} className="flex items-center gap-1.5 px-1.5 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l} <span className="text-muted">{counts[id]}</span></span>)}
          </div>
        </Card>
        <div className="space-y-4">
          {cur ? (
            <Card className="p-5">
              <div className="flex items-center justify-between"><span className="font-mono text-sm" dir="ltr">{cur.id}</span><StatusBadge s={cur.status} /></div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3"><Avatar initials="R" size={34} tone="emerald" /><div><div className="text-[11px] text-muted">{t('الراكب', 'Rider')}</div><div className="font-semibold">{rn(cur.riderId)}</div></div></div>
                <div className="flex items-center gap-3"><Avatar initials="C" size={34} /><div><div className="text-[11px] text-muted">{t('الكابتن', 'Captain')}</div><div className="font-semibold">{dn(cur.driverId)}</div></div></div>
              </div>
              <div className="mt-4 rounded-2xl bg-bg p-3 text-sm"><div className="flex gap-2"><span className="mt-1.5 h-2 w-2 rounded-full bg-emerald" />{t(cur.pickup.ar, cur.pickup.en)}</div><div className="mt-2 flex gap-2"><span className="mt-1.5 h-2 w-2 rounded-sm bg-navy" />{t(cur.dest.ar, cur.dest.en)}</div></div>
              <div className="mt-4"><RideStatusTimeline status={cur.status} /></div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">{[[t('المسافة', 'Dist.'), `${cur.km} km`], [t('التقدم', 'Progress'), `${Math.round((cur.status === 'in_progress' ? cur.progress : 0) * 100)}%`], [t('الأجرة', 'Fare'), money(tripTotal(cur))]].map(([a, b]) => <div key={a} className="rounded-xl border border-line py-2"><div className="font-bold">{b}</div><div className="text-muted">{a}</div></div>)}</div>
            </Card>
          ) : <Card className="p-8 text-center text-sm text-muted">{t('لا توجد رحلات نشطة الآن', 'No active trips right now')}</Card>}
          <Card className="p-2">
            <div className="px-3 py-2 text-xs font-bold text-muted">{t(`الرحلات النشطة (${active.length})`, `Active trips (${active.length})`)}</div>
            {active.map((x) => (
              <button key={x.id} onClick={() => setSel(x.id)} className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition', cur?.id === x.id ? 'bg-mint/60' : 'hover:bg-bg')}>
                <span className={cx('h-2 w-2 rounded-full', x.live ? 'animate-pulse bg-emerald' : 'bg-[#94A3B8]')} />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{rn(x.riderId)} {x.live && <Pill className="ms-1 bg-navy text-white">{t('العرض', 'Demo')}</Pill>}</div><div className="truncate text-[11px] text-muted">{t(x.dest.ar, x.dest.en)}</div></div>
                <StatusBadge s={x.status} />
              </button>
            ))}
          </Card>
        </div>
      </div>
    </>
  )
}

/* ---------- Drivers ---------- */
function Drivers() {
  const { t, drivers, setDrivers, toast, trips, notify } = useStore()
  const [q, setQ] = useState('')
  const [f, setF] = useState<'all' | Driver['approval']>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [act, setAct] = useState<{ id: string; to: Driver['approval'] } | null>(null)
  const rows = drivers.filter((d) => (f === 'all' || d.approval === f) && (!q || (d.nameAr + d.nameEn + d.plate + d.phone).toLowerCase().includes(q.toLowerCase())))
  const d = drivers.find((x) => x.id === open)
  const apply = () => { if (!act) return; setDrivers((x) => x.map((y) => (y.id === act.id ? { ...y, approval: act.to, status: act.to === 'suspended' ? 'offline' : y.status } : y))); const n = drivers.find((x) => x.id === act.id)!; notify('admin', `تم تحديث حالة ${n.nameAr}`, `${n.nameEn} status updated`); toast(act.to === 'approved' ? 'تم تفعيل حساب الكابتن' : 'تم إيقاف حساب الكابتن', act.to === 'approved' ? 'Captain activated' : 'Captain suspended', act.to === 'approved' ? 'success' : 'info') }
  return (
    <>
      <PageTitle title={t('إدارة الكباتن', 'Captains')} sub={t(`${drivers.length} كابتن مسجل`, `${drivers.length} registered captains`)}>
        <SearchBox value={q} onChange={setQ} ph={t('الاسم أو اللوحة', 'Name or plate')} />
        <Segmented value={f} onChange={setF} options={[{ id: 'all', label: t('الكل', 'All') }, { id: 'approved', label: t('معتمد', 'Approved') }, { id: 'pending', label: t('قيد المراجعة', 'Pending') }, { id: 'suspended', label: t('موقوف', 'Suspended') }]} />
      </PageTitle>
      <DataTable rows={rows} onRow={(x) => setOpen(x.id)} cols={[
        { h: t('الكابتن', 'Captain'), r: (x) => <div className="flex items-center gap-3"><Avatar initials={t(x.initials, x.nameEn[0])} size={34} /><div><div className="font-semibold">{t(x.nameAr, x.nameEn)}</div><div className="text-[11px] text-muted" dir="ltr">{x.phone}</div></div></div> },
        { h: t('الحالة', 'Status'), r: (x) => <DriverStatus s={x.status} /> },
        { h: t('التقييم', 'Rating'), r: (x) => x.rating ? <span className="flex items-center gap-1 font-semibold"><Star size={13} className="fill-gold text-gold" />{x.rating}</span> : <span className="text-muted">—</span> },
        { h: t('المركبة', 'Vehicle'), r: (x) => <div><div className="text-xs">{t(x.carAr, x.carEn).split('·')[0]}</div><div className="font-mono text-[11px] text-muted">{x.plate}</div></div> },
        { h: t('الرحلات', 'Rides'), r: (x) => x.rides.toLocaleString() },
        { h: t('الاعتماد', 'Approval'), r: (x) => <Approval a={x.approval} /> },
        { h: t('إجراءات', 'Actions'), r: (x) => <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>{x.approval === 'approved' ? <Btn variant="danger" className="h-8 rounded-lg px-3 text-xs" onClick={() => setAct({ id: x.id, to: 'suspended' })}>{t('إيقاف', 'Suspend')}</Btn> : <Btn variant="soft" className="h-8 rounded-lg px-3 text-xs" onClick={() => setAct({ id: x.id, to: 'approved' })}>{x.approval === 'pending' ? t('اعتماد', 'Approve') : t('إعادة تفعيل', 'Reactivate')}</Btn>}</div> },
      ]} />
      <Drawer open={!!d} onClose={() => setOpen(null)} title={t('ملف الكابتن', 'Captain profile')}>
        {d && (
          <div className="space-y-5">
            <div className="flex items-center gap-4"><Avatar initials={t(d.initials, d.nameEn[0])} size={64} tone="gold" /><div><div className="text-lg font-bold">{t(d.nameAr, d.nameEn)}</div><div className="text-xs text-muted" dir="ltr">{d.phone}</div><div className="mt-1.5 flex gap-1.5"><Approval a={d.approval} /><DriverStatus s={d.status} /></div></div></div>
            <div className="grid grid-cols-3 gap-2 text-center">{[[d.rating || '—', t('التقييم', 'Rating')], [d.rides.toLocaleString(), t('رحلة', 'Rides')], [d.joined.slice(0, 4), t('الانضمام', 'Joined')]].map(([a, b]) => <div key={b as string} className="rounded-2xl bg-bg py-3"><div className="font-bold">{a}</div><div className="text-[11px] text-muted">{b}</div></div>)}</div>
            <div className="divide-y divide-line rounded-2xl border border-line text-sm">{[[t('المركبة', 'Vehicle'), t(d.carAr, d.carEn)], [t('اللوحة', 'Plate'), d.plate], [t('الفئة', 'Category'), t(CATEGORIES.find((c) => c.id === d.category)!.ar, CATEGORIES.find((c) => c.id === d.category)!.en)], [t('الوثائق', 'Documents'), d.approval === 'pending' ? t('بانتظار المراجعة', 'Awaiting review') : t('سارية', 'Valid')]].map(([a, b]) => <div key={a} className="flex justify-between gap-3 px-4 py-2.5"><span className="text-muted">{a}</span><span className="text-end font-semibold">{b}</span></div>)}</div>
            <div><div className="mb-2 text-xs font-bold text-muted">{t('آخر الرحلات', 'Recent trips')}</div>{trips.filter((x) => x.driverId === d.id).slice(0, 4).map((x) => <div key={x.id} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0"><span>{t(x.dest.ar, x.dest.en)}</span><StatusBadge s={x.status} /></div>)}{!trips.some((x) => x.driverId === d.id) && <div className="text-sm text-muted">{t('لا توجد رحلات', 'No trips')}</div>}</div>
            {d.approval === 'approved' ? <Btn variant="danger" className="w-full" onClick={() => setAct({ id: d.id, to: 'suspended' })}>{t('إيقاف الحساب', 'Suspend account')}</Btn> : <Btn className="w-full" onClick={() => setAct({ id: d.id, to: 'approved' })}>{d.approval === 'pending' ? t('اعتماد الكابتن', 'Approve captain') : t('إعادة التفعيل', 'Reactivate')}</Btn>}
          </div>
        )}
      </Drawer>
      <ConfirmationModal open={!!act} onClose={() => setAct(null)} onConfirm={apply} danger={act?.to === 'suspended'} title={act?.to === 'suspended' ? t('إيقاف حساب الكابتن؟', 'Suspend captain?') : t('تفعيل حساب الكابتن؟', 'Activate captain?')} body={act?.to === 'suspended' ? t('لن يتمكن الكابتن من استقبال الطلبات حتى تتم إعادة تفعيله.', 'The captain will not receive requests until reactivated.') : t('سيتمكن الكابتن من الاتصال واستقبال الطلبات فورًا.', 'The captain can go online and receive requests immediately.')} confirm={act?.to === 'suspended' ? t('إيقاف', 'Suspend') : t('تفعيل', 'Activate')} />
    </>
  )
}
function DriverStatus({ s }: { s: Driver['status'] }) {
  const { t } = useLocale()
  const m = { available: ['bg-mint text-emerald-d', 'متاح', 'Available'], enroute: ['bg-[#FBF3E6] text-[#9A6B2A]', 'في الطريق', 'En route'], ontrip: ['bg-[#EAF2FF] text-[#2E5FB8]', 'في رحلة', 'On trip'], offline: ['bg-[#EEF1F5] text-muted', 'غير متصل', 'Offline'] }[s]
  return <Pill className={m[0]}>{t(m[1], m[2])}</Pill>
}
function Approval({ a }: { a: Driver['approval'] }) {
  const { t } = useLocale()
  const m = { approved: ['bg-mint text-emerald-d', 'معتمد', 'Approved'], pending: ['bg-[#FFF5E6] text-[#A86A12]', 'قيد المراجعة', 'Pending'], suspended: ['bg-[#FDECEC] text-[#C2413A]', 'موقوف', 'Suspended'] }[a]
  return <Pill className={m[0]}>{t(m[1], m[2])}</Pill>
}

/* ---------- Riders ---------- */
function Riders() {
  const { t, riders, setRiders, trips, money, toast, lang } = useStore()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState('r1')
  const [conf, setConf] = useState(false)
  const rows = riders.filter((r) => !q || (r.nameAr + r.nameEn + r.phone).toLowerCase().includes(q.toLowerCase()))
  const r = riders.find((x) => x.id === sel)!
  return (
    <>
      <PageTitle title={t('الركاب', 'Riders')} sub={t('سجلات الركاب وتاريخ رحلاتهم', 'Rider records and trip history')}><SearchBox value={q} onChange={setQ} ph={t('الاسم أو الجوال', 'Name or phone')} /></PageTitle>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="divide-y divide-line overflow-hidden">
          {rows.length === 0 && <div className="py-16 text-center text-sm text-muted">{t('لا توجد نتائج', 'No results')}</div>}
          {rows.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)} className={cx('flex w-full items-center gap-3 px-5 py-3.5 text-start transition', sel === x.id ? 'bg-mint/40' : 'hover:bg-bg')}>
              <Avatar initials={t(x.nameAr.split(' ').map((w) => w[0]).join(''), x.nameEn.split(' ').map((w) => w[0]).join(''))} size={38} tone="emerald" />
              <div className="min-w-0 flex-1"><div className="font-semibold">{t(x.nameAr, x.nameEn)}</div><div className="text-xs text-muted" dir="ltr">{x.phone}</div></div>
              <div className="hidden text-end text-xs sm:block"><div className="font-semibold">{x.rides} {t('رحلة', 'rides')}</div><div className="text-muted">{money(x.spent)}</div></div>
              {x.status === 'blocked' && <Pill className="bg-[#FDECEC] text-[#C2413A]">{t('محظور', 'Blocked')}</Pill>}
            </button>
          ))}
        </Card>
        <Card className="p-5 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-3"><Avatar initials={t(r.nameAr.split(' ').map((w) => w[0]).join(''), r.nameEn[0])} size={54} tone="emerald" /><div><div className="text-lg font-bold">{t(r.nameAr, r.nameEn)}</div><div className="text-xs text-muted">{t('عضو منذ', 'Member since')} {r.joined}</div></div></div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[[r.rides, t('رحلة', 'Rides')], [r.rating, t('التقييم', 'Rating')], [money(r.spent), t('الإنفاق', 'Spent')]].map(([a, b]) => <div key={b as string} className="rounded-2xl bg-bg py-3"><div className="text-sm font-bold">{a}</div><div className="text-[11px] text-muted">{b}</div></div>)}</div>
          <div className="mt-4 text-xs font-bold text-muted">{t('سجل الرحلات', 'Trip history')}</div>
          <div className="mt-2 space-y-1">{trips.filter((x) => x.riderId === r.id).slice(0, 5).map((x) => <div key={x.id} className="flex items-center justify-between rounded-xl px-2 py-2 text-sm hover:bg-bg"><div><div className="font-semibold">{t(x.dest.ar, x.dest.en)}</div><div className="text-[11px] text-muted">{fmtDate(x.createdAt, lang)} · {money(tripTotal(x))}</div></div><StatusBadge s={x.status} /></div>)}{!trips.some((x) => x.riderId === r.id) && <div className="py-4 text-center text-sm text-muted">{t('لا توجد رحلات', 'No trips')}</div>}</div>
          <Btn variant={r.status === 'active' ? 'danger' : 'soft'} className="mt-4 w-full" onClick={() => setConf(true)}>{r.status === 'active' ? t('حظر الراكب', 'Block rider') : t('إلغاء الحظر', 'Unblock rider')}</Btn>
        </Card>
      </div>
      <ConfirmationModal open={conf} onClose={() => setConf(false)} danger={r.status === 'active'} onConfirm={() => { setRiders((x) => x.map((y) => (y.id === r.id ? { ...y, status: y.status === 'active' ? 'blocked' : 'active' } : y))); toast('تم تحديث حالة الراكب', 'Rider status updated') }} title={r.status === 'active' ? t('حظر هذا الراكب؟', 'Block this rider?') : t('إلغاء حظر الراكب؟', 'Unblock rider?')} body={t('يمكن التراجع عن هذا الإجراء لاحقًا.', 'This action can be reverted later.')} confirm={t('تأكيد', 'Confirm')} />
    </>
  )
}

/* ---------- Vehicles / Payments / Ratings ---------- */
function Vehicles() {
  const { t, drivers } = useStore()
  const [c, setC] = useState<'all' | Driver['category']>('all')
  return (
    <>
      <PageTitle title={t('المركبات', 'Vehicles')} sub={t('أسطول المركبات المسجلة', 'Registered fleet')}><Segmented value={c} onChange={setC} options={[{ id: 'all', label: t('الكل', 'All') }, ...CATEGORIES.map((x) => ({ id: x.id, label: t(x.ar, x.en) }))]} /></PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {drivers.filter((d) => c === 'all' || d.category === c).map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: d.color, border: '1px solid #E7EBF1' }}><Car size={20} className={['#1F2937', '#111827', '#1E3A5F', '#B91C1C'].includes(d.color) ? 'text-white' : 'text-navy'} /></span><Approval a={d.approval} /></div>
            <div className="mt-4 font-bold">{t(d.carAr, d.carEn).split('·')[0]}</div><div className="text-xs text-muted">{t(d.carAr, d.carEn).split('·')[1]}</div>
            <div className="mt-3 flex items-center justify-between text-sm"><span className="rounded-lg border border-line bg-bg px-2 py-0.5 font-mono text-xs font-bold">{d.plate}</span><span className="text-xs text-muted">{t(d.nameAr, d.nameEn)}</span></div>
          </Card>
        ))}
      </div>
    </>
  )
}
function Payments() {
  const { t, trips, money, lang } = useStore()
  const { rn } = useNames()
  const [m, setM] = useState<'all' | 'card' | 'cash'>('all')
  const done = trips.filter((x) => x.status === 'completed' && (m === 'all' || x.payment === m))
  const sum = done.reduce((s, x) => s + tripTotal(x), 0)
  return (
    <>
      <PageTitle title={t('المدفوعات', 'Payments')} sub={t('عمليات دفع محاكاة', 'Simulated transactions')}><Segmented value={m} onChange={setM} options={[{ id: 'all', label: t('الكل', 'All') }, { id: 'card', label: t('payment.card') }, { id: 'cash', label: t('payment.cash') }]} /></PageTitle>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label={t('إجمالي المحصّل', 'Collected')} value={money(sum)} icon={Wallet} tone="em" />
        <StatCard label={t(`عمولة المنصة ${commissionPct()}%`, `Platform fee ${commissionPct()}%`)} value={money((sum - captainNet(sum)))} icon={TrendingUp} tone="gold" />
        <StatCard label={t('مستحقات الكباتن', 'Captain payouts')} value={money(captainNet(sum))} icon={UserRound} />
      </div>
      <DataTable rows={done} cols={[
        { h: t('الرحلة', 'Trip'), r: (x) => <span className="font-mono text-xs" dir="ltr">{x.id}</span> },
        { h: t('الراكب', 'Rider'), r: (x) => rn(x.riderId) },
        { h: t('الطريقة', 'Method'), r: (x) => <Pill className="bg-bg text-ink">{x.payment === 'card' ? t('payment.card') : t('payment.cash')}</Pill> },
        { h: t('المبلغ', 'Amount'), r: (x) => <span className="font-semibold">{money(tripTotal(x))}</span> },
        { h: t('الخصم', 'Discount'), r: (x) => (x.discount ? <span className="text-emerald-d">{money(x.discount)}</span> : '—') },
        { h: t('التاريخ', 'Date'), r: (x) => <span className="text-xs text-muted">{fmtDate(x.createdAt, lang)} · {fmtTime(x.createdAt)}</span> },
        { h: t('الحالة', 'Status'), r: () => <Pill className="bg-mint text-emerald-d"><CheckCircle2 size={12} />{t('ناجحة', 'Settled')}</Pill> },
      ]} />
    </>
  )
}
function Ratings() {
  const { t, trips, lang } = useStore()
  const { dn, rn } = useNames()
  const [min, setMin] = useState<'all' | 'low'>('all')
  const rated = trips.filter((x) => x.rating && (min === 'all' || x.rating <= 3))
  return (
    <>
      <PageTitle title={t('التقييمات', 'Ratings')} sub={t('آراء الركاب في الرحلات', 'Rider feedback on trips')}><Segmented value={min} onChange={setMin} options={[{ id: 'all', label: t('الكل', 'All') }, { id: 'low', label: t('تقييمات منخفضة', 'Low ratings') }]} /></PageTitle>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rated.map((x) => (
          <Card key={x.id} className={cx('p-5', x.live && 'ring-2 ring-emerald/40')}>
            <div className="flex items-center justify-between"><Stars value={x.rating!} size={16} />{x.live ? <Pill className="bg-navy text-white">{t('رحلة العرض', 'Demo trip')}</Pill> : <span className="text-xs text-muted">{fmtDate(x.createdAt, lang)}</span>}</div>
            <p className="mt-3 min-h-10 text-sm leading-6">{x.review ? `"${x.review}"` : <span className="text-muted">{t('بدون تعليق', 'No comment')}</span>}</p>
            <div className="mt-3 border-t border-line pt-3 text-xs text-muted">{rn(x.riderId)} ← {dn(x.driverId)} · <span dir="ltr">{x.id}</span></div>
          </Card>
        ))}
      </div>
      {rated.length === 0 && <Card className="p-12 text-center text-sm text-muted">{t('لا توجد تقييمات مطابقة', 'No matching ratings')}</Card>}
    </>
  )
}

/* ---------- Coupons ---------- */
function Coupons() {
  const { t, coupons, setCoupons, toast, money } = useStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ code: '', pct: 10, maxOff: 15, limit: 1000, desc: '' })
  const save = () => {
    if (!form.code.trim() || coupons.some((c) => c.code === form.code.toUpperCase())) return toast('الكود فارغ أو مستخدم مسبقًا', 'Code is empty or already exists', 'warn')
    const c: Coupon = { code: form.code.toUpperCase(), pct: form.pct, maxOff: form.maxOff, uses: 0, limit: form.limit, expires: inDays(90), active: true, descAr: form.desc || `خصم ${form.pct}%`, descEn: form.desc || `${form.pct}% off` }
    setCoupons((x) => [c, ...x]); setOpen(false); setForm({ code: '', pct: 10, maxOff: 15, limit: 1000, desc: '' }); toast('تم إنشاء الكوبون ويمكن استخدامه في تطبيق الراكب', 'Coupon created — usable in the Rider app')
  }
  return (
    <>
      <PageTitle title={t('العروض والكوبونات', 'Promotions')} sub={t('الكوبونات المنشأة هنا تعمل فورًا في تطبيق الراكب', 'Coupons created here work instantly in the Rider app')}><Btn onClick={() => setOpen(true)}><Plus size={16} />{t('كوبون جديد', 'New coupon')}</Btn></PageTitle>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coupons.map((c) => (
          <Card key={c.code} className={cx('relative overflow-hidden p-5', !c.active && 'opacity-60')}>
            <div className="absolute -end-8 -top-8 h-24 w-24 rounded-full bg-mint" />
            <div className="relative flex items-start justify-between"><div><div className="font-mono text-lg font-bold">{c.code}</div><div className="text-xs text-muted">{t(c.descAr, c.descEn)}</div></div><Toggle on={c.active} onChange={(v) => { setCoupons((x) => x.map((y) => (y.code === c.code ? { ...y, active: v } : y))); toast(v ? 'تم تفعيل الكوبون' : 'تم إيقاف الكوبون', v ? 'Coupon enabled' : 'Coupon disabled', 'info') }} /></div>
            <div className="relative mt-4 flex items-end gap-1"><span className="text-3xl font-bold text-emerald">{c.pct}%</span><span className="pb-1 text-xs text-muted">{t(`حتى ${money(c.maxOff)}`, `up to ${money(c.maxOff)}`)}</span></div>
            <div className="relative mt-4"><div className="flex justify-between text-[11px] text-muted"><span>{c.uses.toLocaleString()} / {c.limit.toLocaleString()}</span><span>{t('ينتهي', 'Ends')} {c.expires}</span></div><div className="mt-1.5 h-1.5 rounded-full bg-bg"><div className="h-full rounded-full bg-navy" style={{ width: `${Math.min(100, (c.uses / c.limit) * 100)}%` }} /></div></div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('إنشاء كوبون جديد', 'Create coupon')}>
        <div className="space-y-3">
          <Field label={t('رمز الكوبون', 'Code')}><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} dir="ltr" placeholder="SUMMER20" className="inp font-mono" /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label={t('النسبة %', 'Percent')}><input type="number" value={form.pct} onChange={(e) => setForm({ ...form, pct: +e.target.value })} className="inp" /></Field>
            <Field label={t('الحد الأعلى', 'Max off')}><input type="number" value={form.maxOff} onChange={(e) => setForm({ ...form, maxOff: +e.target.value })} className="inp" /></Field>
            <Field label={t('عدد الاستخدام', 'Limit')}><input type="number" value={form.limit} onChange={(e) => setForm({ ...form, limit: +e.target.value })} className="inp" /></Field>
          </div>
          <Field label={t('الوصف', 'Description')}><input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className="inp" /></Field>
          <Btn className="w-full" onClick={save}>{t('حفظ الكوبون', 'Save coupon')}</Btn>
        </div>
      </Modal>
    </>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>{children}</label>
}

/* ---------- Support ---------- */
function Support() {
  const { t, tickets, setTickets, toast, lang } = useStore()
  const { rn } = useNames()
  const [f, setF] = useState<'all' | Tk['status']>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const rows = tickets.filter((x) => f === 'all' || x.status === f)
  const tk = tickets.find((x) => x.id === open)
  const set = (s: Tk['status']) => { setTickets((x) => x.map((y) => (y.id === open ? { ...y, status: s } : y))); toast(s === 'resolved' ? 'تم حل التذكرة وإشعار العميل' : 'تم نقل التذكرة للمراجعة', s === 'resolved' ? 'Ticket resolved & customer notified' : 'Ticket moved to review'); if (s === 'resolved') setOpen(null) }
  const st = (s: Tk['status']) => ({ open: <Pill className="bg-[#FFF5E6] text-[#A86A12]">{t('مفتوحة', 'Open')}</Pill>, review: <Pill className="bg-[#EAF2FF] text-[#2E5FB8]">{t('قيد المراجعة', 'In review')}</Pill>, resolved: <Pill className="bg-mint text-emerald-d">{t('تم الحل', 'Resolved')}</Pill> })[s]
  const pr = (p: Tk['priority']) => ({ high: <Pill className="bg-[#FDECEC] text-[#C2413A]">{t('عالية', 'High')}</Pill>, medium: <Pill className="bg-[#FBF3E6] text-[#9A6B2A]">{t('متوسطة', 'Medium')}</Pill>, low: <Pill className="bg-bg text-muted">{t('منخفضة', 'Low')}</Pill> })[p]
  return (
    <>
      <PageTitle title={t('الدعم والشكاوى', 'Support & complaints')} sub={t(`${tickets.filter((x) => x.status !== 'resolved').length} تذكرة بحاجة لمتابعة`, `${tickets.filter((x) => x.status !== 'resolved').length} tickets need attention`)}>
        <Segmented value={f} onChange={setF} options={[{ id: 'all', label: t('الكل', 'All') }, { id: 'open', label: t('مفتوحة', 'Open') }, { id: 'review', label: t('مراجعة', 'Review') }, { id: 'resolved', label: t('محلولة', 'Resolved') }]} />
      </PageTitle>
      <DataTable rows={rows} onRow={(x) => setOpen(x.id)} cols={[
        { h: t('التذكرة', 'Ticket'), r: (x) => <span className="font-mono text-xs">{x.id}</span> },
        { h: t('التصنيف', 'Category'), r: (x) => <span className="font-semibold">{t(x.catAr, x.catEn)}</span> },
        { h: t('العميل', 'Customer'), r: (x) => rn(x.riderId) },
        { h: t('الرحلة', 'Trip'), r: (x) => <span className="font-mono text-xs" dir="ltr">{x.tripId}</span> },
        { h: t('الأولوية', 'Priority'), r: (x) => pr(x.priority) },
        { h: t('الحالة', 'Status'), r: (x) => st(x.status) },
        { h: t('التاريخ', 'Created'), r: (x) => <span className="text-xs text-muted">{timeAgo(t, x.createdAt)}</span> },
      ]} />
      <Drawer open={!!tk} onClose={() => setOpen(null)} title={tk?.id ?? ''}>
        {tk && (
          <div className="space-y-4">
            <div className="flex gap-2">{st(tk.status)}{pr(tk.priority)}</div>
            <div><div className="text-lg font-bold">{t(tk.catAr, tk.catEn)}</div><div className="text-xs text-muted">{rn(tk.riderId)} · <span dir="ltr">{tk.tripId}</span> · {fmtDate(tk.createdAt, lang)}</div></div>
            <div className="rounded-2xl bg-bg p-4 text-sm leading-7">{t(tk.msgAr, tk.msgEn)}</div>
            <Field label={t('ملاحظة داخلية', 'Internal note')}><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="inp h-auto py-2" placeholder={t('أضف ملاحظة للفريق…', 'Add a note for the team…')} /></Field>
            {tk.status !== 'resolved' ? (
              <div className="flex gap-2">{tk.status === 'open' && <Btn variant="outline" className="flex-1" onClick={() => set('review')}>{t('بدء المراجعة', 'Start review')}</Btn>}<Btn className="flex-1" onClick={() => set('resolved')}><CheckCircle2 size={16} />{t('حل التذكرة', 'Resolve')}</Btn></div>
            ) : <div className="rounded-2xl bg-mint p-3 text-center text-sm font-semibold text-emerald-d">{t('تم حل هذه التذكرة', 'This ticket is resolved')}</div>}
          </div>
        )}
      </Drawer>
    </>
  )
}

/* ---------- Reports ---------- */
function Reports() {
  const { t, trips, money, lang, toast } = useStore()
  const [p, setP] = useState<'week' | 'month'>('week')
  const daily = SERIES[p === 'week' ? 'week' : 'month'].map((x, i) => ({ ...x, done: Math.round(x.rides * 0.92), canc: Math.round(x.rides * (0.06 + (i % 3) * 0.01)) }))
  const pop = useMemo(() => PLACES.slice(0, 7).map((pl, i) => ({ n: t(pl.ar, pl.en).split('،')[0], v: [1840, 1620, 1410, 1280, 990, 860, 720][i] + trips.filter((x) => x.dest.id === pl.id).length })), [trips, t])
  const cats = CATEGORIES.map((c, i) => ({ n: t(c.ar, c.en), v: [58, 29, 13][i], c: [C.navy, C.em, C.gold][i] }))
  const ratings = [5, 4, 3, 2, 1].map((s, i) => ({ n: `${s}★`, v: [71, 19, 6, 3, 1][i] }))
  const avg = Math.round(daily.reduce((s, x) => s + x.rev, 0) / daily.reduce((s, x) => s + x.rides, 0) * 10) / 10
  return (
    <>
      <PageTitle title={t('التقارير والتحليلات', 'Reports & analytics')} sub={t('مجموعات بيانات توضيحية', 'Illustrative datasets')}>
        <Segmented value={p} onChange={setP} options={[{ id: 'week', label: t('أسبوعي', 'Weekly') }, { id: 'month', label: t('شهري', 'Monthly') }]} />
        <Btn variant="outline" onClick={() => toast('تم تجهيز تقرير تجريبي للتصدير', 'Demo report prepared for export', 'info')}>{t('تصدير', 'Export')}</Btn>
      </PageTitle>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('متوسط قيمة الرحلة', 'Avg ride value')} value={money(avg)} icon={Wallet} tone="gold" />
        <StatCard label={t('نسبة الإكمال', 'Completion rate')} value="92.4%" icon={CheckCircle2} tone="em" />
        <StatCard label={t('متوسط تقييم الكباتن', 'Avg captain rating')} value="4.86" icon={Star} />
        <StatCard label={t('رحلات العرض المكتملة', 'Completed demo trips')} value={String(trips.filter((x) => x.live && x.status === 'completed').length)} icon={Route} tone="blue" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2" dir="ltr">
        <ChartCard title={t('الرحلات اليومية: المكتملة مقابل الملغاة', 'Daily trips: completed vs cancelled')}>
          <div className="h-64"><ResponsiveContainer><BarChart data={daily}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey={lang === 'ar' ? 'k' : 'ke'} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} reversed={lang === 'ar'} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} orientation={lang === 'ar' ? 'right' : 'left'} /><Tooltip {...tip} /><Bar dataKey="done" name={t('مكتملة', 'Completed')} stackId="a" fill={C.navy} /><Bar dataKey="canc" name={t('ملغاة', 'Cancelled')} stackId="a" fill={C.red} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </ChartCard>
        <ChartCard title={t('الإيرادات حسب الفترة', 'Revenue by period')}>
          <div className="h-64"><ResponsiveContainer><LineChart data={daily}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey={lang === 'ar' ? 'k' : 'ke'} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} reversed={lang === 'ar'} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} orientation={lang === 'ar' ? 'right' : 'left'} /><Tooltip {...tip} /><Line type="monotone" dataKey="rev" name={t('الإيرادات', 'Revenue')} stroke={C.em} strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
        </ChartCard>
        <ChartCard title={t('المواقع الأكثر طلبًا', 'Popular locations')}>
          <div className="h-64"><ResponsiveContainer><BarChart data={pop} layout="vertical"><XAxis type="number" hide reversed={lang === 'ar'} /><YAxis type="category" dataKey="n" width={110} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} orientation={lang === 'ar' ? 'right' : 'left'} /><Tooltip {...tip} /><Bar dataKey="v" name={t('رحلات', 'Trips')} fill={C.em} radius={6} /></BarChart></ResponsiveContainer></div>
        </ChartCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChartCard title={t('استخدام فئات المركبات', 'Category usage')}>
            <div className="h-40"><ResponsiveContainer><PieChart><Pie data={cats} dataKey="v" nameKey="n" isAnimationActive={false} innerRadius={40} outerRadius={64}>{cats.map((c) => <Cell key={c.n} fill={c.c} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer></div>
            <div className="space-y-1.5" dir="auto">{cats.map((c) => <div key={c.n} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c.c }} /><span className="flex-1">{c.n}</span><b>{c.v}%</b></div>)}</div>
          </ChartCard>
          <ChartCard title={t('توزيع تقييمات الكباتن', 'Captain ratings')}>
            <div className="h-56"><ResponsiveContainer><BarChart data={ratings}><XAxis dataKey="n" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip {...tip} /><Bar dataKey="v" name="%" fill={C.gold} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </ChartCard>
        </div>
      </div>
    </>
  )
}

/* ---------- Settings (pricing) ---------- */
function PricingSettings() {
  const { t, pricing, setPricing, toast, money, lang } = useStore()
  const [draft, setDraft] = useState(pricing)
  const sample = estimate(draft, PLACES[0], PLACES[1], 'economy')
  const cur = estimate(pricing, PLACES[0], PLACES[1], 'economy')
  const num = (k: 'base' | 'perKm' | 'perMin' | 'minFare', ar: string, en: string, step: number) => (
    <Field label={t(ar, en)}><div className="relative"><input type="number" step={step} value={draft[k]} min={0} onChange={(e) => setDraft({ ...draft, [k]: Math.max(0, +e.target.value) })} className="inp pe-14" /><span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted">{currencySymbol(lang)}</span></div></Field>
  )
  const fee = <G extends 'waiting' | 'cancellation'>(g: G, k: keyof (typeof draft)[G] & string, ar: string, en: string, unit: 'money' | 'min') => (
    <Field label={t(ar, en)}><div className="relative"><input type="number" min={0} step={unit === 'min' ? 1 : 0.5} value={draft[g][k] as number} onChange={(e) => setDraft({ ...draft, [g]: { ...draft[g], [k]: Math.max(0, +e.target.value) } })} className="inp pe-14" /><span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit === 'min' ? t('دقيقة', 'min') : currencySymbol(lang)}</span></div></Field>
  )
  const dirty = JSON.stringify(draft) !== JSON.stringify(pricing)
  return (
    <>
      <PageTitle title={t('إعدادات التسعير', 'Pricing settings')} sub={t('التغييرات المحفوظة تنعكس مباشرة على أسعار تطبيق الراكب', 'Saved changes apply instantly to Rider app fares')}>
        <Btn variant="outline" disabled={!dirty} onClick={() => setDraft(pricing)}>{t('تجاهل', 'Discard')}</Btn>
        <Btn disabled={!dirty} onClick={() => { setPricing(draft); toast('تم حفظ إعدادات التسعير', 'Pricing saved') }}>{t('حفظ التغييرات', 'Save changes')}</Btn>
      </PageTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <ChartCard title={t('التسعير الأساسي', 'Base pricing')}><div className="grid gap-3 sm:grid-cols-2">{num('base', 'الأجرة الأساسية', 'Base fare', 0.5)}{num('perKm', 'سعر الكيلومتر', 'Per km', 0.05)}{num('perMin', 'سعر الدقيقة', 'Per minute', 0.05)}{num('minFare', 'الحد الأدنى للأجرة', 'Minimum fare', 1)}</div></ChartCard>
          <ChartCard title={t('معاملات فئات المركبات', 'Category multipliers')}>
            <div className="space-y-4">{CATEGORIES.map((c) => (
              <div key={c.id} className="flex items-center gap-4"><span className="w-20 text-sm font-semibold">{t(c.ar, c.en)}</span><input type="range" min={0.8} max={2.5} step={0.02} value={draft.mult[c.id]} onChange={(e) => setDraft({ ...draft, mult: { ...draft.mult, [c.id]: +e.target.value } })} aria-label={t(`معامل ${c.ar}`, `${c.en} multiplier`)} className="flex-1 accent-[#0FAF92]" /><span className="w-14 rounded-lg bg-bg py-1 text-center font-mono text-sm font-bold">×{draft.mult[c.id].toFixed(2)}</span></div>
            ))}</div>
          </ChartCard>
          <ChartCard title={t('رسوم الانتظار والإلغاء', 'Waiting and cancellation fees')} sub={t('تُطبَّق على الرحلات الجديدة في العرض', 'Applied to new demo trips')}>
            <div className="grid gap-3 sm:grid-cols-2">
              {fee('waiting', 'freeMins', 'مدة الانتظار المجانية', 'Free waiting time', 'min')}{fee('waiting', 'perMin', 'رسوم كل دقيقة انتظار', 'Waiting fee per minute', 'money')}
              {fee('cancellation', 'graceMins', 'مهلة الإلغاء المجاني بعد القبول', 'Free cancellation window after acceptance', 'min')}{fee('cancellation', 'riderAfterGrace', 'رسوم الإلغاء بعد المهلة', 'Cancellation fee after the window', 'money')}
              {fee('cancellation', 'riderAfterArrival', 'رسوم الإلغاء بعد وصول الكابتن', 'Cancellation fee after captain arrival', 'money')}
            </div>
          </ChartCard>
          <ChartCard title={t('عمولة المنصة', 'Platform commission')} action={<Pill className="bg-[#FFF5E6] text-[#A86A12]">{t('مبدئية — غير معتمدة', 'Provisional, not approved')}</Pill>}>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-bg p-4">
              <div><div className="text-3xl font-bold text-navy">{commissionPct()}%</div><div className="mt-1 text-xs text-muted">{t('تُخصم من أجرة الرحلة لحساب صافي ربح الكابتن', "Deducted from the trip fare to compute the captain's net")}</div></div>
              <p className="max-w-sm text-xs leading-6 text-muted">{t('القيمة للعرض فقط وتُضبط في إعدادات السوق. لم يعتمد العميل نموذج العمولة بعد، ولا يمكن تعديلها من هذه الشاشة.', 'Demo value from the market configuration. The commission model is not yet approved by the client and cannot be edited here.')}</p>
            </div>
          </ChartCard>
          <ChartCard title={t('مناطق الخدمة', 'Service areas')}>
            <div className="grid gap-2 sm:grid-cols-2">{draft.areas.map((a) => <div key={a.id} className="flex items-center justify-between rounded-2xl border border-line p-3.5"><span className="flex items-center gap-2 text-sm font-semibold"><MapIcon size={15} className="text-muted" />{t(a.ar, a.en)}</span><Toggle label={t(a.ar, a.en)} on={a.on} onChange={(v) => setDraft({ ...draft, areas: draft.areas.map((x) => (x.id === a.id ? { ...x, on: v } : x)) })} /></div>)}</div>
          </ChartCard>
        </div>
        <Card className="h-fit p-5 xl:sticky xl:top-24">
          <h3 className="font-bold">{t('معاينة أجرة نموذجية', 'Sample fare preview')}</h3>
          <p className="mt-1 text-xs text-muted">{t(`${PLACES[0].ar} ← ${PLACES[1].ar} · ${sample.km} كم · ${sample.mins} د`, `${PLACES[0].en} → ${PLACES[1].en} · ${sample.km} km · ${sample.mins} min`)}</p>
          <div className="mt-4 space-y-2">{CATEGORIES.map((c) => {
            const n = estimate(draft, PLACES[0], PLACES[1], c.id).fare, o = estimate(pricing, PLACES[0], PLACES[1], c.id).fare
            return <div key={c.id} className="flex items-center justify-between rounded-2xl bg-bg p-3.5"><span className="text-sm font-semibold">{t(c.ar, c.en)}</span><span className="flex items-center gap-2">{n !== o && <span className="text-xs text-muted line-through">{money(o)}</span>}<b className={n > o ? 'text-[#C2413A]' : n < o ? 'text-emerald-d' : ''}>{money(n)}</b></span></div>
          })}</div>
          <div className="mt-4 rounded-2xl bg-navy p-4 text-xs leading-6 text-white/70">{t('المعادلة: (الأساسية + المسافة × سعر الكم + الوقت × سعر الدقيقة) × معامل الفئة، بحد أدنى للأجرة.', 'Formula: (base + km × per-km + minutes × per-minute) × category multiplier, with a minimum fare.')}{dirty && <div className="mt-2 font-semibold text-gold">{t('تغييرات غير محفوظة', 'Unsaved changes')}</div>}</div>
        </Card>
      </div>
    </>
  )
}
