const testimonials = [
  {
    quote:
      "Completely transformed how our team ships product. We went from weekly deploys to shipping multiple times a day with total confidence.",
    name: "Priya Nair",
    role: "VP of Engineering",
    company: "Lattice",
    avatar: "PN",
    accent: "#a78bfa",
  },
  {
    quote:
      "I was skeptical. Three months in, I can't imagine going back. It's the first tool I've used that actually gets out of the way.",
    name: "Marcus Cole",
    role: "Founder",
    company: "Beacon",
    avatar: "MC",
    accent: "#34d399",
  },
  {
    quote:
      "The onboarding alone saved us two weeks of eng time. That's not a metric — that's real people doing real work instead of fighting infra.",
    name: "Soo-Jin Park",
    role: "CTO",
    company: "Runday",
    avatar: "SJ",
    accent: "#f472b6",
  },
];

export default function Testimonial() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] flex flex-col items-center justify-center px-6 py-16">
      <p className="text-xs font-bold tracking-[0.25em] uppercase text-zinc-500 mb-4">
        What people are saying
      </p>

      <h2 className="text-4xl font-black text-white text-center leading-tight mb-16 max-w-xs">
        Don&apos;t take{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
          our word
        </span>{" "}
        for it.
      </h2>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 transition-all duration-300 hover:border-zinc-600 hover:-translate-y-0.5"
          >
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at top left, ${t.accent}14 0%, transparent 60%)`,
              }}
            />

            <div
              className="text-5xl font-black leading-none mb-3"
              style={{ color: t.accent + "40" }}
            >
              &ldquo;
            </div>

            <p className="text-zinc-300 text-sm leading-relaxed mb-6">{t.quote}</p>

            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-black flex-shrink-0"
                style={{ background: t.accent }}
              >
                {t.avatar}
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">{t.name}</p>
                <p className="text-zinc-500 text-xs">
                  {t.role} · {t.company}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
