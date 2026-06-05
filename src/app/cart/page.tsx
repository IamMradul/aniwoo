'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowRight, IndianRupee, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeInSection, FadeInItem } from '@/components/common/FadeInSection';

export default function CartPage() {
  const { state, updateQuantity, removeItem } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const taxRate = 0.18; // 18% GST
  const subtotal = state.totalAmount;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleCheckout = () => {
    setIsCheckingOut(true);
    // Simulate a brief loading state before showing the "Coming Soon" modal
    setTimeout(() => {
      setIsCheckingOut(false);
      setShowCheckoutModal(true);
    }, 600);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 min-h-[80vh]">
      <FadeInSection>
        <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
          Shopping Cart
        </h1>
        
        {state.items.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-24 text-center glass-card">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Your cart is empty</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Looks like you haven&apos;t added any premium products for your furry friend yet.
            </p>
            <Link
              href="/shop"
              className="mt-8 rounded-full bg-primary px-8 py-3 font-semibold text-white transition hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8">
              <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <AnimatePresence initial={false}>
                  {state.items.map((item) => (
                    <motion.li 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden', padding: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex p-6 sm:p-8"
                    >
                      <div className="h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover object-center" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No Image</div>
                        )}
                      </div>

                      <div className="ml-6 flex flex-1 flex-col">
                        <div className="flex justify-between sm:space-x-6">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors">
                              <Link href={`/shop/${item.id}`}>{item.name}</Link>
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
                          </div>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            <IndianRupee className="inline h-4 w-4 -mt-0.5 mr-0.5" />{Number(item.price).toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-auto flex flex-col sm:flex-row sm:items-end justify-between pt-4 gap-4">
                          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 w-fit">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-3 py-2 text-slate-500 hover:text-primary dark:text-slate-400 transition-colors"
                              disabled={item.quantity <= 1}
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-2 text-slate-500 hover:text-primary dark:text-slate-400 transition-colors"
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="flex items-center text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Order Summary</h2>
                
                <dl className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <dt>Subtotal ({state.totalQuantity} items)</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">
                      <IndianRupee className="inline h-3.5 w-3.5 -mt-0.5 mr-0.5" />{subtotal.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Estimated Tax (18% GST)</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">
                      <IndianRupee className="inline h-3.5 w-3.5 -mt-0.5 mr-0.5" />{tax.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-4 text-base font-semibold text-slate-900 dark:text-white">
                    <dt>Total Order Amount</dt>
                    <dd>
                      <IndianRupee className="inline h-4 w-4 -mt-0.5 mr-0.5" />{total.toFixed(2)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-8">
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/50 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isCheckingOut ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <>
                        Proceed to Checkout
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  <p>
                    or{' '}
                    <Link href="/shop" className="font-medium text-primary hover:underline">
                      Continue Shopping
                    </Link>
                  </p>
                </div>
              </div>
              
              {/* Trust badges */}
              <div className="mt-6 flex justify-center space-x-6 text-slate-400 dark:text-slate-500 grayscale opacity-60">
                <div className="flex items-center text-xs font-semibold uppercase tracking-wider"><ShieldIcon className="mr-1 h-4 w-4" /> Secure</div>
                <div className="flex items-center text-xs font-semibold uppercase tracking-wider"><TruckIcon className="mr-1 h-4 w-4" /> Fast Delivery</div>
              </div>
            </div>
          </div>
        )}
      </FadeInSection>

      {/* Checkout "Coming Soon" Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowCheckoutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-50 w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Checkout Coming Soon</h3>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                We are currently integrating our secure payment gateway. Checkout functionality will be available in the next update!
              </p>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="mt-8 w-full rounded-full bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Got it, thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

// Simple local SVG components for the trust badges
function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function TruckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
