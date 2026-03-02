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
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Alpha Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">US Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">UK / AU Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">EU Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Japan (JP) Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Bust (inches)</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Waist (inches)</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Hips (inches)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium">XS</td>
                  <td className="px-6 py-4">2-4</td>
                  <td className="px-6 py-4">6-8</td>
                  <td className="px-6 py-4">34-36</td>
                  <td className="px-6 py-4">5-7</td>
                  <td className="px-6 py-4">31-33&quot;</td>
                  <td className="px-6 py-4">24-26&quot;</td>
                  <td className="px-6 py-4">34-36&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">S</td>
                  <td className="px-6 py-4">4-6</td>
                  <td className="px-6 py-4">8-10</td>
                  <td className="px-6 py-4">36-38</td>
                  <td className="px-6 py-4">7-9</td>
                  <td className="px-6 py-4">33-35&quot;</td>
                  <td className="px-6 py-4">27.5-28.5&quot;</td>
                  <td className="px-6 py-4">36-39&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">M</td>
                  <td className="px-6 py-4">8-10</td>
                  <td className="px-6 py-4">12-14</td>
                  <td className="px-6 py-4">40-42</td>
                  <td className="px-6 py-4">11-13</td>
                  <td className="px-6 py-4">36-38&quot;</td>
                  <td className="px-6 py-4">29.5-31.5&quot;</td>
                  <td className="px-6 py-4">39-41&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">L</td>
                  <td className="px-6 py-4">12-14</td>
                  <td className="px-6 py-4">16-18</td>
                  <td className="px-6 py-4">44-46</td>
                  <td className="px-6 py-4">15-17</td>
                  <td className="px-6 py-4">39-41&quot;</td>
                  <td className="px-6 py-4">31.5-34&quot;</td>
                  <td className="px-6 py-4">41-44&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">XL</td>
                  <td className="px-6 py-4">16-18</td>
                  <td className="px-6 py-4">20-22</td>
                  <td className="px-6 py-4">48-50</td>
                  <td className="px-6 py-4">19-21</td>
                  <td className="px-6 py-4">42-44&quot;</td>
                  <td className="px-6 py-4">35.5-38&quot;</td>
                  <td className="px-6 py-4">43-46&quot;</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Note: Sizing can vary significantly between brands and designers. This chart provides a general
            guideline. For the most accurate fit, always check a specific brand&apos;s size guide and your
            personal body measurements.
          </p>
        </div>

        {/* Men's Pants Size Conversion */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl mb-2">Men&apos;s Pants Size Conversion</h2>
          <p className="text-sm text-gray-600 mb-6">
            Men&apos;s pants sizes are commonly listed as waist x inseam (for example, 32 x 34).
          </p>
          <div className="bg-white overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Alpha Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">US / UK Waist (inches)</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">EU Waist</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Waist (cm)</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Approx. Inseam (inches)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium">XS</td>
                  <td className="px-6 py-4">28-30</td>
                  <td className="px-6 py-4">44-46</td>
                  <td className="px-6 py-4">71-76 cm</td>
                  <td className="px-6 py-4">30-31&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">S</td>
                  <td className="px-6 py-4">30-32</td>
                  <td className="px-6 py-4">46-48</td>
                  <td className="px-6 py-4">76-81 cm</td>
                  <td className="px-6 py-4">30-32&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">M</td>
                  <td className="px-6 py-4">32-34</td>
                  <td className="px-6 py-4">48-50</td>
                  <td className="px-6 py-4">81-86 cm</td>
                  <td className="px-6 py-4">31-33&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">L</td>
                  <td className="px-6 py-4">34-36</td>
                  <td className="px-6 py-4">50-52</td>
                  <td className="px-6 py-4">86-91 cm</td>
                  <td className="px-6 py-4">32-34&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">XL</td>
                  <td className="px-6 py-4">36-38</td>
                  <td className="px-6 py-4">52-54</td>
                  <td className="px-6 py-4">91-96 cm</td>
                  <td className="px-6 py-4">32-34&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">XXL</td>
                  <td className="px-6 py-4">38-40</td>
                  <td className="px-6 py-4">54-56</td>
                  <td className="px-6 py-4">96-101 cm</td>
                  <td className="px-6 py-4">34-36&quot;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Men's Tops Size Conversion */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl mb-2">Men&apos;s Tops Size Conversion</h2>
          <p className="text-sm text-gray-600 mb-6">
            Men&apos;s tops are typically based on chest measurement, with dress shirts often using neck size.
          </p>
          <div className="bg-white overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Alpha Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">US / UK Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">EU Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Japan (JP) Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Chest (inches)</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Neck (inches)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium">XS</td>
                  <td className="px-6 py-4">34-36</td>
                  <td className="px-6 py-4">44-46</td>
                  <td className="px-6 py-4">S</td>
                  <td className="px-6 py-4">34-36&quot;</td>
                  <td className="px-6 py-4">14-14.5&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">S</td>
                  <td className="px-6 py-4">36-38</td>
                  <td className="px-6 py-4">46-48</td>
                  <td className="px-6 py-4">M</td>
                  <td className="px-6 py-4">36-38&quot;</td>
                  <td className="px-6 py-4">14.5-15&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">M</td>
                  <td className="px-6 py-4">38-40</td>
                  <td className="px-6 py-4">48-50</td>
                  <td className="px-6 py-4">L</td>
                  <td className="px-6 py-4">38-40&quot;</td>
                  <td className="px-6 py-4">15-15.5&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">L</td>
                  <td className="px-6 py-4">40-42</td>
                  <td className="px-6 py-4">50-52</td>
                  <td className="px-6 py-4">XL</td>
                  <td className="px-6 py-4">40-42&quot;</td>
                  <td className="px-6 py-4">16-16.5&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">XL</td>
                  <td className="px-6 py-4">42-44</td>
                  <td className="px-6 py-4">52-54</td>
                  <td className="px-6 py-4">XXL</td>
                  <td className="px-6 py-4">42-44&quot;</td>
                  <td className="px-6 py-4">17-17.5&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">XXL</td>
                  <td className="px-6 py-4">44-46</td>
                  <td className="px-6 py-4">54-56</td>
                  <td className="px-6 py-4">3XL</td>
                  <td className="px-6 py-4">44-46&quot;</td>
                  <td className="px-6 py-4">18-18.5&quot;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Women's Pants and Skirts Size Conversion */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl mb-2">Women&apos;s Pants &amp; Skirts Size Chart</h2>
          <p className="text-sm text-gray-600 mb-6">
            Women&apos;s pants and skirts use the same core conversion ranges, based on waist and hip measurements.
          </p>
          <div className="bg-white overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Alpha Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">US Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">UK / AU Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">EU Size</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Waist (inches)</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Hips (inches)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium">XS</td>
                  <td className="px-6 py-4">2-4</td>
                  <td className="px-6 py-4">6-8</td>
                  <td className="px-6 py-4">34-36</td>
                  <td className="px-6 py-4">24-26&quot;</td>
                  <td className="px-6 py-4">34-36&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">S</td>
                  <td className="px-6 py-4">4-6</td>
                  <td className="px-6 py-4">8-10</td>
                  <td className="px-6 py-4">36-38</td>
                  <td className="px-6 py-4">26-28&quot;</td>
                  <td className="px-6 py-4">36-39&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">M</td>
                  <td className="px-6 py-4">8-10</td>
                  <td className="px-6 py-4">12-14</td>
                  <td className="px-6 py-4">40-42</td>
                  <td className="px-6 py-4">29-32&quot;</td>
                  <td className="px-6 py-4">39-41&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">L</td>
                  <td className="px-6 py-4">12-14</td>
                  <td className="px-6 py-4">16-18</td>
                  <td className="px-6 py-4">44-46</td>
                  <td className="px-6 py-4">32-34&quot;</td>
                  <td className="px-6 py-4">41-44&quot;</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">XL</td>
                  <td className="px-6 py-4">16-18</td>
                  <td className="px-6 py-4">20-22</td>
                  <td className="px-6 py-4">48-50</td>
                  <td className="px-6 py-4">35.5-38&quot;</td>
                  <td className="px-6 py-4">43-46&quot;</td>
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
