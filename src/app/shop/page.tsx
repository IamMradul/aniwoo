'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FadeInSection, FadeInItem } from '@/components/common/FadeInSection';
import { SkeletonProductCard } from '@/components/shop/SkeletonProductCard';

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

const PAGE_SIZE = 12;

export default function Shop() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setError(null);
        const response = await fetch('/api/products', {
          next: { revalidate: 300 },
        } as RequestInit);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load products');
        }

        const normalizedProducts: Product[] = (payload.data || []).map((product: Product & { image_url: string | null; image_urls?: string[] }) => {
          const parsedImageUrls = Array.isArray(product?.image_urls)
            ? product.image_urls.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
            : [];

          const fallbackImageUrl = typeof product?.image_url === 'string' && product.image_url.trim().length > 0
            ? product.image_url.trim()
            : null;

          const imageUrls = parsedImageUrls.length > 0
            ? parsedImageUrls
            : fallbackImageUrl
              ? [fallbackImageUrl]
              : [];

          return {
            ...product,
            image_url: imageUrls[0] || null,
            image_urls: imageUrls
          };
        });

        setAllProducts(normalizedProducts);

        setSelectedImages((prev) => {
          const next = { ...prev };
          normalizedProducts.forEach((product) => {
            if (!next[product.id] && product.image_urls.length > 0) {
              next[product.id] = product.image_urls[0];
            }
          });
          return next;
        });
      } catch (err) {
        setError((err as Error).message || 'Unable to load products right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  // Memoize categories
  const categories = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean))).sort() as string[],
    [allProducts]
  );

  // Memoize filtered products
  const filteredProducts = useMemo(() => {
    let result = allProducts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }
    return result;
  }, [allProducts, searchQuery, selectedCategory]);

  // Memoize paginated slice
  const paginatedProducts = useMemo(
    () => filteredProducts.slice(0, page * PAGE_SIZE),
    [filteredProducts, page]
  );

  const hasMore = paginatedProducts.length < filteredProducts.length;

  const handleSelectImage = useCallback((productId: string, url: string) => {
    setSelectedImages((prev) => ({ ...prev, [productId]: url }));
  }, []);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setPage(1);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-semibold text-dark dark:text-white sm:text-3xl">Aniwoo Shop</h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
        Discover premium food, grooming essentials, toys, and wellness products curated for every kind of pet.
      </p>

      {/* Filters */}
      {!loading && !error && allProducts.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {/* Skeleton loading state */}
      {loading && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          {allProducts.length === 0 ? 'No products are published yet. Please check back soon.' : 'No products match your search.'}
        </p>
      )}

      {!loading && !error && paginatedProducts.length > 0 && (
        <>
          <FadeInSection staggerChildren={0.08} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedProducts.map((product, index) => {
              const imgSrc = selectedImages[product.id] || product.image_url || null;
              const isPriority = index < 4;

              return (
                <FadeInItem key={product.id}>
                  <article className="glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:ring-1 hover:ring-primary/50">
                    <Link href={`/shop/${product.id}`} className="block">
                      <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800">
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                            loading={isPriority ? 'eager' : 'lazy'}
                            priority={isPriority}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                            No image available
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-4">
                      {product.image_urls.length > 1 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {product.image_urls.map((url) => (
                            <button
                              key={url}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSelectImage(product.id, url);
                              }}
                              className={`overflow-hidden rounded-lg border ${
                                (selectedImages[product.id] || product.image_url) === url
                                  ? 'border-primary'
                                  : 'border-slate-200 dark:border-slate-700'
                              }`}
                              aria-label={`Show image for ${product.name}`}
                            >
                              <div className="relative h-12 w-12">
                                <Image
                                  src={url}
                                  alt={`${product.name} thumbnail`}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                  loading="lazy"
                                />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      <Link href={`/shop/${product.id}`} className="block group">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{product.category || 'General'}</p>
                        <h2 className="mt-1 text-lg font-semibold text-dark dark:text-white group-hover:text-primary transition-colors">{product.name}</h2>
                        {product.description && (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{product.description}</p>
                        )}
                      </Link>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-base font-semibold text-dark dark:text-white">₹{Number(product.price || 0).toFixed(2)}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.in_stock ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          {product.in_stock ? 'In stock' : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </article>
                </FadeInItem>
              );
            })}
          </FadeInSection>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border-2 border-primary px-8 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
              >
                Load More Products
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Showing {paginatedProducts.length} of {filteredProducts.length} products
          </p>
        </>
      )}
    </main>
  );
}
