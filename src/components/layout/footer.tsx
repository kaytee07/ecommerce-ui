'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Twitter, Facebook } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Category } from '@/types';

interface FooterLink {
  label: string;
  href: string;
}

// Static links that don't change
const staticShopLinks: FooterLink[] = [
  { label: 'All Products', href: '/products' },
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
];

const helpLinks: FooterLink[] = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns', href: '/returns' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Size Guide', href: '/size-guide' },
];

const companyLinks: FooterLink[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

// Maximum number of categories to show in footer (to keep design clean)
const MAX_FOOTER_CATEGORIES = 4;

export function Footer() {
  const [shopLinks, setShopLinks] = useState<FooterLink[]>(staticShopLinks);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get<{ status: boolean; data: Category[] }>('/store/categories');
        const categories = response.data.data || [];

        // Build category links (limit to MAX_FOOTER_CATEGORIES)
        const categoryLinks: FooterLink[] = categories
          .filter(cat => cat.active !== false)
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
          .slice(0, MAX_FOOTER_CATEGORIES)
          .map(cat => ({
            label: cat.name,
            href: `/categories/${cat.slug}`,
          }));

        // Combine static links + dynamic category links
        setShopLinks([...staticShopLinks, ...categoryLinks]);
      } catch (err) {
        console.error('Failed to fetch categories for footer', err);
        // Keep static links on error
        setShopLinks(staticShopLinks);
      }
    };

    fetchCategories();
  }, []);

  return (
    <footer className="bg-primary text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container-full py-16">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="font-heading text-3xl mb-4">Join the World</h3>
            <p className="text-white/70 mb-6 text-sm tracking-wide">
              Subscribe for exclusive drops, early access, and 10% off your first order.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-transparent border border-white/30 text-white placeholder:text-white/50 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-primary font-medium text-sm tracking-wider uppercase hover:bg-white/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-full py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="World Genius"
                width={150}
                height={40}
                className="h-10 w-auto brightness-0 invert mb-6"
              />
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-xs">
              Bold streetwear for the nonconformist. Designed in Ghana for the world.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/worldg3nius"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-white/30 hover:border-white hover:bg-white hover:text-primary transition-all"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/worldg3nius"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-white/30 hover:border-white hover:bg-white hover:text-primary transition-all"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/worldg3nius"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-white/30 hover:border-white hover:bg-white hover:text-primary transition-all"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop Links - Dynamic categories */}
          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase mb-6">Shop</h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase mb-6">Help</h4>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase mb-6">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-full py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-xs">
              &copy; {new Date().getFullYear()} World Genius. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-white/50 text-xs">Ghana</span>
              <span className="text-white/50 text-xs">GHS (₵)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
