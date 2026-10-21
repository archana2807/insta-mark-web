import Script from "next/script";

/**
 * GA4 via gtag.js, loaded after the page is interactive. Rendered only when
 * NEXT_PUBLIC_GA_ID is set. Page views on client-side navigation are tracked
 * by GA4 "Enhanced measurement → page changes based on browser history".
 */
export default function GoogleAnalytics({ id }) {
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config',${JSON.stringify(id)},{anonymize_ip:true});`}
      </Script>
    </>
  );
}
