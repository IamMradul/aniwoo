'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, Users, Plus, Image as ImageIcon, 
  Trash2, X, Shield, User, HeartPulse, ShoppingBag, IndianRupee,
  MoreVertical, CheckCircle2, AlertCircle, Edit, ArrowRight, XCircle, Eye, EyeOff, ShoppingCart
} from 'lucide-react';

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

type AdminOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  user_id: string;
  razorpay_order_id: string;
  items: any[];
  profiles?: {
    name: string;
    email: string;
  } | null;
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
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'users' | 'orders'>('dashboard');
  const [showProductForm, setShowProductForm] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadUsers = async () => {
    setUsersLoading(true);
    const response = await fetch('/api/admin/users', { credentials: 'include', cache: 'no-store' });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to fetch users');
    }

    setUsersList(payload.data || []);
    setUsersLoading(false);
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    const response = await fetch('/api/admin/products', { credentials: 'include', cache: 'no-store' });
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

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await fetch('/api/admin/orders', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to fetch orders');
      setOrders(payload.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setUsersLoading(false);
      setProductsLoading(false);
      setOrdersLoading(false);
      return;
    }

    const load = async () => {
      try {
        setError(null);
        await Promise.all([loadUsers(), loadProducts(), loadOrders()]);
      } catch (err: any) {
        setError(err.message || 'Failed to load admin data');
        setUsersLoading(false);
        setProductsLoading(false);
        setOrdersLoading(false);
      }
    };

    void load();
  }, [isAuthenticated, isAdmin]);

  const roleStats = useMemo(() => {
    return usersList.reduce(
      (acc, current) => {
        if (current.role === 'admin') acc.admin += 1;
        if (current.role === 'vet') acc.vet += 1;
        if (current.role === 'pet_owner') acc.petOwner += 1;
        return acc;
      },
      { admin: 0, vet: 0, petOwner: 0 }
    );
  }, [usersList]);

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
      setShowProductForm(false);
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
    if (!window.confirm('Are you sure you want to delete this product?')) return;
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

  // --- Render Helpers ---

  const renderDashboard = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Users */}
        <div className="glass-card premium-card p-6 relative overflow-hidden group">
           <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 transition-transform duration-500 group-hover:scale-[2]" />
           <div className="relative flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Users</p>
               <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{usersList.length}</p>
             </div>
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
               <Users className="h-6 w-6" />
             </div>
           </div>
        </div>
        {/* Admins */}
        <div className="glass-card premium-card p-6 relative overflow-hidden group">
           <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-500/10 transition-transform duration-500 group-hover:scale-[2]" />
           <div className="relative flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Admins</p>
               <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{roleStats.admin}</p>
             </div>
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-inner">
               <Shield className="h-6 w-6" />
             </div>
           </div>
        </div>
        {/* Vets */}
        <div className="glass-card premium-card p-6 relative overflow-hidden group">
           <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-500/10 transition-transform duration-500 group-hover:scale-[2]" />
           <div className="relative flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Veterinarians</p>
               <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{roleStats.vet}</p>
             </div>
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-inner">
               <HeartPulse className="h-6 w-6" />
             </div>
           </div>
        </div>
        {/* Pet Owners */}
        <div className="glass-card premium-card p-6 relative overflow-hidden group">
           <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 transition-transform duration-500 group-hover:scale-[2]" />
           <div className="relative flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pet Owners</p>
               <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{roleStats.petOwner}</p>
             </div>
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-inner">
               <User className="h-6 w-6" />
             </div>
           </div>
        </div>
      </div>
      
      {/* Quick Actions & Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2 text-primary" /> Shop Overview
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
               <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Products</span>
               <span className="text-xl font-bold text-slate-900 dark:text-white">{products.length}</span>
             </div>
             <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
               <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Orders</span>
               <span className="text-xl font-bold text-slate-900 dark:text-white">{orders.length}</span>
             </div>
             <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
               <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Out of Stock</span>
               <span className="text-xl font-bold text-red-600 dark:text-red-400">{products.filter(p => !p.in_stock).length}</span>
             </div>
             <button 
                onClick={() => { setActiveTab('products'); setShowProductForm(true); }} 
                className="mt-6 w-full flex items-center justify-center py-3.5 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
             >
               <Plus className="w-5 h-5 mr-2" /> Add New Product
             </button>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
            <Shield className="w-64 h-64 text-slate-900 dark:text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Welcome to Admin Portal</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              Manage your users, organize shop inventory, and oversee platform operations. Keep everything running smoothly.
            </p>
          </div>
          <div className="mt-8">
            <Link href="/profile" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Manage personal profile <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderProducts = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Product Catalog</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your store inventory and visibility.</p>
        </div>
        <button 
          onClick={() => setShowProductForm(!showProductForm)}
          className="flex items-center px-5 py-2.5 bg-primary text-white rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
        >
          {showProductForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showProductForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>
  
      <AnimatePresence>
        {showProductForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 sm:p-8 mt-2 border-t-4 border-t-primary">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Create New Product</h3>
              <form onSubmit={handleCreateProduct} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Product name *</label>
                      <input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        placeholder="e.g. Healthy Puppy Kibble"
                      />
                    </div>
        
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="price" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Price (INR) *</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="899"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Category</label>
                        <input
                          id="category"
                          value={form.category}
                          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="e.g. Food, Toys"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Description</label>
                      <textarea
                        id="description"
                        rows={4}
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                        placeholder="Provide details about the product..."
                      />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Product Photos</label>
                      <label htmlFor="productImages" className="mt-1 flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                        </div>
                        <input
                          id="productImages"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      
                      {uploadingImages && (
                        <p className="mt-3 text-xs font-semibold text-primary animate-pulse flex items-center">
                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading images...
                        </p>
                      )}
        
                      {form.image_urls.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                          {form.image_urls.map((url) => (
                            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                              <img src={url} alt="Product preview" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeFormImage(url)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                aria-label="Remove image"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Visibility & Status</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.in_stock}
                            onChange={(e) => setForm((prev) => ({ ...prev, in_stock: e.target.checked }))}
                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">In Stock</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Active (Visible in Shop)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
        
                <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5 disabled:transform-none disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving Product...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
  
      {/* Products Grid */}
      {productsLoading ? (
        <div className="py-12 text-center text-slate-500">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No products found</h3>
          <p className="mt-1 text-slate-500 dark:text-slate-400 mb-6">Get started by creating your first product.</p>
          <button 
            onClick={() => setShowProductForm(true)}
            className="px-6 py-2 bg-primary/10 text-primary rounded-full font-medium hover:bg-primary/20 transition-colors"
          >
            Add Product
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="glass-card flex flex-col overflow-hidden group">
              <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex w-full h-full items-center justify-center text-slate-400"><ImageIcon className="w-8 h-8 opacity-50" /></div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md ${product.in_stock ? 'bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30'}`}>
                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md ${product.is_active ? 'bg-white/50 dark:bg-black/50 text-slate-800 dark:text-white border border-white/20' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'}`}>
                    {product.is_active ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{product.category || 'General'}</p>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap ml-3">
                    <IndianRupee className="inline w-3.5 h-3.5 -mt-0.5 mr-0.5" />{Number(product.price).toFixed(2)}
                  </p>
                </div>
                
                <div className="mt-auto pt-4 flex gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => toggleProductStatus(product.id, 'in_stock', product.in_stock)}
                    className="flex-1 flex items-center justify-center py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    {product.in_stock ? <XCircle className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-500" />}
                    {product.in_stock ? 'Set Out' : 'Set In Stock'}
                  </button>
                  <button
                    onClick={() => toggleProductStatus(product.id, 'is_active', product.is_active)}
                    className="flex-1 flex items-center justify-center py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    {product.is_active ? <EyeOff className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 mr-1.5 text-primary" />}
                    {product.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="flex items-center justify-center w-10 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    aria-label="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderUsers = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
       <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Directory</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View and manage registered accounts.</p>
        </div>
      </div>
      
      <div className="glass-card overflow-hidden">
        {usersLoading ? (
          <div className="py-12 text-center text-slate-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {usersList.map((entry) => {
                  // Role badge logic
                  let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  let RoleIcon = User;
                  if (entry.role === 'admin') {
                    badgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30';
                    RoleIcon = Shield;
                  } else if (entry.role === 'vet') {
                    badgeColor = 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30';
                    RoleIcon = HeartPulse;
                  } else if (entry.role === 'pet_owner') {
                    badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30';
                  }

                  const initials = (entry.name || 'U').substring(0, 2).toUpperCase();

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-xs border border-primary/10">
                            {initials}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-slate-900 dark:text-white">{entry.name || 'Unnamed user'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 opacity-70 truncate max-w-[120px]" title={entry.id}>{entry.id.substring(0,8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{entry.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
                          <RoleIcon className="w-3.5 h-3.5 mr-1.5" />
                          {entry.role === 'pet_owner' ? 'Pet Owner' : entry.role === 'vet' ? 'Veterinarian' : entry.role === 'admin' ? 'Admin' : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderOrders = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Orders</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View all customer orders and their status.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {ordersLoading ? (
          <div className="py-12 text-center text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <ShoppingCart className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p>No orders found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {orders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400" title={order.id}>
                          {order.id.split('-')[0]}...
                        </span>
                        <div className="text-xs text-slate-400 mt-0.5">RP: {order.razorpay_order_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{order.profiles?.name || 'Guest User'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{order.profiles?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        <IndianRupee className="inline w-3 h-3 -mt-0.5 mr-0.5" />{order.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 border border-green-200 dark:border-green-500/30' :
                          order.status === 'created' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {order.items?.length || 0} items
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );

  // --- Main Layout Render ---

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-10">
        <section className="glass-card p-8 text-center max-w-md w-full">
          <Shield className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold text-dark dark:text-white">Admin Login Required</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Please sign in with an administrator account to access this portal.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            Go to Login
          </Link>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-10">
        <section className="glass-card p-8 text-center max-w-md w-full border-t-4 border-t-red-500">
          <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold text-dark dark:text-white">Access Denied</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">This area is highly restricted. Your account does not have administrator privileges.</p>
          <Link href="/profile" className="mt-6 inline-flex rounded-full border-2 border-slate-200 dark:border-slate-700 px-8 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            Return to Profile
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[85vh] max-w-7xl flex-col lg:flex-row px-4 py-8 sm:px-6 lg:px-8 gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 flex-shrink-0">
        <div className="lg:sticky lg:top-24 glass-card p-4">
          <div className="px-3 pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Admin Portal</h2>
          </div>
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'products' 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" /> Products
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'users' 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> Users
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'orders' 
                  ? 'bg-primary text-white shadow-md shadow-primary/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Orders
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 pb-12">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400 flex items-start shadow-sm">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="pt-0.5">{error}</p>
          </motion.div>
        )}
        
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <motion.div key="dashboard">{renderDashboard()}</motion.div>}
          {activeTab === 'products' && <motion.div key="products">{renderProducts()}</motion.div>}
          {activeTab === 'users' && <motion.div key="users">{renderUsers()}</motion.div>}
          {activeTab === 'orders' && <motion.div key="orders">{renderOrders()}</motion.div>}
        </AnimatePresence>
      </div>
    </main>
  );
}
