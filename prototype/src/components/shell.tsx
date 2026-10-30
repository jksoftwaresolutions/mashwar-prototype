import { useState } from 'react'
import { Car, Languages, LayoutDashboard, RotateCcw, Smartphone } from 'lucide-react'
import { useStore, type Role } from '../store'
import { useRole } from '../role'
import { useLocale } from '../i18n/locale'
import { ConfirmationModal, cx } from './ui'

/** Prototype chrome shared by the shell, the admin header and the showcase. */
export function RoleSwitcher({ dark, compact }: { dark?: boolean; compact?: boolean }) {
  const { t } = useLocale()
  const { role, setRole } = useRole()
  const items: { id: Role; ar: string; en: string; icon: typeof Car }[] = [
    { id: 'passenger', ar: 'الراكب', en: 'Rider', icon: Smartphone },
    { id: 'driver', ar: 'الكابتن', en: 'Captain', icon: Car },
    { id: 'admin', ar: 'الإدارة', en: 'Admin', icon: LayoutDashboard },
  ]
  return (
    <div role="group" aria-label={t('shell.switchExperience')} className={cx('inline-flex rounded-2xl p-1', dark ? 'bg-white/10' : 'border border-line bg-white shadow-sm')}>
      {items.map((i) => (
        <button key={i.id} onClick={() => setRole(i.id)} aria-pressed={role === i.id} title={t(i.ar, i.en)} className={cx('flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition sm:px-3.5', role === i.id ? 'bg-navy text-white shadow' : dark ? 'text-white/70 hover:text-white' : 'text-muted hover:bg-bg hover:text-ink')}>
          <i.icon size={14} />
          <span className={compact ? 'hidden sm:inline' : ''}>{t(i.ar, i.en)}</span>
        </button>
      ))}
    </div>
  )
}

export function LangSwitch({ dark }: { dark?: boolean }) {
  const { lang, setLang } = useLocale()
  return (
    <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} lang={lang === 'ar' ? 'en' : 'ar'} aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'} className={cx('flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition', dark ? 'bg-white/10 text-white hover:bg-white/15' : 'border border-line bg-white text-ink hover:border-[#cfd6e0]')}>
      <Languages size={15} />{lang === 'ar' ? 'English' : 'العربية'}
    </button>
  )
}

export function ResetButton({ dark, label = true }: { dark?: boolean; label?: boolean }) {
  const { reset, t } = useStore()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} title={t('shell.restartDemo')} aria-label={t('shell.restartDemo')} className={cx('flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition', dark ? 'bg-white/10 text-white hover:bg-white/15' : 'border border-line bg-white text-ink hover:border-[#cfd6e0]')}>
        <RotateCcw size={15} />{label && <span className="hidden md:inline">{t('shell.restartDemo')}</span>}
      </button>
      <ConfirmationModal open={open} onClose={() => setOpen(false)} onConfirm={reset} title={t('إعادة تشغيل التجربة؟', 'Restart the demo?')} body={t('ستعود جميع البيانات التجريبية إلى حالتها الأولى وتُحذف الرحلة الحالية.', 'All demo data returns to its initial state and the current trip is cleared.')} confirm={t('إعادة التشغيل', 'Restart')} danger />
    </>
  )
}
