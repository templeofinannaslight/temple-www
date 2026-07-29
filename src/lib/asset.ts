// Prefix a public (non-bundled) asset path with Vite's configured base so it
// resolves whether the app is served from a root domain or a project sub-path.
// import.meta.env.BASE_URL is "/" at root and e.g. "/temple-www/" under a sub-path.
export function asset(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}
