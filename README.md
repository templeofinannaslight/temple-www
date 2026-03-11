# Mikki's Mess Blog

A modern blog frontend built with Next.js and TypeScript, connected to a Directus CMS backend.

## Tech Stack

- **Frontend:** Next.js 16 with App Router
- **Styling:** Tailwind CSS 4
- **CMS:** Directus (hosted at https://content.rso)
- **Language:** TypeScript

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.local` and update `NEXT_PUBLIC_DIRECTUS_URL` if needed
   - Default: `https://content.rso`

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Visit http://localhost:3000

## Project Structure

```
├── app/
│   ├── globals.css       # Global styles with Tailwind directives
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Home page (fetches posts)
├── lib/
│   └── directus.ts       # Directus client configuration
├── components/           # Reusable React components
└── .env.local           # Environment variables
```

## Directus Setup

This project expects a `posts` collection in your Directus instance with the following fields:
- `id` (UUID)
- `title` (String)
- `slug` (String)
- `content` (Text/Markdown)
- `published_date` (Date)
- `author` (String, optional)
- `featured_image` (Image, optional)

Update `lib/directus.ts` with your actual collection schema.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Next Steps

1. Define your Directus collection schema in `lib/directus.ts`
2. Create individual post pages with dynamic routing
3. Add navigation and layout components
4. Implement search and filtering
5. Add MDX or rich text rendering for post content
