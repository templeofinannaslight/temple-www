import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { SSRDataProvider, type SSRData } from "./lib/SSRDataContext";
import App from "./App";

export function render(url: string, ssrData: SSRData = {}) {
  const helmetContext: { helmet?: any } = {};

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
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
  ]
    .filter(Boolean)
    .join("\n    ");

  return { html, head };
}
