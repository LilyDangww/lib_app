import { Footer, Header } from "@/components/layout";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

