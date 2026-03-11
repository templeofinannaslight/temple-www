import { Link } from "react-router-dom";
import logo from "@/assets/recoverysky-signature-white.png";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="RecoverySky"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              Blog
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
