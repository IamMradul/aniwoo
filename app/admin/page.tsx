'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: 'vet' | 'pet_owner' | 'admin' | null;
  created_at?: string;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  image_urls: string[];
  in_stock: boolean;
  is_active: boolean;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  image_urls: string[];
  in_stock: boolean;
  is_active: boolean;
};

const initialForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  image_urls: [],
  in_stock: true,
  is_active: true
};

export default function AdminPortalPage() {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadUsers = async () => {
    setUsersLoading(true);
    const response = await fetch('/api/admin/users', { credentials: 'include' });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to fetch users');
    }

    setUsers(payload.data || []);
    setUsersLoading(false);
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    const response = await fetch('/api/admin/products', { credentials: 'include' });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to fetch products');
    }

    const normalizedProducts = (payload.data || []).map((product: any) => {
      const imageUrls = Array.isArray(product?.image_urls)
        ? product.image_urls.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
        : [];

      return {
        ...product,
        image_url: imageUrls[0] || product?.image_url || null,
        image_urls: imageUrls
      } as Product;
    });

    setProducts(normalizedProducts);
    setProductsLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setUsersLoading(false);
      setProductsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setError(null);
        await Promise.all([loadUsers(), loadProducts()]);
      } catch (err: any) {
        setError(err.message || 'Failed to load admin data');
        setUsersLoading(false);
        setProductsLoading(false);
      }
    };

    void load();
  }, [isAuthenticated, isAdmin]);

  const roleStats = useMemo(() => {
    return users.reduce(
      (acc, current) => {
        if (current.role === 'admin') acc.admin += 1;
        if (current.role === 'vet') acc.vet += 1;
        if (current.role === 'pet_owner') acc.petOwner += 1;
        return acc;
      },
      { admin: 0, vet: 0, petOwner: 0 }
    );
  }, [users]);

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || form.price.trim() === '') {
      setError('Product name and price are required.');
      return;
    }

    const parsedPrice = Number(form.price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Price must be a non-negative number.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parsedPrice,
          category: form.category,
          image_urls: form.image_urls,
          in_stock: form.in_stock,
          is_active: form.is_active
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create product');
      }

      setForm(initialForm);
      await loadProducts();
    } catch (err: any) {
      setError(err.message || 'Unable to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const files = Array.from(selectedFiles);
    setUploadingImages(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/admin/products/images', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to upload product images');
      }

      const uploadedUrls = Array.isArray(payload?.data?.urls)
        ? payload.data.urls.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
        : [];

      if (uploadedUrls.length === 0) {
        throw new Error('No image URLs were returned from upload');
      }

      setForm((prev) => ({
        ...prev,
        image_urls: Array.from(new Set([...prev.image_urls, ...uploadedUrls]))
      }));
    } catch (err: any) {
      setError(err.message || 'Unable to upload images');
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  const removeFormImage = (url: string) => {
    setForm((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((entry) => entry !== url)
    }));
  };

  const toggleProductStatus = async (id: string, key: 'is_active' | 'in_stock', current: boolean) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, [key]: !current })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update product');
      }

      await loadProducts();
    } catch (err: any) {
      setError(err.message || 'Unable to update product');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete product');
      }

      await loadProducts();
    } catch (err: any) {
      setError(err.message || 'Unable to delete product');
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-white/90 p-8 text-center shadow-md ring-1 ring-slate-100">
          <h1 className="font-display text-2xl font-semibold text-dark">Admin login required</h1>
          <p className="mt-3 text-sm text-slate-600">Please sign in with an admin account to access the portal.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white">
            Go to Login
          </Link>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-white/90 p-8 text-center shadow-md ring-1 ring-slate-100">
          <h1 className="font-display text-2xl font-semibold text-dark">Access denied</h1>
          <p className="mt-3 text-sm text-slate-600">This area is reserved for admin users only.</p>
          <Link href="/profile" className="mt-5 inline-flex rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700">
            Back to Profile
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-white/90 p-6 shadow-md ring-1 ring-slate-100 sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">Aniwoo Admin Portal</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Manage users, publish shop products, and operate core platform workflows from one place.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total users</p>
            <p className="mt-1 text-2xl font-semibold text-dark">{users.length}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Admins</p>
            <p className="mt-1 text-2xl font-semibold text-dark">{roleStats.admin}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Veterinarians</p>
            <p className="mt-1 text-2xl font-semibold text-dark">{roleStats.vet}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pet owners</p>
            <p className="mt-1 text-2xl font-semibold text-dark">{roleStats.petOwner}</p>
          </article>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr,1.15fr]">
        <article className="rounded-3xl bg-white/90 p-6 shadow-md ring-1 ring-slate-100">
          <h2 className="font-display text-xl font-semibold text-dark">Create Product</h2>
          <p className="mt-1 text-sm text-slate-600">Products added here appear automatically in the shop.</p>

          <form onSubmit={handleCreateProduct} className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Product name</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="Healthy Puppy Kibble"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Price (INR)</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                  placeholder="899"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Category</label>
                <input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                  placeholder="Food"
                />
              </div>
            </div>

            <div>
              <label htmlFor="productImages" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Product photos</label>
              <input
                id="productImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
              />
              <p className="mt-1 text-xs text-slate-500">Upload one or more product images (max 10 files, 5MB each).</p>

              {uploadingImages && (
                <p className="mt-2 text-xs font-semibold text-primary">Uploading images...</p>
              )}

              {form.image_urls.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {form.image_urls.map((url) => (
                    <div key={url} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img src={url} alt="Product preview" className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFormImage(url)}
                        className="absolute right-1 top-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-red-600 shadow"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Description</label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="High-protein, vet-approved nutrition for growing puppies."
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.in_stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, in_stock: e.target.checked }))}
                />
                In stock
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
                Active in shop
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? 'Saving...' : 'Add Product'}
            </button>
          </form>
        </article>

        <article className="rounded-3xl bg-white/90 p-6 shadow-md ring-1 ring-slate-100">
          <h2 className="font-display text-xl font-semibold text-dark">Products</h2>
          <p className="mt-1 text-sm text-slate-600">Toggle availability or remove outdated items.</p>

          {productsLoading ? (
            <p className="mt-5 text-sm text-slate-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">No products yet. Add your first product using the form.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {products.map((product) => (
                <li key={product.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-dark">{product.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.category || 'General'} | INR {Number(product.price || 0).toFixed(2)}
                      </p>
                      {product.image_urls.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {product.image_urls.slice(0, 4).map((url) => (
                            <img
                              key={url}
                              src={url}
                              alt={`${product.name} thumbnail`}
                              className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                            />
                          ))}
                          {product.image_urls.length > 4 && (
                            <span className="inline-flex h-12 items-center rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-600">
                              +{product.image_urls.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      {product.description && <p className="mt-2 text-sm text-slate-600">{product.description}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleProductStatus(product.id, 'in_stock', product.in_stock)}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
                      >
                        {product.in_stock ? 'Mark Out of Stock' : 'Mark In Stock'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleProductStatus(product.id, 'is_active', product.is_active)}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
                      >
                        {product.is_active ? 'Hide from Shop' : 'Show in Shop'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="mt-8 rounded-3xl bg-white/90 p-6 shadow-md ring-1 ring-slate-100">
        <h2 className="font-display text-xl font-semibold text-dark">Users</h2>
        {usersLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading users...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-dark">{entry.name || 'Unnamed user'}</td>
                    <td className="py-2 pr-3 text-slate-700">{entry.email}</td>
                    <td className="py-2 pr-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {entry.role || 'unknown'}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-600">
                      {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
