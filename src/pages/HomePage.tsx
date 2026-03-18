import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Mail,
  Unlock,
  EyeOff,
  HandHeart,
  Laptop,
  Scale,
  Users,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { fetchPosts } from "@/lib/api";
import { formatDate, slugify } from "@/lib/format";
import type { Post } from "@/lib/types";
import logo from "@/assets/recoverysky-signature-white.png";

const VALUES = [
  {
    icon: Unlock,
    title: "Accessibility",
    text: "Recovery support should be free and available to everyone, regardless of ability to pay.",
  },
  {
    icon: EyeOff,
    title: "Anonymity & Privacy",
    text: "We protect user privacy and respect the traditions of recovery programs.",
  },
  {
    icon: HandHeart,
    title: "Respect for Recovery Programs",
    text: "We support, not replace, existing recovery fellowships and their traditions.",
  },
  {
    icon: Laptop,
    title: "Technology for Good",
    text: "We use technology to reduce barriers to recovery, not create new ones.",
  },
  {
    icon: Scale,
    title: "Honesty & Transparency",
    text: "We operate with integrity in all we do.",
  },
  {
    icon: Users,
    title: "Community",
    text: "Recovery happens in connection with others; we foster community, not isolation.",
  },
];

export function HomePage() {
  const { hash } = useLocation();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  useEffect(() => {
    fetchPosts({
      sortOrder: "desc",
      pageSize: 3,
      currentPage: 1,
      searchQuery: "",
      selectedTag: null,
    })
      .then(({ posts }) => setRecentPosts(posts))
      .catch(() => {});
  }, []);

  return (
    <div>
      <Helmet>
        <title>RecoverySky — Find Your Pink Cloud</title>
        <meta name="description" content="RecoverySky empowers individuals in recovery by providing free, accessible technology to connect them with meetings, community, and support." />
        <meta property="og:title" content="RecoverySky — Find Your Pink Cloud" />
        <meta property="og:description" content="Free recovery technology connecting people with meetings, community, and support." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero */}
      <section className="relative py-24 sm:py-32">
        <div className="container mx-auto px-4 text-center">
          <img src={logo} alt="RecoverySky" className="h-32 sm:h-40 w-auto mx-auto mb-8" />
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(to right, #c30a68, #f472b6, #7dd3fc, #26619c)" }}
            >
              Find Your Pink Cloud
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Empowering individuals in recovery by providing free, accessible
            technology to connect them with meetings, community, and support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand text-white font-semibold rounded-lg border-2 border-neon shadow-[0_0_20px_#ff2d9570] hover:shadow-[0_0_35px_#ff2d95a0] transition-all"
            >
              Read Our Blog
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent/25 text-gray-100 font-semibold rounded-lg border-2 border-accent-dark hover:border-accent-light hover:shadow-[0_0_30px_#26619ca0] transition-all"
            >
              Get In Touch
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-accent/30 border-2 border-accent-dark rounded-2xl p-8 sm:p-10 shadow-[0_0_20px_#26619c70]">
              <h2 className="text-3xl font-bold text-gray-100 mb-4">Mission</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                RecoverySky empowers individuals in recovery by providing free,
                accessible technology to connect them with meetings, community,
                and support.
              </p>
            </div>
            <div className="bg-accent/30 border-2 border-accent-dark rounded-2xl p-8 sm:p-10 shadow-[0_0_20px_#26619c70]">
              <h2 className="text-3xl font-bold text-gray-100 mb-4">Vision</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                A world where everyone seeking recovery has immediate access to
                the support they need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-accent/30 border-2 border-neon rounded-2xl p-8 sm:p-12 shadow-[0_0_25px_#ff2d9560]">
            <h2 className="text-3xl font-bold text-gray-100 mb-6 text-center">Who We Are</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              RecoverySky, Inc. is a Missouri 501(c)(3) nonprofit corporation
              governed by a board of three women — two of whom are in long-term
              recovery with over 16 years of sobriety. This isn't an organization
              built from the outside looking in. Our leadership lives and breathes
              recovery, and that lived experience drives every decision we make.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-100 mb-4 text-center">Our Values</h2>
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            The principles that guide everything we build and every decision we make.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-accent/30 border-2 border-accent-dark rounded-xl p-8 shadow-[0_0_20px_#26619c70] hover:border-accent-light hover:shadow-[0_0_35px_#26619ca0] transition-all"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-brand-light" />
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-3">{title}</h3>
                <p className="text-gray-300 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      {recentPosts.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-100 mb-4 text-center">Latest from the Blog</h2>
            <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
              Insights, updates, and stories from our team.
            </p>
            <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}/${slugify(post.title)}`}
                  className="group w-full md:w-[calc(33.333%-1rem)] bg-accent/30 border-2 border-accent-dark rounded-xl overflow-hidden shadow-[0_0_20px_#26619c70] hover:border-accent-light hover:shadow-[0_0_35px_#26619ca0] transition-all"
                >
                  {post.featured_image && (
                    <img
                      src={`/api/assets/${post.featured_image}?width=600&height=300&fit=cover`}
                      alt={post.title}
                      className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-100 group-hover:text-brand-light transition-colors mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-300 line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDate(post.written_date || post.date_created)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact / CTA */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-accent/30 border-2 border-neon rounded-2xl p-8 sm:p-12 shadow-[0_0_25px_#ff2d9560] text-center">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">Ready to Get Started?</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
              Whether you're seeking support, exploring partnerships, or want to
              learn more about what we do — we'd love to hear from you.
            </p>
            <a
              href="mailto:hello@recoverysky.org"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand text-white font-semibold rounded-lg border-2 border-neon shadow-[0_0_20px_#ff2d9570] hover:shadow-[0_0_35px_#ff2d95a0] transition-all"
            >
              <Mail className="w-5 h-5" />
              Contact Us
            </a>
            <address className="mt-8 not-italic text-gray-400 text-sm leading-relaxed">
              RecoverySky Inc.<br />
              PO Box 884<br />
              Republic, MO 65738
            </address>
          </div>
        </div>
      </section>
    </div>
  );
}
