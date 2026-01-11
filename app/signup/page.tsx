'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';
import { Stethoscope, User } from 'lucide-react';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['vet', 'pet_owner'], {
      required_error: 'Please select an account type'
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'vet' | 'pet_owner' | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined
    }
  });

  const onSubmit = async (values: SignupFormValues) => {
    await registerUser(values.name, values.email, values.password, values.role);
    if (values.role === 'vet') {
      router.push('/vet-dashboard');
    } else {
      router.push('/profile');
    }
  };


  return (
    <main className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 rounded-3xl bg-white/80 p-6 shadow-lg ring-1 ring-slate-100 md:grid-cols-[1.1fr,1fr] md:p-10">
        <section>
          <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">Create your Aniwoo account</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Set up a profile to save your pets, manage orders, and keep all pet health insights in one place.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('vet');
                    setValue('role', 'vet');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                    selectedRole === 'vet'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 text-slate-600 hover:border-primary/50'
                  }`}
                >
                  <Stethoscope className="h-4 w-4" />
                  Veterinarian
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('pet_owner');
                    setValue('role', 'pet_owner');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                    selectedRole === 'pet_owner'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 text-slate-600 hover:border-primary/50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  Pet Owner
                </button>
              </div>
              {errors.role && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.role.message}
                </p>
              )}
              <input type="hidden" {...register('role')} />
            </div>

            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Full name
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="Your name"
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="you@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                  placeholder="At least 6 characters"
                  aria-invalid={errors.password ? 'true' : 'false'}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                  placeholder="Repeat password"
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? 'Creating account…' : 'Sign up'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <GoogleSignIn
              role={selectedRole || 'pet_owner'}
              text="signup_with"
              disabled={false}
            />
            {!selectedRole && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                💡 Tip: Select an account type above for a better experience
              </p>
            )}

            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:text-primary/90">
                Log in
              </Link>
            </p>
          </form>
        </section>

        <aside className="hidden flex-col justify-between rounded-2xl bg-gradient-to-br from-primary via-secondary to-dark p-6 text-sm text-white md:flex">
          <div>
            <h2 className="font-display text-xl font-semibold">Why create an Aniwoo account?</h2>
            <p className="mt-2 text-sm text-white/85">
              Keep everything about your pet in one secure, love-filled place.
            </p>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-white/90">
            <li>• Store pet profiles and health history</li>
            <li>• Track orders and grooming bookings</li>
            <li>• Access AI scan history across devices</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
