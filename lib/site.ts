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
  FaqItem,
  PaymentMethod,
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
  tagline: "وفر العمله واشتري من الجمله",
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
 * ⚠️ Only real brands that already appear in the demo catalog are listed.
 * Do NOT fabricate partnerships / official distribution.
 */
export const brands: string[] = ["ليبتون"];

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
    a: "بعد تأكيد الطلب عبر واتساب أو الهاتف، بنتواصل معاك لنوافيك بحالة الطلب.",
    editable: true,
  },
  {
    id: "f6",
    q: "كيف أتواصل مع المتجر؟",
    a: "تواصل معنا على واتساب 01222464999 أو الهاتف 01090787378.",
  },
  {
    id: "f7",
    q: "هل يمكنني الطلب عن طريق واتساب؟",
    a: "نعم، اضغط زر الواتساب أو أنهي طلبك من السلة وسيتم تجهيز الطلب وتأكيده معك.",
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
