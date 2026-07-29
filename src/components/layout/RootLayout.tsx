import { Header } from "./Header";
import { Footer } from "./Footer";
import { asset } from "@/lib/asset";

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-gray-100 relative">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-gray-950 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${asset("/templeofinannaslight-background.png")})` }}
      />
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
