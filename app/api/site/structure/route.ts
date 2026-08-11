import { NextRequest } from 'next/server'
import { ok, serverError } from '@/services/api-response'
import {
  listNavLinks,
  listFooterLinks,
  listHomepageSections,
  getSiteSettingsRow,
} from '@/services/site-structure-service'

export const dynamic = 'force-dynamic'

/**
 * Public site structure endpoint.
 *
 * GET /api/site/structure
 *
 * Returns the admin-managed nav links, footer links, homepage section order +
 * visibility, and general business info. Used by the storefront Header, Footer,
 * and HomePage so layout/order/visibility come from the database instead of
 * hardcoded JSX. No auth — this is public storefront data.
 */
export async function GET(_request: NextRequest) {
  try {
    const [nav, footer, homepage, settings] = await Promise.all([
      listNavLinks(),
      listFooterLinks(),
      listHomepageSections(),
      getSiteSettingsRow(),
    ])
    return ok({
      nav: nav.filter((l) => l.visible),
      footer,
      homepage: homepage
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order),
      settings: {
        businessName: settings.business_name,
        logoUrl: settings.logo_url,
        phonePrimary: settings.phone_primary,
        phoneSecondary: settings.phone_secondary,
        address: settings.address,
        whatsappNumber: settings.whatsapp_number,
        facebookUrl: settings.facebook_url,
        instagramUrl: settings.instagram_url,
        tiktokUrl: settings.tiktok_url,
        minOrderValue: settings.min_order_value,
        freeDeliveryThreshold: settings.free_delivery_threshold,
        defaultDeliveryFee: settings.default_delivery_fee,
      },
    })
  } catch (err) {
    console.error('Site structure error', err)
    return serverError('فشل تحميل بنية الموقع')
  }
}
