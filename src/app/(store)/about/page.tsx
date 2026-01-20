import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px]">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
            alt="World Genius Brand"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative h-full flex items-center justify-center text-center">
          <div className="max-w-3xl px-6">
            <h1 className="font-heading text-5xl md:text-7xl text-white font-medium tracking-tight mb-4">
              Our Story
            </h1>
            <p className="text-white/80 text-xl">
              Born in Ghana. Made for the World.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="container-full py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4">The Beginning</p>
            <h2 className="font-heading text-4xl font-medium tracking-tight mb-6">
              Defying the Ordinary
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                World Genius was born from a simple belief: fashion should be a statement, not a uniform.
                Founded in Accra, Ghana, we set out to create clothing that speaks to the bold, the creative,
                and those who refuse to blend in.
              </p>
              <p>
                Our journey began in a small studio with big dreams. Today, we&apos;ve grown into a brand
                that represents more than just clothing—we represent a movement. A movement of self-expression,
                cultural pride, and unapologetic individuality.
              </p>
              <p>
                Every piece we create is a testament to our roots and our vision. We blend contemporary
                streetwear aesthetics with influences from our rich Ghanaian heritage, creating designs
                that are both globally relevant and culturally meaningful.
              </p>
            </div>
          </div>
          <div className="relative aspect-square">
            <Image
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80"
              alt="World Genius Studio"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-primary text-white py-20 lg:py-32">
        <div className="container-full">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-white/60 mb-4">What We Stand For</p>
            <h2 className="font-heading text-4xl font-medium tracking-tight">Our Values</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 border border-white/30 flex items-center justify-center mx-auto mb-6">
                <span className="font-heading text-2xl">01</span>
              </div>
              <h3 className="font-heading text-xl mb-4">Authenticity</h3>
              <p className="text-white/70">
                We stay true to our roots. Every design, every piece, every decision reflects who we are
                and where we come from.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 border border-white/30 flex items-center justify-center mx-auto mb-6">
                <span className="font-heading text-2xl">02</span>
              </div>
              <h3 className="font-heading text-xl mb-4">Quality</h3>
              <p className="text-white/70">
                We never compromise on quality. Premium materials, expert craftsmanship, and attention
                to detail in every stitch.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 border border-white/30 flex items-center justify-center mx-auto mb-6">
                <span className="font-heading text-2xl">03</span>
              </div>
              <h3 className="font-heading text-xl mb-4">Community</h3>
              <p className="text-white/70">
                World Genius is more than a brand—it&apos;s a community of like-minded individuals who dare
                to be different.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-full py-20 lg:py-32">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-heading text-4xl font-medium tracking-tight mb-6">
            Join the Movement
          </h2>
          <p className="text-gray-600 mb-8">
            Become part of the World Genius community. Explore our latest collections and find
            pieces that speak to your unique style.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 text-sm font-medium tracking-wider uppercase hover:bg-black transition-colors"
          >
            Shop Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
