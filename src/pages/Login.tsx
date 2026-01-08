import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (values: LoginFormValues) => {
    await login(values.email, values.password);
    navigate('/profile');
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

