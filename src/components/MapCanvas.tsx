import { useMemo, useState, type ReactNode } from 'react'
import { LocateFixed, Minus, Plus } from 'lucide-react'
import { PLACES, useStore, type Place } from '../store'

export type Pt = { x: number; y: number }
const W = 800, H = 640

export function routePts(a: Pt, b: Pt): Pt[] {
  const midY = a.y + (b.y - a.y) * 0.5
  return [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b]
}
export function pointAlong(pts: Pt[], t: number) {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y))
  const total = segs.reduce((s, v) => s + v, 0) || 1
  let d = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const a = pts[i], b = pts[i + 1], k = segs[i] ? Math.min(1, d / segs[i]) : 0
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90 }
    }
    d -= segs[i]
  }
  return { ...pts[pts.length - 1], angle: 0 }
}
const path = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
function partial(pts: Pt[], t: number) {
  const end = pointAlong(pts, t)
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y))
  const total = segs.reduce((s, v) => s + v, 0)
  let d = t * total
  const out: Pt[] = [pts[0]]
  for (let i = 0; i < segs.length; i++) { if (d > segs[i]) { out.push(pts[i + 1]); d -= segs[i] } else break }
  out.push(end)
  return out
}

const MAJOR: { d: string; hw?: boolean; ar: string; en: string; lx: number; ly: number; rot: number }[] = [
  { d: 'M440,-10 C445,160 432,330 448,650', hw: true, ar: 'طريق الملك فهد', en: 'King Fahd Rd', lx: 452, ly: 600, rot: 88 },
  { d: 'M-10,170 C200,160 380,182 560,168 S760,150 810,160', hw: true, ar: 'الدائري الشمالي', en: 'Northern Ring Rd', lx: 610, ly: 156, rot: -2 },
  { d: 'M-10,290 C260,298 540,282 810,292', ar: 'طريق الملك عبدالله', en: 'King Abdullah Rd', lx: 640, ly: 280, rot: 0 },
  { d: 'M200,360 C420,368 600,352 810,362', ar: 'طريق الإمام سعود', en: 'Imam Saud Rd', lx: 660, ly: 352, rot: 0 },
  { d: 'M-10,575 C260,560 520,585 810,570', hw: true, ar: 'طريق مكة', en: 'Makkah Rd', lx: 120, ly: 560, rot: -2 },
  { d: 'M700,-10 C690,200 720,420 705,650', hw: true, ar: 'الدائري الشرقي', en: 'Eastern Ring Rd', lx: 718, ly: 470, rot: 90 },
  { d: 'M140,650 C180,420 220,220 300,-10', ar: 'طريق الأمير تركي', en: 'Prince Turki Rd', lx: 160, ly: 470, rot: -76 },
  { d: 'M-10,92 C300,84 560,98 810,88', ar: 'طريق أنس بن مالك', en: 'Anas Bin Malik Rd', lx: 350, ly: 80, rot: 0 },
  { d: 'M360,650 C370,460 352,300 372,-10', ar: 'شارع العليا', en: 'Olaya St', lx: 352, ly: 470, rot: -88 },
]
const HOODS = [
  { ar: 'الملقا', en: 'AL MALQA', x: 250, y: 130 }, { ar: 'الياسمين', en: 'AL YASMIN', x: 600, y: 125 }, { ar: 'الصحافة', en: 'AL SAHAFA', x: 520, y: 225 },
  { ar: 'النخيل', en: 'AL NAKHEEL', x: 270, y: 240 }, { ar: 'العليا', en: 'AL OLAYA', x: 400, y: 470 }, { ar: 'السليمانية', en: 'SULAYMANIYAH', x: 570, y: 500 },
  { ar: 'حطين', en: 'HITTIN', x: 110, y: 300 }, { ar: 'الورود', en: 'AL WUROOD', x: 560, y: 420 }, { ar: 'الملز', en: 'AL MALAZ', x: 630, y: 610 },
]

export interface MapCar { id: string; x: number; y: number; angle?: number; status?: 'available' | 'enroute' | 'ontrip' | 'offline' }
const STATUS_COLOR = { available: '#0FAF92', enroute: '#D7A867', ontrip: '#3B82F6', offline: '#94A3B8' }

export default function MapCanvas(props: {
  pickup?: Pt; dest?: Pt; route?: Pt[]; progress?: number; approach?: Pt[]; approachProgress?: number; driver?: { x: number; y: number; angle: number }
  cars?: MapCar[]; onPick?: (p: Place) => void; dark?: boolean; controls?: boolean; focus?: Pt; zoom?: number; className?: string; controlsClass?: string
  selectedCar?: string; onCar?: (id: string) => void; extraRoutes?: { pts: Pt[]; color: string; active?: boolean }[]; pulse?: boolean; children?: ReactNode; labels?: boolean
}) {
  const { t } = useStore()
  const [z, setZ] = useState(props.zoom ?? 1)
  const [center, setCenter] = useState<Pt | null>(null)
  const f = center ?? props.focus ?? { x: W / 2, y: H / 2 }
  const vw = W / z, vh = H / z
  const vb = `${Math.max(-60, Math.min(W - vw + 60, f.x - vw / 2))} ${Math.max(-60, Math.min(H - vh + 60, f.y - vh / 2))} ${vw} ${vh}`
  const d = !!props.dark
  const c = d
    ? { bg: '#0D1828', block: '#122036', minor: '#18263D', major: '#22344F', hw: '#2C4266', edge: '#0A1322', text: '#5D6F8C', road: '#4E6280', park: '#10291F', water: '#10233B' }
    : { bg: '#EDF1F5', block: '#E5EAF0', minor: '#FFFFFF', major: '#FFFFFF', hw: '#F7E9CF', edge: '#D9E0E8', text: '#93A0B2', road: '#A3AEBD', park: '#DDEFE5', water: '#D6E6F3' }
  const grid = useMemo(() => {
    const out: string[] = []
    for (let x = 20; x < W; x += 46) out.push(`M${x},0 L${x + 8},${H}`)
    for (let y = 20; y < H; y += 42) out.push(`M0,${y} L${W},${y + 6}`)
    return out.join(' ')
  }, [])
  const drv = props.driver

  return (
    // Only default to `relative` when the caller did not position the map; otherwise `relative`
    // wins over `absolute inset-0` in the generated CSS and the map collapses to zero height.
    <div className={'overflow-hidden ' + (/\b(absolute|fixed)\b/.test(props.className ?? '') ? '' : 'relative ') + (props.className ?? '')} style={{ background: c.bg }}>
      <svg viewBox={vb} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <rect x={-100} y={-100} width={W + 200} height={H + 200} fill={c.bg} />
        <path d="M60,-20 C20,120 110,220 70,330 C30,440 100,520 60,660" stroke={c.park} strokeWidth={38} fill="none" strokeLinecap="round" />
        <path d="M60,-20 C20,120 110,220 70,330 C30,440 100,520 60,660" stroke={c.water} strokeWidth={8} fill="none" />
        {[[480, 395, 60, 36], [300, 200, 48, 30], [590, 520, 70, 40], [200, 430, 50, 54], [540, 30, 80, 34]].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx={8} fill={c.park} />
        ))}
        <path d={grid} stroke={c.minor} strokeWidth={4} fill="none" opacity={d ? 0.8 : 1} />
        {MAJOR.map((r, i) => (
          <g key={i}>
            <path d={r.d} stroke={c.edge} strokeWidth={r.hw ? 17 : 13} fill="none" strokeLinecap="round" />
            <path d={r.d} stroke={r.hw ? c.hw : c.major} strokeWidth={r.hw ? 13 : 9} fill="none" strokeLinecap="round" />
          </g>
        ))}
        {props.labels !== false && MAJOR.map((r, i) => (
          <text key={i} x={r.lx} y={r.ly} fill={c.road} fontSize={9} fontWeight={500} transform={`rotate(${r.rot} ${r.lx} ${r.ly})`} textAnchor="middle">{t(r.ar, r.en)}</text>
        ))}
        {props.labels !== false && HOODS.map((h) => (
          <text key={h.en} x={h.x} y={h.y} fill={c.text} fontSize={t('15', '11')} fontWeight={600} letterSpacing={t('0', '2')} textAnchor="middle" opacity={0.9}>{t(h.ar, h.en)}</text>
        ))}

        {props.onPick && PLACES.map((p) => (
          <g key={p.id} onClick={() => props.onPick!(p)} className="cursor-pointer" style={{ pointerEvents: 'all' }}>
            <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={5} fill={d ? '#2C4266' : '#fff'} stroke={d ? '#5D6F8C' : '#101B2E'} strokeWidth={2} />
          </g>
        ))}

        {props.extraRoutes?.map((r, i) => (
          <path key={i} d={path(r.pts)} stroke={r.color} strokeWidth={r.active ? 6 : 3} fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={r.active ? 1 : 0.45} />
        ))}
        {props.approach && (
          <path d={path(props.approach)} stroke="#D7A867" strokeWidth={4} fill="none" strokeLinejoin="round" className="route-dash" />
        )}
        {props.route && (
          <>
            <path d={path(props.route)} stroke="#0FAF92" strokeWidth={18} fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={d ? 0.12 : 0.1} />
            <path d={path(props.route)} stroke={d ? '#0b1322' : '#fff'} strokeWidth={10} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <path d={path(props.route)} stroke={d ? '#1d6f60' : '#101B2E'} strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={props.progress ? 0.35 : 1} />
            {!!props.progress && <path d={path(partial(props.route, props.progress))} stroke="#0FAF92" strokeWidth={5.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
          </>
        )}

        {props.cars?.map((car) => (
          <g key={car.id} onClick={() => props.onCar?.(car.id)} className={props.onCar ? 'cursor-pointer' : ''}>
            {props.selectedCar === car.id && <circle cx={car.x} cy={car.y} r={20} fill={STATUS_COLOR[car.status ?? 'available']} opacity={0.18} />}
            <CarTop x={car.x} y={car.y} angle={car.angle ?? 0} ring={car.status ? STATUS_COLOR[car.status] : undefined} dark={d} />
          </g>
        ))}

        {props.pickup && (
          <g>
            {props.pulse && <circle cx={props.pickup.x} cy={props.pickup.y} r={18} fill="#0FAF92" className="ping-soft" />}
            {props.pulse && <circle cx={props.pickup.x} cy={props.pickup.y} r={18} fill="#0FAF92" className="ping-soft" style={{ animationDelay: '1.1s' }} />}
            <circle cx={props.pickup.x} cy={props.pickup.y} r={16} fill="#0FAF92" opacity={0.16} />
            <circle cx={props.pickup.x} cy={props.pickup.y} r={8} fill="#fff" />
            <circle cx={props.pickup.x} cy={props.pickup.y} r={5.5} fill="#0FAF92" />
          </g>
        )}
        {props.dest && (
          <g transform={`translate(${props.dest.x} ${props.dest.y})`}>
            <circle r={13} fill={d ? '#D7A867' : '#101B2E'} opacity={0.12} />
            <ellipse cx={0} cy={2} rx={7} ry={2.5} fill="#000" opacity={0.15} />
            <path d="M0,0 C-3,-8 -11,-13 -11,-22 A11,11 0 1 1 11,-22 C11,-13 3,-8 0,0Z" fill={d ? '#D7A867' : '#101B2E'} />
            <rect x={-4} y={-26} width={8} height={8} rx={2} fill="#fff" />
          </g>
        )}
        {drv && (
          <g className="car-move" style={{ transform: `translate(${drv.x}px, ${drv.y}px)` }}>
            <circle r={20} fill="#0FAF92" opacity={0.15} />
            <CarTop x={0} y={0} angle={drv.angle} ring="#0FAF92" big dark={d} />
          </g>
        )}
      </svg>
      {props.children}
      {props.controls && (
        <div className={'absolute flex flex-col gap-2 ' + (props.controlsClass ?? 'end-3 top-1/3')}>
          <div className={'flex flex-col overflow-hidden rounded-xl shadow-lg ' + (d ? 'bg-navy-2 text-white' : 'bg-white text-ink')}>
            <button aria-label="zoom in" onClick={() => setZ((v) => Math.min(2.6, v + 0.35))} className="grid h-9 w-9 place-items-center hover:bg-black/5"><Plus size={16} /></button>
            <div className={d ? 'h-px bg-white/10' : 'h-px bg-line'} />
            <button aria-label="zoom out" onClick={() => setZ((v) => Math.max(0.8, v - 0.35))} className="grid h-9 w-9 place-items-center hover:bg-black/5"><Minus size={16} /></button>
          </div>
          <button aria-label="locate" onClick={() => { setCenter(null); setZ(props.zoom ?? 1) }} className={'grid h-9 w-9 place-items-center rounded-xl shadow-lg ' + (d ? 'bg-navy-2 text-emerald' : 'bg-white text-emerald')}><LocateFixed size={16} /></button>
        </div>
      )}
    </div>
  )
}

function CarTop({ x, y, angle, ring, big, dark }: { x: number; y: number; angle: number; ring?: string; big?: boolean; dark?: boolean }) {
  const s = big ? 1.25 : 1
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
      <rect x={-7.5} y={-12} width={15} height={24} rx={5} fill="#000" opacity={0.18} transform="translate(1.5 2)" />
      <rect x={-7} y={-12} width={14} height={24} rx={5} fill={dark ? '#E8EDF3' : '#101B2E'} stroke={ring ?? '#fff'} strokeWidth={1.6} />
      <rect x={-5} y={-7} width={10} height={5} rx={1.5} fill={dark ? '#101B2E' : '#9fe5d6'} opacity={0.9} />
      <rect x={-5} y={4} width={10} height={4} rx={1.5} fill={dark ? '#101B2E' : '#9fe5d6'} opacity={0.6} />
    </g>
  )
}
