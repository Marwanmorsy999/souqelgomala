"use client";

import { useEffect, useState } from "react";
import { Quote, Star, Send, CheckCircle2 } from "lucide-react";

type Review = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  createdAt: string;
};

export function Testimonials() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/reviews", { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => {
        if (!active) return;
        setReviews(Array.isArray(body?.data) ? body.data : []);
      })
      .catch(() => active && setReviews([]));
    return () => {
      active = false;
    };
  }, []);

  // Gracefully hide the review list when there are no approved reviews yet;
  // the customer submission form still renders so visitors can leave feedback.
  const showList = reviews !== null && reviews.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2 || text.trim().length < 5) {
      setError("اكتب اسمك ورأيك ليُنشر بعد المراجعة");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name, text, rating }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        setError(body?.error ?? "تعذر الإرسال");
        return;
      }
      setDone(true);
      setName("");
      setText("");
      setRating(5);
    } catch {
      setError("تعذر الإرسال، حاول لاحقاً");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-black sm:text-2xl">عملاء سوق الجملة</h2>
        <p className="text-sm text-muted-foreground">آراء العملاء الموثوقة</p>
      </div>

      {showList ? (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews!.map((t) => (
            <figure
              key={t.id}
              className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
            >
              <Quote className="absolute left-4 top-4 size-8 text-primary/10" />
              <div
                className="flex gap-0.5 text-accent"
                aria-label={`تقييم ${t.rating} من 5`}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`size-4 ${i <= t.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-7 text-foreground">
                {t.text}
              </blockquote>
              <figcaption className="mt-4">
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-center text-sm text-muted-foreground">
          لا توجد تقييمات منشورة بعد — كن أول من يشارك رأيه.
        </p>
      )}

      {done ? (
        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center">
          <CheckCircle2 className="size-8 text-primary" />
          <p className="font-bold text-primary">شكراً لرأيك!</p>
          <p className="text-xs text-muted-foreground">
            سيظهر تقييمك بعد مراجعته من الإدارة.
          </p>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="mx-auto mt-6 flex max-w-md flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
        >
          <p className="text-center text-sm font-bold">شارك رأيك</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسمك"
            maxLength={80}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center justify-center gap-1" role="radiogroup" aria-label="التقييم">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i} نجوم`}
                onClick={() => setRating(i)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`size-6 ${i <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="رأيك في سوق الجملة"
            rows={3}
            maxLength={1000}
            className="resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {error && <p className="text-center text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Send className="size-4" />
            {submitting ? "جارٍ الإرسال…" : "إرسال التقييم"}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            تُراجَع التقييمات قبل نشرها ولا تُنشر بيانات تجريبية.
          </p>
        </form>
      )}
    </section>
  );
}
