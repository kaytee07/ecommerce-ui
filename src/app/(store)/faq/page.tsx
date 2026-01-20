'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    category: 'Orders & Shipping',
    questions: [
      {
        question: 'How long does shipping take?',
        answer: 'Domestic orders within Ghana typically arrive within 2-5 business days. International shipping times vary by location, usually taking 7-14 business days.'
      },
      {
        question: 'Do you offer free shipping?',
        answer: 'Yes! We offer free shipping on all orders over GHS 500 within Ghana. International orders over GHS 1,500 also qualify for free shipping.'
      },
      {
        question: 'Can I track my order?',
        answer: 'Absolutely! Once your order ships, you\'ll receive a tracking number via email. You can also track your order in your account dashboard.'
      },
      {
        question: 'Do you ship internationally?',
        answer: 'Yes, we ship worldwide. Shipping costs and delivery times vary by destination. You can see the exact shipping cost at checkout.'
      }
    ]
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      {
        question: 'What is your return policy?',
        answer: 'We accept returns within 14 days of delivery. Items must be unworn, unwashed, and in their original packaging with all tags attached.'
      },
      {
        question: 'How do I initiate a return?',
        answer: 'Contact our customer service team at support@worldg3nius.com with your order number. We\'ll provide you with return instructions and a prepaid shipping label for domestic returns.'
      },
      {
        question: 'Can I exchange an item for a different size?',
        answer: 'Yes! If your size isn\'t right, we\'re happy to exchange it. Contact us within 14 days of receiving your order to arrange an exchange.'
      },
      {
        question: 'When will I receive my refund?',
        answer: 'Refunds are processed within 5-7 business days after we receive your returned item. The refund will be credited to your original payment method.'
      }
    ]
  },
  {
    category: 'Products & Sizing',
    questions: [
      {
        question: 'How do I find my size?',
        answer: 'Check our Size Guide for detailed measurements. Each product page also includes specific sizing information. When in doubt, size up for a relaxed fit.'
      },
      {
        question: 'Are your products true to size?',
        answer: 'Our products generally run true to size, with some items designed for an oversized fit (noted in the product description). Refer to our Size Guide for specific measurements.'
      },
      {
        question: 'What materials do you use?',
        answer: 'We use premium quality materials including 100% organic cotton, French terry, and high-grade polyester blends. Material information is listed on each product page.'
      },
      {
        question: 'How should I care for my items?',
        answer: 'Care instructions are included on each product\'s label. Generally, we recommend machine washing cold with like colors and tumble drying on low or hanging to dry.'
      }
    ]
  },
  {
    category: 'Payments & Promotions',
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept Mobile Money (MTN, Vodafone, AirtelTigo), credit/debit cards (Visa, Mastercard), and bank transfers.'
      },
      {
        question: 'Is my payment information secure?',
        answer: 'Yes, all transactions are encrypted and processed through secure payment gateways. We never store your full payment details.'
      },
      {
        question: 'How do I apply a discount code?',
        answer: 'Enter your discount code in the promo code field during checkout. The discount will be applied to your order total before payment.'
      },
      {
        question: 'Do you offer student discounts?',
        answer: 'Yes! Students get 10% off with a valid student ID. Contact us with proof of enrollment to receive your discount code.'
      }
    ]
  }
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left"
      >
        <span className="font-medium pr-8">{question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-400 transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 pb-6' : 'max-h-0'
        )}
      >
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">FAQ</span>
          </nav>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-12">
          <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-center">
            Frequently Asked Questions
          </h1>
          <p className="text-center text-gray-500 mt-3">
            Find answers to common questions about our products and services
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container-narrow py-12 lg:py-20">
        {faqs.map((section) => (
          <div key={section.category} className="mb-12">
            <h2 className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-6">
              {section.category}
            </h2>
            <div className="bg-white">
              {section.questions.map((faq) => (
                <FAQItem key={faq.question} {...faq} />
              ))}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="text-center mt-16 p-8 bg-white">
          <h3 className="font-heading text-2xl mb-4">Still have questions?</h3>
          <p className="text-gray-600 mb-6">
            Our customer service team is here to help.
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
