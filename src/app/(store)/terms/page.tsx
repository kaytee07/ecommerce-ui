import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Terms of Service</span>
          </nav>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-12">
          <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-center">
            Terms of Service
          </h1>
          <p className="text-center text-gray-500 mt-3">
            Last updated: January 2025
          </p>
        </div>
      </div>

      <div className="container-narrow py-12 lg:py-20">
        <div className="bg-white p-8 lg:p-12 space-y-8">
          <section>
            <h2 className="font-heading text-2xl mb-4">Agreement to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing and using the World Genius website (worldg3nius.com), you agree to be bound
              by these Terms of Service. If you do not agree to these terms, please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Use of Website</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You agree to use our website only for lawful purposes. You may not:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>- Use the website in any way that violates applicable laws</li>
              <li>- Attempt to gain unauthorized access to any part of the website</li>
              <li>- Use automated systems or software to extract data from the website</li>
              <li>- Transmit viruses or other malicious code</li>
              <li>- Interfere with or disrupt the website&apos;s functionality</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Account Registration</h2>
            <p className="text-gray-600 leading-relaxed">
              To make purchases, you may need to create an account. You are responsible for maintaining
              the confidentiality of your account information and for all activities under your account.
              You must provide accurate and complete information when creating an account.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Products and Pricing</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                We strive to display accurate product descriptions, images, and pricing. However, we
                do not warrant that product descriptions or other content is error-free.
              </p>
              <p>
                Prices are subject to change without notice. We reserve the right to modify or
                discontinue any product at any time. All prices are displayed in Ghana Cedis (GHS)
                unless otherwise indicated.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Orders and Payment</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                When you place an order, you are making an offer to purchase. We reserve the right
                to refuse or cancel any order for any reason, including product availability, errors
                in pricing, or suspected fraud.
              </p>
              <p>
                Payment must be made at the time of purchase. We accept Mobile Money (MTN, Vodafone,
                AirtelTigo), credit/debit cards, and bank transfers.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Shipping and Delivery</h2>
            <p className="text-gray-600 leading-relaxed">
              Shipping times are estimates and not guaranteed. We are not responsible for delays
              caused by shipping carriers or customs processing. Risk of loss passes to you upon
              delivery to the carrier. Please refer to our{' '}
              <Link href="/shipping" className="text-primary underline">Shipping Policy</Link> for
              more information.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Returns and Refunds</h2>
            <p className="text-gray-600 leading-relaxed">
              Returns and refunds are subject to our{' '}
              <Link href="/returns" className="text-primary underline">Returns Policy</Link>.
              Please review this policy before making a purchase.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              All content on this website, including text, graphics, logos, images, and software,
              is the property of World Genius or its licensors and is protected by intellectual
              property laws. You may not reproduce, distribute, or create derivative works without
              our written permission.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">User Content</h2>
            <p className="text-gray-600 leading-relaxed">
              By submitting reviews, comments, or other content to our website, you grant us a
              non-exclusive, royalty-free license to use, reproduce, and display such content.
              You represent that you own or have the rights to any content you submit.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by law, World Genius shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your use of
              the website or purchase of products. Our total liability shall not exceed the
              amount paid by you for the specific product in question.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Indemnification</h2>
            <p className="text-gray-600 leading-relaxed">
              You agree to indemnify and hold World Genius harmless from any claims, damages,
              or expenses arising from your violation of these terms or your use of the website.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms of Service shall be governed by the laws of Ghana. Any disputes shall
              be resolved in the courts of Ghana.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will be
              effective immediately upon posting. Your continued use of the website constitutes
              acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl mb-4">Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 text-gray-600">
              <p>Email: legal@worldg3nius.com</p>
              <p>Address: 123 Independence Avenue, Accra, Ghana</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
