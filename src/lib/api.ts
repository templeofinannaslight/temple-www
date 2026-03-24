import { API_URL, COLLECTION, ALLOWED_CONTENT_COLLECTIONS } from "./constants";
import type { Post, ContentDocument } from "./types";

interface FetchPostsParams {
  sortOrder: "asc" | "desc";
  pageSize: number;
  currentPage: number;
  searchQuery: string;
  selectedTag: string | null;
}

interface FetchPostsResult {
  posts: Post[];
  totalCount: number;
}

export async function fetchPosts({
  sortOrder,
  pageSize,
  currentPage,
  searchQuery,
  selectedTag,
}: FetchPostsParams): Promise<FetchPostsResult> {
  const sort = sortOrder === "desc" ? "-written_date" : "written_date";
  const needsClientFilter = !!selectedTag;
  const limit = needsClientFilter ? -1 : pageSize === -1 ? -1 : pageSize;
  const offset = needsClientFilter
    ? 0
    : pageSize === -1
      ? 0
      : (currentPage - 1) * pageSize;

  let url = `${API_URL}/${COLLECTION}?filter[status][_eq]=published&sort=${sort}&limit=${limit}&offset=${offset}&meta=filter_count`;

  if (searchQuery.trim()) {
    url += `&search=${encodeURIComponent(searchQuery.trim())}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  let filteredPosts: Post[] = json.data || [];

  if (selectedTag) {
    filteredPosts = filteredPosts.filter((post) =>
      post.tags?.includes(selectedTag)
    );
  }

  if (needsClientFilter && pageSize !== -1) {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return {
      posts: filteredPosts.slice(start, end),
      totalCount: filteredPosts.length,
    };
  }

  return {
    posts: filteredPosts,
    totalCount: needsClientFilter
      ? filteredPosts.length
      : json.meta?.filter_count || 0,
  };
}

export async function fetchPost(id: string): Promise<Post> {
  const response = await fetch(`${API_URL}/${COLLECTION}/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const json = await response.json();
  return json.data;
}

export async function fetchDocument(collection: string, name: string): Promise<ContentDocument> {
  if (!ALLOWED_CONTENT_COLLECTIONS.has(collection)) {
    throw new Error("Collection not allowed");
  }
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(collection)}?filter[title][_eq]=${encodeURIComponent(name)}&limit=1`
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const json = await response.json();
  const docs = json.data || [];
  if (docs.length === 0) {
    throw new Error("Document not found");
  }
  return docs[0];
}

export async function fetchAllTags(): Promise<string[]> {
  const response = await fetch(
    `${API_URL}/${COLLECTION}?filter[status][_eq]=published&filter[tags][_nnull]=true&fields=tags&limit=-1`
  );
  if (!response.ok) return [];

  const json = await response.json();
  const tags = new Set<string>();
  (json.data || []).forEach((post: { tags: string[] | null }) => {
    post.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}
