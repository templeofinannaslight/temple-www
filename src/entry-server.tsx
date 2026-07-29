import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { SSRDataProvider, type SSRData } from "./lib/SSRDataContext";
import App from "./App";

export function render(url: string, ssrData: SSRData = {}) {
  const helmetContext: { helmet?: any } = {};

  // Support a configurable base path (GitHub Pages project pages). `url` is the
  // app-relative route (e.g. "/app"); StaticRouter needs the location to include
  // the basename, which it then strips before matching.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");
  const location = basename ? `${basename}${url}` : url;

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={location} basename={basename || undefined}>
        <SSRDataProvider data={ssrData}>
          <App />
        </SSRDataProvider>
      </StaticRouter>
    </HelmetProvider>
  );

  const { helmet } = helmetContext;
  const head = [
    helmet?.title?.toString(),
    helmet?.meta?.toString(),
    helmet?.link?.toString(),
    helmet?.script?.toString(),
  ]
    .filter(Boolean)
    .join("\n    ");

  return { html, head };
}
