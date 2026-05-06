import { Header } from "./Header";
import { Footer } from "./Footer";

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-gray-100 relative">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-gray-950 bg-[url('/templeofinannaslight-background.png')] bg-cover bg-center bg-no-repeat"
      />
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
