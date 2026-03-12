import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { fetchPost } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Post } from "@/lib/types";

export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPost(id!);
        if (!cancelled) {
          setPost(data);
          document.title = `${data.title} — RecoverySky Blog`;
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
      document.title = "RecoverySky Blog";
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
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
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

  return (
    <div className="container mx-auto px-4 py-12">
      <article className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to blog
        </Link>

        {post.featured_image && (
          <img
            src={`/api/assets/${post.featured_image}?width=1200&height=600&fit=cover`}
            alt={post.title}
            className="w-full h-64 sm:h-80 object-cover rounded-lg mb-8"
          />
        )}

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-100 mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                  to={`/?tag=${encodeURIComponent(tag)}`}
                  className="text-xs px-2 py-0.5 bg-brand/10 text-brand-light rounded-full border border-brand/20 hover:bg-brand hover:text-white transition-colors"
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
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-brand-light prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-200
            prose-code:text-brand-light prose-code:bg-gray-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800
            prose-blockquote:border-brand/50 prose-blockquote:text-gray-400
            prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
