import { useEffect, useState } from "react";
import { fetchAllTags } from "@/lib/api";

export function useTags() {
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetchAllTags().then(setAllTags).catch(console.error);
  }, []);

  return allTags;
}
