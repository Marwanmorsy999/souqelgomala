"use client";

import { useEffect, useState } from "react";
import {
  UserCog,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  Mail,
  Phone,
  KeyRound,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/feedback/skeleton";
import { runAfterRender } from "@/components/admin/use-deferred-load";
import { useToast } from "@/components/ui/toast";

type Role = "owner" | "manager" | "employee";

type Employee = {
  id: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  role: Role;
  branchName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

const ROLE_LABELS: Record<Role, string> = {
  owner: "المالك",
  manager: "مدير",
  employee: "موظف",
};

const ROLE_CLASSES: Record<Role, string> = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  employee: "bg-muted text-muted-foreground",
};

interface EmployeeFormState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

const EMPTY_FORM: EmployeeFormState = { fullName: "", email: "", phone: "", password: "", role: "employee" };

export function EmployeesManagement({ actorId, actorRole }: { actorId: string; actorRole: string }) {
  const toast = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canWrite = actorRole === "owner" || actorRole === "manager";

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/employees", { cache: "no-store" });
      const body = await res.json();
      if (!body?.success) throw new Error(body?.error ?? "");
      setEmployees(Array.isArray(body.data) ? body.data : []);
    } catch {
      toast.error("تعذر تحميل الموظفين");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return runAfterRender(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setForm({
      fullName: employee.fullName,
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      password: "",
      role: employee.role,
    });
    setErrors({});
    setOpen(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "اسم الموظف مطلوب";
    if (!editing && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "بريد إلكتروني غير صالح";
    if (!editing && form.password.length < 8) e.password = "كلمة المرور يجب أن تكون ٨ أحرف على الأقل";
    if (editing && form.password && form.password.length < 8) e.password = "كلمة المرور يجب أن تكون ٨ أحرف على الأقل";
    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15) e.phone = "رقم هاتف غير صالح";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/admin/employees/${editing.id}` : "/api/admin/employees";
      const method = editing ? "PATCH" : "POST";
      const payload: Record<string, unknown> = editing
        ? { fullName: form.fullName.trim(), phone: form.phone.trim(), role: form.role }
        : {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            password: form.password,
            phone: form.phone.trim(),
            role: form.role,
          };
      if (editing && form.password) payload.password = form.password;

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "فشل الحفظ");
      toast.success(editing ? `تم تحديث حساب «${form.fullName}»` : `تم إنشاء حساب «${form.fullName}» بنجاح`);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(employee: Employee) {
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !employee.isActive }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "");
      setEmployees((prev) => prev.map((e) => (e.id === employee.id ? { ...e, isActive: !employee.isActive } : e)));
      toast.success(!employee.isActive ? `تم تفعيل حساب ${employee.fullName}` : `تم إيقاف حساب ${employee.fullName}`);
    } catch (err) {
      toast.error((err as Error).message || "تعذر تحديث حالة الحساب");
    }
  }

  async function remove(employee: Employee) {
    if (!confirm(`حذف حساب ${employee.fullName}؟ لن يستطيع تسجيل الدخول بعد الآن.`)) return;
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "تعذر الحذف");
      setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
      toast.success(`تم حذف حساب ${employee.fullName}`);
    } catch (err) {
      toast.error((err as Error).message || "تعذر الحذف");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-3 py-1.5 font-semibold">{employees.length} حساب</span>
          <span className="rounded-full bg-green-100 px-3 py-1.5 font-bold text-green-800 dark:bg-green-950/60 dark:text-green-300">
            {employees.filter((e) => e.isActive).length} نشط
          </span>
        </div>
        {canWrite ? (
          <Button onClick={openCreate} className="min-h-[44px] gap-1.5">
            <Plus className="size-4" /> موظف جديد
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">عرض فقط — لا تملك صلاحية التعديل</span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <UserCog className="size-10 text-muted-foreground/40" />
            <p className="font-semibold">لا يوجد حسابات موظفين.</p>
            {canWrite && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" /> إضافة موظف
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Desktop table */
        <>
          <Card className="hidden md:block">
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-right text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="rounded-r-lg p-3.5 font-semibold">الموظف</th>
                    <th className="p-3.5 font-semibold">البريد</th>
                    <th className="p-3.5 font-semibold">الفرع</th>
                    <th className="p-3.5 font-semibold">الدور</th>
                    <th className="p-3.5 font-semibold">آخر دخول</th>
                    <th className="rounded-l-lg p-3.5 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className={`border-b transition-colors last:border-0 hover:bg-muted/30 ${!emp.isActive && "opacity-60"}`}>
                      <td className="p-3.5">
                        <p className="font-bold">{emp.fullName}</p>
                        {emp.phone && <p dir="ltr" className="text-xs text-muted-foreground">{emp.phone}</p>}
                      </td>
                      <td dir="ltr" className="p-3.5 text-xs text-muted-foreground">{emp.email}</td>
                      <td className="p-3.5 text-muted-foreground">{emp.branchName ?? "—"}</td>
                      <td className="p-3.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_CLASSES[emp.role]}`}>
                          {ROLE_LABELS[emp.role]}
                        </span>
                        {!emp.isActive && <span className="mr-1.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">موقوف</span>}
                      </td>
                      <td className="p-3.5 text-xs text-muted-foreground">
                        {emp.lastLoginAt ? new Date(emp.lastLoginAt).toLocaleDateString("ar-EG") : "لم يسجل بعد"}
                      </td>
                      <td className="p-3.5">
                        {canWrite ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => toggleActive(emp)} aria-label={emp.isActive ? `إيقاف ${emp.fullName}` : `تفعيل ${emp.fullName}`} disabled={emp.id === actorId}>
                              <Power className={`size-4 ${emp.isActive ? "text-green-600" : ""}`} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} aria-label={`تعديل ${emp.fullName}`}>
                              <Edit3 className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => remove(emp)} className="min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10" aria-label={`حذف ${emp.fullName}`} disabled={emp.role === "owner"}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Mobile card view */}
          <ul className="flex flex-col gap-3 md:hidden">
            {employees.map((emp) => (
              <li key={emp.id}>
                <Card className={!emp.isActive ? "opacity-70" : undefined}>
                  <CardContent className="flex flex-col gap-2.5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-black">{emp.fullName}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_CLASSES[emp.role]}`}>{ROLE_LABELS[emp.role]}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Mail className="size-3.5 shrink-0" /><span dir="ltr">{emp.email ?? "—"}</span></span>
                      {emp.phone && <span className="flex items-center gap-1.5"><Phone className="size-3.5 shrink-0" /><span dir="ltr">{emp.phone}</span></span>}
                    </div>
                    {!emp.isActive && <span className="w-fit rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">موقوف</span>}
                    {canWrite && (
                      <div className="mt-auto grid grid-cols-3 gap-2 border-t pt-3">
                        <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => toggleActive(emp)} disabled={emp.id === actorId}>
                          <Power className="size-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => openEdit(emp)}>
                          تعديل
                        </Button>
                        <Button variant="outline" size="sm" className="min-h-[44px] text-destructive hover:bg-destructive/10" onClick={() => remove(emp)} disabled={emp.role === "owner"}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Create / edit dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `تعديل حساب: ${editing.fullName}` : "حساب موظف جديد"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="em-name">الاسم *</Label>
              <Input id="em-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="min-h-[44px]" placeholder="مثال: سارة محمد" aria-invalid={Boolean(errors.fullName)} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="em-email">البريد الإلكتروني {editing ? "" : "*"}</Label>
              <Input
                id="em-email"
                dir="ltr"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="min-h-[44px]"
                placeholder="name@example.com"
                disabled={Boolean(editing)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              {editing && <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد بعد إنشاء الحساب.</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="em-phone">الهاتف</Label>
                <Input id="em-phone" dir="ltr" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="min-h-[44px]" placeholder="01xxxxxxxxx" aria-invalid={Boolean(errors.phone)} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="em-role">الدور *</Label>
                <select
                  id="em-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  className="h-[44px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {(Object.keys(ROLE_LABELS) as Role[])
                    .filter((r) => r !== "owner" || actorRole === "owner")
                    .map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="em-pass">{editing ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور *"}</Label>
              <Input
                id="em-pass"
                dir="ltr"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="min-h-[44px]"
                placeholder="٨ أحرف على الأقل"
                autoComplete={editing ? "new-password" : "new-password"}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              {editing && form.password === "" && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <KeyRound className="size-3.5" /> اتركها فارغة للاحتفاظ بكلمة المرور الحالية.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="min-h-[44px]">
              إلغاء
            </Button>
            <Button onClick={save} disabled={saving} className="min-h-[44px]">
              {saving && <Loader2 className="size-4 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
