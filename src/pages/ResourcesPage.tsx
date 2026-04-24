import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { BookOpen, ExternalLink } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface Resource {
  label: string;
  url: string;
}

const NA_RESOURCES: Resource[] = [
  { label: "Just For Today", url: "https://www.jftna.org/jft/" },
  { label: "SPAD", url: "https://www.spadna.org" },
  { label: "Basic Text", url: "http://capeatlanticna.org/wp-content/uploads/2013/04/Basic-Text.pdf" },
  { label: "Basic Text Audio", url: "http://www.nauca.us/outreach-additional-needs/6th-edition-basic-text-audio/" },
  { label: "It Works", url: "http://capeatlanticna.org/wp-content/uploads/2013/04/It-Works.pdf" },
  { label: "It Works Audio", url: "http://www.nauca.us/outreach-additional-needs/it-works-how-why/" },
  { label: "White Booklet", url: "https://orangecountyna.org/ocwp/wp-content/uploads/2020/05/NA-White-Booklet.pdf" },
  { label: "Miracles Happen", url: "https://www.na-northernireland.org/wp-content/uploads/2020/04/miracles-happen.pdf" },
  { label: "Guiding Principles", url: "https://cwpascna.com/wp-content/uploads/2020/06/na-guiding-principles-spirit-of-our-traditions.pdf" },
  { label: "Living Clean", url: "http://capeatlanticna.org/wp-content/uploads/2013/04/Living-Clean.pdf" },
  { label: "Times Of Illness", url: "http://www.nauca.us/wp-content/uploads/2020/07/1992-In-Times-of-Illness.pdf" },
  { label: "Step Working Guide", url: "https://gssana.org/books/na-step-working-guide.pdf" },
  { label: "A Spiritual Principle A Day", url: "https://www.marscna.org/wp-content/uploads/2022/01/SPAD-ApprovalDraft_Jan22_1_WEB.pdf" },
  { label: "Information Pamphlets", url: "https://m.na.org/?ID=ips-eng-index" },
  { label: "Grey Book", url: "http://www.nauca.us/wp-content/uploads/2015/05/1981-02-NA-Basic-Text-Review-Form-Grey-Book-.pdf" },
  { label: "Grey Book Audio", url: "http://www.nauca.us/outreach-additional-needs/grey-book-on-audio/" },
  { label: "Behind The Walls", url: "https://orangecountyna.org/ocwp/wp-content/uploads/2020/05/BEHIND-THE-WALLS.pdf" },
];

const AA_RESOURCES: Resource[] = [
  { label: "Daily Reflections", url: "https://www.aa.org/daily-reflections" },
  { label: "Big Book", url: "https://12step.org/docs/BigBook.pdf" },
  { label: "Personal Stories", url: "https://recoverydaily.com/stories.htm" },
  { label: "Big Book Audio", url: "https://laurelrecovery.org/aa-resources/audio-big-book/" },
  { label: "Bob & Oldtimers", url: "https://aamo.info/upload/AABOB_Oldtimers_E.PDF" },
  { label: "Came To Believe", url: "http://www.aaonlinemeeting.net/uploads/7/9/4/4/79446362/came_to_believe.pdf" },
  { label: "12 & 12", url: "https://aa-netherlands.org/twelve-steps-and-twelve-traditions/" },
  { label: "Living Sober", url: "https://www.8n8aa.com/wp-content/uploads/2020/06/Living-Sober.pdf" },
  { label: "12 Step Questions", url: "https://12step.org/docs/12step_questions.pdf" },

];

type Tab = "aa" | "na";

function ResourceCard({ label, url, fellowship }: Resource & { fellowship: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("resource_click", { fellowship, label, url })}
      className="group flex items-center justify-between gap-3 bg-accent/20 border-2 border-accent-dark rounded-xl px-5 py-4 shadow-[0_0_15px_#26619c40] hover:border-accent-light hover:shadow-[0_0_25px_#26619c80] transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <BookOpen className="w-4 h-4 text-brand-light shrink-0" />
        <span className="text-gray-100 font-medium truncate">{label}</span>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-brand-light shrink-0 transition-colors" />
    </a>
  );
}

export function ResourcesPage() {
  const [tab, setTab] = useState<Tab>("aa");

  const resources = tab === "aa" ? AA_RESOURCES : NA_RESOURCES;
  const heading = tab === "aa" ? "Alcoholics Anonymous" : "Narcotics Anonymous";
  const description =
    tab === "aa"
      ? "Literature and resources from the AA fellowship."
      : "Literature and resources from the NA fellowship.";

  return (
    <div>
      <Helmet>
        <title>Resources — RecoverySky</title>
        <meta
          name="description"
          content="Free online recovery literature and resources for AA and NA fellowships."
        />
        <meta property="og:title" content="Resources — RecoverySky" />
        <meta
          property="og:description"
          content="Free online recovery literature and resources for AA and NA."
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
              Resources
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Free online recovery literature for AA and NA fellowships.
          </p>
        </div>
      </section>

      {/* Tabs + Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Tab Switcher */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-accent/20 border-2 border-accent-dark rounded-xl p-1">
                <button
                  onClick={() => {
                    setTab("aa");
                    trackEvent("resources_tab", { fellowship: "aa" });
                  }}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    tab === "aa"
                      ? "bg-brand text-white border-2 border-neon shadow-[0_0_15px_#ff2d9550]"
                      : "text-gray-300 hover:text-white border-2 border-transparent"
                  }`}
                >
                  AA Literature
                </button>
                <button
                  onClick={() => {
                    setTab("na");
                    trackEvent("resources_tab", { fellowship: "na" });
                  }}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    tab === "na"
                      ? "bg-brand text-white border-2 border-neon shadow-[0_0_15px_#ff2d9550]"
                      : "text-gray-300 hover:text-white border-2 border-transparent"
                  }`}
                >
                  NA Literature
                </button>
              </div>
            </div>

            {/* Section Heading */}
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              {heading}
            </h2>
            <p className="text-white text-center mb-10">{description}</p>

            {/* Resource Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resources.map((resource) => (
                <ResourceCard key={resource.url} {...resource} fellowship={tab} />
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-white text-sm text-center mt-12 max-w-2xl mx-auto">
              RecoverySky is not affiliated with AA, NA, or any fellowship.
              These links are provided as a convenience and point to
              publicly available resources hosted by third parties.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
