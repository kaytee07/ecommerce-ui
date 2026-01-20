import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Privacy Policy</span>
          </nav>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-12">
          <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-center">
            Privacy Policy
          </h1>
          <p className="text-center text-gray-500 mt-3">
            Last updated: January 2025
          </p>
        </div>
      </div>

      <div className="container-narrow py-12 lg:py-20">
        <div className="bg-white p-8 lg:p-12 space-y-8">
          <section>
            <h2 className="font-heading text-2xl mb-4">Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              World Genius (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you visit our website worldg3nius.com and make purchases from us.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Information We Collect</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p><strong>Personal Information:</strong> When you make a purchase or create an account,
              we collect information such as your name, email address, phone number, shipping address,
              and payment information.</p>

              <p><strong>Usage Data:</strong> We automatically collect certain information about your
              device and how you interact with our website, including IP address, browser type, pages
              visited, and time spent on pages.</p>

              <p><strong>Cookies:</strong> We use cookies and similar tracking technologies to enhance
              your browsing experience and analyze website traffic.</p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">How We Use Your Information</h2>
            <ul className="space-y-2 text-gray-600">
              <li>- Process and fulfill your orders</li>
              <li>- Communicate with you about your orders and account</li>
              <li>- Send promotional emails (with your consent)</li>
              <li>- Improve our website and services</li>
              <li>- Prevent fraud and enhance security</li>
              <li>- Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Information Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>- Payment processors to complete transactions</li>
              <li>- Shipping carriers to deliver your orders</li>
              <li>- Service providers who assist with our operations</li>
              <li>- Law enforcement when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. However,
              no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>- Access your personal information</li>
              <li>- Correct inaccurate information</li>
              <li>- Delete your personal information</li>
              <li>- Opt out of marketing communications</li>
              <li>- Request a copy of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Our website uses cookies to remember your preferences, keep items in your cart, and
              analyze how visitors use our site. You can control cookies through your browser settings,
              but disabling cookies may affect your ability to use certain features.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Third-Party Links</h2>
            <p className="text-gray-600 leading-relaxed">
              Our website may contain links to third-party websites. We are not responsible for the
              privacy practices of these external sites. We encourage you to read their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Children&apos;s Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Our website is not intended for children under 13. We do not knowingly collect personal
              information from children under 13. If you believe we have collected such information,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any significant
              changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 text-gray-600">
              <p>Email: privacy@worldg3nius.com</p>
              <p>Address: 123 Independence Avenue, Accra, Ghana</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
