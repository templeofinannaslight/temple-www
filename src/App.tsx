import { Routes, Route } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { BlogPage } from "@/pages/BlogPage";
import { PostPage } from "@/pages/PostPage";
import { AppPage } from "@/pages/AppPage";
import { SupportPage } from "@/pages/SupportPage";
import { DocumentPage } from "@/pages/DocumentPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function App() {
  return (
    <RootLayout>
      <Helmet>
        <meta property="og:site_name" content="RecoverySky" />
      </Helmet>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/eula" element={<DocumentPage name="EULA" title="End User License Agreement" />} />
        <Route path="/terms" element={<DocumentPage name="terms" title="Terms of Service" />} />
        <Route path="/privacy" element={<DocumentPage name="privacy" title="Privacy Policy" />} />
        <Route path="/disclaimer" element={<DocumentPage name="disclaimer" title="Disclaimer" />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/post/:id/:slug" element={<PostPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RootLayout>
  );
}

export default App;
