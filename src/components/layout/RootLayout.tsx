import { Header } from "./Header";
import { Footer } from "./Footer";

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-gray-100 bg-gray-950 bg-[url('/pink-clouds.png')] bg-cover bg-fixed bg-center">
      <div className="min-h-screen bg-gray-950/20 backdrop-blur-[2px]">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
