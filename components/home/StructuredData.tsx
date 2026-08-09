import { logoUrl } from "@/lib/data";
import { SITE } from "@/lib/site";
import { env } from "@/lib/env";

type OrganizationLdJson = {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  alternateName?: string;
  url: string;
  logo: string;
  telephone: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  sameAs: string[];
  openingHoursSpecification: Array<{
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
};

/**
 * Serialize JSON-LD safely for injection inside a <script> tag.
 * Escaping `<` prevents an injected `</script>` from breaking out of the tag.
 */
function toJsonLd(data: OrganizationLdJson): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Server-rendered JSON-LD structured data for the storefront.
 * Injected as a side effect (no client hydration) via a script tag.
 */
export default function StructuredData() {
  const json: OrganizationLdJson = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    alternateName: SITE.nameEn || undefined,
    url: env.NEXT_PUBLIC_APP_URL,
    logo: logoUrl,
    // International format with country code (+20), no leading zero.
    telephone: `+${SITE.whatsapp}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.addressLines.join("، "),
      addressLocality: "كفر شكر",
      addressRegion: "القليوبية",
      addressCountry: "EG",
    },
    sameAs: [
      SITE.social.facebook,
      SITE.social.instagram,
      SITE.social.tiktok,
      `https://wa.me/${SITE.whatsapp}`,
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
        ],
        opens: "08:00",
        closes: "22:00",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(json) }}
    />
  );
}

