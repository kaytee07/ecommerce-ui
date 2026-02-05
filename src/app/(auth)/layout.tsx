import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center mb-8">
            <Image
              src="/weblogo.png"
              alt="World Genius"
              width={180}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>
          {children}
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex lg:flex-1 bg-primary items-center justify-center">
        <div className="max-w-md text-center text-white p-12">
          <h2 className="text-4xl font-bold mb-4">Welcome to World Genius</h2>
          <p className="text-gray-300 text-lg">
            Your destination for premium products and exceptional quality.
          </p>
        </div>
      </div>
    </div>
  );
}
