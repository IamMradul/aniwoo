import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Stethoscope, User } from 'lucide-react';
import { GoogleSignIn } from '../components/auth/GoogleSignIn';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['vet', 'pet_owner'], {
    required_error: 'Please select a login type'
  })
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'vet' | 'pet_owner' | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: undefined
    }
  });

  const onSubmit = async (values: LoginFormValues) => {
    await login(values.email, values.password, values.role);
    if (values.role === 'vet') {
      navigate('/vet-dashboard');
    } else {
      navigate('/profile');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      setGoogleError('Please select a login type (Veterinarian or Pet Owner) first');
      return;
    }

    setGoogleLoading(true);
    setGoogleError(null);

    try {
      await loginWithGoogle(selectedRole);
      // OAuth will redirect automatically - no need to navigate
    } catch (error: any) {
      setGoogleError(error.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 rounded-3xl bg-white/80 p-6 shadow-lg ring-1 ring-slate-100 md:grid-cols-[1.1fr,1fr] md:p-10">
        <section>
          <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">Welcome back to Aniwoo</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Log in to manage your pets, view health scans, and access your personalised pet care plan.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                Login as
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

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="Enter your password"
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? 'Signing in…' : 'Log in'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            {googleError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {googleError}
              </div>
            )}

            <GoogleSignIn
              role={selectedRole || 'pet_owner'}
              text="signin_with"
              disabled={!selectedRole || googleLoading}
            />

            <p className="text-xs text-slate-600">
              New to Aniwoo?{' '}
              <Link to="/signup" className="font-semibold text-primary hover:text-primary/90">
                Create an account
              </Link>
            </p>
          </form>
        </section>

        <aside className="hidden flex-col justify-between rounded-2xl bg-gradient-to-br from-primary via-secondary to-dark p-6 text-sm text-white md:flex">
          <div>
            <h2 className="font-display text-xl font-semibold">Your pet&apos;s digital home</h2>
            <p className="mt-2 text-sm text-white/85">
              One login for food plans, vet history, grooming schedules, and AI health scans.
            </p>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-white/90">
            <li>• View past AI health reports</li>
            <li>• Save your vets and groomers</li>
            <li>• Manage pet profiles in one place</li>
          </ul>
        </aside>
      </div>
    </main>
  );
};

export default Login;

