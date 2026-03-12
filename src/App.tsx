import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { BlogPage } from "@/pages/BlogPage";
import { PostPage } from "@/pages/PostPage";
import { AppPage } from "@/pages/AppPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function App() {
  return (
    <RootLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/post/:id/:slug" element={<PostPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RootLayout>
  );
}

export default App;
