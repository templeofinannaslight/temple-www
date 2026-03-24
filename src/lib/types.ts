export interface Post {
  id: number;
  status: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  tags: string[] | null;
  author: string | null;
  written_date: string | null;
  date_created: string;
  date_updated: string;
}

export interface WWWDocument {
  id: number;
  name: string;
  content: string;
  date_created: string;
  date_updated: string;
}
