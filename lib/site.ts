/**
 * سوق الجملة — Central storefront configuration.
 *
 * Everything here is CONFIGURATION-DRIVEN so it can be replaced from the admin
 * dashboard / database later WITHOUT rewriting UI components.
 *
 * ⚠️ DATA NOTES:
 *  - Real business facts (name, phones, address, social links) come from the
 *    supplied business information.
 *  - Anything not confirmed (prices, reviews, delivery fees, payment methods,
 *    brand partnerships) is explicit DEMO / PLACEHOLDER data flagged below so it
 *    is easy to swap for real data.
 */

import type {
  Category,
  Brand,
  FaqItem,
  PaymentMethod,
  SocialPost,
  StoreFeature,
  Testimonial,
} from "./types";

/**
 * Build a reliable Unsplash image URL for a given photo id.
 * Centralizes sizing/quality tokens so every storefront image uses a
 * consistent, sharp, correctly-cropped rendering.
 */
function image(photoId: string, width = 800, height?: number): string {
  const h = height ? `&h=${height}` : "";
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}${h}&q=80`;
}

export const SITE = {
  name: "سوق الجملة",
  nameEn: "Souk Elgomla",
  tagline: "وفر العملة واشتري من الجملة",
  description: "منتجات غذائية ومنزلية بأسعار الجملة للجميع.",
  // Location — supplied by the business.
  location: "كفر شكر، القليوبية، مصر",
  addressLines: [
    "شارع جمال عبد الناصر — خلف مسجد آل عطا الله",
    "ميدان كفر شكر — المساكن أمام مكتب العمل",
    "بجوار كافيتريا الملوك",
  ],
  // Phones — supplied by the business.
  phoneMain: "01222464999",
  phoneAlt: "01090787378",
  // WhatsApp in international format (Egypt +20, drop leading 0).
  whatsapp: "201222464999",
  // Social — supplied by the business (official profiles).
  social: {
    facebook: "https://www.facebook.com/share/1FZUWgbRkR/",
    instagram: "https://www.instagram.com/soukelgomla?igsh=c2xiNHB4NmN6ZWx5",
    tiktok: "https://www.tiktok.com/@soukelgomla?_r=1&_t=ZS-98iXStBXwBw",
  },
};

export const telMain = `tel:${SITE.phoneMain}`;
export const telAlt = `tel:${SITE.phoneAlt}`;
export const waLink = `https://wa.me/${SITE.whatsapp}`;

/**
 * Homepage categories (15).
 * ⚠️ Images are demo placeholders — replace with real category photos when the
 * admin catalog is connected.
 */
export const categories: Category[] = [
  {
    id: "byBulk",
    name: "بالكرتون",
    image: image("photo-1607083206869-4c7672e72a8a"),
  },
  {
    id: "supermarket",
    name: "السوبرماركت والبقالة",
    image: image("photo-1542838132-92c53300491e"),
  },
  {
    id: "offers",
    name: "العروض",
    image: image("photo-1556742049-0cfed4f6a45d"),
  },
  {
    id: "ricePasta",
    name: "الأرز والمكرونات",
    image: image("photo-1586201375761-83865001e31c"),
  },
  {
    id: "spices",
    name: "البهارات",
    image: image("photo-1596040033229-a9821ebd058d"),
  },
  {
    id: "oils",
    name: "الزيوت",
    image: image("photo-1474979266404-7eaacbcd87c5"),
  },
  {
    id: "drinks",
    name: "المياه والمرطبات",
    image: image("photo-1523362628745-0c100150b504"),
  },
  {
    id: "sugarTeaCoffee",
    name: "السكر والشاي والقهوة",
    image: image("photo-1447933601403-0c6688de566e"),
  },
  {
    id: "dairy",
    name: "مشتقات الألبان",
    image: image("photo-1550583724-b2692b85b150"),
  },
  {
    id: "sauces",
    name: "الصلصات",
    image: image("photo-1556910103-1c02745aae4d"),
  },
  {
    id: "canned",
    name: "المعلبات",
    image: image("photo-1584269600464-37b1b58a9fe7"),
  },
  {
    id: "bakery",
    name: "المخبوزات والبسكويت",
    image: image("photo-1509440159596-0249088772ff"),
  },
  {
    id: "cleaning",
    name: "المنظفات",
    image: image("photo-1585421514738-01798e348b17"),
  },
  {
    id: "baby",
    name: "العناية بالطفل",
    image: image("photo-1555252333-9f8e92e65df9"),
  },
  {
    id: "byPiece",
    name: "بالحبة",
    image: image("photo-1542838132-92c53300491e"),
  },
];

/**
 * Store features — only claims matching real business capabilities.
 */
export const storeFeatures: StoreFeature[] = [
  {
    id: "wholesale",
    title: "أسعار جملة للجميع",
    description: "أسعار جملة وقطاعي تناسب البيت والمحل معاً.",
  },
  {
    id: "delivery",
    title: "توصيل سريع",
    description: "توصيل في كفر شكر والمناطق المجاورة — يتأكد معك عند الطلب.",
  },
  {
    id: "secure",
    title: "طلب آمن",
    description: "تأكيد الطلب عبر واتساب أو الهاتف قبل التوصيل.",
  },
];

/**
 * Payment methods — configuration-driven.
 * Only CASH ON DELIVERY is implemented in the current checkout flow.
 * ⚠️ Do not claim methods that are not configured yet.
 */
export const paymentMethods: PaymentMethod[] = [
  {
    id: "cash",
    label: "الدفع كاش عند الاستلام",
    note: "متاح حالياً",
    available: true,
  },
];

/**
 * Brands strip — neutral "العلامات المتوفرة" presentation.
 * ⚠️ Logo URLs are PLACEHOLDER data URIs. Replace with Cloudinary secure_url
 * values from the category_media / product_media tables when real brand assets
 * are uploaded via the admin dashboard.
 */
export const brands: Brand[] = [
  {
    id: "lipton",
    name: "ليبتون",
    name_en: "Lipton",
    logo_url: "/brands/lipton.svg",
  },
  {
    id: "pepsi",
    name: "بيبسي",
    name_en: "Pepsi",
    logo_url: "/brands/pepsi.svg",
  },
  {
    id: "nescafe",
    name: "نسكافيه",
    name_en: "Nescafé",
    logo_url: "/brands/nescafe.svg",
  },
  {
    id: "indomie",
    name: "إندومي",
    name_en: "Indomie",
    logo_url: "/brands/indomie.svg",
  },
  {
    id: "fine",
    name: "فاين",
    name_en: "Fine",
    logo_url: "/brands/fine.svg",
  },
  {
    id: "juhayna",
    name: "جهينة",
    name_en: "Juhayna",
    logo_url: "/brands/juhayna.svg",
  },
];

/**
 * Customer testimonials.
 * ⚠️ Demo content only — no verified reviews are available yet. Marked `demo`
 * so it is easy to replace with real, verified reviews from the admin later.
 */
export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "عميل (بيانات تجريبية)",
    role: "سوق الجملة",
    text: "شريت بأسعار جملة مناسبة للبيت، والتوصيل كان سريع في كفر شكر.",
    demo: true,
  },
  {
    id: "t2",
    name: "عميل (بيانات تجريبية)",
    role: "سوق الجملة",
    text: "تعامل محترم وأسعار أحسن من السوق، اتعاملت معاهم أكتر من مرة.",
    demo: true,
  },
];

/**
 * FAQ — answers based on the actual configured business data.
 * Where an answer may vary, it is flagged `editable` so it can be managed from
 * the admin settings later.
 */
export const faqs: FaqItem[] = [
  {
    id: "f1",
    q: "هل الأسعار أسعار جملة؟",
    a: "نعم، نبيع بأسعار جملة وقطاعي. قائمة الأسعار الحالية متاحة عند الطلب أو عبر واتساب.",
    editable: true,
  },
  {
    id: "f2",
    q: "هل يمكن الشراء بالحبة؟",
    a: "نعم، عندنا أقسام للشراء بالحبة وبالكرتون حسب احتياجك.",
  },
  {
    id: "f3",
    q: "هل المنتجات متاحة باستمرار؟",
    a: "بنحرص على توفر المنتجات الأساسية باستمرار. لتأكيد توفر صنف معين تواصل معنا عبر واتساب أو الهاتف.",
    editable: true,
  },
  {
    id: "f4",
    q: "هل يوجد توصيل في كفر شكر؟",
    a: "نوصل في كفر شكر والمناطق المجاورة. للاستفسار عن مناطق ورسوم التوصيل تواصل معنا على الواتساب أو الهاتف.",
    editable: true,
  },
  {
    id: "f5",
    q: "كيف يمكنني متابعة طلبي؟",
    a: "بعد تأكيد الطلب من الموقع، بنتواصل معاك بالهاتف لنوافيك بحالة الطلب ووقت التوصيل.",
    editable: true,
  },
  {
    id: "f6",
    q: "كيف أتواصل مع المتجر؟",
    a: "تواصل معنا على واتساب 01222464999 أو الهاتف 01090787378.",
  },
  {
    id: "f7",
    q: "كيف أطلب من الموقع؟",
    a: "أضف المنتجات للسلة من صفحة المتجر، ثم اتمم طلبك من السلة وادفع كاش عند الاستلام — هيوصلك رقم طلب فورًا.",
  },
  {
    id: "f8",
    q: "أين يقع المحل؟",
    a: "كفر شكر، القليوبية — شارع جمال عبد الناصر خلف مسجد آل عطا الله، ميدان كفر شكر، بجوار كافيتريا الملوك.",
  },
];

/**
 * Delivery configuration (demo placeholders).
 * ⚠️ Values reflect the EXISTING site behavior and can be changed from the
 * admin. Delivery fees/coverage are NOT final business data.
 */
export const delivery = {
  fee: 25,
  freeAbove: 300,
  demo: true,
};

/**
 * Hero photography config — the REAL Souq El Gomla shop photo.
 *
 * The hero is designed around an actual photo of the shop (supporting the
 * existing asset system):
 *   - `publicId` → a Cloudinary public_id, rendered through `heroImageUrl()`
 *   - `image`    → any direct image URL (e.g. a file dropped in `public/photos/`)
 *
 * Until the business shares the real photo, leave BOTH empty — the storefront
 * renders an intentional branded deep-green fallback instead of generic
 * supermarket/mall stock photography.
 */
export type HeroConfig = {
  /** Cloudinary public_id of the real shop photo (takes priority). */
  publicId?: string
  /** Direct image URL used when `publicId` is empty. */
  image?: string
  /** Accessible label for the photo. */
  alt?: string
}

export const heroConfig: HeroConfig = {
  // publicId: "souq-el-gomla/shop-front", // ← real photo goes here
  // image: "/photos/shop-front.jpg",      // ← or here (place file in public/)
  alt: "واجهة محل سوق الجملة — كفر شكر، القليوبية",
}

/**
 * Latest social content — "📱 شوف عروضنا أول بأول".
 *
 * These are the posts the business publishes every day (offers, videos from
 * inside the shop, new deliveries). The storefront renders them as real social
 * cards on the homepage.
 *
 * ⚠️ PLACEHOLDER LIST — until the admin-managed social post system ships, this
 * config list stands in for the future `GET /api/social` payload. The shape
 * (see `lib/types.ts` `SocialPost`) is identical so the UI can switch to a
 * backend without changes. When a post is the "عرض النهارده", set
 * `featured: true` — it is the same flag that will pop it into the daily
 * offers section in the future workflow.
 */
export const socialPosts: SocialPost[] = [
  {
    id: 'sp-fb-today',
    platform: 'facebook',
    url: SITE.social.facebook,
    title: '🔥 عروض النهارده — كله بأسعار الجملة',
    caption:
      'بننشر عروض اليوم على الصفحة من الصبح — تفاصيل كل عرض وأقرب وصوله في المنشور.',
    date: '2026-08-09T10:15:00+02:00',
    featured: true,
  },
  {
    id: 'sp-tt-today',
    platform: 'tiktok',
    url: SITE.social.tiktok,
    title: 'جولة جوه المحل 🏪',
    caption:
      'فيديو عرض النهارده على تيك توك — الصورة من الرف ده هي اللي بتتشاف جوه السوق.',
    date: '2026-08-09T09:40:00+02:00',
    featured: true,
  },
  {
    id: 'sp-ig-offer',
    platform: 'instagram',
    url: SITE.social.instagram,
    title: 'كرتونة × 24 بأحسن سعر 💥',
    caption:
      'السعر ده للكرتونة كاملة — اتصفح الموقع وضيف اللي تحبه للسلة قبل ما الكمية تخلص.',
    date: '2026-08-08T18:30:00+02:00',
  },
  {
    id: 'sp-fb-arrival',
    platform: 'facebook',
    url: SITE.social.facebook,
    title: 'وصلت مصنعيات جديدة 🚚',
    caption:
      'تشكيلة جديدة نزلت على رفوف المحل — اتصفح الموقع وحِدّد اللي محتاجه من السلة.',
    date: '2026-08-07T13:00:00+02:00',
  },
]
