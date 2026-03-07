'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { FootprintTrail } from '../common/FootprintTrail';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-light text-dark">
      <FootprintTrail />
      <Header />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
