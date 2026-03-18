import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://content.rso';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const DIRECTUS_COLLECTION = process.env.DIRECTUS_COLLECTION || 'Mikkis_Mess';

if (!DIRECTUS_TOKEN) {
  console.warn('⚠️  No DIRECTUS_TOKEN found - will try public access');
}

// Enable CORS for Vite dev server
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// --- Shared proxy helpers ---

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

    // Forward query params (width, height, fit, quality, etc.)
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

    // Forward content-type and cache headers
    const contentType = response.headers.get('content-type');
    const cacheControl = response.headers.get('cache-control');

    if (contentType) res.setHeader('Content-Type', contentType);
    if (cacheControl) res.setHeader('Cache-Control', cacheControl);

    // Stream the response body
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
// Placed after /api/assets/:id so asset requests don't match
app.get('/api/:collection/:id', async (req, res) => {
  try {
    await proxyCollectionItem(req.params.collection, req.params.id, req.query, res);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Dynamic sitemap
app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = process.env.SITE_URL || 'https://recoverysky.org';

  // Static pages
  const pages = ['/', '/app', '/blog'];

  // Fetch published blog posts for dynamic URLs
  let postUrls = [];
  try {
    const directusApiUrl = new URL(`/items/${DIRECTUS_COLLECTION}`, DIRECTUS_URL);
    directusApiUrl.searchParams.append('filter[status][_eq]', 'published');
    directusApiUrl.searchParams.append('fields', 'id,title,date_updated');
    directusApiUrl.searchParams.append('sort', '-date_updated');
    directusApiUrl.searchParams.append('limit', '-1');

    const headers = { 'Content-Type': 'application/json' };
    if (DIRECTUS_TOKEN) headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`;

    const response = await fetch(directusApiUrl.toString(), { headers });
    if (response.ok) {
      const json = await response.json();
      postUrls = (json.data || []).map(post => {
        const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return {
          url: `/post/${post.id}/${slug}`,
          lastmod: post.date_updated ? new Date(post.date_updated).toISOString().split('T')[0] : undefined,
        };
      });
    }
  } catch (err) {
    console.error('⚠️  Sitemap: failed to fetch posts:', err.message);
  }

  const urls = [
    ...pages.map(p => `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <changefreq>${p === '/' ? 'weekly' : 'monthly'}</changefreq>\n  </url>`),
    ...postUrls.map(p => `  <url>\n    <loc>${baseUrl}${p.url}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ''}\n    <changefreq>monthly</changefreq>\n  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'recoverysky-blog-api' });
});

// Serve static files in production
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*path', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📍 Proxying to: ${DIRECTUS_URL}`);
  console.log(`📂 Blog collection: ${DIRECTUS_COLLECTION}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
});
