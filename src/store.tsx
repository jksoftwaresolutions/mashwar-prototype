import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { MARKET, cancellationFee, formatMoney, waitingFee, type Lang, type Category, type PricingConfig, type VehicleCategory } from './config/market'
export type { Lang, Category } from './config/market'
import { messages, type MsgKey } from './i18n/messages'
/** `t('payment.card')` looks up the shared dictionary; `t(ar, en)` picks an inline pair. */
export type Translate = { (key: MsgKey): string; (ar: string, en: string): string }
export type Role = 'showcase' | 'passenger' | 'driver' | 'admin'
export type Status = 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'
export type Payment = 'cash' | 'card'

export const BRAND = { ar: 'مَشوار', en: 'MASHWAR', taglineAr: 'مشوارك أسهل، رحلتك أذكى', taglineEn: 'Easier rides, smarter journeys' }

export interface Place { id: string; ar: string; en: string; subAr: string; subEn: string; x: number; y: number }

export const PLACES: Place[] = [
  { id: 'olaya', ar: 'العليا، شارع التحلية', en: 'Al Olaya, Tahlia St', subAr: 'حي العليا', subEn: 'Al Olaya', x: 420, y: 430 },
  { id: 'kafd', ar: 'مركز الملك عبدالله المالي', en: 'King Abdullah Financial District', subAr: 'طريق الملك فهد', subEn: 'King Fahd Rd', x: 455, y: 250 },
  { id: 'park', ar: 'الرياض بارك', en: 'Riyadh Park', subAr: 'طريق الملك فهد، العقيق', subEn: 'King Fahd Rd, Al Aqiq', x: 300, y: 200 },
  { id: 'boulevard', ar: 'بوليفارد الرياض', en: 'Boulevard Riyadh City', subAr: 'حطين، طريق الأمير تركي', subEn: 'Hittin, Prince Turki Rd', x: 190, y: 330 },
  { id: 'malqa', ar: 'الملقا', en: 'Al Malqa', subAr: 'شمال الرياض', subEn: 'North Riyadh', x: 270, y: 110 },
  { id: 'nakheel', ar: 'النخيل', en: 'Al Nakheel', subAr: 'طريق الإمام سعود', subEn: 'Imam Saud Rd', x: 280, y: 330 },
  { id: 'sahafa', ar: 'الصحافة', en: 'Al Sahafa', subAr: 'طريق أنس بن مالك', subEn: 'Anas Bin Malik Rd', x: 470, y: 130 },
  { id: 'yasmin', ar: 'الياسمين', en: 'Al Yasmin', subAr: 'شمال شرق الرياض', subEn: 'North-east Riyadh', x: 600, y: 120 },
  { id: 'sulaimaniyah', ar: 'السليمانية', en: 'As Sulaymaniyah', subAr: 'طريق الأمير محمد بن عبدالعزيز', subEn: 'Prince Mohammed bin Abdulaziz Rd', x: 520, y: 540 },
  { id: 'airport', ar: 'مطار الملك خالد الدولي', en: 'King Khalid Intl. Airport', subAr: 'صالة 5', subEn: 'Terminal 5', x: 690, y: 60 },
]
export const place = (id: string) => PLACES.find((p) => p.id === id)!

export const CATEGORIES: VehicleCategory[] = MARKET.vehicleCategories
export const category = (id: Category) => CATEGORIES.find((c) => c.id === id)!

export type Pricing = PricingConfig

export interface Driver {
  id: string; nameAr: string; nameEn: string; phone: string; rating: number; carAr: string; carEn: string; plate: string; color: string; category: Category
  rides: number; status: 'available' | 'enroute' | 'ontrip' | 'offline'; approval: 'approved' | 'pending' | 'suspended'; x: number; y: number; joined: string; initials: string
}
export interface Rider { id: string; nameAr: string; nameEn: string; phone: string; rides: number; rating: number; spent: number; joined: string; status: 'active' | 'blocked' }
export interface Trip {
  id: string; riderId: string; driverId?: string; pickup: Place; dest: Place; category: Category; fare: number; discount: number; payment: Payment
  status: Status; createdAt: number; km: number; mins: number; rating?: number; review?: string; approach: number; progress: number
  startedAt?: number; endedAt?: number; acceptedAt?: number; waitFee?: number; cancelFee?: number; live?: boolean; rejected?: boolean; pDone?: boolean; dDone?: boolean; coupon?: string; arrivedAt?: number; settled?: boolean
}
export interface Coupon { code: string; pct: number; maxOff: number; uses: number; limit: number; expires: string; active: boolean; descAr: string; descEn: string }
export interface Ticket { id: string; riderId: string; tripId: string; catAr: string; catEn: string; priority: 'high' | 'medium' | 'low'; status: 'open' | 'review' | 'resolved'; msgAr: string; msgEn: string; createdAt: number }
export interface Notice { id: number; role: 'passenger' | 'driver' | 'admin'; ar: string; en: string; at: number; read: boolean }
export interface Toast { id: number; ar: string; en: string; tone: 'success' | 'info' | 'warn' }
export interface ChatMsg { from: 'rider' | 'driver'; text: string; at: number }

export const DRIVERS_SEED: Driver[] = [
  { id: 'd1', nameAr: 'خالد العتيبي', nameEn: 'Khalid Alotaibi', phone: '+966 55 482 1173', rating: 4.92, carAr: 'تويوتا كامري 2024 · أبيض لؤلؤي', carEn: 'Toyota Camry 2024 · Pearl White', plate: 'ر س ك 4821', color: '#F1F3F6', category: 'comfort', rides: 2184, status: 'available', approval: 'approved', x: 560, y: 330, joined: '2022-03-14', initials: 'خع' },
  { id: 'd2', nameAr: 'فهد القحطاني', nameEn: 'Fahad Alqahtani', phone: '+966 50 731 0042', rating: 4.88, carAr: 'هيونداي سوناتا 2023 · رمادي', carEn: 'Hyundai Sonata 2023 · Grey', plate: 'أ ب د 7310', color: '#9AA3AF', category: 'economy', rides: 1652, status: 'ontrip', approval: 'approved', x: 330, y: 260, joined: '2022-08-02', initials: 'فق' },
  { id: 'd3', nameAr: 'سلطان الدوسري', nameEn: 'Sultan Aldosari', phone: '+966 54 118 9265', rating: 4.95, carAr: 'جي إم سي يوكن 2023 · أسود', carEn: 'GMC Yukon 2023 · Black', plate: 'ح ط ع 1189', color: '#1F2937', category: 'family', rides: 1320, status: 'enroute', approval: 'approved', x: 500, y: 180, joined: '2021-11-20', initials: 'سد' },
  { id: 'd4', nameAr: 'ماجد الشمري', nameEn: 'Majed Alshammari', phone: '+966 56 902 4410', rating: 4.79, carAr: 'كيا K5 2024 · أزرق داكن', carEn: 'Kia K5 2024 · Navy', plate: 'ص ق ل 9024', color: '#1E3A5F', category: 'economy', rides: 987, status: 'available', approval: 'approved', x: 240, y: 420, joined: '2023-01-09', initials: 'مش' },
  { id: 'd5', nameAr: 'عبدالرحمن الزهراني', nameEn: 'Abdulrahman Alzahrani', phone: '+966 53 640 7781', rating: 4.9, carAr: 'لكزس ES 2024 · فضي', carEn: 'Lexus ES 2024 · Silver', plate: 'م ن و 6407', color: '#CBD2DA', category: 'comfort', rides: 1544, status: 'ontrip', approval: 'approved', x: 610, y: 470, joined: '2022-05-30', initials: 'عز' },
  { id: 'd6', nameAr: 'نايف الحربي', nameEn: 'Naif Alharbi', phone: '+966 59 225 3308', rating: 4.71, carAr: 'نيسان صني 2022 · أبيض', carEn: 'Nissan Sunny 2022 · White', plate: 'ط ي ه 2253', color: '#F8FAFC', category: 'economy', rides: 642, status: 'offline', approval: 'approved', x: 150, y: 520, joined: '2023-06-18', initials: 'نح' },
  { id: 'd7', nameAr: 'تركي المطيري', nameEn: 'Turki Almutairi', phone: '+966 55 377 6612', rating: 4.84, carAr: 'تويوتا راف فور 2023 · أحمر', carEn: 'Toyota RAV4 2023 · Red', plate: 'ع ر ب 3776', color: '#B91C1C', category: 'family', rides: 811, status: 'available', approval: 'approved', x: 380, y: 520, joined: '2022-12-01', initials: 'تم' },
  { id: 'd8', nameAr: 'يزيد السبيعي', nameEn: 'Yazeed Alsubaie', phone: '+966 50 884 1290', rating: 0, carAr: 'هيونداي إلنترا 2024 · أبيض', carEn: 'Hyundai Elantra 2024 · White', plate: 'ك ل م 8841', color: '#F8FAFC', category: 'economy', rides: 0, status: 'offline', approval: 'pending', x: 680, y: 260, joined: '2025-05-02', initials: 'يس' },
  { id: 'd9', nameAr: 'بندر العنزي', nameEn: 'Bandar Alanazi', phone: '+966 54 553 0917', rating: 4.52, carAr: 'شيفروليه ماليبو 2021 · أسود', carEn: 'Chevrolet Malibu 2021 · Black', plate: 'و ه د 5530', color: '#111827', category: 'economy', rides: 430, status: 'offline', approval: 'suspended', x: 120, y: 200, joined: '2023-03-22', initials: 'بع' },
]

export const RIDERS_SEED: Rider[] = [
  { id: 'r1', nameAr: 'عبدالله الشهري', nameEn: 'Abdullah Alshehri', phone: '+966 55 123 4567', rides: 48, rating: 4.9, spent: 1786, joined: '2023-02-11', status: 'active' },
  { id: 'r2', nameAr: 'نورة السالم', nameEn: 'Noura Alsalem', phone: '+966 50 998 1204', rides: 112, rating: 4.95, spent: 4210, joined: '2022-07-03', status: 'active' },
  { id: 'r3', nameAr: 'محمد الغامدي', nameEn: 'Mohammed Alghamdi', phone: '+966 56 330 8471', rides: 27, rating: 4.7, spent: 912, joined: '2024-01-19', status: 'active' },
  { id: 'r4', nameAr: 'سارة العمري', nameEn: 'Sarah Alomari', phone: '+966 54 712 0033', rides: 76, rating: 4.88, spent: 2654, joined: '2022-10-28', status: 'active' },
  { id: 'r5', nameAr: 'فيصل الرشيد', nameEn: 'Faisal Alrasheed', phone: '+966 59 640 2218', rides: 9, rating: 4.4, spent: 301, joined: '2025-03-07', status: 'active' },
  { id: 'r6', nameAr: 'ريم القرني', nameEn: 'Reem Alqarni', phone: '+966 53 207 6650', rides: 63, rating: 4.92, spent: 2133, joined: '2023-05-15', status: 'active' },
  { id: 'r7', nameAr: 'عمر الخالدي', nameEn: 'Omar Alkhaldi', phone: '+966 55 019 3384', rides: 14, rating: 3.9, spent: 488, joined: '2024-09-01', status: 'blocked' },
]

export const PRICING_SEED: Pricing = MARKET.pricing

/** ISO date n days from today, so seeded expiry dates never go stale. */
export const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

export const COUPONS_SEED: Coupon[] = [
  { code: 'WELCOME15', pct: 15, maxOff: 15, uses: 3842, limit: 10000, expires: inDays(120), active: true, descAr: 'خصم 15% لأول رحلاتك', descEn: '15% off your first rides' },
  { code: 'RIYADH10', pct: 10, maxOff: 10, uses: 1290, limit: 5000, expires: inDays(60), active: true, descAr: 'خصم 10% داخل الرياض', descEn: '10% off within Riyadh' },
  { code: 'WEEKEND20', pct: 20, maxOff: 20, uses: 611, limit: 2000, expires: inDays(21), active: true, descAr: 'خصم نهاية الأسبوع', descEn: 'Weekend special' },
  { code: 'RAMADAN25', pct: 25, maxOff: 25, uses: 5000, limit: 5000, expires: inDays(-210), active: false, descAr: 'عرض رمضان المنتهي', descEn: 'Expired Ramadan offer' },
]

const MIN = 60_000
const now0 = Date.now()
const seedTrip = (i: number, rider: string, driver: string, p: string, d: string, cat: Category, status: Status, agoMin: number, rating?: number, review?: string): Trip => {
  const pk = place(p), ds = place(d)
  const km = distKm(pk, ds), mins = Math.round(km * 1.9 + 4)
  return { id: 'MS-' + (48210 + i), riderId: rider, driverId: driver, pickup: pk, dest: ds, category: cat, fare: calcFare(PRICING_SEED, km, mins, cat), discount: 0, payment: i % 3 ? 'card' : 'cash', status, createdAt: now0 - agoMin * MIN, km, mins, rating, review, approach: 1, progress: status === 'in_progress' ? 0.45 : 1, startedAt: now0 - agoMin * MIN + 6 * MIN, endedAt: status === 'completed' ? now0 - agoMin * MIN + (6 + mins) * MIN : undefined, pDone: true, dDone: true }
}
const TRIPS_SEED: Trip[] = [
  seedTrip(1, 'r1', 'd4', 'nakheel', 'kafd', 'economy', 'completed', 60 * 26, 5, 'كابتن محترم وسيارة نظيفة'),
  seedTrip(2, 'r1', 'd1', 'olaya', 'boulevard', 'comfort', 'completed', 60 * 74, 5, 'رحلة مريحة جدًا'),
  seedTrip(3, 'r1', 'd7', 'park', 'sulaimaniyah', 'family', 'completed', 60 * 150, 4),
  seedTrip(4, 'r1', 'd2', 'kafd', 'airport', 'economy', 'cancelled', 60 * 220),
  seedTrip(5, 'r2', 'd5', 'yasmin', 'olaya', 'comfort', 'completed', 95, 5),
  seedTrip(6, 'r3', 'd2', 'malqa', 'park', 'economy', 'in_progress', 9),
  seedTrip(7, 'r4', 'd5', 'sahafa', 'sulaimaniyah', 'comfort', 'in_progress', 14),
  seedTrip(8, 'r6', 'd3', 'boulevard', 'yasmin', 'family', 'accepted', 4),
  seedTrip(9, 'r5', 'd4', 'olaya', 'park', 'economy', 'completed', 140, 4, 'وصل متأخر قليلًا'),
  seedTrip(10, 'r2', 'd1', 'kafd', 'nakheel', 'comfort', 'completed', 210, 5),
  seedTrip(11, 'r7', 'd9', 'sulaimaniyah', 'malqa', 'economy', 'cancelled', 300),
  seedTrip(12, 'r4', 'd7', 'airport', 'sahafa', 'family', 'completed', 380, 5, 'ساعدني في حمل الحقائب، شكرًا'),
  seedTrip(13, 'r6', 'd1', 'park', 'olaya', 'comfort', 'completed', 460, 5),
  seedTrip(14, 'r3', 'd6', 'nakheel', 'boulevard', 'economy', 'completed', 600, 3, 'التكييف كان ضعيفًا'),
]
TRIPS_SEED[7].approach = 0.5

const TICKETS_SEED: Ticket[] = [
  { id: 'TK-1042', riderId: 'r3', tripId: 'MS-48224', catAr: 'جودة المركبة', catEn: 'Vehicle quality', priority: 'medium', status: 'open', msgAr: 'التكييف في السيارة لم يكن يعمل بشكل جيد طوال الرحلة.', msgEn: 'The AC was not working properly during the ride.', createdAt: now0 - 120 * MIN },
  { id: 'TK-1041', riderId: 'r5', tripId: 'MS-48219', catAr: 'تأخر الكابتن', catEn: 'Driver delay', priority: 'low', status: 'review', msgAr: 'الكابتن تأخر سبع دقائق عن الوقت المتوقع.', msgEn: 'Driver arrived seven minutes late.', createdAt: now0 - 260 * MIN },
  { id: 'TK-1040', riderId: 'r7', tripId: 'MS-48221', catAr: 'استرداد مبلغ', catEn: 'Refund request', priority: 'high', status: 'open', msgAr: 'تم خصم مبلغ رحلة ملغاة من بطاقتي.', msgEn: 'I was charged for a cancelled trip.', createdAt: now0 - 330 * MIN },
  { id: 'TK-1039', riderId: 'r2', tripId: 'MS-48215', catAr: 'أغراض مفقودة', catEn: 'Lost item', priority: 'high', status: 'resolved', msgAr: 'نسيت حقيبة صغيرة في المقعد الخلفي.', msgEn: 'I left a small bag in the back seat.', createdAt: now0 - 1500 * MIN },
]

const noticesSeed = (): Notice[] => [
  { id: 1, role: 'passenger', ar: 'استخدم كود WELCOME15 واحصل على خصم 15% على رحلتك القادمة', en: 'Use WELCOME15 to get 15% off your next ride', at: Date.now() - 40 * MIN, read: false },
  { id: 2, role: 'passenger', ar: 'تم تقييم رحلتك الأخيرة بنجاح، شكرًا لك', en: 'Your last trip rating was saved, thank you', at: Date.now() - 26 * 60 * MIN, read: true },
  { id: 3, role: 'driver', ar: 'تمت مراجعة وثائقك واعتمادها حتى 2026', en: 'Your documents were approved until 2026', at: Date.now() - 3 * 60 * MIN, read: false },
  { id: 4, role: 'driver', ar: 'منطقة العليا تشهد طلبًا مرتفعًا الآن', en: 'High demand in Al Olaya right now', at: Date.now() - 20 * MIN, read: false },
  { id: 5, role: 'admin', ar: 'انضم كابتن جديد بانتظار الاعتماد: يزيد السبيعي', en: 'New driver pending approval: Yazeed Alsubaie', at: Date.now() - 32 * MIN, read: false },
  { id: 6, role: 'admin', ar: 'تذكرة دعم عالية الأولوية TK-1040', en: 'High-priority support ticket TK-1040', at: Date.now() - 55 * MIN, read: false },
]

/** What the rider pays: fare − discount + waiting fee, or the cancellation fee for a cancelled trip. */
export const tripTotal = (tr: Pick<Trip, 'status' | 'fare' | 'discount' | 'waitFee' | 'cancelFee'>) => (tr.status === 'cancelled' ? tr.cancelFee ?? 0 : tr.fare - tr.discount + (tr.waitFee ?? 0))

export function distKm(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.round(((Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) / 26) * 10) / 10 + 1.2
}
export function calcFare(p: Pricing, km: number, mins: number, cat: Category) {
  return Math.max(p.minFare, Math.round((p.base + km * p.perKm + mins * p.perMin) * p.mult[cat]))
}
export function estimate(p: Pricing, a: Place, b: Place, cat: Category) {
  const km = distKm(a, b), mins = Math.round(km * 1.9 + 4)
  return { km, mins, fare: calcFare(p, km, mins, cat) }
}

interface Store {
  lang: Lang; setLang: (l: Lang) => void; t: Translate; dir: 'rtl' | 'ltr'; money: (n: number) => string
  role: Role; setRole: (r: Role) => void
  trips: Trip[]; liveId: string | null; live: Trip | undefined
  drivers: Driver[]; riders: Rider[]; coupons: Coupon[]; tickets: Ticket[]; pricing: Pricing; notices: Notice[]; toasts: Toast[]; chat: ChatMsg[]
  driverOnline: boolean; setDriverOnline: (v: boolean) => void
  pAuthed: boolean; setPAuthed: (v: boolean) => void; dAuthed: boolean; setDAuthed: (v: boolean) => void
  toast: (ar: string, en: string, tone?: Toast['tone']) => void
  notify: (role: Notice['role'], ar: string, en: string) => void
  markRead: (role: Notice['role']) => void
  /** Returns false when the request was refused (another ride is still active). */
  requestRide: (o: { pickup: Place; dest: Place; category: Category; payment: Payment; coupon?: string }) => boolean
  updateTrip: (id: string, patch: Partial<Trip>) => void
  cancelRide: () => void; acceptRide: () => void; rejectRide: () => void; arrive: () => void; startRide: () => void; endRide: () => void
  rate: (id: string, rating: number, review: string) => void
  advance: () => void; fastForward: () => void; reset: () => void
  sendChat: (from: ChatMsg['from'], text: string) => void
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>; setRiders: React.Dispatch<React.SetStateAction<Rider[]>>
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>; setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>; setPricing: React.Dispatch<React.SetStateAction<Pricing>>
  validateCoupon: (code: string) => Coupon | undefined
  addTicket: (o: { catAr: string; catEn: string; msg: string; tripId: string }) => void
}

const Ctx = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar')
  const [role, setRoleState] = useState<Role>('showcase')
  const [trips, setTrips] = useState<Trip[]>(TRIPS_SEED)
  const [liveId, setLiveId] = useState<string | null>(null)
  const [drivers, setDrivers] = useState(DRIVERS_SEED)
  const [riders, setRiders] = useState(RIDERS_SEED)
  const [coupons, setCoupons] = useState(COUPONS_SEED)
  const [tickets, setTickets] = useState(TICKETS_SEED)
  const [pricing, setPricing] = useState(PRICING_SEED)
  const [notices, setNotices] = useState<Notice[]>(noticesSeed)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [driverOnline, setDriverOnline] = useState(true)
  const [pAuthed, setPAuthed] = useState(false)
  const [dAuthed, setDAuthed] = useState(false)
  const idRef = useRef(100)
  const tripSeq = useRef(48300) // sequential demo trip ids; production ids come from the server
  const rejectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const t = useCallback(((a: string, e?: string) => (e === undefined ? messages[a as MsgKey][lang] : lang === 'ar' ? a : e)) as Translate, [lang])
  const money = useCallback((n: number) => formatMoney(n, lang), [lang])
  const live = trips.find((x) => x.id === liveId)

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const toast = useCallback((ar: string, en: string, tone: Toast['tone'] = 'success') => {
    const id = ++idRef.current
    setToasts((x) => [...x, { id, ar, en, tone }])
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3200)
  }, [])
  const notify = useCallback((r: Notice['role'], ar: string, en: string) => {
    setNotices((x) => [{ id: ++idRef.current, role: r, ar, en, at: Date.now(), read: false }, ...x])
  }, [])
  const markRead = (r: Notice['role']) => setNotices((x) => x.map((n) => (n.role === r ? { ...n, read: true } : n)))
  const updateTrip = useCallback((id: string, patch: Partial<Trip>) => setTrips((x) => x.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr))), [])
  const setRole = (r: Role) => { setRoleState(r); window.scrollTo({ top: 0 }) }

  // Simulated movement — progress values are illustrative, not GPS data.
  useEffect(() => {
    if (!live) return
    const iv = setInterval(() => {
      setTrips((xs) => xs.map((tr) => {
        if (tr.id !== liveId) return tr
        if (tr.status === 'accepted' && tr.approach < 1) {
          const a = Math.min(1, tr.approach + 0.035)
          if (a >= 1 && tr.driverId !== 'd1') return { ...tr, approach: 1, status: 'arrived', arrivedAt: Date.now() }
          return { ...tr, approach: a }
        }
        if (tr.status === 'arrived' && tr.driverId !== 'd1' && tr.arrivedAt && Date.now() - tr.arrivedAt > 4000) return { ...tr, status: 'in_progress', startedAt: Date.now(), waitFee: waitingFee(Date.now() - tr.arrivedAt, pricing) }
        if (tr.status === 'in_progress' && tr.progress < 1) {
          const p = Math.min(1, tr.progress + 0.022)
          if (p >= 1 && tr.driverId !== 'd1') return { ...tr, progress: 1, status: 'completed', endedAt: Date.now() }
          return { ...tr, progress: p }
        }
        return tr
      }))
    }, 500)
    return () => clearInterval(iv)
  }, [liveId, live?.status, pricing])

  const requestRide: Store['requestRide'] = ({ pickup, dest, category, payment, coupon }) => {
    if (live && !['completed', 'cancelled'].includes(live.status)) {
      toast('لديك رحلة نشطة بالفعل', 'You already have an active ride', 'warn')
      return false
    }
    const e = estimate(pricing, pickup, dest, category)
    const c = coupon ? coupons.find((x) => x.code === coupon) : undefined
    const discount = c ? Math.min(c.maxOff, Math.round((e.fare * c.pct) / 100)) : 0
    const id = 'MS-' + ++tripSeq.current
    const tr: Trip = { id, riderId: 'r1', pickup, dest, category, fare: e.fare, discount, payment, status: 'requested', createdAt: Date.now(), km: e.km, mins: e.mins, approach: 0, progress: 0, live: true, coupon }
    setTrips((x) => [tr, ...x])
    setLiveId(id)
    setChat([])
    if (c) setCoupons((x) => x.map((y) => (y.code === c.code ? { ...y, uses: y.uses + 1 } : y)))
    notify('driver', `طلب رحلة جديد من ${pickup.ar}`, `New ride request from ${pickup.en}`)
    notify('admin', `طلب رحلة جديد ${id} من عبدالله الشهري`, `New ride request ${id} from Abdullah Alshehri`)
    toast('تم إرسال طلبك، جاري البحث عن كابتن', 'Request sent, finding a captain')
    return true
  }
  const cancelRide = () => {
    if (!live || !['requested', 'accepted', 'arrived'].includes(live.status)) return
    const fee = cancellationFee(live, pricing)
    updateTrip(live.id, { status: 'cancelled', cancelFee: fee, pDone: true, dDone: true, live: false })
    setDrivers((d) => d.map((x) => (x.id === live.driverId ? { ...x, status: 'available' } : x)))
    notify('admin', `ألغى الراكب الرحلة ${live.id}`, `Rider cancelled ${live.id}`)
    toast(fee ? `تم إلغاء الرحلة · رسوم إلغاء ${formatMoney(fee, 'ar')}` : 'تم إلغاء الرحلة دون رسوم', fee ? `Trip cancelled · ${formatMoney(fee, 'en')} cancellation fee` : 'Trip cancelled, no fee', 'info')
    setLiveId(null)
  }
  const acceptRide = () => {
    if (!live || live.status !== 'requested') return
    updateTrip(live.id, { status: 'accepted', driverId: 'd1', acceptedAt: Date.now() })
    setDrivers((d) => d.map((x) => (x.id === 'd1' ? { ...x, status: 'enroute' } : x)))
    notify('passenger', 'الكابتن خالد قبل طلبك وهو في طريقه إليك', 'Captain Khalid accepted and is on the way')
    notify('admin', `الكابتن خالد العتيبي قبل الرحلة ${live.id}`, `Khalid Alotaibi accepted ${live.id}`)
    toast('تم قبول الرحلة', 'Ride accepted')
  }
  const rejectRide = () => {
    if (!live || live.status !== 'requested' || live.rejected) return
    updateTrip(live.id, { rejected: true })
    toast('تم رفض الطلب وتحويله لكابتن آخر', 'Request declined and reassigned', 'info')
    const id = live.id
    if (rejectTimer.current) clearTimeout(rejectTimer.current)
    rejectTimer.current = setTimeout(() => {
      setTrips((xs) => xs.map((tr) => (tr.id === id && tr.status === 'requested' ? { ...tr, status: 'accepted', driverId: 'd4', acceptedAt: Date.now() } : tr)))
      setDrivers((xs) => xs.map((d) => (d.id === 'd4' ? { ...d, status: 'enroute' } : d)))
      notify('passenger', 'الكابتن ماجد قبل طلبك', 'Captain Majed accepted your request')
      notify('admin', `أُعيد توجيه ${id} إلى ماجد الشمري`, `${id} reassigned to Majed Alshammari`)
    }, 3000)
  }
  const arrive = () => {
    if (!live || live.status !== 'accepted') return
    updateTrip(live.id, { status: 'arrived', approach: 1, arrivedAt: Date.now() })
    notify('passenger', 'الكابتن وصل إلى موقعك', 'Your captain has arrived')
    toast('تم إشعار الراكب بوصولك', 'Rider notified of your arrival')
  }
  const startRide = () => {
    if (!live || live.status !== 'arrived') return
    updateTrip(live.id, { status: 'in_progress', startedAt: Date.now(), approach: 1, waitFee: live.arrivedAt ? waitingFee(Date.now() - live.arrivedAt, pricing) : 0 })
    setDrivers((d) => d.map((x) => (x.id === live.driverId ? { ...x, status: 'ontrip' } : x)))
    notify('admin', `بدأت الرحلة ${live.id}`, `Trip ${live.id} started`)
    toast('بدأت الرحلة، رحلة موفقة', 'Trip started, drive safe')
  }
  const endRide = () => {
    if (!live || live.status !== 'in_progress') return
    updateTrip(live.id, { status: 'completed', progress: 1, endedAt: Date.now(), approach: 1, startedAt: live.startedAt ?? Date.now() - 60000, settled: true })
    setDrivers((d) => d.map((x) => (x.id === live.driverId ? { ...x, status: 'available', rides: x.rides + 1 } : x)))
    setRiders((r) => r.map((x) => (x.id === 'r1' ? { ...x, rides: x.rides + 1, spent: x.spent + tripTotal(live) } : x)))
    notify('passenger', 'وصلت بالسلامة! قيّم رحلتك', 'You arrived safely! Rate your trip')
    notify('admin', `اكتملت الرحلة ${live.id}`, `Trip ${live.id} completed`)
    toast('اكتملت الرحلة', 'Trip completed')
  }
  const rate = (id: string, rating: number, review: string) => {
    const trip = trips.find((x) => x.id === id)
    if (!trip || trip.status !== 'completed' || trip.rating) return
    updateTrip(id, { rating, review })
    notify('driver', `حصلت على تقييم ${rating} نجوم`, `You received a ${rating}-star rating`)
    notify('admin', `تقييم جديد ${rating}★ للرحلة ${id}`, `New ${rating}★ rating for ${id}`)
    toast('شكرًا لتقييمك', 'Thanks for your rating')
  }
  const advance = () => {
    if (!live) return
    if (live.status === 'requested') acceptRide()
    else if (live.status === 'accepted') arrive()
    else if (live.status === 'arrived') startRide()
    else if (live.status === 'in_progress') endRide()
  }
  const fastForward = () => {
    if (!live) {
      const pk = place('olaya'), ds = place('kafd')
      const e = estimate(pricing, pk, ds, 'comfort')
      const id = 'MS-' + ++tripSeq.current
      setTrips((x) => [{ id, riderId: 'r1', driverId: 'd1', pickup: pk, dest: ds, category: 'comfort', fare: e.fare, discount: 0, payment: 'card', status: 'completed', createdAt: Date.now() - 20 * MIN, startedAt: Date.now() - 14 * MIN, endedAt: Date.now(), km: e.km, mins: e.mins, approach: 1, progress: 1, live: true }, ...x])
      setLiveId(id)
    } else {
      updateTrip(live.id, { status: 'completed', driverId: live.driverId ?? 'd1', approach: 1, progress: 1, startedAt: live.startedAt ?? Date.now() - 12 * MIN, endedAt: Date.now() })
    }
    notify('admin', 'اكتملت رحلة العرض التجريبي', 'Demo trip completed')
    toast('تم الانتقال إلى نهاية الرحلة', 'Jumped to the end of the trip', 'info')
  }
  useEffect(() => {
    if (!live || live.status !== 'completed' || live.settled) return
    updateTrip(live.id, { settled: true })
    setDrivers((xs) => xs.map((d) => (d.id === (live.driverId ?? 'd1') ? { ...d, status: 'available', rides: d.rides + 1 } : d)))
    setRiders((xs) => xs.map((r) => (r.id === live.riderId ? { ...r, rides: r.rides + 1, spent: r.spent + tripTotal(live) } : r)))
    notify('passenger', 'وصلت بالسلامة! قيّم رحلتك', 'You arrived safely! Rate your trip')
  }, [live?.id, live?.status, live?.settled, notify, updateTrip])

  const reset = () => {
    if (rejectTimer.current) clearTimeout(rejectTimer.current)
    setTrips(TRIPS_SEED); setLiveId(null); setDrivers(DRIVERS_SEED); setRiders(RIDERS_SEED); setCoupons(COUPONS_SEED); setTickets(TICKETS_SEED); setPricing(PRICING_SEED)
    setChat([]); setDriverOnline(true); setNotices(noticesSeed()); setPAuthed(false); setDAuthed(false); setRoleState('showcase'); setToasts([])
    toast('تمت إعادة تشغيل التجربة', 'Demo has been reset', 'info')
  }
  const sendChat = (from: ChatMsg['from'], text: string) => setChat((c) => [...c, { from, text, at: Date.now() }])
  const validateCoupon = (code: string) => coupons.find((c) => c.code === code.trim().toUpperCase() && c.active && c.uses < c.limit && c.expires >= inDays(0))
  const addTicket: Store['addTicket'] = ({ catAr, catEn, msg, tripId }) => {
    const id = 'TK-' + (1043 + tickets.length - 4)
    setTickets((x) => [{ id, riderId: 'r1', tripId, catAr, catEn, priority: 'medium', status: 'open', msgAr: msg, msgEn: msg, createdAt: Date.now() }, ...x])
    notify('admin', `تذكرة دعم جديدة ${id}`, `New support ticket ${id}`)
    toast('تم إرسال البلاغ، سيتواصل معك فريق الدعم', 'Ticket submitted, support will contact you')
  }

  const value: Store = {
    lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr', money, role, setRole, trips, liveId, live, drivers, riders, coupons, tickets, pricing, notices, toasts, chat,
    driverOnline, setDriverOnline, pAuthed, setPAuthed, dAuthed, setDAuthed, toast, notify, markRead, requestRide, updateTrip, cancelRide, acceptRide, rejectRide,
    arrive, startRide, endRide, rate, advance, fastForward, reset, sendChat, setDrivers, setRiders, setCoupons, setTickets, setPricing, validateCoupon, addTicket,
  }
  return <Ctx.Provider value={useMemo(() => value, Object.values(value))}>{children}</Ctx.Provider>
}

export function timeAgo(t: (a: string, e: string) => string, at: number) {
  const m = Math.max(0, Math.round((Date.now() - at) / MIN))
  if (m < 1) return t('الآن', 'now')
  if (m < 60) return t(`قبل ${m} د`, `${m}m ago`)
  const h = Math.round(m / 60)
  if (h < 24) return t(`قبل ${h} س`, `${h}h ago`)
  return t(`قبل ${Math.round(h / 24)} يوم`, `${Math.round(h / 24)}d ago`)
}
export const fmtTime = (at: number) => new Date(at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
export const fmtDate = (at: number, lang: Lang) => new Date(at).toLocaleDateString(MARKET.locale[lang], { day: 'numeric', month: 'short' })
