import { useEffect, useState } from "react";
import { fetchAllTags } from "@/lib/api";

export function useTags(initialTags?: string[]) {
  const [allTags, setAllTags] = useState<string[]>(initialTags ?? []);

  useEffect(() => {
    if (initialTags && initialTags.length > 0) return;
    fetchAllTags().then(setAllTags).catch(console.error);
  }, []);

  return allTags;
}
