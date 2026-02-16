import Link from 'next/link';
import { ChevronRight, RotateCcw } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Returns & Exchanges</span>
          </nav>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-12">
          <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-center">
            Return Policy
          </h1>
          <p className="text-center text-gray-500 mt-3">
            Return information for your order
          </p>
        </div>
      </div>

      <div className="container-narrow py-12 lg:py-20">
        {/* Return Policy Overview */}
        <div className="bg-white p-8 mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center">
              <RotateCcw className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl">Return Policy</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            Customer should contact worldgeniussbrand@gmail.com and express their desire for a return
            in case of sizing misfits or unseen damage to product within 48 hours.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            No refunds.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Items must be unworn, unwashed, and in their original packaging with all tags attached.
            We want you to be completely satisfied with your purchase, so if something isn&apos;t right,
            we&apos;re here to help.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="text-center p-8 bg-white">
          <h3 className="font-heading text-2xl mb-4">Need help with a return?</h3>
          <p className="text-gray-600 mb-6">
            Email us at worldgeniussbrand@gmail.com and include your order details.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 text-sm tracking-wider uppercase hover:bg-black transition-colors"
          >
            Contact Us
          </Link>
          <div className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              Return requests must be submitted within 48 hours of receiving your order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
