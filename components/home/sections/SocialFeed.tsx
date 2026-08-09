"use client";

import { SITE, waLink } from "@/lib/site";
import { socialPosts } from "@/lib/site";
import { isPlaceholderImage } from "@/lib/utils";
import type { SocialPlatform, SocialPost } from "@/lib/types";

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  facebook: "فيسبوك",
  instagram: "إنستجرام",
  tiktok: "تيك توك",
  whatsapp: "واتساب",
};

const PLATFORM_HREF: Record<string, string> = {
  facebook: SITE.social.facebook,
  instagram: SITE.social.instagram,
  tiktok: SITE.social.tiktok,
};

/**
 * "تابع عروضنا أول بأول" — honest follow section.
 *
 * No fake live feed and no decorative platform tiles. Only posts that carry a
 * REAL thumbnail are rendered as feed cards (prepared for the future
 * admin-managed `GET /api/social` content, type `SocialPost`). Until then the
 * section shows the real business profiles as plain links.
 */
export function SocialFeed() {
  const realPosts = [...socialPosts]
    .filter((p) => p.thumbnail && !isPlaceholderImage(p.thumbnail))
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 4);

  return (
    <section id="social" className="site-section scroll-mt-20">
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black sm:text-2xl">تابع عروضنا أول بأول</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              بننزل عروض وفرص كل يوم على الصفحات من جوه المحل — تابعنا عشان
              أول عرض توصلك.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-primary">
            {(["facebook", "instagram", "tiktok"] as const).map((p) => (
              <a
                key={p}
                href={PLATFORM_HREF[p]}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline"
              >
                {PLATFORM_LABEL[p]}
              </a>
            ))}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-2 hover:underline"
            >
              واتساب
            </a>
          </div>
        </div>

        {realPosts.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {realPosts.map((post) => (
              <SocialPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SocialPostCard({ post }: { post: SocialPost }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${post.title} — افتح على ${PLATFORM_LABEL[post.platform]}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.thumbnail}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-black leading-6 text-foreground">
          {post.title}
        </p>
        <p className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
          <span>{PLATFORM_LABEL[post.platform]}</span>
          {post.featured && (
            <span className="font-bold text-accent">عرض النهارده</span>
          )}
        </p>
      </div>
    </a>
  );
}