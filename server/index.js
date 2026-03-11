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

if (!DIRECTUS_TOKEN) {
  console.warn('⚠️  No DIRECTUS_TOKEN found - will try public access');
}

// Enable CORS for Vite dev server
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Generic Directus collection proxy
app.get('/api/:collection', async (req, res) => {
  const { collection } = req.params;

  try {
    // Build Directus API URL
    const directusApiUrl = new URL(`/items/${collection}`, DIRECTUS_URL);

    // Forward all query parameters (filter, sort, limit, fields, etc.)
    Object.keys(req.query).forEach(key => {
      directusApiUrl.searchParams.append(key, req.query[key]);
    });

    console.log(`📡 Proxying: GET /api/${collection} → ${directusApiUrl.pathname}${directusApiUrl.search}`);

    // Fetch from Directus with authentication (if token provided)
    const headers = {
      'Content-Type': 'application/json'
    };

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

    // Rewrite Directus asset URLs to use our proxy
    let dataStr = JSON.stringify(data);

    // Handle various URL formats Directus might use
    const directusHost = new URL(DIRECTUS_URL).host;

    // Full URL with protocol: https://content.rso/assets/
    dataStr = dataStr.replace(new RegExp(`https?://${directusHost}/assets/`, 'g'), '/api/assets/');
    // Protocol-relative: //content.rso/assets/
    dataStr = dataStr.replace(new RegExp(`//${directusHost}/assets/`, 'g'), '/api/assets/');
    // Relative path with UUID: /assets/uuid (but not already /api/assets/)
    // Directus UUIDs look like: e4529132-8af2-4dc0-a8b4-706620e24358
    dataStr = dataStr.replace(/(?<!\/api)\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi, '/api/assets/$1');

    console.log('📝 Rewritten URLs for:', collection);

    data = JSON.parse(dataStr);
    res.json(data);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Single item from Directus collection
app.get('/api/:collection/:id(\\d+)', async (req, res) => {
  const { collection, id } = req.params;

  try {
    const directusApiUrl = new URL(`/items/${collection}/${id}`, DIRECTUS_URL);

    Object.keys(req.query).forEach(key => {
      directusApiUrl.searchParams.append(key, req.query[key]);
    });

    console.log(`📡 Proxying: GET /api/${collection}/${id} → ${directusApiUrl.pathname}`);

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

    // Rewrite Directus asset URLs
    let dataStr = JSON.stringify(data);
    const directusHost = new URL(DIRECTUS_URL).host;
    dataStr = dataStr.replace(new RegExp(`https?://${directusHost}/assets/`, 'g'), '/api/assets/');
    dataStr = dataStr.replace(new RegExp(`//${directusHost}/assets/`, 'g'), '/api/assets/');
    dataStr = dataStr.replace(/(?<!\/api)\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi, '/api/assets/$1');

    data = JSON.parse(dataStr);
    res.json(data);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
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
  // Skip non-UUID assets (let static middleware handle Vite assets)
  if (!UUID_REGEX.test(req.params.id)) {
    return next();
  }
  const queryString = new URLSearchParams(req.query).toString();
  const redirect = `/api/assets/${req.params.id}${queryString ? '?' + queryString : ''}`;
  console.log(`↪️  Redirecting /assets/ to ${redirect}`);
  res.redirect(redirect);
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
  console.log(`🌍 Environment: ${NODE_ENV}`);
});
