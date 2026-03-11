import { Header } from "./Header";
import { Footer } from "./Footer";

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
