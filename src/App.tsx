import { lazy, Suspense, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BarChart3, Car, ChevronDown, FastForward, Home, SkipForward, Sparkles } from 'lucide-react'
import { StoreProvider, tripTotal, useStore, type Role } from './store'
import { useLocale } from './i18n/locale'
import { LocaleProvider } from './i18n/locale'
import { RoleProvider, useRole } from './role'
import { LangSwitch, ResetButton, RoleSwitcher } from './components/shell'
import { Btn, Logo, PhoneFrame, RideStatusTimeline, StatusBadge, Toasts, cx } from './components/ui'
import Showcase from './Showcase'

// Each experience is its own chunk; Recharts only loads with the captain app or the admin dashboard.
const loadPassenger = () => import('./Passenger')
const loadDriver = () => import('./Driver')
const loadAdmin = () => import('./Admin')
const PassengerApp = lazy(loadPassenger)
const DriverApp = lazy(loadDriver)
const AdminApp = lazy(loadAdmin)
/** Warm the chunks after first paint so switching roles mid-demo never waits on the network. */
const preloadApps = () => { loadPassenger(); loadDriver(); loadAdmin() }

export default function App() {
  return (
    <LocaleProvider>
      <RoleProvider>
        <StoreProvider>
          <Shell />
          <Toasts />
        </StoreProvider>
      </RoleProvider>
    </LocaleProvider>
  )
}

function Loading({ dark }: { dark?: boolean }) {
  const { t } = useLocale()
  return (
    <div role="status" className={cx('grid h-full min-h-[50dvh] w-full place-items-center', dark ? 'bg-navy text-white/60' : 'text-muted')}>
      <span className="flex items-center gap-2 text-sm"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />{t('common.loading')}</span>
    </div>
  )
}

function Shell() {
  const { role } = useRole()
  useEffect(() => { const id = setTimeout(preloadApps, 1200); return () => clearTimeout(id) }, [])
  if (role === 'showcase') return <Showcase />
  if (role === 'admin') return <Suspense fallback={<Loading />}><AdminApp /></Suspense>
  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(1200px_600px_at_50%_-10%,#E3EEF4,transparent),#F2F5F9]">
      <TopBar />
      <div className="mx-auto flex max-w-[1280px] items-start justify-center gap-10 sm:px-6 sm:py-6">
        <div className="hidden w-[300px] shrink-0 xl:block"><StoryPanel /></div>
        <PhoneFrame dark={role === 'driver'}><Suspense fallback={<Loading dark={role === 'driver'} />}>{role === 'passenger' ? <PassengerApp /> : <DriverApp />}</Suspense></PhoneFrame>
        <div className="hidden w-[300px] shrink-0 lg:block"><DemoPanel /></div>
      </div>
    </div>
  )
}

function TopBar() {
  const { t, dir } = useLocale()
  const { setRole } = useRole()
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-line/70 bg-white/75 px-3 backdrop-blur-xl sm:h-16 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => setRole('showcase')} className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold text-muted hover:bg-black/5 hover:text-ink" title={t('العودة للعرض', 'Back to showcase')}>
          <Back size={15} /><span className="hidden md:inline">{t('العرض', 'Showcase')}</span>
        </button>
        <div className="hidden sm:block"><Logo size="sm" /></div>
      </div>
      <RoleSwitcher compact />
      <div className="flex items-center gap-1.5"><LangSwitch /><ResetButton /></div>
    </header>
  )
}

function StoryPanel() {
  const { t } = useLocale()
  const { role } = useRole()
  const p = role === 'passenger'
  const points = p
    ? [[t('حجز في ثلاث خطوات', 'Book in three taps'), t('اختر الوجهة، الفئة، ثم أكّد الطلب.', 'Pick destination, category, confirm.')], [t('تتبّع مباشر', 'Live tracking'), t('موقع الكابتن ومراحل الرحلة بوضوح.', 'Clear captain location and trip stages.')], [t('دفع وكوبونات', 'Payments & coupons'), t('جرّب كود WELCOME15 عند التأكيد.', 'Try code WELCOME15 at checkout.')]]
    : [[t('قرار سريع', 'Fast decisions'), t('بطاقة طلب واضحة مع الأرباح والمسافة.', 'Clear request card with earnings & distance.')], [t('تنقّل موجّه', 'Guided navigation'), t('من موقع الراكب حتى الوجهة.', 'From pickup to destination.')], [t('أرباح شفافة', 'Transparent earnings'), t('ملخص يومي وأسبوعي وشهري.', 'Daily, weekly and monthly summary.')]]
  return (
    <div className="sticky top-24 space-y-5 pt-6">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-[11px] font-bold text-emerald-d"><Sparkles size={12} />{t('نموذج تفاعلي', 'Interactive prototype')}</span>
      <h2 className="text-[28px] font-bold leading-tight text-navy">{p ? t('تجربة الراكب', 'Rider experience') : t('تجربة الكابتن', 'Captain experience')}</h2>
      <p className="text-sm leading-7 text-muted">{p ? t('رحلة حجز سلسة صُممت لتكون واضحة وسريعة ومطمئنة من أول لمسة.', 'A booking flow designed to be clear, fast and reassuring from the first tap.') : t('أدوات عملية تساعد الكابتن على استقبال الطلبات وإنجاز الرحلات بكفاءة.', 'Practical tools that help captains receive requests and complete trips efficiently.')}</p>
      <div className="space-y-3">
        {points.map(([a, b], i) => (
          <div key={i} className="flex gap-3 rounded-2xl border border-line bg-white/70 p-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-navy text-xs font-bold text-white">{i + 1}</span>
            <div><div className="text-sm font-semibold">{a}</div><div className="mt-0.5 text-xs leading-5 text-muted">{b}</div></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DemoPanel() {
  const { live, t, advance, fastForward, setRole, role, money } = useStore()
  const [open, setOpen] = useState(true)
  const hint = !live
    ? t('ابدأ بطلب رحلة من تطبيق الراكب.', 'Start by requesting a ride in the Rider app.')
    : live.status === 'requested'
      ? t('الطلب ظاهر الآن في تطبيق الكابتن، انتقل لقبوله.', 'The request is now visible in the Captain app — switch to accept.')
      : live.status === 'accepted'
        ? t('الكابتن في الطريق. من تطبيق الكابتن اضغط "وصلت لموقع الراكب".', 'Captain en route. In the Captain app tap "Arrived".')
        : live.status === 'arrived'
          ? t('ابدأ الرحلة من تطبيق الكابتن.', 'Start the trip from the Captain app.')
          : live.status === 'in_progress'
            ? t('الرحلة جارية. أنهِها من تطبيق الكابتن.', 'Trip in progress. End it from the Captain app.')
            : live.status === 'completed'
              ? t('قيّم الرحلة من تطبيق الراكب، ثم شاهدها في لوحة الإدارة.', 'Rate the trip as rider, then view it in Admin.')
              : t('تم إلغاء الرحلة.', 'Trip cancelled.')
  const target: Role | null = !live ? 'passenger' : ['requested', 'accepted', 'arrived', 'in_progress'].includes(live.status) ? 'driver' : live.status === 'completed' ? (live.rating ? 'admin' : 'passenger') : null
  return (
    <div className="sticky top-24 pt-6">
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_20px_50px_-30px_rgba(16,27,46,.35)]">
        <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-4">
          <span className="text-sm font-bold">{t('لوحة العرض التجريبي', 'Demo control')}</span>
          <ChevronDown size={16} className={cx('text-muted transition', !open && 'rotate-180')} />
        </button>
        {open && (
          <div className="space-y-4 border-t border-line px-5 py-5">
            {live ? (
              <>
                <div className="flex items-center justify-between"><span data-testid="live-trip-id" className="font-mono text-xs text-muted" dir="ltr">{live.id}</span><StatusBadge s={live.status} /></div>
                <div className="text-xs text-muted">{t(live.pickup.ar, live.pickup.en)} {t('←', '→')} {t(live.dest.ar, live.dest.en)} · {money(tripTotal(live))}</div>
                {live.status !== 'cancelled' && <RideStatusTimeline status={live.status} vertical />}
              </>
            ) : (
              <div className="rounded-2xl bg-bg p-4 text-center text-xs text-muted">{t('لا توجد رحلة تجريبية نشطة', 'No active demo trip')}</div>
            )}
            <p className="rounded-2xl bg-mint/70 p-3 text-xs leading-5 text-emerald-d">{hint}</p>
            {target && target !== role && (
              <Btn variant="dark" className="w-full" onClick={() => setRole(target)}>
                {target === 'driver' ? <Car size={16} /> : target === 'admin' ? <BarChart3 size={16} /> : <Home size={16} />}
                {target === 'driver' ? t('الانتقال لتطبيق الكابتن', 'Go to Captain app') : target === 'admin' ? t('عرض في لوحة الإدارة', 'View in Admin') : t('الانتقال لتطبيق الراكب', 'Go to Rider app')}
              </Btn>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="outline" className="px-2 text-xs" disabled={!live || ['completed', 'cancelled'].includes(live.status)} onClick={advance}><SkipForward size={14} />{t('الخطوة التالية', 'Next step')}</Btn>
              <Btn variant="outline" className="px-2 text-xs" disabled={!!live && ['completed', 'cancelled'].includes(live.status)} onClick={fastForward}><FastForward size={14} />{t('إنهاء سريع', 'Fast finish')}</Btn>
            </div>
            <ResetButton />
          </div>
        )}
      </div>
      <p className="mt-3 px-2 text-[11px] leading-5 text-muted">{t('جميع البيانات والأسعار والمواقع تجريبية لأغراض العرض فقط.', 'All data, prices and locations are simulated for demonstration only.')}</p>
    </div>
  )
}
