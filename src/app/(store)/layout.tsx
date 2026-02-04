import { Header, Footer } from '@/components/layout';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 pb-12 sm:pb-16">{children}</main>
      <Footer />
    </>
  );
}
