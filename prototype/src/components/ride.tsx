import { useState } from 'react'
import { Send, Star, type LucideIcon } from 'lucide-react'
import { fmtDate, fmtTime, tripTotal, useStore, type Trip } from '../store'
import { Sheet, StatusBadge, cx } from './ui'

/** Ride-related building blocks shared by the rider and captain apps. */
export function RideCard({ trip, onClick, money, t, lang, dark }: { trip: Trip; onClick: () => void; money: (n: number) => string; t: (a: string, e: string) => string; lang: 'ar' | 'en'; dark?: boolean }) {
  return (
    <button onClick={onClick} className={cx('w-full rounded-2xl p-4 text-start transition', dark ? 'bg-white/5 hover:bg-white/10' : 'bg-white shadow-[0_1px_2px_rgba(16,27,46,.05)] hover:shadow-md')}>
      <div className="flex items-center justify-between">
        <span className={cx('text-[11px]', dark ? 'text-white/50' : 'text-muted')}>{fmtDate(trip.createdAt, lang)} · {fmtTime(trip.createdAt)}</span>
        <StatusBadge s={trip.status} />
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        <div className="flex flex-col items-center gap-0.5"><span className="h-2 w-2 rounded-full bg-emerald" /><span className={cx('h-4 w-px', dark ? 'bg-white/20' : 'bg-line')} /><span className={cx('h-2 w-2 rounded-sm', dark ? 'bg-white' : 'bg-navy')} /></div>
        <div className="min-w-0 flex-1 space-y-1.5 text-[13px] font-semibold"><div className="truncate">{t(trip.pickup.ar, trip.pickup.en)}</div><div className="truncate">{t(trip.dest.ar, trip.dest.en)}</div></div>
        <div className="text-end"><div className="text-sm font-bold">{money(tripTotal(trip))}</div>{trip.rating ? <div className="mt-1 flex items-center justify-end gap-0.5 text-[11px] text-gold"><Star size={11} className="fill-gold" />{trip.rating}</div> : null}</div>
      </div>
    </button>
  )
}

export function ChatSheet({ open, onClose, name, me, dark }: { open: boolean; onClose: () => void; name: string; me: 'rider' | 'driver'; dark?: boolean }) {
  const { t, chat, sendChat } = useStore()
  const [txt, setTxt] = useState('')
  const quick = me === 'rider' ? [t('أنا عند المدخل الرئيسي', "I'm at the main entrance"), t('دقيقتين وأكون عندك', 'Two minutes away'), t('شكرًا لك', 'Thank you')] : [t('وصلت، بانتظارك', "I've arrived, waiting"), t('أنا في الطريق', "I'm on my way"), t('أين موقعك بالضبط؟', 'Where exactly are you?')]
  const send = (s: string) => {
    if (!s.trim()) return
    sendChat(me, s); setTxt('')
    setTimeout(() => sendChat(me === 'rider' ? 'driver' : 'rider', me === 'rider' ? t('تمام، وصلت قريب منك', 'Got it, almost there') : t('تمام، أنا جاي الآن', 'OK, coming now')), 1400)
  }
  return (
    <Sheet open={open} onClose={onClose} title={name} dark={dark}>
      <div className="no-scrollbar flex max-h-[260px] min-h-[160px] flex-col gap-2 overflow-y-auto">
        {chat.length === 0 && <div className={cx('m-auto text-xs', dark ? 'text-white/40' : 'text-muted')}>{t('ابدأ المحادثة — الرسائل تجريبية', 'Start chatting — demo messages')}</div>}
        {chat.map((m, i) => (
          <div key={i} className={cx('max-w-[78%] rounded-2xl px-3.5 py-2 text-sm', m.from === me ? 'self-start bg-emerald text-white' : dark ? 'self-end bg-white/10' : 'self-end bg-bg')}>{m.text}</div>
        ))}
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {quick.map((q) => <button key={q} onClick={() => send(q)} className={cx('shrink-0 rounded-full border px-3 py-1.5 text-xs', dark ? 'border-white/15' : 'border-line')}>{q}</button>)}
      </div>
      <div className="mt-3 flex gap-2">
        <input aria-label={t('رسالة', 'Message')} value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(txt)} placeholder={t('اكتب رسالة…', 'Type a message…')} className={cx('h-12 flex-1 rounded-2xl px-4 text-sm outline-none', dark ? 'bg-white/10 placeholder:text-white/40' : 'bg-bg')} />
        <button onClick={() => send(txt)} className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald text-white" aria-label={t('إرسال', 'Send')}><Send size={18} className="rtl:-scale-x-100" /></button>
      </div>
    </Sheet>
  )
}

export function Empty({ icon: I, text }: { icon: LucideIcon; text: string }) {
  return <div className="flex flex-col items-center gap-3 py-14 text-center text-sm text-muted"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-white"><I size={22} /></span>{text}</div>
}
