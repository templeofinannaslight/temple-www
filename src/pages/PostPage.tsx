import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { fetchPost } from "@/lib/api";
import { useSSRData } from "@/lib/SSRDataContext";
import { formatDate } from "@/lib/format";
import type { Post } from "@/lib/types";

export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const ssrData = useSSRData();
  const ssrPost = ssrData.post?.id === Number(id) ? ssrData.post : null;
  const [post, setPost] = useState<Post | null>(ssrPost);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!ssrPost);
  const skipInitialFetch = useRef(!!ssrPost);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPost(id!);
        if (!cancelled) {
          setPost(data);
        }
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
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-24 mb-8" />
          <div className="h-8 bg-gray-800 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-800 rounded w-1/4 mb-8" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-800 rounded w-5/6" />
            <div className="h-4 bg-gray-800 rounded w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>
          <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-6">
            <p className="text-red-400 font-medium">
              {error || "Post not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayDate = post.written_date || post.date_created;

  const metaDescription = post.excerpt || `${post.title} — RecoverySky Blog`;

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>{post.title} — RecoverySky Blog</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        {post.featured_image && (
          <meta property="og:image" content={`/api/assets/${post.featured_image}?width=1200&height=630&fit=cover`} />
        )}
      </Helmet>
      <article className="max-w-3xl mx-auto">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to blog
        </Link>

        <div className="bg-accent/40 backdrop-blur-md border-2 border-accent-dark rounded-2xl shadow-[0_0_20px_#26619c70] overflow-hidden">
          {post.featured_image && (
            <img
              src={`/api/assets/${post.featured_image}?width=1200&height=600&fit=cover`}
              alt={post.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
          )}

          <div className="p-8 sm:p-12">
            <header className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(displayDate)}
                </span>
                {post.author && <span>by {post.author}</span>}
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="text-xs px-2 py-0.5 bg-brand/10 text-brand-light rounded-full border-2 border-accent-dark hover:border-accent-light hover:bg-brand hover:text-white transition-all"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </header>

            <div
              className="prose prose-invert prose-lg max-w-none
                prose-headings:text-gray-100 prose-headings:font-semibold
                prose-p:text-gray-200 prose-p:leading-relaxed
                prose-a:text-brand-light prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white
                prose-code:text-brand-light prose-code:bg-gray-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800
                prose-blockquote:border-brand/50 prose-blockquote:text-gray-300
                prose-img:rounded-lg
                prose-li:text-gray-200"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </article>
    </div>
  );
}
