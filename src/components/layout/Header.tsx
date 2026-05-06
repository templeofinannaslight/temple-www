// import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { useLocation } from "react-router-dom";
// import { useAuth0 } from "@auth0/auth0-react";
// import { LogIn, LogOut, Github } from "lucide-react";
// import { Github } from "lucide-react";
// import { trackEvent } from "@/lib/analytics";

// function AuthNav() {
//   const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
//
//   if (isAuthenticated) {
//     return (
//       <div className="flex items-center gap-3">
//         <span className="text-sm text-gray-300">{user?.name || user?.email}</span>
//         <button
//           onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
//           className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-accent/25 border-2 border-accent-dark rounded-lg text-gray-200 hover:border-accent-light hover:text-white transition-all"
//         >
//           <LogOut className="w-3.5 h-3.5" />
//           Logout
//         </button>
//       </div>
//     );
//   }
//
//   return (
//     <button
//       onClick={() => loginWithRedirect()}
//       className="inline-flex items-center gap-1.5 text-sm px-4 py-1.5 bg-brand text-white rounded-lg border-2 border-neon shadow-[0_0_15px_#ff2d9550] hover:shadow-[0_0_25px_#ff2d9580] transition-all"
//     >
//       <LogIn className="w-3.5 h-3.5" />
//       Portal
//     </button>
//   );
// }

// function PortalFallback() {
//   return (
//     <span className="inline-flex items-center gap-1.5 text-sm px-4 py-1.5 bg-brand text-white rounded-lg border-2 border-neon shadow-[0_0_15px_#ff2d9550]">
//       <LogIn className="w-3.5 h-3.5" />
//       Portal
//     </span>
//   );
// }

export function Header() {
  // const { pathname } = useLocation();
  // const [mounted, setMounted] = useState(false);

  // useEffect(() => {
  //   setMounted(true);
  // }, []);

  // const navLink = (to: string, label: string) => (
  //   <Link
  //     to={to}
  //     className={`text-sm transition-colors ${
  //       pathname === to
  //         ? "text-white font-medium"
  //         : "text-gray-300 hover:text-white"
  //     }`}
  //   >
  //     {label}
  //   </Link>
  // );

  return (
    <header className="sticky top-0 z-50 bg-accent/40 backdrop-blur-md border-b-2 border-neon shadow-[0_2px_30px_#ff2d9570]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center">
            <img
              src="/templeofinannaslight-banner.png"
              alt="Temple of Inanna's Light"
              className="h-20 sm:h-24 w-auto rounded-xl"
            />
          </Link>
          <nav className="flex items-center gap-6">
            {/* {navLink("/", "Home")} */}
            {/* {navLink("/blog", "Blog")} */}
            {/* <Link
              to="/#contact"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Contact
            </Link> */}
            {/* <a
              href="https://github.com/recoverysky-org/recoverysky-app"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("github_click", { location: "header" })}
              className="text-gray-300 hover:text-white transition-colors"
              title="GitHub"
            >
              <Github className="w-5 h-5" />
            </a> */}
            {/* {mounted ? <AuthNav /> : <PortalFallback />} */}
          </nav>
        </div>
      </div>
    </header>
  );
}
