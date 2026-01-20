import Link from 'next/link';
import { ChevronRight, RotateCcw, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

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
            Returns & Exchanges
          </h1>
          <p className="text-center text-gray-500 mt-3">
            We want you to love your purchase
          </p>
        </div>
      </div>

      <div className="container-narrow py-12 lg:py-20">
        {/* Return Policy Overview */}
        <div className="bg-white p-8 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center">
              <RotateCcw className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl">Our Return Policy</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-6">
            We accept returns within <strong>14 days</strong> of delivery. Items must be unworn, unwashed,
            and in their original packaging with all tags attached. We want you to be completely satisfied
            with your purchase, so if something isn&apos;t right, we&apos;re here to help.
          </p>
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              Please note: Sale items and personalized products are final sale and cannot be returned.
            </p>
          </div>
        </div>

        {/* Eligible / Not Eligible */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="font-heading text-xl">Eligible for Return</h3>
            </div>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">-</span>
                <span>Items in original condition with tags attached</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">-</span>
                <span>Items returned within 14 days of delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">-</span>
                <span>Items in original packaging</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">-</span>
                <span>Defective or damaged items</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">-</span>
                <span>Wrong item received</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="h-6 w-6 text-red-600" />
              <h3 className="font-heading text-xl">Not Eligible for Return</h3>
            </div>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">-</span>
                <span>Items worn, washed, or altered</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">-</span>
                <span>Items without original tags</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">-</span>
                <span>Sale or clearance items</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">-</span>
                <span>Personalized or custom items</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">-</span>
                <span>Items returned after 14 days</span>
              </li>
            </ul>
          </div>
        </div>

        {/* How to Return */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl mb-8 text-center">How to Return</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 text-center">
              <div className="w-12 h-12 border border-primary flex items-center justify-center mx-auto mb-6">
                <span className="font-heading text-xl">01</span>
              </div>
              <h3 className="font-heading text-lg mb-3">Contact Us</h3>
              <p className="text-gray-600 text-sm">
                Email us at support@worldg3nius.com with your order number and reason for return.
              </p>
            </div>

            <div className="bg-white p-8 text-center">
              <div className="w-12 h-12 border border-primary flex items-center justify-center mx-auto mb-6">
                <span className="font-heading text-xl">02</span>
              </div>
              <h3 className="font-heading text-lg mb-3">Pack Your Item</h3>
              <p className="text-gray-600 text-sm">
                Pack the item securely in its original packaging with all tags attached.
              </p>
            </div>

            <div className="bg-white p-8 text-center">
              <div className="w-12 h-12 border border-primary flex items-center justify-center mx-auto mb-6">
                <span className="font-heading text-xl">03</span>
              </div>
              <h3 className="font-heading text-lg mb-3">Ship It Back</h3>
              <p className="text-gray-600 text-sm">
                Use the prepaid shipping label we provide (domestic) or ship to the address given.
              </p>
            </div>
          </div>
        </div>

        {/* Exchanges */}
        <div className="bg-white p-8 mb-12">
          <h2 className="font-heading text-2xl mb-6">Exchanges</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Need a different size or color? We&apos;re happy to help! Contact our customer service team
            within 14 days of receiving your order to arrange an exchange.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Exchanges are subject to availability. If your preferred size or color is unavailable,
            we&apos;ll process a refund instead.
          </p>
        </div>

        {/* Refund Timeline */}
        <div className="bg-white p-8 mb-12">
          <h2 className="font-heading text-2xl mb-6">Refund Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 flex-shrink-0 text-sm text-gray-500">Day 1-3</div>
              <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="text-gray-600">We receive your return</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 flex-shrink-0 text-sm text-gray-500">Day 3-5</div>
              <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="text-gray-600">Item inspected and refund processed</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 flex-shrink-0 text-sm text-gray-500">Day 5-10</div>
              <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="text-gray-600">Refund appears in your account</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Refunds are credited to your original payment method. Processing times may vary by bank.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="text-center p-8 bg-white">
          <h3 className="font-heading text-2xl mb-4">Need help with a return?</h3>
          <p className="text-gray-600 mb-6">
            Our customer service team is ready to assist you.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 text-sm tracking-wider uppercase hover:bg-black transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
