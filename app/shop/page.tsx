'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  in_stock: boolean;
};

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setError(null);
        const response = await fetch('/api/products');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load products');
        }

        setProducts(payload.data || []);
      } catch (err: any) {
        setError(err.message || 'Unable to load products right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">Aniwoo Shop</h1>
      <p className="mt-3 text-sm text-slate-600 sm:text-base">
        Discover premium food, grooming essentials, toys, and wellness products curated for every kind of pet.
      </p>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading products...</p>}

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">No products are published yet. Please check back soon.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
                  No image available
                </div>
              )}
              <div className="p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{product.category || 'General'}</p>
                <h2 className="mt-1 text-lg font-semibold text-dark">{product.name}</h2>
                {product.description && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{product.description}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-base font-semibold text-dark">INR {Number(product.price || 0).toFixed(2)}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.in_stock ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {product.in_stock ? 'In stock' : 'Out of stock'}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
