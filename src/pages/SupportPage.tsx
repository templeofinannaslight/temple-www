import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Mail, ChevronDown, ChevronUp } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const FAQS = [
  {
    question: "I am an old app user and all my attendance records are gone.",
    answer:
      "This is caused by one of two things.  Either you logged into the new app using a different email account than you did with the original app, or you failed to perform the onboarding and import attendance.  Please contact support.",
  },
  {
    question:
      "I can't remember which email account I used with the original app.",
    answer: "This is very easy to resolve.  Please contact support.",
  },
  {
    question:
      "Can you export all attendance records from the old app into a PDF?",
    answer: "Yes, this is a trivial task.  Please contact support",
  },
  {
    question: "Is RecoverySky really free?",
    answer:
      "Yes — 100% free, no hidden fees, no premium tiers, no ads. RecoverySky is a 501(c)(3) nonprofit. Our mission is to remove barriers to recovery, not create new ones.",
  },
  {
    question: "Is RecoverySky affiliated with AA, NA, or any fellowship?",
    answer:
      "No. RecoverySky is an independent nonprofit. We support and complement existing recovery fellowships but are not affiliated with, endorsed by, or a replacement for any program.",
  },
  {
    question: "Does RecoverySky host the meetings it provides access to?",
    answer:
      "No. RecoverySky is not associated with any meetings and does not provide technical services for any of them.  Meetings are independant, publically hosted Zoom events.",
  },
  {
    question: "Is my information private?",
    answer:
      "Absolutely. We respect the traditions of recovery programs and take privacy seriously. We don't sell data, don't run ads, and don't track you. Anonymous access means exactly that — anonymous.",
  },
  {
    question: "What meetings and fellowships are supported?",
    answer:
      "RecoverySky connects you to live AA, NA, and other recovery fellowship meetings. We aggregate meetings from multiple sources so you can find what works for you.",
  },
  {
    question: "How does attendance reporting work?",
    answer:
      "After attending a meeting, you can log it in the app. When you're ready, send a report directly to your sponsor, counselor, or probation officer via email — on your terms, from your device.",
  },
  {
    question: "What platforms is the app available on?",
    answer:
      "RecoverySky is available on iOS, Android, and as a web app in any browser. Your experience is the same across all platforms.",
  },
  {
    question: "I found a bug or have a feature request. How do I report it?",
    answer:
      "Email us at support@recoverysky.app with a description of the issue or idea. If you're technical, you can also open an issue on our GitHub repository.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-accent/40 backdrop-blur-md border-2 border-accent-dark rounded-xl overflow-hidden transition-all hover:border-accent-light">
      <button
        onClick={() => {
          if (!open) trackEvent("faq_open", { question });
          setOpen(!open);
        }}
        className="w-full flex items-center justify-between gap-4 p-6 text-left"
      >
        <span className="text-lg font-semibold text-gray-100">{question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-brand-light shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-6 -mt-2">
          <p className="text-gray-300 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export function SupportPage() {
  return (
    <div>
      <Helmet>
        <title>Support — RecoverySky</title>
        <meta
          name="description"
          content="Get help with RecoverySky. Browse frequently asked questions or contact our support team directly."
        />
        <meta property="og:title" content="Support — RecoverySky" />
        <meta
          property="og:description"
          content="Get help with RecoverySky. Browse FAQs or contact our support team."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #c30a68, #f472b6, #7dd3fc, #26619c)",
              }}
            >
              Support
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            We're here to help. Browse our FAQ or reach out directly.
          </p>
        </div>
      </section>

      {/* Email Support */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-accent/40 backdrop-blur-md border-2 border-neon rounded-2xl p-8 sm:p-12 shadow-[0_0_25px_#ff2d9560] text-center">
            <div className="w-16 h-16 bg-brand/20 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-brand-light" />
            </div>
            <h2 className="text-3xl font-bold text-gray-100 mb-4">
              Contact Support
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
              Can't find what you're looking for? Our team is happy to help.
              Send us an email and we'll get back to you as soon as possible.
            </p>
            <a
              href="mailto:support@recoverysky.app"
              onClick={() => trackEvent("support_email_click")}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand text-white font-semibold rounded-lg border-2 border-neon shadow-[0_0_20px_#ff2d9570] hover:shadow-[0_0_35px_#ff2d95a0] transition-all"
            >
              <Mail className="w-5 h-5" />
              support@recoverysky.app
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-100 mb-4 text-center">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
              Quick answers to the most common questions about RecoverySky.
            </p>
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <FAQItem key={faq.question} {...faq} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
