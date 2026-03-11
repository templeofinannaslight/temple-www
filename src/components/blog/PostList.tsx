import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types";

interface PostListProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasFilters: boolean;
  onTagClick: (tag: string) => void;
  onClearFilters: () => void;
}

export function PostList({
  posts,
  loading,
  error,
  hasFilters,
  onTagClick,
  onClearFilters,
}: PostListProps) {
  if (error) {
    return (
      <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-6">
        <p className="text-red-400 font-medium">Connection Error</p>
        <p className="text-sm text-red-400/70 mt-1">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 animate-pulse"
          >
            <div className="h-5 bg-gray-800 rounded w-2/3 mb-3" />
            <div className="h-3 bg-gray-800 rounded w-1/4 mb-3" />
            <div className="h-3 bg-gray-800 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">
          {hasFilters
            ? "No posts match your search criteria."
            : "No posts found."}
        </p>
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="mt-3 text-sm text-brand-light hover:text-brand transition-colors underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onTagClick={onTagClick} />
      ))}
    </div>
  );
}
