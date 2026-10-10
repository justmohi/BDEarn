import React, { useEffect, useRef } from 'react';

/**
 * Website ads use AdSense, not the Android-only AdMob App/Ad Unit IDs.
 * Configure VITE_ADSENSE_CLIENT_ID and VITE_ADSENSE_HOME_SLOT in Netlify.
 * The component stays absent until a real AdSense publisher ID and slot are provided.
 */
export const WebsiteAdSlot: React.FC = () => {
  const pushed = useRef(false);
  const clientId = (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined)?.trim();
  const slotId = (import.meta.env.VITE_ADSENSE_HOME_SLOT as string | undefined)?.trim();

  useEffect(() => {
    if (!clientId || !slotId || pushed.current) return;

    const scriptId = 'earn-bd-adsense-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      document.head.appendChild(script);
    }

    const initializeAd = () => {
      if (pushed.current) return;
      try {
        ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle =
          (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
        pushed.current = true;
      } catch (error) {
        console.warn('AdSense slot initialization failed:', error);
      }
    };

    if (script.dataset.loaded === 'true') initializeAd();
    else {
      script.addEventListener('load', () => {
        script!.dataset.loaded = 'true';
        initializeAd();
      }, { once: true });
      script.addEventListener('error', () => {
        console.warn('AdSense script could not be loaded.');
      }, { once: true });
    }
  }, [clientId, slotId]);

  if (!clientId || !slotId) return null;

  return (
    <section aria-label="Advertisement" className="my-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 sm:p-4">
      <div className="mb-2 text-center text-[10px] font-medium uppercase tracking-widest text-slate-500">Advertisement</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 100, width: '100%' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </section>
  );
};
