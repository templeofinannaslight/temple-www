import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://apps_directus';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const DIRECTUS_COLLECTION = process.env.DIRECTUS_COLLECTION || 'Mikkis_Mess';

const UMAMI_URL = process.env.UMAMI_URL || 'https://umami.recoverysky.app';
const UMAMI_X_API_KEY = process.env.UMAMI_X_API_KEY;
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;

if (!DIRECTUS_TOKEN) {
  console.warn('⚠️  No DIRECTUS_TOKEN found - will try public access');
}

if (!UMAMI_X_API_KEY || !UMAMI_WEBSITE_ID) {
  console.warn('⚠️  Umami server-side tracking disabled (missing UMAMI_X_API_KEY or UMAMI_WEBSITE_ID)');
}

async function createServer() {
  const app = express();

  // Enable CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }));

  // Parse JSON bodies for API endpoints that accept them
  app.use(express.json({ limit: '32kb' }));

  // --- Shared helpers ---

  function safeJsonStringify(data) {
    return JSON.stringify(data)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');
  }

  function rewriteAssetUrls(dataStr) {
    const directusHost = new URL(DIRECTUS_URL).host;
    dataStr = dataStr.replace(new RegExp(`https?://${directusHost}/assets/`, 'g'), '/api/assets/');
    dataStr = dataStr.replace(new RegExp(`//${directusHost}/assets/`, 'g'), '/api/assets/');
    dataStr = dataStr.replace(/(?<!\/api)\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi, '/api/assets/$1');
    return dataStr;
  }

  async function proxyCollection(collection, query, res) {
    const directusApiUrl = new URL(`/items/${collection}`, DIRECTUS_URL);
    Object.keys(query).forEach(key => {
      directusApiUrl.searchParams.append(key, query[key]);
    });

    console.log(`📡 Proxying: /items/${collection}${directusApiUrl.search}`);

    const headers = { 'Content-Type': 'application/json' };
    if (DIRECTUS_TOKEN) {
      headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`;
    }

    const response = await fetch(directusApiUrl.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Directus error (${response.status}):`, errorText);
      return res.status(response.status).json({
        error: 'Directus API error',
        status: response.status,
        message: errorText
      });
    }

    let data = await response.json();
    data = JSON.parse(rewriteAssetUrls(JSON.stringify(data)));
    res.json(data);
  }

  async function proxyCollectionItem(collection, id, query, res) {
    const directusApiUrl = new URL(`/items/${collection}/${id}`, DIRECTUS_URL);
    Object.keys(query).forEach(key => {
      directusApiUrl.searchParams.append(key, query[key]);
    });

    console.log(`📡 Proxying: /items/${collection}/${id}`);

    const headers = { 'Content-Type': 'application/json' };
    if (DIRECTUS_TOKEN) {
      headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`;
    }

    const response = await fetch(directusApiUrl.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Directus error (${response.status}):`, errorText);
      return res.status(response.status).json({
        error: 'Directus API error',
        status: response.status,
        message: errorText
      });
    }

    let data = await response.json();
    data = JSON.parse(rewriteAssetUrls(JSON.stringify(data)));
    res.json(data);
  }

  // --- SSR data fetching ---

  async function fetchDirectus(urlPath, params = {}) {
    const directusApiUrl = new URL(urlPath, DIRECTUS_URL);
    Object.entries(params).forEach(([key, value]) => {
      directusApiUrl.searchParams.append(key, value);
    });

    const headers = { 'Content-Type': 'application/json' };
    if (DIRECTUS_TOKEN) {
      headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`;
    }

    const response = await fetch(directusApiUrl.toString(), { headers });
    if (!response.ok) return null;

    let data = await response.json();
    data = JSON.parse(rewriteAssetUrls(JSON.stringify(data)));
    return data;
  }

  async function getSSRData(url) {
    const ssrData = {};
    const pathname = url.split('?')[0];

    // Blog listing page
    if (pathname === '/blog') {
      try {
        const [postsResult, tagsResult] = await Promise.all([
          fetchDirectus(`/items/${DIRECTUS_COLLECTION}`, {
            'filter[status][_eq]': 'published',
            'sort': '-written_date',
            'limit': '10',
            'offset': '0',
            'meta': 'filter_count',
          }),
          fetchDirectus(`/items/${DIRECTUS_COLLECTION}`, {
            'filter[status][_eq]': 'published',
            'filter[tags][_nnull]': 'true',
            'fields': 'tags',
            'limit': '-1',
          }),
        ]);

        if (postsResult) {
          ssrData.posts = {
            posts: postsResult.data || [],
            totalCount: postsResult.meta?.filter_count || 0,
          };
        }

        if (tagsResult) {
          const tagSet = new Set();
          (tagsResult.data || []).forEach(post => {
            if (post.tags) post.tags.forEach(tag => tagSet.add(tag));
          });
          ssrData.tags = Array.from(tagSet).sort();
        }
      } catch (err) {
        console.error('⚠️  SSR data fetch failed for /blog:', err.message);
      }
    }

    // Individual post page
    const postMatch = pathname.match(/^\/post\/(\d+)/);
    if (postMatch) {
      try {
        const result = await fetchDirectus(`/items/${DIRECTUS_COLLECTION}/${postMatch[1]}`);
        if (result) {
          ssrData.post = result.data;
        }
      } catch (err) {
        console.error('⚠️  SSR data fetch failed for post:', err.message);
      }
    }

    // Dynamic content pages: /content/:collection/:name
    const ALLOWED_CONTENT_COLLECTIONS = new Set(['RecoverySky_Content']);
    const contentMatch = pathname.match(/^\/content\/([^/]+)\/([^/]+)$/);
    if (contentMatch) {
      const [, collection, name] = contentMatch;
      if (ALLOWED_CONTENT_COLLECTIONS.has(collection)) {
        try {
          const result = await fetchDirectus(`/items/${collection}`, {
            'filter[name][_eq]': decodeURIComponent(name),
            'limit': '1',
          });
          if (result && result.data && result.data.length > 0) {
            ssrData.document = { collection, name: decodeURIComponent(name), data: result.data[0] };
          }
        } catch (err) {
          console.error(`⚠️  SSR data fetch failed for ${pathname}:`, err.message);
        }
      }
    }

    return ssrData;
  }

  // --- Blog routes (map to DIRECTUS_COLLECTION at runtime) ---

  app.get('/api/blog', async (req, res) => {
    try {
      await proxyCollection(DIRECTUS_COLLECTION, req.query, res);
    } catch (error) {
      console.error('❌ Proxy error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  });

  app.get('/api/blog/:id', async (req, res) => {
    try {
      await proxyCollectionItem(DIRECTUS_COLLECTION, req.params.id, req.query, res);
    } catch (error) {
      console.error('❌ Proxy error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  });

  // --- Generic Directus collection proxy ---

  app.get('/api/:collection', async (req, res) => {
    try {
      await proxyCollection(req.params.collection, req.query, res);
    } catch (error) {
      console.error('❌ Proxy error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  });

  // Directus assets proxy (images, files)
  app.get('/api/assets/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const directusAssetUrl = new URL(`/assets/${id}`, DIRECTUS_URL);
      Object.keys(req.query).forEach(key => {
        directusAssetUrl.searchParams.append(key, req.query[key]);
      });

      console.log(`🖼️  Proxying asset: ${id}`);

      const headers = {};
      if (DIRECTUS_TOKEN) {
        headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`;
      }

      const response = await fetch(directusAssetUrl.toString(), { headers });

      if (!response.ok) {
        console.error(`❌ Asset error (${response.status})`);
        return res.status(response.status).send('Asset not found');
      }

      const contentType = response.headers.get('content-type');
      const cacheControl = response.headers.get('cache-control');

      if (contentType) res.setHeader('Content-Type', contentType);
      if (cacheControl) res.setHeader('Cache-Control', cacheControl);

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));

    } catch (error) {
      console.error('❌ Asset proxy error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Fallback: /assets/:uuid redirects to /api/assets/:uuid (only UUIDs, not Vite assets)
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  app.get('/assets/:id', (req, res, next) => {
    if (!UUID_REGEX.test(req.params.id)) {
      return next();
    }
    const queryString = new URLSearchParams(req.query).toString();
    const redirect = `/api/assets/${req.params.id}${queryString ? '?' + queryString : ''}`;
    console.log(`↪️  Redirecting /assets/ to ${redirect}`);
    res.redirect(redirect);
  });

  // Single item from generic Directus collection
  app.get('/api/:collection/:id', async (req, res) => {
    try {
      await proxyCollectionItem(req.params.collection, req.params.id, req.query, res);
    } catch (error) {
      console.error('❌ Proxy error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  });

  // Sitemap — only the homepage is published for now.
  // Other routes still resolve via direct URL but are intentionally excluded
  // from search-engine discovery until the temple chooses to publish them.
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = process.env.SITE_URL || 'https://www.templeofinannaslight.org';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
  </url>
</urlset>`;
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'recoverysky-blog-api' });
  });

  // Umami tracking proxy — handles both pageviews and custom events
  app.post('/api/track', async (req, res) => {
    if (!UMAMI_X_API_KEY || !UMAMI_WEBSITE_ID) {
      return res.status(204).end();
    }

    const { name, data, url, referrer, title, screen, language } = req.body || {};

    try {
      const userAgent = req.get('user-agent') || '';
      const hostname = req.get('host') || '';
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();

      // Umami infers pageview vs event from presence of `name`
      const payload = {
        type: 'event',
        payload: {
          website: UMAMI_WEBSITE_ID,
          hostname,
          url: url || '/',
          referrer: referrer || '',
          title: title || '',
          language: language || '',
          screen: screen || '',
          ...(name ? { name } : {}),
          ...(data && typeof data === 'object' ? { data } : {}),
        },
      };

      const response = await fetch(new URL('/api/send', UMAMI_URL).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          'X-Forwarded-For': ip,
          'x-api-key': UMAMI_X_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`❌ Umami error (${response.status}):`, text);
        return res.status(response.status).json({ error: 'Umami error', message: text });
      }

      res.status(204).end();
    } catch (error) {
      console.error('❌ Umami track error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  });

  // --- SSR ---

  if (NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, '..', 'dist', 'client');

    // Serve built static assets (JS, CSS, images)
    app.use(express.static(clientPath, { index: false }));

    // Serve static site (takes priority over React SSR)
    const staticSitePath = path.join(__dirname, '..', 'static-site');
    app.use(express.static(staticSitePath));

    // Load the server-side render function
    const { render } = await import(path.join(__dirname, '..', 'dist', 'server', 'entry-server.js'));
    const template = fs.readFileSync(path.join(clientPath, 'index.html'), 'utf-8');

    // SSR fallback for all routes
    app.get('*path', async (req, res) => {
      const ssrData = await getSSRData(req.originalUrl);
      const { html, head } = render(req.originalUrl, ssrData);
      const page = template
        .replace('<!--ssr-head-->', head)
        .replace('<!--ssr-outlet-->', html)
        .replace('</head>', `<script>window.__SSR_DATA__=${safeJsonStringify(ssrData)}</script>\n</head>`);
      res.status(200).set({ 'Content-Type': 'text/html' }).send(page);
    });
  } else {
    // Dev: Vite SSR middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Serve static site in dev too
    const staticSitePath = path.join(__dirname, '..', 'static-site');
    app.use(express.static(staticSitePath));

    app.get('*path', async (req, res) => {
      try {
        let template = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
        const ssrData = await getSSRData(req.originalUrl);
        const { html, head } = render(req.originalUrl, ssrData);
        const page = template
          .replace('<!--ssr-head-->', head)
          .replace('<!--ssr-outlet-->', html)
          .replace('</head>', `<script>window.__SSR_DATA__=${safeJsonStringify(ssrData)}</script>\n</head>`);
        res.status(200).set({ 'Content-Type': 'text/html' }).send(page);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.error(e);
        res.status(500).end(e.message);
      }
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Proxying to: ${DIRECTUS_URL}`);
    console.log(`📂 Blog collection: ${DIRECTUS_COLLECTION}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🔧 SSR: enabled`);
  });
}

createServer();
