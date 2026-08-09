"use client";

import { ExternalLink, Flame } from "lucide-react";
import { socialPosts, waLink } from "@/lib/site";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/SocialIcons";
import { isPlaceholderImage } from "@/lib/utils";
import type { SocialPlatform, SocialPost } from "@/lib/types";

type PlatformMeta = {
  label: string;
  handle: string;
  /** Tailwind classes for the branded media tile when no thumbnail exists. */
  tile: string;
  cta: string;
};

const PLATFORM_META: Record<SocialPlatform, PlatformMeta> = {
  facebook: {
    label: "فيسبوك",
    handle: "سوق الجملة",
    tile: "bg-gradient-to-br from-[#1877f2] to-[#0a4fb0]",
    cta: "شوف على فيسبوك",
  },
  instagram: {
    label: "إنستجرام",
    handle: "@soukelgomla",
    tile: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
    cta: "شوف على إنستجرام",
  },
  tiktok: {
    label: "تيك توك",
    handle: "@soukelgomla",
    tile: "bg-gradient-to-b from-neutral-800 to-black",
    cta: "شوف على تيك توك",
  },
  whatsapp: {
    label: "واتساب",
    handle: "سوق الجملة",
    tile: "bg-gradient-to-br from-[#25d366] to-[#128c7e]",
    cta: "كلمنا واتساب",
  },
};

const PLATFORM_ICON: Record<SocialPlatform, typeof FacebookIcon> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  whatsapp: WhatsAppIcon,
};

/**
 * "📱 شوف عروضنا أول بأول" — Latest social content section.
 *
 * These platforms are where Souk El Gomla actually sells every day. The UI is
 * designed to look like REAL social posts (platform avatar + handle, thumbnail
 * or branded tile, title/caption, date, open-on-platform CTA) — not three
 * generic social icons.
 *
 * Content comes from the admin-managed list in `lib/site.ts` (`socialPosts`).
 * A post marked `featured` is TODAY's offer post and carries a "عرض النهارده"
 * badge — the same flag the future backend workflow will use to surface the
 * post in both this section and "🔥 عروض النهارده" without duplicating content.
 */
export function SocialFeed() {
  const posts = [...socialPosts]
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 4);

  if (posts.length === 0) return null;

  return (
    <section id="social" className="mx-auto max-w-6xl scroll-mt-20 px-4">
      <div className="mb-4">
        <h2 className="text-xl font-black sm:text-2xl">📱 شوف عروضنا أول بأول</h2>
        <p className="text-sm text-muted-foreground">
          العروض اللي بننزلها كل يوم من المحل على السوشيال ميديا — من الصفحة
          مباشرة
        </p>
      </div>

      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
        {posts.map((post) => (
          <SocialPostCard key={post.id} post={post} />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        عايز تأكد أي عرض قبل ما تطلب؟ كلمنا على{" "}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-primary underline-offset-2 hover:underline"
        >
          واتساب
        </a>
      </p>
    </section>
  );
}

/* __SPLIT__ */

function SocialPostCard({ post }: { post: SocialPost }) {
  const meta = PLATFORM_META[post.platform];
  const Icon = PLATFORM_ICON[post.platform];
  const hasThumb = post.thumbnail && !isPlaceholderImage(post.thumbnail);

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${post.title} — افتح على ${meta.label}`}
      className="group flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md md:w-auto"
    >
      {/* Post header — platform + handle */}
      <div className="flex items-center gap-2.5 border-b border-border/50 px-3 py-2.5">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-white ${meta.tile}`}
        >
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-foreground">
            {meta.handle}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {meta.label} · {timeAgo(post.date)}
          </p>
        </div>
      </div>

      {/* Media — thumbnail or branded platform tile */}
      {hasThumb ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.thumbnail}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
          {post.featured && <TodayBadge />}
        </div>
      ) : (
        <div
          className={`relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 text-white ${meta.tile}`}
        >
          <Icon className="size-12 opacity-90" />
          <span className="px-4 text-center text-xs font-bold text-white/85">
            أحدث منشورات {meta.label}
          </span>
          {post.featured && <TodayBadge />}
        </div>
      )}

      {/* Body — title + caption + CTA */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-sm font-black leading-6 text-foreground">
          {post.title}
        </p>
        {post.caption && (
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {post.caption}
          </p>
        )}
        <p className="mt-auto flex items-center gap-1 pt-2 text-xs font-bold text-primary transition-colors group-hover:text-primary/80">
          {meta.cta}
          <ExternalLink className="size-3.5" />
        </p>
      </div>
    </a>
  );
}

function TodayBadge() {
  return (
    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-black text-accent-foreground shadow-sm">
      <Flame className="size-3.5" />
      عرض النهارده
    </span>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.max(0, Math.floor((now - then) / 60000));
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}