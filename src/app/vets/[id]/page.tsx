'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, MapPin, Phone, Award, Building2, IndianRupee, Heart, ArrowLeft, Clock, Info, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
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
  
  // Image Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg shadow-primary/20"></div>
      </div>
    );
  }

  if (error || !vet) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 p-12 ring-1 ring-red-200 dark:ring-red-800/30"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <Stethoscope className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-red-800 dark:text-red-400">Vet Profile Unavailable</h1>
          <p className="mt-3 text-red-600 dark:text-red-300 max-w-md mx-auto">{error || 'The veterinarian you are looking for does not exist or has been removed.'}</p>
          <button onClick={() => router.push('/vets')} className="mt-8 inline-flex items-center gap-2 rounded-full bg-red-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 hover:-translate-y-0.5">
            <ArrowLeft className="h-4 w-4" /> Return to Directory
          </button>
        </motion.div>
      </div>
    );
  }

  const isSaved = savedVetIds.has(vet.user_id);
  const images = vet.clinic_image_urls && vet.clinic_image_urls.length > 0 
    ? vet.clinic_image_urls 
    : vet.clinic_image_url ? [vet.clinic_image_url] : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <motion.button 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()} 
        className="group mb-8 inline-flex items-center gap-2 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-800 transition hover:bg-white hover:text-primary dark:hover:bg-slate-800 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Directory
      </motion.button>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          
          {/* Cover & Gallery Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="group relative overflow-hidden rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-700/50"
          >
            <div className="relative h-[300px] w-full sm:h-[400px] lg:h-[480px]">
              {images.length > 0 ? (
                <AnimatePresence initial={false}>
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={images[currentImageIndex]}
                      alt={`${vet.clinic_name} - View ${currentImageIndex + 1}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover"
                      priority={currentImageIndex === 0}
                    />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <Building2 className="h-24 w-24 text-slate-300 dark:text-slate-700" />
                </div>
              )}

              {/* Gradient Overlay for bottom shadow */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 pointer-events-none" />

              {/* Image Navigation Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-2.5 text-white backdrop-blur-md transition hover:bg-white hover:text-dark opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-2.5 text-white backdrop-blur-md transition hover:bg-white hover:text-dark opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Next Image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        className={`h-2 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Actions & Badges */}
              <div className="absolute top-6 right-6 flex items-center gap-3">
                <button
                  onClick={handleToggleSave}
                  disabled={saving}
                  className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-300 disabled:opacity-50 hover:scale-110 shadow-lg ${isSaved ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-white/80 dark:bg-slate-900/80 text-slate-500 hover:text-red-500'}`}
                >
                  <Heart className={`h-6 w-6 ${isSaved ? 'fill-current scale-110' : ''} transition-transform`} />
                </button>
              </div>

              {/* Floating Bottom Left Info inside image container for premium look */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4 pointer-events-none">
                <div className="pointer-events-auto">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur-md px-4 py-2 text-white border border-white/20 shadow-lg mb-3">
                    <Stethoscope className="h-4 w-4" />
                    <span className="text-sm font-semibold tracking-wide uppercase">Veterinary Clinic</span>
                  </div>
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-md">
                    {vet.clinic_name}
                  </h1>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { icon: Award, label: "Specialty", value: vet.specialization.split(',')[0] || "General" },
              { icon: Clock, label: "Experience", value: vet.experience_years > 0 ? `${vet.experience_years}+ Years` : "Certified" },
              { icon: GraduationCap, label: "Degree", value: vet.qualifications.split(',')[0] || "DVM" },
              { icon: IndianRupee, label: "Consultation", value: vet.consultation_fee ? `₹${vet.consultation_fee}` : "Varies" },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 text-center transition hover:-translate-y-1 hover:shadow-md">
                <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-3">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                <p className="mt-1 font-semibold text-dark dark:text-white line-clamp-1">{stat.value}</p>
              </div>
            ))}
          </motion.div>

          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-[2.5rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 relative overflow-hidden"
          >
            {/* Decorative background blob */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-display font-bold text-dark dark:text-white">
                <Info className="h-6 w-6 text-primary" /> About the Doctor
              </h2>
              
              {vet.profiles && (
                <div className="mb-8 flex items-center gap-4 border-l-4 border-primary pl-4">
                  <div>
                    <p className="text-xl font-bold text-dark dark:text-white">Dr. {vet.profiles.name}</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{vet.qualifications}</p>
                  </div>
                </div>
              )}

              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                {vet.bio ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-base sm:text-lg">{vet.bio}</p>
                ) : (
                  <p className="italic text-slate-400">Detailed biography is not available at the moment.</p>
                )}
              </div>
            </div>
          </motion.div>

        </div>

        {/* Right Column - Sticky Booking Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4 relative">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="sticky top-24 rounded-[2.5rem] bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/95 p-8 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800"
          >
            <div className="mb-8">
              <span className="inline-block rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400 mb-4">
                Available for Booking
              </span>
              <h2 className="text-2xl font-display font-bold text-dark dark:text-white">Visit Clinic</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Schedule a visit or get in touch.</p>
            </div>
            
            <div className="space-y-6 mb-10">
              <div className="group flex gap-4 p-4 rounded-2xl transition hover:bg-slate-100 dark:hover:bg-slate-800/50">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Location</p>
                  <p className="text-sm font-medium text-dark dark:text-white">{vet.location}</p>
                  <p className="text-sm text-slate-500">{vet.city}, {vet.state}</p>
                </div>
              </div>

              <div className="group flex gap-4 p-4 rounded-2xl transition hover:bg-slate-100 dark:hover:bg-slate-800/50">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Contact</p>
                  <a href={`tel:${vet.phone}`} className="inline-block text-base font-bold text-dark dark:text-white transition hover:text-primary">
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
              className="group relative w-full overflow-hidden rounded-2xl bg-primary px-8 py-5 text-lg font-bold text-white shadow-[0_8px_30px_rgb(var(--primary-rgb),0.3)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(var(--primary-rgb),0.4)] active:translate-y-0"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                Book Appointment
                <ArrowLeft className="h-5 w-5 rotate-180 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] transition-transform duration-1000 group-hover:translate-x-[100%]" />
            </button>
            <p className="mt-4 text-center text-xs font-medium text-slate-400">
              No hidden charges. Instant confirmation.
            </p>
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
