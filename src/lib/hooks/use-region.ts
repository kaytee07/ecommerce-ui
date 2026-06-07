'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/types';
import type { Region } from '@/types/region';

const FALLBACK: Region = {
  countryCode: 'GH',
  zoneName: 'Default',
  displayCurrency: 'GHS',
  chargeCurrency: 'GHS',
  fxRate: 1,
  shippingAmountGhs: 0,
  shippingAmountDisplay: 0,
  shippingLabel: 'Standard',
  freeShipping: true,
};

/**
 * Resolves the buyer's region from their IP or a selected checkout country.
 * Cached per country selection — region doesn't change mid-browsing.
 */
export function useRegion(selectedCountryCode?: string): Region {
  const { data } = useQuery({
    queryKey: ['region', selectedCountryCode ?? 'ip'],
    queryFn: async () => {
      const params = selectedCountryCode ? { countryCode: selectedCountryCode } : undefined;
      const res = await apiClient.get<ApiResponse<Region>>('/store/region', { params });
      return res.data.data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });

  return data ?? FALLBACK;
}
