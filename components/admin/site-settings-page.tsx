"use client"

import { useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { GeneralSettingsPage } from "@/components/admin/site-settings-general"
import { NavigationEditor } from "@/components/admin/site-settings-nav"
import { FooterEditor } from "@/components/admin/site-settings-footer"
import { HomepageLayoutManager } from "@/components/admin/site-settings-homepage"
import { CategoryManager } from "@/components/admin/site-settings-categories"
import { DeliveryZonesManager } from "@/components/admin/site-settings-delivery"
import { StaticPagesEditor } from "@/components/admin/site-settings-pages"
import { SeoSettingsPage } from "@/components/admin/site-settings-seo"

const TABS = [
  { key: "general", label: "عام" },
  { key: "nav", label: "التنقل" },
  { key: "footer", label: "التذييل" },
  { key: "homepage", label: "الصفحة الرئيسية" },
  { key: "categories", label: "الأقسام" },
  { key: "delivery", label: "التوصيل" },
  { key: "pages", label: "الصفحات" },
  { key: "seo", label: "SEO" },
] as const

type TabKey = (typeof TABS)[number]["key"]

export function SiteSettingsPage() {
  const [tab, setTab] = useState<TabKey>("general")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="إعدادات الموقع" description="تحكم كامل في بنية الموقع وإعداداته من قاعدة البيانات" />

      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? "border-b-2 border-brand-green text-brand-green" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "general" && <GeneralSettingsPage />}
        {tab === "nav" && <NavigationEditor />}
        {tab === "footer" && <FooterEditor />}
        {tab === "homepage" && <HomepageLayoutManager />}
        {tab === "categories" && <CategoryManager />}
        {tab === "delivery" && <DeliveryZonesManager />}
        {tab === "pages" && <StaticPagesEditor />}
        {tab === "seo" && <SeoSettingsPage />}
      </div>
    </div>
  )
}
