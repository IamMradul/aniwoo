import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabaseClient';
import { Stethoscope, MapPin, Phone, Mail, Building2, Award, Save, LogOut } from 'lucide-react';

const vetDetailsSchema = z.object({
  clinic_name: z.string().min(2, 'Clinic name is required'),
  specialization: z.string().min(2, 'Specialization is required'),
  location: z.string().min(2, 'Location is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  experience_years: z.string().min(1, 'Experience is required'),
  qualifications: z.string().min(2, 'Qualifications are required'),
  bio: z.string().optional()
});

type VetDetailsFormValues = z.infer<typeof vetDetailsSchema>;

const VetDashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      bio: ''
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'vet') {
      navigate('/profile');
      return;
    }

    // Load existing vet details
    loadVetDetails();
  }, [user, isAuthenticated, navigate]);

  const loadVetDetails = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('vets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setValue('clinic_name', data.clinic_name || '');
        setValue('specialization', data.specialization || '');
        setValue('location', data.location || '');
        setValue('city', data.city || '');
        setValue('state', data.state || '');
        setValue('phone', data.phone || '');
        setValue('experience_years', data.experience_years?.toString() || '');
        setValue('qualifications', data.qualifications || '');
        setValue('bio', data.bio || '');
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
      const { error } = await supabase.from('vets').upsert({
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
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Vet details saved successfully! Your profile is now visible on the Vets page.' });
    } catch (error: any) {
      console.error('Error saving vet details:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save vet details' });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'vet') {
    return null;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">
            Veterinarian Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage your professional profile and clinic information
          </p>
        </div>
        <button
          onClick={async () => {
            await logout();
            navigate('/');
          }}
          className="flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-500 hover:text-red-500"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-3xl bg-white/90 p-6 shadow-md ring-1 ring-slate-100 md:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-dark">
            <Building2 className="h-5 w-5 text-primary" />
            Clinic Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="clinic_name" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Clinic Name *
              </label>
              <input
                id="clinic_name"
                type="text"
                {...register('clinic_name')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="Your Clinic Name"
              />
              {errors.clinic_name && (
                <p className="mt-1 text-xs text-red-600">{errors.clinic_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="specialization" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Specialization *
              </label>
              <input
                id="specialization"
                type="text"
                {...register('specialization')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="e.g., Small Animals, Exotic Pets"
              />
              {errors.specialization && (
                <p className="mt-1 text-xs text-red-600">{errors.specialization.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Address *
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="Street address"
              />
              {errors.location && (
                <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  {...register('city')}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                  placeholder="City"
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  State *
                </label>
                <input
                  id="state"
                  type="text"
                  {...register('state')}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                  placeholder="State"
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                <Phone className="inline h-3 w-3" /> Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="+91 1234567890"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="experience_years" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                <Award className="inline h-3 w-3" /> Years of Experience *
              </label>
              <input
                id="experience_years"
                type="number"
                min="0"
                {...register('experience_years')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="5"
              />
              {errors.experience_years && (
                <p className="mt-1 text-xs text-red-600">{errors.experience_years.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-md ring-1 ring-slate-100 md:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-dark">
            <Stethoscope className="h-5 w-5 text-primary" />
            Professional Details
          </h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="qualifications" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Qualifications *
              </label>
              <textarea
                id="qualifications"
                {...register('qualifications')}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="e.g., BVSc, MVSc, PhD in Veterinary Medicine"
              />
              {errors.qualifications && (
                <p className="mt-1 text-xs text-red-600">{errors.qualifications.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Bio / About
              </label>
              <textarea
                id="bio"
                {...register('bio')}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="Tell pet owners about yourself and your practice..."
              />
              {errors.bio && (
                <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/vets')}
            className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            View Vets Page
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default VetDashboard;
