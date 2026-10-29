import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import {
  ArrowLeft, ArrowRight, BadgeCheck, Bell, Car, ChevronLeft, ChevronRight, Clock, FileCheck2, Flag, HeadphonesIcon, History, Home, LogOut, MapPin, MessageCircle, Navigation, Phone, Power,
  Settings, Star, User, Wallet, TrendingUp, ShieldCheck, Route, CornerUpLeft, Check,
} from 'lucide-react'
import { CATEGORIES, fmtDate, fmtTime, timeAgo, tripTotal, useStore, type Trip } from './store'
import { MARKET, captainNet, commissionPct } from './config/market'
import MapCanvas, { pointAlong, routePts } from './components/MapCanvas'
import { Avatar, Btn, ConfirmationModal, Logo, Segmented, Stars, StatusBar, Toggle, cx } from './components/ui'
import { ChatSheet, RideCard, Empty } from './components/ride'

type Tab = 'home' | 'earnings' | 'trips' | 'account'
type Sub = null | 'vehicle' | 'documents' | 'notifications' | 'support' | 'settings' | 'rating'

export default function DriverApp() {
  const { dAuthed, live } = useStore()
  if (!dAuthed) return <Login />
  if (live && live.driverId === 'd1' && !live.dDone && live.status !== 'cancelled' && live.status !== 'requested') return <ActiveTrip trip={live} />
  return <Main />
}

function useBack() { const { dir } = useStore(); return dir === 'rtl' ? ArrowRight : ArrowLeft }
function Chev() { const { dir } = useStore(); return dir === 'rtl' ? <ChevronLeft size={18} className="text-white/30" /> : <ChevronRight size={18} className="text-white/30" /> }

function Login() {
  const { t, setDAuthed, drivers, toast } = useStore()
  const me = drivers[0]
  const [step, setStep] = useState<'login' | 'profile'>('login')
  return (
    <div className="relative flex h-full flex-col bg-navy text-white">
      <StatusBar light />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(15,175,146,.25),transparent_70%)]" />
      <div className="relative flex flex-1 flex-col px-6 pt-8">
        <Logo light />
        <span className="mt-2 w-fit rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold">{t('تطبيق الكابتن', 'Captain app')}</span>
        {step === 'login' ? (
          <div className="anim-fade-up mt-auto pb-10">
            <h1 className="text-[30px] font-bold leading-tight">{t('قُد بثقة،', 'Drive with confidence,')}<br /><span className="text-emerald">{t('واكسب بذكاء', 'earn smarter')}</span></h1>
            <p className="mt-3 text-sm leading-7 text-white/55">{t('طلبات قريبة، أرباح واضحة، ودعم متواصل طوال رحلتك.', 'Nearby requests, clear earnings and continuous support.')}</p>
            <div dir="ltr" className="mt-8 flex h-14 items-center gap-3 rounded-2xl bg-white/5 px-4 ring-1 ring-white/10">
              <span className="border-e border-white/10 pe-3 text-sm font-semibold text-white/70">{MARKET.callingCode}</span>
              <input aria-label={t('رقم الجوال', 'Mobile number')} inputMode="tel" autoComplete="tel-national" defaultValue="55 482 1173" className="w-full bg-transparent text-base font-semibold tracking-wider outline-none" />
            </div>
            <Btn className="mt-3 h-14 w-full text-base" onClick={() => { setStep('profile'); toast('تم التحقق برمز تجريبي', 'Verified with a demo code', 'info') }}>{t('دخول تجريبي', 'Demo sign in')}</Btn>
            <p className="mt-3 text-center text-[11px] text-white/35">{t('تسجيل دخول تجريبي بدون رسائل حقيقية', 'Demo login — no real SMS')}</p>
          </div>
        ) : (
          <div className="anim-fade-up mt-auto pb-10">
            <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <Avatar initials={t(me.initials, 'KA')} size={56} tone="gold" />
                <div className="flex-1"><div className="text-lg font-bold">{t(me.nameAr, me.nameEn)}</div><div className="flex items-center gap-1 text-xs text-white/60"><Star size={12} className="fill-gold text-gold" />{me.rating} · {me.rides.toLocaleString()} {t('رحلة', 'trips')}</div></div>
              </div>
              <div className="mt-4 space-y-2.5 text-sm">
                {[[t('المركبة', 'Vehicle'), t(me.carAr, me.carEn)], [t('رقم اللوحة', 'Plate'), me.plate], [t('الفئة', 'Category'), t('مريح', 'Comfort')]].map(([a, b]) => (
                  <div key={a} className="flex justify-between gap-3"><span className="text-white/50">{a}</span><span className="text-end font-semibold">{b}</span></div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald/15 p-3 text-xs font-semibold text-emerald"><BadgeCheck size={16} />{t('الحساب معتمد · الوثائق سارية', 'Account approved · documents valid')}</div>
            </div>
            <Btn className="mt-4 h-14 w-full text-base" onClick={() => setDAuthed(true)}>{t('ابدأ العمل', 'Start driving')}</Btn>
          </div>
        )}
      </div>
    </div>
  )
}

function Main() {
  const { t } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [sub, setSub] = useState<Sub>(null)
  if (sub) return <SubPage sub={sub} onBack={() => setSub(null)} />
  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="relative flex-1 overflow-hidden">
        {tab === 'home' && <HomeScreen openSub={setSub} />}
        {tab === 'earnings' && <Earnings />}
        {tab === 'trips' && <TripsList />}
        {tab === 'account' && <Account openSub={setSub} />}
      </div>
      <nav className="grid shrink-0 grid-cols-4 border-t border-white/5 bg-[#0B1424] px-2 pb-5 pt-2 sm:pb-6">
        {([['home', Home, t('nav.home')], ['earnings', Wallet, t('nav.earnings')], ['trips', History, t('nav.trips')], ['account', User, t('nav.account')]] as const).map(([id, I, l]) => (
          <button key={id} onClick={() => setTab(id)} className={cx('flex flex-col items-center gap-1 py-1.5 text-[11px] font-semibold transition', tab === id ? 'text-emerald' : 'text-white/40')}><I size={20} />{l}</button>
        ))}
      </nav>
    </div>
  )
}

function HomeScreen({ openSub }: { openSub: (s: Sub) => void }) {
  const { t, driverOnline, setDriverOnline, live, money, acceptRide, rejectRide, drivers, notices, trips, toast } = useStore()
  const me = drivers[0]
  const req = live && live.status === 'requested' && !live.rejected && driverOnline ? live : null
  const [count, setCount] = useState(30)
  useEffect(() => { if (!req) return; setCount(30); const iv = setInterval(() => setCount((c) => Math.max(0, c - 1)), 1000); return () => clearInterval(iv) }, [req?.id])
  // An unanswered offer expires and is passed to the next captain, like an explicit decline.
  useEffect(() => { if (req && count === 0) { toast('انتهت مهلة الطلب وتم تحويله لكابتن آخر', 'Request timed out and was passed on', 'info'); rejectRide() } }, [count, req?.id])
  const unread = notices.filter((n) => n.role === 'driver' && !n.read).length
  const todayDone = trips.filter((x) => x.driverId === 'd1' && x.status === 'completed' && x.live).length
  const earn = 486 + trips.filter((x) => x.driverId === 'd1' && x.status === 'completed' && x.live).reduce((s, x) => s + captainNet(tripTotal(x)), 0)
  const me2 = { x: me.x, y: me.y }
  const others = drivers.slice(1).filter((d) => d.status !== 'offline').map((d, i) => ({ id: d.id, x: d.x, y: d.y, angle: i * 60 }))
  return (
    <div className="absolute inset-0">
      <MapCanvas dark className="absolute inset-0" cars={driverOnline ? others : []} driver={{ ...me2, angle: 0 }} pickup={req?.pickup} dest={req?.dest} approach={req ? routePts(me2, req.pickup) : undefined} route={req ? routePts(req.pickup, req.dest) : undefined} focus={req ? { x: (me.x + req.pickup.x) / 2, y: (me.y + req.pickup.y) / 2 + 80 } : { x: me.x, y: me.y + 40 }} zoom={1.35} controls controlsClass="end-4 top-[220px]" />
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-navy via-navy/85 to-transparent pb-8">
        <StatusBar light />
        <div className="flex items-center gap-3 px-5 pt-2">
          <Avatar initials={t(me.initials, 'KA')} size={40} tone="gold" />
          <div className="min-w-0 flex-1"><div className="text-[11px] text-white/50">{t('أهلًا كابتن', 'Hello Captain')}</div><div className="font-bold">{t('خالد العتيبي', 'Khalid Alotaibi')}</div></div>
          <button onClick={() => openSub('notifications')} className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/10" aria-label={t('common.notifications')}><Bell size={18} />{unread > 0 && <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-gold" />}</button>
        </div>
        <div className="mx-5 mt-4 grid grid-cols-3 gap-2">
          {[[t('أرباح اليوم', 'Today'), money(earn), TrendingUp], [t('رحلات', 'Trips'), String(14 + todayDone), Route], [t('ساعات القيادة', 'Online'), t('6س 20د', '6h 20m'), Clock]].map(([a, b, I], k) => {
            const Ico = I as typeof Clock
            return <div key={k} className={cx('rounded-2xl p-3 backdrop-blur', k === 0 ? 'bg-emerald text-white' : 'bg-white/[.07]')}><Ico size={14} className={k === 0 ? 'text-white/80' : 'text-emerald'} /><div className="mt-2 truncate text-[15px] font-bold">{b as string}</div><div className={cx('text-[10px]', k === 0 ? 'text-white/75' : 'text-white/45')}>{a as string}</div></div>
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
        {req ? (
          <div className="anim-sheet overflow-hidden rounded-[28px] bg-[#16233A] shadow-2xl ring-1 ring-emerald/30">
            <div className="h-1 bg-white/5"><div className="h-full bg-emerald transition-all duration-1000 ease-linear" style={{ width: `${(count / 30) * 100}%` }} /></div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald"><span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-emerald" /><span className="h-2 w-2 rounded-full bg-emerald" /></span>{t('طلب رحلة جديد', 'New ride request')}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">{t(CATEGORIES.find((c) => c.id === req.category)!.ar, CATEGORIES.find((c) => c.id === req.category)!.en)} · {count}{t('ث', 's')}</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div><div className="text-[11px] text-white/45">{t('الأرباح المتوقعة', 'Est. earnings')}</div><div className="text-3xl font-bold">{money(captainNet(tripTotal(req)))}</div></div>
                <div className="text-end text-xs text-white/60"><div>{t('يبعد عنك 1.8 كم', '1.8 km away')}</div><div>{t(`الرحلة ${req.km} كم`, `Trip ${req.km} km`)}</div></div>
              </div>
              <div className="mt-3 space-y-2 rounded-2xl bg-white/5 p-3 text-sm">
                <div className="flex items-center gap-2.5"><span className="h-2 w-2 rounded-full bg-emerald" /><span className="truncate">{t(req.pickup.ar, req.pickup.en)}</span></div>
                <div className="flex items-center gap-2.5"><span className="h-2 w-2 rounded-sm bg-gold" /><span className="truncate">{t(req.dest.ar, req.dest.en)}</span></div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50"><User size={12} />{t('عبدالله الشهري', 'Abdullah Alshehri')} · <Star size={11} className="fill-gold text-gold" />4.9 · {req.payment === 'card' ? t('payment.card') : t('payment.cash')}</div>
              <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
                <Btn variant="ghost" className="h-13 bg-white/10 text-white hover:bg-white/15" onClick={rejectRide}>{t('رفض', 'Decline')}</Btn>
                <Btn className="h-13 text-base" onClick={acceptRide}>{t('قبول الرحلة', 'Accept ride')}</Btn>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] bg-[#16233A]/95 p-4 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <span className={cx('grid h-12 w-12 place-items-center rounded-2xl transition', driverOnline ? 'bg-emerald/15 text-emerald' : 'bg-white/10 text-white/40')}><Power size={22} /></span>
              <div className="flex-1"><div className="font-bold">{driverOnline ? t('أنت متصل الآن', "You're online") : t('أنت غير متصل', "You're offline")}</div><div className="text-xs text-white/50">{driverOnline ? t('بانتظار طلبات قريبة منك…', 'Waiting for nearby requests…') : t('فعّل الاتصال لاستقبال الطلبات', 'Go online to receive requests')}</div></div>
              <Toggle on={driverOnline} onChange={(v) => { setDriverOnline(v); toast(v ? 'أنت الآن متصل' : 'تم إيقاف استقبال الطلبات', v ? "You're now online" : 'Stopped receiving requests', 'info') }} label={t('استقبال الطلبات', 'Receive requests')} />
            </div>
            {driverOnline && <div className="mt-3 flex items-center gap-2 rounded-2xl bg-gold/10 p-3 text-xs text-gold"><Navigation size={14} />{t('طلب مرتفع في العليا وطريق الملك فهد', 'High demand in Olaya & King Fahd Rd')}</div>}
            {driverOnline && live?.status === 'requested' && live.rejected && <div className="mt-2 text-center text-[11px] text-white/40">{t('تم تحويل الطلب المرفوض إلى كابتن آخر', 'The declined request was reassigned')}</div>}
            {driverOnline && !live && <div className="mt-2 text-center text-[11px] text-white/35">{t('للعرض: اطلب رحلة من تطبيق الراكب لتظهر هنا', 'Demo: request a ride in the Rider app to see it here')}</div>}
            {!driverOnline && live?.status === 'requested' && <div className="mt-2 text-center text-[11px] text-gold">{t('يوجد طلب بانتظارك — فعّل الاتصال لعرضه', 'A request is waiting — go online to see it')}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function ActiveTrip({ trip }: { trip: Trip }) {
  const { t, drivers, money, arrive, startRide, endRide, updateTrip, toast, lang, pricing } = useStore()
  const me = drivers[0]
  const [chat, setChat] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [, tick] = useState(0)
  useEffect(() => { const iv = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(iv) }, [])
  const start = { x: me.x, y: me.y }
  const approach = routePts(start, trip.pickup)
  const route = routePts(trip.pickup, trip.dest)
  const pos = trip.status === 'in_progress' || trip.status === 'completed' ? pointAlong(route, trip.progress) : pointAlong(approach, trip.approach)
  const elapsed = trip.startedAt ? Math.floor(((trip.endedAt ?? Date.now()) - trip.startedAt) / 1000) : 0
  const mm = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
  const earn = captainNet(tripTotal(trip))

  if (trip.status === 'completed')
    return (
      <div className="flex h-full flex-col bg-navy text-white">
        <StatusBar light />
        <div className="anim-fade-up flex flex-1 flex-col px-6 pt-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald"><Flag size={28} /></div>
          <h2 className="mt-5 text-2xl font-bold">{t('اكتملت الرحلة', 'Trip completed')}</h2>
          <p className="mt-1 text-sm text-white/50">{t(trip.dest.ar, trip.dest.en)}</p>
          <div className="mt-8 rounded-3xl bg-white/5 p-5 text-start ring-1 ring-white/10">
            <div className="text-center"><div className="text-xs text-white/50">{t('صافي أرباحك', 'Your net earnings')}</div><div className="mt-1 text-4xl font-bold text-emerald">{money(earn)}</div></div>
            <div className="mt-5 space-y-2.5 text-sm">
              {[[t('أجرة الرحلة', 'Trip fare'), money(tripTotal(trip))], ...(trip.waitFee ? [[t('منها رسوم انتظار', 'incl. waiting fee'), money(trip.waitFee)]] : []), [t(`عمولة المنصة ${commissionPct()}% (مبدئية)`, `Platform fee ${commissionPct()}% (provisional)`), '- ' + money(tripTotal(trip) - earn)], [t('المسافة', 'Distance'), t(`${trip.km} كم`, `${trip.km} km`)], [t('طريقة الدفع', 'Payment'), trip.payment === 'card' ? t('payment.card') : t('نقدًا — حصّل المبلغ', 'Cash — collect fare')]].map(([a, b]) => (
                <div key={a} className="flex justify-between"><span className="text-white/50">{a}</span><span className="font-semibold">{b}</span></div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-white/5 p-3 text-center text-xs text-white/60">{trip.rating ? <span className="flex items-center justify-center gap-2">{t('تقييم الراكب', 'Rider rating')} <Stars value={trip.rating} size={14} /></span> : t('بانتظار تقييم الراكب…', 'Awaiting rider rating…')}</div>
          </div>
          <Btn className="mt-auto mb-10 h-14 w-full text-base" onClick={() => updateTrip(trip.id, { dDone: true })}>{t('العودة لاستقبال الطلبات', 'Back to requests')}</Btn>
        </div>
      </div>
    )

  const toPickup = trip.status === 'accepted' || trip.status === 'arrived'
  return (
    <div className="relative flex h-full flex-col bg-navy text-white">
      <MapCanvas dark className="absolute inset-0 h-[64%]" pickup={trip.pickup} dest={trip.dest} approach={toPickup ? approach : undefined} route={toPickup ? undefined : route} progress={trip.progress} driver={pos} focus={{ x: pos.x, y: pos.y + 30 }} zoom={1.7} controls controlsClass="end-4 top-[170px]" />
      <div className="absolute inset-x-0 top-0"><StatusBar light />
        <div className="mx-4 mt-2 flex items-center gap-3 rounded-2xl bg-emerald p-3.5 shadow-xl">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20"><CornerUpLeft size={22} className="ltr:-scale-x-100" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold leading-tight">{toPickup ? t('400 م', '400 m') : t(`${Math.max(0.2, Math.round(trip.km * (1 - trip.progress) * 10) / 10)} كم`, `${Math.max(0.2, Math.round(trip.km * (1 - trip.progress) * 10) / 10)} km`)}</div>
            <div className="truncate text-xs text-white/85">{toPickup ? t('انعطف يسارًا نحو شارع التحلية', 'Turn left onto Tahlia St') : t(`تابع على طريق الملك فهد نحو ${trip.dest.ar}`, `Continue on King Fahd Rd to ${trip.dest.en}`)}</div>
          </div>
        </div>
      </div>
      <div key={trip.status} className="anim-sheet no-scrollbar absolute inset-x-0 bottom-0 max-h-[62%] overflow-y-auto overscroll-contain rounded-t-[30px] bg-[#16233A] px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold text-gold">
            {trip.status === 'accepted' ? t('في الطريق إلى الراكب', 'Heading to pickup') : trip.status === 'arrived' ? t('بانتظار الراكب', 'Waiting for rider') : t('الرحلة جارية', 'Trip in progress')}
          </span>
          <span className="font-mono text-[11px] text-white/40" dir="ltr">{trip.id}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Avatar initials={t('عش', 'AS')} size={46} tone="emerald" />
          <div className="min-w-0 flex-1"><div className="font-bold">{t('عبدالله الشهري', 'Abdullah Alshehri')}</div><div className="flex items-center gap-1 text-xs text-white/50"><Star size={11} className="fill-gold text-gold" />4.9 · {trip.payment === 'card' ? t('payment.card') : t('payment.cash')}</div></div>
          <button onClick={() => setChat(true)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label={t('محادثة', 'Chat')}><MessageCircle size={18} /></button>
          <button onClick={() => toast(`اتصال تجريبي بالراكب ${MARKET.callingCode} 55 123 4567 — لا يتم إجراء مكالمة حقيقية`, `Simulated call to rider ${MARKET.callingCode} 55 123 4567 — no real call is placed`, 'info')} className="grid h-11 w-11 place-items-center rounded-full bg-emerald" aria-label={t('اتصال', 'Call')}><Phone size={18} /></button>
        </div>
        {toPickup ? (
          <>
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-white/5 p-3 text-sm"><MapPin size={16} className="text-emerald" /><span className="truncate">{t(trip.pickup.ar, trip.pickup.en)}</span></div>
            {trip.status === 'arrived' && trip.arrivedAt && <WaitingMeter since={trip.arrivedAt} freeMins={pricing.waiting.freeMins} perMin={money(pricing.waiting.perMin)} />}
          </>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[[t('المدة', 'Elapsed'), mm], [t('التقدم', 'Progress'), `${Math.round(trip.progress * 100)}%`], [t('الأجرة', 'Fare'), money(tripTotal(trip))]].map(([a, b]) => (
                <div key={a} className="rounded-2xl bg-white/5 py-2.5"><div className="text-sm font-bold" dir={a === t('المدة', 'Elapsed') ? 'ltr' : undefined}>{b}</div><div className="text-[10px] text-white/45">{a}</div></div>
              ))}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald transition-all duration-500" style={{ width: `${trip.progress * 100}%` }} /></div>
            <div className="mt-3 flex items-center gap-2.5 text-sm"><Flag size={15} className="text-gold" /><span className="truncate">{t(trip.dest.ar, trip.dest.en)}</span></div>
          </>
        )}
        {trip.status === 'accepted' && <Btn className="mt-4 h-14 w-full text-base" onClick={arrive}><MapPin size={18} />{t('وصلت لموقع الراكب', "I've arrived at pickup")}</Btn>}
        {trip.status === 'arrived' && <Btn className="mt-4 h-14 w-full text-base" onClick={startRide}><Navigation size={18} />{t('بدء الرحلة', 'Start trip')}</Btn>}
        {trip.status === 'in_progress' && <Btn variant="ghost" className="mt-4 h-14 w-full bg-[#E25B53] text-base text-white hover:bg-[#cf4c44]" onClick={() => setConfirmEnd(true)}><Flag size={18} />{t('إنهاء الرحلة', 'End trip')}</Btn>}
        <p className="mt-2 text-center text-[10px] text-white/30">{t('مسار ملاحة توضيحي — ليس تتبعًا حقيقيًا', 'Illustrative navigation — not real GPS tracking')} · {fmtDate(Date.now(), lang)}</p>
      </div>
      <ChatSheet open={chat} onClose={() => setChat(false)} name={t('عبدالله الشهري', 'Abdullah Alshehri')} me="driver" dark />
      <ConfirmationModal open={confirmEnd} onClose={() => setConfirmEnd(false)} onConfirm={endRide} title={t('إنهاء الرحلة؟', 'End the trip?')} body={t('تأكد من وصول الراكب إلى وجهته قبل إنهاء الرحلة.', 'Make sure the rider has reached the destination.')} confirm={t('إنهاء الرحلة', 'End trip')} />
    </div>
  )
}

/** Waiting time since arrival; the fee itself is settled when the trip starts (store.startRide). */
function WaitingMeter({ since, freeMins, perMin }: { since: number; freeMins: number; perMin: string }) {
  const { t } = useStore()
  const secs = Math.max(0, Math.floor((Date.now() - since) / 1000))
  const free = secs < freeMins * 60
  const mm = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
  return (
    <div className={cx('mt-2 flex items-center justify-between rounded-2xl p-3 text-xs', free ? 'bg-white/5 text-white/60' : 'bg-gold/10 text-gold')}>
      <span className="flex items-center gap-2"><Clock size={14} />{free ? t(`انتظار مجاني ${freeMins} دقائق`, `${freeMins} min free waiting`) : t(`رسوم الانتظار ${perMin} للدقيقة`, `Waiting fee ${perMin}/min`)}</span>
      <span className="font-mono font-bold" dir="ltr">{mm}</span>
    </div>
  )
}

const WEEK = [{ d: 'السبت', e: 'Sat', v: 410 }, { d: 'الأحد', e: 'Sun', v: 520 }, { d: 'الإثنين', e: 'Mon', v: 465 }, { d: 'الثلاثاء', e: 'Tue', v: 610 }, { d: 'الأربعاء', e: 'Wed', v: 548 }, { d: 'الخميس', e: 'Thu', v: 720 }, { d: 'الجمعة', e: 'Fri', v: 486 }]
function Earnings() {
  const { t, money, trips, lang, toast } = useStore()
  const [p, setP] = useState<'day' | 'week' | 'month'>('week')
  const [open, setOpen] = useState<Trip | null>(null)
  const liveEarn = trips.filter((x) => x.driverId === 'd1' && x.status === 'completed' && x.live).reduce((s, x) => s + captainNet(tripTotal(x)), 0)
  const data = p === 'day' ? [8, 10, 12, 14, 16, 18, 20, 22].map((h, i) => ({ d: `${h}:00`, e: `${h}:00`, v: [24, 58, 41, 66, 92, 75, 88, 42][i] })) : p === 'week' ? WEEK : [1, 2, 3, 4].map((w, i) => ({ d: `الأسبوع ${w}`, e: `W${w}`, v: [3120, 3540, 2980, 3759][i] }))
  const total = { day: 486, week: 3759, month: 13399 }[p] + liveEarn
  const rides = { day: 14, week: 96, month: 371 }[p]
  const mine = trips.filter((x) => x.driverId === 'd1' && x.status === 'completed')
  return (
    <div className="no-scrollbar h-full overflow-y-auto pb-6">
      <StatusBar light />
      <div className="px-5 pt-2"><h2 className="text-xl font-bold">{t('nav.earnings')}</h2>
        <Segmented dark className="mt-4 w-full" value={p} onChange={setP} options={[{ id: 'day', label: t('اليوم', 'Today') }, { id: 'week', label: t('هذا الأسبوع', 'This week') }, { id: 'month', label: t('هذا الشهر', 'This month') }]} />
        <div className="mt-4 rounded-3xl bg-gradient-to-br from-[#17324A] to-[#132036] p-5 ring-1 ring-white/5">
          <div className="text-xs text-white/50">{t('إجمالي الأرباح', 'Total earnings')}</div>
          <div className="mt-1 text-4xl font-bold">{money(total)}</div>
          <div className="mt-1 text-xs font-semibold text-emerald"><span dir="ltr">+12.4%</span> {t('عن الفترة السابقة', 'vs previous period')}</div>
          <div className="mt-4 h-40" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}><XAxis dataKey={lang === 'ar' ? 'd' : 'e'} tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 10 }} axisLine={false} tickLine={false} reversed={lang === 'ar'} /><Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} contentStyle={{ background: '#101B2E', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }} formatter={(v) => [money(Number(v)), '']} /><Bar dataKey="v" fill="#0FAF92" radius={[6, 6, 2, 2]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[[t('رحلة مكتملة', 'Rides'), rides], [t('ساعات', 'Hours'), { day: 6.3, week: 41, month: 168 }[p]], [t('متوسط الرحلة', 'Avg/ride'), Math.round(total / rides)]].map(([a, b]) => (
            <div key={a as string} className="rounded-2xl bg-white/5 p-3 text-center"><div className="text-lg font-bold">{b}</div><div className="text-[10px] text-white/45">{a}</div></div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/5 p-4"><div><div className="text-xs text-white/50">{t('الرصيد القابل للتحويل', 'Available payout')}</div><div className="text-lg font-bold">{money(1240 + liveEarn)}</div></div><Btn className="h-10 px-4 text-xs" onClick={() => toast('تم طلب تحويل تجريبي إلى حسابك البنكي', 'Demo payout requested to your bank', 'info')}>{t('تحويل', 'Payout')}</Btn></div>
        <div className="mt-5 text-sm font-bold">{t('أحدث الرحلات', 'Recent trips')}</div>
        <div className="mt-2 space-y-2">{mine.slice(0, 4).map((x) => (
          <div key={x.id}>
            <RideCard trip={x} onClick={() => setOpen(open?.id === x.id ? null : x)} money={(n) => money(captainNet(n))} t={t} lang={lang} dark />
            {open?.id === x.id && (
              <div className="anim-fade-up mx-2 grid grid-cols-2 gap-2 rounded-b-2xl bg-white/[.04] p-3 text-xs">
                <div><div className="text-white/40">{t('رقم الرحلة', 'Trip ID')}</div><div className="mt-0.5 font-mono" dir="ltr">{x.id}</div></div>
                <div><div className="text-white/40">{t('صافي الربح', 'Net earnings')}</div><div className="mt-0.5 font-bold text-emerald">{money(captainNet(tripTotal(x)))}</div></div>
              </div>
            )}
          </div>
        ))}</div>
        <p className="mt-4 text-center text-[10px] text-white/30">{t('أرقام توضيحية لأغراض العرض', 'Illustrative figures for demonstration')}</p>
      </div>
    </div>
  )
}

function TripsList() {
  const { t, trips, money, lang } = useStore()
  const [open, setOpen] = useState<Trip | null>(null)
  const mine = trips.filter((x) => x.driverId === 'd1')
  return (
    <div className="no-scrollbar h-full overflow-y-auto px-5 pb-6">
      <StatusBar light />
      <h2 className="pt-2 text-xl font-bold">{t('سجل الرحلات', 'Trip history')}</h2>
      <div className="mt-4 space-y-2">
        {mine.length === 0 && <Empty icon={Route} text={t('لا توجد رحلات', 'No trips')} />}
        {mine.map((x) => (
          <div key={x.id}>
            <RideCard trip={x} onClick={() => setOpen(open?.id === x.id ? null : x)} money={money} t={t} lang={lang} dark />
            {open?.id === x.id && (
              <div className="anim-fade-up mx-2 space-y-1.5 rounded-b-2xl bg-white/[.03] p-4 text-xs">
                {[[t('رقم الرحلة', 'Trip ID'), x.id], [t('المسافة', 'Distance'), t(`${x.km} كم`, `${x.km} km`)], [t('صافي الربح', 'Net earnings'), money(captainNet(tripTotal(x)))], [t('تقييم الراكب', 'Rider rating'), x.rating ? `${x.rating} ★` : '—']].map(([a, b]) => <div key={a} className="flex justify-between"><span className="text-white/45">{a}</span><span className="font-semibold">{b}</span></div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Account({ openSub }: { openSub: (s: Sub) => void }) {
  const { t, drivers, setDAuthed } = useStore()
  const me = drivers[0]
  const items: [Exclude<Sub, null>, typeof Car, string][] = [['rating', Star, t('تقييمي', 'My rating')], ['vehicle', Car, t('معلومات المركبة', 'Vehicle info')], ['documents', FileCheck2, t('الوثائق وحالة الاعتماد', 'Documents & approval')], ['notifications', Bell, t('common.notifications')], ['support', HeadphonesIcon, t('مركز الدعم', 'Support center')], ['settings', Settings, t('الإعدادات', 'Settings')]]
  return (
    <div className="no-scrollbar h-full overflow-y-auto px-5 pb-6">
      <StatusBar light />
      <div className="mt-4 flex items-center gap-4 rounded-3xl bg-white/5 p-4">
        <Avatar initials={t(me.initials, 'KA')} size={60} tone="gold" />
        <div className="flex-1"><div className="font-bold">{t(me.nameAr, me.nameEn)}</div><div className="text-xs text-white/50" dir="ltr">{me.phone}</div><div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-bold text-emerald"><BadgeCheck size={11} />{t('كابتن معتمد', 'Verified captain')}</div></div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[[me.rating, t('التقييم', 'Rating')], [me.rides.toLocaleString(), t('رحلة', 'Trips')], ['98%', t('نسبة القبول', 'Acceptance')]].map(([a, b]) => <div key={b as string} className="rounded-2xl bg-white/5 py-3"><div className="font-bold">{a}</div><div className="text-[10px] text-white/45">{b}</div></div>)}
      </div>
      <div className="mt-4 divide-y divide-white/5 overflow-hidden rounded-3xl bg-white/5">
        {items.map(([id, I, l]) => <button key={id} onClick={() => openSub(id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-start hover:bg-white/5"><I size={18} className="text-emerald" /><span className="flex-1 text-sm font-semibold">{l}</span><Chev /></button>)}
      </div>
      <button onClick={() => setDAuthed(false)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-3.5 text-sm font-semibold text-[#F08A84]"><LogOut size={16} />{t('تسجيل الخروج', 'Log out')}</button>
    </div>
  )
}

function SubPage({ sub, onBack }: { sub: Exclude<Sub, null>; onBack: () => void }) {
  const { t, drivers, notices, markRead, trips, toast, lang, setLang, driverOnline, setDriverOnline } = useStore()
  const me = drivers[0]
  const Back = useBack()
  const [sound, setSound] = useState(true)
  const [auto, setAuto] = useState(false)
  useEffect(() => { if (sub === 'notifications') return () => markRead('driver') }, [sub])
  const title = { vehicle: t('معلومات المركبة', 'Vehicle info'), documents: t('الوثائق والاعتماد', 'Documents'), notifications: t('common.notifications'), support: t('مركز الدعم', 'Support'), settings: t('الإعدادات', 'Settings'), rating: t('تقييمي', 'My rating') }[sub]
  const rated = trips.filter((x) => x.driverId === 'd1' && x.rating)
  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <StatusBar light />
      <div className="flex items-center gap-3 px-5 pb-3 pt-2"><button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label={t('common.back')}><Back size={18} /></button><h2 className="text-lg font-bold">{title}</h2></div>
      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-5 pb-6">
        {sub === 'vehicle' && (
          <>
            <div className="rounded-3xl bg-white/5 p-5 text-center"><Car size={40} className="mx-auto text-emerald" /><div className="mt-2 font-bold">{t(me.carAr, me.carEn)}</div><div className="mx-auto mt-2 w-fit rounded-lg bg-white px-3 py-1 font-mono text-sm font-bold text-navy">{me.plate}</div></div>
            {[[t('الفئة', 'Category'), t('مريح', 'Comfort')], [t('عدد المقاعد', 'Seats'), '4'], [t('رقم الهيكل', 'VIN'), 'JTNB11HK•••4821'], [t('التأمين', 'Insurance'), t('ساري حتى 2026/03', 'Valid until 03/2026')], [t('الفحص الدوري', 'Inspection'), t('ساري', 'Valid')]].map(([a, b]) => <div key={a} className="flex justify-between rounded-2xl bg-white/5 p-4 text-sm"><span className="text-white/50">{a}</span><span className="font-semibold">{b}</span></div>)}
          </>
        )}
        {sub === 'documents' && (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-emerald/15 p-4 text-sm font-semibold text-emerald"><ShieldCheck size={20} />{t('حسابك معتمد ومفعّل بالكامل', 'Your account is fully approved')}</div>
            {[[t('رخصة القيادة', 'Driving licence'), t('سارية حتى 2027', 'Valid until 2027'), true], [t('الهوية الوطنية', 'National ID'), t('موثقة', 'Verified'), true], [t('استمارة المركبة', 'Vehicle registration'), t('سارية حتى 2026', 'Valid until 2026'), true], [t('شهادة عدم محكومية', 'Background check'), t('تجديد خلال 30 يومًا', 'Renew within 30 days'), false]].map(([a, b, ok]) => (
              <div key={a as string} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4"><FileCheck2 size={18} className={ok ? 'text-emerald' : 'text-gold'} /><div className="flex-1"><div className="text-sm font-semibold">{a}</div><div className="text-xs text-white/50">{b}</div></div>{!ok && <button onClick={() => toast('تم رفع الوثيقة للمراجعة (تجريبي)', 'Document uploaded for review (demo)')} className="rounded-xl bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold">{t('رفع', 'Upload')}</button>}</div>
            ))}
          </>
        )}
        {sub === 'notifications' && notices.filter((n) => n.role === 'driver').map((n) => (
          <div key={n.id} className="flex gap-3 rounded-2xl bg-white/5 p-4"><Bell size={16} className={n.read ? 'text-white/30' : 'text-gold'} /><div className="flex-1"><div className="text-sm leading-6">{t(n.ar, n.en)}</div><div className="text-[11px] text-white/40">{timeAgo(t, n.at)}</div></div></div>
        ))}
        {sub === 'rating' && (
          <>
            <div className="rounded-3xl bg-white/5 p-5 text-center"><div className="text-5xl font-bold">{me.rating}</div><div className="mt-2 flex justify-center"><Stars value={5} size={18} /></div><div className="mt-1 text-xs text-white/50">{t('من آخر 500 رحلة', 'From the last 500 trips')}</div></div>
            {[5, 4, 3, 2, 1].map((s, i) => <div key={s} className="flex items-center gap-3 text-xs"><span className="w-3">{s}</span><div className="h-2 flex-1 rounded-full bg-white/10"><div className="h-full rounded-full bg-gold" style={{ width: `${[86, 10, 3, 1, 0][i]}%` }} /></div><span className="w-8 text-white/50">{[86, 10, 3, 1, 0][i]}%</span></div>)}
            {rated.map((x) => <div key={x.id} className="rounded-2xl bg-white/5 p-4"><div className="flex items-center justify-between"><Stars value={x.rating!} size={13} /><span className="text-[11px] text-white/40">{fmtDate(x.createdAt, lang)} · {fmtTime(x.createdAt)}</span></div>{x.review && <p className="mt-1.5 text-sm text-white/70">"{x.review}"</p>}</div>)}
          </>
        )}
        {sub === 'support' && [[t('مشكلة في رحلة', 'Trip issue')], [t('الأرباح والتحويلات', 'Earnings & payouts')], [t('الحساب والوثائق', 'Account & documents')], [t('بلاغ أمني عاجل', 'Urgent safety report')]].map(([a], i) => (
          <button key={a} onClick={() => toast('تم فتح تذكرة دعم تجريبية', 'Demo support ticket opened')} className="flex w-full items-center gap-3 rounded-2xl bg-white/5 p-4 text-start text-sm font-semibold"><HeadphonesIcon size={17} className={i === 3 ? 'text-[#F08A84]' : 'text-emerald'} /><span className="flex-1">{a}</span><Chev /></button>
        ))}
        {sub === 'settings' && (
          <>
            {[[t('استقبال الطلبات', 'Receive requests'), driverOnline, setDriverOnline], [t('صوت التنبيه للطلبات', 'Request sound'), sound, setSound], [t('القبول التلقائي', 'Auto-accept'), auto, setAuto]].map(([a, v, f]) => (
              <div key={a as string} className="flex items-center justify-between rounded-2xl bg-white/5 p-4 text-sm font-semibold">{a as string}<Toggle on={v as boolean} onChange={f as (b: boolean) => void} /></div>
            ))}
            <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 text-sm font-semibold">{t('اللغة', 'Language')}<Segmented dark value={lang} onChange={setLang} options={[{ id: 'ar', label: 'العربية' }, { id: 'en', label: 'English' }]} /></div>
          </>
        )}
      </div>
    </div>
  )
}
