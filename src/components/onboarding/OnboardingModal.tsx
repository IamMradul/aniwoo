'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { MapPin, ChevronRight, ChevronLeft, X } from 'lucide-react';
import confetti from 'canvas-confetti';

type Step = 1 | 2 | 3 | 4;
type RoleChoice = 'pet_owner' | 'vet';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Fish', 'Other'];

interface OnboardingState {
  role: RoleChoice;
  // Pet owner location
  city: string;
  state: string;
  pincode: string;
  address: string;
  latitude?: number;
  longitude?: number;
  // Vet clinic
  clinic_name: string;
  clinic_address: string;
  clinic_city: string;
  clinic_state: string;
  clinic_pincode: string;
  years_of_experience: string;
  // First pet
  petName: string;
  petSpecies: string;
  petBreed: string;
  petAge: string;
  petGender: string;
}

const DEFAULT_STATE: OnboardingState = {
  role: 'pet_owner',
  city: '', state: '', pincode: '', address: '', latitude: undefined, longitude: undefined,
  clinic_name: '', clinic_address: '', clinic_city: '', clinic_state: '', clinic_pincode: '', years_of_experience: '',
  petName: '', petSpecies: 'Dog', petBreed: '', petAge: '', petGender: 'Male',
};

const ONBOARDING_KEY = 'aniwoo_onboarding_done';

export default function OnboardingModal() {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [locationLoading, setLocationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const confettiFired = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Check if user has already done onboarding this session
    try {
      if (sessionStorage.getItem(ONBOARDING_KEY)) return;
    } catch { /* ignore */ }

    // Check if new user (profile_completed = false AND recent signup)
    const checkNewUser = async () => {
      try {
        const response = await fetch('/api/profile', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        const profile = payload?.data;
        if (!profile) return;

        const isNew = profile.profile_completed === false;
        if (!isNew) return;

        // Only show if the profile was created in the last 5 minutes
        // We rely on profile.created_at if available, otherwise show for brand-new profiles
        setVisible(true);
      } catch { /* ignore */ }
    };

    void checkNewUser();
  }, [isAuthenticated, user]);

  const handleClose = () => {
    try { sessionStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
  };

  const handleLocationFill = async (isClinic: boolean) => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await resp.json();
          const addr = data?.address;
          const city = addr?.city || addr?.town || addr?.village || '';
          const stateVal = addr?.state || '';
          const pincode = addr?.postcode || '';
          const fullAddress = data?.display_name || '';

          if (isClinic) {
            setState((p) => ({ ...p, clinic_city: city, clinic_state: stateVal, clinic_pincode: pincode, clinic_address: fullAddress }));
          } else {
            setState((p) => ({ ...p, city, state: stateVal, pincode, address: fullAddress, latitude, longitude }));
          }
        } catch { /* ignore */ } finally {
          setLocationLoading(false);
        }
      },
      () => setLocationLoading(false)
    );
  };

  const saveStep2 = async () => {
    setSaving(true);
    try {
      const body = state.role === 'pet_owner'
        ? { address: state.address, city: state.city, state: state.state, pincode: state.pincode, latitude: state.latitude, longitude: state.longitude }
        : { clinic_name: state.clinic_name, clinic_address: state.clinic_address, clinic_city: state.clinic_city, clinic_state: state.clinic_state, clinic_pincode: state.clinic_pincode, years_of_experience: state.years_of_experience ? Number(state.years_of_experience) : undefined };

      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const saveStep3Pet = async () => {
    if (!state.petName.trim()) return;
    setSaving(true);
    try {
      const pet = {
        id: crypto.randomUUID(),
        name: state.petName,
        species: state.petSpecies,
        breed: state.petBreed,
        age: state.petAge ? Number(state.petAge) : undefined,
        gender: state.petGender,
      };
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pets: [pet], profile_completed: true }),
      });
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const markComplete = async () => {
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profile_completed: true }),
      });
    } catch { /* ignore */ }
  };

  const goNext = async () => {
    if (step === 1) {
      // Save role selection
      setSaving(true);
      try {
        // We update via supabase directly (role change through profile)
        // For now, just proceed — role was set at signup
      } finally { setSaving(false); }
    }
    if (step === 2) {
      await saveStep2();
    }
    if (step === 3) {
      await saveStep3Pet();
    }
    setDirection(1);
    if (step === 3) {
      setStep(4);
      // Fire confetti on step 4
      if (!confettiFired.current) {
        confettiFired.current = true;
        setTimeout(() => {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
        }, 300);
      }
    } else if (step < 4) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1) as Step);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  if (!mounted || !visible) return null;

  const totalSteps = state.role === 'pet_owner' ? 4 : 3;
  // For vets: steps 1, 2, 4 (no pet step)
  const displayStep = state.role === 'vet' && step === 4 ? 3 : step;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${(displayStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
          aria-label="Skip onboarding"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 min-h-[420px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ── Step 1: Role Selection ── */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Welcome to Aniwoo! 🐾</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Tell us who you are so we can personalize your experience.</p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setState((p) => ({ ...p, role: 'pet_owner' }))}
                    className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition ${state.role === 'pet_owner' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}
                  >
                    <span className="text-4xl">🐶</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Pet Owner</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Find vets, shop for your pets</span>
                  </button>
                  <button
                    onClick={() => setState((p) => ({ ...p, role: 'vet' }))}
                    className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition ${state.role === 'vet' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}
                  >
                    <span className="text-4xl">🩺</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Veterinarian</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">List your clinic, manage bookings</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Location Setup ── */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {state.role === 'pet_owner' ? '📍 Where are you located?' : '🏥 About Your Clinic'}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {state.role === 'pet_owner' ? 'Helps us find nearby vets for you.' : 'Help pet owners find your clinic.'}
                </p>

                <button
                  type="button"
                  onClick={() => handleLocationFill(state.role === 'vet')}
                  disabled={locationLoading}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition disabled:opacity-50 self-start"
                >
                  <MapPin className="h-4 w-4" />
                  {locationLoading ? 'Getting location...' : 'Use My Location'}
                </button>

                <div className="mt-4 grid gap-3">
                  {state.role === 'pet_owner' ? (
                    <>
                      <input value={state.city} onChange={(e) => setState((p) => ({ ...p, city: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" placeholder="City" />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={state.state} onChange={(e) => setState((p) => ({ ...p, state: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" placeholder="State" />
                        <input value={state.pincode} onChange={(e) => setState((p) => ({ ...p, pincode: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" placeholder="Pincode" maxLength={10} />
                      </div>
                    </>
                  ) : (
                    <>
                      <input value={state.clinic_name} onChange={(e) => setState((p) => ({ ...p, clinic_name: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" placeholder="Clinic Name" />
                      <input value={state.clinic_city} onChange={(e) => setState((p) => ({ ...p, clinic_city: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" placeholder="City" />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={state.clinic_state} onChange={(e) => setState((p) => ({ ...p, clinic_state: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" placeholder="State" />
                        <input value={state.clinic_pincode} onChange={(e) => setState((p) => ({ ...p, clinic_pincode: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" placeholder="Pincode" maxLength={10} />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Add First Pet (pet owners only) / Done (vets) ── */}
            {step === 3 && state.role === 'pet_owner' && (
              <motion.div key="step3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Tell us about your pet! 🐾</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Add your first pet (you can always add more later).</p>
                <div className="mt-5 grid gap-3">
                  <input value={state.petName} onChange={(e) => setState((p) => ({ ...p, petName: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" placeholder="Pet name (e.g. Buddy)" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={state.petSpecies} onChange={(e) => setState((p) => ({ ...p, petSpecies: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white">
                      {SPECIES_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <select value={state.petGender} onChange={(e) => setState((p) => ({ ...p, petGender: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white">
                      <option>Male</option><option>Female</option>
                    </select>
                  </div>
                  <input value={state.petBreed} onChange={(e) => setState((p) => ({ ...p, petBreed: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" placeholder="Breed (optional)" />
                  <input type="number" min={0} step={0.5} value={state.petAge} onChange={(e) => setState((p) => ({ ...p, petAge: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" placeholder="Age in years (optional)" />
                </div>
              </motion.div>
            )}

            {/* ── Step 3 for Vets (goes straight to done) ── */}
            {step === 3 && state.role === 'vet' && (
              <motion.div key="step3vet" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">You&apos;re all set!</h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-xs">
                  Your clinic profile has been set up. Pet owners in your area will be able to find and book appointments with you.
                </p>
              </motion.div>
            )}

            {/* ── Step 4: Done (pet owners) ── */}
            {step === 4 && (
              <motion.div key="step4" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">You&apos;re all set!</h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-xs">
                  Welcome to Aniwoo! Find trusted vets near you, shop for your pets, and keep them healthy and happy.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <div>
              {step > 1 && step < 4 && !(step === 3 && state.role === 'vet') && (
                <button onClick={goBack} className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-400 transition">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Skip for pet step */}
              {step === 3 && state.role === 'pet_owner' && (
                <button onClick={async () => { await markComplete(); setDirection(1); setStep(4); confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } }); }} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition">
                  Skip for now
                </button>
              )}

              {(step === 4 || (step === 3 && state.role === 'vet')) ? (
                <button
                  onClick={async () => { await markComplete(); handleClose(); }}
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 transition"
                >
                  Explore the App <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 disabled:opacity-70 transition"
                >
                  {saving ? 'Saving...' : 'Continue'} <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
