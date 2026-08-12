"use client";

import { Menu, Phone, Search, ShoppingCart, UserRound } from "lucide-react";
import { useSiteStructure } from "@/components/shared/site-structure";

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
  const { settings, nav } = useSiteStructure();
  const logoUrl = settings.logoUrl ?? "";

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
            aria-label={`${settings.businessName} — الرئيسية`}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={settings.businessName}
                className="size-9 rounded-lg object-contain"
              />
            ) : null}
            <span className="hidden text-lg font-black lg:block">
              {settings.businessName}
            </span>
          </button>
        </div>

        {/* Centered mobile logo */}
        <button
          onClick={onMenu}
          className="absolute left-1/2 -translate-x-1/2 md:hidden"
          aria-label={`${settings.businessName} — الرئيسية`}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={settings.businessName}
              className="size-10 rounded-lg object-contain"
            />
          ) : null}
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
          {nav.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target={link.target === "external" ? "_blank" : undefined}
              rel={link.target === "external" ? "noopener noreferrer" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                link.label === "العروض"
                  ? "font-black text-brand-green hover:bg-brand-green-dim"
                  : "text-text-primary hover:bg-bg-nav-hover hover:text-brand-green"
              }`}
            >
              {link.label === "العروض" ? "🔥 عروض النهارده" : link.label}
            </a>
          ))}
        </nav>

        {/* Right group */}
        <div className="flex items-center gap-1">
          {/* Desktop phone CTA */}
            <a
              href={`tel:${settings.phonePrimary}`}
              className="hidden h-10 items-center gap-2 rounded-lg bg-brand-green px-3 text-sm font-black text-white transition-colors hover:bg-brand-green-hover button-glow"
            >
              <Phone className="size-4" />
              <span dir="ltr">{settings.phonePrimary}</span>
            </a>

          {/* Search (mobile) */}
          <button
            onClick={onSearch}
            aria-label="بحث"
            className="flex size-10 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-bg-nav-hover focus-visible-glow"
          >
            <Search className="size-5" />
          </button>

          {/* Cart */}
          <button
            onClick={onCart}
            aria-label={`السلة (${cartCount} منتج)`}
            className="relative flex size-10 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-bg-nav-hover focus-visible-glow"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -left-0.5 -top-0.5 flex size-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[11px] font-black text-white cart-badge-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
