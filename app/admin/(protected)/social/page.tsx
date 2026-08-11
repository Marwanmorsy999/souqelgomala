"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Loader2, X, Star, Share2, Camera, Music2, Send, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploader } from "@/components/admin/image-uploader"
import { runAfterRender } from "@/components/admin/use-deferred-load"
import { useToast } from "@/components/ui/toast"

type SocialPost = {
  id: string
  platform: "facebook" | "instagram" | "tiktok" | "whatsapp"
  url: string
  thumbnail?: string | null
  title: string
  caption?: string | null
  post_date: string
  featured: boolean
  linked_offer_id?: string | null
  is_visible: boolean
  linkedOfferTitle?: string | null
}

const PLATFORM_LABEL: Record<string, string> = {
  facebook: "فيسبوك",
  instagram: "إنستجرام",
  tiktok: "تيك توك",
  whatsapp: "واتساب",
}

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  facebook: <Share2 className="size-4" />,
  instagram: <Camera className="size-4" />,
  tiktok: <Music2 className="size-4" />,
  whatsapp: <Send className="size-4" />,
}

const EMPTY_FORM = {
  platform: "facebook" as SocialPost["platform"],
  url: "",
  thumbnail: "",
  title: "",
  caption: "",
  postDate: "",
  featured: false,
  isVisible: true,
  linkedOfferId: "",
}

export default function AdminSocialPage() {
  const toast = useToast()
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [offers, setOffers] = useState<{ id: string; campaign_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [syncing, setSyncing] = useState(false)

  async function handleSyncNow() {
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/social/sync", { method: "POST" })
      const body = await res.json()
      if (body?.success) {
        const { total, inserted, updated, skipped } = body.data ?? {}
        toast.success(
          `تمت المزامنة: ${total ?? 0} منشور (جديد ${inserted ?? 0}، محدث ${updated ?? 0}، متجاهل ${skipped ?? 0})`
        )
        await load()
      } else {
        toast.error(body?.error ?? "تعذرت مزامنة المنشورات")
      }
    } catch {
      toast.error("تعذرت مزامنة المنشورات")
    } finally {
      setSyncing(false)
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(post: SocialPost) {
    setEditingId(post.id)
    setForm({
      platform: post.platform,
      url: post.url,
      thumbnail: post.thumbnail ?? "",
      title: post.title,
      caption: post.caption ?? "",
      postDate: (post.post_date ?? "").slice(0, 16),
      featured: post.featured,
      isVisible: post.is_visible,
      linkedOfferId: post.linked_offer_id ?? "",
    })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المنشور؟")) return
    try {
      const res = await fetch(`/api/admin/social/${id}`, { method: "DELETE" })
      const body = await res.json()
      if (body?.success) {
        toast.success("تم حذف المنشور")
        await load()
      } else {
        toast.error(body?.error ?? "تعذر حذف المنشور")
      }
    } catch {
      toast.error("تعذر حذف المنشور")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        platform: form.platform,
        url: form.url,
        title: form.title,
        thumbnail: form.thumbnail || undefined,
        caption: form.caption || undefined,
        postDate: form.postDate ? new Date(form.postDate).toISOString() : new Date().toISOString(),
        featured: form.featured,
        isVisible: form.isVisible,
        linkedOfferId: form.linkedOfferId || undefined,
      }

      const url = editingId ? `/api/admin/social/${editingId}` : "/api/admin/social"
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (body?.success) {
        toast.success(editingId ? "تم تحديث المنشور" : "تم إنشاء المنشور")
        setShowForm(false)
        await load()
      } else {
        const msg =
          body?.error ??
          (body?.post ? Object.values(body.post).flat().join("، ") : null) ??
          "تعذر حفظ المنشور"
        toast.error(msg)
      }
    } catch {
      toast.error("تعذر حفظ المنشور")
    } finally {
      setSaving(false)
    }
  }

  async function load() {
    setLoading(true)
    try {
      const [postsRes, offersRes] = await Promise.all([
        fetch("/api/admin/social", { cache: "no-store" }),
        fetch("/api/admin/offers", { cache: "no-store" }),
      ])
      const postsBody = await postsRes.json()
      const offersBody = await offersRes.json()
      setPosts(Array.isArray(postsBody?.data) ? postsBody.data : [])
      setOffers(Array.isArray(offersBody?.data) ? offersBody.data.map((o: { id: string; campaign_name: string }) => ({ id: o.id, campaign_name: o.campaign_name })) : [])
    } catch {
      toast.error("تعذر تحميل المنشورات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="السوشيال ميديا"
        description="إدارة منشورات فيسبوك وإنستجرام وتيك توك (محتوى حقيقي تديره أنت)"
        actions={
          <div className="flex gap-2">
            <Button onClick={handleSyncNow} disabled={syncing} variant="outline">
              {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              <span className="mr-2">{syncing ? "جارٍ المزامنة…" : "مزامنة الآن"}</span>
            </Button>
            <Button onClick={openCreate} disabled={showForm}>
              <Plus className="size-4" />
              <span className="mr-2">منشور جديد</span>
            </Button>
          </div>
        }
      />

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black">{editingId ? "تعديل منشور" : "منشور جديد"}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="platform">المنصة *</Label>
                <select
                  id="platform"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value as SocialPost["platform"] })}
                >
                  <option value="facebook">فيسبوك</option>
                  <option value="instagram">إنستجرام</option>
                  <option value="tiktok">تيك توك</option>
                  <option value="whatsapp">واتساب</option>
                </select>
              </div>

              <div>
                <Label htmlFor="title">العنوان *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="url">رابط المنشور *</Label>
                <Input
                  id="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://facebook.com/..."
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="caption">الوصف</Label>
                <Textarea
                  id="caption"
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="postDate">تاريخ النشر *</Label>
                <Input
                  id="postDate"
                  type="datetime-local"
                  value={form.postDate}
                  onChange={(e) => setForm({ ...form, postDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="linkedOfferId">ربط بعرض (اختياري)</Label>
                <select
                  id="linkedOfferId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.linkedOfferId}
                  onChange={(e) => setForm({ ...form, linkedOfferId: e.target.value })}
                >
                  <option value="">— بدون ربط —</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.campaign_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <ImageUploader
                  value={form.thumbnail}
                  onChange={(url) => setForm({ ...form, thumbnail: url })}
                  label="صورة المنشور ( thumbnail)"
                />
              </div>

              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  <Star className="size-4 text-accent" /> عرض النهارده (مميز)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isVisible}
                    onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                  />
                  ظاهر في المتجر
                </label>
              </div>

              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  <span className="mr-2">{editingId ? "تحديث" : "إنشاء"}</span>
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>جارٍ التحميل…</span>
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            لا توجد منشورات بعد. أضف أول منشور من فيسبوك أو إنستجرام أو تيك توك.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex gap-3 p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {post.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.thumbnail} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      {PLATFORM_ICON[post.platform]}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{post.title}</span>
                    {post.featured && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        <Star className="mr-1 inline size-3" /> عرض النهارده
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {PLATFORM_ICON[post.platform]} {PLATFORM_LABEL[post.platform]}
                    {post.linkedOfferTitle && <> • مرتبط: {post.linkedOfferTitle}</>}
                  </p>
                  {post.caption && <p className="line-clamp-2 text-xs text-muted-foreground">{post.caption}</p>}
                  <div className="mt-1 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(post)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
