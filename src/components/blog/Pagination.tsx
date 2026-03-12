interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (showEllipsisStart) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (showEllipsisEnd) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-gray-100 bg-accent/25 border-2 border-accent-dark rounded-lg hover:border-accent-light hover:shadow-[0_0_30px_#26619ca0] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Prev
      </button>

      <div className="flex items-center gap-1 mx-2">
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${
                currentPage === page
                  ? "bg-brand text-white border-2 border-accent-light shadow-[0_0_25px_#26619ca0]"
                  : "text-gray-100 bg-accent/25 border-2 border-accent-dark hover:border-accent-light hover:shadow-[0_0_30px_#26619ca0]"
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-gray-100 bg-accent/25 border-2 border-accent-dark rounded-lg hover:border-accent-light hover:shadow-[0_0_30px_#26619ca0] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Next
      </button>
    </nav>
  );
}
