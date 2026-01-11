import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Stethoscope, MapPin, Phone, Award, Building2, Search, RefreshCw } from 'lucide-react';

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
  profiles?: {
    name: string;
    email: string;
  };
};

const Vets = () => {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');

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
        return {
          ...vet,
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
              className="rounded-2xl bg-white/90 p-6 shadow-md ring-1 ring-slate-100 transition hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-dark">{vet.clinic_name}</h3>
                  {vet.profiles && (
                    <p className="mt-1 text-sm text-slate-600">Dr. {vet.profiles.name}</p>
                  )}
                </div>
                <Stethoscope className="h-6 w-6 text-primary" />
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

              <button className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Vets;


