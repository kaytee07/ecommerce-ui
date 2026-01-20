'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore, useCartStore } from '@/lib/stores';
import { apiClient } from '@/lib/api/client';
import { Category } from '@/types';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
}

// Static links that are always shown
const staticLinks: NavLink[] = [
  { href: '/products', label: 'Shop All' },
  { href: '/collections/new-arrivals', label: 'New Arrivals' },
];

export function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [navLinks, setNavLinks] = useState<NavLink[]>(staticLinks);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, user, logout } = useAuthStore();
  const { cart } = useCartStore();

  const cartCount = cart?.itemCount || 0;

  // Check if user has admin role
  const isAdmin = user?.roles?.some(role =>
    ['ROLE_SUPER_ADMIN', 'ROLE_CONTENT_MANAGER', 'ROLE_WAREHOUSE', 'ROLE_SUPPORT_AGENT'].includes(role)
  );

  // Fetch categories for navigation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get<{ status: boolean; data: Category[] }>('/store/categories');
        const categories = response.data.data || [];

        // Build navigation links: static links + dynamic category links
        const categoryLinks: NavLink[] = categories
          .filter(cat => cat.active)
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
          .map(cat => ({
            href: `/categories/${cat.slug}`,
            label: cat.name,
          }));

        setNavLinks([...staticLinks, ...categoryLinks]);
      } catch (err) {
        console.error('Failed to fetch categories for navigation', err);
        // Keep static links on error
        setNavLinks(staticLinks);
      }
    };

    fetchCategories();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-cream">
      {/* Top Bar - Announcement */}
      <div className="bg-primary text-white text-center py-2 px-4">
        <p className="text-xs tracking-widest uppercase">
          Free shipping on orders over GHS 500
        </p>
      </div>

      {/* Main Header */}
      <nav className="border-b border-gray-200">
        <div className="container-full">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo - Centered on Mobile */}
            <Link href="/" className="lg:flex-shrink-0">
              <Image
                src="/logo.png"
                alt="World Genius"
                width={180}
                height={50}
                className="h-10 lg:h-12 w-auto"
                priority
              />
            </Link>

            {/* Right Icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              <Link
                href="/search"
                className="p-2 hover:opacity-70 transition-opacity"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Link>

              {/* User Menu - Desktop */}
              <div className="relative hidden sm:block" ref={userMenuRef}>
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-1 p-2 hover:opacity-70 transition-opacity"
                      aria-label="User menu"
                    >
                      <User className="h-5 w-5" />
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform",
                        isUserMenuOpen && "rotate-180"
                      )} />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.fullName || user?.username || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>

                        {/* Admin Link - Only if user has admin role */}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        )}

                        <Link
                          href="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <UserCircle className="h-4 w-4" />
                          My Account
                        </Link>

                        <Link
                          href="/account/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Package className="h-4 w-4" />
                          My Orders
                        </Link>

                        <Link
                          href="/account/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>

                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-gray-50 w-full text-left"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="p-2 hover:opacity-70 transition-opacity"
                    aria-label="Sign in"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                )}
              </div>

              <Link
                href="/cart"
                className="p-2 hover:opacity-70 transition-opacity relative"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary text-white text-xs font-medium rounded-full">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block border-t border-gray-100">
          <div className="container-full">
            <div className="flex items-center justify-center gap-12 h-12">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 bg-cream transition-transform duration-300',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Image
                src="/logo.png"
                alt="World Genius"
                width={150}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex-1 px-6 py-8 overflow-y-auto">
            <ul className="space-y-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-2xl font-heading font-medium tracking-tight hover:opacity-70 transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Admin Link in Mobile Menu */}
            {isAuthenticated && isAdmin && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">Admin</p>
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-lg font-medium hover:opacity-70 transition-opacity"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Footer */}
          <div className="px-6 py-8 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="pb-4 border-b border-gray-100">
                  <p className="font-medium text-gray-900">
                    {user?.fullName || user?.username || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>

                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-sm tracking-wider uppercase hover:opacity-70"
                >
                  <UserCircle className="h-4 w-4" />
                  My Account
                </Link>
                <Link
                  href="/account/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-sm tracking-wider uppercase hover:opacity-70"
                >
                  <Package className="h-4 w-4" />
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-sm tracking-wider uppercase text-error hover:opacity-70"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm tracking-wider uppercase hover:opacity-70"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm tracking-wider uppercase hover:opacity-70"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
