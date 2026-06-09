'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Clock, MapPin, Search, PawPrint, Heart, FileText, Download, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type TabType = 'appointments' | 'pets' | 'providers' | 'reports';

export function PetOwnerProfile({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<TabType>('appointments');
  const [bookings, setBookings] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [healthScans, setHealthScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add pet form state
  const [showAddPet, setShowAddPet] = useState(false);
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [newPet, setNewPet] = useState({ name: '', species: '', breed: '', age_years: '', health_notes: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const [bookingsApiRes, petsRes, scansRes] = await Promise.all([
          fetch('/api/bookings?role=pet_owner', {
            method: 'GET',
            credentials: 'include'
          }),
          supabase
            .from('pets')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('health_scans')
            .select('*, pets(name)')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
        ]);

        if (!bookingsApiRes.ok) {
          const payload = await bookingsApiRes.json().catch(() => ({}));
          console.error('Booking err:', payload);
        } else {
          const payload = await bookingsApiRes.json().catch(() => ({ data: [] }));
          setBookings(payload?.data || []);
        }

        if (petsRes.error) console.error('Pets err:', petsRes.error);
        else setPets(petsRes.data || []);

        if (scansRes.error) console.error('Scans err:', scansRes.error);
        else setHealthScans(scansRes.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user.id]);

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingPet(true);
    try {
      const { data, error } = await supabase.from('pets').insert({
        owner_id: user.id,
        name: newPet.name,
        species: newPet.species,
        breed: newPet.breed,
        age_years: newPet.age_years ? parseInt(newPet.age_years) : null,
        health_notes: newPet.health_notes || null
      }).select().single();

      if (error) throw error;

      setPets([data, ...pets]);
      setShowAddPet(false);
      setNewPet({ name: '', species: '', breed: '', age_years: '', health_notes: '' });
    } catch (err: any) {
      console.error('Error adding pet:', err);
      alert('Failed to add pet: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAddingPet(false);
    }
  };

  const renderAppointments = () => (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark dark:text-white">Upcoming Appointments</h2>
        <Link
          href="/vets"
          className="flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/80"
        >
          <Search className="h-4 w-4" />
          Find a Vet
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          <p>No upcoming appointments found.</p>
          <Link href="/vets" className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">Book Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-dark dark:text-white">Appointment for {booking.pet_name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{booking.vets?.clinic_name} (Dr. {booking.vet_profile?.name || 'Vet'})</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                  }`}>
                  {booking.status}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(booking.appointment_date).toLocaleDateString()}</div>
                <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {new Date(booking.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              {booking.reason && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center gap-2"><MapPin className="h-4 w-4" />{booking.reason}</p>}
              {booking.status === 'rescheduled' && booking.vet_note && (
                <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-semibold mb-1 flex items-center gap-1.5"><Clock className="h-4 w-4" /> New time proposed by Vet</p>
                  <p className="italic">"{booking.vet_note}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderPets = () => (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark dark:text-white">My Pets</h2>
        {!showAddPet && (
          <button onClick={() => setShowAddPet(true)} className="flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/80">
            <Plus className="h-4 w-4" />
            Add Pet
          </button>
        )}
      </div>

      {showAddPet && (
        <form onSubmit={handleAddPet} className="mb-6 rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Add a New Pet</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Name *</label>
              <input required type="text" value={newPet.name} onChange={e => setNewPet({ ...newPet, name: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Max" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Species *</label>
              <input required type="text" value={newPet.species} onChange={e => setNewPet({ ...newPet, species: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Dog, Cat" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Breed</label>
              <input type="text" value={newPet.breed} onChange={e => setNewPet({ ...newPet, breed: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Golden Retriever" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Age (Years)</label>
              <input type="number" min="0" value={newPet.age_years} onChange={e => setNewPet({ ...newPet, age_years: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="3" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Health Notes / Needs</label>
              <textarea rows={2} value={newPet.health_notes} onChange={e => setNewPet({ ...newPet, health_notes: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Vaccinated, allergies, etc."></textarea>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setShowAddPet(false)} className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:border-slate-400">Cancel</button>
            <button type="submit" disabled={isAddingPet} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-70">
              {isAddingPet ? 'Adding...' : 'Save Pet'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pets.length === 0 && !showAddPet ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
              <PawPrint className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p>You haven't added any pets yet.</p>
            </div>
          ) : (
            pets.map((pet) => (
              <div key={pet.id} className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-all hover:shadow-md hover:ring-primary/20">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150"></div>
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-primary">
                      <PawPrint className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-dark dark:text-white">{pet.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{pet.breed || pet.species} {pet.age_years ? `• ${pet.age_years} Years` : ''}</p>
                    </div>
                  </div>
                </div>
                {pet.health_notes && (
                  <div className="relative z-10 mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Health Notes</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{pet.health_notes}</p>
                  </div>
                )}
              </div>
            ))
          )}

          {!showAddPet && (
            <button onClick={() => setShowAddPet(true)} className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 p-6 text-slate-400 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-semibold">{pets.length === 0 ? 'Add Your First Pet' : 'Add Another Pet'}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );

  const renderProviders = () => (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark dark:text-white">Saved Providers</h2>
      </div>

      <div className="grid gap-4">
        {/* Mock Provider 1 */}
        <div className="flex items-center justify-between rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h3 className="font-semibold text-dark dark:text-white">Dr. Sarah Jenkins</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Veterinarian • City Vet Clinic</p>
            </div>
          </div>
          <Link href="/vets" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Mock Provider 2 */}
        <div className="flex items-center justify-between rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h3 className="font-semibold text-dark dark:text-white">Paws & Bubbles Grooming</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Groomer • Downtown</p>
            </div>
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );

  const renderReports = () => (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark dark:text-white">Health Reports</h2>
        <Link href="/ai-health-check" className="text-sm font-semibold text-primary transition hover:text-primary/80">New Scan</Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : healthScans.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <FileText className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p>No health reports found.</p>
            </div>
          ) : (
            healthScans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark dark:text-white">{scan.pets?.name || 'Pet'} - {scan.scan_type}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(scan.created_at).toLocaleDateString()} • AI Generated</p>
                  </div>
                </div>
                {scan.report_url ? (
                  <a href={scan.report_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:border-primary hover:text-primary">
                    <Download className="h-3.5 w-3.5" />
                    <span>Report</span>
                  </a>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">Processing</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white/90 dark:bg-slate-900/90 p-6 shadow-md ring-1 ring-slate-100 dark:ring-slate-800 md:p-8">
        <h1 className="font-display text-2xl font-semibold text-dark dark:text-white sm:text-3xl">Hi, {user?.name}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          This is your Pet Parent dashboard. Manage your pet&apos;s appointments, AI health reports, and more.
        </p>
      </section>

      {/* Profile Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 pb-px hide-scrollbar gap-6">
        {[
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'pets', label: 'My Pets', icon: PawPrint },
          { id: 'providers', label: 'Saved Providers', icon: Heart },
          { id: 'reports', label: 'Health Reports', icon: FileText }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-all ${isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:border-slate-700 hover:text-slate-700 dark:text-slate-200'
                }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 md:grid-cols-[1.5fr,1fr]">
        <div className="min-h-[400px]">
          {activeTab === 'appointments' && renderAppointments()}
          {activeTab === 'pets' && renderPets()}
          {activeTab === 'providers' && renderProviders()}
          {activeTab === 'reports' && renderReports()}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 p-6 shadow-md ring-1 ring-slate-100 dark:ring-slate-800">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Account details</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Name:</span> {user.name}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-md">
            <h2 className="font-display text-xl font-semibold">AI Health Scanner</h2>
            <p className="mt-2 text-sm text-white/80">Analyze your pet&apos;s photos in seconds to check for common health concerns.</p>
            <Link href="/ai-health-check" className="mt-4 inline-block rounded-full bg-white/20 px-5 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/30">Try AI Scanner</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
