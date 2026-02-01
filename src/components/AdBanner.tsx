import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// Configuration
const ADSENSE_PID = 'ca-pub-YOUR_PUBLISHER_ID'; // User to replace
const ADSENSE_SLOT = 'YOUR_SLOT_ID';           // User to replace

// AdMob Test ID for Android Banner. Replace with real ID in production.
const ADMOB_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';

interface AdBannerProps {
    className?: string;
}

export function AdBanner({ className }: AdBannerProps) {
    const isNative = Capacitor.isNativePlatform();
    const adSenseInitialized = useRef(false);

    useEffect(() => {
        if (isNative) {
            // NATIVE: AdMob Logic
            const showBanner = async () => {
                try {
                    // Initialize AdMob (can be called multiple times safely)
                    await AdMob.initialize();

                    const options = {
                        adId: ADMOB_BANNER_ID,
                        adSize: BannerAdSize.BANNER,
                        position: BannerAdPosition.BOTTOM_CENTER,
                        margin: 0,
                        isTesting: true, // Remove in production
                    };

                    await AdMob.showBanner(options);
                } catch (e) {
                    console.error('AdMob Error:', e);
                }
            };

            showBanner();

            // Cleanup: Hide banner when component unmounts (optional, depending on UX)
            // For a persistent bottom bar, we might not want to hide it.
            // But if this component is removed, we should probably hide.
            return () => {
                // AdMob.hideBanner().catch(console.error);
            };
        } else {
            // WEB: AdSense Logic
            if (!adSenseInitialized.current) {
                try {
                    // Inject AdSense script dynamicallly if not present
                    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
                        const script = document.createElement('script');
                        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PID}`;
                        script.async = true;
                        script.crossOrigin = "anonymous";
                        document.head.appendChild(script);
                    }

                    // Push the ad
                    (window as any).adsbygoogle = (window as any).adsbygoogle || [];
                    (window as any).adsbygoogle.push({});
                    adSenseInitialized.current = true;
                } catch (e) {
                    console.error('AdSense Error:', e);
                }
            }
        }
    }, [isNative]);

    if (isNative) {
        // Native ads are overlays, so we render a spacer div to prevent content being hidden behind the ad
        return <div className="h-[50px] w-full" />;
    }

    return (
        <div className={`w-full flex justify-center my-4 overflow-hidden ${className}`}>
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={ADSENSE_PID}
                data-ad-slot={ADSENSE_SLOT}
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
        </div>
    );
}
