"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type StaffPerm = { staff_id: string; can_edit_products: boolean; can_edit_prices: boolean; can_edit_promos: boolean; can_manage_staff: boolean; can_view_reports: boolean }

type Props = { staffId: string }

export function StaffPermissionsEditor({ staffId }: Props) {
  const toast = useToast()
  const [perms, setPerms] = useState<StaffPerm | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/permissions`, { cache: "no-store" })
      const data = await res.json()
      if (data?.data) setPerms(data.data)
    } catch { toast.error("تعذر تحميل الصلاحيات") }
  }

  useEffect(() => { return runAfterRender(load) }, [staffId])

  async function save() {
    if (!perms) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/permissions`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(perms) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "فشل الحفظ")
      toast.success("تم حفظ الصلاحيات")
    } catch (e) { toast.error((e as Error).message) }
    finally { setSaving(false) }
  }

  if (!perms) return <Card className="bg-bg-surface border-border"><CardContent className="p-4"><p className="text-sm text-muted-foreground">جاري التحميل...</p></CardContent></Card>

  return (
    <Card className="bg-bg-surface border-border">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3">
          <PermissionRow label="تعديل المنتجات" checked={perms.can_edit_products} onChange={(v) => setPerms({ ...perms, can_edit_products: v })} />
          <PermissionRow label="تعديل الأسعار" checked={perms.can_edit_prices} onChange={(v) => setPerms({ ...perms, can_edit_prices: v })} />
          <PermissionRow label="تعديل العروض" checked={perms.can_edit_promos} onChange={(v) => setPerms({ ...perms, can_edit_promos: v })} />
          <PermissionRow label="إدارة الموظفين" checked={perms.can_manage_staff} onChange={(v) => setPerms({ ...perms, can_manage_staff: v })} />
          <PermissionRow label="عرض التقارير" checked={perms.can_view_reports} onChange={(v) => setPerms({ ...perms, can_view_reports: v })} />
        </div>
        <Button onClick={save} disabled={saving} className="gap-1.5">{saving ? "جاري الحفظ..." : "حفظ الصلاحيات"}</Button>
      </CardContent>
    </Card>
  )
}

function PermissionRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 rounded" />
    </div>
  )
}
