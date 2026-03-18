import { Header } from "./Header";
import { Footer } from "./Footer";

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-gray-100 bg-gray-950 bg-[url('/pink-clouds.png')] bg-cover bg-center">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
