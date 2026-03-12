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
              className="w-full px-4 py-2.5 pl-10 bg-accent/25 border-2 border-accent-dark rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:border-accent-light focus:shadow-[0_0_30px_#26619ca0] transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </form>

        <button
          onClick={onSortChange}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent/25 border-2 border-accent-dark rounded-lg text-gray-200 hover:text-white hover:border-accent-light hover:shadow-[0_0_30px_#26619ca0] transition-all whitespace-nowrap"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortOrder === "asc" ? "Oldest First" : "Newest First"}
        </button>

        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-4 py-2.5 bg-accent/25 border-2 border-accent-dark rounded-lg text-gray-200 focus:outline-none focus:border-accent-light focus:shadow-[0_0_30px_#26619ca0] transition-all cursor-pointer"
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
          <div className="flex-1 bg-accent/25 border-2 border-accent-dark rounded-lg overflow-hidden">
            <button
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-gray-200 hover:text-white transition-colors"
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
              <div className="px-4 pb-3 pt-2 border-t-2 border-accent-dark">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      onTagSelect(null);
                      setTagsExpanded(false);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedTag === null
                        ? "bg-brand text-white border-accent-light"
                        : "bg-accent/5 text-gray-300 border-accent-dark hover:border-accent-light hover:text-white"
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
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedTag === tag
                          ? "bg-brand text-white border-accent-light"
                          : "bg-accent/5 text-gray-300 border-accent-dark hover:border-accent-light hover:text-white"
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
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border bg-brand/10 text-brand-light border-accent-dark hover:bg-brand hover:text-white hover:shadow-[0_0_18px_#26619ca0] transition-all whitespace-nowrap self-start text-sm"
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
