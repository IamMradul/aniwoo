'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Minus, Plus, ShoppingCart, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeInSection, FadeInItem } from '@/components/common/FadeInSection';
import { useCart } from '@/context/CartContext';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  image_urls: string[];
  in_stock: boolean;
};

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'details'>('description');

  useEffect(() => {
    const loadProductAndRelated = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all products
        const response = await fetch('/api/products');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load products');
        }

        const normalizedProducts: Product[] = (payload.data || []).map((p: any) => {
          const parsedImageUrls = Array.isArray(p?.image_urls)
            ? p.image_urls.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
            : [];

          const fallbackImageUrl = typeof p?.image_url === 'string' && p.image_url.trim().length > 0
            ? p.image_url.trim()
            : null;

          const imageUrls = parsedImageUrls.length > 0
            ? parsedImageUrls
            : fallbackImageUrl
              ? [fallbackImageUrl]
              : [];

          return {
            ...p,
            image_url: imageUrls[0] || null,
            image_urls: imageUrls
          };
        });

        const foundProduct = normalizedProducts.find(p => p.id === productId);

        if (!foundProduct) {
          throw new Error('Product not found');
        }

        setProduct(foundProduct);
        setActiveImage(foundProduct.image_url || null);

        // Find related products (same category, excluding current)
        const related = normalizedProducts
          .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
          .slice(0, 3);
        
        setRelatedProducts(related);

      } catch (err: any) {
        setError(err.message || 'Unable to load product.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      void loadProductAndRelated();
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image_url: product.image_url,
      category: product.category,
    });
    // Visual feedback could be added here, but the cart drawer update is usually enough
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex h-64 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading product details...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Error</h2>
          <p className="mt-2 text-red-600 dark:text-red-300">{error || 'Product not found'}</p>
          <Link href="/shop" className="mt-4 inline-flex items-center text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li><ChevronRight className="h-4 w-4" /></li>
          <li>
            <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          </li>
          <li><ChevronRight className="h-4 w-4" /></li>
          <li className="font-medium text-slate-900 dark:text-slate-200" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <FadeInSection className="grid gap-12 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="glass-card aspect-square overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800/50">
            <AnimatePresence mode="wait">
              {activeImage ? (
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  src={activeImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-slate-400">No image available</span>
              )}
            </AnimatePresence>
          </div>
          
          {product.image_urls.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.image_urls.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`glass-card aspect-square overflow-hidden border-2 transition-all duration-200 ${
                    activeImage === imgUrl ? 'border-primary ring-2 ring-primary/20 ring-offset-2 dark:ring-offset-slate-900' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300 w-fit">
            {product.category || 'General'}
          </div>
          
          <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl mt-2 mb-4">
            {product.name}
          </h1>
          
          <div className="flex items-end gap-4 mb-6">
            <p className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
              <IndianRupee className="h-6 w-6 mr-1" />
              {Number(product.price || 0).toFixed(2)}
            </p>
            <span className={`mb-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${product.in_stock ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
              {product.in_stock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div className="prose prose-sm dark:prose-invert text-slate-600 dark:text-slate-300 mb-8 line-clamp-3">
            <p>{product.description}</p>
          </div>

          <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Quantity Selector */}
              <div className="flex h-12 w-32 items-center justify-between rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={!product.in_stock || quantity <= 1}
                  className="text-slate-500 hover:text-primary disabled:opacity-50 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold text-slate-900 dark:text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  disabled={!product.in_stock}
                  className="text-slate-500 hover:text-primary disabled:opacity-50 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-1 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.in_stock}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary bg-primary/10 px-6 font-semibold text-primary transition-all hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!product.in_stock}
                  className="flex h-12 flex-1 items-center justify-center rounded-full bg-primary px-6 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* Product Details Tabs */}
      <section className="mt-16">
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('description')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'description'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Full Description
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Additional Details
            </button>
          </nav>
        </div>
        <div className="py-6 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'description' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {product.description ? (
                    product.description.split('\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))
                  ) : (
                    <p>No extended description available for this product.</p>
                  )}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2">
                    <span className="font-medium text-slate-900 dark:text-slate-200">Category</span>
                    <span>{product.category || 'General'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2">
                    <span className="font-medium text-slate-900 dark:text-slate-200">Product ID</span>
                    <span className="font-mono text-xs text-slate-400">{product.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2">
                    <span className="font-medium text-slate-900 dark:text-slate-200">Availability</span>
                    <span>{product.in_stock ? 'In Stock' : 'Out of Stock'}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-slate-200 dark:border-slate-800 pt-12">
          <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-8">
            You might also like
          </h2>
          <FadeInSection staggerChildren={0.1} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((relatedProduct) => (
              <FadeInItem key={relatedProduct.id}>
                <Link href={`/shop/${relatedProduct.id}`} className="group block h-full">
                  <article className="glass-card flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:ring-1 hover:ring-primary/50">
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {relatedProduct.image_url ? (
                        <img 
                          src={relatedProduct.image_url} 
                          alt={relatedProduct.name} 
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{relatedProduct.category}</p>
                      <h3 className="mt-1 font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          <IndianRupee className="inline h-4 w-4 mr-0.5 -mt-0.5" />
                          {Number(relatedProduct.price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </article>
                </Link>
              </FadeInItem>
            ))}
          </FadeInSection>
        </section>
      )}
    </main>
  );
}
