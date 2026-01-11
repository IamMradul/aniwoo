import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white/90 p-8 text-center shadow-md ring-1 ring-slate-100">
          <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">You&apos;re not logged in</h1>
          <p className="mt-3 text-sm text-slate-600">
            Log in or create an Aniwoo account to view your profile and pet details.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to="/login"
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
            >
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[1.1fr,1fr]">
        <section className="rounded-3xl bg-white/90 p-6 shadow-md ring-1 ring-slate-100 md:p-8">
          <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">Hi, {user.name}</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            This is your Aniwoo profile. In future releases, you&apos;ll manage pets, orders, and AI health reports
            here.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</h2>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="mt-0.5 text-sm text-slate-700">
                <span className="font-medium">Name:</span> {user.name}
              </p>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coming soon</h2>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                <li>• Pet profiles with age, breed, and health notes</li>
                <li>• Saved vets, groomers, and sitters</li>
                <li>• Full AI health scan history and downloads</li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="mt-6 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-500 hover:text-red-500"
          >
            Log out
          </button>
        </section>

        <aside className="rounded-3xl bg-gradient-to-br from-primary via-secondary to-dark p-6 text-sm text-white">
          <h2 className="font-display text-xl font-semibold">Your Aniwoo journey</h2>
          <p className="mt-2 text-sm text-white/85">
            This profile will become your hub for everything Aniwoo: food plans, vet docs, grooming, and more.
          </p>
          <p className="mt-4 text-xs text-white/80">
            TODO: Connect this page to real backend user data, pet records, and AI report history.
          </p>
        </aside>
      </div>
    </main>
  );
};

export default Profile;

