import Script from "next/script";

const DEFAULT_GTM_ID = "GTM-KNF82HBW";

export function GoogleTagManager({ gtmId = DEFAULT_GTM_ID }: { gtmId?: string }) {
  if (!gtmId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
        strategy="afterInteractive"
      />
      <Script id="gtm-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
