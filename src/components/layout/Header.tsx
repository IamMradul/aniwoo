'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/vets', label: 'Vets' },
  { href: '/ai-health-check', label: 'AI Health Check' },
  { href: '/contact', label: 'Contact' }
];

export const Header = () => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-white/15 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
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
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-primary ${pathname === item.href ? 'text-primary' : 'text-black'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`hidden rounded-full border px-4 py-2 text-xs font-semibold transition sm:inline-flex ${pathname === '/admin' ? 'border-primary text-primary' : 'border-slate-300 text-black hover:border-primary hover:text-primary'}`}
            >
              Admin Portal
            </Link>
          )}
          <Link
            href={isAuthenticated ? '/profile' : '/login'}
            className="hidden rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-black transition hover:border-primary hover:text-primary sm:inline-flex"
          >
            {isAuthenticated ? 'My Profile' : 'Log in'}
          </Link>
          <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-secondary">
            {pathname === '/' ? 'All-in-one Pet Care' : 'Aniwoo Platform'}
          </span>
        </div>
      </div>
    </header>
  );
};
