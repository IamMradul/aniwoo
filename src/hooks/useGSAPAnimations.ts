'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Module 1: Hero Section — Parallax + Text Reveal ──────────────────────
function initHeroAnimations() {
  // Word-by-word stagger reveal
  const heroWords = gsap.utils.toArray<HTMLElement>('[data-animate="hero-word"]');
  if (heroWords.length) {
    gsap.from(heroWords, {
      y: 80,
      opacity: 0,
      duration: 1,
      stagger: 0.12,
      ease: 'power3.out',
    });
  }

  // CTA buttons fade + slide up with delay
  const heroCtas = gsap.utils.toArray<HTMLElement>('[data-animate="hero-cta"]');
  if (heroCtas.length) {
    gsap.from(heroCtas, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.3,
      stagger: 0.1,
      ease: 'power3.out',
    });
  }

  // Hero badge fade in
  const heroBadge = document.querySelector('[data-animate="hero-badge"]');
  if (heroBadge) {
    gsap.from(heroBadge, {
      y: 12,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
    });
  }

  // Hero subtitle fade in
  const heroSub = document.querySelector('[data-animate="hero-subtitle"]');
  if (heroSub) {
    gsap.from(heroSub, {
      y: 24,
      opacity: 0,
      duration: 0.7,
      delay: 0.2,
      ease: 'power3.out',
    });
  }

  // Hero trust bar
  const heroTrust = document.querySelector('[data-animate="hero-trust"]');
  if (heroTrust) {
    gsap.from(heroTrust, {
      y: 8,
      opacity: 0,
      duration: 0.7,
      delay: 0.5,
      ease: 'power3.out',
    });
  }

  // Parallax — desktop only
  ScrollTrigger.matchMedia({
    '(min-width: 768px)': () => {
      const heroVideo = document.querySelector('[data-animate="hero-video"]');
      if (heroVideo) {
        gsap.to(heroVideo, {
          yPercent: 20,
          ease: 'none',
          scrollTrigger: {
            trigger: heroVideo.closest('section') || heroVideo,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    },
  });
}

// ─── Module 2: Section Headers — Clip-path Wipe ──────────────────────────
function initSectionHeaders() {
  const headers = gsap.utils.toArray<HTMLElement>('[data-animate="section-header"]');
  headers.forEach((header) => {
    gsap.fromTo(
      header,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.9,
        ease: 'power4.inOut',
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          once: true,
        },
      }
    );
  });
}

// ─── Module 3: Services Grid — Staggered Card Rise ──────────────────────
function initServiceCards() {
  const cards = gsap.utils.toArray<HTMLElement>('[data-animate="service-card"]');
  if (cards.length) {
    gsap.from(cards, {
      y: 60,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: cards[0].closest('[data-animate="services-grid"]') || cards[0],
        start: 'top 80%',
        once: true,
      },
    });

    // Hover lift effect
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          y: -6,
          boxShadow: '0 20px 40px rgba(255,107,53,0.2)',
          duration: 0.3,
          ease: 'power2.out',
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0,
          boxShadow: 'none',
          duration: 0.3,
          ease: 'power2.out',
        });
      });
    });
  }
}

// ─── Module 4: AI Scanner Section — Horizontal Slide-In ─────────────────
function initAiScanner() {
  const aiSection = document.querySelector('[data-animate="ai-section"]');
  const aiText = document.querySelector('[data-animate="ai-text"]');
  const aiCard = document.querySelector('[data-animate="ai-card"]');

  if (aiText) {
    gsap.from(aiText, {
      x: -80,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: aiSection || aiText,
        start: 'top 75%',
        once: true,
      },
    });
  }

  if (aiCard) {
    gsap.from(aiCard, {
      x: 80,
      opacity: 0,
      duration: 0.9,
      delay: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: aiSection || aiCard,
        start: 'top 75%',
        once: true,
      },
    });
  }
}

// ─── Module 5: Stats / Trust Bar — Count-Up Numbers ─────────────────────
function initStatsCountUp() {
  const statEls = gsap.utils.toArray<HTMLElement>('[data-animate="stat-number"]');
  statEls.forEach((el) => {
    const targetVal = parseFloat(el.dataset.statValue || '0');
    const suffix = el.dataset.statSuffix || '';
    const decimals = parseInt(el.dataset.statDecimals || '0', 10);

    const obj = { val: 0 };
    gsap.to(obj, {
      val: targetVal,
      duration: 1.5,
      ease: 'power1.out',
      onUpdate: () => {
        if (decimals > 0) {
          el.textContent = obj.val.toFixed(decimals) + suffix;
        } else if (targetVal >= 1000) {
          el.textContent = Math.round(obj.val).toLocaleString() + suffix;
        } else {
          el.textContent = Math.round(obj.val) + suffix;
        }
      },
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });
  });
}

// ─── Module 6: Testimonials — Fade Cascade ──────────────────────────────
function initTestimonials() {
  const testimonialCards = gsap.utils.toArray<HTMLElement>('[data-animate="testimonial-card"]');
  if (testimonialCards.length) {
    gsap.from(testimonialCards, {
      opacity: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: testimonialCards[0].closest('[data-animate="testimonials-section"]') || testimonialCards[0],
        start: 'top 80%',
        once: true,
      },
    });
  }
}

// ─── Module 7: Footer CTA — Scale + Glow Pulse ─────────────────────────
function initFooterCta() {
  const ctaButton = document.querySelector<HTMLElement>('[data-animate="cta-button"]');
  if (ctaButton) {
    gsap.from(ctaButton, {
      scale: 0.92,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ctaButton.closest('section') || ctaButton,
        start: 'top 85%',
        once: true,
      },
      onComplete: () => {
        // Start the looping glow pulse after initial animation
        gsap.to(ctaButton, {
          boxShadow: '0 0 30px rgba(255,107,53,0.5), 0 0 60px rgba(255,107,53,0.2)',
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      },
    });
  }
}

// ─── Main Hook ──────────────────────────────────────────────────────────
export function useGSAPAnimations() {
  useEffect(() => {
    // --- Module 8: Lenis Smooth Scroll ---
    let lenis: InstanceType<typeof import('lenis').default> | null = null;

    const initLenis = async () => {
      const LenisModule = (await import('lenis')).default;
      lenis = new LenisModule();

      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis?.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    };

    initLenis();

    // Initialize all animation modules
    const ctx = gsap.context(() => {
      initHeroAnimations();    // Module 1
      initSectionHeaders();    // Module 2
      initServiceCards();      // Module 3
      initAiScanner();         // Module 4
      initStatsCountUp();      // Module 5
      initTestimonials();      // Module 6
      initFooterCta();         // Module 7
    });

    return () => {
      ctx.revert();
      lenis?.destroy();
    };
  }, []);
}
