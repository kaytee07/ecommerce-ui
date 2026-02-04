'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

const ALLOWED_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/account/profile',
];

export function ForcePasswordGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const hasCheckedAuth = useRef(false);

  // Check auth only once on mount
  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      useAuthStore.getState().checkAuth();
    }
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.mustChangePassword) {
      return;
    }

    const isAllowed = ALLOWED_PATHS.some((path) => pathname.startsWith(path));
    if (!isAllowed) {
      router.push('/account/profile');
    }
  }, [isLoading, isAuthenticated, user?.mustChangePassword, pathname, router]);

  return null;
}
