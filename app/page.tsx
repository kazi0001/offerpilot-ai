import DealBrowser from "./DealBrowser";
import NewsletterSignup from "./NewsletterSignup";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* Impact verification text for Target affiliate approval */}
      <div className="bg-white px-6 py-2 text-center text-xs text-slate-500">
        Impact-Site-Verification: 529d4afc-3004-4de0-9508-d143b7eb29d9
      </div>

      {/* Top navigation */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/images/dealsealusa-logo.png"
              alt="DealSealUSA logo"
              className="h-20 w-auto"
            />
          </a>

          <nav className="hidden items-center gap-7 text-base font-bold text-slate-700 md:flex">
            <a href="#deals" className="hover:text-blue-700">
              Deals
            </a>
            <a href="/deals/walmart" className="hover:text-blue-700">
              Walmart
            </a>
            <a href="/deals/target" className="hover:text-blue-700">
              Target
            </a>
            <a href="/deals/amazon" className="hover:text-blue-700">
              Amazon
            </a>
            <a href="/deals/best-buy" className="hover:text-blue-700">
              Best Buy
            </a>
            <a href="#newsletter" className="hover:text-blue-700">
              Newsletter
            </a>
          </nav>

          <a
            href="/admin"
            className="rounded-full bg-blue-600 px-7 py-3 text-base font-black text-white shadow-sm hover:bg-blue-700"
          >
            Admin
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              AI-assisted deal discovery for busy shoppers
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white md:text-6xl">
              Find real deals faster across major retailers.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              DealSeal helps you compare useful deals from Walmart, Target,
              Amazon, Best Buy, Temu, eBay, and more, with price, discount,
              deal score, and retailer details in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#deals"
                className="rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600"
              >
                Browse Deals
              </a>

              <a
                href="#newsletter"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/15"
              >
                Join Newsletter
              </a>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-white">Discover</p>
                <p className="mt-1 text-sm text-slate-400">
                  Curated deals from major retailers
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-white">Compare</p>
                <p className="mt-1 text-sm text-slate-400">
                  Price, discount, score, and retailer
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-white">Verify</p>
                <p className="mt-1 text-sm text-slate-400">
                  Check details before you buy
                </p>
              </div>
            </div>
          </div>

          {/* Right hero card */}
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="rounded-3xl bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    Today&apos;s Deal Snapshot
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    Smarter shopping view
                  </h2>
                </div>

                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  Live MVP
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">
                    Best for
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    Clearance, household, tech, and everyday essentials
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      Compare
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      Prices and scores
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase text-amber-700">
                      Trust
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      Retailer verified
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-600">
                    DealSeal helps shoppers quickly review deal quality,
                    compare alternatives, and verify the final offer on the
                    retailer website before purchasing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main deals area */}
      <section id="deals" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-600">
                Deal marketplace
              </p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                Browse, filter, and compare deals
              </h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Use retailer tabs, category filters, deal scores, and comparison
                tools to quickly identify the most useful offers.
              </p>
            </div>

            <a
              href="#newsletter"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-100"
            >
              Get weekly deals
            </a>
          </div>

          {/* Retailer quick links */}
          <div className="mb-8 rounded-3xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Shop by retailer
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/deals/walmart"
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Walmart Deals
              </a>

              <a
                href="/deals/target"
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Target Deals
              </a>

              <a
                href="/deals/amazon"
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Amazon Deals
              </a>

              <a
                href="/deals/best-buy"
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Best Buy Deals
              </a>

              <a
                href="/deals/temu"
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Temu Deals
              </a>

              <a
                href="/deals/ebay"
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                eBay Deals
              </a>

              <a
                href="/deals/demo-store"
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Demo Store
              </a>
            </div>
          </div>

          {/* Category quick links */}
          <div className="mb-8 rounded-3xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Shop by category
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/category/clearance"
                className="rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-500"
              >
                Clearance
              </a>

              <a
                href="/category/electronics"
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Electronics
              </a>

              <a
                href="/category/household-essentials"
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Household Essentials
              </a>

              <a
                href="/category/manual-imports"
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Manual Imports
              </a>

              <a
                href="/category/all-demo-products"
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Demo Products
              </a>
            </div>
          </div>

          <DealBrowser />

          <div id="newsletter">
            <NewsletterSignup />
          </div>

          <section id="why" className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-700">
                1
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Curated, not cluttered
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                DealSeal focuses on useful offers, not endless noise. Deals can
                be reviewed before they appear publicly.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-black text-emerald-700">
                2
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Easy comparison
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select multiple products and compare price, discount, retailer,
                category, and deal score in one view.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl font-black text-amber-700">
                3
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Built for trust
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Every published deal is reviewed, scored, and linked back to the
                original retailer so users can verify price and availability
                before purchasing.
              </p>
            </div>
          </section>

          <div className="mt-10 rounded-3xl bg-white p-6 text-sm leading-6 text-slate-500 shadow-sm">
            <p>
              <strong className="text-slate-700">Disclosure:</strong> DealSeal
              may earn a commission when you purchase through affiliate links,
              at no additional cost to you. Prices and availability can change.
              Always verify details on the retailer website.
            </p>
          </div>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500">
            <div>
              <p>© {new Date().getFullYear()} DealSeal. All rights reserved.</p>

              <p className="mt-3 text-xs text-slate-400">
                Impact-Site-Verification: 529d4afc-3004-4de0-9508-d143b7eb29d9
              </p>
            </div>

            <div className="flex gap-4">
              <a href="#deals" className="hover:text-slate-900">
                Deals
              </a>
              <a href="#newsletter" className="hover:text-slate-900">
                Newsletter
              </a>
              <a href="/admin" className="hover:text-slate-900">
                Admin
              </a>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}