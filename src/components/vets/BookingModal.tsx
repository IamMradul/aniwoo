'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { X, Award } from 'lucide-react';

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

type Props = {
  vet: Vet;
  onClose: () => void;
};

export default function BookingModal({ vet, onClose }: Props) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [petName, setPetName] = useState('');
  const [reason, setReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!user) return;

    setIsBooking(true);
    setBookingError(null);
    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: user.id, email: user.email, role: user.role || 'pet_owner' }),
      }).catch(() => undefined);

      const dateTimeString = `${bookingDate}T${bookingTime}:00`;
      const appointmentDate = new Date(dateTimeString).toISOString();

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          vet_id: vet.user_id,
          pet_name: petName,
          appointment_date: appointmentDate,
          reason: reason,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.error || 'Failed to book appointment');
      }

      setBookingSuccess(true);
      setTimeout(() => {
        onClose();
        setBookingSuccess(false);
        setPetName('');
        setBookingDate('');
        setBookingTime('');
        setReason('');
      }, 3000);
    } catch (err) {
      setBookingError((err as Error).message || 'Booking failed. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in zoom-in-95 rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-dark dark:text-white">Book Appointment</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">with {vet.clinic_name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {bookingSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-dark dark:text-white">Request Sent!</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Your appointment request for {petName} has been sent to the clinic. You can track this in your profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleBookAppointment} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Pet Name</label>
              <input
                required
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                type="text"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g. Max"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Date</label>
                <input
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Time</label>
                <input
                  required
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  type="time"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Reason for visit</label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g. Annual checkup, vaccinations..."
              />
            </div>

            {bookingError && (
              <p className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                {bookingError}
              </p>
            )}

            <div className="pt-2">
              <button
                disabled={isBooking}
                type="submit"
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-70"
              >
                {isBooking ? 'Sending Request...' : 'Confirm Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
