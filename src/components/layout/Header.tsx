import { Link } from "react-router-dom";
import logo from "@/assets/recoverysky-signature-white.png";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-accent/40 backdrop-blur-md border-b-2 border-neon shadow-[0_2px_30px_#ff2d9570]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="RecoverySky"
              className="h-24 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Blog
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
