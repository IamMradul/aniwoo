import { Link, NavLink, useLocation } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/vets', label: 'Vets' },
  { to: '/mating-connect', label: 'Mating Connect' },
  { to: '/ai-health-check', label: 'AI Health Check' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' }
];

export const Header = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-white/15 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: -10 }}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white shadow-md"
            aria-label="Aniwoo logo"
          >
            <PawPrint className="h-5 w-5" />
          </motion.div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-xl font-semibold text-black">Aniwoo</span>
            <span className="text-xs font-medium text-black/70">Your Pet&apos;s Best Friend</span>
          </div>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-sm font-medium text-black md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-black'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/ai-health-check"
            className="hidden rounded-full border border-primary/70 px-4 py-2 text-xs font-semibold text-black transition hover:bg-primary hover:text-white sm:inline-flex"
          >
            AI Health Check
          </Link>
          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            className="hidden rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-black transition hover:border-primary hover:text-primary sm:inline-flex"
          >
            {isAuthenticated ? 'My Profile' : 'Log in'}
          </Link>
          <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-secondary">
            {location.pathname === '/' ? 'All-in-one Pet Care' : 'Aniwoo Platform'}
          </span>
        </div>
      </div>
    </header>
  );
};


