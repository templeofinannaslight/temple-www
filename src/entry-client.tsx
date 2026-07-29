import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SSRDataProvider, type SSRData } from "./lib/SSRDataContext";
import "./index.css";
import App from "./App";

const ssrData: SSRData = (window as any).__SSR_DATA__ || {};

hydrateRoot(
  document.getElementById("root")!,
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
        <SSRDataProvider data={ssrData}>
          <App />
        </SSRDataProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
