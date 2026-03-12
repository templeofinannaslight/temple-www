import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain="meetingmaker.us.auth0.com"
      clientId="yzfwOaU5V5wlnSKGsUkUk6mz7IidXaJl"
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </StrictMode>
);
