import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { LogIn, LogOut, Github } from "lucide-react";
import logo from "@/assets/recoverysky-signature-white.png";

export function Header() {
  const { pathname } = useLocation();
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm transition-colors ${
        pathname === to
          ? "text-white font-medium"
          : "text-gray-300 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

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
            {navLink("/", "Home")}
            {navLink("/app", "App")}
            {navLink("/blog", "Blog")}
            <a href="https://support.recoverysky.org" className="text-sm text-gray-300 hover:text-white transition-colors">Support</a>
            <Link
              to="/#contact"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Contact
            </Link>
            <a
              href="https://github.com/recoverysky-org/recoverysky-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
              title="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">{user?.name || user?.email}</span>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-accent/25 border-2 border-accent-dark rounded-lg text-gray-200 hover:border-accent-light hover:text-white transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="inline-flex items-center gap-1.5 text-sm px-4 py-1.5 bg-brand text-white rounded-lg border-2 border-neon shadow-[0_0_15px_#ff2d9550] hover:shadow-[0_0_25px_#ff2d9580] transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                Portal
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
