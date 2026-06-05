'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Stethoscope, MapPin, Phone, Award, Building2, Search, RefreshCw, X, IndianRupee } from 'lucide-react';
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

export default function Vets() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [bookingVet, setBookingVet] = useState<Vet | null>(null);

  const loadVets = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const response = await fetch('/api/vets?getAll=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 },
      } as RequestInit);

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

  useEffect(() => {
    void loadVets();
  }, [loadVets]);

  const filteredVets = useMemo(() => {
    return vets.filter((vet) => {
      const matchesSearch =
        vet.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vet.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vet.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vet.profiles?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesCity = !filterCity || vet.city.toLowerCase() === filterCity.toLowerCase();
      const matchesSpecialization =
        !filterSpecialization || vet.specialization.toLowerCase().includes(filterSpecialization.toLowerCase());

      return matchesSearch && matchesCity && matchesSpecialization;
    });
  }, [vets, searchTerm, filterCity, filterSpecialization]);

  const uniqueCities = useMemo(
    () => Array.from(new Set(vets.map((v) => v.city))).sort(),
    [vets]
  );
  const uniqueSpecializations = useMemo(
    () => Array.from(new Set(vets.flatMap((v) => v.specialization.split(',').map((s) => s.trim())))).sort(),
    [vets]
  );

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

      {/* Search and Filters */}
      <div className="mb-8 space-y-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 p-6 shadow-md ring-1 ring-slate-100 dark:ring-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by clinic name, specialization, or location..."
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
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">
              Filter by City
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white"
            >
              <option value="">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">
              Filter by Specialization
            </label>
            <select
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white"
            >
              <option value="">All Specializations</option>
              {uniqueSpecializations.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Skeleton loading state */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonVetCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && loadError && (
        <div className="rounded-3xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-8 text-center">
          <h1 className="text-xl font-semibold text-red-700 dark:text-red-400">Unable to load veterinarians</h1>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">{loadError}</p>
          <button
            type="button"
            onClick={loadVets}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 dark:hover:bg-red-500"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      {/* Vets List */}
      {!loading && !loadError && (
        filteredVets.length === 0 ? (
          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 p-12 text-center shadow-md ring-1 ring-slate-100 dark:ring-slate-800">
            <Stethoscope className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              {searchTerm
                ? `No vets found in "${searchTerm}". Try a different location.`
                : 'No veterinarians found matching your criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVets.map((vet) => (
              <motion.div
                key={vet.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-md ring-1 ring-slate-100 dark:ring-slate-800 transition hover:shadow-lg flex flex-col"
              >
                {/* Clinic Image Cover */}
                <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800">
                  {vet.clinic_image_url ? (
                    <Image
                      src={vet.clinic_image_url}
                      alt={vet.clinic_name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 dark:from-slate-800 to-white dark:to-slate-900 text-slate-300 dark:text-slate-600">
                      <Building2 className="h-12 w-12 opacity-50" />
                    </div>
                  )}
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
                    <div>
                      <h3 className="font-semibold text-dark dark:text-white line-clamp-1">{vet.clinic_name}</h3>
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
                      <a href={`tel:${vet.phone}`} className="text-sm text-primary hover:underline">
                        {vet.phone}
                      </a>
                    </div>

                    {vet.experience_years > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {vet.experience_years} {vet.experience_years === 1 ? 'year' : 'years'} of experience
                      </p>
                    )}

                    {vet.bio && (
                      <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{vet.bio}</p>
                    )}
                  </div>

                  <div className="mt-auto pt-4">
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push('/login');
                        } else {
                          setBookingVet(vet);
                        }
                      }}
                      className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
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
