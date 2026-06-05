'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, Menu, X, Sun, Moon, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useCart } from '@/context/CartContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useState, useEffect } from 'react';

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
  const { theme, toggleTheme } = useTheme();
  const { state: cartState } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] py-1'
          : 'bg-transparent py-3'
      }`}
      style={{
        backgroundColor: isScrolled ? 'var(--header-bg)' : 'transparent',
        borderBottom: isScrolled ? '1px solid var(--header-border)' : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
          <motion.div
            whileHover={{ rotate: -10 }}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white shadow-md"
            aria-label="Aniwoo logo"
          >
            <PawPrint className="h-5 w-5" />
          </motion.div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold sm:text-xl" style={{ color: 'var(--text-primary)' }}>Aniwoo</span>
            <span className="hidden text-xs font-medium sm:block" style={{ color: 'var(--text-muted)' }}>Your Pet&apos;s Best Friend</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-primary ${pathname === item.href ? 'text-primary' : ''}`}
              style={{ color: pathname === item.href ? undefined : 'var(--text-secondary)' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 hover:bg-primary/10"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-[18px] w-[18px] theme-toggle-icon" />
            ) : (
              <Sun className="h-[18px] w-[18px] theme-toggle-icon" />
            )}
          </button>

          {/* Cart Toggle */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 hover:bg-primary/10"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Open cart"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            <AnimatePresence>
              {cartState.totalQuantity > 0 && (
                <motion.span
                  key={cartState.totalQuantity}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white shadow-sm"
                >
                  {cartState.totalQuantity}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {isAuthenticated && user?.role === 'admin' && (
            <Link
              href="/admin"
              className="rounded-full border px-4 py-2 text-xs font-semibold transition"
              style={{
                borderColor: pathname === '/admin' ? '#FF6B35' : 'var(--border-color)',
                color: pathname === '/admin' ? '#FF6B35' : 'var(--text-primary)',
              }}
            >
              Admin Portal
            </Link>
          )}
          <Link
            href={isAuthenticated ? '/profile' : '/login'}
            className="rounded-full border px-4 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            {isAuthenticated ? 'My Profile' : 'Log in'}
          </Link>
        </div>

        {/* Status Badge */}
        <span className="hidden rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-secondary sm:inline-flex lg:px-3">
          {pathname === '/' ? 'All-in-one' : 'Platform'}
        </span>

        {/* Mobile: Theme + Cart + Menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 hover:bg-primary/10"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-[18px] w-[18px]" />
            ) : (
              <Sun className="h-[18px] w-[18px]" />
            )}
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 hover:bg-primary/10"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Open cart"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            <AnimatePresence>
              {cartState.totalQuantity > 0 && (
                <motion.span
                  key={cartState.totalQuantity}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white shadow-sm"
                >
                  {cartState.totalQuantity}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex p-2 transition hover:text-primary"
            style={{ color: 'var(--text-primary)' }}
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
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="lg:hidden"
          style={{
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
          }}
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
                    : 'hover:bg-primary/5'
                }`}
                style={{ color: pathname === item.href ? undefined : 'var(--text-primary)' }}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Auth Section */}
            <div className="mt-4 pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={closeMobileMenu}
                  className={`px-4 py-3 rounded-lg text-sm font-medium w-full transition ${
                    pathname === '/admin'
                      ? 'bg-primary/10 text-primary'
                      : ''
                  }`}
                  style={{
                    color: pathname === '/admin' ? undefined : 'var(--text-primary)',
                    backgroundColor: pathname === '/admin' ? undefined : 'var(--bg-tertiary)',
                  }}
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

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};
