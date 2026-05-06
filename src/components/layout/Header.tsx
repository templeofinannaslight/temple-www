// import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { useAuth0 } from "@auth0/auth0-react";
// import { LogIn, LogOut, User } from "lucide-react";
// import { trackEvent } from "@/lib/analytics";

// function AuthNav() {
//   const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
//
//   const fab =
//     "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2";
//
//   if (isAuthenticated) {
//     const displayName = user?.name || user?.email || "Logged in";
//     return (
//       <div className="flex items-center gap-3">
//         <button
//           type="button"
//           aria-label={`Profile — ${displayName}`}
//           title={`Logged in as ${displayName}`}
//           className={`${fab} bg-accent/40 backdrop-blur-md text-white border-accent-light shadow-[0_0_15px_#26619c50] hover:shadow-[0_0_25px_#26619c80] overflow-hidden`}
//         >
//           {user?.picture ? (
//             <img
//               src={user.picture}
//               alt={displayName}
//               className="w-full h-full object-cover"
//               referrerPolicy="no-referrer"
//             />
//           ) : (
//             <User className="w-5 h-5" />
//           )}
//         </button>
//         <button
//           type="button"
//           onClick={() => {
//             trackEvent("auth_logout_click", { location: "header" });
//             logout({ logoutParams: { returnTo: window.location.origin } });
//           }}
//           aria-label="Log out"
//           title="Log out"
//           className={`${fab} bg-brand text-white border-neon shadow-[0_0_15px_#ff2d9550] hover:shadow-[0_0_25px_#ff2d9580]`}
//         >
//           <LogOut className="w-5 h-5" />
//         </button>
//       </div>
//     );
//   }
//
//   return (
//     <button
//       type="button"
//       onClick={() => {
//         trackEvent("auth_login_click", { location: "header" });
//         loginWithRedirect();
//       }}
//       aria-label="Log in"
//       title="Log in"
//       className={`${fab} bg-brand text-white border-neon shadow-[0_0_15px_#ff2d9550] hover:shadow-[0_0_25px_#ff2d9580]`}
//     >
//       <LogIn className="w-5 h-5" />
//     </button>
//   );
// }

export function Header() {
  // const [mounted, setMounted] = useState(false);
  //
  // useEffect(() => {
  //   setMounted(true);
  // }, []);

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
            {/* {mounted && <AuthNav />} */}
          </nav>
        </div>
      </div>
    </header>
  );
}
