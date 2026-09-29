import type { MetadataRoute } from "next"
import { isIndexableDeployment, SITE_ORIGIN } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  // `all` and `admin` stay crawlable so engines can read noindex and drop the URL.
  if (!isIndexableDeployment()) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
      },
    }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin is noindex via meta and X-Robots-Tag. Do not Disallow it: crawlers
      // have to fetch the page to honor noindex.
      disallow: ["/api/"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  }
}
