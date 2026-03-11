import { usePosts } from "@/hooks/usePosts";
import { useTags } from "@/hooks/useTags";
import { FilterBar } from "@/components/blog/FilterBar";
import { PostList } from "@/components/blog/PostList";
import { Pagination } from "@/components/blog/Pagination";

export function HomePage() {
  const {
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
  } = usePosts();

  const allTags = useTags();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(to right, #c30a68, #f472b6, #7dd3fc, #26619c)" }}
            >
              RecoverySky
            </span>{" "}
            Blog
          </h1>
          <p className="text-gray-500">
            Insights, updates, and stories from our team.
          </p>
        </div>

        <div className="mb-8">
          <FilterBar
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            pageSize={pageSize}
            selectedTag={selectedTag}
            allTags={allTags}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearch}
            onSortChange={handleSortChange}
            onPageSizeChange={handlePageSizeChange}
            onTagSelect={handleTagSelect}
            onClearFilters={clearFilters}
          />
        </div>

        {!loading && !error && totalCount > 0 && (
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-gray-600">
              {pageSize === -1 ? (
                <>Showing all {totalCount} posts</>
              ) : (
                <>
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                </>
              )}
              {selectedTag && (
                <span className="text-brand-light"> tagged {selectedTag}</span>
              )}
            </p>
            {pageSize !== -1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}

        <PostList
          posts={posts}
          loading={loading}
          error={error}
          hasFilters={!!selectedTag || !!searchQuery}
          onTagClick={handleTagSelect}
          onClearFilters={clearFilters}
        />

        {!loading && !error && totalCount > 0 && pageSize !== -1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
