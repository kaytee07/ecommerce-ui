'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { apiClient } from '@/lib/api/client';
import { Button, Skeleton } from '@/components/ui';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  FolderTree,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Search,
  Upload,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().regex(/^[a-z0-9-]*$/, 'Only lowercase letters, numbers, and hyphens').optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

type CategoryFormData = z.input<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  displayOrder: number;
  active: boolean;
  productCount?: number;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user?.roles?.join('|')]
  );
  const lastFetchKeyRef = useRef<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryImage, setCategoryImage] = useState<string | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const productCountMap = useMemo(() => {
    const byId = new Map<string, Category>();
    const childrenByParent = new Map<string, Category[]>();
    categories.forEach((cat) => {
      byId.set(cat.id, cat);
      if (cat.parentId) {
        const children = childrenByParent.get(cat.parentId) || [];
        children.push(cat);
        childrenByParent.set(cat.parentId, children);
      }
    });

    const cache = new Map<string, number>();
    const getCount = (id: string): number => {
      if (cache.has(id)) return cache.get(id) as number;
      const category = byId.get(id);
      let total = category?.productCount || 0;
      const children = childrenByParent.get(id) || [];
      children.forEach((child) => {
        total += getCount(child.id);
      });
      cache.set(id, total);
      return total;
    };

    categories.forEach((cat) => getCount(cat.id));
    return cache;
  }, [categories]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      displayOrder: 0,
      active: true,
    },
  });

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canManageCategories) {
      router.push('/admin');
      return;
    }
    const key = `${user.id || user.username || 'user'}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchCategories();
  }, [user, permissions?.canManageCategories, router, fetchCategories]);

  const onSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    setActionError(null);
    try {
      if (editingCategory) {
        const response = await apiClient.put(`/admin/categories/${editingCategory.id}`, data);
        const updatedCategory = response.data.data?.category;
        let imageUrl = updatedCategory?.imageUrl || editingCategory.imageUrl || null;
        if (categoryImageFile) {
          setIsUploadingImage(true);
          try {
            const formData = new FormData();
            formData.append('file', categoryImageFile);
            const imageRes = await apiClient.post(
              `/admin/categories/${editingCategory.id}/image`,
              formData,
              {
                headers: { 'Content-Type': 'multipart/form-data' },
              }
            );
            imageUrl = imageRes.data.data?.imageUrl || imageUrl;
          } catch (uploadErr) {
            console.error('Failed to upload category image', uploadErr);
            setActionError('Category updated, but image upload failed. Please try again.');
          } finally {
            setIsUploadingImage(false);
          }
        }
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id
              ? {
                  ...cat,
                  ...(updatedCategory || data),
                  imageUrl,
                  slug: data.slug || generateSlug(data.name),
                }
              : cat
          )
        );
      } else {
        const response = await apiClient.post('/admin/categories', data);
        const newCategory = response.data.data?.category;
        if (newCategory) {
          let imageUrl = newCategory.imageUrl || null;
          if (categoryImageFile) {
            setIsUploadingImage(true);
            try {
              const formData = new FormData();
              formData.append('file', categoryImageFile);
              const imageRes = await apiClient.post(
                `/admin/categories/${newCategory.id}/image`,
                formData,
                {
                  headers: { 'Content-Type': 'multipart/form-data' },
                }
              );
              imageUrl = imageRes.data.data?.imageUrl || imageUrl;
            } catch (uploadErr) {
              console.error('Failed to upload category image', uploadErr);
              setActionError('Category created, but image upload failed. Please try again.');
            } finally {
              setIsUploadingImage(false);
            }
          }
          setCategories((prev) => [...prev, { ...newCategory, imageUrl }]);
        }
      }
      handleClose();
    } catch (err) {
      console.error('Failed to save category', err);
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(error.response?.data?.message || 'Failed to save category. Please try again.');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Invalid file type. Please upload JPG, PNG, or WebP.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('File too large. Maximum size is 5MB.');
      return;
    }

    setImageError(null);

    setCategoryImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setCategoryImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setCategoryImage(null);
    setCategoryImageFile(null);
    setImageError(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('slug', category.slug);
    setValue('description', category.description || '');
    setValue('parentId', category.parentId || null);
    setValue('displayOrder', category.displayOrder);
    setValue('active', category.active);
    setCategoryImage(category.imageUrl || null);
    setCategoryImageFile(null);
    setImageError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    setDeletingId(id);
    setActionError(null);
    try {
      await apiClient.delete(`/admin/categories/${id}`);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      console.error('Failed to delete category', err);
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(error.response?.data?.message || 'Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (category: Category) => {
    setActionError(null);
    try {
      if (category.active) {
        await apiClient.delete(`/admin/categories/${category.id}`);
      } else {
        await apiClient.post(`/admin/categories/${category.id}/activate`);
      }
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === category.id ? { ...cat, active: !cat.active } : cat
        )
      );
    } catch (err) {
      console.error('Failed to toggle category status', err);
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(error.response?.data?.message || 'Failed to update category status.');
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingCategory(null);
    setCategoryImage(null);
    setCategoryImageFile(null);
    setImageError(null);
    reset();
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build tree structure
  const rootCategories = filteredCategories.filter((cat) => !cat.parentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Skeleton className="h-8 w-full mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  if (user && !permissions?.canManageCategories) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-semibold">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.name && (
                  <p className="text-sm text-error mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (auto-generated if empty)
                </label>
                <input
                  {...register('slug')}
                  placeholder="e.g., electronics, clothing"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.slug && (
                  <p className="text-sm text-error mt-1">{errors.slug.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Category Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Image (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Used for storefront category display. JPG, PNG, or WebP up to 5MB.
                </p>

                {categoryImage ? (
                  <div className="relative w-32 h-32">
                    <Image
                      src={categoryImage}
                      alt="Category image"
                      fill
                      className="object-cover rounded-lg border border-gray-200"
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                    {!isUploadingImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <X className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors flex flex-col items-center justify-center"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Add Image</span>
                      </>
                    )}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  disabled={isUploadingImage}
                  className="hidden"
                />

                {imageError && (
                  <p className="text-sm text-error mt-2">{imageError}</p>
                )}

              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  {...register('parentId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">None (Root Category)</option>
                  {categories
                    .filter((cat) => cat.id !== editingCategory?.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  {...register('displayOrder', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('active')}
                  id="active"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rootCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <FolderTree className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No categories found</p>
                </td>
              </tr>
            ) : (
              rootCategories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  allCategories={filteredCategories}
                  level={0}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  deletingId={deletingId}
                  productCountMap={productCountMap}
                />
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  allCategories,
  level,
  expandedIds,
  toggleExpand,
  onEdit,
  onDelete,
  onToggleActive,
  deletingId,
  productCountMap,
}: {
  category: Category;
  allCategories: Category[];
  level: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleActive: (category: Category) => void;
  deletingId: string | null;
  productCountMap: Map<string, number>;
}) {
  const children = allCategories.filter((c) => c.parentId === category.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const [showMenu, setShowMenu] = useState(false);
  const totalCount = productCountMap.get(category.id) ?? category.productCount ?? 0;

  return (
    <>
      <tr className={cn(!category.active && 'bg-gray-50 text-gray-400')}>
        <td className="px-6 py-4">
          <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-gray-100 rounded mr-2"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-6 mr-2" />
            )}
            {category.imageUrl ? (
              <div className="relative w-8 h-8 mr-3 flex-shrink-0">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ) : (
              <FolderTree className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
            )}
            <span className="font-medium">{category.name}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{category.slug}</td>
        <td className="px-6 py-4 text-center text-sm">{totalCount}</td>
        <td className="px-6 py-4 text-center">
          <span
            className={cn(
              'px-2 py-1 text-xs rounded-full',
              category.active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            {category.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="relative inline-block">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      onEdit(category);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onToggleActive(category);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {category.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      onDelete(category.id);
                      setShowMenu(false);
                    }}
                    disabled={deletingId === category.id}
                    className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </td>
      </tr>
      {isExpanded &&
        children.map((child) => (
          <CategoryRow
            key={child.id}
            category={child}
            allCategories={allCategories}
            level={level + 1}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
            deletingId={deletingId}
            productCountMap={productCountMap}
          />
        ))}
    </>
  );
}
