'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Stethoscope, MapPin, Phone, Award, Building2, IndianRupee, Heart, ArrowLeft, Clock, Info } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

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

export default function VetProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [vet, setVet] = useState<Vet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  const [savedVetIds, setSavedVetIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchVet = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/vets/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to load vet details');
        }
        const { data } = await response.json();
        setVet(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVet();
  }, [params.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadSavedVets = async () => {
      try {
        const response = await fetch('/api/saved-vets', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        const ids = new Set<string>(
          (payload?.data || []).map((v: { user_id: string }) => v.user_id)
        );
        setSavedVetIds(ids);
      } catch { /* ignore */ }
    };
    loadSavedVets();
  }, [isAuthenticated]);

  const handleToggleSave = async () => {
    if (!vet) return;
    if (!isAuthenticated) {
      router.push(`/login?returnTo=/vets/${vet.id}`);
      return;
    }

    setSaving(true);
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
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !vet) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-12">
          <Stethoscope className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h1 className="text-xl font-semibold text-red-700 dark:text-red-400">Vet not found</h1>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error || 'The veterinarian you are looking for does not exist or has been removed.'}</p>
          <button onClick={() => router.push('/vets')} className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </button>
        </div>
      </div>
    );
  }

  const isSaved = savedVetIds.has(vet.user_id);
  const images = vet.clinic_image_urls && vet.clinic_image_urls.length > 0 
    ? vet.clinic_image_urls 
    : vet.clinic_image_url ? [vet.clinic_image_url] : [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <button 
        onClick={() => router.back()} 
        className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 shadow-md ring-1 ring-slate-100 dark:ring-slate-800"
          >
            {/* Gallery / Cover Image */}
            <div className="relative h-64 sm:h-80 w-full bg-slate-100 dark:bg-slate-800">
              {images.length > 0 ? (
                <Image
                  src={images[0]}
                  alt={vet.clinic_name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 dark:from-slate-800 to-white dark:to-slate-900 text-slate-300 dark:text-slate-600">
                  <Building2 className="h-20 w-20 opacity-50" />
                </div>
              )}

              <button
                onClick={handleToggleSave}
                disabled={saving}
                className={`absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition disabled:opacity-50 ${isSaved ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-slate-900/80 text-slate-500 hover:text-red-500'}`}
              >
                <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark dark:text-white">
                    {vet.clinic_name}
                  </h1>
                  {vet.profiles && (
                    <p className="mt-1 text-lg text-slate-600 dark:text-slate-300 font-medium">
                      Dr. {vet.profiles.name}
                    </p>
                  )}
                </div>
                
                {vet.consultation_fee && (
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">Consultation Fee</span>
                    <span className="flex items-center text-xl font-bold text-green-600 dark:text-green-400">
                      <IndianRupee className="h-5 w-5 mr-0.5" />{vet.consultation_fee}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  <Award className="h-4 w-4" /> {vet.specialization}
                </span>
                {vet.experience_years > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
                    <Clock className="h-4 w-4" /> {vet.experience_years}+ Years Experience
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 shadow-md ring-1 ring-slate-100 dark:ring-slate-800"
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-dark dark:text-white">
              <Info className="h-5 w-5 text-primary" /> About
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {vet.bio ? (
                <p className="whitespace-pre-wrap">{vet.bio}</p>
              ) : (
                <p className="italic text-slate-400">No biography provided.</p>
              )}
            </div>

            <h3 className="mt-8 mb-3 font-semibold text-dark dark:text-white">Qualifications</h3>
            <p className="text-slate-600 dark:text-slate-300">{vet.qualifications}</p>
          </motion.div>

        </div>

        {/* Right Column - Sticky Sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="sticky top-24 rounded-3xl bg-white/90 dark:bg-slate-900/90 p-6 shadow-md ring-1 ring-slate-100 dark:ring-slate-800"
          >
            <h2 className="mb-6 text-lg font-bold text-dark dark:text-white">Clinic Details</h2>
            
            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">Address</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{vet.location}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{vet.city}, {vet.state}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">Phone</p>
                  <a href={`tel:${vet.phone}`} className="mt-1 block text-sm text-primary hover:underline font-medium">
                    {vet.phone}
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  router.push(`/login?returnTo=/vets/${vet.id}`);
                } else {
                  setIsBookingModalOpen(true);
                }
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
            >
              Book Appointment
            </button>
          </motion.div>
        </div>
      </div>

      {isBookingModalOpen && (
        <BookingModal
          vet={vet}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}
    </main>
  );
}
