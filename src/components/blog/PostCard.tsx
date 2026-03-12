import { Link } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, slugify } from "@/lib/format";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
  onTagClick: (tag: string) => void;
}

export function PostCard({ post, onTagClick }: PostCardProps) {
  const displayDate = post.written_date || post.date_created;
  const postUrl = `/post/${post.id}/${slugify(post.title)}`;

  return (
    <Link to={postUrl} className="block group">
      <Card className="bg-gray-900 border-gray-800 group-hover:border-brand/30 group-hover:shadow-lg group-hover:shadow-brand/5 transition-all duration-200">
        {post.featured_image && (
          <div className="overflow-hidden rounded-t-lg">
            <img
              src={`/api/assets/${post.featured_image}?width=800&height=400&fit=cover`}
              alt={post.title}
              className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-gray-100 group-hover:text-brand-light transition-colors">
                {post.title}
              </CardTitle>
              <CardDescription className="text-gray-500 mt-2">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(displayDate)}
                </span>
                {post.author && (
                  <span className="ml-3 text-gray-500">by {post.author}</span>
                )}
              </CardDescription>
              {post.excerpt && (
                <p className="mt-3 text-sm text-gray-400 line-clamp-2">
                  {post.excerpt}
                </p>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onTagClick(tag);
                      }}
                      className="text-xs px-2 py-0.5 bg-brand/10 text-brand-light rounded-full border border-brand/20 hover:bg-brand hover:text-white transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-brand-light group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
