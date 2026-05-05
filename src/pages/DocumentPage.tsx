import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { fetchDocument } from "@/lib/api";
import { ALLOWED_CONTENT_COLLECTIONS } from "@/lib/constants";
import { useSSRData } from "@/lib/SSRDataContext";
import type { ContentDocument } from "@/lib/types";

export function DocumentPage() {
  const { collection, name } = useParams<{
    collection: string;
    name: string;
  }>();

  const allowed = !!collection && ALLOWED_CONTENT_COLLECTIONS.has(collection);

  const ssrData = useSSRData();
  const ssrDoc =
    ssrData.document?.collection === collection &&
    ssrData.document?.name === name
      ? ssrData.document?.data ?? null
      : null;

  const [doc, setDoc] = useState<ContentDocument | null>(ssrDoc);
  const [error, setError] = useState<string | null>(
    !allowed ? "Not found" : null
  );
  const [loading, setLoading] = useState(allowed && !ssrDoc);
  const skipInitialFetch = useRef(!!ssrDoc);

  useEffect(() => {
    if (!allowed || !collection || !name) return;

    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDocument(collection!, name!);
        if (!cancelled) setDoc(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [collection, name, allowed]);

  const title = doc?.title || name || "Document";

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/2 mb-8" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-800 rounded w-5/6" />
            <div className="h-4 bg-gray-800 rounded w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-6">
            <p className="text-red-400 font-medium">
              {error || "Document not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>{title} — RecoverySky</title>
        <meta name="description" content={`${title} for RecoverySky`} />
        <meta property="og:title" content={`${title} — RecoverySky`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #c30a68, #f472b6, #7dd3fc, #26619c)",
              }}
            >
              {title}
            </span>
          </h1>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-accent/90 border-2 border-accent-dark rounded-2xl shadow-[0_0_20px_#26619c70] p-8 sm:p-12">
            <div
              className="prose prose-invert prose-lg max-w-none
                prose-headings:text-gray-100 prose-headings:font-semibold
                prose-p:text-gray-200 prose-p:leading-relaxed
                prose-a:text-brand-light prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white
                prose-code:text-brand-light prose-code:bg-gray-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800
                prose-blockquote:border-brand/50 prose-blockquote:text-gray-300
                prose-li:text-gray-200"
              dangerouslySetInnerHTML={{ __html: doc.content }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
