"use client";

import { useEffect, useState } from "react";
import { Check, X, Trash2, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { runAfterRender } from "@/components/admin/use-deferred-load";

type Review = {
  id: string;
  author_name: string;
  author_role: string | null;
  rating: number;
  text: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار المراجعة",
  approved: "منشور",
  rejected: "مرفوض",
};

export function ReviewsModeration() {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews", { cache: "no-store" });
      const body = await res.json();
      setRows(Array.isArray(body?.data) ? body.data : []);
    } catch {
      setError("تعذر تحميل التقييمات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return runAfterRender(load);
  }, []);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  async function moderate(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) load();
    else setError("تعذر تحديث التقييم");
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا التقييم نهائياً؟")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("تعذر حذف التقييم");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {s === "all" ? "الكل" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> جارٍ التحميل…
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">لا توجد تقييمات في هذا التصنيف.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {filtered.map((r) => (
                <div key={r.id} className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{r.author_name}</span>
                        <span className="text-xs text-muted-foreground">{r.author_role ?? "سوق الجملة"}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            r.status === "approved"
                              ? "bg-primary/10 text-primary"
                              : r.status === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-accent/20 text-accent-foreground"
                          }`}
                        >
                          {STATUS_LABEL[r.status]}
                        </span>
                      </div>
                      <div className="mt-0.5 flex gap-0.5 text-accent" aria-label={`تقييم ${r.rating}`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`size-3.5 ${i <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-foreground">{r.text}</p>
                  <div className="flex gap-2">
                    {r.status !== "approved" && (
                      <Button size="sm" onClick={() => moderate(r.id, "approve")} className="gap-1.5">
                        <Check className="size-4" /> اعتماد ونشر
                      </Button>
                    )}
                    {r.status !== "rejected" && (
                      <Button size="sm" variant="outline" onClick={() => moderate(r.id, "reject")} className="gap-1.5">
                        <X className="size-4" /> رفض
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="gap-1.5 text-destructive">
                      <Trash2 className="size-4" /> حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
