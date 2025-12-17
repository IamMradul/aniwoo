import { Link } from 'react-router-dom';
import { PawPrint, Facebook, Instagram, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white/90">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr,1fr,1fr,1.5fr]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
                <PawPrint className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="font-display text-lg font-semibold text-dark">Aniwoo</span>
            </div>
            <p className="max-w-xs text-sm text-slate-600">
              Complete pet care solutions from nutrition to grooming, vet services to AI health checks.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/" className="transition hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="transition hover:text-primary">
                  Services &amp; Shop
                </Link>
              </li>
              <li>
                <Link to="/ai-health-check" className="transition hover:text-primary">
                  AI Health Check
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition hover:text-primary">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Contact</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Email: support@aniwoo.pet</li>
              <li>Phone: +1 (555) 987-1234</li>
              <li>Address: 123 Pet Lane, Paw City</li>
            </ul>
            <div className="mt-3 flex gap-3" aria-label="Social media links">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary"
                aria-label="Aniwoo on Facebook"
              >
                <Facebook className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary"
                aria-label="Aniwoo on Instagram"
              >
                <Instagram className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary"
                aria-label="Aniwoo on X (Twitter)"
              >
                <Twitter className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Newsletter</h3>
            <p className="mb-3 text-sm text-slate-600">
              Get pet care tips, product recommendations, and exclusive offers delivered to your inbox.
            </p>
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: Integrate with newsletter backend
              }}
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="Enter your email"
                className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row">
          <p>© 2024 Aniwoo. All rights reserved.</p>
          <div className="flex gap-4">
            <button type="button" className="transition hover:text-primary">
              Privacy Policy
            </button>
            <button type="button" className="transition hover:text-primary">
              Terms
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};


