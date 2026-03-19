import { createContext, useContext } from "react";
import type { Post } from "./types";

export interface SSRData {
  posts?: { posts: Post[]; totalCount: number };
  post?: Post;
  tags?: string[];
}

const SSRDataContext = createContext<SSRData>({});

export function SSRDataProvider({
  data,
  children,
}: {
  data: SSRData;
  children: React.ReactNode;
}) {
  return (
    <SSRDataContext.Provider value={data}>{children}</SSRDataContext.Provider>
  );
}

export function useSSRData() {
  return useContext(SSRDataContext);
}
