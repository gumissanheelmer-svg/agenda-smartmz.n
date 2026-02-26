import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const REFERRAL_KEY = 'agenda_smart_ref';

export function useReferral() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.trim()) {
      localStorage.setItem(REFERRAL_KEY, ref.trim());
    }
  }, [searchParams]);
}

export function getReferralCode(): string | null {
  return localStorage.getItem(REFERRAL_KEY);
}

export function clearReferralCode() {
  localStorage.removeItem(REFERRAL_KEY);
}
