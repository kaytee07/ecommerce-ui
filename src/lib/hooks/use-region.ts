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
  const { region } = useRegionQuery(selectedCountryCode);
  return region;
}

export function useRegionQuery(selectedCountryCode?: string) {
  const requestedCountryCode = selectedCountryCode?.toUpperCase();
  const query = useQuery({
    queryKey: ['region', requestedCountryCode ?? 'ip'],
    queryFn: async () => {
      const endpoint = requestedCountryCode
        ? `/store/region?countryCode=${encodeURIComponent(requestedCountryCode)}&_t=${Date.now()}`
        : '/store/region';
      const res = await apiClient.get<ApiResponse<Region>>(endpoint);
      return res.data.data;
    },
    staleTime: requestedCountryCode ? 0 : 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    refetchOnMount: requestedCountryCode ? 'always' : true,
  });

  return {
    region: query.data ?? FALLBACK,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}
