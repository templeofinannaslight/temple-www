import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { HelmetProvider } from "react-helmet-async";
import { SSRDataProvider, type SSRData } from "./lib/SSRDataContext";
import "./index.css";
import App from "./App";

const ssrData: SSRData = (window as any).__SSR_DATA__ || {};

hydrateRoot(
  document.getElementById("root")!,
  <StrictMode>
    <HelmetProvider>
      <Auth0Provider
        domain="meetingmaker.us.auth0.com"
        clientId="yzfwOaU5V5wlnSKGsUkUk6mz7IidXaJl"
        authorizationParams={{ redirect_uri: window.location.origin }}
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
