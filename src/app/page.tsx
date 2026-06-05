'use client';

import Link from 'next/link';
import { PawPrint, Stethoscope, ShoppingBag, Heart, Users, Camera, ChevronDown, CheckCircle2, Star, ArrowRight, Shield, TrendingUp } from 'lucide-react';
import { FadeInSection, FadeInItem } from '@/components/common/FadeInSection';

const serviceCards = [
  {
    title: 'Pet Food & Nutrition',
    icon: PawPrint,
    description: 'Premium quality food and nutrition plans tailored for your pet\'s unique needs.',
    gradient: 'from-orange-500/20 to-amber-500/10',
  },
  {
    title: 'Veterinary Services',
    icon: Stethoscope,
    description: 'Connect with certified vets for consultations, routine checkups, and emergency care.',
    gradient: 'from-teal-500/20 to-emerald-500/10',
  },
  {
    title: 'Pet Grooming Products',
    icon: ShoppingBag,
    description: 'Professional grooming products to keep your pet looking and feeling their best.',
    gradient: 'from-violet-500/20 to-purple-500/10',
  },
  {
    title: 'Pet Care & Sitting',
    icon: Heart,
    description: 'Trusted pet care and sitting services when you\'re away from home.',
    gradient: 'from-rose-500/20 to-pink-500/10',
  },
  {
    title: 'Local Pet Mating Connect',
    icon: Users,
    description: 'Safe community platform to find compatible mates for your pets locally.',
    gradient: 'from-blue-500/20 to-indigo-500/10',
  },
  {
    title: 'AI Disease Detection',
    icon: Camera,
    description: 'Advanced AI technology to detect potential health issues from pet photos.',
    gradient: 'from-emerald-500/20 to-teal-500/10',
  }
];

const reviews = [
  {
    name: 'Sarah M.',
    role: 'Dog Parent',
    text: "Aniwoo's AI detected my dog's skin infection early. Saved us a costly vet visit!",
    initials: 'SM',
    color: 'bg-rose-500',
  },
  {
    name: 'James K.',
    role: 'Cat Parent',
    text: "Best pet grooming products I've found. My cat's coat has never looked better!",
    initials: 'JK',
    color: 'bg-blue-500',
  },
  {
    name: 'Priya S.',
    role: 'Dog Breeder',
    text: 'Found the perfect match for my golden retriever through the mating connect feature!',
    initials: 'PS',
    color: 'bg-emerald-500',
  },
  {
    name: 'Michael R.',
    role: 'Rabbit Owner',
    text: 'Quality pet food delivered fast. My rabbits are healthier than ever!',
    initials: 'MR',
    color: 'bg-amber-500',
  }
];

const stats = [
  { value: 10000, suffix: '+', label: 'Pet Parents Trust Us', icon: Users },
  { value: 85, suffix: '%', label: 'AI Detection Accuracy', icon: TrendingUp },
  { value: 4.9, suffix: '★', label: 'Average Rating', icon: Star, decimals: 1 },
];

// Helper: split text into word spans for stagger animation
function AnimatedWords({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span
          key={i}
          data-animate="hero-word"
          className="inline-block"
          style={{ marginRight: '0.3em' }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  HERO                                                               */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const HeroSection = () => {
  return (
    <section className="relative flex min-h-[93vh] items-start justify-center overflow-hidden bg-dark text-white pt-20 sm:pt-24 md:pt-32">
      <video
        data-animate="hero-video"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        onEnded={(e) => {
          e.currentTarget.play().catch(() => { });
        }}
      >
        <source src="https://nysvcajjiqpqteuxxkmd.supabase.co/storage/v1/object/public/Hero%20video/aniwoo-hero.mp4" type="video/mp4" />
      </video>
      {/* Stronger cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      {/* Warm ambient glow behind content */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        {/* Glass badge */}
        <p
          data-animate="hero-badge"
          className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent backdrop-blur-md"
        >
          <Shield className="mr-2 h-3.5 w-3.5" />
          Trusted Pet Care Platform
        </p>

        {/* Hero headline — larger, bolder */}
        <h1 className="font-display text-5xl font-bold leading-[1.1] sm:text-6xl lg:text-7xl">
          <AnimatedWords text="Complete Pet Care" />
          <br className="hidden sm:block" />
          <AnimatedWords text="Solutions" />
          <span className="text-primary">
            {' '}<AnimatedWords text="at Your Fingertips" />
          </span>
        </h1>

        <p
          data-animate="hero-subtitle"
          className="mt-6 max-w-2xl text-base text-white/60 sm:text-lg lg:text-xl leading-relaxed"
        >
          From nutrition to grooming, vet services to AI health checks — Aniwoo brings everything your pet needs into one smart, loving platform.
        </p>

        {/* CTA buttons with glow */}
        <div
          data-animate="hero-cta"
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <a
            href="#services"
            className="group inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition-all duration-300 hover:shadow-primary/50 hover:scale-[1.02]"
          >
            Explore Services
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <Link
            href="/ai-health-check"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.06] px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/[0.12] hover:border-white/30"
          >
            <Camera className="mr-2 h-4 w-4" />
            Try AI Health Check
          </Link>
        </div>

        {/* Trust bar — glass pill */}
        <div
          data-animate="hero-trust"
          className="mt-12 inline-flex flex-wrap items-center justify-center gap-6 rounded-full border border-white/10 bg-white/[0.04] px-6 py-2.5 text-xs text-white/60 backdrop-blur-sm sm:text-sm"
        >
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-accent fill-accent" />
            <span>Trusted by thousands of pet parents</span>
          </div>
          <div className="hidden h-4 w-px bg-white/20 sm:block" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-secondary" />
            <span>Vet-reviewed care journeys</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <div className="flex flex-col items-center text-xs text-white/40">
          <span>Scroll to explore</span>
          <ChevronDown className="scroll-indicator mt-1 h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  SERVICES                                                           */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ServicesSection = () => {
  return (
    <section
      id="services"
      className="premium-section py-20 sm:py-24"
    >
      {/* Ambient glow blobs */}
      <div className="ambient-glow-orange" style={{ top: '-200px', right: '-100px', opacity: 0.5 }} />
      <div className="ambient-glow-teal" style={{ bottom: '-150px', left: '-80px', opacity: 0.4 }} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Our Services</p>
          <h2
            data-animate="section-header"
            className="font-display text-3xl font-semibold sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            How Aniwoo Helps You
          </h2>
          <p className="mt-4 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            A complete ecosystem to keep your pets healthy, happy, and connected — no matter where you are.
          </p>
        </div>

        <FadeInSection staggerChildren={0.1} className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {serviceCards.map((card) => (
            <FadeInItem key={card.title}>
              <article
                className="glass-card group flex h-full flex-col p-6 transition-all duration-300"
              >
              {/* Icon with gradient background */}
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20`}>
                <card.icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {card.description}
              </p>
              <Link
                href={card.title === 'AI Disease Detection' ? '/ai-health-check' : '/shop'}
                className="mt-5 inline-flex items-center text-sm font-semibold text-primary transition-all group-hover:gap-2"
              >
                Learn More
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </article>
            </FadeInItem>
          ))}
        </FadeInSection>
      </div>
    </section>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  STATS BAR                                                          */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const StatsSection = () => {
  return (
    <section
      className="relative overflow-hidden py-12 sm:py-16"
      style={{
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-tertiary)',
      }}
    >
      <div className="ambient-glow-orange" style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)', opacity: 0.3 }} />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div data-animate="stats-section" className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <span
                data-animate="stat-number"
                data-stat-value={stat.value}
                data-stat-suffix={stat.suffix}
                data-stat-decimals={stat.decimals || 0}
                className="text-3xl font-bold tracking-tight sm:text-4xl"
                style={{ color: 'var(--text-primary)' }}
              >
                0{stat.suffix}
              </span>
              <span className="mt-1 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </span>
              {/* Divider for non-last items on desktop */}
              {index < stats.length - 1 && (
                <div
                  className="absolute right-0 top-1/2 hidden h-12 w-px -translate-y-1/2 sm:block"
                  style={{ backgroundColor: 'var(--border-color)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  AI SCANNER                                                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const AiHighlightSection = () => {
  return (
    <section
      data-animate="ai-section"
      className="premium-section py-20 sm:py-24"
    >
      {/* Ambient glow */}
      <div className="ambient-glow-teal" style={{ top: '10%', left: '-100px', opacity: 0.5 }} />
      <div className="ambient-glow-orange" style={{ bottom: '10%', right: '-100px', opacity: 0.3 }} />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        {/* Scanner Card */}
        <div data-animate="ai-card" className="order-2 flex-1 lg:order-1">
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-primary/30 p-[1px] shadow-2xl shadow-primary/10">
            <div className="relative rounded-[23px] bg-slate-950 p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
                  Aniwoo AI Scanner
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                  Live Preview
                </span>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr,1fr]">
                <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 ring-1 ring-white/5">
                  <div className="relative h-32 w-40 rounded-2xl bg-gradient-to-tr from-amber-300 to-orange-500 shadow-2xl shadow-orange-500/30">
                    <div className="absolute inset-2 rounded-2xl border border-white/30" />
                    <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white backdrop-blur-sm">
                      <Camera className="h-3 w-3" />
                      <span>Analyzing fur &amp; skin...</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">Health status</span>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                      Healthy
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Instant insights</p>
                    <ul className="space-y-1.5">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                        <span>Healthy coat condition</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                        <span>Clear eyes &amp; hydrated nose</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                        <span>Normal posture &amp; energy levels</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Confidence</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="h-2 flex-1 rounded-full bg-slate-800">
                        <div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-secondary to-accent" />
                      </div>
                      <span
                        data-animate="stat-number"
                        data-stat-value="85"
                        data-stat-suffix="%"
                        className="ml-3 text-xs font-semibold text-accent"
                      >
                        0%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text Column */}
        <div data-animate="ai-text" className="order-1 flex-1 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">AI Health Check</p>
          <h2
            data-animate="section-header"
            className="mt-3 font-display text-3xl font-semibold sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            AI-Powered Health Detection
          </h2>
          <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Aniwoo&apos;s AI scanner analyzes your pet&apos;s photos in seconds to highlight potential health concerns, giving you a proactive way to care for their wellbeing.
          </p>
          <ul className="mt-6 space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {[
              'Instant analysis from a single photo or short clip.',
              'Detects common conditions like skin issues, eye irritation, and weight changes.',
              'Provides clear, vet-friendly summaries you can share at appointments.',
              'Free to try and designed to support—not replace—professional veterinary care.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/ai-health-check"
              className="group inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40 hover:scale-[1.02]"
            >
              <Camera className="mr-2 h-4 w-4" />
              Try Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              For informational purposes only. Always consult a licensed veterinarian.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  TESTIMONIALS                                                       */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ReviewsSection = () => {
  return (
    <section
      data-animate="testimonials-section"
      className="premium-section py-20 sm:py-24"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    >
      <div className="ambient-glow-orange" style={{ top: '-100px', right: '20%', opacity: 0.3 }} />
      <div className="ambient-glow-teal" style={{ bottom: '-100px', left: '10%', opacity: 0.3 }} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Testimonials</p>
          <h2
            data-animate="section-header"
            className="font-display text-3xl font-semibold sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Loved by Pet Parents Everywhere
          </h2>
          <p className="mt-4 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Stories from real Aniwoo families who trust us with their pets every day.
          </p>
        </div>

        <FadeInSection staggerChildren={0.15} className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review) => (
            <FadeInItem key={review.name}>
              <figure
                className="glass-card flex h-full flex-col p-5"
              >
              {/* Stars */}
              <div className="flex items-center gap-0.5 text-amber-400" aria-label="5 star rating">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={starIndex} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                &ldquo;{review.text}&rdquo;
              </blockquote>

              {/* Author with avatar */}
              <figcaption className="mt-5 flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${review.color} text-[11px] font-bold text-white`}>
                  {review.initials}
                </div>
                <div>
                  <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{review.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{review.role}</span>
                </div>
                </figcaption>
              </figure>
            </FadeInItem>
          ))}
        </FadeInSection>
      </div>
    </section>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  CTA BANNER                                                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const CtaBanner = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary py-16 text-white sm:py-20">
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-white/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 text-center sm:px-6 sm:text-left lg:flex-row lg:px-8">
        <div className="max-w-lg">
          <h2
            data-animate="section-header"
            className="font-display text-3xl font-semibold sm:text-4xl"
          >
            Join thousands of happy pet parents
          </h2>
          <p className="mt-3 text-sm text-white/70 sm:text-base">
            Build a smarter, more loving care routine for your pets with Aniwoo.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/shop"
            data-animate="cta-button"
            className="group inline-flex items-center justify-center rounded-full bg-white dark:bg-slate-900 px-8 py-3.5 text-sm font-semibold text-dark dark:text-white shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
          >
            Get Started with Aniwoo
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/ai-health-check"
            className="inline-flex items-center justify-center rounded-full border-2 border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/60"
          >
            Explore AI Health Check
          </Link>
        </div>
      </div>
    </section>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  PAGE                                                               */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function Home() {
  return (
    <div>
      <HeroSection />
      <ServicesSection />
      <StatsSection />
      <AiHighlightSection />
      <ReviewsSection />
      <CtaBanner />
    </div>
  );
}
