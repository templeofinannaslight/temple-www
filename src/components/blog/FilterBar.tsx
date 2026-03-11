import { Search, ArrowUpDown, Tag, X } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { useState } from "react";

interface FilterBarProps {
  searchQuery: string;
  sortOrder: "asc" | "desc";
  pageSize: number;
  selectedTag: string | null;
  allTags: string[];
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onSortChange: () => void;
  onPageSizeChange: (size: number) => void;
  onTagSelect: (tag: string | null) => void;
  onClearFilters: () => void;
}

export function FilterBar({
  searchQuery,
  sortOrder,
  pageSize,
  selectedTag,
  allTags,
  onSearchChange,
  onSearchSubmit,
  onSortChange,
  onPageSizeChange,
  onTagSelect,
  onClearFilters,
}: FilterBarProps) {
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const hasActiveFilters = !!selectedTag || !!searchQuery;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={onSearchSubmit} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search posts..."
              className="w-full px-4 py-2.5 pl-10 bg-gray-900 border border-gray-800 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          </div>
        </form>

        <button
          onClick={onSortChange}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-colors whitespace-nowrap"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortOrder === "asc" ? "Oldest First" : "Newest First"}
        </button>

        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-colors cursor-pointer"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size === -1 ? "All" : `${size} per page`}
            </option>
          ))}
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                <span className="text-sm">Filter by Tag</span>
                {selectedTag && (
                  <span className="text-xs px-2 py-0.5 bg-brand text-white rounded-full">
                    {selectedTag}
                  </span>
                )}
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${tagsExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {tagsExpanded && (
              <div className="px-4 pb-3 pt-2 border-t border-gray-800">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      onTagSelect(null);
                      setTagsExpanded(false);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selectedTag === null
                        ? "bg-brand text-white border-brand"
                        : "bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-300"
                    }`}
                  >
                    All Posts
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        onTagSelect(tag);
                        setTagsExpanded(false);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        selectedTag === tag
                          ? "bg-brand text-white border-brand"
                          : "bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-300"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border bg-brand/10 text-brand-light border-brand/30 hover:bg-brand hover:text-white transition-colors whitespace-nowrap self-start text-sm"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
