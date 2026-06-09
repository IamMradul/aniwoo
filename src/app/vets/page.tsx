'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Stethoscope, MapPin, Phone, Award, Building2, Search, RefreshCw, X, IndianRupee, Heart } from 'lucide-react';
import { SkeletonVetCard } from '@/components/vets/SkeletonVetCard';

// Dynamic import of the booking modal — not in the initial bundle
const BookingModal = dynamic(() => import('@/components/vets/BookingModal'), { ssr: false });

type Vet = {
  id: string;
  user_id: string;
  clinic_name: string;
  specialization: string;
  location: string;
  city: string;
  state: string;
  phone: string;
  experience_years: number;
  qualifications: string;
  bio: string | null;
  clinic_image_url: string | null;
  clinic_image_urls?: string[];
  consultation_fee: number | null;
  profiles?: {
    name: string;
    email: string;
  };
};

type UserProfile = {
  pincode?: string | null;
  city?: string | null;
};

export default function Vets() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search / filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');

  // Booking
  const [bookingVet, setBookingVet] = useState<Vet | null>(null);

  // User location profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [noLocationBanner, setNoLocationBanner] = useState(false);

  // Saved vets (user_id values of saved vets)
  const [savedVetIds, setSavedVetIds] = useState<Set<string>>(new Set());
  const [savingVetId, setSavingVetId] = useState<string | null>(null);

  // Show all (override location collapse)
  const [showAll, setShowAll] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the search term
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchTerm]);

  const loadVets = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const response = await fetch('/api/vets?getAll=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Failed to load vets: ${response.statusText}`);
      }

      const { data: vetsData } = await response.json();
      setVets(vetsData || []);
    } catch (error) {
      setVets([]);
      setLoadError(error instanceof Error ? error.message : 'Failed to load veterinarians.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user's profile for pincode-based filtering
  const loadUserProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch('/api/profile', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      const data = payload?.data;
      if (data) {
        setUserProfile({ pincode: data.pincode, city: data.city });
        if (!data.pincode) setNoLocationBanner(true);
      }
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  // Load saved vet IDs for the current user
  const loadSavedVets = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch('/api/saved-vets', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      const ids = new Set<string>(
        (payload?.data || []).map((v: { user_id: string }) => v.user_id)
      );
      setSavedVetIds(ids);
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadVets();
    void loadUserProfile();
    void loadSavedVets();
  }, [loadVets, loadUserProfile, loadSavedVets]);

  const handleToggleSave = async (vet: Vet) => {
    if (!isAuthenticated) {
      router.push('/login?returnTo=/vets');
      return;
    }

    setSavingVetId(vet.user_id);
    const alreadySaved = savedVetIds.has(vet.user_id);

    try {
      if (alreadySaved) {
        await fetch(`/api/saved-vets?vet_id=${encodeURIComponent(vet.user_id)}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        setSavedVetIds((prev) => {
          const next = new Set(prev);
          next.delete(vet.user_id);
          return next;
        });
      } else {
        await fetch('/api/saved-vets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ vet_id: vet.user_id }),
        });
        setSavedVetIds((prev) => new Set(prev).add(vet.user_id));
      }
    } catch { /* ignore */ } finally {
      setSavingVetId(null);
    }
  };

  // Memoize filtered + sorted vets
  const { nearbyVets, sameCityVets, otherVets, filteredVets } = useMemo(() => {
    const userPincode = userProfile?.pincode;
    const userCity = userProfile?.city?.toLowerCase();

    let result = vets.filter((vet) => {
      const matchesSearch =
        !debouncedSearch ||
        vet.clinic_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        vet.specialization.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        vet.city.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (vet.location && vet.location.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (vet.profiles?.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ?? false);

      const matchesCity = !filterCity || vet.city.toLowerCase() === filterCity.toLowerCase();
      const matchesSpec = !filterSpecialization || vet.specialization.toLowerCase().includes(filterSpecialization.toLowerCase());

      return matchesSearch && matchesCity && matchesSpec;
    });

    // If no location or search active — return flat
    if (!userPincode || debouncedSearch || filterCity || filterSpecialization) {
      return { nearbyVets: [], sameCityVets: [], otherVets: [], filteredVets: result };
    }

    const nearby: Vet[] = [];
    const sameCity: Vet[] = [];
    const other: Vet[] = [];

    result.forEach((vet) => {
      const vetPincode = (vet as Vet & { pincode?: string }).pincode;
      if (vetPincode && vetPincode === userPincode) {
        nearby.push(vet);
      } else if (userCity && vet.city?.toLowerCase() === userCity) {
        sameCity.push(vet);
      } else {
        other.push(vet);
      }
    });

    return { nearbyVets: nearby, sameCityVets: sameCity, otherVets: other, filteredVets: result };
  }, [vets, debouncedSearch, filterCity, filterSpecialization, userProfile]);

  const uniqueCities = useMemo(() => Array.from(new Set(vets.map((v) => v.city))).sort(), [vets]);
  const uniqueSpecializations = useMemo(
    () => Array.from(new Set(vets.flatMap((v) => v.specialization.split(',').map((s) => s.trim())))).sort(),
    [vets]
  );

  const isLocationMode = isAuthenticated && userProfile?.pincode && !debouncedSearch && !filterCity && !filterSpecialization;

  const renderVetCard = (vet: Vet, index: number, badge?: 'nearby' | 'city') => {
    const isSaved = savedVetIds.has(vet.user_id);
    const isSaving = savingVetId === vet.user_id;

    return (
      <motion.div
        key={vet.id}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: Math.min(index * 0.05, 0.3) }}
        className="overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md ring-1 ring-slate-100 dark:ring-slate-800 transition hover:shadow-lg flex flex-col"
      >
        {/* Clinic Image Cover */}
        <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800">
          {vet.clinic_image_url ? (
            <Link href={`/vets/${vet.id}`}>
              <Image
                src={vet.clinic_image_url}
                alt={vet.clinic_name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </Link>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 dark:from-slate-800 to-white dark:to-slate-900 text-slate-300 dark:text-slate-600">
              <Building2 className="h-12 w-12 opacity-50" />
            </div>
          )}

          {/* Nearby / City badge */}
          {badge === 'nearby' && (
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-green-500/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
              <MapPin className="h-3 w-3" /> Near You
            </span>
          )}
          {badge === 'city' && (
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-blue-500/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
              <MapPin className="h-3 w-3" /> Same City
            </span>
          )}

          {/* Save/Bookmark button */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => handleToggleSave(vet)}
            disabled={isSaving}
            aria-label={isSaved ? 'Unsave vet' : 'Save vet'}
            className={`absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition disabled:opacity-50 ${isSaved ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-slate-900/80 text-slate-400 hover:text-red-500'}`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </motion.button>

          {/* Consultation Fee Badge */}
          {vet.consultation_fee && (
            <div className="absolute bottom-3 right-3 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 text-sm font-bold text-dark dark:text-white shadow-sm ring-1 ring-slate-900/5">
              <span className="flex items-center">
                <IndianRupee className="h-3.5 w-3.5 mr-0.5" />{vet.consultation_fee}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <Link href={`/vets/${vet.id}`} className="font-semibold text-lg text-dark dark:text-white line-clamp-1 hover:text-primary hover:underline">
                {vet.clinic_name}
              </Link>
              {vet.profiles && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Dr. {vet.profiles.name}</p>
              )}
            </div>
            <Stethoscope className="h-6 w-6 text-primary shrink-0 ml-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Award className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{vet.specialization}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{vet.qualifications}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{vet.location}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{vet.city}, {vet.state}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" />
              <a href={`tel:${vet.phone}`} className="text-sm text-primary hover:underline">{vet.phone}</a>
            </div>

            {vet.experience_years > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vet.experience_years} {vet.experience_years === 1 ? 'year' : 'years'} of experience
              </p>
            )}

            {vet.bio && <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{vet.bio}</p>}
          </div>

          <div className="mt-auto pt-4 flex gap-3">
            <Link
              href={`/vets/${vet.id}`}
              className="flex-1 text-center rounded-full border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white"
            >
              View Profile
            </Link>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  router.push('/login');
                } else {
                  setBookingVet(vet);
                }
              }}
              className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Book Now
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-dark dark:text-white sm:text-3xl">Vet Directory</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Connect with trusted, certified veterinarians in your area and book appointments with ease.
          </p>
        </div>
        <button
          onClick={loadVets}
          className="flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:border-primary hover:text-primary"
          title="Refresh vet listings"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* No location banner */}
      {isAuthenticated && noLocationBanner && !debouncedSearch && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>Set your location in your <a href="/profile" className="font-semibold underline">profile</a> to see nearby vets first.</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-8 space-y-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 p-6 shadow-md ring-1 ring-slate-100 dark:ring-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by city, area, or pincode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-10 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">Filter by City</label>
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white">
              <option value="">All Cities</option>
              {uniqueCities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">Filter by Specialization</label>
            <select value={filterSpecialization} onChange={(e) => setFilterSpecialization(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white">
              <option value="">All Specializations</option>
              {uniqueSpecializations.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Skeleton loading state */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonVetCard key={i} />)}
        </div>
      )}

      {/* Error state */}
      {!loading && loadError && (
        <div className="rounded-3xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-8 text-center">
          <h1 className="text-xl font-semibold text-red-700 dark:text-red-400">Unable to load veterinarians</h1>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">{loadError}</p>
          <button type="button" onClick={loadVets} className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      )}

      {/* Vets List */}
      {!loading && !loadError && (
        filteredVets.length === 0 ? (
          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 p-12 text-center shadow-md ring-1 ring-slate-100 dark:ring-slate-800">
            <Stethoscope className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              {debouncedSearch ? `No vets found in "${debouncedSearch}". Try a different location.` : 'No veterinarians found matching your criteria.'}
            </p>
          </div>
        ) : isLocationMode ? (
          // Location-based grouped view
          <div className="space-y-10">
            {nearbyVets.length > 0 && (
              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-green-600 dark:text-green-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Near You ({nearbyVets.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {nearbyVets.map((vet, i) => renderVetCard(vet, i, 'nearby'))}
                </div>
              </div>
            )}
            {sameCityVets.length > 0 && (
              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Same City ({sameCityVets.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sameCityVets.map((vet, i) => renderVetCard(vet, i, 'city'))}
                </div>
              </div>
            )}
            {otherVets.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Other Vets ({otherVets.length})
                  </h2>
                  {!showAll && (
                    <button onClick={() => setShowAll(true)} className="text-sm font-semibold text-primary hover:underline">
                      Show All Vets
                    </button>
                  )}
                </div>
                {showAll && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {otherVets.map((vet, i) => renderVetCard(vet, i))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Standard flat list
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVets.map((vet, i) => renderVetCard(vet, i))}
          </div>
        )
      )}

      {/* Dynamically loaded Booking Modal */}
      {bookingVet && (
        <BookingModal
          vet={bookingVet}
          onClose={() => setBookingVet(null)}
        />
      )}
    </main>
  );
}
