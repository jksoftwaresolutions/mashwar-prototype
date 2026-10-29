import { ArrowLeft, ArrowRight, BarChart3, Car, CheckCircle2, CreditCard, MapPin, MessageSquareText, Navigation, Satellite, Smartphone, Star, type LucideIcon } from 'lucide-react'
import { useStore, place, type Role } from './store'
import { MARKET, captainNet, commissionPct } from './config/market'
import MapCanvas, { routePts, pointAlong } from './components/MapCanvas'
import { Avatar, CarIllustration, Logo, cx } from './components/ui'
import { LangSwitch } from './components/shell'

export default function Showcase() {
  const { t, setRole, dir } = useStore()
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight

  const doors: { role: Exclude<Role, 'showcase'>; icon: LucideIcon; title: string; body: string; dark?: boolean }[] = [
    { role: 'passenger', icon: Smartphone, title: t('تطبيق الراكب', 'Rider app'), body: t('احجز، تتبّع الكابتن، ادفع وقيّم.', 'Book, track the captain, pay and rate.') },
    { role: 'driver', icon: Car, title: t('تطبيق الكابتن', 'Captain app'), body: t('استقبل الطلب، تنقّل، وتابع أرباحك.', 'Receive requests, navigate, track earnings.'), dark: true },
    { role: 'admin', icon: BarChart3, title: t('لوحة الإدارة', 'Admin dashboard'), body: t('الرحلات، الكباتن، الأسعار والتقارير.', 'Trips, captains, pricing and reports.') },
  ]

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#F4F7FA]">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-muted sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-gold" />{t('نموذج أولي ببيانات محاكاة', 'Prototype with simulated data')}</span>
          <LangSwitch />
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-14 pt-4 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:pb-20 lg:pt-10">
          <div className="anim-fade-up relative z-10">
            <p className="text-sm font-semibold text-emerald-d">{t(`${MARKET.city.nameAr}، نسخة المراجعة للمرحلة الأولى`, `${MARKET.city.nameEn}, Phase 1 review build`)}</p>
            <h1 className="mt-4 max-w-[14ch] text-[38px] font-bold leading-[1.2] tracking-tight text-navy sm:text-[56px] sm:leading-[1.12]">
              {t('رحلة واحدة تربط الراكب والكابتن والإدارة', 'One ride connecting rider, captain and operations')}
            </h1>
            <RouteMark />
            <p className="mt-5 max-w-[46ch] text-base leading-8 text-muted sm:text-[17px]">
              {t('اطلب رحلة من تطبيق الراكب، اقبلها من تطبيق الكابتن، وشاهدها تتحدّث مباشرة في لوحة الإدارة، كل ذلك على بيانات مشتركة.', 'Request a ride as a rider, accept it as a captain and watch it update live in the admin dashboard, all on shared data.')}
            </p>

            <nav aria-label={t('التجارب', 'Experiences')} className="mt-8 grid gap-2.5 sm:grid-cols-3">
              {doors.map((d) => (
                <button key={d.role} onClick={() => setRole(d.role)} className={cx('group grid grid-cols-[auto_1fr] items-center gap-x-3 rounded-2xl p-3.5 text-start sm:flex sm:flex-col sm:items-start sm:p-4 transition active:scale-[.99]', d.dark ? 'bg-navy text-white hover:bg-navy-2' : 'border border-line bg-white hover:border-emerald/50')}>
                  <span className={cx('row-span-2 grid h-9 w-9 place-items-center rounded-xl', d.dark ? 'bg-white/10 text-emerald' : 'bg-mint text-emerald-d')}><d.icon size={18} /></span>
                  <span className="flex w-full items-center justify-between gap-2 text-[15px] font-bold sm:mt-3">{d.title}<Arrow size={16} className={cx('transition', d.dark ? 'text-white/50' : 'text-muted')} /></span>
                  <span className={cx('col-start-2 text-xs leading-5 sm:mt-1', d.dark ? 'text-white/60' : 'text-muted')}>{d.body}</span>
                </button>
              ))}
            </nav>
          </div>

          <DeviceStage />
        </section>

        <Lifecycle onStart={() => setRole('passenger')} />
        <Simulated />
      </main>

      <footer className="mx-auto max-w-[1280px] px-5 pb-10 pt-2 text-center text-xs leading-6 text-muted sm:px-8">
        {t('مَشوار اسم عمل مؤقت. هذا نموذج أولي للمراجعة ببيانات محاكاة، وليس خدمة نقل تشغيلية.', 'MASHWAR is a working name. This is a review prototype with simulated data, not an operating ride-hailing service.')}
      </footer>
    </div>
  )
}

/** The brand gesture: a route from a pickup dot to a gold destination, echoing the logo mark. */
function RouteMark() {
  return (
    <svg viewBox="0 0 320 28" className="mt-5 h-7 w-64 sm:w-80 rtl:-scale-x-100" aria-hidden>
      <path d="M8 18 C 70 18, 80 6, 140 8 S 230 24, 300 10" fill="none" stroke="#0FAF92" strokeWidth="4" strokeLinecap="round" pathLength={1} className="route-draw" />
      <circle cx="8" cy="18" r="5" fill="#101B2E" />
      <circle cx="300" cy="10" r="6" fill="#D7A867" />
    </svg>
  )
}

function DeviceStage() {
  const { t, money, pricing } = useStore()
  const pk = place('olaya'), ds = place('kafd')
  const route = routePts(pk, ds)
  const car = pointAlong(route, 0.42)
  const capRoute = routePts({ x: 560, y: 330 }, pk)
  const fare = Math.max(pricing.minFare, Math.round(pricing.base + 9.5 * pricing.perKm + 22 * pricing.perMin))
  return (
    <div className="relative mx-auto h-[540px] w-full max-w-[560px] sm:h-[600px]" aria-hidden>
      <div className="absolute inset-x-4 bottom-6 top-16 rounded-[44px] bg-[radial-gradient(circle_at_30%_25%,#DDF3EC,transparent_60%),radial-gradient(circle_at_80%_80%,#ECE4D4,transparent_55%)]" />

      {/* Captain phone, behind */}
      <MiniPhone dark className="absolute end-0 top-0 hidden sm:block">
        <MapCanvas dark className="absolute inset-0" pickup={pk} approach={capRoute} driver={pointAlong(capRoute, 0.5)} focus={{ x: 490, y: 380 }} zoom={1.6} labels={false} />
        <div className="absolute inset-x-3 top-9 rounded-2xl bg-navy/90 p-3 text-white">
          <div className="text-[10px] text-white/55">{t('أرباح اليوم', "Today's earnings")}</div>
          <div className="text-lg font-bold">{money(486)}</div>
        </div>
        <div className="absolute inset-x-3 bottom-4 rounded-2xl bg-navy-2 p-3 text-white ring-1 ring-emerald/30">
          <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-emerald">{t('طلب جديد', 'New request')}</span><span className="text-xs font-bold">{money(captainNet(fare))}</span></div>
          <div className="mt-1.5 text-[11px] text-white/70">{t('العليا ← المركز المالي', 'Olaya → KAFD')}</div>
          <div className="mt-2.5 grid grid-cols-[1fr_2fr] gap-1.5"><span className="rounded-lg bg-white/10 py-1.5 text-center text-[10px]">{t('رفض', 'Decline')}</span><span className="rounded-lg bg-emerald py-1.5 text-center text-[10px] font-bold">{t('قبول', 'Accept')}</span></div>
        </div>
      </MiniPhone>

      {/* Rider phone, front */}
      <MiniPhone className="anim-float absolute inset-x-0 top-10 mx-auto sm:inset-x-auto sm:start-[6%]">
        <MapCanvas className="absolute inset-0" pickup={pk} dest={ds} route={route} progress={0.42} driver={car} focus={{ x: 440, y: 340 }} zoom={1.5} labels={false} />
        <div className="absolute inset-x-3 top-9 flex items-center gap-2 rounded-2xl bg-white/95 p-2.5 shadow-lg">
          <span className="h-2 w-2 rounded-full bg-emerald" /><span className="text-[11px] font-semibold">{t('في الطريق إلى المركز المالي', 'Heading to KAFD')}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-[0_-10px_30px_-10px_rgba(0,0,0,.15)]">
          <div className="mb-3 h-1 rounded-full bg-[#E5EAF0]"><div className="h-1 w-[42%] rounded-full bg-emerald" /></div>
          <div className="flex items-center gap-2.5">
            <Avatar initials={t('خع', 'KA')} size={36} />
            <div className="min-w-0 flex-1"><div className="text-xs font-bold">{t('الكابتن خالد', 'Captain Khalid')}</div><div className="flex items-center gap-1 text-[10px] text-muted"><Star size={10} className="fill-gold text-gold" />4.92 · {t('كامري', 'Camry')}</div></div>
            <div className="text-end"><div className="text-sm font-bold text-navy">{t('8 د', '8 min')}</div><div className="text-[10px] text-muted">{t('للوصول', 'to arrive')}</div></div>
          </div>
          <CarIllustration cat="comfort" className="mx-auto mt-2 h-10" />
        </div>
      </MiniPhone>

      {/* Shared-state chip: what the admin sees for the same ride */}
      <div className="absolute bottom-2 end-2 flex items-center gap-3 rounded-2xl bg-white p-3 pe-4 shadow-xl ring-1 ring-line sm:bottom-10 sm:end-auto sm:start-0">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-emerald"><BarChart3 size={18} /></span>
        <div>
          <div className="text-[11px] text-muted">{t('لوحة الإدارة ترى الرحلة نفسها', 'Admin sees the same ride')}</div>
          <div className="mt-0.5 flex items-center gap-2 text-sm font-bold"><span className="font-mono text-xs" dir="ltr">MS-48312</span><span className="rounded-full bg-[#EAF2FF] px-2 py-0.5 text-[10px] font-semibold text-[#2E5FB8]">{t('جارية', 'In progress')}</span></div>
        </div>
      </div>
    </div>
  )
}

function Lifecycle({ onStart }: { onStart: () => void }) {
  const { t, dir } = useStore()
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight
  const steps: { who: string; icon: LucideIcon; title: string; body: string }[] = [
    { who: t('الراكب', 'Rider'), icon: MapPin, title: t('يطلب رحلة', 'Requests a ride'), body: t('يختار الوجهة والفئة ويرى الأجرة قبل التأكيد.', 'Picks destination and category, sees the fare upfront.') },
    { who: t('الكابتن', 'Captain'), icon: Car, title: t('يقبل الطلب', 'Accepts'), body: t('يرى الأرباح والمسافة، أو يرفض فيُحوَّل الطلب لكابتن آخر.', 'Sees earnings and distance, or declines and it is reassigned.') },
    { who: t('الكابتن', 'Captain'), icon: Navigation, title: t('يصل ويبدأ الرحلة', 'Arrives and starts'), body: t('الراكب يتابع الوصول مباشرة على الخريطة.', 'The rider follows the arrival live on the map.') },
    { who: t('الراكب', 'Rider'), icon: CheckCircle2, title: t('يصل ويقيّم', 'Arrives and rates'), body: t('ملخص الأجرة، ثم تقييم الكابتن.', 'Fare summary, then a captain rating.') },
    { who: t('الإدارة', 'Admin'), icon: BarChart3, title: t('ترى كل شيء', 'Sees it all'), body: t('الرحلة والتقييم والإيراد في السجل فورًا.', 'Trip, rating and revenue appear in the records.') },
  ]
  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[28px] font-bold leading-tight text-navy sm:text-3xl">{t('مسار الرحلة من الطلب حتى السجل', 'The ride lifecycle, end to end')}</h2>
            <p className="mt-2 max-w-[60ch] text-sm leading-7 text-muted">{t('خمس خطوات في أقل من ثلاث دقائق. لوحة العرض بجانب الجوال ترشدك في كل خطوة.', 'Five steps in under three minutes. The demo panel beside the phone guides each step.')}</p>
          </div>
          <button onClick={onStart} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(15,175,146,.7)] transition hover:bg-emerald-d active:scale-[.98]">{t('ابدأ العرض الموجّه', 'Start the guided demo')}<Arrow size={16} /></button>
        </div>
        <ol className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
          <span aria-hidden className="absolute inset-x-[10%] top-[22px] hidden h-0.5 bg-[linear-gradient(90deg,#0FAF92,#D7A867)] lg:block rtl:bg-[linear-gradient(270deg,#0FAF92,#D7A867)]" />
          {steps.map((s, i) => (
            <li key={i} className="relative flex gap-4 rounded-2xl border border-line p-4 lg:flex-col lg:items-center lg:border-0 lg:px-3 lg:text-center">
              <span className={cx('relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ring-4 ring-white', i === steps.length - 1 ? 'bg-gold text-navy' : 'bg-navy text-white')}>{i + 1}</span>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-d lg:justify-center"><s.icon size={13} />{s.who}</div>
                <h3 className="mt-1 font-bold text-ink">{s.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Simulated() {
  const { t } = useStore()
  const items: [LucideIcon, string, string][] = [
    [Satellite, t('الخرائط والتتبع', 'Maps and tracking'), t('خريطة SVG توضيحية للرياض وحركة محاكاة، بدون GPS.', 'Illustrative SVG map of Riyadh with simulated movement, no GPS.')],
    [CreditCard, t('المدفوعات', 'Payments'), t('بطاقات ومحفظة وتحويلات تجريبية، بدون أي عملية مالية.', 'Demo cards, wallet and payouts. No money moves.')],
    [MessageSquareText, t('الرسائل والتحقق', 'SMS and verification'), t('رمز التحقق دائمًا 1234، ولا تُرسل رسائل حقيقية.', 'The code is always 1234 and no real SMS is sent.')],
    [BarChart3, t('أرقام التحليلات', 'Analytics figures'), t('خطوط أساس توضيحية تضاف إليها رحلات العرض.', 'Illustrative baselines with demo trips added on top.')],
  ]
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
      <div className="grid gap-8 rounded-[28px] bg-navy p-6 text-white sm:p-8 lg:grid-cols-[320px_1fr] lg:gap-12">
        <div>
          <h2 className="text-xl font-bold">{t('ما هو محاكى في هذا النموذج', "What's simulated in this prototype")}</h2>
          <p className="mt-2 text-sm leading-7 text-white/60">{t('هذه واجهات للمراجعة والاعتماد. التكاملات الحقيقية تُبنى في مرحلة التطوير وفق خطة المرحلة الأولى.', 'These screens are for review and sign-off. Real integrations are built during development, following the Phase 1 plan.')}</p>
          <p className="mt-4 rounded-2xl bg-gold/10 p-3 text-xs leading-6 text-gold">{t(`الأسعار والرسوم وعمولة المنصة (${commissionPct()}%) قيم مبدئية لم يعتمدها العميل بعد.`, `Fares, fees and the ${commissionPct()}% platform commission are provisional and not yet approved by the client.`)}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map(([I, a, b]) => (
            <li key={a} className="flex gap-3 rounded-2xl bg-white/5 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald"><I size={17} /></span>
              <div><div className="text-sm font-bold">{a}</div><div className="mt-1 text-xs leading-5 text-white/60">{b}</div></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function MiniPhone({ children, className, dark }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={cx('h-[500px] w-[244px] overflow-hidden rounded-[40px] border-[8px] border-[#0A111D] shadow-[0_40px_80px_-30px_rgba(16,27,46,.6)] sm:h-[520px] sm:w-[254px]', dark ? 'bg-navy' : 'bg-white', className)}>
      <div className="relative h-full w-full">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  )
}
