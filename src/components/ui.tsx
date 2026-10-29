import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, Star, X, Check } from 'lucide-react'
import { useStore, type Status, type Category } from '../store'
import { useLocale } from '../i18n/locale'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')
/** 'Khalid Alotaibi' → 'KA'. Arabic initials are stored on the record. */
export const latinInitials = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

export function Logo({ light, size = 'md' }: { light?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const { t } = useLocale()
  const box = size === 'lg' ? 'h-14 w-14 rounded-2xl' : size === 'sm' ? 'h-8 w-8 rounded-[10px]' : 'h-10 w-10 rounded-xl'
  return (
    <div className="flex items-center gap-2.5">
      <div className={cx('relative grid place-items-center bg-navy shadow-[0_6px_18px_-6px_rgba(16,27,46,.6)]', box, light && 'bg-white')}>
        <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]">
          <path d="M6 24 C6 12, 13 8, 16 16 C19 24, 26 20, 26 8" fill="none" stroke="#0FAF92" strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="26" cy="8" r="3" fill="#D7A867" />
          <circle cx="6" cy="24" r="2.4" fill={light ? '#101B2E' : '#fff'} />
        </svg>
      </div>
      <div className="leading-none" translate="no">
        <div className={cx('font-bold tracking-tight', size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-[15px]' : 'text-lg', light ? 'text-white' : 'text-navy')}>{t('مَشوار', 'MASHWAR')}</div>
        {size !== 'sm' && <div className={cx('mt-1 text-[10px] font-medium tracking-[.2em]', light ? 'text-white/50' : 'text-muted')}>{t('MASHWAR', 'مَشوار')}</div>}
      </div>
    </div>
  )
}

export function Btn({ children, variant = 'primary', className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'dark' | 'ghost' | 'soft' | 'danger' | 'outline' }) {
  const v = {
    primary: 'bg-emerald text-white hover:bg-emerald-d shadow-[0_10px_24px_-10px_rgba(15,175,146,.7)]',
    dark: 'bg-navy text-white hover:bg-navy-2 shadow-[0_10px_24px_-12px_rgba(16,27,46,.7)]',
    ghost: 'text-ink hover:bg-black/5',
    soft: 'bg-mint text-emerald-d hover:bg-[#d6f2e8]',
    danger: 'bg-[#FDECEC] text-[#C2413A] hover:bg-[#fbdcdc]',
    outline: 'border border-line bg-white text-ink hover:border-[#cfd6e0]',
  }[variant]
  return (
    <button {...p} className={cx('inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition active:scale-[.98] disabled:opacity-50', v, className)}>
      {children}
    </button>
  )
}

export function Card({ children, className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx('rounded-3xl border border-line bg-white shadow-[0_1px_2px_rgba(16,27,46,.04),0_12px_32px_-18px_rgba(16,27,46,.18)]', className)}>{children}</div>
}

export function Avatar({ initials, size = 44, tone = 'navy', className }: { initials: string; size?: number; tone?: 'navy' | 'emerald' | 'gold'; className?: string }) {
  const bg = { navy: 'linear-gradient(135deg,#22324F,#101B2E)', emerald: 'linear-gradient(135deg,#26C7A9,#0B8F77)', gold: 'linear-gradient(135deg,#E6C38F,#B98A47)' }[tone]
  return (
    <div className={cx('grid shrink-0 place-items-center rounded-full font-semibold text-white ring-2 ring-white', className)} style={{ width: size, height: size, background: bg, fontSize: size * 0.34 }}>
      {initials}
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx('relative h-7 w-12 shrink-0 rounded-full transition', on ? 'bg-emerald' : 'bg-[#CBD3DE]')}>
      <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'start-6' : 'start-1')} />
    </button>
  )
}

export function Segmented<T extends string>({ value, onChange, options, dark, className }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; dark?: boolean; className?: string }) {
  return (
    <div className={cx('inline-flex rounded-2xl p-1', dark ? 'bg-white/5' : 'bg-[#EEF1F5]', className)}>
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} aria-pressed={value === o.id} className={cx('flex-1 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition', value === o.id ? (dark ? 'bg-white text-navy' : 'bg-white text-navy shadow-sm') : dark ? 'text-white/60' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stars({ value, onChange, size = 30 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  const { t } = useLocale()
  if (!onChange)
    return (
      <div className="flex gap-1.5" dir="ltr" role="img" aria-label={t(`التقييم ${value} من 5`, `Rated ${value} out of 5`)}>
        {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} aria-hidden className={n <= value ? 'fill-gold text-gold' : 'text-[#D5DBE4]'} strokeWidth={1.5} />)}
      </div>
    )
  return (
    <div className="flex gap-1.5" dir="ltr" role="group" aria-label={t('اختر التقييم', 'Choose a rating')}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-pressed={n === value} aria-label={t(`${n} من 5 نجوم`, `${n} out of 5 stars`)} className="transition hover:scale-110">
          <Star size={size} className={n <= value ? 'fill-gold text-gold' : 'text-[#D5DBE4]'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}

export const STATUS_META: Record<Status, { cls: string; dot: string }> = {
  requested: { cls: 'bg-[#FFF5E6] text-[#A86A12]', dot: 'bg-[#E3A13A]' },
  accepted: { cls: 'bg-[#FBF3E6] text-[#9A6B2A]', dot: 'bg-gold' },
  arrived: { cls: 'bg-[#EAF2FF] text-[#2E5FB8]', dot: 'bg-[#3B82F6]' },
  in_progress: { cls: 'bg-[#EAF2FF] text-[#2E5FB8]', dot: 'bg-[#3B82F6]' },
  completed: { cls: 'bg-mint text-emerald-d', dot: 'bg-emerald' },
  cancelled: { cls: 'bg-[#FDECEC] text-[#C2413A]', dot: 'bg-[#E25B53]' },
}
export function StatusBadge({ s }: { s: Status }) {
  const { t } = useLocale()
  const m = STATUS_META[s]
  return <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold', m.cls)}><span className={cx('h-1.5 w-1.5 rounded-full', m.dot)} />{t(`status.${s}`)}</span>
}
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold', className)}>{children}</span>
}

const STEPS: Exclude<Status, 'cancelled'>[] = ['requested', 'accepted', 'arrived', 'in_progress', 'completed']
export function RideStatusTimeline({ status, dark, vertical }: { status: Status; dark?: boolean; vertical?: boolean }) {
  const { t } = useLocale()
  const idx = STEPS.findIndex((x) => x === status)
  if (vertical)
    return (
      <ol className="space-y-0">
        {STEPS.map((st, i) => (
          <li key={st} className="relative flex gap-3 pb-5 last:pb-0">
            {i < STEPS.length - 1 && <span className={cx('absolute start-[11px] top-6 h-[calc(100%-20px)] w-0.5', i < idx ? 'bg-emerald' : dark ? 'bg-white/10' : 'bg-line')} />}
            <span className={cx('relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold transition', i < idx ? 'bg-emerald text-white' : i === idx ? 'bg-navy text-white ring-4 ring-emerald/25' : dark ? 'bg-white/10 text-white/40' : 'bg-[#EEF1F5] text-muted')}>
              {i < idx || (i === idx && status === 'completed') ? <Check size={13} /> : i + 1}
            </span>
            <span className={cx('pt-0.5 text-sm', i <= idx ? (dark ? 'font-semibold text-white' : 'font-semibold text-ink') : dark ? 'text-white/40' : 'text-muted')}>{t(`step.${st}`)}</span>
          </li>
        ))}
      </ol>
    )
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((st, i) => (
        <div key={st} className={cx('h-1.5 flex-1 rounded-full transition-all duration-500', i <= idx ? 'bg-emerald' : dark ? 'bg-white/10' : 'bg-[#E5EAF0]')} />
      ))}
    </div>
  )
}

export function Modal({ open, onClose, children, title, width = 'max-w-md', label }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; width?: string; label?: string }) {
  const { t } = useLocale()
  const id = useId()
  const ref = useDialog(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="anim-fade absolute inset-0 bg-navy/50 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={title ? id : undefined} aria-label={title ? undefined : label} tabIndex={-1} className={cx('anim-fade-up no-scrollbar relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto overscroll-contain rounded-3xl bg-white p-6 shadow-2xl outline-none', width)}>
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 id={id} className="text-lg font-bold text-ink">{title}</h3>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5" aria-label={t('common.close')}><X size={18} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function ConfirmationModal({ open, onClose, onConfirm, title, body, confirm, danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: string; confirm: string; danger?: boolean }) {
  const { t } = useLocale()
  return (
    <Modal open={open} onClose={onClose} width="max-w-sm" label={title}>
      <div className={cx('mb-4 grid h-12 w-12 place-items-center rounded-2xl', danger ? 'bg-[#FDECEC] text-[#C2413A]' : 'bg-mint text-emerald')}>{danger ? <AlertTriangle /> : <CheckCircle2 />}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted">{body}</p>
      <div className="mt-6 flex gap-2">
        <Btn variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={() => { onConfirm(); onClose() }}>{confirm}</Btn>
        <Btn variant="outline" className="flex-1" onClick={onClose}>{t('common.cancel')}</Btn>
      </div>
    </Modal>
  )
}

export function Drawer({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title: string }) {
  const { dir, t } = useLocale()
  const ref = useDialog(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="anim-fade absolute inset-0 bg-navy/40" onClick={onClose} />
      <aside ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="anim-side thin-scroll absolute inset-y-0 end-0 flex w-full max-w-[440px] flex-col overflow-y-auto bg-white shadow-2xl outline-none" style={{ ['--from' as string]: dir === 'rtl' ? '-100%' : '100%' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5" aria-label={t('common.close')}><X size={18} /></button>
        </div>
        <div className="flex-1 p-6">{children}</div>
      </aside>
    </div>
  )
}

/** Bottom sheet scoped to its positioned parent (phone frame). */
export function Sheet({ open, onClose, children, title, dark }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; dark?: boolean }) {
  const { t } = useLocale()
  const ref = useDialog(open, onClose)
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40">
      <div className="anim-fade absolute inset-0 bg-navy/45" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={cx('anim-sheet outline-none no-scrollbar absolute inset-x-0 bottom-0 max-h-[90%] overflow-y-auto overscroll-contain rounded-t-[28px] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3', dark ? 'bg-navy-2 text-white' : 'bg-white')}>
        <div className={cx('mx-auto mb-4 h-1 w-10 rounded-full', dark ? 'bg-white/20' : 'bg-[#D9DFE7]')} />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">{title}</h3>
            <button onClick={onClose} className={cx('grid h-8 w-8 place-items-center rounded-full', dark ? 'bg-white/10' : 'bg-[#F1F4F8]')} aria-label={t('common.close')}><X size={16} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

/** Esc closes; focus moves into the dialog on open and returns to the trigger on close. */
function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const h = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    window.addEventListener('keydown', h)
    return () => { window.removeEventListener('keydown', h); prev?.focus?.() }
  }, [open])
  return ref
}

export function Toasts() {
  const { toasts, t } = useStore()
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((x) => (
        <div key={x.id} className="anim-fade-up flex items-center gap-3 rounded-2xl bg-navy px-4 py-3 text-sm font-medium text-white shadow-2xl">
          {x.tone === 'success' ? <CheckCircle2 size={18} className="text-emerald" /> : x.tone === 'warn' ? <AlertTriangle size={18} className="text-gold" /> : <Info size={18} className="text-[#7CC4FF]" />}
          {t(x.ar, x.en)}
        </div>
      ))}
    </div>
  )
}

export function PhoneFrame({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className="relative mx-auto w-full sm:w-auto">
      <div className={cx('relative h-[calc(100dvh-56px)] w-full overflow-hidden sm:h-[min(844px,calc(100dvh-120px))] sm:min-h-[640px] sm:w-[390px] sm:rounded-[54px] sm:border-[11px] sm:border-[#0A111D] sm:shadow-[0_50px_100px_-30px_rgba(16,27,46,.55),0_0_0_1px_rgba(255,255,255,.06)_inset]', dark ? 'bg-navy' : 'bg-bg')}>
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-[60] hidden h-[30px] w-[108px] -translate-x-1/2 rounded-full bg-black sm:block" />
        {children}
      </div>
    </div>
  )
}

export function StatusBar({ light }: { light?: boolean }) {
  return (
    <div dir="ltr" className={cx('hidden h-11 shrink-0 items-end justify-between px-8 pb-1 text-[13px] font-semibold sm:flex', light ? 'text-white' : 'text-ink')}>
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" /><rect x="23" y="4" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".4" /></svg>
      </span>
    </div>
  )
}

const CAT_STYLE: Record<Category, { body: string; len: number; tall: number }> = { economy: { body: '#E8ECF1', len: 0, tall: 0 }, comfort: { body: '#101B2E', len: 6, tall: 0 }, family: { body: '#0FAF92', len: 8, tall: 6 } }
export function CarIllustration({ cat, className }: { cat: Category; className?: string }) {
  const s = CAT_STYLE[cat]
  return (
    <svg viewBox="0 0 120 56" className={className}>
      <ellipse cx="60" cy="49" rx="50" ry="4" fill="#101B2E" opacity=".12" />
      <path d={`M${10 - s.len / 2},40 L${12 - s.len / 2},30 C14,26 22,24 30,23 L${40 - s.tall},${14 - s.tall} C44,11 50,10 58,10 L${76 + s.len},10 C84,10 88,${12 - s.tall / 3} 92,${17} L98,24 C106,25 110,28 ${111 + s.len / 2},34 L${111 + s.len / 2},40 Z`} fill={s.body} stroke="#101B2E" strokeOpacity=".12" />
      <path d={`M${44 - s.tall},${16 - s.tall / 2} C47,13 51,13 57,13 L${74 + s.len / 2},13 L${74 + s.len / 2},23 L38,23 Z`} fill="#BFD4E6" opacity=".9" />
      <path d={`M${78 + s.len / 2},13 C84,13 87,15 90,19 L93,23 L${78 + s.len / 2},23 Z`} fill="#BFD4E6" opacity=".9" />
      <rect x="104" y="29" width="6" height="3" rx="1.5" fill="#D7A867" />
      {[30, 90 + s.len / 2].map((x) => (
        <g key={x}><circle cx={x} cy="40" r="8" fill="#182335" /><circle cx={x} cy="40" r="3.5" fill="#CBD3DE" /></g>
      ))}
    </svg>
  )
}
