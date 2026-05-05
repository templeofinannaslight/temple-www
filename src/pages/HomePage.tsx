import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { fetchPosts } from "@/lib/api";
import { formatDate, slugify } from "@/lib/format";
import type { Post } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

const MISSION_QUOTES = [
  {
    text: "Something I've been adamant about since the inception of this temple, even when it was the old temple, was making sure that all of 𒀭Inanna's people, and indeed, all of the Anunna's people, are not just welcome here, but that they all feel welcome here.",
    attribution: "Entu Siri Ninkurgarra",
  },
  {
    text: "My calling in life is helping others to come to know and find 𒀭Inanna, and helping them along their own journey to becoming their best and most authentic selves.",
    attribution: "Entu Siri Ninkurgarra",
  },
];

const VISION_QUOTES = [
  {
    text: "My goal in creating this place was to capture the essence of the temple district of Uruk during the earliest era of Sumer when 𒀭Inanna's temple was providing a wonderful life for everyone there and recreate it here today.",
    attribution: "Entu Siri Ninkurgarra",
  },
  {
    text: "My focus from the beginning has been on a dedication to ensure the Ethos and Mythos of 𒀭Inanna remains secure and uncorrupted, while at the same time doing everything in my power to help people find and come to know 𒀭Inanna personally so that they may forge a lasting meaningful spiritual relationship with Her… My goals are helping as many people as I can to know and bond with 𒀭Inanna.",
    attribution: "Entu Siri Ninkurgarra",
  },
  {
    text: "If our revived religion persists past the deaths of our current clergy then I will be extremely happy and I will know that I did what was asked of me and then some… because I have witnessed so many find peace and comfort and healing and hope through the works we here have produced, and most of all because so many have successfully forged devotional relationships with 𒀭Inanna through these works, I am satisfied.",
    attribution: "Entu Siri Ninkurgarra",
  },
];

const WHO_WE_ARE_QUOTES = [
  {
    text: "Our religion is Ishtaritism, which is a sect of the religion Anunna-Umun, which is also known academically as 'Mesopotamian Polytheistic Paganism'… Our Temple takes a firmly Revivalist approach, but we draw heavily from original source materials from Sumero-Akkad. Our official designation is 'Reconstructionist-Inspired Revivalist'.",
    attribution: "Entu Siri Ninkurgarra",
  },
  {
    text: "At our heart, we are a space focused on furthering worship of 𒀭Inanna/𒀭Ištar. All that the titles show is people who has committed to serve her in the temple in one way or another. Temple is not something to be roleplayed — this attempts to be a sacred space for furthering one's connection with 𒀭Inanna, and create a community around our principles.",
    attribution: "Entu Meadow",
  },
  {
    text: "We set out to create a welcoming space for all people, not just trans followers of 𒀭Inanna — that you got something from your time here is a bonus to us.",
    attribution: "Entu Meadow",
  },
  {
    text: "We are specifically pro queer, pro woman, pro trans here, like our understanding of 𒀭Inanna is — that's the framework anyone that comes here needs to adapt to.",
    attribution: "Entu Meadow",
  },
  {
    text: "Despite my roles and status as a member of clergy, I am your equal, not your superior. I will always extend a hand in friendship, freely offer and accept hugs, and look upon you with a level eye. ☺️",
    attribution: "Entu Siri Ninkurgarra",
  },
];

const VALUES = [
  {
    icon: "🌱",
    title: "All Life Is Sacred",
    text: "𒀭Inanna decrees that we must live life to the fullest and defend life fervently.",
  },
  {
    icon: "💞",
    title: "All Love Is Love, And All Love Is Sacred",
    text: "𒀭Inanna decrees that love takes many forms and that all are valid and sacred.",
  },
  {
    icon: "🛡️",
    title: "Bodily Autonomy Is Inviolable",
    text: "𒀭Inanna decrees that all individuals are to be free of external control over their bodies.",
  },
  {
    icon: "🦋",
    title: "Gender Must Be Free, And All Genders Are Sacred",
    text: "𒀭Inanna decrees that Gender Identity is to be freely explored, and Gender Transition and Sex Change are to be celebrated and respected.",
  },
  {
    icon: "🔥",
    title: "Sexuality Is Sacred, And Consent Is Mandatory",
    text: "𒀭Inanna decrees that Sex and Sexuality are to be celebrated, not admonished or restricted. Sexwork is honorable work — Sex is Sacred, consent is mandatory.",
  },
  {
    icon: "⚖️",
    title: "Justice Must Be Restorative, Not Punitive",
    text: "𒀭Inanna decrees that all victims deserve Justice and all wrongs demand righting.",
  },
  {
    icon: "🌟",
    title: "Humility And Pride Are Both Vitally Necessary",
    text: "𒀭Inanna decrees that Humility and Pride are to be the tools, and Authenticity is to be the goal of all peoples.",
  },
  {
    icon: "🪞",
    title: "Authenticity Above All",
    text: "𒀭Inanna is the Prime Trans Woman, and so it is that Authenticity is incredibly important to her — not only for what it meant for her, but for what it has always meant for all of her worshipers, her people.",
  },
  {
    icon: "🤝",
    title: "Integrity, Transparency, and Service",
    text: "I insist on transparency and honesty at every step of leadership. I insist and demand that clergy treat each other with respect, and I forbid attempts to emotionally manipulate each other to attain someone's goals.",
  },
  {
    icon: "❤️",
    title: "Compassion Over Performance",
    text: "I always endeavor to look at whether a person is bearing forth compassion, empathy, and kindness. If they lack those three qualities then they likely aren't going to be afforded a place even if they're using all the right words — and conversely, if someone is bearing forth those qualities but they are using the wrong words then I will be happy to personally teach them the right words.",
  },
];

function QuoteBlock({ text, attribution }: { text: string; attribution: string }) {
  return (
    <blockquote className="border-l-4 border-neon pl-5 sm:pl-6 py-2 my-5">
      <p className="text-gray-200 text-lg leading-relaxed italic">"{text}"</p>
      <footer className="text-sm text-brand-light mt-3 not-italic">
        — {attribution}
      </footer>
    </blockquote>
  );
}

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
        <title>Temple of 𒀭Inanna's Light</title>
        <meta
          name="description"
          content="A sanctuary for 𒀭Inanna's people — rekindling the warmth, safety, and comradery of ancient Uruk's temple complex for all who seek the Goddess's light."
        />
        <meta property="og:title" content="Temple of 𒀭Inanna's Light" />
        <meta
          property="og:description"
          content="A sanctuary for 𒀭Inanna's people — rekindling the light of ancient Uruk for the marginalized, the seeking, and the devoted."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero */}
      <section className="relative py-24 sm:py-32">
        <div className="container mx-auto px-4 text-center">
          <img
            src="/templeofinannaslight-logo.png"
            alt="Temple of Inanna's Light"
            className="h-32 sm:h-40 w-auto mx-auto mb-8"
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #c30a68, #f472b6, #7dd3fc, #26619c)",
              }}
            >
              To rekindle the light of ancient Uruk in the hearts of all 𒀭Inanna's people.
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            A sanctuary where the marginalized, the seeking, and the devoted may
            all stand in Her light together.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand text-white font-semibold rounded-lg border-2 border-neon shadow-[0_0_20px_#ff2d9570] hover:shadow-[0_0_35px_#ff2d95a0] transition-all"
            >
              Temple Sermons
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#values"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent/25 text-gray-100 font-semibold rounded-lg border-2 border-accent-dark hover:border-accent-light hover:shadow-[0_0_30px_#26619ca0] transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Our Values
            </a>
            <a
              href="#join"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand text-white font-semibold rounded-lg border-2 border-neon shadow-[0_0_20px_#ff2d9570] hover:shadow-[0_0_35px_#ff2d95a0] transition-all"
            >
              <Users className="w-5 h-5" />
              Join the Temple
            </a>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-accent/90 border-2 border-accent-dark rounded-2xl p-8 sm:p-12 shadow-[0_0_20px_#26619c70]">
            <div className="text-center mb-10">
              <p className="text-sm uppercase tracking-widest text-brand-light mb-3">🕊️ Mission</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-100">
                To rekindle the light of ancient Uruk in the hearts of all 𒀭Inanna's people.
              </h2>
            </div>
            {MISSION_QUOTES.map((q, i) => (
              <QuoteBlock key={i} {...q} />
            ))}
            <p className="text-gray-300 text-lg leading-relaxed mt-8 pt-8 border-t border-accent-dark/60">
              <span className="font-semibold text-gray-100">In plain words:</span>{" "}
              The Temple of 𒀭Inanna's Light exists to serve 𒀭Inanna and Her
              people — to help every soul who comes to Her find Her, know Her,
              and forge a lasting personal relationship with Her; to revive the
              warmth, safety, and comradery of Her ancient temple complex at
              Unug (Uruk); and to be a sanctuary where the marginalized, the
              seeking, and the devoted may all stand in Her light together.
            </p>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section id="vision" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-accent/90 border-2 border-accent-dark rounded-2xl p-8 sm:p-12 shadow-[0_0_20px_#26619c70]">
            <div className="text-center mb-10">
              <p className="text-sm uppercase tracking-widest text-brand-light mb-3">🌅 Vision</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-100">
                A living temple, faithful to the old ways, alive to the present, kindled for the future.
              </h2>
            </div>
            {VISION_QUOTES.map((q, i) => (
              <QuoteBlock key={i} {...q} />
            ))}
            <p className="text-gray-300 text-lg leading-relaxed mt-8 pt-8 border-t border-accent-dark/60">
              <span className="font-semibold text-gray-100">In plain words:</span>{" "}
              We envision a Temple where the Ethos and Mythos of 𒀭Inanna are
              preserved uncorrupted; where every seeker — devoted or curious,
              new or returning — can build a real, living relationship with the
              Goddess; where peace, healing, and hope flourish through revived
              sacred works; and where the religion endures beyond any one of
              us, carried forward by every heart that has been kindled within
              these walls.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section id="who-we-are" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-accent/90 border-2 border-neon rounded-2xl p-8 sm:p-12 shadow-[0_0_25px_#ff2d9560]">
            <div className="text-center mb-10">
              <p className="text-sm uppercase tracking-widest text-brand-light mb-3">💖 Who We Are</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-100">
                Servants of 𒀭Inanna, sisters and siblings of all who seek Her light.
              </h2>
            </div>
            {WHO_WE_ARE_QUOTES.map((q, i) => (
              <QuoteBlock key={i} {...q} />
            ))}
            <p className="text-gray-300 text-lg leading-relaxed mt-8 pt-8 border-t border-neon/40">
              <span className="font-semibold text-gray-100">In plain words:</span>{" "}
              We are Ishtarites — practitioners of Ishtaritism within the
              broader revived Mesopotamian polytheist tradition (Anunna-Umun).
              We are a Reconstructionist-Inspired Revivalist community, drawing
              on Sumero-Akkadian sources while remaining a living, evolving
              faith. Our clergy — led by Entu Siri Ninkurgarra and Entu Meadow
              — have sworn eternal vows to serve 𒀭Inanna and Her people. We
              are explicitly pro-queer, pro-trans, pro-woman, and pro-everyone
              who comes through our doors with kindness in their heart. We are
              not a stage — we are a sanctuary.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section id="values" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest text-brand-light mb-3">⚖️ Our Values</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-4">
              The Principles of the Ishtarite
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Drawn from the writings of Entu Siri Ninkurgarra — the principles
              that guide our worship, our community, and our service to Her.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {VALUES.map(({ icon, title, text }) => (
              <div
                key={title}
                className="bg-accent/90 border-2 border-accent-dark rounded-xl p-8 shadow-[0_0_20px_#26619c70] hover:border-accent-light hover:shadow-[0_0_35px_#26619ca0] transition-all"
              >
                <div className="w-14 h-14 bg-brand/20 rounded-lg flex items-center justify-center mb-5 text-3xl">
                  <span aria-hidden="true">{icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-3">{title}</h3>
                <p className="text-gray-300 leading-relaxed italic">"{text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      {recentPosts.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-100 mb-4 text-center">
              Latest Temple Sermons
            </h2>
            <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
              Reflections, teachings, and announcements from our clergy and community.
            </p>
            <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}/${slugify(post.title)}`}
                  className="group w-full md:w-[calc(33.333%-1rem)] bg-accent/90 border-2 border-accent-dark rounded-xl overflow-hidden shadow-[0_0_20px_#26619c70] hover:border-accent-light hover:shadow-[0_0_35px_#26619ca0] transition-all"
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

      {/* Closing Banner */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-accent/90 border-2 border-neon rounded-2xl p-10 sm:p-14 shadow-[0_0_25px_#ff2d9560] text-center">
            <p className="text-2xl sm:text-3xl text-gray-100 leading-relaxed font-light italic mb-6">
              "𒀭Inanna understands your struggle, and She wishes you to find
              comfort and safety within Her Temple. You are loved, and you are
              welcome here."
            </p>
            <p className="text-brand-light text-sm">— Entu Siri Ninkurgarra</p>
          </div>
        </div>
      </section>

      {/* Join the Temple */}
      <section id="join" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-accent/90 border-2 border-neon rounded-2xl p-8 sm:p-12 shadow-[0_0_25px_#ff2d9560] text-center">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">Ready to Join Us?</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
              Our community gathers in 𒀭Inanna's light on Discord — a sanctuary
              where seekers, devotees, and clergy walk this path together.
              Whether you are new to the Goddess or a lifelong devotee, you are
              welcome here.
            </p>
            <a
              href="https://discord.com/invite/lightofinanna"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("discord_join_click")}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand text-white font-semibold rounded-lg border-2 border-neon shadow-[0_0_20px_#ff2d9570] hover:shadow-[0_0_35px_#ff2d95a0] transition-all"
            >
              <Users className="w-5 h-5" />
              Join the Temple
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
