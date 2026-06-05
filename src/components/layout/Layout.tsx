'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { FootprintTrail } from '../common/FootprintTrail';
import { PageTransition } from '../common/PageTransition';
import { SmoothScrollProvider } from '../providers/SmoothScrollProvider';
import { ThemeProvider } from '../providers/ThemeProvider';
import { CartProvider } from '@/context/CartContext';
import { AnimatePresence } from 'framer-motion';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        <SmoothScrollProvider>
          <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <FootprintTrail />
            <Header />
            <main className="flex-1 pt-16 sm:pt-20 lg:pt-16">
              <AnimatePresence mode="wait">
                <PageTransition key={typeof window !== 'undefined' ? window.location.pathname : 'server'}>
                  {children}
                </PageTransition>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </SmoothScrollProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
