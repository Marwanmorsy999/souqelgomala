"use client"

import { useEffect, useState } from "react"
import { Edit3, Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type ZoneRow = {
  id: string
  area_name: string
  delivery_fee: number
  estimated_time: string
  active: boolean
}

export function DeliveryZonesManager() {
  const toast = useToast()
  const [rows, setRows] = useState<ZoneRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ZoneRow | null>(null)
  const [open, setOpen] = useState(false)
  const [areaName, setAreaName] = useState("")
  const [fee, setFee] = useState("0")
  const [eta, setEta] = useState("")
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/delivery-zones", { cache: "no-store" })
      const body = await res.json()
      setRows(Array.isArray(body?.data) ? body.data : [])
    } catch {
      toast.error("تعذر تحميل مناطق التوصيل")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { return runAfterRender(load) }, [])

  function openCreate() {
    setEditing(null); setAreaName(""); setFee("0"); setEta(""); setActive(true); setOpen(true)
  }
  function openEdit(row: ZoneRow) {
    setEditing(row); setAreaName(row.area_name); setFee(String(row.delivery_fee)); setEta(row.estimated_time); setActive(row.active); setOpen(true)
  }

  async function save() {
    if (!areaName.trim()) { toast.error("اسم المنطقة مطلوب"); return }
    setSaving(true)
    const payload = { areaName: areaName.trim(), deliveryFee: Number(fee) || 0, estimatedTime: eta, active }
    try {
      const url = editing ? `/api/admin/delivery-zones/${editing.id}` : "/api/admin/delivery-zones"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const body = await res.json()
      if (!res.ok || !body?.success) { toast.error(body?.error ?? "تعذر الحفظ"); return }
      toast.success(editing ? "تم تحديث المنطقة" : "تمت إضافة المنطقة")
      setOpen(false)
      await load()
    } catch {
      toast.error("تعذر الحفظ")
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه المنطقة؟")) return
    const res = await fetch(`/api/admin/delivery-zones/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("تم حذف المنطقة"); await load() }
    else toast.error("تعذر الحذف")
  }

  async function toggle(id: string, active: boolean) {
    const res = await fetch(`/api/admin/delivery-zones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })
    if (res.ok) await load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="size-4" /> منطقة جديدة</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> جارٍ التحميل…</div>
          ) : rows.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">لا توجد مناطق توصيل.</p>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-semibold">المنطقة</th>
                  <th className="p-3 font-semibold">رسوم التوصيل</th>
                  <th className="p-3 font-semibold">الوقت المتوقع</th>
                  <th className="p-3 font-semibold">الحالة</th>
                  <th className="p-3 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="p-3 font-bold">{r.area_name}</td>
                    <td className="p-3" dir="ltr">{r.delivery_fee}</td>
                    <td className="p-3 text-muted-foreground">{r.estimated_time || "—"}</td>
                    <td className="p-3">
                      <button onClick={() => toggle(r.id, !r.active)} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                        {r.active ? "نشط" : "متوقف"}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="تعديل"><Edit3 className="size-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="text-destructive" aria-label="حذف"><Trash2 className="size-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "تعديل منطقة" : "منطقة توصيل جديدة"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1"><Label htmlFor="area">اسم المنطقة</Label><Input id="area" value={areaName} onChange={(e) => setAreaName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1"><Label htmlFor="fee">رسوم التوصيل</Label><Input id="fee" type="number" value={fee} onChange={(e) => setFee(e.target.value)} dir="ltr" /></div>
              <div className="flex flex-col gap-1"><Label htmlFor="eta">الوقت المتوقع</Label><Input id="eta" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="مثال: ساعة واحدة" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 rounded" /> نشط</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="gap-1.5">إلغاء</Button>
            <Button onClick={save} disabled={saving} className="gap-1.5">{saving && <Loader2 className="size-4 animate-spin" />} حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
