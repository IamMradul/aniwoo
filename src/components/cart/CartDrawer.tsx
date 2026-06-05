'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useEffect } from 'react';

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state, updateQuantity, removeItem } = useCart();

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 id="cart-title" className="font-display text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5 text-primary" />
                Your Cart
                <span className="ml-3 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {state.totalQuantity} {state.totalQuantity === 1 ? 'item' : 'items'}
                </span>
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {state.items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Your cart is empty</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Looks like you haven&apos;t added anything to your cart yet.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-8 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <ul className="space-y-6">
                  {state.items.map((item) => (
                    <li key={item.id} className="flex py-2">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover object-center" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No Image</div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-sm font-medium text-slate-900 dark:text-white">
                            <h3 className="line-clamp-2 pr-4"><Link href={`/shop/${item.id}`} onClick={onClose} className="hover:text-primary transition-colors">{item.name}</Link></h3>
                            <p className="ml-4 whitespace-nowrap"><IndianRupee className="inline h-3.5 w-3.5 -mt-0.5 mr-0.5" />{Number(item.price).toFixed(2)}</p>
                          </div>
                          {item.category && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.category}</p>}
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2.5 py-1.5 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2.5 py-1.5 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="font-medium text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {state.items.length > 0 && (
              <div className="border-t border-slate-200 px-6 py-6 dark:border-slate-800">
                <div className="flex justify-between text-base font-semibold text-slate-900 dark:text-white mb-6">
                  <p>Subtotal</p>
                  <p><IndianRupee className="inline h-4 w-4 -mt-0.5 mr-0.5" />{state.totalAmount.toFixed(2)}</p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/cart"
                    onClick={onClose}
                    className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
                  >
                    View Full Cart
                  </Link>
                </div>
                <div className="mt-6 flex justify-center text-center text-xs text-slate-500 dark:text-slate-400">
                  <p>
                    or{' '}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={onClose}
                    >
                      Continue Shopping
                      <span aria-hidden="true"> &rarr;</span>
                    </button>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
