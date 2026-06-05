'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { MapPin, ChevronRight, ChevronLeft, X } from 'lucide-react';
import confetti from 'canvas-confetti';

type Step = 1 | 2 | 3;

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Fish', 'Other'];

interface OnboardingState {
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
    if (!isAuthenticated || !user || !user.role) return;

    // Check if user has already done onboarding this session
    try {
      if (sessionStorage.getItem(ONBOARDING_KEY)) return;
    } catch { /* ignore */ }

    // Check if new user (profile_completed = false)
    const checkNewUser = async () => {
      try {
        const response = await fetch('/api/profile', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        const profile = payload?.data;
        if (!profile) return;

        const isNew = profile.profile_completed === false;
        if (!isNew) return;

        setVisible(true);
      } catch { /* ignore */ }
    };

    void checkNewUser();
  }, [isAuthenticated, user]);

  const handleClose = () => {
    try { sessionStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
  };

  const isVet = user?.role === 'vet';

  const handleLocationFill = async () => {
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

          if (isVet) {
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

  const saveLocation = async () => {
    setSaving(true);
    try {
      const body = !isVet
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

  const savePet = async () => {
    if (!state.petName.trim() || isVet) return;
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
    if (step === 2) {
      await saveLocation();
    }
    
    setDirection(1);

    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (isVet) {
        // Vets skip pet setup
        setStep(3);
        fireConfetti();
      } else {
        setStep(3);
      }
    } else if (step === 3) {
      // Step 3 is Pet Setup for Pet Owners, or Done for Vets (which wouldn't have a continue button, just "Explore")
      if (!isVet) {
        await savePet();
        fireConfetti();
        // Since we want to show a success screen, we can just hide the modal and maybe we need a step 4?
        // Let's add a step 4 for the final success screen for pet owners, but step 3 for vets is the success screen.
        // Wait, the prompt says:
        // - Welcome screen
        // - Location setup
        // - Add first pet (pet owners only)
        // - Done screen with confetti
        // That means we need Step 4 for pet owners.
      }
    }
  };

  const fireConfetti = () => {
    if (!confettiFired.current) {
      confettiFired.current = true;
      setTimeout(() => {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
      }, 300);
    }
  };

  const goNextPetOwnerFinal = async () => {
    await savePet();
    setDirection(1);
    setStep(4 as any);
    fireConfetti();
  }

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1) as Step);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  if (!mounted || !visible || !user) return null;

  const totalSteps = isVet ? 3 : 4;
  const displayStep = step as number;

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
            {/* ── Step 1: Welcome ── */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-6">{isVet ? '🩺' : '🐶'}</div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Welcome, {isVet ? 'Dr. ' + (user.name || 'Veterinarian') : (user.name || 'Pet Parent')}!
                </h2>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  {isVet 
                    ? "Let's set up your clinic profile so pet owners can find you and book appointments."
                    : "Let's personalize your experience to help you find the best care for your furry family."}
                </p>
              </motion.div>
            )}

            {/* ── Step 2: Location Setup ── */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex-1 flex flex-col">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {!isVet ? '📍 Where are you located?' : '🏥 About Your Clinic'}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {!isVet ? 'Helps us find nearby vets for you.' : 'Help pet owners find your clinic.'}
                </p>

                <button
                  type="button"
                  onClick={handleLocationFill}
                  disabled={locationLoading}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition disabled:opacity-50 self-start"
                >
                  <MapPin className="h-4 w-4" />
                  {locationLoading ? 'Getting location...' : 'Use My Location'}
                </button>

                <div className="mt-4 grid gap-3">
                  {!isVet ? (
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

            {/* ── Step 3: Add First Pet (pet owners only) ── */}
            {step === 3 && !isVet && (
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

            {/* ── Final Step: Done ── */}
            {(displayStep === 4 || (displayStep === 3 && isVet)) && (
              <motion.div key="done" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">You&apos;re all set!</h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-xs">
                  {isVet 
                    ? 'Your clinic profile has been set up. Pet owners in your area will be able to find and book appointments with you.'
                    : 'Welcome to Aniwoo! Find trusted vets near you, shop for your pets, and keep them healthy and happy.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <div>
              {step > 1 && !(displayStep === 4 || (displayStep === 3 && isVet)) && (
                <button onClick={goBack} className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-400 transition">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Skip for pet step */}
              {step === 3 && !isVet && (
                <button onClick={async () => { await markComplete(); setDirection(1); setStep(4 as any); fireConfetti(); }} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition">
                  Skip for now
                </button>
              )}

              {(displayStep === 4 || (displayStep === 3 && isVet)) ? (
                <button
                  onClick={async () => { await markComplete(); handleClose(); }}
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 transition"
                >
                  Explore the App <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={step === 3 && !isVet ? goNextPetOwnerFinal : goNext}
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
