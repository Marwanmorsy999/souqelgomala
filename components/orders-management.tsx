'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  FileText,
  MapPin,
  Package,
  Phone,
  Printer,
  Search,
  Truck,
  UserRound,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

type OrderStatus = 'جديد' | 'قيد التجهيز' | 'خرج للتوصيل' | 'تم التسليم' | 'ملغي'
type Order = {
  id: string
  customer: string
  phone: string
  type: 'قطاعي' | 'جملة'
  address: string
  status: OrderStatus
  total: number
  createdAt: string
  items: { name: string; image: string; quantity: number; price: number }[]
  note: string
}

const statusOptions: (OrderStatus | 'الكل')[] = ['الكل', 'جديد', 'قيد التجهيز', 'خرج للتوصيل', 'تم التسليم', 'ملغي']
const statusSteps: OrderStatus[] = ['جديد', 'قيد التجهيز', 'خرج للتوصيل', 'تم التسليم']
const productImages = {
  sugar: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=160',
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=160',
  rice: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9c801?w=160',
  cheese: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=160',
  tea: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=160',
}

const initialOrders: Order[] = [
  { id: '#SG-10482', customer: 'محمد أحمد', phone: '01012345678', type: 'قطاعي', address: 'شارع التحرير، الدقي، الجيزة', status: 'جديد', total: 247, createdAt: 'اليوم، ١١:٤٢ ص', items: [{ name: 'سكر', image: productImages.sugar, quantity: 2, price: 27 }, { name: 'زيت عباد الشمس', image: productImages.oil, quantity: 1, price: 72 }, { name: 'أرز بسمتي', image: productImages.rice, quantity: 1, price: 35 }], note: 'يرجى الاتصال قبل الوصول.' },
  { id: '#SG-10481', customer: 'سارة محمود', phone: '01123456789', type: 'جملة', address: 'شارع جامعة الدول، المهندسين، الجيزة', status: 'قيد التجهيز', total: 560, createdAt: 'اليوم، ١٠:١٨ ص', items: [{ name: 'أرز بسمتي', image: productImages.rice, quantity: 6, price: 30 }, { name: 'زيت عباد الشمس', image: productImages.oil, quantity: 4, price: 65 }], note: 'طلب جملة للمحل.' },
  { id: '#SG-10480', customer: 'أحمد علي', phone: '01234567890', type: 'قطاعي', address: 'شارع عباس العقاد، مدينة نصر، القاهرة', status: 'خرج للتوصيل', total: 185, createdAt: 'أمس، ٠٥:٣٠ م', items: [{ name: 'جبنة بيضاء', image: productImages.cheese, quantity: 2, price: 55 }, { name: 'شاي ليبتون', image: productImages.tea, quantity: 1, price: 68 }], note: 'الدفع عند الاستلام.' },
  { id: '#SG-10479', customer: 'نور خالد', phone: '01545678901', type: 'جملة', address: 'شارع فيصل، الهرم، الجيزة', status: 'تم التسليم', total: 920, createdAt: 'أمس، ٠٢:١٢ م', items: [{ name: 'سكر', image: productImages.sugar, quantity: 12, price: 24.5 }, { name: 'أرز بسمتي', image: productImages.rice, quantity: 10, price: 30 }], note: 'تم التسليم للبواب.' },
  { id: '#SG-10478', customer: 'محمود حسن', phone: '01098765432', type: 'قطاعي', address: 'شارع مكرم عبيد، مدينة نصر، القاهرة', status: 'ملغي', total: 132, createdAt: '١١ أغسطس، ٠٩:٠٥ ص', items: [{ name: 'شاي ليبتون', image: productImages.tea, quantity: 1, price: 68 }, { name: 'جبنة بيضاء', image: productImages.cheese, quantity: 1, price: 55 }], note: 'تم الإلغاء بناءً على طلب العميل.' },
  { id: '#SG-10477', customer: 'هدى إبراهيم', phone: '01198765432', type: 'قطاعي', address: 'شارع الهرم، الجيزة', status: 'جديد', total: 315, createdAt: '١٠ أغسطس، ٠٦:٤٤ م', items: [{ name: 'زيت عباد الشمس', image: productImages.oil, quantity: 3, price: 72 }, { name: 'سكر', image: productImages.sugar, quantity: 3, price: 27 }], note: 'اترك الطلب عند الحارس.' },
  { id: '#SG-10476', customer: 'يوسف سمير', phone: '01298765432', type: 'جملة', address: 'شارع شبرا، القاهرة', status: 'قيد التجهيز', total: 680, createdAt: '١٠ أغسطس، ٠٣:٢١ م', items: [{ name: 'أرز بسمتي', image: productImages.rice, quantity: 14, price: 30 }, { name: 'زيت عباد الشمس', image: productImages.oil, quantity: 4, price: 65 }], note: 'الفاتورة باسم المحل.' },
  { id: '#SG-10475', customer: 'ريم عادل', phone: '01512345678', type: 'قطاعي', address: 'شارع النزهة، مصر الجديدة', status: 'تم التسليم', total: 430, createdAt: '٩ أغسطس، ٠١:٥٠ م', items: [{ name: 'سكر', image: productImages.sugar, quantity: 5, price: 27 }, { name: 'جبنة بيضاء', image: productImages.cheese, quantity: 3, price: 55 }], note: 'تم التسليم بنجاح.' },
  { id: '#SG-10474', customer: 'عمر رجب', phone: '01022223333', type: 'جملة', address: 'منطقة العبور، القليوبية', status: 'خرج للتوصيل', total: 1120, createdAt: '٨ أغسطس، ٠٤:١٧ م', items: [{ name: 'زيت عباد الشمس', image: productImages.oil, quantity: 12, price: 65 }, { name: 'سكر', image: productImages.sugar, quantity: 10, price: 24.5 }], note: 'اتصل بالمخزن عند الوصول.' },
  { id: '#SG-10473', customer: 'مريم عاطف', phone: '01122223333', type: 'قطاعي', address: 'شارع فيصل، الجيزة', status: 'جديد', total: 198, createdAt: '٨ أغسطس، ١١:٠٢ ص', items: [{ name: 'شاي ليبتون', image: productImages.tea, quantity: 2, price: 68 }, { name: 'سكر', image: productImages.sugar, quantity: 2, price: 27 }], note: 'يفضل التوصيل صباحاً.' },
]

const statusStyles: Record<OrderStatus, string> = {
  جديد: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  'قيد التجهيز': 'bg-accent/20 text-accent-foreground',
  'خرج للتوصيل': 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  'تم التسليم': 'bg-primary/10 text-primary',
  ملغي: 'bg-destructive/10 text-destructive',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={`border-0 ${statusStyles[status]}`}>{status}</Badge>
}

function OrderDetails({ order, onClose, onUpdate }: { order: Order; onClose: () => void; onUpdate: (status: OrderStatus) => void }) {
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null)
  const currentIndex = statusSteps.indexOf(order.status)
  const nextStatus = order.status === 'جديد' ? 'قيد التجهيز' : order.status === 'قيد التجهيز' ? 'خرج للتوصيل' : order.status === 'خرج للتوصيل' ? 'تم التسليم' : null
  return <><div className="fixed inset-0 z-40 bg-foreground/30" onClick={onClose} aria-hidden="true" /><aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col overflow-y-auto border-l bg-background shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-5 py-4 backdrop-blur"><div><p className="text-xs text-muted-foreground">تفاصيل الطلب</p><h2 className="text-lg font-black">{order.id}</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="إغلاق"><X className="size-5" /></Button></header><div className="flex flex-col gap-4 p-5"><Card><CardContent className="flex items-start justify-between gap-3 p-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-5" /></div><div><p className="font-bold">{order.customer}</p><p className="text-xs text-muted-foreground">{order.type} · {order.phone}</p></div></div><StatusBadge status={order.status} /></CardContent></Card><Card><CardContent className="flex flex-col gap-3 p-4"><div className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm font-bold">عنوان التوصيل</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{order.address}</p></div></div><div className="flex h-28 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><MapPin className="mr-2 size-5" />معاينة الخريطة</div></CardContent></Card><Card><CardContent className="flex flex-col gap-3 p-4"><h3 className="font-black">المنتجات</h3>{order.items.map((item) => <div key={item.name} className="flex items-center gap-3"><img src={item.image} alt={item.name} className="size-12 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="font-bold">{item.name}</p><p className="text-xs text-muted-foreground">{item.quantity} × {item.price} ج.م</p></div><p className="font-bold">{item.quantity * item.price} ج.م</p></div>)}<Separator /><div className="flex justify-between font-black"><span>الإجمالي</span><span className="text-primary">{order.total} ج.م</span></div></CardContent></Card><Card><CardContent className="flex flex-col gap-4 p-4"><h3 className="font-black">تتبع الطلب</h3>{statusSteps.map((step, index) => <div key={step} className="flex items-center gap-3 text-sm"><div className={`flex size-7 items-center justify-center rounded-full ${index <= currentIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{index <= currentIndex ? <Check className="size-4" /> : index + 1}</div><span className={index <= currentIndex ? 'font-bold' : 'text-muted-foreground'}>{step}</span></div>)}</CardContent></Card><div className="rounded-2xl bg-muted p-4"><p className="flex items-center gap-2 text-sm font-bold"><FileText className="size-4 text-primary" />ملاحظات الطلب</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{order.note}</p></div><div className="flex gap-2">{nextStatus && <Button className="flex-1 rounded-xl" onClick={() => setConfirmStatus(nextStatus)}><Truck className="size-4" />تحديث إلى {nextStatus}</Button>}<Button variant="outline" className="rounded-xl" onClick={() => window.print()}><Printer className="size-4" />طباعة</Button></div></div></aside>{confirmStatus && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4"><Card className="w-full max-w-sm"><CardContent className="flex flex-col gap-4 p-5 text-center"><h3 className="text-lg font-black">تأكيد تحديث الحالة</h3><p className="text-sm text-muted-foreground">هل تريد تغيير حالة الطلب إلى {confirmStatus}؟</p><div className="flex gap-2"><Button className="flex-1 rounded-xl" onClick={() => { onUpdate(confirmStatus); setConfirmStatus(null) }}>تأكيد</Button><Button variant="outline" className="rounded-xl" onClick={() => setConfirmStatus(null)}>إلغاء</Button></div></CardContent></Card></div>}</>
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState(initialOrders)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'الكل'>('الكل')
  const [selected, setSelected] = useState<Order | null>(null)
  const [date, setDate] = useState('آخر ٧ أيام')
  const filtered = useMemo(() => orders.filter((order) => (status === 'الكل' || order.status === status) && `${order.id} ${order.customer} ${order.phone}`.toLowerCase().includes(query.toLowerCase())), [orders, query, status])
  const updateStatus = (id: string, nextStatus: OrderStatus) => { setOrders((current) => current.map((order) => order.id === id ? { ...order, status: nextStatus } : order)); setSelected((current) => current ? { ...current, status: nextStatus } : current) }
  const exportCsv = () => { const rows = [['رقم الطلب', 'العميل', 'النوع', 'الحالة', 'الإجمالي', 'التاريخ'], ...filtered.map((order) => [order.id, order.customer, order.type, order.status, `${order.total} ج.م`, order.createdAt])]; const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'souk-el-gomla-orders.csv'; link.click(); URL.revokeObjectURL(url) }
  const counts = { total: orders.length, new: orders.filter((order) => order.status === 'جديد').length, preparing: orders.filter((order) => order.status === 'قيد التجهيز').length, delivery: orders.filter((order) => order.status === 'خرج للتوصيل').length }
  return <main className="min-h-screen bg-background p-4 md:p-8" dir="rtl"><div className="mx-auto flex max-w-[1500px] flex-col gap-5"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm text-muted-foreground">إدارة الطلبات ومتابعة التوصيل</p><h1 className="text-2xl font-black">الطلبات</h1></div><div className="flex gap-2"><Button variant="outline" className="flex-1 rounded-xl sm:flex-none" onClick={exportCsv}><Download className="size-4" />تصدير Excel</Button><Button variant="outline" size="icon" className="rounded-xl" aria-label="فلترة التاريخ"><CalendarDays className="size-4" /></Button></div></header><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['إجمالي الطلبات', counts.total, 'كل الطلبات'], ['طلبات جديدة', counts.new, 'تحتاج متابعة'], ['قيد التجهيز', counts.preparing, 'في المخزن'], ['خرجت للتوصيل', counts.delivery, 'مع المندوب']].map(([label, value, detail], index) => <Card key={String(label)}><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div><div className={`flex size-10 items-center justify-center rounded-2xl ${index === 1 ? 'bg-accent/20 text-accent-foreground' : 'bg-primary/10 text-primary'}`}><ClipboardList className="size-5" /></div></CardContent></Card>)}</section><Card><CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الطلب أو اسم العميل أو الهاتف" className="h-10 rounded-xl pr-9" /></div><select value={date} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm"><option>آخر ٧ أيام</option><option>آخر ٣٠ يوم</option><option>كل الفترات</option></select><div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">{statusOptions.map((item) => <button key={item} onClick={() => setStatus(item)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${status === item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{item}</button>)}</div></CardContent></Card><Card><CardContent className="p-0"><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-right text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="px-5 py-4 font-semibold">رقم الطلب</th><th className="px-5 py-4 font-semibold">العميل</th><th className="px-5 py-4 font-semibold">النوع</th><th className="px-5 py-4 font-semibold">العنوان</th><th className="px-5 py-4 font-semibold">الحالة</th><th className="px-5 py-4 font-semibold">الإجمالي</th><th className="px-5 py-4 font-semibold">التاريخ</th><th className="px-5 py-4 font-semibold">إجراء</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id} className="border-b last:border-0 hover:bg-muted/40"><td className="px-5 py-4 font-black text-primary">{order.id}</td><td className="px-5 py-4"><p className="font-bold">{order.customer}</p><p className="text-xs text-muted-foreground">{order.phone}</p></td><td className="px-5 py-4"><Badge variant="secondary">{order.type}</Badge></td><td className="max-w-44 truncate px-5 py-4 text-xs text-muted-foreground">{order.address}</td><td className="px-5 py-4"><StatusBadge status={order.status} /></td><td className="px-5 py-4 font-black">{order.total} ج.م</td><td className="px-5 py-4 text-xs text-muted-foreground">{order.createdAt}</td><td className="px-5 py-4"><Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSelected(order)}>عرض التفاصيل</Button></td></tr>)}</tbody></table></div><div className="flex flex-col gap-3 p-3 md:hidden">{filtered.map((order) => <button key={order.id} className="rounded-2xl border bg-card p-4 text-right shadow-sm" onClick={() => setSelected(order)}><div className="flex items-start justify-between gap-3"><div><p className="font-black text-primary">{order.id}</p><p className="mt-1 text-xs text-muted-foreground">{order.customer} · {order.type}</p></div><StatusBadge status={order.status} /></div><div className="mt-3 flex items-center justify-between border-t pt-3"><span className="text-xs text-muted-foreground">{order.createdAt}</span><span className="font-black">{order.total} ج.م</span></div><p className="mt-2 flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="size-3" />{order.address}</p></button>)}{filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">لا توجد طلبات مطابقة.</div>}</div></CardContent></Card></div>{selected && <OrderDetails order={selected} onClose={() => setSelected(null)} onUpdate={(nextStatus) => updateStatus(selected.id, nextStatus)} />}</main>
}
