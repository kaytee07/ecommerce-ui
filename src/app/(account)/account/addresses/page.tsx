'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { OrderHistory, ShippingAddress } from '@/types';
import { Skeleton } from '@/components/ui';

interface AddressCard {
  id: string;
  address: ShippingAddress;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<AddressCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await apiClient.get<{ status: boolean; data: OrderHistory[]; message: string }>(
          '/store/orders/my'
        );
        const orders = response.data.data || [];
        const collected = orders
          .map((order) => order.shippingAddress)
          .filter((address): address is ShippingAddress => !!address);

        const unique = new Map<string, ShippingAddress>();
        collected.forEach((address) => {
          const key = [
            address.street,
            address.city,
            address.region,
            address.country,
            address.postalCode,
            address.phone,
            address.gps,
          ]
            .map((value) => value || '')
            .join('|');
          if (!unique.has(key)) {
            unique.set(key, address);
          }
        });

        const cards = Array.from(unique.entries()).map(([key, address]) => ({
          id: key,
          address,
        }));
        setAddresses(cards);
      } catch (err) {
        console.error('Failed to load addresses', err);
        setAddresses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const formatAddressLine = (address: ShippingAddress) => {
    const lineOne = [address.street, address.city, address.region].filter(Boolean).join(', ');
    const lineTwo = [address.country, address.postalCode].filter(Boolean).join(' ');
    return { lineOne, lineTwo };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Addresses</h1>
        <p className="text-gray-600">
          Saved shipping addresses from your recent orders.
        </p>
      </div>

      {addresses.length === 0 ? (
        <p className="text-gray-600">
          No saved addresses yet. Place an order to save a shipping address.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((entry) => {
            const { lineOne, lineTwo } = formatAddressLine(entry.address);
            return (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <p className="text-sm text-gray-900 font-semibold">Shipping Address</p>
                {lineOne && <p className="text-sm text-gray-700 mt-1">{lineOne}</p>}
                {lineTwo && <p className="text-sm text-gray-700">{lineTwo}</p>}
                {entry.address.phone && (
                  <p className="text-sm text-gray-700 mt-2">Phone: {entry.address.phone}</p>
                )}
                {entry.address.gps && (
                  <p className="text-sm text-gray-500">GPS: {entry.address.gps}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
