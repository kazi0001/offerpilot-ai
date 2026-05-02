import DealBrowser from "./DealBrowser";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              DealSense
            </p>

            <a
              href="/admin"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Admin
            </a>
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
            The best useful deals from Walmart, Target, and Amazon in one place.
          </h1>

          <p className="max-w-2xl text-lg text-slate-600">
            DealSense ranks and summarizes current offers so busy shoppers
            can quickly find practical savings without searching multiple websites.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">
            Featured Deals
          </h2>

          <p className="text-sm text-slate-500">
            Search, filter, and sort approved deals.
          </p>
        </div>

        <DealBrowser />

        <div className="mt-10 rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Disclosure: DealSense may earn a commission when you purchase
          through affiliate links, at no additional cost to you. Prices and
          availability can change. Always verify details on the retailer website.
        </div>
      </section>
    </main>
  );
}