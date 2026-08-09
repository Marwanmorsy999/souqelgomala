"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Home,
  LayoutGrid,
  Package,
  Phone,
  ShoppingCart,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import { getCategories } from "@/lib/services/catalog";
import type { Category } from "@/lib/types";
import { SITE } from "@/lib/site";

type Props = {
  open: boolean;
  cartCount: number;
  onClose: () => void;
  onNavigate: (target: { view: string; category?: string }) => void;
};

type MenuLink = {
  label: string;
  key: string;
  icon: ComponentType<{ className?: string }>;
  anchor?: string;
  view?: string;
};

const links: MenuLink[] = [
  { label: "الرئيسية", key: "home", icon: Home, anchor: "home" },
  {
    label: "الأقسام",
    key: "categories",
    icon: LayoutGrid,
    anchor: "categories",
  },
  { label: "العروض", key: "offers", icon: Tag, anchor: "offers" },
  { label: "المنتجات", key: "products", icon: Package, anchor: "products" },
  { label: "سلة المشتريات", key: "cart", icon: ShoppingCart, view: "cart" },
  { label: "حسابي", key: "account", icon: UserRound, view: "account" },
  { label: "تواصل معنا", key: "contact", icon: Phone, anchor: "contact" },
];

export function HamburgerMenu({ open, cartCount, onClose, onNavigate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [menuCategories, setMenuCategories] = useState<Category[]>([]);

  // Real catalog categories (same D1 source as the homepage chips).
  useEffect(() => {
    let active = true;
    getCategories()
      .then((cats) => active && setMenuCategories(cats))
      .catch(() => active && setMenuCategories([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      document.body.classList.add("menu-drawer-open");
    } else {
      document.body.classList.remove("menu-drawer-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("menu-drawer-open");
    };
  }, [open]);

  const goAnchor = (anchor: string) => {
    onClose();
    onNavigate({ view: "home" });
    setTimeout(
      () =>
        document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" }),
      120,
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="القائمة الرئيسية"
            className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-card shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b px-4 py-4">
              <span className="text-lg font-black">{SITE.name}</span>
              <button
                onClick={onClose}
                aria-label="إغلاق القائمة"
                className="flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <nav className="flex flex-col gap-1" aria-label="قائمة الموقع">
                {links.map(({ label, key, icon: Icon, anchor, view }) => {
                  if (key === "categories") {
                    return (
                      <div key={key}>
                        <button
                          onClick={() => setExpanded((v) => !v)}
                          aria-expanded={expanded}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-bold transition-colors hover:bg-muted"
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="size-5 text-primary" />
                            {label}
                          </span>
                          <ChevronLeft
                            className={`size-4 text-muted-foreground transition-transform ${expanded ? "-rotate-90" : ""}`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              {menuCategories.map((c) => (
                                <li key={c.id}>
                                  <button
                                    onClick={() => {
                                      onClose();
                                      onNavigate({
                                        view: "category",
                                        category: c.name,
                                      });
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-5 py-2.5 text-right text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  >
                                    <span className="size-2 rounded-full bg-primary/50" />
                                    {c.name}
                                  </button>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }
                  if (key === "contact") {
                    return (
                      <a
                        key={key}
                        href="#contact"
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors hover:bg-muted"
                      >
                        <Icon className="size-5 text-primary" />
                        {label}
                      </a>
                    );
                  }
                  const click = () => {
                    if (view) {
                      onClose();
                      onNavigate({ view });
                    } else if (anchor) goAnchor(anchor);
                  };
                  return (
                    <button
                      key={key}
                      onClick={click}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-bold transition-colors hover:bg-muted"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="size-5 text-primary" />
                        {label}
                      </span>
                      {key === "cart" && cartCount > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
