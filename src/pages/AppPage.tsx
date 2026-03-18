import { Helmet } from "react-helmet-async";
import { Video, ClipboardCheck, Bell, Smartphone, Monitor, Globe, ArrowRight } from "lucide-react";
import logo from "@/assets/recoverysky-signature-white.png";

const FEATURES = [
  {
    icon: Video,
    title: "Instant Live Meetings",
    description:
      "Join recovery meetings happening right now with a single tap. No account required — continue anonymously and get connected to live AA, NA, and other fellowship meetings in seconds.",
    screenshots: ["/app-screenshots/app-auth.png", "/app-screenshots/live.png", "/app-screenshots/schedule.png"],
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Reporting",
    description:
      "Track your meeting attendance and send reports directly to your sponsor, counselor, or probation officer via email. Simple, private, and on your terms.",
    screenshots: ["/app-screenshots/attendance.png"],
  },
  {
    icon: Bell,
    title: "Meeting Reminder Notifications",
    description:
      "Never miss a meeting again. Set personalized reminders for your favorite meetings — completely free, no subscription required.",
    screenshots: ["/app-screenshots/meetings.png"],
  },
];

const PLATFORMS = [
  {
    icon: Smartphone,
    label: "iOS",
    description: "iPhone & iPad",
    url: "#", // TODO: App Store link
    buttonText: "App Store",
  },
  {
    icon: Smartphone,
    label: "Android",
    description: "Phone & Tablet",
    url: "#", // TODO: Google Play link
    buttonText: "Google Play",
  },
  {
    icon: Monitor,
    label: "Web App",
    description: "Any browser",
    url: "#", // TODO: Web app URL
    buttonText: "Open Web App",
  },
];

export function AppPage() {
  return (
    <div>
      <Helmet>
        <title>The Recovery App — RecoverySky</title>
        <meta name="description" content="Find live recovery meetings, track attendance, and get reminders — all from one free app. Available on iOS, Android, and web." />
        <meta property="og:title" content="The Recovery App — RecoverySky" />
        <meta property="og:description" content="Free recovery app for live meetings, attendance tracking, and meeting reminders." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero */}
      <section className="relative py-24 sm:py-32">
        <div className="container mx-auto px-4 text-center">
          <img src={logo} alt="RecoverySky" className="h-24 sm:h-32 w-auto mx-auto mb-8" />
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(to right, #c30a68, #f472b6, #7dd3fc, #26619c)" }}
            >
              The Recovery App
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Find live meetings, track attendance, and stay connected to your
            recovery community — all from one free app.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#download"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand text-white font-semibold rounded-lg border-2 border-neon shadow-[0_0_20px_#ff2d9570] hover:shadow-[0_0_35px_#ff2d95a0] transition-all"
            >
              Download Now
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Anonymous Access Highlight */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-accent/30 border-2 border-neon rounded-2xl p-8 sm:p-12 shadow-[0_0_25px_#ff2d9560]">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex gap-4 justify-center shrink-0">
                <img
                  src="/app-screenshots/app-auth.png"
                  alt="Anonymous login"
                  className="w-48 rounded-2xl border-2 border-accent-dark shadow-[0_0_20px_#26619c70]"
                />
                <img
                  src="/app-screenshots/zoom-auth.png"
                  alt="Zoom connection"
                  className="w-48 rounded-2xl border-2 border-accent-dark shadow-[0_0_20px_#26619c70]"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">No Account? No Problem.</h2>
                <p className="text-gray-200 text-lg leading-relaxed mb-4">
                  Continue anonymously with full access to live meetings. No email,
                  no signup, no barriers. Just tap and join.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  When you're ready, optionally connect your Zoom account to join
                  meetings directly from the app — or create a free account to
                  unlock attendance tracking and cloud sync.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      {FEATURES.map(({ icon: Icon, title, description, screenshots }, idx) => (
        <section key={title} className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className={`flex flex-col ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-10`}>
                <div className="flex gap-4 justify-center shrink-0">
                  {screenshots.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt={title}
                      className="w-48 rounded-2xl border-2 border-accent-dark shadow-[0_0_20px_#26619c70]"
                    />
                  ))}
                </div>
                <div>
                  <div className="w-14 h-14 bg-brand/20 rounded-xl flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7 text-brand-light" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
                  <p className="text-gray-200 text-lg leading-relaxed">{description}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* More Screenshots Gallery */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">See It In Action</h2>
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Built for recovery, designed for simplicity.
          </p>
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
            {[
              "/app-screenshots/live.png",
              "/app-screenshots/schedule.png",
              "/app-screenshots/meetings.png",
              "/app-screenshots/attendance.png",
              "/app-screenshots/import.png",
            ].map((src) => (
              <img
                key={src}
                src={src}
                alt="App screenshot"
                className="w-44 sm:w-52 rounded-2xl border-2 border-accent-dark shadow-[0_0_20px_#26619c70] hover:border-accent-light hover:shadow-[0_0_35px_#26619ca0] transition-all"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Download / Platforms */}
      <section id="download" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Get the App</h2>
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Available on every platform. Always free.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {PLATFORMS.map(({ icon: Icon, label, description, url, buttonText }) => (
              <a
                key={label}
                href={url}
                className="bg-accent/30 border-2 border-accent-dark rounded-xl p-8 text-center shadow-[0_0_20px_#26619c70] hover:border-accent-light hover:shadow-[0_0_35px_#26619ca0] transition-all block"
              >
                <Icon className="w-10 h-10 text-brand-light mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-1">{label}</h3>
                <p className="text-gray-400 text-sm mb-5">{description}</p>
                <span className="inline-flex items-center gap-2 px-6 py-2 bg-brand text-white text-sm font-semibold rounded-lg border-2 border-neon shadow-[0_0_15px_#ff2d9550]">
                  {buttonText}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Globe icon for web */}
      <section className="py-10 pb-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 bg-accent/20 border-2 border-accent-dark rounded-full px-6 py-3">
            <Globe className="w-5 h-5 text-brand-light" />
            <span className="text-gray-300 text-sm">
              Open source on{" "}
              <a
                href="https://github.com/recoverysky-org/recoverysky-app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-light hover:text-white transition-colors underline"
              >
                GitHub
              </a>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
