"use client";

import { Menu, Phone, Search, ShoppingCart, UserRound } from "lucide-react";
import { logoUrl } from "@/lib/data";
import { useSiteSettings } from "@/components/shared/site-settings";

type Props = {
  cartCount: number;
  onMenu: () => void;
  onSearch: () => void;
  onAccount: () => void;
  onCart: () => void;
};

export function Header({
  cartCount,
  onMenu,
  onSearch,
  onAccount,
  onCart,
}: Props) {
  const settings = useSiteSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-nav/95 backdrop-blur">
      <div className="site-section flex h-14 items-center justify-between gap-2">
        {/* Left group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMenu}
            aria-label="القائمة"
            className="flex size-10 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-bg-nav-hover md:hidden"
          >
            <Menu className="size-5" />
          </button>

          {/* Desktop logo */}
          <button
            onClick={onMenu}
            className="hidden shrink-0 items-center gap-2 md:flex"
            aria-label="سوق الجملة — الرئيسية"
          >
            <img
              src={logoUrl}
              alt="سوق الجملة"
              className="size-9 rounded-lg object-contain"
            />
            <span className="hidden text-lg font-black lg:block">
              {settings.name}
            </span>
          </button>
        </div>

        {/* Centered mobile logo */}
        <button
          onClick={onMenu}
          className="absolute left-1/2 -translate-x-1/2 md:hidden"
          aria-label="سوق الجملة — الرئيسية"
        >
          <img
            src={logoUrl}
            alt="سوق الجملة"
            className="size-10 rounded-lg object-contain"
          />
        </button>

        {/* Desktop search */}
        <div className="hidden flex-1 px-6 md:block">
          <button
            onClick={onSearch}
            className="flex h-10 w-full items-center gap-2 rounded-xl border border-border-default bg-bg-input px-3 text-sm text-text-secondary transition-colors hover:bg-bg-nav-hover"
            aria-label="ابحث عن منتج"
          >
            <Search className="size-4" />
            <span>ابحث عن منتج...</span>
          </button>
        </div>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="التنقل الرئيسي"
        >
          {[
            ["الرئيسية", "#home"],
            ["الأقسام", "#categories"],
            ["العروض", "#offers"],
            ["المنتجات", "#products"],
            ["تواصل معنا", "#contact"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                label === "العروض"
                  ? "font-black text-brand-green hover:bg-brand-green-dim"
                  : "text-text-primary hover:bg-bg-nav-hover hover:text-brand-green"
              }`}
            >
              {label === "العروض" ? "🔥 عروض النهارده" : label}
            </a>
          ))}
        </nav>

        {/* Right group */}
        <div className="flex items-center gap-1">
          {/* Desktop phone CTA */}
          <a
            href={`tel:${settings.phoneMain}`}
            className="hidden h-10 items-center gap-2 rounded-lg bg-brand-green px-3 text-sm font-black text-white transition-colors hover:bg-brand-green-hover lg:flex"
          >
            <Phone className="size-4" />
            <span dir="ltr">{settings.phoneMain}</span>
          </a>

          {/* Search (mobile) */}
          <button
            onClick={onSearch}
            aria-label="بحث"
            className="flex size-10 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-bg-nav-hover md:hidden"
          >
            <Search className="size-5" />
          </button>

          {/* Cart */}
          <button
            onClick={onCart}
            aria-label={`السلة (${cartCount} منتج)`}
            className="relative flex size-10 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-bg-nav-hover"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -left-0.5 -top-0.5 flex size-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[11px] font-black text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
