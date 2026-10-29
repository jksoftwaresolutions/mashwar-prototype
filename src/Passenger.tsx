import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownUp, ArrowLeft, ArrowRight, Banknote, Bell, BriefcaseBusiness, Check, ChevronLeft, ChevronRight, Clock, Copy, CreditCard, Gift, Globe, HeadphonesIcon, Home, LogOut,
  MapPin, MessageCircle, ChevronDown, Phone, Plus, Route, Search, Send, Share2, ShieldAlert, ShieldCheck, Star, Tag, Ticket, User, Users, Wallet, X, Clock3, History, Siren, Map as MapIcon,
} from 'lucide-react'
import { CATEGORIES, PLACES, distKm, estimate, tripTotal, fmtDate, fmtTime, place, timeAgo, useStore, type Category, type Payment, type Place, type Trip } from './store'
import { useLocale } from './i18n/locale'
import { MARKET, cancellationFee, formatPhone } from './config/market'
import MapCanvas, { pointAlong, routePts } from './components/MapCanvas'
import { ChatSheet, Empty, RideCard } from './components/ride'
import { latinInitials, Avatar, Btn, CarIllustration, ConfirmationModal, Logo, Modal, Sheet, Stars, StatusBadge, StatusBar, Toggle, cx, RideStatusTimeline } from './components/ui'

type Tab = 'home' | 'trips' | 'wallet' | 'profile'
type Sub = null | 'addresses' | 'notifications' | 'support' | 'language' | 'ratings' | 'coupons'

export default function PassengerApp() {
  const { pAuthed, live } = useStore()
  if (!pAuthed) return <Onboarding />
  if (live && !live.pDone) return <TripFlow trip={live} />
  return <Main />
}

function useBack() {
  const { dir } = useLocale()
  return dir === 'rtl' ? ArrowRight : ArrowLeft
}
const Chevron = () => {
  const { dir } = useLocale()
  return dir === 'rtl' ? <ChevronLeft size={18} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />
}

/* ---------------- Onboarding ---------------- */
function Onboarding() {
  const { t, setPAuthed, toast, lang, setLang } = useStore()
  const [step, setStep] = useState<'welcome' | 'phone' | 'otp'>('welcome')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [phone, setPhone] = useState('55 123 4567')
  const [name, setName] = useState(t('عبدالله الشهري', 'Abdullah Alshehri'))
  const [otp, setOtp] = useState('')
  const [sec, setSec] = useState(30)
  const Back = useBack()
  useEffect(() => {
    if (step !== 'otp') return
    setSec(30)
    const iv = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(iv)
  }, [step])

  if (step === 'welcome')
    return (
      <div className="relative flex h-full flex-col bg-navy text-white">
        <MapCanvas dark className="absolute inset-0 opacity-60" labels={false} cars={[{ id: 'a', x: 300, y: 260, angle: 90 }, { id: 'b', x: 460, y: 200, angle: 0 }, { id: 'c', x: 520, y: 380, angle: 180 }]} focus={{ x: 400, y: 300 }} zoom={1.3} />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/30 via-navy/70 to-navy" />
        <div className="relative"><StatusBar light /></div>
        <div className="relative flex items-center justify-between px-6 pt-4">
          <Logo light />
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">{lang === 'ar' ? 'EN' : 'ع'}</button>
        </div>
        <div className="relative mt-auto px-6 pb-10">
          <div className="anim-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/15 px-3 py-1 text-[11px] font-semibold text-emerald"><MapPin size={12} />{t('الرياض', 'Riyadh')}</span>
            <h1 className="mt-4 text-[34px] font-bold leading-tight">{t('مشوارك أسهل،', 'Easier rides,')}<br /><span className="text-emerald">{t('رحلتك أذكى', 'smarter journeys')}</span></h1>
            <p className="mt-3 text-sm leading-7 text-white/60">{t('كباتن موثوقون، أسعار واضحة قبل الطلب، وتتبّع مباشر لكل رحلة داخل مدينتك.', 'Trusted captains, upfront pricing and live tracking for every ride in your city.')}</p>
          </div>
          <div className="mt-8 space-y-3">
            <Btn className="h-14 w-full text-base" onClick={() => { setMode('register'); setStep('phone') }}>{t('إنشاء حساب جديد', 'Create account')}</Btn>
            <Btn variant="ghost" className="h-14 w-full bg-white/10 text-base text-white hover:bg-white/15" onClick={() => { setMode('login'); setStep('phone') }}>{t('تسجيل الدخول', 'Log in')}</Btn>
          </div>
          <p className="mt-5 text-center text-[11px] text-white/40">{t('بالمتابعة أنت توافق على الشروط وسياسة الخصوصية', 'By continuing you agree to the Terms & Privacy Policy')}</p>
        </div>
      </div>
    )

  return (
    <div className="flex h-full flex-col bg-white">
      <StatusBar />
      <div className="px-5 pt-3"><button onClick={() => setStep(step === 'otp' ? 'phone' : 'welcome')} className="grid h-10 w-10 place-items-center rounded-full bg-bg" aria-label={t('common.back')}><Back size={18} /></button></div>
      {step === 'phone' ? (
        <div className="anim-fade-up flex flex-1 flex-col px-6 pt-6">
          <h2 className="text-2xl font-bold">{mode === 'register' ? t('أهلًا بك في مَشوار', 'Welcome to MASHWAR') : t('مرحبًا بعودتك', 'Welcome back')}</h2>
          <p className="mt-2 text-sm text-muted">{t('أدخل رقم جوالك وسنرسل لك رمز تحقق.', "Enter your mobile number and we'll send a code.")}</p>
          {mode === 'register' && (
            <label className="mt-8 block"><span className="text-xs font-semibold text-muted">{t('الاسم الكامل', 'Full name')}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-14 w-full rounded-2xl border border-line bg-bg px-4 text-base outline-none focus:border-emerald focus:bg-white" />
            </label>
          )}
          <label className={cx('block', mode === 'register' ? 'mt-4' : 'mt-8')}><span className="text-xs font-semibold text-muted">{t('رقم الجوال', 'Mobile number')}</span>
            <div dir="ltr" className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-line bg-bg px-4 focus-within:border-emerald focus-within:bg-white">
              <span className="flex items-center gap-1.5 border-e border-line pe-3 text-sm font-semibold">{MARKET.id} {MARKET.callingCode}</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))} inputMode="tel" autoComplete="tel-national" className="w-full bg-transparent text-base font-semibold tracking-wider outline-none" />
            </div>
          </label>
          <div className="mt-auto pb-8">
            <Btn className="h-14 w-full text-base" disabled={phone.replace(/\s/g, '').length < 9} onClick={() => { setStep('otp'); toast('تم إرسال رمز تجريبي: 1234', 'Demo code sent: 1234', 'info') }}>{t('إرسال رمز التحقق', 'Send code')}</Btn>
          </div>
        </div>
      ) : (
        <div className="anim-fade-up flex flex-1 flex-col px-6 pt-6">
          <h2 className="text-2xl font-bold">{t('رمز التحقق', 'Verification code')}</h2>
          <p className="mt-2 text-sm text-muted">{t('أدخل الرمز المرسل إلى', 'Enter the code sent to')} <span dir="ltr" className="font-semibold text-ink">{formatPhone(phone)}</span></p>
          <div dir="ltr" className="relative mt-8 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cx('grid h-16 w-16 place-items-center rounded-2xl border-2 text-2xl font-bold transition', otp.length === i ? 'border-emerald bg-white' : otp[i] ? 'border-navy/10 bg-bg' : 'border-line bg-bg')}>{otp[i] ?? ''}</div>
            ))}
            <input autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoComplete="one-time-code" className="absolute inset-0 opacity-0" aria-label={t('رمز التحقق', 'Verification code')} />
          </div>
          <div className="mt-5 rounded-2xl bg-mint p-3 text-center text-xs text-emerald-d">{t('وضع تجريبي: الرمز هو 1234، لا يتم إرسال رسائل حقيقية.', 'Demo mode: the code is 1234. No real SMS is sent.')} <button onClick={() => setOtp('1234')} className="font-bold underline">{t('تعبئة تلقائية', 'Autofill')}</button></div>
          <div className="mt-4 text-center text-xs text-muted">{sec > 0 ? t(`إعادة الإرسال خلال 00:${String(sec).padStart(2, '0')}`, `Resend in 00:${String(sec).padStart(2, '0')}`) : <button onClick={() => { setSec(30); toast('تم إعادة إرسال الرمز التجريبي', 'Demo code resent', 'info') }} className="font-semibold text-emerald">{t('إعادة إرسال الرمز', 'Resend code')}</button>}</div>
          <div className="mt-auto pb-8">
            <Btn className="h-14 w-full text-base" disabled={otp.length < 4} onClick={() => { if (otp !== '1234') return toast('الرمز غير صحيح، جرّب 1234', 'Wrong code, try 1234', 'warn'); setPAuthed(true); toast('تم تسجيل الدخول بنجاح', 'Signed in successfully') }}>{t('تأكيد', 'Verify')}</Btn>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- Main (tabs + booking) ---------------- */
function Main() {
  const { t } = useLocale()
  const [tab, setTab] = useState<Tab>('home')
  const [sub, setSub] = useState<Sub>(null)
  const [stage, setStage] = useState<'home' | 'search' | 'ride' | 'confirm'>('home')
  const [pickup, setPickup] = useState<Place>(place('olaya'))
  const [dest, setDest] = useState<Place | null>(null)
  const [cat, setCat] = useState<Category>('economy')

  const chooseDest = (p: Place) => { if (p.id === pickup.id) return; setDest(p); setStage('ride') }

  if (sub) return <SubPage sub={sub} onBack={() => setSub(null)} />
  if (tab === 'home' && stage === 'search') return <SearchScreen pickup={pickup} dest={dest} setPickup={setPickup} onBack={() => setStage('home')} onDone={(p, d) => { setPickup(p); setDest(d); setStage('ride') }} />
  if (tab === 'home' && (stage === 'ride' || stage === 'confirm') && dest)
    return <RideSelect pickup={pickup} dest={dest} cat={cat} setCat={setCat} stage={stage} setStage={setStage} onBack={() => (stage === 'confirm' ? setStage('ride') : (setStage('home'), setDest(null)))} />

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden">
        {tab === 'home' && <HomeScreen pickup={pickup} onSearch={() => setStage('search')} onPick={chooseDest} openSub={setSub} />}
        {tab === 'trips' && <TripsScreen />}
        {tab === 'wallet' && <WalletScreen openSub={setSub} />}
        {tab === 'profile' && <ProfileScreen openSub={setSub} />}
      </div>
      <nav className="relative z-20 grid shrink-0 grid-cols-4 border-t border-line bg-white px-2 pb-5 pt-2 sm:pb-6">
        {([['home', Home, t('nav.home')], ['trips', History, t('nav.myTrips')], ['wallet', Wallet, t('nav.wallet')], ['profile', User, t('nav.account')]] as const).map(([id, I, l]) => (
          <button key={id} onClick={() => { setTab(id); setStage('home') }} className={cx('flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition', tab === id ? 'text-navy' : 'text-[#A0AABA]')}>
            <span className={cx('grid h-8 w-12 place-items-center rounded-full transition', tab === id && 'bg-mint text-emerald-d')}><I size={19} /></span>{l}
          </button>
        ))}
      </nav>
    </div>
  )
}

function HomeScreen({ pickup, onSearch, onPick, openSub }: { pickup: Place; onSearch: () => void; onPick: (p: Place) => void; openSub: (s: Sub) => void }) {
  const { t, drivers, notices, trips } = useStore()
  const h = new Date().getHours()
  const unread = notices.filter((n) => n.role === 'passenger' && !n.read).length
  const recent = useMemo(() => {
    const seen = new Set<string>()
    return trips.filter((x) => x.riderId === 'r1' && !seen.has(x.dest.id) && seen.add(x.dest.id)).slice(0, 3).map((x) => x.dest)
  }, [trips])
  const cars = drivers.filter((d) => d.status !== 'offline').map((d, i) => ({ id: d.id, x: d.x, y: d.y, angle: i * 70 }))
  return (
    <div className="absolute inset-0">
      <MapCanvas className="absolute inset-0 h-[62%]" pickup={pickup} cars={cars} onPick={onPick} controls focus={{ x: pickup.x, y: pickup.y - 60 }} zoom={1.25} controlsClass="end-4 top-[150px]" pulse />
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-bg via-bg/80 to-transparent pb-10">
        <StatusBar />
        <div className="flex items-center gap-3 px-5 pt-2">
          <Avatar initials={t('عش', 'AS')} size={42} tone="emerald" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-muted">{h < 12 ? t('صباح الخير', 'Good morning') : t('مساء الخير', 'Good evening')}</div>
            <div className="text-lg font-bold leading-tight">{t('عبدالله', 'Abdullah')}</div>
          </div>
          <button onClick={() => openSub('notifications')} className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm" aria-label={t('common.notifications')}>
            <Bell size={19} />{unread > 0 && <span className="absolute end-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#E25B53] px-1 text-[9px] font-bold text-white">{unread}</span>}
          </button>
        </div>
        <div className="mx-5 mt-3 flex items-center gap-2.5 rounded-2xl bg-white/90 px-3.5 py-2.5 shadow-sm backdrop-blur">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-mint"><span className="h-2.5 w-2.5 rounded-full bg-emerald" /></span>
          <div className="min-w-0"><div className="text-[10px] text-muted">{t('موقع الانطلاق', 'Pickup')}</div><div className="truncate text-[13px] font-semibold">{t(pickup.ar, pickup.en)}</div></div>
        </div>
      </div>

      <div className="no-scrollbar absolute inset-x-0 bottom-0 max-h-[52%] overflow-y-auto rounded-t-[30px] bg-white px-5 pb-5 pt-3 shadow-[0_-20px_40px_-20px_rgba(16,27,46,.25)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D9DFE7]" />
        <button onClick={onSearch} className="flex h-14 w-full items-center gap-3 rounded-2xl bg-bg px-4 text-start transition hover:bg-[#EEF2F6]">
          <Search size={20} className="text-navy" />
          <span className="flex-1 text-[15px] font-semibold text-ink">{t('وين حاب تروح اليوم؟', 'Where to today?')}</span>
          <span className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 text-[11px] font-semibold text-muted shadow-sm"><Clock3 size={12} />{t('الآن', 'Now')}</span>
        </button>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {[[Home, t('المنزل', 'Home'), place('nakheel')], [BriefcaseBusiness, t('العمل', 'Work'), place('kafd')]].map(([I, l, p]) => {
            const Ico = I as typeof Home, pl = p as Place
            return (
              <button key={l as string} onClick={() => onPick(pl)} className="flex items-center gap-2.5 rounded-2xl border border-line p-3 text-start transition hover:border-emerald/40 hover:bg-mint/30">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white"><Ico size={16} /></span>
                <div className="min-w-0"><div className="text-[13px] font-bold">{l as string}</div><div className="truncate text-[11px] text-muted">{t(pl.ar, pl.en)}</div></div>
              </button>
            )
          })}
        </div>
        <div className="mt-5 text-xs font-bold text-muted">{t('وجهات حديثة', 'Recent')}</div>
        <div className="mt-1 divide-y divide-line">
          {recent.map((p) => (
            <button key={p.id} onClick={() => onPick(p)} className="flex w-full items-center gap-3 py-3 text-start">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-bg text-muted"><Clock size={16} /></span>
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{t(p.ar, p.en)}</div><div className="truncate text-[11px] text-muted">{t(p.subAr, p.subEn)}</div></div>
              <Chevron />
            </button>
          ))}
        </div>
        <button onClick={() => openSub('coupons')} className="relative mt-3 flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-navy p-4 text-start text-white">
          <div className="absolute -end-6 -top-10 h-28 w-28 rounded-full border-[18px] border-emerald/15" />
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold"><Gift size={18} /></span>
          <div className="relative min-w-0 flex-1"><div className="text-sm font-bold">{t('خصم 15% على رحلتك القادمة', '15% off your next ride')}</div><div className="mt-0.5 text-[11px] text-white/60">{t('استخدم الكود', 'Use code')} <span className="font-mono font-bold text-gold">WELCOME15</span></div></div>
        </button>
        <p className="mt-3 text-center text-[10px] text-muted">{t('اضغط على أي موقع في الخريطة لاختياره كوجهة', 'Tap any spot on the map to set it as destination')}</p>
      </div>
    </div>
  )
}

function SearchScreen({ pickup, dest, setPickup, onBack, onDone }: { pickup: Place; dest: Place | null; setPickup: (p: Place) => void; onBack: () => void; onDone: (p: Place, d: Place) => void }) {
  const { t } = useLocale()
  const Back = useBack()
  const [field, setField] = useState<'pickup' | 'dest'>('dest')
  const [p, setP] = useState(pickup)
  const [d, setD] = useState<Place | null>(dest)
  const [q, setQ] = useState('')
  const list = PLACES.filter((x) => !q || (x.ar + x.en + x.subAr + x.subEn).toLowerCase().includes(q.toLowerCase()))
  const choose = (x: Place) => {
    if (field === 'pickup') { setP(x); setPickup(x); setField('dest'); setQ(''); if (d && d.id !== x.id) onDone(x, d) }
    else { if (x.id === p.id) return; setD(x); onDone(p, x) }
  }
  return (
    <div className="flex h-full flex-col bg-white">
      <StatusBar />
      <div className="px-5 pt-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full bg-bg" aria-label={t('common.back')}><Back size={18} /></button>
          <h2 className="text-lg font-bold">{t('إلى أين؟', 'Where to?')}</h2>
        </div>
        <div className="relative mt-4 rounded-3xl border border-line bg-bg p-2">
          <div className="absolute start-[26px] top-[34px] h-[34px] border-s-2 border-dashed border-[#C5CDD8]" />
          {(['pickup', 'dest'] as const).map((f) => (
            <label key={f} className={cx('flex h-12 items-center gap-3 rounded-2xl px-3 transition', field === f && 'bg-white shadow-sm')}>
              {f === 'pickup' ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald ring-4 ring-mint" /> : <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-navy ring-4 ring-[#E3E7EE]" />}
              <input
                onFocus={() => { setField(f); setQ('') }}
                value={field === f ? q : f === 'pickup' ? t(p.ar, p.en) : d ? t(d.ar, d.en) : ''}
                onChange={(e) => setQ(e.target.value)}
                placeholder={field === f ? (f === 'pickup' ? t(p.ar, p.en) : t('ابحث عن وجهتك', 'Search destination')) : t('ابحث عن وجهتك', 'Search destination')}
                autoFocus={f === 'dest'}
                className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:text-muted"
              />
              {f === 'dest' && (
                <button onClick={(e) => { e.preventDefault(); if (!d) return; const op = p; setP(d); setPickup(d); setD(op) }} disabled={!d} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-navy shadow-sm disabled:opacity-40" aria-label={t('تبديل الانطلاق والوجهة', 'Swap pickup and destination')}><ArrowDownUp size={15} /></button>
              )}
            </label>
          ))}
        </div>
      </div>
      <div className="no-scrollbar mt-4 flex-1 overflow-y-auto px-5 pb-6">
        <button onClick={onBack} className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-mint/60 p-3 text-start text-sm font-semibold text-emerald-d"><MapIcon size={18} />{t('اختر من الخريطة', 'Choose on map')}</button>
        <div className="pt-2 text-xs font-bold text-muted">{q ? t('نتائج البحث', 'Results') : t('أماكن مقترحة في الرياض', 'Suggested places in Riyadh')}</div>
        {list.length === 0 && <div className="py-10 text-center text-sm text-muted">{t('لا توجد نتائج مطابقة', 'No matching places')}</div>}
        <div className="divide-y divide-line">
          {list.map((x) => (
            <button key={x.id} onClick={() => choose(x)} disabled={field === 'dest' && x.id === p.id} className="flex w-full items-center gap-3 py-3.5 text-start disabled:opacity-40">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-bg text-navy"><MapPin size={17} /></span>
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{t(x.ar, x.en)}</div><div className="truncate text-[11px] text-muted">{t(x.subAr, x.subEn)}</div></div>
              <span className="text-[11px] text-muted">{t(`${distKm(p, x)} كم`, `${distKm(p, x)} km`)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function RideSelect({ pickup, dest, cat, setCat, stage, setStage, onBack }: { pickup: Place; dest: Place; cat: Category; setCat: (c: Category) => void; stage: 'ride' | 'confirm'; setStage: (s: 'ride' | 'confirm') => void; onBack: () => void }) {
  const { t, pricing, money, requestRide, validateCoupon, toast } = useStore()
  const Back = useBack()
  const route = routePts(pickup, dest)
  const [payment, setPayment] = useState<Payment>('card')
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const est = estimate(pricing, pickup, dest, cat)
  const c = applied ? validateCoupon(applied) : undefined
  const discount = c ? Math.min(c.maxOff, Math.round((est.fare * c.pct) / 100)) : 0
  const meta = CATEGORIES.find((x) => x.id === cat)!
  const mid = { x: (pickup.x + dest.x) / 2, y: (pickup.y + dest.y) / 2 + 80 }
  const span = Math.max(Math.abs(pickup.x - dest.x), Math.abs(pickup.y - dest.y))
  return (
    <div className="relative flex h-full flex-col">
      <MapCanvas className="absolute inset-0 h-[55%]" pickup={pickup} dest={dest} route={route} focus={mid} zoom={Math.max(1, Math.min(2.2, 420 / (span + 120)))} controls controlsClass="end-4 top-[90px]" />
      <div className="absolute inset-x-0 top-0"><StatusBar />
        <div className="flex items-center gap-2 px-4 pt-2">
          <button onClick={onBack} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white shadow-md" aria-label={t('common.back')}><Back size={18} /></button>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold shadow-md">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald" /><span className="truncate">{t(pickup.ar, pickup.en)}</span>
            <span className="text-muted">{t('←', '→')}</span>
            <span className="h-2 w-2 shrink-0 rounded-sm bg-navy" /><span className="truncate">{t(dest.ar, dest.en)}</span>
          </div>
        </div>
      </div>
      <div key={stage} className="anim-sheet no-scrollbar absolute inset-x-0 bottom-0 max-h-[68%] overflow-y-auto overscroll-contain rounded-t-[30px] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_40px_-20px_rgba(16,27,46,.3)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#D9DFE7]" />
        {stage === 'ride' ? (
          <>
            <div className="mb-3 flex items-end justify-between">
              <div><h3 className="text-lg font-bold">{t('اختر فئة الرحلة', 'Choose a ride')}</h3><div className="text-[11px] text-muted">{t(`${est.km} كم · قرابة ${est.mins} دقيقة`, `${est.km} km · about ${est.mins} min`)}</div></div>
              <span className="rounded-full bg-bg px-2.5 py-1 text-[10px] font-semibold text-muted">{t('أسعار تقديرية', 'Estimated fares')}</span>
            </div>
            <div className="space-y-2.5">
              {CATEGORIES.map((k) => {
                const e = estimate(pricing, pickup, dest, k.id)
                const sel = k.id === cat
                return (
                  <button key={k.id} onClick={() => setCat(k.id)} className={cx('flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-start transition', sel ? 'border-emerald bg-mint/40' : 'border-transparent bg-bg hover:bg-[#EEF2F6]')}>
                    <CarIllustration cat={k.id} className="h-11 w-[72px] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-[15px] font-bold">{t(k.ar, k.en)}</span><span className="flex items-center gap-0.5 text-[11px] text-muted"><Users size={11} />{k.seats}</span></div>
                      <div className="truncate text-[11px] text-muted">{t(k.descAr, k.descEn)}</div>
                      <div className="mt-0.5 text-[11px] font-semibold text-emerald-d">{t(`يصل خلال ${k.eta} د`, `${k.eta} min away`)} · {t(`${e.mins} د رحلة`, `${e.mins} min trip`)}</div>
                    </div>
                    <div className="text-end"><div className="text-[15px] font-bold">{money(e.fare)}</div>{sel && <Check size={16} className="ms-auto mt-1 text-emerald" />}</div>
                  </button>
                )
              })}
            </div>
            <Btn variant="dark" className="mt-4 h-14 w-full text-base" onClick={() => setStage('confirm')}>{t(`متابعة مع ${meta.ar}`, `Continue with ${meta.en}`)} · {money(est.fare)}</Btn>
          </>
        ) : (
          <>
            <h3 className="mb-3 text-lg font-bold">{t('ملخص الحجز', 'Booking summary')}</h3>
            <div className="rounded-2xl bg-bg p-4">
              <div className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald" /><div><div className="text-[10px] text-muted">{t('من', 'From')}</div><div className="text-sm font-semibold">{t(pickup.ar, pickup.en)}</div></div></div>
              <div className="ms-[4px] h-4 border-s-2 border-dashed border-[#C5CDD8]" />
              <div className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-navy" /><div><div className="text-[10px] text-muted">{t('إلى', 'To')}</div><div className="text-sm font-semibold">{t(dest.ar, dest.en)}</div></div></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-line p-3"><div className="text-[10px] text-muted">{t('الفئة', 'Category')}</div><div className="mt-0.5 text-sm font-bold">{t(meta.ar, meta.en)}</div></div>
              <div className="rounded-2xl border border-line p-3"><div className="text-[10px] text-muted">{t('وقت الوصول المتوقع', 'Est. pickup')}</div><div className="mt-0.5 text-sm font-bold">{t(`${meta.eta} دقائق`, `${meta.eta} min`)}</div></div>
            </div>
            <div className="mt-4 text-xs font-bold text-muted">{t('طريقة الدفع', 'Payment method')}</div>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              {([['card', CreditCard, t('بطاقة •••• 4021', 'Card •••• 4021')], ['cash', Banknote, t('payment.cash')]] as const).map(([id, I, l]) => (
                <button key={id} onClick={() => setPayment(id)} className={cx('flex items-center gap-2 rounded-2xl border-2 p-3 text-sm font-semibold transition', payment === id ? 'border-navy bg-navy text-white' : 'border-line')}><I size={17} />{l}</button>
              ))}
            </div>
            <div className="mt-4 text-xs font-bold text-muted">{t('كود الخصم', 'Promo code')}</div>
            {applied && c ? (
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-emerald/30 bg-mint p-3 text-sm">
                <Tag size={16} className="text-emerald" /><span className="flex-1 font-semibold text-emerald-d"><span className="font-mono">{c.code}</span> · {t(`خصم ${c.pct}%`, `${c.pct}% off`)}</span>
                <button onClick={() => { setApplied(null); setCode('') }} className="text-muted" aria-label={t('common.remove')}><X size={16} /></button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <input aria-label={t('كود الخصم', 'Promo code')} autoComplete="off" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME15" dir="ltr" className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-4 font-mono text-sm outline-none focus:border-emerald" />
                <Btn variant="soft" className="h-12" onClick={() => { if (validateCoupon(code)) { setApplied(code); toast('تم تطبيق كود الخصم', 'Promo applied') } else toast('الكود غير صالح أو منتهي', 'Invalid or expired code', 'warn') }}>{t('تطبيق', 'Apply')}</Btn>
              </div>
            )}
            <div className="mt-4 space-y-2 rounded-2xl border border-line p-4 text-sm">
              <div className="flex justify-between text-muted"><span>{t('الأجرة التقديرية', 'Estimated fare')}</span><span>{money(est.fare)}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-d"><span>{t('الخصم', 'Discount')}</span><span>- {money(discount)}</span></div>}
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>{t('الإجمالي', 'Total')}</span><span>{money(est.fare - discount)}</span></div>
            </div>
            <Btn className="mt-4 h-14 w-full text-base" disabled={submitting} onClick={() => { setSubmitting(true); if (!requestRide({ pickup, dest, category: cat, payment, coupon: c?.code })) setSubmitting(false) }}>
              {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />{t('جارٍ إرسال الطلب…', 'Sending request…')}</> : t('تأكيد طلب الرحلة', 'Confirm ride request')}
            </Btn>
            <p className="mt-2 text-center text-[10px] text-muted">{t('دفع تجريبي — لن تتم أي عملية مالية حقيقية', 'Simulated payment — no real transaction is made')}</p>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------------- Live trip flow ---------------- */
function TripFlow({ trip }: { trip: Trip }) {
  const { t, drivers, money, cancelRide, toast, pricing } = useStore()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [chat, setChat] = useState(false)
  const [safety, setSafety] = useState(false)
  const d = drivers.find((x) => x.id === trip.driverId)
  if (trip.status === 'completed') return <Completed trip={trip} />
  const cancelFee = cancellationFee(trip, pricing)
  const cancelBody = cancelFee
    ? t(`ستُحتسب رسوم إلغاء ${money(cancelFee)} ${trip.status === 'arrived' ? 'لأن الكابتن وصل إلى موقعك' : `لمرور أكثر من ${pricing.cancellation.graceMins} دقيقة على قبول الطلب`}.`, `A ${money(cancelFee)} cancellation fee applies ${trip.status === 'arrived' ? 'because the captain has arrived' : `because more than ${pricing.cancellation.graceMins} min have passed since acceptance`}.`)
    : trip.status === 'requested'
      ? t('الإلغاء مجاني قبل قبول الكابتن للطلب.', 'Cancelling is free before a captain accepts.')
      : t(`الإلغاء مجاني خلال ${pricing.cancellation.graceMins} دقيقة من قبول الطلب، ثم تُحتسب رسوم ${money(pricing.cancellation.riderAfterGrace)}.`, `Free within ${pricing.cancellation.graceMins} min of acceptance, then a ${money(pricing.cancellation.riderAfterGrace)} fee applies.`)
  const start = d ? { x: d.x, y: d.y } : { x: trip.pickup.x + 120, y: trip.pickup.y - 100 }
  const approach = routePts(start, trip.pickup)
  const route = routePts(trip.pickup, trip.dest)
  const drvPos = trip.status === 'accepted' ? pointAlong(approach, trip.approach) : trip.status === 'arrived' ? pointAlong(approach, 1) : trip.status === 'in_progress' ? pointAlong(route, trip.progress) : undefined
  const near = drivers.filter((x) => x.status === 'available').map((x, i) => ({ id: x.id, x: x.x, y: x.y, angle: i * 80 }))
  const focus = trip.status === 'in_progress' ? (drvPos as { x: number; y: number }) : trip.status === 'requested' ? trip.pickup : { x: (start.x + trip.pickup.x) / 2, y: (start.y + trip.pickup.y) / 2 + 60 }
  const eta = Math.max(1, Math.ceil((1 - trip.approach) * 6))
  const tripEta = Math.max(1, Math.ceil((1 - trip.progress) * trip.mins))
  const firstName = d ? t(d.nameAr.split(' ')[0], d.nameEn.split(' ')[0]) : ''

  return (
    <div className="relative flex h-full flex-col">
      <MapCanvas
        className="absolute inset-0 h-[60%]"
        pickup={trip.pickup} dest={trip.dest}
        route={trip.status === 'in_progress' ? route : trip.status === 'requested' ? undefined : route}
        progress={trip.status === 'in_progress' ? trip.progress : 0}
        approach={trip.status === 'accepted' ? approach : undefined}
        driver={drvPos}
        cars={trip.status === 'requested' ? near : undefined}
        pulse={trip.status === 'requested'}
        focus={{ x: focus.x, y: focus.y + 40 }}
        zoom={trip.status === 'requested' ? 1.4 : 1.3}
        controls controlsClass="end-4 top-[90px]"
      />
      <div className="absolute inset-x-0 top-0"><StatusBar />
        <div className="flex items-center justify-between gap-2 px-4 pt-2">
          <span className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold shadow-md"><span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-emerald opacity-60" /><span className="h-2 w-2 rounded-full bg-emerald" /></span>{t('رحلة مباشرة · محاكاة', 'Live trip · simulated')}</span>
          <button onClick={() => setSafety(true)} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[#2E5FB8] shadow-md"><ShieldCheck size={15} />{t('الأمان', 'Safety')}</button>
        </div>
      </div>

      <div key={trip.status} className="anim-sheet no-scrollbar absolute inset-x-0 bottom-0 max-h-[64%] overflow-y-auto overscroll-contain rounded-t-[30px] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_40px_-20px_rgba(16,27,46,.3)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D9DFE7]" />
        <RideStatusTimeline status={trip.status} />
        {trip.status === 'requested' && (
          <div className="pt-5 text-center">
            <div className="relative mx-auto grid h-20 w-20 place-items-center">
              <span className="absolute inset-0 rounded-full border-2 border-emerald/20" />
              <span className="spin-slow absolute inset-0 rounded-full border-2 border-transparent border-t-emerald" />
              <span className="grid h-12 w-12 place-items-center rounded-full bg-mint text-emerald"><Search size={20} /></span>
            </div>
            <h3 className="mt-4 text-lg font-bold">{t('جاري البحث عن كابتن قريب منك…', 'Finding a captain near you…')}</h3>
            <p className="mt-1 text-xs text-muted">{t(`${near.length} كباتن متاحون بالقرب منك · الوقت المتوقع قرابة 3 دقائق`, `${near.length} captains nearby · about 3 min`)}</p>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-bg p-3 text-start text-xs">
              <span className="font-semibold">{t(trip.dest.ar, trip.dest.en)}</span><span className="font-bold">{money(tripTotal(trip))}</span>
            </div>
            <p className="mt-3 rounded-xl bg-[#FFF8EC] p-2.5 text-[11px] text-[#9A6B2A]">{t('للعرض: افتح تطبيق الكابتن لقبول هذا الطلب', 'Demo: open the Captain app to accept this request')}</p>
            <Btn variant="danger" className="mt-4 w-full" onClick={() => setConfirmCancel(true)}>{t('إلغاء الطلب', 'Cancel request')}</Btn>
          </div>
        )}
        {d && trip.status !== 'requested' && (
          <div className="pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold leading-snug">
                  {trip.status === 'accepted' && t(`الكابتن ${firstName} في طريقه إليك`, `Captain ${firstName} is on the way`)}
                  {trip.status === 'arrived' && t(`الكابتن ${firstName} بانتظارك`, `Captain ${firstName} has arrived`)}
                  {trip.status === 'in_progress' && t(`في الطريق إلى ${trip.dest.ar}`, `Heading to ${trip.dest.en}`)}
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  {trip.status === 'accepted' && t('تابع موقع الكابتن على الخريطة', 'Track your captain on the map')}
                  {trip.status === 'arrived' && t(`توجّه إلى نقطة الالتقاء. الانتظار مجاني ${pricing.waiting.freeMins} دقائق، ثم ${money(pricing.waiting.perMin)} لكل دقيقة.`, `Head to the pickup point. ${pricing.waiting.freeMins} min free waiting, then ${money(pricing.waiting.perMin)}/min.`)}
                  {trip.status === 'in_progress' && t(`الوصول المتوقع ${fmtTime(Date.now() + tripEta * 60000)}`, `Arriving around ${fmtTime(Date.now() + tripEta * 60000)}`)}
                </p>
              </div>
              <div className="shrink-0 rounded-2xl bg-navy px-3 py-2 text-center text-white">
                <div className="text-lg font-bold leading-none">{trip.status === 'arrived' ? '0' : trip.status === 'in_progress' ? tripEta : eta}</div>
                <div className="mt-1 text-[10px] text-white/60">{t('دقيقة', 'min')}</div>
              </div>
            </div>
            {trip.status === 'in_progress' && (
              <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-emerald transition-all duration-500" style={{ width: `${trip.progress * 100}%` }} /></div>
                <div className="mt-1.5 flex justify-between text-[10px] text-muted"><span>{t(trip.pickup.ar, trip.pickup.en)}</span><span>{Math.round(trip.progress * 100)}%</span><span>{t(trip.dest.ar, trip.dest.en)}</span></div></div>
            )}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line p-3">
              <Avatar initials={t(d.initials, latinInitials(d.nameEn))} size={50} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{t(d.nameAr, d.nameEn)}</div>
                <div className="flex items-center gap-1 text-[11px] text-muted"><Star size={11} className="fill-gold text-gold" />{d.rating} · {t(d.carAr, d.carEn)}</div>
                <div className="mt-1 inline-flex rounded-md border border-navy/15 bg-bg px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider">{d.plate}</div>
              </div>
              <CarIllustration cat={trip.category} className="h-10 w-16 shrink-0" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Btn variant="outline" className="px-2 text-xs" onClick={() => setChat(true)}><MessageCircle size={16} />{t('محادثة', 'Chat')}</Btn>
              <CallBtn phone={d.phone} />
              <Btn variant="outline" className="px-2 text-xs" onClick={() => setSafety(true)}><Share2 size={16} />{t('مشاركة', 'Share')}</Btn>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-bg px-4 py-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted">{trip.payment === 'card' ? <CreditCard size={14} /> : <Banknote size={14} />}{trip.payment === 'card' ? t('payment.card') : t('payment.cash')}</span>
              <span className="font-bold">{money(tripTotal(trip))}</span>
            </div>
            {trip.status !== 'in_progress' && <button onClick={() => setConfirmCancel(true)} className="mt-3 w-full py-2 text-xs font-semibold text-[#C2413A]">{t('إلغاء الرحلة', 'Cancel trip')}</button>}
            {trip.status !== 'in_progress' && <p className="text-center text-[10px] text-muted">{t('للعرض: تابع الخطوات من تطبيق الكابتن', 'Demo: continue the steps from the Captain app')}</p>}
          </div>
        )}
      </div>
      <ConfirmationModal open={confirmCancel} onClose={() => setConfirmCancel(false)} onConfirm={cancelRide} danger title={t('إلغاء الرحلة؟', 'Cancel this trip?')} body={`${cancelBody} ${t('(قيم مبدئية للعرض)', '(provisional demo values)')}`} confirm={t('نعم، إلغاء', 'Yes, cancel')} />
      <ChatSheet open={chat} onClose={() => setChat(false)} name={d ? t(d.nameAr, d.nameEn) : ''} me="rider" />
      <Sheet open={safety} onClose={() => setSafety(false)} title={t('الأمان والدعم', 'Safety & support')}>
        <div className="space-y-2.5">
          {[[Share2, t('مشاركة تفاصيل الرحلة', 'Share trip details'), t('أرسل رابط التتبّع لمن تثق به', 'Send a tracking link to someone you trust'), t('تم نسخ رابط المشاركة التجريبي', 'Demo share link copied')], [HeadphonesIcon, t('التواصل مع الدعم', 'Contact support'), t('فريقنا متاح على مدار الساعة', 'Our team is available 24/7'), t('تم فتح محادثة دعم تجريبية', 'Demo support chat opened')], [Siren, t('الطوارئ 911', 'Emergency 911'), t('اتصال مباشر بالجهات المختصة', 'Direct call to authorities'), t('محاكاة: لم يتم إجراء اتصال حقيقي', 'Simulation: no real call placed')]].map(([I, a, b, msg], k) => {
            const Ico = I as typeof Share2
            return (
              <button key={k} onClick={() => { toast(msg as string, msg as string, 'info'); setSafety(false) }} className={cx('flex w-full items-center gap-3 rounded-2xl p-3.5 text-start', k === 2 ? 'bg-[#FDECEC]' : 'bg-bg')}>
                <span className={cx('grid h-10 w-10 place-items-center rounded-xl', k === 2 ? 'bg-[#E25B53] text-white' : 'bg-white text-navy')}><Ico size={18} /></span>
                <div><div className="text-sm font-bold">{a as string}</div><div className="text-[11px] text-muted">{b as string}</div></div>
              </button>
            )
          })}
        </div>
      </Sheet>
    </div>
  )
}


function CallBtn({ phone }: { phone: string }) {
  const { t, toast } = useStore()
  return <Btn variant="soft" className="px-2 text-xs" onClick={() => toast(`اتصال تجريبي بالرقم ${phone}`, `Demo call to ${phone}`, 'info')}><Phone size={16} />{t('اتصال', 'Call')}</Btn>
}

function Completed({ trip }: { trip: Trip }) {
  const { t, drivers, money, rate, updateTrip, lang } = useStore()
  const d = drivers.find((x) => x.id === trip.driverId)
  const [stars, setStars] = useState(trip.rating ?? 0)
  const [review, setReview] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const done = !!trip.rating
  const mins = trip.endedAt && trip.startedAt ? Math.max(trip.mins, Math.round((trip.endedAt - trip.startedAt) / 60000)) : trip.mins
  const TAGS = [t('قيادة آمنة', 'Safe driving'), t('سيارة نظيفة', 'Clean car'), t('تعامل راقٍ', 'Polite'), t('وصول سريع', 'Quick pickup')]
  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto bg-white">
      <div className="relative bg-navy px-6 pb-16 text-center text-white">
        <StatusBar light />
        <div className="anim-fade-up pt-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald shadow-[0_0_0_10px_rgba(15,175,146,.15)]"><Check size={32} strokeWidth={3} /></div>
          <h2 className="mt-5 text-2xl font-bold">{t('وصلت بالسلامة!', 'You arrived safely!')}</h2>
          <p className="mt-1 text-sm text-white/60">{t(trip.dest.ar, trip.dest.en)} · {fmtTime(trip.endedAt ?? Date.now())}</p>
        </div>
      </div>
      <div className="-mt-10 px-5 pb-8">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-xl">
          <div className="text-center"><div className="text-xs text-muted">{t('إجمالي الأجرة', 'Total fare')}</div><div className="mt-1 text-3xl font-bold">{money(tripTotal(trip))}</div></div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-line rounded-2xl bg-bg py-3 text-center rtl:divide-x-reverse">
            <div><div className="text-[10px] text-muted">{t('المدة', 'Duration')}</div><div className="text-sm font-bold">{t(`${mins} د`, `${mins} min`)}</div></div>
            <div><div className="text-[10px] text-muted">{t('المسافة', 'Distance')}</div><div className="text-sm font-bold">{t(`${trip.km} كم`, `${trip.km} km`)}</div></div>
            <div><div className="text-[10px] text-muted">{t('الدفع', 'Payment')}</div><div className="text-sm font-bold">{trip.payment === 'card' ? t('payment.card') : t('payment.cash')}</div></div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted"><span>{t('أجرة الرحلة', 'Trip fare')}</span><span>{money(trip.fare)}</span></div>
            {trip.discount > 0 && <div className="flex justify-between text-emerald-d"><span>{t('خصم', 'Discount')} {trip.coupon}</span><span>- {money(trip.discount)}</span></div>}
            {!!trip.waitFee && <div className="flex justify-between text-muted"><span>{t('رسوم الانتظار', 'Waiting fee')}</span><span>+ {money(trip.waitFee)}</span></div>}
          </div>
        </div>
        {d && (
          <div className="mt-5 text-center">
            <Avatar initials={t(d.initials, latinInitials(d.nameEn))} size={60} className="mx-auto" />
            <div className="mt-2 text-sm font-bold">{t(`كيف كانت رحلتك مع ${d.nameAr.split(' ')[0]}؟`, `How was your ride with ${d.nameEn.split(' ')[0]}?`)}</div>
            <div className="mt-3 flex justify-center"><Stars value={stars} onChange={done ? undefined : setStars} size={36} /></div>
          </div>
        )}
        {!done && stars > 0 && (
          <div className="anim-fade-up mt-4">
            <div className="flex flex-wrap justify-center gap-2">
              {TAGS.map((g) => <button key={g} onClick={() => setTags((x) => (x.includes(g) ? x.filter((y) => y !== g) : [...x, g]))} className={cx('rounded-full border px-3 py-1.5 text-xs font-semibold transition', tags.includes(g) ? 'border-emerald bg-mint text-emerald-d' : 'border-line text-muted')}>{g}</button>)}
            </div>
            <textarea aria-label={t('تعليق على الرحلة', 'Trip comment')} value={review} onChange={(e) => setReview(e.target.value)} placeholder={t('أضف تعليقًا (اختياري)', 'Add a comment (optional)')} rows={2} className="mt-3 w-full resize-none rounded-2xl border border-line bg-bg p-3 text-sm outline-none focus:border-emerald" />
          </div>
        )}
        {done ? (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-mint p-3 text-center text-sm font-semibold text-emerald-d"><Check size={17} />{t('تم حفظ تقييمك في سجل الرحلة', 'Your rating was saved to the trip record')}</div>
        ) : (
          <Btn className="mt-5 h-14 w-full text-base" disabled={!stars} onClick={() => rate(trip.id, stars, [review, ...tags].filter(Boolean).join(lang === 'ar' ? '، ' : ', '))}>{t('إرسال التقييم', 'Submit rating')}</Btn>
        )}
        <Btn variant={done ? 'dark' : 'ghost'} className="mt-2 w-full" onClick={() => updateTrip(trip.id, { pDone: true })}>{done ? t('العودة للرئيسية', 'Back to home') : t('تخطي', 'Skip')}</Btn>
      </div>
    </div>
  )
}

/* ---------------- Tabs ---------------- */
function PageHeader({ title, onBack, action }: { title: string; onBack?: () => void; action?: React.ReactNode }) {
  const { t } = useLocale()
  const Back = useBack()
  return (
    <div className="shrink-0 bg-bg"><StatusBar />
      <div className="flex items-center gap-3 px-5 pb-3 pt-2">
        {onBack && <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" aria-label={t('common.back')}><Back size={18} /></button>}
        <h2 className="flex-1 text-xl font-bold">{title}</h2>{action}
      </div>
    </div>
  )
}

function TripsScreen() {
  const { t, trips, money, lang } = useStore()
  const [f, setF] = useState<'all' | 'completed' | 'cancelled'>('all')
  const [open, setOpen] = useState<Trip | null>(null)
  const mine = trips.filter((x) => x.riderId === 'r1' && (f === 'all' || x.status === f))
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('رحلاتي', 'My trips')} />
      <div className="flex gap-2 px-5 pb-3">
        {([['all', t('الكل', 'All')], ['completed', t('مكتملة', 'Completed')], ['cancelled', t('ملغاة', 'Cancelled')]] as const).map(([id, l]) => (
          <button key={id} onClick={() => setF(id)} className={cx('rounded-full px-4 py-1.5 text-xs font-semibold transition', f === id ? 'bg-navy text-white' : 'bg-white text-muted')}>{l}</button>
        ))}
      </div>
      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-5 pb-6">
        {mine.length === 0 && <Empty icon={Route} text={t('لا توجد رحلات في هذا التصنيف', 'No trips in this filter')} />}
        {mine.map((x) => <RideCard key={x.id} trip={x} onClick={() => setOpen(x)} money={money} t={t} lang={lang} />)}
      </div>
      <TripDetailSheet trip={open} onClose={() => setOpen(null)} />
    </div>
  )
}

function TripDetailSheet({ trip, onClose }: { trip: Trip | null; onClose: () => void }) {
  const { t, drivers, money, lang, addTicket } = useStore()
  const [report, setReport] = useState(false)
  if (!trip) return null
  const d = drivers.find((x) => x.id === trip.driverId)
  return (
    <Sheet open onClose={onClose} title={t('تفاصيل الرحلة', 'Trip details')}>
      <MapCanvas className="h-36 rounded-2xl" pickup={trip.pickup} dest={trip.dest} route={routePts(trip.pickup, trip.dest)} focus={{ x: (trip.pickup.x + trip.dest.x) / 2, y: (trip.pickup.y + trip.dest.y) / 2 }} zoom={1.1} labels={false} />
      <div className="mt-3 flex items-center justify-between"><span className="font-mono text-xs text-muted" dir="ltr">{trip.id}</span><StatusBadge s={trip.status} /></div>
      <div className="mt-3 space-y-2 text-sm">
        {[[t('من', 'From'), t(trip.pickup.ar, trip.pickup.en)], [t('إلى', 'To'), t(trip.dest.ar, trip.dest.en)], [t('التاريخ', 'Date'), `${fmtDate(trip.createdAt, lang)} · ${fmtTime(trip.createdAt)}`], [t('المسافة والمدة', 'Distance · time'), t(`${trip.km} كم · ${trip.mins} د`, `${trip.km} km · ${trip.mins} min`)], [t('الكابتن', 'Captain'), d ? t(d.nameAr, d.nameEn) : '—'], [t('الدفع', 'Payment'), trip.payment === 'card' ? t('payment.card') : t('payment.cash')], [t('الإجمالي', 'Total'), money(tripTotal(trip))]].map(([a, b]) => (
          <div key={a} className="flex justify-between gap-4 border-b border-line pb-2 last:border-0"><span className="text-muted">{a}</span><span className="text-end font-semibold">{b}</span></div>
        ))}
      </div>
      {trip.rating && <div className="mt-3 rounded-2xl bg-bg p-3"><Stars value={trip.rating} size={16} />{trip.review && <p className="mt-1.5 text-xs text-muted">"{trip.review}"</p>}</div>}
      {!report ? (
        <Btn variant="outline" className="mt-4 w-full" onClick={() => setReport(true)}><ShieldAlert size={16} />{t('الإبلاغ عن مشكلة', 'Report an issue')}</Btn>
      ) : (
        <ReportForm tripId={trip.id} onDone={(c, m) => { addTicket({ catAr: c, catEn: c, msg: m, tripId: trip.id }); setReport(false); onClose() }} />
      )}
    </Sheet>
  )
}

function ReportForm({ tripId, onDone }: { tripId: string; onDone: (cat: string, msg: string) => void }) {
  const { t } = useLocale()
  const cats = [t('سلوك الكابتن', 'Captain behaviour'), t('مشكلة في الأجرة', 'Fare issue'), t('أغراض مفقودة', 'Lost item'), t('أخرى', 'Other')]
  const [c, setC] = useState(cats[0])
  const [m, setM] = useState('')
  return (
    <div className="anim-fade-up mt-4 space-y-3 rounded-2xl border border-line p-4">
      <div className="text-xs font-bold text-muted">{t('نوع المشكلة', 'Issue type')} · <span dir="ltr">{tripId}</span></div>
      <div className="flex flex-wrap gap-2">{cats.map((x) => <button key={x} onClick={() => setC(x)} className={cx('rounded-full border px-3 py-1.5 text-xs font-semibold', c === x ? 'border-navy bg-navy text-white' : 'border-line')}>{x}</button>)}</div>
      <textarea aria-label={t('وصف المشكلة', 'Issue description')} value={m} onChange={(e) => setM(e.target.value)} rows={3} placeholder={t('صف المشكلة باختصار', 'Briefly describe the issue')} className="w-full resize-none rounded-xl bg-bg p-3 text-sm outline-none" />
      <Btn className="w-full" disabled={m.trim().length < 3} onClick={() => onDone(c, m)}>{t('إرسال البلاغ', 'Submit')}</Btn>
    </div>
  )
}

function WalletScreen({ openSub }: { openSub: (s: Sub) => void }) {
  const { t, toast, money } = useStore()
  const [cards, setCards] = useState([{ id: 'c1', brand: 'mada', last: '4021', exp: '08/27' }, { id: 'c2', brand: 'VISA', last: '7788', exp: '11/26' }])
  const [def, setDef] = useState('c1')
  const [add, setAdd] = useState(false)
  const [num, setNum] = useState('')
  const [rm, setRm] = useState<string | null>(null)
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('nav.wallet')} />
      <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 pb-6">
        <div className="relative overflow-hidden rounded-3xl bg-navy p-5 text-white">
          <div className="absolute -end-10 -top-10 h-40 w-40 rounded-full bg-emerald/20 blur-2xl" />
          <div className="relative text-xs text-white/60">{t('رصيد مَشوار', 'MASHWAR balance')}</div>
          <div className="relative mt-1 text-3xl font-bold">{money(42.5)}</div>
          <div className="relative mt-4 flex gap-2"><Btn className="h-10 px-4 text-xs" onClick={() => toast('شحن تجريبي — لا توجد عملية حقيقية', 'Demo top-up — no real transaction', 'info')}><Plus size={14} />{t('شحن الرصيد', 'Top up')}</Btn><Btn variant="ghost" className="h-10 bg-white/10 px-4 text-xs text-white hover:bg-white/15" onClick={() => openSub('coupons')}><Ticket size={14} />{t('الكوبونات', 'Coupons')}</Btn></div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold">{t('طرق الدفع', 'Payment methods')}</span><button onClick={() => setAdd(true)} className="flex items-center gap-1 text-xs font-semibold text-emerald"><Plus size={14} />{t('إضافة بطاقة', 'Add card')}</button></div>
          <div className="space-y-2">
            {cards.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5">
                <span className={cx('grid h-9 w-12 place-items-center rounded-lg text-[10px] font-black', c.brand === 'mada' ? 'bg-[#E9F6FF] text-[#1066A8]' : 'bg-[#EEF0FF] text-[#1A1F71]')}>{c.brand}</span>
                <button onClick={() => { setDef(c.id); toast('تم تعيين البطاقة كافتراضية', 'Default card updated') }} className="min-w-0 flex-1 text-start"><div dir="ltr" className="text-sm font-semibold rtl:text-end">•••• {c.last}</div><div className="text-[11px] text-muted">{t('تنتهي', 'Expires')} {c.exp}</div></button>
                {def === c.id ? <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-emerald-d">{t('افتراضية', 'Default')}</span> : <button onClick={() => setRm(c.id)} className="text-muted" aria-label={t('common.remove')}><X size={16} /></button>}
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5"><span className="grid h-9 w-12 place-items-center rounded-lg bg-mint text-emerald"><Banknote size={18} /></span><div className="flex-1 text-sm font-semibold">{t('payment.cash')}</div><span className="text-[11px] text-muted">{t('متاح دائمًا', 'Always available')}</span></div>
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-bold">{t('آخر العمليات', 'Recent transactions')}</div>
          <div className="divide-y divide-line rounded-2xl bg-white px-4">
            {[[t('رحلة إلى بوليفارد الرياض', 'Ride to Boulevard'), -34], [t('استرداد رحلة ملغاة', 'Cancelled ride refund'), 18], [t('رحلة إلى المركز المالي', 'Ride to KAFD'), -22]].map(([a, b]) => (
              <div key={a as string} className="flex justify-between py-3 text-sm"><span>{a}</span><span className={cx('font-bold', (b as number) > 0 ? 'text-emerald' : '')} dir="ltr">{(b as number) > 0 ? '+' : ''}{b}</span></div>
            ))}
          </div>
        </div>
      </div>
      <Sheet open={add} onClose={() => setAdd(false)} title={t('إضافة بطاقة', 'Add card')}>
        <div className="space-y-3">
          <input aria-label={t('رقم البطاقة (تجريبي)', 'Card number (demo)')} autoComplete="off" value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, '').slice(0, 16))} dir="ltr" inputMode="numeric" placeholder="4242 4242 4242 4242" className="h-12 w-full rounded-2xl bg-bg px-4 font-mono outline-none" />
          <div className="grid grid-cols-2 gap-2"><input aria-label={t('تاريخ الانتهاء', 'Expiry date')} autoComplete="off" inputMode="numeric" dir="ltr" placeholder="MM/YY" className="h-12 rounded-2xl bg-bg px-4 outline-none" /><input aria-label="CVV" autoComplete="off" inputMode="numeric" dir="ltr" placeholder="CVV" className="h-12 rounded-2xl bg-bg px-4 outline-none" /></div>
          <p className="text-[11px] text-muted">{t('بيانات تجريبية فقط — لا يتم حفظ أو معالجة بيانات بطاقات حقيقية.', 'Demo only — no real card data is stored or processed.')}</p>
          <Btn className="w-full" disabled={num.length < 12} onClick={() => { setCards((c) => [...c, { id: 'c' + Date.now(), brand: 'VISA', last: num.slice(-4), exp: '12/28' }]); setAdd(false); setNum(''); toast('تمت إضافة البطاقة', 'Card added') }}>{t('حفظ البطاقة', 'Save card')}</Btn>
        </div>
      </Sheet>
      <ConfirmationModal open={!!rm} onClose={() => setRm(null)} onConfirm={() => { setCards((c) => c.filter((x) => x.id !== rm)); toast('تم حذف البطاقة', 'Card removed', 'info') }} danger title={t('حذف البطاقة؟', 'Remove card?')} body={t('يمكنك إضافتها مجددًا في أي وقت.', 'You can add it again anytime.')} confirm={t('حذف', 'Remove')} />
    </div>
  )
}

function ProfileScreen({ openSub }: { openSub: (s: Sub) => void }) {
  const { t, setPAuthed, riders, lang } = useStore()
  const me = riders[0]
  const items: [Sub, typeof Home, string][] = [
    ['addresses', MapPin, t('العناوين المحفوظة', 'Saved addresses')], ['coupons', Ticket, t('الكوبونات', 'Coupons')], ['notifications', Bell, t('common.notifications')],
    ['ratings', Star, t('سجل التقييمات', 'Rating history')], ['support', HeadphonesIcon, t('الدعم والشكاوى', 'Support & complaints')], ['language', Globe, t('اللغة', 'Language')],
  ]
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t('nav.account')} />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        <div className="flex items-center gap-4 rounded-3xl bg-white p-4">
          <Avatar initials={t('عش', 'AS')} size={60} tone="emerald" />
          <div className="flex-1"><div className="text-base font-bold">{t(me.nameAr, me.nameEn)}</div><div className="text-xs text-muted" dir="ltr">{me.phone}</div></div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[[me.rides, t('رحلة', 'Trips')], [me.rating, t('تقييمك', 'Rating')], [t('ذهبي', 'Gold'), t('العضوية', 'Tier')]].map(([a, b]) => (
            <div key={b as string} className="rounded-2xl bg-white py-3"><div className="text-base font-bold">{a}</div><div className="text-[10px] text-muted">{b}</div></div>
          ))}
        </div>
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-3xl bg-white">
          {items.map(([id, I, l]) => (
            <button key={id} onClick={() => openSub(id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-start hover:bg-bg">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-bg text-navy"><I size={17} /></span><span className="flex-1 text-sm font-semibold">{l}</span>
              {id === 'language' && <span className="text-xs text-muted">{lang === 'ar' ? 'العربية' : 'English'}</span>}<Chevron />
            </button>
          ))}
        </div>
        <button onClick={() => setPAuthed(false)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-semibold text-[#C2413A]"><LogOut size={16} />{t('تسجيل الخروج', 'Log out')}</button>
      </div>
    </div>
  )
}

function SubPage({ sub, onBack }: { sub: Exclude<Sub, null>; onBack: () => void }) {
  const { t, notices, markRead, lang, setLang, trips, coupons, toast, tickets, addTicket } = useStore()
  const [addrs, setAddrs] = useState([{ id: 'h', ic: Home, ar: 'المنزل', en: 'Home', p: place('nakheel') }, { id: 'w', ic: BriefcaseBusiness, ar: 'العمل', en: 'Work', p: place('kafd') }, { id: 'g', ic: Star, ar: 'النادي', en: 'Gym', p: place('park') }])
  const [newAddr, setNewAddr] = useState(false)
  const [support, setSupport] = useState(false)
  useEffect(() => { if (sub === 'notifications') return () => markRead('passenger') }, [sub])
  const titles = { addresses: t('العناوين المحفوظة', 'Saved addresses'), notifications: t('common.notifications'), support: t('الدعم والشكاوى', 'Support'), language: t('اللغة', 'Language'), ratings: t('سجل التقييمات', 'Rating history'), coupons: t('الكوبونات', 'Coupons') }
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={titles[sub]} onBack={onBack} />
      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-5 pb-6">
        {sub === 'notifications' && notices.filter((n) => n.role === 'passenger').map((n) => (
          <div key={n.id} className="flex gap-3 rounded-2xl bg-white p-4">
            <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', n.read ? 'bg-bg text-muted' : 'bg-mint text-emerald')}><Bell size={16} /></span>
            <div className="flex-1"><div className="text-sm font-semibold leading-6">{t(n.ar, n.en)}</div><div className="text-[11px] text-muted">{timeAgo(t, n.at)}</div></div>
            {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-emerald" />}
          </div>
        ))}
        {sub === 'addresses' && (
          <>
            {addrs.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-white p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-white"><a.ic size={17} /></span>
                <div className="flex-1"><div className="text-sm font-bold">{t(a.ar, a.en)}</div><div className="text-xs text-muted">{t(a.p.ar, a.p.en)}</div></div>
                <button onClick={() => { setAddrs((x) => x.filter((y) => y.id !== a.id)); toast('تم حذف العنوان', 'Address removed', 'info') }} className="text-muted" aria-label={t('common.remove')}><X size={16} /></button>
              </div>
            ))}
            {newAddr ? (
              <div className="anim-fade-up rounded-2xl bg-white p-3">
                <div className="mb-2 text-xs font-bold text-muted">{t('اختر موقعًا', 'Choose a place')}</div>
                {PLACES.filter((p) => !addrs.some((a) => a.p.id === p.id)).map((p) => (
                  <button key={p.id} onClick={() => { setAddrs((x) => [...x, { id: p.id, ic: MapPin, ar: p.subAr, en: p.subEn, p }]); setNewAddr(false); toast('تم حفظ العنوان', 'Address saved') }} className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-start text-sm hover:bg-bg"><MapPin size={15} className="text-muted" />{t(p.ar, p.en)}</button>
                ))}
              </div>
            ) : (
              <Btn variant="outline" className="w-full border-dashed" onClick={() => setNewAddr(true)}><Plus size={16} />{t('إضافة عنوان', 'Add address')}</Btn>
            )}
          </>
        )}
        {sub === 'language' && (['ar', 'en'] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)} className={cx('flex w-full items-center justify-between rounded-2xl border-2 bg-white p-4 text-start', lang === l ? 'border-emerald' : 'border-transparent')}>
            <div><div className="text-sm font-bold">{l === 'ar' ? 'العربية' : 'English'}</div><div className="text-xs text-muted">{l === 'ar' ? 'من اليمين إلى اليسار' : 'Left to right'}</div></div>
            {lang === l && <Check className="text-emerald" size={20} />}
          </button>
        ))}
        {sub === 'ratings' && trips.filter((x) => x.riderId === 'r1' && x.rating).map((x) => (
          <div key={x.id} className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between"><span className="text-sm font-bold">{t(x.dest.ar, x.dest.en)}</span><Stars value={x.rating!} size={14} /></div>
            {x.review && <p className="mt-1.5 text-xs text-muted">"{x.review}"</p>}
            <div className="mt-1 text-[11px] text-muted">{fmtDate(x.createdAt, lang)}</div>
          </div>
        ))}
        {sub === 'coupons' && coupons.map((c) => (
          <div key={c.code} className={cx('relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-4', !c.active && 'opacity-50')}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-base font-bold text-[#9A6B2A]">{c.pct}%</span>
            <div className="flex-1"><div className="font-mono text-sm font-bold">{c.code}</div><div className="text-xs text-muted">{t(c.descAr, c.descEn)}</div></div>
            {c.active ? <button onClick={() => { navigator.clipboard?.writeText(c.code).catch(() => {}); toast(`تم نسخ ${c.code}`, `${c.code} copied`) }} className="flex items-center gap-1 rounded-xl bg-mint px-3 py-2 text-xs font-semibold text-emerald-d"><Copy size={13} />{t('نسخ', 'Copy')}</button> : <span className="text-[11px] text-muted">{t('منتهي', 'Expired')}</span>}
          </div>
        ))}
        {sub === 'support' && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {[[MessageCircle, t('محادثة مباشرة', 'Live chat')], [Phone, t('اتصل بنا', 'Call us')]].map(([I, l]) => {
                const Ico = I as typeof Phone
                return <button key={l as string} onClick={() => toast('محاكاة: تم فتح قناة الدعم', 'Simulation: support channel opened', 'info')} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-sm font-semibold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-emerald"><Ico size={18} /></span>{l as string}</button>
              })}
            </div>
            <Btn variant="dark" className="w-full" onClick={() => setSupport(true)}><ShieldAlert size={16} />{t('تقديم شكوى جديدة', 'New complaint')}</Btn>
            {support && <ReportForm tripId={trips.find((x) => x.riderId === 'r1')?.id ?? ''} onDone={(c, m) => { addTicket({ catAr: c, catEn: c, msg: m, tripId: trips.find((x) => x.riderId === 'r1')?.id ?? '' }); setSupport(false) }} />}
            <div className="pt-2 text-xs font-bold text-muted">{t('بلاغاتي', 'My tickets')}</div>
            {tickets.filter((x) => x.riderId === 'r1').length === 0 && <Empty icon={HeadphonesIcon} text={t('لا توجد بلاغات حتى الآن', 'No tickets yet')} />}
            {tickets.filter((x) => x.riderId === 'r1').map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm"><div><div className="font-semibold">{t(k.catAr, k.catEn)}</div><div className="font-mono text-[11px] text-muted">{k.id}</div></div><span className={cx('rounded-full px-2.5 py-1 text-[11px] font-semibold', k.status === 'resolved' ? 'bg-mint text-emerald-d' : 'bg-[#FFF5E6] text-[#A86A12]')}>{k.status === 'resolved' ? t('تم الحل', 'Resolved') : k.status === 'review' ? t('قيد المراجعة', 'In review') : t('مفتوحة', 'Open')}</span></div>
            ))}
            {[t('كيف أسترد مبلغ رحلة ملغاة؟', 'How do I get a refund?'), t('كيف أغيّر طريقة الدفع؟', 'How to change payment?')].map((q) => <FAQ key={q} q={q} />)}
          </>
        )}
      </div>
    </div>
  )
}

function FAQ({ q }: { q: string }) {
  const { t } = useLocale()
  const [o, setO] = useState(false)
  return (
    <button onClick={() => setO(!o)} className="w-full rounded-2xl bg-white p-4 text-start">
      <div className="flex items-center justify-between text-sm font-semibold">{q}<ChevronDown size={14} className={cx('text-muted transition', o && 'rotate-180')} /></div>
      {o && <p className="anim-fade mt-2 text-xs leading-6 text-muted">{t('يمكنك ذلك من صفحة تفاصيل الرحلة أو من المحفظة، وتتم المعالجة خلال 3 أيام عمل.', 'You can do this from the trip details or wallet; processing takes up to 3 business days.')}</p>}
    </button>
  )
}
