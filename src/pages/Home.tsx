import { Link } from 'react-router-dom';
import { PawPrint, Stethoscope, ShoppingBag, Heart, Users, Camera, ChevronDown, CheckCircle2, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeInSection } from '../components/common/FadeInSection';

const serviceCards = [
  {
    title: 'Pet Food & Nutrition',
    icon: PawPrint,
    description: 'Premium quality food and nutrition plans tailored for your pet’s unique needs.'
  },
  {
    title: 'Veterinary Services',
    icon: Stethoscope,
    description: 'Connect with certified vets for consultations, routine checkups, and emergency care.'
  },
  {
    title: 'Pet Grooming Products',
    icon: ShoppingBag,
    description: 'Professional grooming products to keep your pet looking and feeling their best.'
  },
  {
    title: 'Pet Care & Sitting',
    icon: Heart,
    description: 'Trusted pet care and sitting services when you’re away from home.'
  },
  {
    title: 'Local Pet Mating Connect',
    icon: Users,
    description: 'Safe community platform to find compatible mates for your pets locally.'
  },
  {
    title: 'AI Disease Detection',
    icon: Camera,
    description: 'Advanced AI technology to detect potential health issues from pet photos.'
  }
];

const reviews = [
  {
    name: 'Sarah M.',
    role: 'Dog Parent',
    text: "Aniwoo's AI detected my dog's skin infection early. Saved us a costly vet visit!"
  },
  {
    name: 'James K.',
    role: 'Cat Parent',
    text: "Best pet grooming products I've found. My cat's coat has never looked better!"
  },
  {
    name: 'Priya S.',
    role: 'Dog Breeder',
    text: 'Found the perfect match for my golden retriever through the mating connect feature!'
  },
  {
    name: 'Michael R.',
    role: 'Rabbit Owner',
    text: 'Quality pet food delivered fast. My rabbits are healthier than ever!'
  }
];

const HeroSection = () => {
  return (
    <section className="relative flex min-h-[93vh] items-start justify-center overflow-hidden bg-dark text-white pt-20 sm:pt-24 md:pt-32">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        {/* Place your compressed background videos in /public/media with the names below */}
        {/* Recommended: <5MB, 8–12s loop of playful pets, encoded as MP4 + WebM */}
        <source src="/media/aniwoo-hero.webm" type="video/webm" />
        <source src="/media/aniwoo-hero.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/65 to-dark/90" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-3 inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          Your Pet&apos;s Best Friend
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-4xl font-bold sm:text-5xl lg:text-6xl"
        >
          Complete Pet Care Solutions
          <span className="block text-accent">at Your Fingertips</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-4 max-w-2xl text-base text-slate-100 sm:text-lg"
        >
          From nutrition to grooming, vet services to AI health checks—Aniwoo brings everything your pet needs into one
          smart, loving platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <a
            href="#services"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          >
            Explore Services
          </a>
          <Link
            to="/ai-health-check"
            className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/5 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
          >
            <Camera className="mr-2 h-4 w-4" />
            Try AI Health Check
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-200/90 sm:text-sm"
        >
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            <span>Trusted by thousands of pet parents</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-secondary" />
            <span>Vet-reviewed care journeys</span>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <div className="flex flex-col items-center text-xs text-slate-100/80">
          <span>Scroll to explore</span>
          <ChevronDown className="scroll-indicator mt-1 h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

const ServicesSection = () => {
  return (
    <FadeInSection id="services" className="paw-pattern-bg border-y border-slate-100/80 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold text-dark sm:text-3xl">How Aniwoo Helps You</h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            A complete ecosystem to keep your pets healthy, happy, and connected—no matter where you are.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviceCards.map((card, index) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={[
                'group flex flex-col rounded-2xl p-5',
                'bg-gradient-to-br from-white via-white/95 to-secondary/5',
                'ring-1 ring-slate-200/80 shadow-[2px_4px_16px_0_rgba(15,23,42,0.08)_inset]',
                'transform-gpu transition duration-200 ease-out',
                'hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/15'
              ].join(' ')}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white group-hover:shadow-md">
                <card.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="transform-gpu transition duration-200 group-hover:translate-y-0.5 group-hover:scale-[0.99]">
                <h3 className="text-base font-semibold text-dark">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
              </div>
              <Link
                to={card.title === 'AI Disease Detection' ? '/ai-health-check' : '/services'}
                className="mt-4 inline-flex items-center text-sm font-semibold text-primary transition group-hover:translate-x-1 group-hover:text-primary/90"
              >
                Learn More
                <ChevronDown className="ml-1 h-3 w-3 -rotate-90" aria-hidden="true" />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </FadeInSection>
  );
};

const AiHighlightSection = () => {
  return (
    <FadeInSection className="bg-white py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:px-8">
        <div className="order-2 flex-1 lg:order-1">
          <div className="relative h-full rounded-3xl bg-gradient-to-br from-dark via-dark to-primary p-1">
            <div className="relative h-full rounded-[20px] bg-slate-950/90 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
                  Aniwoo AI Scanner
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                  Live Preview
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr,1fr]">
                <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                  <div className="relative h-32 w-40 rounded-2xl bg-gradient-to-tr from-amber-300 to-orange-500 shadow-2xl">
                    <div className="absolute inset-2 rounded-2xl border border-white/30" />
                    <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white">
                      <Camera className="h-3 w-3" />
                      <span>Analyzing fur &amp; skin...</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">Health status</span>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                      Healthy
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Instant insights</p>
                    <ul className="space-y-1">
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
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Confidence</p>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="h-2 flex-1 rounded-full bg-slate-800">
                        <div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-secondary to-accent" />
                      </div>
                      <span className="ml-2 text-xs font-semibold text-accent">85%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 flex-1 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">AI Health Check</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-dark sm:text-3xl">
            AI-Powered Health Detection
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Aniwoo&apos;s AI scanner analyzes your pet&apos;s photos in seconds to highlight potential health concerns,
            giving you a proactive way to care for their wellbeing.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-secondary" />
              <span>Instant analysis from a single photo or short clip.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-secondary" />
              <span>Detects common conditions like skin issues, eye irritation, and weight changes.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-secondary" />
              <span>Provides clear, vet-friendly summaries you can share at appointments.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-secondary" />
              <span>Free to try and designed to support—not replace—professional veterinary care.</span>
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/ai-health-check"
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              <Camera className="mr-2 h-4 w-4" />
              Try Now
            </Link>
            <span className="text-xs text-slate-500">
              This AI analysis is for informational purposes only. Always consult a licensed veterinarian for
              professional diagnosis.
            </span>
          </div>
        </div>
      </div>
    </FadeInSection>
  );
};

const ReviewsSection = () => {
  return (
    <FadeInSection className="bg-light py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold text-dark sm:text-3xl">
            Loved by Pet Parents Across the Community
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Stories from real Aniwoo families who trust us with their pets every day.
          </p>
        </div>

        <div className="mt-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {reviews.map((review, index) => (
              <motion.figure
                key={review.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
              >
                <div className="flex items-center gap-1 text-amber-400" aria-label="5 star rating">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm text-slate-700">&ldquo;{review.text}&rdquo;</blockquote>
                <figcaption className="mt-4 text-xs font-medium text-slate-600">
                  <span className="block text-dark">{review.name}</span>
                  <span className="text-slate-500">{review.role}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>

          {/* Simple autoplay effect via CSS + framer-motion; carousel controls can be expanded later */}
          <div className="mt-6 flex justify-center gap-2">
            {reviews.map((_, index) => (
              <span
                // We do not implement full stateful carousel yet, but dots visually suggest rotation
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-slate-300"
              />
            ))}
          </div>
        </div>
      </div>
    </FadeInSection>
  );
};

const CtaBanner = () => {
  return (
    <FadeInSection className="bg-gradient-to-r from-primary via-secondary to-primary py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 text-center sm:px-6 sm:text-left lg:flex-row lg:px-8">
        <div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Join thousands of happy pet parents
          </h2>
          <p className="mt-2 text-sm text-white/80 sm:text-base">
            Build a smarter, more loving care routine for your pets with Aniwoo.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/shop"
            className="inline-flex items-center justify-center rounded-full bg-dark/90 px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-dark"
          >
            Get Started with Aniwoo
          </Link>
          <Link
            to="/ai-health-check"
            className="inline-flex items-center justify-center rounded-full border border-white/80 px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-dark"
          >
            Explore AI Health Check
          </Link>
        </div>
      </div>
    </FadeInSection>
  );
};

const Home = () => {
  return (
    <div>
      <HeroSection />
      <ServicesSection />
      <AiHighlightSection />
      <ReviewsSection />
      <CtaBanner />
    </div>
  );
};

export default Home;


