'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-white/15 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
          <motion.div
            whileHover={{ rotate: -10 }}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white shadow-md"
            aria-label="Aniwoo logo"
          >
            <PawPrint className="h-5 w-5" />
          </motion.div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold text-black sm:text-xl">Aniwoo</span>
            <span className="hidden text-xs font-medium text-black/70 sm:block">Your Pet&apos;s Best Friend</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-sm font-medium text-black lg:flex">
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

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${pathname === '/admin' ? 'border-primary text-primary' : 'border-slate-300 text-black hover:border-primary hover:text-primary'}`}
            >
              Admin Portal
            </Link>
          )}
          <Link
            href={isAuthenticated ? '/profile' : '/login'}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-black transition hover:border-primary hover:text-primary"
          >
            {isAuthenticated ? 'My Profile' : 'Log in'}
          </Link>
        </div>

        {/* Status Badge (visible on all screens) */}
        <span className="hidden rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-secondary sm:inline-flex lg:px-3">
          {pathname === '/' ? 'All-in-one' : 'Platform'}
        </span>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="inline-flex lg:hidden p-2 text-black hover:text-primary transition"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="border-t border-white/10 bg-white/20 backdrop-blur-lg lg:hidden"
        >
          <nav className="mx-auto max-w-6xl flex flex-col px-4 py-4 sm:px-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-black hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Auth Section */}
            <div className="border-t border-white/10 mt-4 pt-4 flex flex-col gap-3">
              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={closeMobileMenu}
                  className={`px-4 py-3 rounded-lg text-sm font-medium w-full transition ${
                    pathname === '/admin'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-100 text-black hover:bg-slate-200'
                  }`}
                >
                  Admin Portal
                </Link>
              )}
              <Link
                href={isAuthenticated ? '/profile' : '/login'}
                onClick={closeMobileMenu}
                className="px-4 py-3 rounded-lg bg-primary text-white text-sm font-semibold w-full text-center transition hover:bg-primary/90"
              >
                {isAuthenticated ? 'My Profile' : 'Log in'}
              </Link>
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  );
};
