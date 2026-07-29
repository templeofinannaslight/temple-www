import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const clientDir = path.join(rootDir, "dist", "client");
const serverEntry = path.join(rootDir, "dist", "server", "entry-server.js");

// Routes that are fully self-contained (need no live backend) and get
// prerendered to static HTML with baked-in SEO <head>.
const ROUTES = ["/", "/app", "/support", "/resources"];
const SITE_URL = process.env.SITE_URL || "https://templeofinannaslight.org";

// Mirror the server's escaping so an empty __SSR_DATA__ script is safe.
function safeJsonStringify(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

async function main() {
  const template = fs.readFileSync(path.join(clientDir, "index.html"), "utf-8");
  const { render } = await import(serverEntry);

  for (const route of ROUTES) {
    const { html, head } = render(route, {});
    const page = template
      .replace("<!--ssr-head-->", head)
      .replace("<!--ssr-outlet-->", html)
      .replace(
        "</head>",
        `<script>window.__SSR_DATA__=${safeJsonStringify({})}</script>\n</head>`
      );

    const outPath =
      route === "/"
        ? path.join(clientDir, "index.html")
        : path.join(clientDir, route.replace(/^\//, ""), "index.html");

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, page, "utf-8");
    console.log(`✓ prerendered ${route} → ${path.relative(clientDir, outPath)}`);
  }

  // Static sitemap — homepage only, matching the current dynamic route's output.
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>weekly</changefreq>
  </url>
</urlset>`;
  fs.writeFileSync(path.join(clientDir, "sitemap.xml"), sitemap, "utf-8");
  console.log("✓ wrote sitemap.xml");

  // SPA fallback for GitHub Pages. Pages serves this file for any path that
  // has no static file (dead blog scaffold, deep links). Empty #root and
  // empty head so the client boots fresh — no prerendered markup means no
  // hydration mismatch — and BrowserRouter renders the route for the real URL.
  const notFound = template
    .replace("<!--ssr-head-->", "")
    .replace("<!--ssr-outlet-->", "")
    .replace(
      "</head>",
      `<script>window.__SSR_DATA__=${safeJsonStringify({})}</script>\n</head>`
    );
  fs.writeFileSync(path.join(clientDir, "404.html"), notFound, "utf-8");
  console.log("✓ wrote 404.html");
}

main().catch((err) => {
  console.error("✗ prerender failed:", err);
  process.exit(1);
});
