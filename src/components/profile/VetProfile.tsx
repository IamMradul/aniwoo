'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Clock, PawPrint, Bell, Settings, Heart, FileText, Download, UserPlus, ChevronRight, Building2, Award, Save, Image as ImageIcon, IndianRupee, Phone, Stethoscope, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

const vetDetailsSchema = z.object({
    clinic_name: z.string().min(2, 'Clinic name is required'),
    specialization: z.string().min(2, 'Specialization is required'),
    location: z.string().min(2, 'Location is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    experience_years: z.string().min(1, 'Experience is required'),
    qualifications: z.string().min(2, 'Qualifications are required'),
    bio: z.string().optional(),
    clinic_image_url: z.union([z.literal(''), z.string().url('Must be a valid URL')]).optional(),
    consultation_fee: z.string().min(1, 'Consultation fee is required')
});

type VetDetailsFormValues = z.infer<typeof vetDetailsSchema>;

type TabType = 'appointments' | 'patients' | 'partners' | 'reports' | 'settings';

export function VetProfile({ user }: { user: any }) {
    const [activeTab, setActiveTab] = useState<TabType>('appointments');
    const [bookings, setBookings] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<string | null>(null);
    const [rescheduleData, setRescheduleData] = useState<{ id: string | null, date: string, time: string, note: string }>({ id: null, date: '', time: '', note: '' });

    const [saving, setSaving] = useState(false);
    const [uploadingClinicImages, setUploadingClinicImages] = useState(false);
    const [clinicImageUrls, setClinicImageUrls] = useState<string[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Patient form state
    const [showAddPatient, setShowAddPatient] = useState(false);
    const [isAddingPatient, setIsAddingPatient] = useState(false);
    const [newPatient, setNewPatient] = useState<{ name: string, species: string, breed: string, age_years: string, health_notes: string, report_file: File | null }>({ name: '', species: '', breed: '', age_years: '', health_notes: '', report_file: null });

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset
    } = useForm<VetDetailsFormValues>({
        resolver: zodResolver(vetDetailsSchema),
        defaultValues: {
            clinic_name: '',
            specialization: '',
            location: '',
            city: '',
            state: '',
            phone: '',
            experience_years: '',
            qualifications: '',
            bio: '',
            clinic_image_url: '',
            consultation_fee: ''
        }
    });

    const loadVetDetails = async () => {
        if (!user?.id) return;
        try {
            const response = await fetch(`/api/vets?userId=${encodeURIComponent(user.id)}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload?.error || 'Failed to load vet details');
            }

            const result = await response.json();
            const data = result?.data;

            if (data) {
                setValue('clinic_name', data.clinic_name || '');
                setValue('specialization', data.specialization || '');
                setValue('location', data.location || '');
                setValue('city', data.city || '');
                setValue('state', data.state || '');
                setValue('phone', data.phone || '');
                setValue('experience_years', data.experience_years?.toString() || '');
                setValue('qualifications', data.qualifications || '');
                setValue('bio', data.bio || '');
                setValue('clinic_image_url', data.clinic_image_url || '');
                setClinicImageUrls(Array.isArray(data.clinic_image_urls)
                    ? data.clinic_image_urls.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
                    : data.clinic_image_url
                        ? [data.clinic_image_url]
                        : []);
                setValue('consultation_fee', data.consultation_fee?.toString() || '');
            }
        } catch (error) {
            console.error('Error loading vet details:', error);
        }
    };

    const onSubmit = async (values: VetDetailsFormValues) => {
        if (!user?.id) return;
        setSaving(true);
        setMessage(null);

        try {
            const manualImageUrl = values.clinic_image_url?.trim();
            const mergedClinicImageUrls = Array.from(
                new Set([
                    ...clinicImageUrls,
                    ...(manualImageUrl ? [manualImageUrl] : [])
                ])
            );

            const response = await fetch('/api/vets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    user_id: user.id,
                    clinic_name: values.clinic_name,
                    specialization: values.specialization,
                    location: values.location,
                    city: values.city,
                    state: values.state,
                    phone: values.phone,
                    experience_years: parseInt(values.experience_years),
                    qualifications: values.qualifications,
                    bio: values.bio || null,
                    clinic_image_url: mergedClinicImageUrls[0] || null,
                    clinic_image_urls: mergedClinicImageUrls,
                    consultation_fee: parseInt(values.consultation_fee)
                })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload?.error || 'Failed to save clinic details');
            }

            setMessage({ type: 'success', text: 'Vet details saved successfully! Your profile is now visible on the Vets directory.' });

            // Auto hide message
            setTimeout(() => setMessage(null), 5000);
        } catch (error: any) {
            console.error('Error saving vet details:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to save clinic details' });
        } finally {
            setSaving(false);
        }
    };

    const handleClinicImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        const files = Array.from(selectedFiles);
        setUploadingClinicImages(true);
        setMessage(null);

        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('images', file);
            });

            const response = await fetch('/api/vets/images', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Failed to upload clinic images');
            }

            const uploadedUrls = Array.isArray(payload?.data?.urls)
                ? payload.data.urls.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
                : [];

            if (uploadedUrls.length === 0) {
                throw new Error('No image URLs were returned from upload');
            }

            setClinicImageUrls((prev) => Array.from(new Set([...prev, ...uploadedUrls])));
            setValue('clinic_image_url', uploadedUrls[0]);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to upload clinic images' });
        } finally {
            setUploadingClinicImages(false);
            event.target.value = '';
        }
    };

    const handleAddPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingPatient(true);
        try {
            const formData = new FormData();
            formData.append('name', newPatient.name);
            formData.append('species', newPatient.species);
            if (newPatient.breed) formData.append('breed', newPatient.breed);
            if (newPatient.age_years) formData.append('age_years', newPatient.age_years);
            if (newPatient.health_notes) formData.append('health_notes', newPatient.health_notes);
            if (newPatient.report_file) formData.append('report', newPatient.report_file);

            const res = await fetch('/api/pets', {
                method: 'POST',
                body: formData
            });

            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || 'Failed to add patient');

            setPatients([payload.data, ...patients]);
            setShowAddPatient(false);
            setNewPatient({ name: '', species: '', breed: '', age_years: '', health_notes: '', report_file: null });
        } catch (err: any) {
            console.error('Error adding patient:', err);
            alert('Failed to add patient: ' + (err.message || 'Unknown error'));
        } finally {
            setIsAddingPatient(false);
        }
    };

    const removeClinicImage = (url: string) => {
        setClinicImageUrls((prev) => {
            const next = prev.filter((entry) => entry !== url);
            setValue('clinic_image_url', next[0] || '');
            return next;
        });
    };
    useEffect(() => {
        async function loadBookings() {
            try {
                const [bookingsRes, patientsRes, partnersRes] = await Promise.all([
                    fetch('/api/bookings?role=vet', { method: 'GET', credentials: 'include' }),
                    fetch('/api/vets/patients', { method: 'GET', credentials: 'include' }),
                    fetch('/api/saved-vets', { method: 'GET', credentials: 'include' })
                ]);

                if (!bookingsRes.ok) {
                    console.error('Failed to load vet bookings:', await bookingsRes.text().catch(() => ''));
                } else {
                    const payload = await bookingsRes.json().catch(() => ({ data: [] }));
                    setBookings(payload?.data || []);
                }

                if (!patientsRes.ok) {
                    console.error('Failed to load patients:', await patientsRes.text().catch(() => ''));
                } else {
                    const payload = await patientsRes.json().catch(() => ({ data: [] }));
                    setPatients(payload?.data || []);
                }

                if (!partnersRes.ok) {
                    console.error('Failed to load partners:', await partnersRes.text().catch(() => ''));
                } else {
                    const payload = await partnersRes.json().catch(() => ({ data: [] }));
                    setPartners(payload?.data || []);
                }
            } catch (err) {
                console.error('Error loading vet data:', err);
            } finally {
                setLoading(false);
            }
        }

        loadBookings();
        loadVetDetails();

        // Subscribe to real-time events on bookings table for notifications
        const subscription = supabase
            .channel('vet-bookings')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings', filter: `vet_id=eq.${user.id}` },
                async (payload) => {
                    // Fetch the new booking detail including user profile info
                    const { data } = await supabase
                        .from('bookings')
                        .select(`
              id,
              pet_name,
              appointment_date,
              reason,
              status,
              pet_owner_id,
              owner_profile:profiles!pet_owner_id ( name, email )
            `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setNotification(`New booking request for ${data.pet_name}!`);
                        setBookings(prev => [data, ...prev]);
                        setTimeout(() => setNotification(null), 8000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user.id]);

    const updateBookingStatus = async (id: string, status: string, newDate?: string, note?: string) => {
        try {
            const response = await fetch('/api/bookings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ id, status, appointment_date: newDate, vet_note: note })
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload?.error || 'Failed to update booking status');
            }

            setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update booking status');
        }
    };

    const renderAppointments = () => (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-dark dark:text-white">Recent Bookings</h2>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : bookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
                    <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                    <p>No appointments booked yet.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition hover:shadow-md">
                            <div className="absolute top-0 right-0 p-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    booking.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                        'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                                    }`}>
                                    {booking.status}
                                </span>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-display text-lg font-semibold text-dark dark:text-white flex items-center gap-2">
                                    <PawPrint className="h-4 w-4 text-primary" /> {booking.pet_name}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Owner: {booking.owner_profile?.name || 'Unknown'}</p>
                            </div>

                            <div className="flex flex-col gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-600 dark:text-slate-300 text-xs">
                                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {new Date(booking.appointment_date).toLocaleDateString()}</div>
                                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {new Date(booking.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>

                            {booking.reason && (
                                <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reason for visit</p>
                                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{booking.reason}</p>
                                </div>
                            )}

                            {booking.status === 'pending' && rescheduleData.id !== booking.id && (
                                <div className="mt-4 flex gap-2">
                                    <button onClick={() => updateBookingStatus(booking.id, 'confirmed')} className="flex-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90">Confirm</button>
                                    <button onClick={() => setRescheduleData({ id: booking.id, date: booking.appointment_date.split('T')[0], time: '', note: '' })} className="flex-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:bg-slate-800">Reschedule</button>
                                </div>
                            )}

                            {rescheduleData.id === booking.id && (
                                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 animate-in fade-in zoom-in-95 duration-200">
                                    <h4 className="mb-3 text-sm font-semibold text-dark dark:text-white">Propose New Time</h4>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-slate-500">Date *</label>
                                                <input type="date" value={rescheduleData.date} onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm outline-none focus:border-primary" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-500">Time *</label>
                                                <input type="time" value={rescheduleData.time} onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm outline-none focus:border-primary" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500">Note for Owner</label>
                                            <textarea rows={2} value={rescheduleData.note} onChange={(e) => setRescheduleData(prev => ({ ...prev, note: e.target.value }))} placeholder="E.g., I'm in surgery at 2 PM..." className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm outline-none focus:border-primary"></textarea>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => setRescheduleData({ id: null, date: '', time: '', note: '' })} className="flex-1 rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                                            <button onClick={() => {
                                                if (!rescheduleData.date || !rescheduleData.time) return alert('Date and Time are required');
                                                updateBookingStatus(booking.id, 'rescheduled', `${rescheduleData.date}T${rescheduleData.time}:00`, rescheduleData.note);
                                                setRescheduleData({ id: null, date: '', time: '', note: '' });
                                            }} className="flex-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90">Send Proposal</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );

    const renderPatients = () => (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-dark dark:text-white">My Patients</h2>
                {!showAddPatient && (
                    <button onClick={() => setShowAddPatient(true)} className="flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/80">
                        <UserPlus className="h-4 w-4" />
                        Add Patient Record
                    </button>
                )}
            </div>

            {showAddPatient && (
                <form onSubmit={handleAddPatient} className="mb-6 rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                    <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Add a New Patient</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Name *</label>
                            <input required type="text" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Max" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Species *</label>
                            <input required type="text" value={newPatient.species} onChange={e => setNewPatient({ ...newPatient, species: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Dog, Cat" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Breed</label>
                            <input type="text" value={newPatient.breed} onChange={e => setNewPatient({ ...newPatient, breed: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Golden Retriever" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Age (Years)</label>
                            <input type="number" min="0" value={newPatient.age_years} onChange={e => setNewPatient({ ...newPatient, age_years: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="3" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Clinical Notes</label>
                            <textarea rows={2} value={newPatient.health_notes} onChange={e => setNewPatient({ ...newPatient, health_notes: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Medical history, allergies, etc."></textarea>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Attach Report (PDF)</label>
                            <input type="file" accept=".pdf,application/pdf" onChange={e => setNewPatient({ ...newPatient, report_file: e.target.files?.[0] || null })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowAddPatient(false)} className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:border-slate-400">Cancel</button>
                        <button type="submit" disabled={isAddingPatient} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-70">
                            {isAddingPatient ? 'Adding...' : 'Save Patient'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                {patients.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
                        <PawPrint className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                        <p>No patients found. Patients will appear here once they book an appointment.</p>
                    </div>
                ) : (
                    patients.map((patient) => (
                        <div key={patient.id} className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-all hover:shadow-md hover:ring-primary/20">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150"></div>
                            <div className="relative z-10 flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-primary">
                                        <PawPrint className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-display text-lg font-semibold text-dark dark:text-white">{patient.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{patient.breed || patient.species} {patient.age_years ? `• ${patient.age_years} Years` : ''}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative z-10 mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                                {patient.health_notes && (
                                    <>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clinical Notes</p>
                                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{patient.health_notes}</p>
                                    </>
                                )}
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Owner: {patient.profiles?.name || 'Unknown'}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );

    const renderPartners = () => (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-dark dark:text-white">Clinic Partners</h2>
                <Link href="/vets" className="flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/80">
                    <Search className="h-4 w-4" />
                    Find Partners
                </Link>
            </div>

            <div className="grid gap-4">
                {partners.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
                        <Heart className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                        <p>You haven't saved any clinic partners yet.</p>
                    </div>
                ) : (
                    partners.map((partner) => (
                        <div key={partner.user_id} className="flex items-center justify-between rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-all hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-dark dark:text-white">{partner.profiles?.name || partner.clinic_name || 'Clinic Partner'}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{partner.specialization || 'Veterinarian'} {partner.city ? `• ${partner.city}` : ''}</p>
                                </div>
                            </div>
                            <Link href={`/vets/${partner.user_id}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary">
                                <ChevronRight className="h-5 w-5" />
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </section>
    );

    const renderReports = () => (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-dark dark:text-white">Clinic Reports</h2>
                <button className="text-sm font-semibold text-primary transition hover:text-primary/80">Generate Report</button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                <div className="divide-y divide-slate-100">
                    {/* Mock Report 1 */}
                    <div className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-dark dark:text-white">Monthly Revenue Summary</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">March 2026 • Financial</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:border-primary hover:text-primary">
                            <Download className="h-3.5 w-3.5" />
                            <span>PDF</span>
                        </button>
                    </div>

                    {/* Mock Report 2 */}
                    <div className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-dark dark:text-white">Patient Attendance Report</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Q1 2026 • Analytics</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:border-primary hover:text-primary">
                            <Download className="h-3.5 w-3.5" />
                            <span>PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );

    const renderSettings = () => (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {message && (
                <div
                    className={`mb-6 rounded-xl p-4 ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                >
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 p-6 shadow-md ring-1 ring-slate-100 dark:ring-slate-800 md:p-8">
                    <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-dark dark:text-white">
                        <Building2 className="h-5 w-5 text-primary" />
                        Clinic Information
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="clinic_name" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                Clinic Name *
                            </label>
                            <input
                                id="clinic_name"
                                type="text"
                                {...register('clinic_name')}
                                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                placeholder="Your Clinic Name"
                                disabled={saving}
                            />
                            {errors.clinic_name && (
                                <p className="mt-1 text-xs text-red-600">{errors.clinic_name.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="specialization" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                Specialization *
                            </label>
                            <input
                                id="specialization"
                                type="text"
                                {...register('specialization')}
                                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                placeholder="e.g., Small Animals, Exotic Pets"
                                disabled={saving}
                            />
                            {errors.specialization && (
                                <p className="mt-1 text-xs text-red-600">{errors.specialization.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                Address *
                            </label>
                            <input
                                id="location"
                                type="text"
                                {...register('location')}
                                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                placeholder="Street address"
                                disabled={saving}
                            />
                            {errors.location && (
                                <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="city" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                    City *
                                </label>
                                <input
                                    id="city"
                                    type="text"
                                    {...register('city')}
                                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                    placeholder="City"
                                    disabled={saving}
                                />
                                {errors.city && (
                                    <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="state" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                    State *
                                </label>
                                <input
                                    id="state"
                                    type="text"
                                    {...register('state')}
                                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                    placeholder="State"
                                    disabled={saving}
                                />
                                {errors.state && (
                                    <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                <Phone className="inline h-3 w-3" /> Phone Number *
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                {...register('phone')}
                                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                placeholder="+91 1234567890"
                                disabled={saving}
                            />
                            {errors.phone && (
                                <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="experience_years" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                <Award className="inline h-3 w-3" /> Years of Experience *
                            </label>
                            <input
                                id="experience_years"
                                type="number"
                                min="0"
                                {...register('experience_years')}
                                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                placeholder="5"
                                disabled={saving}
                            />
                            {errors.experience_years && (
                                <p className="mt-1 text-xs text-red-600">{errors.experience_years.message}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="clinic_image_url" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                <ImageIcon className="inline h-3 w-3" /> Clinic Image URL (Optional)
                            </label>
                            <input
                                id="clinic_image_url"
                                type="url"
                                {...register('clinic_image_url')}
                                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                placeholder="https://example.com/my-clinic-image.jpg"
                                disabled={saving}
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Provide a direct link to a beautiful image of your clinic to show pet owners.</p>
                            {errors.clinic_image_url && (
                                <p className="mt-1 text-xs text-red-600">{errors.clinic_image_url.message}</p>
                            )}

                            <div className="mt-4">
                                <label htmlFor="clinic_images" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                    Upload Clinic Images
                                </label>
                                <input
                                    id="clinic_images"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleClinicImageUpload}
                                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                    disabled={saving || uploadingClinicImages}
                                />
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload one or more clinic photos (max 10 files, 5MB each).</p>

                                {uploadingClinicImages && (
                                    <p className="mt-2 text-xs font-semibold text-primary">Uploading clinic images...</p>
                                )}

                                {clinicImageUrls.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {clinicImageUrls.map((url) => (
                                            <div key={url} className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                                <img src={url} alt="Clinic preview" className="h-24 w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeClinicImage(url)}
                                                    className="absolute right-1 top-1 rounded-full bg-white/95 dark:bg-slate-900/95 px-2 py-0.5 text-[11px] font-semibold text-red-600 shadow"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="consultation_fee" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                <IndianRupee className="inline h-3 w-3" /> Consultation Fee *
                            </label>
                            <div className="relative mt-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-slate-500 dark:text-slate-400 sm:text-sm">₹</span>
                                </div>
                                <input
                                    id="consultation_fee"
                                    type="number"
                                    min="0"
                                    {...register('consultation_fee')}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 pl-7 pr-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                    placeholder="500"
                                    disabled={saving}
                                />
                            </div>
                            {errors.consultation_fee && (
                                <p className="mt-1 text-xs text-red-600">{errors.consultation_fee.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 p-6 shadow-md ring-1 ring-slate-100 dark:ring-slate-800 md:p-8">
                    <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-dark dark:text-white">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        Professional Details
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="qualifications" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                Qualifications *
                            </label>
                            <textarea
                                id="qualifications"
                                {...register('qualifications')}
                                rows={3}
                                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                placeholder="e.g., BVSc, MVSc, PhD in Veterinary Medicine"
                                disabled={saving}
                            />
                            {errors.qualifications && (
                                <p className="mt-1 text-xs text-red-600">{errors.qualifications.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="bio" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                Bio / About
                            </label>
                            <textarea
                                id="bio"
                                {...register('bio')}
                                rows={4}
                                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 disabled:opacity-50"
                                placeholder="Tell pet owners about yourself and your practice..."
                                disabled={saving}
                            />
                            {errors.bio && (
                                <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Clinic Details'}
                    </button>
                </div>
            </form>
        </section>
    );

    return (
        <div className="space-y-8">
            {notification && (
                <div className="fixed top-4 right-4 z-50 flex animate-[bounce_1s_ease-in-out] items-center gap-3 rounded-xl bg-emerald-500 px-6 py-4 text-white shadow-xl ring-4 ring-emerald-500/30">
                    <Bell className="h-5 w-5 animate-pulse" />
                    <span className="font-semibold">{notification}</span>
                </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-gradient-to-br from-slate-900 to-dark p-6 shadow-md md:p-8">
                <div>
                    <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">Dr. {user?.name}&apos;s Command Center</h1>
                    <p className="mt-2 text-sm text-slate-300 sm:text-base">
                        Manage your clinic profile, appointments, and incoming pet patients.
                    </p>
                </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 pb-px hide-scrollbar gap-6">
                {[
                    { id: 'appointments', label: 'Appointments', icon: Calendar },
                    { id: 'patients', label: 'Patients', icon: PawPrint },
                    { id: 'partners', label: 'Partners', icon: Heart },
                    { id: 'reports', label: 'Reports', icon: FileText },
                    { id: 'settings', label: 'Clinic Settings', icon: Settings }
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

            <div className="grid gap-8">
                <div className="min-h-[400px]">
                    {activeTab === 'appointments' && renderAppointments()}
                    {activeTab === 'patients' && renderPatients()}
                    {activeTab === 'partners' && renderPartners()}
                    {activeTab === 'reports' && renderReports()}
                    {activeTab === 'settings' && renderSettings()}
                </div>
            </div>
        </div>
    );
}
