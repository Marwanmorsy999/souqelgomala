"use client";

import {
  CircleUserRound,
  Home,
  LayoutGrid,
  Search,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import type { View } from "@/lib/types";

type Props = {
  view: View;
  cartCount: number;
  onNavigate: (view: View) => void;
  onAuthOpen: () => void;
  onSearchOpen: () => void;
  onCategoriesOpen: () => void;
};

export function BottomNav({
  view,
  cartCount,
  onNavigate,
  onAuthOpen,
  onSearchOpen,
  onCategoriesOpen,
}: Props) {
  const items: {
    label: string;
    icon: typeof Home;
    active?: boolean;
    action: () => void;
  }[] = [
    { label: "دخول", icon: CircleUserRound, action: onAuthOpen },
    { label: "بحث", icon: Search, action: onSearchOpen },
    {
      label: "السلة",
      icon: ShoppingCart,
      active: view === "cart",
      action: () => onNavigate("cart"),
    },
    {
      label: "المتجر",
      icon: ShoppingBag,
      active: view === "shop",
      action: () => onNavigate("shop"),
    },
    {
      label: "الأقسام",
      icon: LayoutGrid,
      active: view === "category",
      action: onCategoriesOpen,
    },
    {
      label: "الرئيسية",
      icon: Home,
      active: view === "home",
      action: () => onNavigate("home"),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border-subtle bg-bg-nav/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="شريط التنقل السفلي"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {items.map(({ label, icon: Icon, active, action }) => (
          <button
            key={label}
            onClick={action}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[11px] font-semibold transition-all duration-200 focus-visible-glow ${
              active ? "text-brand-green" : "text-text-muted hover:text-text-primary"
            }`}
          >
            <span className="relative">
              <Icon className="size-5" />
              {label === "السلة" && cartCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-0.5 text-[9px] font-black text-white cart-badge-bounce">
                  {cartCount}
                </span>
              )}
            </span>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
