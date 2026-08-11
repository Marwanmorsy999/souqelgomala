import type { Metadata } from "next"
import { notFound } from "next/navigation"

async function getPage(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/site/pages/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    )
    if (!res.ok) return null
    const body = await res.json()
    return body?.success ? body.data : null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return { title: "صفحة غير موجودة" }
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
  }
}

export default async function StaticPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  return (
    <main className="min-h-screen bg-background pb-12" dir="rtl">
      <div className="site-section mx-auto max-w-3xl py-10">
        <h1 className="text-2xl font-black sm:text-3xl">{page.title}</h1>
        <article
          className="prose prose-invert mt-6 max-w-none text-text-secondary"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </main>
  )
}
