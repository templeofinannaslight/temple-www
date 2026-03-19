import { useEffect, useRef, useState } from "react";
import { fetchPosts } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { Post } from "@/lib/types";

interface InitialData {
  posts: Post[];
  totalCount: number;
}

export function usePosts(initialData?: InitialData) {
  const [posts, setPosts] = useState<Post[]>(initialData?.posts ?? []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialData?.totalCount ?? 0);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const skipInitialFetch = useRef(!!initialData);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalCount / pageSize);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPosts({
          sortOrder,
          pageSize,
          currentPage,
          searchQuery,
          selectedTag,
        });
        if (!cancelled) {
          setPosts(result.posts);
          setTotalCount(result.totalCount);
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
  }, [currentPage, sortOrder, searchQuery, selectedTag, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedTag(null);
    setSearchQuery("");
    setCurrentPage(1);
  };

  return {
    posts,
    error,
    loading,
    currentPage,
    totalCount,
    totalPages,
    sortOrder,
    searchQuery,
    selectedTag,
    pageSize,
    setSearchQuery,
    handlePageChange,
    handleSortChange,
    handleSearch,
    handleTagSelect,
    handlePageSizeChange,
    clearFilters,
  };
}
