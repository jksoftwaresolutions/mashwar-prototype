import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { formatMoney, type Lang } from '../config/market'
import { messages, type MsgKey } from './messages'

/** `t('payment.card')` looks up the shared dictionary; `t(ar, en)` picks an inline pair. */
export type Translate = { (key: MsgKey): string; (ar: string, en: string): string }

export interface Locale {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translate
  dir: 'rtl' | 'ltr'
  money: (n: number) => string
}

const LocaleCtx = createContext<Locale>(null as unknown as Locale)

/**
 * Language, direction and formatting. Kept apart from the ride store so components that only
 * translate (the design-system primitives) do not re-render on every simulation tick.
 */
export const useLocale = () => useContext(LocaleCtx)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar')
  const t = useCallback(((a: string, e?: string) => (e === undefined ? messages[a as MsgKey][lang] : lang === 'ar' ? a : e)) as Translate, [lang])
  const money = useCallback((n: number) => formatMoney(n, lang), [lang])
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = lang
  }, [lang, dir])

  const value = useMemo(() => ({ lang, setLang, t, dir, money }) as Locale, [lang, t, dir, money])
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>
}
