import DealBrowser from "./DealBrowser";
import NewsletterSignup from "./NewsletterSignup";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              DealSeal
            </p>

            <a
              href="/admin"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Admin
            </a>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Useful deals, ranked with intelligence
            </p>

            <h1 className="mb-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Find practical deals from Walmart, Target, Amazon, and more in one
              place.
            </h1>

            <p className="max-w-2xl text-lg text-slate-600">
              DealSeal helps busy shoppers discover, compare, and save useful
              deals without searching multiple retailer websites.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Featured Deals
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search, filter, compare, and sort approved deals.
            </p>
          </div>

          <a
            href="#newsletter"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Get weekly deals
          </a>
        </div>

        <DealBrowser />

        <div id="newsletter">
          <NewsletterSignup />
        </div>

        <div className="mt-10 rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Disclosure: DealSeal may earn a commission when you purchase through
          affiliate links, at no additional cost to you. Prices and availability
          can change. Always verify details on the retailer website.
        </div>
      </section>
    </main>
  );
}