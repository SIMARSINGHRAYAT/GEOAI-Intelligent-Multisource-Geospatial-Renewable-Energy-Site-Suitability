import Link from "next/link";

export default function HomePage() {
  const energyFeatures = [
    {
      title: "Solar Photovoltaic",
      icon: "☀️",
      accent: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300",
      description: "Surface irradiance (GHI, DNI) from NASA POWER with slope and thermal derating modeling.",
    },
    {
      title: "Wind Turbines",
      icon: "💨",
      accent: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300",
      description: "10-meter boundary layer wind velocities, air density correction, and terrain roughness analysis.",
    },
    {
      title: "Run-of-River Hydro",
      icon: "🌊",
      accent: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-300",
      description: "Catchment runoff proxy, precipitation trends, and topographic head drop calculation.",
    },
    {
      title: "Geothermal Potential",
      icon: "🌋",
      accent: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-300",
      description: "Geological proxy scoring, fault proximity, and exploratory screening metrics.",
    },
  ];

  return (
    <main className="grid-tech relative min-h-screen overflow-x-hidden px-6 py-10 flex flex-col justify-between">
      {/* Dynamic ambient lights */}
      <div className="pointer-events-none absolute -left-20 top-10 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/4 h-[32rem] w-[32rem] rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

      {/* Navigation Header */}
      <header className="relative mx-auto w-full max-w-6xl flex items-center justify-between pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 font-bold text-white shadow-lg shadow-cyan-500/25">
            G
          </span>
          <span className="font-bold tracking-tight text-white text-lg">GeoRenew AI</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Vercel Deployment Ready
          </span>
          <Link
            href="/dashboard"
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-95 px-4 py-2 font-semibold text-white shadow-md shadow-cyan-900/30 transition"
          >
            Launch Platform &rarr;
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="glass relative mx-auto my-10 w-full max-w-6xl rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/50 px-3.5 py-1 text-xs font-mono text-cyan-300 mb-6">
          <span>🛰️ MULTISOURCE GEOSPATIAL INTELLIGENCE PLATFORM</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
          Intelligent Multisource Geospatial Renewable Energy Site Suitability
        </h1>

        <p className="mt-4 text-base sm:text-xl text-zinc-300 font-light max-w-3xl">
          Discover optimal sites for solar, wind, geothermal, and hydropower deployment with satellite-derived climatology, terrain analysis, and machine learning models.
        </p>

        {/* Feature Badges Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {energyFeatures.map((feat) => (
            <div
              key={feat.title}
              className={`rounded-2xl border p-4.5 bg-gradient-to-b ${feat.accent} backdrop-blur-sm transition-transform hover:-translate-y-1`}
            >
              <div className="text-2xl mb-2">{feat.icon}</div>
              <h3 className="font-bold text-sm text-white">{feat.title}</h3>
              <p className="text-xs text-zinc-300/80 mt-1 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>

        {/* Key Metrics row */}
        <div className="mt-10 pt-8 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3">
            <span className="block text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">100%</span>
            <span className="text-xs text-zinc-400 mt-0.5 block">Vercel Serverless Ready</span>
          </div>
          <div className="p-3">
            <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">4 Energies</span>
            <span className="text-xs text-zinc-400 mt-0.5 block">Solar, Wind, Hydro, Geo</span>
          </div>
          <div className="p-3">
            <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">Global</span>
            <span className="text-xs text-zinc-400 mt-0.5 block">NASA & Open-Meteo Data</span>
          </div>
          <div className="p-3">
            <span className="block text-2xl sm:text-3xl font-extrabold text-violet-400 font-mono">Zero-Config</span>
            <span className="text-xs text-zinc-400 mt-0.5 block">Works with/without DB</span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-cyan-500/20 transition hover:scale-105 active:scale-95"
          >
            Launch Interactive Dashboard &rarr;
          </Link>
          <a
            href="/api/v1/data/sources"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 px-6 py-3.5 text-sm font-medium text-zinc-200 transition"
          >
            Scientific Data Provenance API
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mx-auto w-full max-w-6xl pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
        <p>© GeoRenew AI Platform — Intelligent Geospatial Renewable Energy Assessment</p>
        <div className="flex items-center gap-4 text-zinc-400">
          <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
          <a href="/api/v1/health" target="_blank" rel="noreferrer" className="hover:text-white transition">API Health</a>
          <a href="/api/v1/data/sources" target="_blank" rel="noreferrer" className="hover:text-white transition">Sources</a>
        </div>
      </footer>
    </main>
  );
}
