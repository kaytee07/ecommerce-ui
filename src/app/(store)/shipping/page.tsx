import Link from 'next/link';
import { ChevronRight, Truck, Clock, Globe, Package } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Shipping Information</span>
          </nav>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-12">
          <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-center">
            Shipping Information
          </h1>
          <p className="text-center text-gray-500 mt-3">
            Everything you need to know about our shipping options
          </p>
        </div>
      </div>

      <div className="container-narrow py-12 lg:py-20">
        {/* Shipping Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center mb-6">
              <Truck className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl mb-4">Domestic Shipping</h2>
            <p className="text-gray-600 mb-4">Within Ghana</p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex justify-between">
                <span>Standard Delivery</span>
                <span className="font-medium">2-5 business days</span>
              </li>
              <li className="flex justify-between">
                <span>Express Delivery</span>
                <span className="font-medium">1-2 business days</span>
              </li>
              <li className="flex justify-between">
                <span>Same Day (Accra only)</span>
                <span className="font-medium">Same day</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center mb-6">
              <Globe className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl mb-4">International Shipping</h2>
            <p className="text-gray-600 mb-4">Worldwide delivery</p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex justify-between">
                <span>West Africa</span>
                <span className="font-medium">5-7 business days</span>
              </li>
              <li className="flex justify-between">
                <span>Rest of Africa</span>
                <span className="font-medium">7-10 business days</span>
              </li>
              <li className="flex justify-between">
                <span>International</span>
                <span className="font-medium">10-14 business days</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Shipping Rates */}
        <div className="mb-16">
          <h2 className="font-heading text-2xl mb-8 text-center">Shipping Rates</h2>
          <div className="bg-white overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Standard</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Express</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4">Greater Accra</td>
                  <td className="px-6 py-4">GHS 25</td>
                  <td className="px-6 py-4">GHS 45</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Other Regions (Ghana)</td>
                  <td className="px-6 py-4">GHS 35</td>
                  <td className="px-6 py-4">GHS 60</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">West Africa</td>
                  <td className="px-6 py-4">GHS 150</td>
                  <td className="px-6 py-4">GHS 250</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">International</td>
                  <td className="px-6 py-4">GHS 300+</td>
                  <td className="px-6 py-4">GHS 500+</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-gray-500 text-sm mt-4">
            Free shipping on orders over GHS 500 (domestic) or GHS 1,500 (international)
          </p>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center mb-6">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl mb-4">Processing Time</h3>
            <p className="text-gray-600">
              Orders are processed within 1-2 business days. Orders placed after 2pm GMT
              or on weekends will be processed the next business day.
            </p>
          </div>

          <div className="bg-white p-8">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center mb-6">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl mb-4">Order Tracking</h3>
            <p className="text-gray-600">
              Once your order ships, you&apos;ll receive a confirmation email with tracking
              information. You can also track your order in your account dashboard.
            </p>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center p-8 bg-white">
          <h3 className="font-heading text-2xl mb-4">Have questions about shipping?</h3>
          <p className="text-gray-600 mb-6">
            Our customer service team is happy to help.
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
