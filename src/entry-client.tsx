import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { HelmetProvider } from "react-helmet-async";
import { SSRDataProvider, type SSRData } from "./lib/SSRDataContext";
import "./index.css";
import App from "./App";

const ssrData: SSRData = (window as any).__SSR_DATA__ || {};

const AUTH0_DOMAIN = import.meta.env.AUTH0_DOMAIN || "";
const AUTH0_CLIENT_ID = import.meta.env.AUTH0_CLIENT_ID || "";
const AUTH0_AUDIENCE = import.meta.env.AUTH0_AUDIENCE || "";
const AUTH0_SCOPE = import.meta.env.AUTH0_SCOPE || "";

hydrateRoot(
  document.getElementById("root")!,
  <StrictMode>
    <HelmetProvider>
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        cacheLocation="localstorage"
        useRefreshTokens={true}
        useRefreshTokensFallback={true}
        authorizationParams={{
          redirect_uri: window.location.origin,
          ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {}),
          ...(AUTH0_SCOPE ? { scope: AUTH0_SCOPE } : {}),
        }}
      >
        <BrowserRouter>
          <SSRDataProvider data={ssrData}>
            <App />
          </SSRDataProvider>
        </BrowserRouter>
      </Auth0Provider>
    </HelmetProvider>
  </StrictMode>
);
