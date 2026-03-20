import { useEffect } from 'react';

declare global {
  interface Window {
    ENABLE_GOOGLE_ADS_PIXEL?: boolean;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function PixelScript() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ENABLE_GOOGLE_ADS_PIXEL === true) {
      // Load Google Tag Manager
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-938087637';
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        window.dataLayer!.push(args);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'AW-938087637');
    }
  }, []);

  return null;
}
