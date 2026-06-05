'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { X, PawPrint } from 'lucide-react';

const DISMISSED_KEY = 'aniwoo_profile_banner_dismissed';

type ProfileData = {
  profile_completed?: boolean;
  pincode?: string | null;
  pets?: unknown[];
  role?: string;
  clinic_pincode?: string | null;
};

export function ProfileCompletionBanner() {
  const { isAuthenticated, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Check sessionStorage — if dismissed this session, don't show
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DISMISSED_KEY)) {
        return;
      }
    } catch { /* ignore */ }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        const data = payload?.data as ProfileData | null;
        if (!data) return;

        setProfileData(data);

        const isPetOwner = data.role === 'pet_owner' || !data.role;
        const isVet = data.role === 'vet';

        const isIncomplete =
          data.profile_completed === false ||
          (isPetOwner && (!data.pincode || !Array.isArray(data.pets) || data.pets.length === 0)) ||
          (isVet && !data.clinic_pincode);

        if (isIncomplete) {
          setVisible(true);
        }
      } catch { /* ignore */ }
    };

    void fetchProfile();
  }, [isAuthenticated, user]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible || !isAuthenticated) return null;

  return (
    <div
      role="alert"
      className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-primary/90 to-orange-500/90 backdrop-blur-sm text-white px-4 py-3 sm:px-6"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-center sm:text-left">
        <PawPrint className="h-4 w-4 shrink-0" />
        <span>
          🐾 Complete your profile to get location-based vet recommendations and personalized care!
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/profile"
          className="rounded-full bg-white/20 hover:bg-white/30 px-4 py-1.5 text-xs font-bold text-white transition"
        >
          Complete Now
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="rounded-full p-1 hover:bg-white/20 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
