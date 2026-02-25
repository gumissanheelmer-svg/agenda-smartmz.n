import { useState, useEffect } from 'react';
import { getLandingSettings, DEFAULT_LANDING_SETTINGS, type LandingSettings } from '@/lib/landingSettings';

export function useLandingSettings() {
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT_LANDING_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getLandingSettings().then((s) => {
      if (!cancelled) {
        setSettings(s);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return { settings, isLoading };
}
