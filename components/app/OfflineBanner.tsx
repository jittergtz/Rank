'use client';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
    const isOnline = useNetworkStatus();
    const [showBanner, setShowBanner] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            setShowBanner(true);
            setWasOffline(true);
        } else if (wasOffline) {
            // Timer für das Ausblenden des Online-Banners
            const timer = setTimeout(() => setShowBanner(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, wasOffline]);

    return (
        <div>
            {showBanner && (
                <div>
                    {isOnline ? (
                        <h1>
                            <Wifi className="inline mr-2" />
                            Du bist online. Alle Funktionen sind verfügbar.
                        </h1>
                    ) : (
                        <h1>
                            <WifiOff className="inline mr-2" />
                            Du bist offline. Einige Funktionen sind möglicherweise nicht verfügbar.
                        </h1>
                    )}
                </div>
            )}
        </div>
    );
}
