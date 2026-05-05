import { Link } from "react-router-dom";

const LEGAL_LINKS = [
  { label: "Privacy", to: "/content/RecoverySky_Content/privacy" },
  { label: "Terms", to: "/content/RecoverySky_Content/terms" },
  { label: "EULA", to: "/content/RecoverySky_Content/EULA" },
  { label: "Disclaimer", to: "/content/RecoverySky_Content/disclaimer" },
];

export function Footer() {
  return (
    <footer className="border-t-2 border-neon shadow-[0_-2px_30px_#ff2d9570] bg-accent/40 py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-300">
          <p>&copy; {new Date().getFullYear()} Temple of Inanna's Light</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
