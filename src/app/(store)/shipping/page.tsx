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
            Shipping rates and delivery timelines
          </p>
        </div>
      </div>

      <div className="container-narrow py-12 lg:py-20">
        {/* Shipping Rates */}
        <div className="bg-white p-8 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center">
              <Truck className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl">Shipping Rates</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Shipping rates differ based on location, weight and value of order and as such,
            customer will be contacted accordingly for the shipping rate.
          </p>
        </div>

        {/* Shipping Timelines */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-8">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center mb-6">
              <Clock className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl mb-4">Domestic Shipping</h2>
            <p className="text-gray-600 leading-relaxed">
              1-2 business days for package to arrive after order is fully processed.
            </p>
          </div>

          <div className="bg-white p-8">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center mb-6">
              <Globe className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl mb-4">Rest of Africa</h2>
            <p className="text-gray-600 leading-relaxed">
              5 - 8 business days to arrive after order is fully processed. (Delays and customs
              procedures are different in every country and might affect the arrival date of package)
            </p>
          </div>
        </div>

        <div className="bg-white p-8 mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center">
              <Package className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl">International</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            7 to 10 business days to arrive after order is fully processed (Delays, customs
            procedures and shipping company policies are different in every country and can affect
            the arrival date of package)
          </p>
        </div>

        <div className="bg-white p-8 mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl">Processing Time</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Processing of t-shirt and trucker cap orders take between 2 to 5 business days to
            process and jerseys, sweat short orders takes 5 to 8 business days to process.
          </p>
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
