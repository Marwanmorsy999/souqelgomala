"use client";

import { useEffect, useState } from "react";
import { useSiteSettings } from "@/components/shared/site-settings";
import { getSocialPosts } from "@/lib/services/catalog";
import { isPlaceholderImage } from "@/lib/utils";
import type { SocialPlatform, SocialPost } from "@/lib/types";

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  facebook: "فيسبوك",
  instagram: "إنستجرام",
  tiktok: "تيك توك",
  whatsapp: "واتساب",
};

/**
 * "تابع عروضنا أول بأول" — real social content from our own pages.
 *
 * The feed renders posts from the `social_posts` D1 table: manually curated
 * admin posts AND posts auto-synced from the official Meta Graph (Facebook +
 * Instagram) and TikTok Display APIs (see src/services/social-sync). Synced
 * posts never overwrite manual ones and manual "عرض النهارده" posts surface
 * first. When there are no posts at all the section shows the business
 * profiles as plain links — an honest state.
 */
export function SocialFeed() {
  const settings = useSiteSettings();
  const [posts, setPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    let active = true;
    getSocialPosts()
      .then((list) => active && setPosts(list))
      .catch(() => active && setPosts([]));
    return () => {
      active = false;
    };
  }, []);

  const realPosts = posts
    .filter((p) => p.thumbnail && !isPlaceholderImage(p.thumbnail))
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 4);

  const platformHref: Record<string, string> = {
    facebook: settings.social.facebook,
    instagram: settings.social.instagram,
    tiktok: settings.social.tiktok,
  };

  return (
    <section id="social" className="site-section scroll-mt-20">
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black sm:text-2xl">أحدث الفيديوهات والمنشورات من صفحاتنا</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              بننزل عروض وفرص كل يوم على صفحاتنا على فيسبوك وإنستجرام وتيك توك —
              تابعنا عشان أول عرض توصلك.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-primary">
            {(["facebook", "instagram", "tiktok"] as const).map((p) => (
              <a
                key={p}
                href={platformHref[p] || "#"}
                target={platformHref[p] ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline"
              >
                {PLATFORM_LABEL[p]}
              </a>
            ))}
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
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