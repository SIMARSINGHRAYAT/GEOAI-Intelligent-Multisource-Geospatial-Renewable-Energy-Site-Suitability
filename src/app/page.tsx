import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid-tech relative min-h-screen overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute -left-24 top-10 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />

      <section className="glass relative mx-auto mt-12 w-full max-w-5xl rounded-3xl p-8 md:p-14">
        <p className="text-sm tracking-[0.22em] text-cyan-200/90">GEORENEW AI</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
          GeoRenew AI — Intelligent Multisource Geospatial Renewable Energy Site Suitability
          and Decision Support Platform
        </h1>
        <p className="mt-4 text-lg text-zinc-200/90">
          Intelligent Geospatial Discovery for a Sustainable Energy Future.
        </p>
        <p className="mt-6 max-w-3xl text-zinc-300">
          Discover where solar, wind, geothermal, and hydropower projects are most viable using
          satellite-derived climate datasets, terrain-aware geospatial processing, deterministic
          suitability modeling, and transparent scientific assumptions.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
          >
            Get Started
          </Link>
          <a
            href="/api/v1/data/sources"
            className="rounded-xl border border-zinc-400/30 bg-zinc-900/40 px-6 py-3 text-sm text-zinc-100"
          >
            View Data Sources
          </a>
        </div>
      </section>
    </main>
  );
}
