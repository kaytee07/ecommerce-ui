'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { Button, Input } from '@/components/ui';
import { Globe, Package } from 'lucide-react';

interface ShippingRate {
  id: string;
  label: string;
  amount: number;
  freeShippingThreshold: number | null;
}

interface ShippingZone {
  id: string;
  name: string;
  shippingCurrency: string;
  countryCodes: string[];
  active: boolean;
  rates: ShippingRate[];
}

export default function ShippingSettingsPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({});

  const fetchZones = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ status: boolean; data: ShippingZone[] }>(
        '/admin/shipping/zones'
      );
      const data = res.data.data ?? [];
      setZones(data);
      const initial: Record<string, string> = {};
      data.forEach((zone) => {
        const rate = zone.rates?.[0];
        if (rate) initial[zone.id] = String(rate.amount);
      });
      setEditAmounts(initial);
    } catch {
      setError('Failed to load shipping zones.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleSave = async (zone: ShippingZone) => {
    const rate = zone.rates?.[0];
    if (!rate) return;
    setSaving((s) => ({ ...s, [zone.id]: true }));
    setSuccess((s) => ({ ...s, [zone.id]: false }));
    try {
      await apiClient.put(`/admin/shipping/zones/${zone.id}/rate`, {
        amount: parseFloat(editAmounts[zone.id] ?? '0'),
        label: rate.label,
      });
      setSuccess((s) => ({ ...s, [zone.id]: true }));
      setTimeout(() => setSuccess((s) => ({ ...s, [zone.id]: false })), 3000);
      fetchZones();
    } catch {
      setError(`Failed to update ${zone.name} shipping rate.`);
    } finally {
      setSaving((s) => ({ ...s, [zone.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shipping Settings</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="space-y-4">
        {zones.map((zone) => {
          const rate = zone.rates?.[0];
          const shippingCurrency = zone.shippingCurrency || 'GHS';
          const currencySymbol = shippingCurrency === 'GHS' ? '₵' : shippingCurrency;
          return (
            <div key={zone.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {zone.name === 'Africa' ? (
                    <Package className="h-5 w-5 text-green-600" />
                  ) : (
                    <Globe className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {zone.name === 'Africa' ? 'Ghana' : 'United Kingdom'}
                    </h2>
                    <p className="text-sm text-gray-500">Shipping currency: {shippingCurrency}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full font-medium ${
                    zone.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {zone.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {rate ? (
                <div className="flex items-end gap-4">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {zone.name === 'Africa' ? 'Shipping Fee (Free)' : `Shipping Fee (${shippingCurrency})`}
                    </label>
                    {zone.name === 'Africa' ? (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        Free shipping
                      </div>
                    ) : (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editAmounts[zone.id] ?? ''}
                          onChange={(e) =>
                            setEditAmounts((a) => ({ ...a, [zone.id]: e.target.value }))
                          }
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {zone.name !== 'Africa' && (
                    <Button
                      onClick={() => handleSave(zone)}
                      isLoading={saving[zone.id]}
                      variant={success[zone.id] ? 'outline' : 'primary'}
                      className="mb-0"
                    >
                      {success[zone.id] ? 'Saved' : 'Save'}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No rate configured for this zone.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
