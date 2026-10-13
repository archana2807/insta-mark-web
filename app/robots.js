import { absoluteUrl } from "@/lib/seo";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/thank-you"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
