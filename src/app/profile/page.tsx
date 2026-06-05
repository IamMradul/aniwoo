'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { PetOwnerProfile } from '@/components/profile/PetOwnerProfile';
import { VetProfile } from '@/components/profile/VetProfile';
import { MapPin, Plus, X, Edit2, Trash2, Stethoscope, Heart, BookOpen } from 'lucide-react';

type ActiveTab = 'dashboard' | 'account' | 'security' | 'my-details' | 'my-pets' | 'saved-vets';

type PetEntry = {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  gender?: string;
  photo_url?: string;
};

type ProfileData = {
  id: string;
  name: string;
  email: string;
  role?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  pets?: PetEntry[];
  profile_completed?: boolean;
  clinic_name?: string;
  clinic_address?: string;
  clinic_city?: string;
  clinic_state?: string;
  clinic_pincode?: string;
  years_of_experience?: number;
  specializations?: string[];
};

type SavedVet = {
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
  consultation_fee: number | null;
  clinic_image_url: string | null;
  profiles?: { name: string; email: string };
  saved_at?: string;
};

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Fish', 'Other'];
const SPECIALIZATION_OPTIONS = [
  'General Practice', 'Surgery', 'Dermatology', 'Dentistry', 'Orthopedics',
  'Oncology', 'Cardiology', 'Ophthalmology', 'Neurology', 'Emergency & Critical Care',
];

const BLANK_PET: Omit<PetEntry, 'id'> = {
  name: '', species: 'Dog', breed: '', age: undefined, weight: undefined, gender: 'Male', photo_url: '',
};

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-xl ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? '✓' : '✕'} {message}
    </div>
  );
}

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Account tab
  const [displayName, setDisplayName] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Security tab
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  const [resetEmailMessage, setResetEmailMessage] = useState<string | null>(null);
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);

  // My Details tab
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [detailsForm, setDetailsForm] = useState<Partial<ProfileData>>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // My Pets tab
  const [pets, setPets] = useState<PetEntry[]>([]);
  const [showPetForm, setShowPetForm] = useState(false);
  const [editingPet, setEditingPet] = useState<PetEntry | null>(null);
  const [petForm, setPetForm] = useState<Omit<PetEntry, 'id'>>(BLANK_PET);
  const [petsLoading, setPetsLoading] = useState(false);

  // Saved Vets tab
  const [savedVets, setSavedVets] = useState<SavedVet[]>([]);
  const [savedVetsLoading, setSavedVetsLoading] = useState(false);
  const [bookingVet, setBookingVet] = useState<SavedVet | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Google session hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const googleSession = urlParams.get('google_session');
      if (googleSession) {
        try {
          localStorage.setItem('googleUserSession', googleSession);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          window.location.reload();
        } catch (e) {
          console.error('Failed to parse google session:', e);
        }
      }
    }
  }, []);

  // Session check
  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated) {
        if (typeof window !== 'undefined' && user?.id && user?.email) {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: user.id, email: user.email, role: user.role || 'pet_owner' }),
          }).catch(() => undefined);
        }
        setCheckingSession(false);
        return;
      }

      const timer = setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setCheckingSession(false);
          } else {
            setTimeout(() => setCheckingSession(false), 1000);
          }
        } catch {
          setCheckingSession(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    };

    checkSession().catch(() => setCheckingSession(false));
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (user?.name) setDisplayName(user.name);
  }, [user?.name]);

  // Load profile data for My Details tab
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setProfileLoading(true);
    try {
      const response = await fetch('/api/profile', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      const data = payload?.data as ProfileData | null;
      if (data) {
        setProfileData(data);
        setDetailsForm({
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          clinic_name: data.clinic_name || '',
          clinic_address: data.clinic_address || '',
          clinic_city: data.clinic_city || '',
          clinic_state: data.clinic_state || '',
          clinic_pincode: data.clinic_pincode || '',
          years_of_experience: data.years_of_experience,
          specializations: data.specializations || [],
        });
        setPets(Array.isArray(data.pets) ? data.pets : []);
      }
    } catch { /* ignore */ } finally {
      setProfileLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'my-details' || activeTab === 'my-pets') {
      void loadProfile();
    }
  }, [activeTab, loadProfile]);

  // Load saved vets
  const loadSavedVets = useCallback(async () => {
    if (!isAuthenticated) return;
    setSavedVetsLoading(true);
    try {
      const response = await fetch('/api/saved-vets', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      setSavedVets(payload?.data || []);
    } catch { /* ignore */ } finally {
      setSavedVetsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'saved-vets') {
      void loadSavedVets();
    }
  }, [activeTab, loadSavedVets]);

  // Use My Location for pet owner
  const handleUseLocation = async (isClinic: boolean = false) => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          const address = data?.address;
          const pincode = address?.postcode || '';
          const city = address?.city || address?.town || address?.village || '';
          const state = address?.state || '';
          const fullAddress = data?.display_name || '';

          if (isClinic) {
            setDetailsForm((prev) => ({
              ...prev,
              clinic_city: city,
              clinic_state: state,
              clinic_pincode: pincode,
              clinic_address: fullAddress,
            }));
          } else {
            setDetailsForm((prev) => ({
              ...prev,
              city, state, pincode,
              address: fullAddress,
              latitude, longitude,
            }));
          }
          showToast('Location filled successfully!', 'success');
        } catch {
          showToast('Could not fetch location details. Try again.', 'error');
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        showToast('Location access denied.', 'error');
        setLocationLoading(false);
      }
    );
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const role = profileData?.role || user?.role || 'pet_owner';
      const isPetOwner = role === 'pet_owner' || !role || role === '';
      const isVet = role === 'vet';

      const allFilled = isPetOwner
        ? !!(detailsForm.pincode)
        : isVet
          ? !!(detailsForm.clinic_pincode)
          : true;

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...detailsForm, profile_completed: allFilled }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to save details');
      }
      showToast('Details saved!', 'success');
      void loadProfile();
    } catch (err) {
      showToast((err as Error).message || 'Failed to save', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Pet management
  const savePets = async (updatedPets: PetEntry[]) => {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ pets: updatedPets }),
    });
    if (!response.ok) throw new Error('Failed to save pets');
    setPets(updatedPets);
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setPetsLoading(true);
    try {
      const newPet: PetEntry = { id: crypto.randomUUID(), ...petForm };
      let updatedPets: PetEntry[];
      if (editingPet) {
        updatedPets = pets.map((p) => (p.id === editingPet.id ? { ...newPet, id: editingPet.id } : p));
      } else {
        updatedPets = [...pets, newPet];
      }
      await savePets(updatedPets);
      setShowPetForm(false);
      setEditingPet(null);
      setPetForm(BLANK_PET);
      showToast(editingPet ? 'Pet updated!' : 'Pet added!', 'success');
    } catch (err) {
      showToast((err as Error).message || 'Failed to save pet', 'error');
    } finally {
      setPetsLoading(false);
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm('Remove this pet from your profile?')) return;
    try {
      const updatedPets = pets.filter((p) => p.id !== petId);
      await savePets(updatedPets);
      showToast('Pet removed', 'success');
    } catch {
      showToast('Failed to remove pet', 'error');
    }
  };

  const handleEditPet = (pet: PetEntry) => {
    setEditingPet(pet);
    setPetForm({ name: pet.name, species: pet.species, breed: pet.breed || '', age: pet.age, weight: pet.weight, gender: pet.gender || 'Male', photo_url: pet.photo_url || '' });
    setShowPetForm(true);
  };

  const handleUnsaveVet = async (vetUserId: string) => {
    try {
      await fetch(`/api/saved-vets?vet_id=${encodeURIComponent(vetUserId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      void loadSavedVets();
      showToast('Vet removed from saved list', 'success');
    } catch {
      showToast('Failed to remove saved vet', 'error');
    }
  };

  const handleNameUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName || !user?.id) { setAccountError('Name cannot be empty.'); return; }
    setAccountLoading(true); setAccountError(null); setAccountMessage(null);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: trimmedName }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to update name.');
      await supabase.auth.updateUser({ data: { name: trimmedName, full_name: trimmedName } });
      setAccountMessage('Name updated successfully.');
      router.refresh();
    } catch (error) {
      setAccountError((error as Error).message || 'Failed to update name.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 6) { setSecurityError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setSecurityError('Passwords do not match.'); return; }
    setSecurityLoading(true); setSecurityError(null); setSecurityMessage(null);
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to update password.');
      setNewPassword(''); setConfirmPassword('');
      setSecurityMessage('Password updated successfully.');
    } catch (error) {
      setSecurityError((error as Error).message || 'Failed to update password.');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setResetEmailLoading(true); setResetEmailError(null); setResetEmailMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/profile`,
      });
      if (error) throw new Error(error.message);
      setResetEmailMessage('Password reset link sent to your email.');
    } catch (error) {
      setResetEmailError((error as Error).message || 'Failed to send reset link.');
    } finally {
      setResetEmailLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-10">
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 p-8 text-center shadow-md ring-1 ring-slate-100 dark:ring-slate-800">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-10">
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 p-8 text-center shadow-md ring-1 ring-slate-100 dark:ring-slate-800">
          <h1 className="font-display text-2xl font-semibold text-dark dark:text-white sm:text-3xl">You&apos;re not logged in</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Log in or create an Aniwoo account to view your profile.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/login" className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90">Log in</Link>
            <Link href="/signup" className="rounded-full border border-slate-300 dark:border-slate-700 px-6 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:border-primary hover:text-primary">Sign up</Link>
          </div>
        </div>
      </main>
    );
  }

  const role = profileData?.role || user?.role || 'pet_owner';
  const isPetOwner = role === 'pet_owner' || (!role || role === '');
  const isVet = role === 'vet';

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'my-details', label: 'My Details' },
    ...(isPetOwner ? [{ id: 'my-pets' as ActiveTab, label: 'My Pets' }] : []),
    ...(isPetOwner ? [{ id: 'saved-vets' as ActiveTab, label: 'Saved Vets' }] : []),
    { id: 'account', label: 'Account' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-dark dark:text-white sm:text-3xl">Profile Center</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Manage your account details, security, and your Aniwoo profile tools in one place.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
            <p><span className="font-semibold">Signed in as:</span> {user?.email}</p>
            <p className="mt-1"><span className="font-semibold">Role:</span> {user?.role || 'pet_owner'}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab.id ? 'bg-primary text-white' : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Dashboard Tab ── */}
      {activeTab === 'dashboard' && (
        <section className="mt-8">
          {user?.role === 'admin' ? (
            <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-8 shadow-sm">
              <h2 className="font-display text-2xl font-semibold text-dark dark:text-white sm:text-3xl">Admin account</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                You are signed in as an administrator. Open the admin portal to manage users, products, and platform operations.
              </p>
              <Link href="/admin" className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90">
                Open Admin Portal
              </Link>
            </section>
          ) : isVet ? (
            <VetProfile user={user} />
          ) : (
            <PetOwnerProfile user={user} />
          )}
        </section>
      )}

      {/* ── My Details Tab ── */}
      {activeTab === 'my-details' && (
        <section className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold text-dark dark:text-white sm:text-2xl">My Details</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Update your location and profile information.</p>

          {profileLoading && <p className="mt-4 text-sm text-slate-500 animate-pulse">Loading details...</p>}

          {!profileLoading && (
            <form onSubmit={handleSaveDetails} className="mt-6 space-y-5 max-w-2xl">
              {/* Pet Owner location fields */}
              {isPetOwner && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Your Location</h3>
                    <button
                      type="button"
                      onClick={() => handleUseLocation(false)}
                      disabled={locationLoading}
                      className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition disabled:opacity-50"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {locationLoading ? 'Getting location...' : 'Use My Location'}
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Address</label>
                      <input value={detailsForm.address || ''} onChange={(e) => setDetailsForm((p) => ({ ...p, address: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Your address" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">City</label>
                      <input value={detailsForm.city || ''} onChange={(e) => setDetailsForm((p) => ({ ...p, city: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="City" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">State</label>
                      <input value={detailsForm.state || ''} onChange={(e) => setDetailsForm((p) => ({ ...p, state: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="State" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Pincode *</label>
                      <input value={detailsForm.pincode || ''} onChange={(e) => setDetailsForm((p) => ({ ...p, pincode: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="e.g. 400001" maxLength={10} />
                    </div>
                  </div>
                </>
              )}

              {/* Vet clinic fields */}
              {isVet && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Clinic Details</h3>
                    <button
                      type="button"
                      onClick={() => handleUseLocation(true)}
                      disabled={locationLoading}
                      className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition disabled:opacity-50"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {locationLoading ? 'Getting location...' : 'Use My Location'}
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Clinic Name</label>
                      <input value={detailsForm.clinic_name || ''} onChange={(e) => setDetailsForm((p) => ({ ...p, clinic_name: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Clinic / Hospital name" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Clinic Address</label>
                      <input value={detailsForm.clinic_address || ''} onChange={(e) => setDetailsForm((p) => ({ ...p, clinic_address: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Street address" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">City</label>
                      <input value={detailsForm.clinic_city || ''} onChange={(e) => setDetailsForm((p) => ({ ...p, clinic_city: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="City" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">State</label>
                      <input value={detailsForm.clinic_state || ''} onChange={(e) => setDetailsForm((p) => ({ ...p, clinic_state: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="State" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Pincode *</label>
                      <input value={detailsForm.clinic_pincode || ''} onChange={(e) => setDetailsForm((p) => ({ ...p, clinic_pincode: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="e.g. 400001" maxLength={10} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Years of Experience</label>
                      <input type="number" min={0} value={detailsForm.years_of_experience ?? ''} onChange={(e) => setDetailsForm((p) => ({ ...p, years_of_experience: e.target.value ? Number(e.target.value) : undefined }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="e.g. 5" />
                    </div>
                  </div>

                  {/* Specializations multi-select */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">Specializations</label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALIZATION_OPTIONS.map((spec) => {
                        const selected = (detailsForm.specializations || []).includes(spec);
                        return (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => {
                              const current = detailsForm.specializations || [];
                              setDetailsForm((p) => ({
                                ...p,
                                specializations: selected ? current.filter((s) => s !== spec) : [...current, spec],
                              }));
                            }}
                            className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${selected ? 'bg-primary text-white border-primary' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary'}`}
                          >
                            {spec}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={profileLoading}
                className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-70"
              >
                {profileLoading ? 'Saving...' : 'Save Details'}
              </button>
            </form>
          )}
        </section>
      )}

      {/* ── My Pets Tab (pet owners only) ── */}
      {activeTab === 'my-pets' && isPetOwner && (
        <section className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-dark dark:text-white sm:text-2xl">My Pets</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Manage your furry family members.</p>
            </div>
            <button
              onClick={() => { setShowPetForm(!showPetForm); setEditingPet(null); setPetForm(BLANK_PET); }}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition"
            >
              {showPetForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showPetForm ? 'Cancel' : 'Add Pet'}
            </button>
          </div>

          {/* Add/Edit Pet Form */}
          {showPetForm && (
            <form onSubmit={handleAddPet} className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-800/50 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{editingPet ? 'Edit Pet' : 'Add New Pet'}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Pet Name *</label>
                  <input required value={petForm.name} onChange={(e) => setPetForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Buddy" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Species *</label>
                  <select required value={petForm.species} onChange={(e) => setPetForm((p) => ({ ...p, species: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                    {SPECIES_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Breed</label>
                  <input value={petForm.breed || ''} onChange={(e) => setPetForm((p) => ({ ...p, breed: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Golden Retriever" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Gender</label>
                  <select value={petForm.gender || 'Male'} onChange={(e) => setPetForm((p) => ({ ...p, gender: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Age (years)</label>
                  <input type="number" min={0} step={0.5} value={petForm.age ?? ''} onChange={(e) => setPetForm((p) => ({ ...p, age: e.target.value ? Number(e.target.value) : undefined }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. 3" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-1">Weight (kg)</label>
                  <input type="number" min={0} step={0.1} value={petForm.weight ?? ''} onChange={(e) => setPetForm((p) => ({ ...p, weight: e.target.value ? Number(e.target.value) : undefined }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. 12.5" />
                </div>
              </div>
              <button type="submit" disabled={petsLoading} className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-70 transition">
                {petsLoading ? 'Saving...' : editingPet ? 'Update Pet' : 'Add Pet'}
              </button>
            </form>
          )}

          {/* Pets List */}
          {pets.length === 0 && !showPetForm && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <p className="text-3xl mb-3">🐾</p>
              <p className="text-sm">No pets added yet. Add your first pet!</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <div key={pet.id} className="relative rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{pet.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{pet.species} {pet.breed ? `• ${pet.breed}` : ''}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pet.gender && <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs">{pet.gender}</span>}
                      {pet.age !== undefined && <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs">{pet.age}y</span>}
                      {pet.weight !== undefined && <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs">{pet.weight}kg</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditPet(pet)} className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDeletePet(pet.id)} className="rounded-full p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Saved Vets Tab (pet owners only) ── */}
      {activeTab === 'saved-vets' && isPetOwner && (
        <section className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold text-dark dark:text-white sm:text-2xl mb-2">Saved Vets</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Your bookmarked veterinarians.</p>

          {savedVetsLoading && <p className="text-sm text-slate-500 animate-pulse">Loading saved vets...</p>}

          {!savedVetsLoading && savedVets.length === 0 && (
            <div className="text-center py-12">
              <Heart className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No saved vets yet.</p>
              <Link href="/vets" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition">
                <Stethoscope className="h-4 w-4" /> Browse Vets
              </Link>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedVets.map((vet) => (
              <div key={vet.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800">
                  {vet.clinic_image_url ? (
                    <Image src={vet.clinic_image_url} alt={vet.clinic_name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400"><Stethoscope className="h-8 w-8 opacity-50" /></div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{vet.clinic_name}</h3>
                  {vet.profiles && <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">Dr. {vet.profiles.name}</p>}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{vet.city}, {vet.state}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setBookingVet(vet)} className="flex-1 rounded-full bg-primary py-2 text-xs font-semibold text-white hover:bg-primary/90 transition flex items-center justify-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" /> Book
                    </button>
                    <button onClick={() => handleUnsaveVet(vet.user_id)} className="rounded-full border border-red-200 dark:border-red-800 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Account Tab ── */}
      {activeTab === 'account' && (
        <section className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold text-dark dark:text-white sm:text-2xl">Account Details</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Update your display name used across Aniwoo.</p>
          <form onSubmit={handleNameUpdate} className="mt-6 max-w-xl space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Full name</label>
              <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Enter your name" />
            </div>
            {accountError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{accountError}</p>}
            {accountMessage && <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{accountMessage}</p>}
            <button type="submit" disabled={accountLoading} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300">
              {accountLoading ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </section>
      )}

      {/* ── Security Tab ── */}
      {activeTab === 'security' && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold text-dark dark:text-white sm:text-2xl">Change Password</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Set a new strong password for your account.</p>
            <form onSubmit={handlePasswordUpdate} className="mt-6 space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">New password</label>
                <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="At least 6 characters" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Confirm new password</label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Repeat new password" />
              </div>
              {securityError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{securityError}</p>}
              {securityMessage && <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{securityMessage}</p>}
              <button type="submit" disabled={securityLoading} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300">
                {securityLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </article>

          <article className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold text-dark dark:text-white sm:text-2xl">Forgot Password</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Send a recovery link to <span className="font-semibold">{user?.email}</span> in case you lose access.
            </p>
            <div className="mt-6">
              {resetEmailError && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{resetEmailError}</p>}
              {resetEmailMessage && <p className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{resetEmailMessage}</p>}
              <button type="button" onClick={handleSendPasswordReset} disabled={resetEmailLoading} className="rounded-full border border-slate-300 dark:border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-primary hover:text-primary disabled:cursor-not-allowed">
                {resetEmailLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>
            <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Session</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use secure logout when switching devices or shared systems.</p>
              <button type="button" onClick={async () => { await logout(); window.location.href = '/'; }} className="mt-4 rounded-full border border-slate-300 dark:border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-red-500 hover:bg-red-50 hover:text-red-600">
                Log out securely
              </button>
            </div>
          </article>
        </section>
      )}

      {/* Booking modal for saved vets */}
      {bookingVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="font-display text-xl font-semibold text-dark dark:text-white">Book Appointment</h2>
              <button onClick={() => setBookingVet(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">with {bookingVet.clinic_name}</p>
            <Link href="/vets" className="w-full flex items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 transition">
              Go to Vets Page to Book
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
