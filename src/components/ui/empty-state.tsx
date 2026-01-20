import { cn } from '@/lib/utils';
import { LucideIcon, Package, ShoppingCart, FileText, Bell, Search } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon = Package, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

export function EmptyCart() {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Your cart is empty"
      description="Add some products to get started"
      action={{ label: 'Continue shopping', href: '/products' }}
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon={FileText}
      title="No orders yet"
      description="When you place orders, they'll appear here"
      action={{ label: 'Start shopping', href: '/products' }}
    />
  );
}

export function EmptyProducts() {
  return (
    <EmptyState
      icon={Package}
      title="No products found"
      description="Try adjusting your filters or search terms"
    />
  );
}

export function EmptySearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title={`No results for "${query}"`}
      description="Try different keywords or check your spelling"
      action={{ label: 'Browse all products', href: '/products' }}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="All caught up!"
      description="No new notifications"
    />
  );
}
