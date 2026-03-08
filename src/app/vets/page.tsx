'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Stethoscope, MapPin, Phone, Award, Building2, Search, RefreshCw, X, IndianRupee } from 'lucide-react';

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

const normalizeImageUrls = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((entry): entry is string => typeof entry === 'string')
          .map((entry) => entry.trim())
          .filter(Boolean)
      }
    } catch {
      return []
    }
  }

  return [trimmed]
}

export default function Vets() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');

  // Booking Modal State
  const [bookingVet, setBookingVet] = useState<Vet | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [petName, setPetName] = useState('');
  const [reason, setReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    loadVets();
  }, []);

  const loadVets = async () => {
    try {
      setLoading(true);

      // First, get all vets
      const { data: vetsData, error: vetsError } = await supabase
        .from('vets')
        .select('*')
        .order('created_at', { ascending: false });

      if (vetsError) {
        console.error('Error loading vets:', vetsError);
        throw vetsError;
      }

      if (!vetsData || vetsData.length === 0) {
        setVets([]);
        setLoading(false);
        return;
      }

      // Then, get profiles for each vet's user_id
      const userIds = vetsData.map(vet => vet.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        // Continue even if profiles fail
      }

      // Combine vets with their profiles
      const vetsWithProfiles = vetsData.map(vet => {
        const profile = profilesData?.find(p => p.id === vet.user_id);
        const clinicImageUrls = normalizeImageUrls(vet.clinic_image_url);

        return {
          ...vet,
          clinic_image_url: clinicImageUrls[0] || null,
          clinic_image_urls: clinicImageUrls,
          profiles: profile ? { name: profile.name, email: profile.email } : undefined
        };
      });

      setVets(vetsWithProfiles);
    } catch (error) {
      console.error('Error loading vets:', error);
      setVets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVets = vets.filter((vet) => {
    const matchesSearch =
      vet.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.profiles?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = !filterCity || vet.city.toLowerCase() === filterCity.toLowerCase();
    const matchesSpecialization =
      !filterSpecialization || vet.specialization.toLowerCase().includes(filterSpecialization.toLowerCase());

    return matchesSearch && matchesCity && matchesSpecialization;
  });

  const uniqueCities = Array.from(new Set(vets.map((v) => v.city))).sort();
  const uniqueSpecializations = Array.from(
    new Set(vets.flatMap((v) => v.specialization.split(',').map((s) => s.trim())))
  ).sort();

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-600">Loading veterinarians...</p>
        </div>
      </main>
    );
  }

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!bookingVet || !user) return;

    setIsBooking(true);
    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          role: user.role || 'pet_owner'
        })
      }).catch(() => undefined);

      // Combine date and time
      const dateTimeString = `${bookingDate}T${bookingTime}:00`;
      const appointmentDate = new Date(dateTimeString).toISOString();

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          vet_id: bookingVet.user_id,
          pet_name: petName,
          appointment_date: appointmentDate,
          reason: reason
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        console.error('BOOKING API ERROR:', errorPayload);
        throw new Error(errorPayload?.error || 'Failed to book appointment');
      }

      setBookingSuccess(true);

      // Auto close after 3s
      setTimeout(() => {
        setBookingVet(null);
        setBookingSuccess(false);
        setPetName('');
        setBookingDate('');
        setBookingTime('');
        setReason('');
      }, 3000);

    } catch (err: any) {
      console.error('Error booking appointment:', err);
      // alert('Failed to book appointment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">Vet Directory</h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Connect with trusted, certified veterinarians in your area and book appointments with ease.
          </p>
        </div>
        <button
          onClick={loadVets}
          className="flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
          title="Refresh vet listings"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4 rounded-2xl bg-white/90 p-6 shadow-md ring-1 ring-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by clinic name, specialization, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
              Filter by City
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
            >
              <option value="">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
              Filter by Specialization
            </label>
            <select
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
            >
              <option value="">All Specializations</option>
              {uniqueSpecializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vets List */}
      {filteredVets.length === 0 ? (
        <div className="rounded-2xl bg-white/90 p-12 text-center shadow-md ring-1 ring-slate-100">
          <Stethoscope className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-slate-600">No veterinarians found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVets.map((vet) => (
            <div
              key={vet.id}
              className="overflow-hidden rounded-2xl bg-white/90 shadow-md ring-1 ring-slate-100 transition hover:shadow-lg flex flex-col"
            >
              {/* Clinic Image Cover */}
              <div className="h-48 w-full bg-slate-100 relative">
                {vet.clinic_image_url ? (
                  <img src={vet.clinic_image_url} alt={vet.clinic_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-white text-slate-300">
                    <Building2 className="h-12 w-12 opacity-50" />
                  </div>
                )}
                {/* Consultation Fee Badge */}
                {vet.consultation_fee && (
                  <div className="absolute bottom-3 right-3 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-sm font-bold text-dark shadow-sm ring-1 ring-slate-900/5">
                    <span className="flex items-center">
                      <IndianRupee className="h-3.5 w-3.5 mr-0.5" />{vet.consultation_fee}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-dark line-clamp-1">{vet.clinic_name}</h3>
                    {vet.profiles && (
                      <p className="mt-1 text-sm text-slate-600">Dr. {vet.profiles.name}</p>
                    )}
                  </div>
                  <Stethoscope className="h-6 w-6 text-primary shrink-0 ml-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{vet.specialization}</p>
                      <p className="text-xs text-slate-500">{vet.qualifications}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-700">{vet.location}</p>
                      <p className="text-xs text-slate-500">
                        {vet.city}, {vet.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a href={`tel:${vet.phone}`} className="text-sm text-primary hover:underline">
                      {vet.phone}
                    </a>
                  </div>

                  {vet.experience_years > 0 && (
                    <p className="text-xs text-slate-500">
                      {vet.experience_years} {vet.experience_years === 1 ? 'year' : 'years'} of experience
                    </p>
                  )}

                  {vet.bio && (
                    <p className="line-clamp-2 text-xs text-slate-600">{vet.bio}</p>
                  )}
                </div>

                <div className="p-6 pt-0 mt-auto">
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
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-dark">Book Appointment</h2>
                <p className="mt-1 text-sm text-slate-500">with {bookingVet.clinic_name}</p>
              </div>
              <button
                onClick={() => {
                  setBookingVet(null);
                  setBookingSuccess(false);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-dark">Request Sent!</h3>
                <p className="mt-2 text-sm text-slate-600">Your appointment request for {petName} has been sent to the clinic. You can track this in your profile.</p>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Pet Name</label>
                  <input required value={petName} onChange={e => setPetName(e.target.value)} type="text" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Max" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Date</label>
                    <input required value={bookingDate} onChange={e => setBookingDate(e.target.value)} type="date" min={new Date().toISOString().split('T')[0]} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Time</label>
                    <input required value={bookingTime} onChange={e => setBookingTime(e.target.value)} type="time" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Reason for visit</label>
                  <textarea required value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Annual checkup, vaccinations..."></textarea>
                </div>
                <div className="pt-2">
                  <button disabled={isBooking} type="submit" className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-70">
                    {isBooking ? 'Sending Request...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
