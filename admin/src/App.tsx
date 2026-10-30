import { useEffect, useState } from 'react'
import { fetchHealth, API_BASE, type Health } from './api'
import { SECTIONS, visibleSections, type Permission } from './navigation'

type Lang = 'ar' | 'en'

// Phase 1 shell: no sign-in yet. Staff authentication (SSO or password + MFA) and real permissions
// come from the backend in Phase 3; until then the shell previews every section.
const PREVIEW_PERMISSIONS = new Set<Permission>(SECTIONS.flatMap((s) => s.anyOf))

export default function App() {
  const [lang, setLang] = useState<Lang>('ar')
  const [active, setActive] = useState(SECTIONS[0].id)
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const sections = visibleSections(PREVIEW_PERMISSIONS)
  const current = sections.find((s) => s.id === active) ?? sections[0]

  return (
    <div className="flex min-h-dvh bg-bg text-ink">
      <aside className="hidden w-64 shrink-0 bg-navy text-white lg:block">
        <div className="px-5 py-5 text-lg font-bold" translate="no">{t('مَشوار', 'MASHWAR')}</div>
        <nav aria-label={t('أقسام الإدارة', 'Admin sections')} className="space-y-0.5 px-3">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              aria-current={s.id === current.id ? 'page' : undefined}
              className={`w-full rounded-xl px-3 py-2.5 text-start text-sm ${s.id === current.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'}`}
            >
              {t(s.ar, s.en)}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-6">
          <span className="rounded-full bg-[#FFF5E6] px-3 py-1 text-xs font-semibold text-[#A86A12]">
            {t('هيكل المرحلة الأولى: بدون تسجيل دخول أو بيانات حقيقية', 'Phase 1 shell: no sign-in, no live data')}
          </span>
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="rounded-xl border border-line px-3 py-1.5 text-sm">
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </header>
        <main className="p-6">
          <h1 className="text-2xl font-bold text-navy">{t(current.ar, current.en)}</h1>
          <p className="mt-2 max-w-prose text-sm text-muted">
            {t('يُبنى هذا القسم في المرحلة الثالثة على واجهات الخادم. التصميم المعتمد موجود في النموذج التفاعلي.', 'This section is built in Phase 3 on the backend API. The approved design is in the interactive prototype.')}
          </p>
          <BackendStatus t={t} />
        </main>
      </div>
    </div>
  )
}

function BackendStatus({ t }: { t: (ar: string, en: string) => string }) {
  const [state, setState] = useState<Health | 'error' | 'loading'>('loading')
  useEffect(() => {
    const ctrl = new AbortController()
    fetchHealth(ctrl.signal).then(setState, () => !ctrl.signal.aborted && setState('error'))
    return () => ctrl.abort()
  }, [])
  const label =
    state === 'loading' ? t('جارٍ الفحص…', 'Checking…')
      : state === 'error' ? t('الخادم غير متاح', 'Backend unreachable')
        : state.database === 'up' ? t('الخادم وقاعدة البيانات يعملان', 'Backend and database up')
          : t('الخادم يعمل وقاعدة البيانات متوقفة', 'Backend up, database down')
  return (
    <section aria-live="polite" className="mt-6 max-w-md rounded-2xl border border-line bg-white p-4">
      <div className="text-xs text-muted" dir="ltr">{API_BASE}/v1/health</div>
      <div className="mt-1 font-semibold">{label}</div>
    </section>
  )
}
