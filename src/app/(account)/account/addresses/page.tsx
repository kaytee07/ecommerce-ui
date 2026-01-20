'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { Button, Skeleton } from '@/components/ui';
import { Plus, MapPin, Edit2, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
  label: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface Address extends AddressFormData {
  id: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/users/me/addresses');
      setAddresses(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
      // Use dummy data for demo
      setAddresses([
        {
          id: '1',
          label: 'Home',
          street: '123 Independence Avenue',
          city: 'Accra',
          region: 'Greater Accra',
          country: 'Ghana',
          postalCode: '00233',
          phone: '+233201234567',
          isDefault: true,
        },
        {
          id: '2',
          label: 'Work',
          street: '45 Liberation Road',
          city: 'Accra',
          region: 'Greater Accra',
          country: 'Ghana',
          phone: '+233209876543',
          isDefault: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: AddressFormData) => {
    try {
      if (editingId) {
        await apiClient.put(`/users/me/addresses/${editingId}`, data);
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === editingId ? { ...addr, ...data } : addr))
        );
      } else {
        const response = await apiClient.post('/users/me/addresses', data);
        setAddresses((prev) => [...prev, response.data.data]);
      }
      handleClose();
    } catch (err) {
      console.error('Failed to save address', err);
      // Demo: update locally
      if (editingId) {
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === editingId ? { ...addr, ...data } : addr))
        );
      } else {
        setAddresses((prev) => [
          ...prev,
          { ...data, id: Date.now().toString() },
        ]);
      }
      handleClose();
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    Object.entries(address).forEach(([key, value]) => {
      if (key !== 'id') {
        setValue(key as keyof AddressFormData, value);
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/users/me/addresses/${id}`);
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
    } catch (err) {
      console.error('Failed to delete address', err);
      // Demo: delete locally
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiClient.put(`/users/me/addresses/${id}/default`);
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === id,
        }))
      );
    } catch (err) {
      console.error('Failed to set default', err);
      // Demo: update locally
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === id,
        }))
      );
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Address Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label (optional)
                </label>
                <input
                  {...register('label')}
                  placeholder="e.g., Home, Work"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  {...register('street')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.street && (
                  <p className="text-sm text-error mt-1">{errors.street.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    {...register('city')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.city && (
                    <p className="text-sm text-error mt-1">{errors.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region *
                  </label>
                  <input
                    {...register('region')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.region && (
                    <p className="text-sm text-error mt-1">{errors.region.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    {...register('country')}
                    defaultValue="Ghana"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {errors.country && (
                    <p className="text-sm text-error mt-1">{errors.country.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    {...register('postalCode')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  {...register('phone')}
                  placeholder="+233..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isDefault')}
                  id="isDefault"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
          <p className="text-gray-500 mb-4">
            Add an address to make checkout faster.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={cn(
                'border rounded-lg p-4 relative',
                address.isDefault ? 'border-primary bg-primary/5' : 'border-gray-200'
              )}
            >
              {address.isDefault && (
                <span className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded">
                  Default
                </span>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {address.label && (
                    <p className="font-medium text-gray-900 mb-1">{address.label}</p>
                  )}
                  <p className="text-gray-600">{address.street}</p>
                  <p className="text-gray-600">
                    {address.city}, {address.region}
                  </p>
                  <p className="text-gray-600">
                    {address.country} {address.postalCode}
                  </p>
                  {address.phone && (
                    <p className="text-gray-500 text-sm mt-2">{address.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-error disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === address.id ? 'Deleting...' : 'Delete'}
                </button>
                {!address.isDefault && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary"
                    >
                      <Check className="h-4 w-4" />
                      Set as default
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
