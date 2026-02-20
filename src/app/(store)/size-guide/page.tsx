import Link from 'next/link';
import { ChevronRight, Ruler } from 'lucide-react';

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Size Guide</span>
          </nav>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-12">
          <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-center">
            Size Guide
          </h1>
          <p className="text-center text-gray-500 mt-3">
            Find your perfect fit
          </p>
        </div>
      </div>

      <div className="container-narrow py-12 lg:py-20">
        {/* How to Measure */}
        <div className="bg-white p-8 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center">
              <Ruler className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl">How to Measure</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium mb-3">Chest</h3>
              <p className="text-gray-600 text-sm">
                Measure around the fullest part of your chest, keeping the tape level under your arms
                and across your shoulder blades.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3">Waist</h3>
              <p className="text-gray-600 text-sm">
                Measure around your natural waistline, keeping the tape comfortably loose.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3">Hips</h3>
              <p className="text-gray-600 text-sm">
                Measure around the fullest part of your hips, keeping the tape parallel to the floor.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-3">Length</h3>
              <p className="text-gray-600 text-sm">
                For tops, measure from the highest point of the shoulder to the hem. For pants,
                measure from the waist to the ankle.
              </p>
            </div>
          </div>
        </div>

        {/* Women's International Size Conversion Chart */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl mb-2">Women&apos;s International Size Conversion Chart</h2>
          <p className="text-sm text-gray-600 mb-6">
            This table provides a general conversion across the most common international sizing systems.
          </p>
          <div className="bg-white overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Alpha</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">US</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">UK / AU</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">EU</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">IT</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">FR</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">JP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium">XXS</td>
                  <td className="px-6 py-4">0</td>
                  <td className="px-6 py-4">4</td>
                  <td className="px-6 py-4">32</td>
                  <td className="px-6 py-4">36</td>
                  <td className="px-6 py-4">32</td>
                  <td className="px-6 py-4">3</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">XS</td>
                  <td className="px-6 py-4">2</td>
                  <td className="px-6 py-4">6</td>
                  <td className="px-6 py-4">34</td>
                  <td className="px-6 py-4">38</td>
                  <td className="px-6 py-4">34</td>
                  <td className="px-6 py-4">5</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">S</td>
                  <td className="px-6 py-4">4-6</td>
                  <td className="px-6 py-4">8-10</td>
                  <td className="px-6 py-4">36-38</td>
                  <td className="px-6 py-4">40-42</td>
                  <td className="px-6 py-4">36-38</td>
                  <td className="px-6 py-4">7-9</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">M</td>
                  <td className="px-6 py-4">8-10</td>
                  <td className="px-6 py-4">12-14</td>
                  <td className="px-6 py-4">40-42</td>
                  <td className="px-6 py-4">44-46</td>
                  <td className="px-6 py-4">40-42</td>
                  <td className="px-6 py-4">11-13</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">L</td>
                  <td className="px-6 py-4">12-14</td>
                  <td className="px-6 py-4">16-18</td>
                  <td className="px-6 py-4">44-46</td>
                  <td className="px-6 py-4">48-50</td>
                  <td className="px-6 py-4">44-46</td>
                  <td className="px-6 py-4">15-17</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">XL</td>
                  <td className="px-6 py-4">16-18</td>
                  <td className="px-6 py-4">20-22</td>
                  <td className="px-6 py-4">48-50</td>
                  <td className="px-6 py-4">52-54</td>
                  <td className="px-6 py-4">48-50</td>
                  <td className="px-6 py-4">19-21</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">XXL</td>
                  <td className="px-6 py-4">20</td>
                  <td className="px-6 py-4">24</td>
                  <td className="px-6 py-4">52</td>
                  <td className="px-6 py-4">56</td>
                  <td className="px-6 py-4">52</td>
                  <td className="px-6 py-4">23</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Headwear Size Chart */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl mb-6">Headwear</h2>
          <div className="bg-white overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Head Circumference (cm)</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Head Circumference (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium">S/M</td>
                  <td className="px-6 py-4">54-57</td>
                  <td className="px-6 py-4">21.5-22.5</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">L/XL</td>
                  <td className="px-6 py-4">58-61</td>
                  <td className="px-6 py-4">23-24</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">One Size</td>
                  <td className="px-6 py-4">56-60</td>
                  <td className="px-6 py-4">22-23.5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white p-8 mb-12">
          <h2 className="font-heading text-2xl mb-6">Fit Tips</h2>
          <ul className="space-y-4 text-gray-600">
            <li className="flex items-start gap-3">
              <span className="text-primary font-medium">-</span>
              <span>If you&apos;re between sizes, we recommend sizing up for a more relaxed fit.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-medium">-</span>
              <span>Some items are designed for an oversized fit - check the product description for fit details.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-medium">-</span>
              <span>Measurements are taken from garments laid flat. Double chest measurements for full circumference.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-medium">-</span>
              <span>For the most accurate fit, compare your measurements to a similar garment you already own.</span>
            </li>
          </ul>
        </div>

        {/* Contact CTA */}
        <div className="text-center p-8 bg-white">
          <h3 className="font-heading text-2xl mb-4">Still unsure about your size?</h3>
          <p className="text-gray-600 mb-6">
            Our team is happy to help you find the perfect fit.
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
