'use client'

import { useMemo, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  Bell, ChevronDown, ChevronLeft, CircleDollarSign, ClipboardList,
  LayoutDashboard, Menu, Package, PanelLeftClose, PanelLeftOpen,
  Search, Settings, ShoppingCart, TrendingUp, UserRound, Users, X,
} from 'lucide-react'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Aug%206%2C%202026%2C%2001_59_41%20PM-XlqTPzN2O6W7ZSsRAbrdzcpshw4863.png'

const salesData = [
  { day: 'السبت', sales: 9200 }, { day: 'الأحد', sales: 11400 },
  { day: 'الإثنين', sales: 9800 }, { day: 'الثلاثاء', sales: 13200 },
  { day: 'الأربعاء', sales: 12600 }, { day: 'الخميس', sales: 15800 },
  { day: 'الجمعة', sales: 17450 },
]

const categoryData = [
  { name: 'بقالة', value: 48, fill: 'var(--color-grocery)' },
  { name: 'ألبان', value: 27, fill: 'var(--color-dairy)' },
  { name: 'مشروبات', value: 15, fill: 'var(--color-drinks)' },
  { name: 'أخرى', value: 10, fill: 'var(--color-other)' },
]

const orders = [
  { id: '#SG-10482', customer: 'محمد أحمد', total: 247, status: 'تم التسليم', tone: 'success', date: 'اليوم، ١١:٤٢ ص' },
  { id: '#SG-10481', customer: 'سارة محمود', total: 560, status: 'جاري التجهيز', tone: 'warning', date: 'اليوم، ١٠:١٨ ص' },
  { id: '#SG-10480', customer: 'أحمد علي', total: 185, status: 'خرج للتوصيل', tone: 'info', date: 'أمس، ٠٥:٣٠ م' },
  { id: '#SG-10479', customer: 'نور خالد', total: 920, status: 'تم التسليم', tone: 'success', date: 'أمس، ٠٢:١٢ م' },
  { id: '#SG-10478', customer: 'محمود حسن', total: 132, status: 'ملغي', tone: 'danger', date: '١١ أغسطس، ٠٩:٠٥ ص' },
]

const lowStock = [
  { name: 'موتزريلا', detail: '12 قطعة متبقية', image: 'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=120' },
  { name: 'زيت عباد الشمس', detail: '8 قطع متبقية', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120' },
  { name: 'شاي ليبتون', detail: '6 قطع متبقية', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=120' },
]

const salesConfig = { sales: { label: 'المبيعات', color: 'var(--chart-1)' } } satisfies ChartConfig
const categoryConfig = {
  grocery: { label: 'بقالة', color: 'var(--chart-1)' },
  dairy: { label: 'ألبان', color: 'var(--chart-2)' },
  drinks: { label: 'مشروبات', color: 'var(--chart-3)' },
  other: { label: 'أخرى', color: 'var(--chart-4)' },
} satisfies ChartConfig

const navItems = [
  { label: 'نظرة عامة', icon: LayoutDashboard },
  { label: 'الطلبات', icon: ClipboardList },
  { label: 'المنتجات', icon: Package },
  { label: 'العملاء', icon: Users },
  { label: 'الإعدادات', icon: Settings },
]

function StatusBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const classes = {
    success: 'bg-primary/10 text-primary', warning: 'bg-accent/20 text-accent-foreground',
    info: 'bg-secondary text-secondary-foreground', danger: 'bg-destructive/10 text-destructive',
  }
  return <Badge className={`border-0 ${classes[tone as keyof typeof classes]}`}>{children}</Badge>
}

function Sidebar({ collapsed, open, onClose, onToggle }: { collapsed: boolean; open: boolean; onClose: () => void; onToggle: () => void }) {
  return (
    <aside className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l bg-card p-4 transition-transform duration-300 md:relative md:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full'} ${collapsed ? 'md:w-20' : 'md:w-64'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 overflow-hidden ${collapsed ? 'md:w-10' : ''}`}>
          <img src={logoUrl} alt="سوق الجملة" className="size-10 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0"><p className="truncate font-black text-primary">سوق الجملة</p><p className="truncate text-[10px] text-muted-foreground">لوحة الإدارة</p></div>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose} aria-label="إغلاق القائمة"><X className="size-5" /></Button>
      </div>
      <Separator className="my-5" />
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item, index) => { const Icon = item.icon; return <button key={item.label} onClick={() => { if (item.label === 'المنتجات') window.location.href = '/admin/products'; if (item.label === 'الطلبات') window.location.href = '/admin/orders' }} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-right text-sm font-semibold transition ${index === 0 ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className="size-5 shrink-0" /><span className={collapsed ? 'md:hidden' : ''}>{item.label}</span></button> })}
      </nav>
      <div className={`rounded-2xl bg-primary/10 p-3 ${collapsed ? 'md:hidden' : ''}`}><p className="text-xs font-bold text-primary">مركز المساعدة</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">نحن هنا لمساعدتك في إدارة متجرك.</p><Button variant="outline" size="sm" className="mt-3 w-full rounded-xl bg-card">تواصل معنا</Button></div>
      <Button variant="ghost" size="icon" className="mt-3 hidden self-start md:flex" onClick={onToggle} aria-label="تغيير حجم القائمة">{collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}</Button>
    </aside>
  )
}

function SalesChart() {
  return <ChartContainer config={salesConfig} className="h-64 w-full"><AreaChart data={salesData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="4 4" /><XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} /><YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} orientation="right" /><Tooltip /><Area type="monotone" dataKey="sales" stroke="var(--color-sales)" fill="url(#salesFill)" strokeWidth={3} /></AreaChart></ChartContainer>
}

function CategoryChart() {
  return <ChartContainer config={categoryConfig} className="h-52 w-full max-w-[240px]"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>{categoryData.map((item) => <Cell key={item.name} fill={item.fill} />)}</Pie><Tooltip /></PieChart></ChartContainer>
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [range, setRange] = useState('آخر ٧ أيام')
  const [query, setQuery] = useState('')
  const filteredOrders = useMemo(() => orders.filter((order) => `${order.id} ${order.customer}`.includes(query)), [query])

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="flex min-h-screen">
        <Sidebar collapsed={collapsed} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setCollapsed((value) => !value)} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)} aria-label="فتح القائمة"><Menu className="size-5" /></Button><div><p className="text-xs text-muted-foreground">الأربعاء، ١٤ أغسطس ٢٠٢٦</p><h1 className="text-lg font-black">صباح الخير، أحمد</h1></div></div>
            <div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="البحث"><Search className="size-5" /></Button><Button variant="ghost" size="icon" className="relative" aria-label="الإشعارات"><Bell className="size-5" /><span className="absolute right-1 top-1 size-2 rounded-full bg-accent" /></Button><div className="hidden items-center gap-2 border-r pr-3 sm:flex"><div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-5" /></div><div><p className="text-xs font-bold">أحمد المدير</p><p className="text-[10px] text-muted-foreground">مدير النظام</p></div><ChevronDown className="size-4 text-muted-foreground" /></div></div>
          </header>
          <main className="mx-auto flex max-w-[1500px] flex-col gap-5 p-4 md:p-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm text-muted-foreground">إليك ملخص أداء متجرك</p><h2 className="text-2xl font-black">نظرة عامة</h2></div><Button className="w-full rounded-xl sm:w-auto"><CircleDollarSign className="size-4" />تقرير المبيعات</Button></div>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {([['إجمالي المبيعات', '١٢٤,٨٥٠', 'ج.م', 'bg-primary/10 text-primary', CircleDollarSign], ['طلبات اليوم', '٥٦', '', 'bg-accent/20 text-accent-foreground', ShoppingCart], ['العملاء الجدد', '٢٤', '', 'bg-secondary text-secondary-foreground', Users], ['متوسط قيمة الطلب', '٢٤٧', 'ج.م', 'bg-muted text-primary', Package]] as const).map(([label, value, unit, iconClass, Icon]) => <Card key={String(label)}><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black">{value} <span className="text-sm font-semibold">{unit}</span></p><p className="mt-2 flex items-center gap-1 text-xs font-bold text-primary"><TrendingUp className="size-3" />+١٨.٤٪ <span className="font-normal text-muted-foreground">من الشهر الماضي</span></p></div><div className={`flex size-11 items-center justify-center rounded-2xl ${iconClass}`}><Icon className="size-5" /></div></CardContent></Card>)}
            </section>
            <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
              <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="font-black">المبيعات خلال الأسبوع</CardTitle><select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-xs font-semibold"><option>آخر ٧ أيام</option><option>آخر ٣٠ يوم</option></select></CardHeader><CardContent><SalesChart /></CardContent></Card>
              <Card><CardHeader><CardTitle className="font-black">توزيع المبيعات حسب الفئة</CardTitle></CardHeader><CardContent><div className="flex flex-col items-center gap-4 sm:flex-row xl:flex-col"><CategoryChart /><div className="grid w-full grid-cols-2 gap-3 text-xs">{categoryData.map((item) => <div key={item.name} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.fill }} /><span className="text-muted-foreground">{item.name}</span><strong className="mr-auto">{item.value}٪</strong></div>)}</div></div></CardContent></Card>
            </section>
            <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
              <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="font-black">أحدث الطلبات</CardTitle><Button variant="ghost" size="sm" className="gap-1 text-primary">عرض الكل <ChevronLeft className="size-4" /></Button></CardHeader><CardContent><div className="mb-4 flex items-center gap-2"><Search className="size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث برقم الطلب أو اسم العميل" className="h-9 rounded-xl" /></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-right text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="pb-3 font-semibold">رقم الطلب</th><th className="pb-3 font-semibold">العميل</th><th className="pb-3 font-semibold">التاريخ</th><th className="pb-3 font-semibold">الإجمالي</th><th className="pb-3 font-semibold">الحالة</th></tr></thead><tbody>{filteredOrders.map((order) => <tr key={order.id} className="border-b last:border-0"><td className="py-3 font-bold text-primary">{order.id}</td><td className="py-3">{order.customer}</td><td className="py-3 text-xs text-muted-foreground">{order.date}</td><td className="py-3 font-bold">{order.total} ج.م</td><td className="py-3"><StatusBadge tone={order.tone}>{order.status}</StatusBadge></td></tr>)}</tbody></table></div></CardContent></Card>
              <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="font-black">تنبيهات المخزون</CardTitle><Badge variant="destructive">٣ منتجات</Badge></CardHeader><CardContent className="flex flex-col gap-3">{lowStock.map((item) => <div key={item.name} className="flex items-center gap-3 rounded-xl bg-muted/60 p-2.5"><img src={item.image} alt={item.name} className="size-12 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.name}</p><p className="text-xs text-destructive">{item.detail}</p></div><Button variant="outline" size="sm" className="rounded-lg text-xs">تحديث</Button></div>)}<Button variant="ghost" className="text-primary">إدارة المخزون <ChevronLeft className="size-4" /></Button></CardContent></Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
