import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

export function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <Helmet>
        <title>Not Found — Temple of Inanna's Light</title>
      </Helmet>
      <div className="max-w-md mx-auto text-center">
        <p className="text-6xl font-bold text-gray-800 mb-4">404</p>
        <p className="text-gray-500 mb-8">This page doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-brand-light hover:text-brand transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
