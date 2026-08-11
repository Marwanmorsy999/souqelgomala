"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export type StorefrontNavLink = {
  id: string
  label: string
  url: string
  target: "internal" | "external"
}

export type StorefrontFooterLink = {
  id: string
  section: "quick_links" | "contact" | "social"
  label: string
  url: string
}

export type StorefrontHomepageSection = {
  section_key: "hero" | "deals_strip" | "products" | "social_strip"
  visible: boolean
}

export type StorefrontSiteInfo = {
  businessName: string
  logoUrl: string | null
  phonePrimary: string | null
  phoneSecondary: string | null
  address: string | null
  whatsappNumber: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  minOrderValue: number
  freeDeliveryThreshold: number
  defaultDeliveryFee: number
}

export type SiteStructure = {
  nav: StorefrontNavLink[]
  footer: StorefrontFooterLink[]
  homepage: StorefrontHomepageSection[]
  settings: StorefrontSiteInfo
}

const DEFAULT_STRUCTURE: SiteStructure = {
  nav: [
    { id: "n1", label: "الرئيسية", url: "#home", target: "internal" },
    { id: "n3", label: "العروض", url: "#offers", target: "internal" },
    { id: "n4", label: "المنتجات", url: "#products", target: "internal" },
    { id: "n5", label: "تواصل معنا", url: "#contact", target: "internal" },
  ],
  footer: [
    { id: "f1", section: "quick_links", label: "الرئيسية", url: "#home" },
    { id: "f3", section: "quick_links", label: "المنتجات", url: "#products" },
    { id: "f4", section: "quick_links", label: "العروض", url: "#offers" },
    { id: "f5", section: "contact", label: "واتساب", url: "https://wa.me/201222464999" },
    { id: "f6", section: "contact", label: "فيسبوك", url: "https://www.facebook.com/share/1FZUWgbRkR/" },
    { id: "f7", section: "contact", label: "انستجرام", url: "https://www.instagram.com/soukelgomla" },
    { id: "f8", section: "contact", label: "تيك توك", url: "https://www.tiktok.com/@soukelgomla" },
    { id: "f9", section: "social", label: "فيسبوك", url: "https://www.facebook.com/share/1FZUWgbRkR/" },
    { id: "f10", section: "social", label: "انستجرام", url: "https://www.instagram.com/soukelgomla" },
    { id: "f11", section: "social", label: "تيك توك", url: "https://www.tiktok.com/@soukelgomla" },
  ],
  homepage: [
    { section_key: "hero", visible: true },
    { section_key: "deals_strip", visible: true },
    { section_key: "products", visible: true },
    { section_key: "social_strip", visible: true },
  ],
  settings: {
    businessName: "سوق الجملة",
    logoUrl: null,
    phonePrimary: "01222464999",
    phoneSecondary: "01090787378",
    address: "كفر شكر، القليوبية، مصر",
    whatsappNumber: "201222464999",
    facebookUrl: "https://www.facebook.com/share/1FZUWgbRkR/",
    instagramUrl: "https://www.instagram.com/soukelgomla",
    tiktokUrl: "https://www.tiktok.com/@soukelgomla",
    minOrderValue: 0,
    freeDeliveryThreshold: 0,
    defaultDeliveryFee: 0,
  },
}

const SiteStructureContext = createContext<SiteStructure>(DEFAULT_STRUCTURE)

export function SiteStructureProvider({ children }: { children: ReactNode }) {
  const [structure, setStructure] = useState<SiteStructure>(DEFAULT_STRUCTURE)

  useEffect(() => {
    let active = true
    fetch("/api/site/structure", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        if (active && body?.success && body.data) setStructure(body.data as SiteStructure)
      })
      .catch(() => {
        /* keep defaults — storefront always renders */
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <SiteStructureContext.Provider value={structure}>
      {children}
    </SiteStructureContext.Provider>
  )
}

export function useSiteStructure(): SiteStructure {
  return useContext(SiteStructureContext)
}

export function useSiteInfo(): StorefrontSiteInfo {
  return useSiteStructure().settings
}

/** WhatsApp deep-link from the admin-managed number. */
export function useWhatsappHref(): string {
  const { whatsappNumber } = useSiteInfo()
  const digits = (whatsappNumber ?? "").replace(/[^\d]/g, "")
  return `https://wa.me/${digits || "201222464999"}`
}
