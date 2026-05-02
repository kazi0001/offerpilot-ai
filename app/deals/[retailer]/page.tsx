import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type Retailer = {
    id: string;
    name: string;
    slug: string;
    website_url: string | null;
};

type Category = {
    name: string;
    slug: string;
};

type Deal = {
    id: string;
    product_name: string;
    product_description: string | null;
    original_price: number | null;
    current_price: number;
    discount_percent: number | null;
    deal_score: number | null;
    deal_reason: string | null;
    affiliate_url: string | null;
    product_url: string | null;
    image_url: string | null;
    availability_status: string | null;
    price_checked_at: string | null;
    is_featured: boolean;
    categories: Category | Category[] | null;
};

function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
    if (Array.isArray(relation)) {
        return relation[0] ?? null;
    }

    return relation ?? null;
}

function formatDate(dateString: string | null) {
    if (!dateString) return "Not available";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(dateString));
}

function formatRetailerTitle(slug: string) {
    return slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export default async function RetailerDealsPage({
    params,
}: {
    params: Promise<{ retailer: string }>;
}) {
    const { retailer } = await params;
    const supabase = await createClient();

    const { data: retailerData, error: retailerError } = await supabase
        .from("retailers")
        .select("id, name, slug, website_url")
        .eq("slug", retailer)
        .eq("is_active", true)
        .single();

    if (retailerError || !retailerData) {
        notFound();
    }

    const retailerRecord = retailerData as Retailer;

    const { data, error } = await supabase
        .from("deals")
        .select(`
      id,
      product_name,
      product_description,
      original_price,
      current_price,
      discount_percent,
      deal_score,
      deal_reason,
      affiliate_url,
      product_url,
      image_url,
      availability_status,
      price_checked_at,
      is_featured,
      categories (
        name,
        slug
      )
    `)
        .eq("retailer_id", retailerRecord.id)
        .eq("is_approved", true)
        .order("is_featured", { ascending: false })
        .order("deal_score", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    const deals: Deal[] = data ?? [];

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <a href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white">
                            DS
                        </div>

                        <div>
                            <p className="text-lg font-bold tracking-tight text-slate-950">
                                DealSeal
                            </p>
                            <p className="text-xs text-slate-500">
                                Useful deals, ranked with intelligence
                            </p>
                        </div>
                    </a>

                    <div className="flex items-center gap-3">
                        <a
                            href="/"
                            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                        >
                            All Deals
                        </a>

                        <a
                            href="/admin"
                            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                        >
                            Admin
                        </a>
                    </div>
                </div>
            </header>

            <section className="bg-slate-950">
                <div className="mx-auto max-w-7xl px-6 py-12">
                    <div className="max-w-3xl">
                        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-300">
                            Retailer deals
                        </p>

                        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                            {retailerRecord.name} deals
                        </h1>

                        <p className="mt-4 text-lg leading-8 text-slate-300">
                            Browse approved {retailerRecord.name} deals curated in DealSeal.
                            Compare prices, discounts, and deal scores before visiting the
                            retailer.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                                {deals.length} approved deals
                            </span>

                            <span className="rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100">
                                Featured deals first
                            </span>

                            <span className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100">
                                Clicks tracked
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-950">
                            Latest {retailerRecord.name} deals
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Product detail pages open inside DealSeal. View Deal buttons use
                            click tracking before redirecting.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <a
                            href="/deals/walmart"
                            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100"
                        >
                            Walmart
                        </a>
                        <a
                            href="/deals/target"
                            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100"
                        >
                            Target
                        </a>
                        <a
                            href="/deals/amazon"
                            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100"
                        >
                            Amazon
                        </a>
                        <a
                            href="/deals/best-buy"
                            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100"
                        >
                            Best Buy
                        </a>
                        <a
                            href="/deals/temu"
                            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100"
                        >
                            Temu
                        </a>
                    </div>
                </div>

                {deals.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <h3 className="text-xl font-bold text-slate-900">
                            No approved {retailerRecord.name} deals yet
                        </h3>
                        <p className="mt-2 text-slate-500">
                            Add or approve deals for this retailer from the admin dashboard.
                        </p>
                        <a
                            href="/admin"
                            className="mt-5 inline-block rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
                        >
                            Go to Admin
                        </a>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {deals.map((deal) => {
                            const category = normalizeRelation(deal.categories);

                            return (
                                <article
                                    key={deal.id}
                                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <a
                                        href={`/deal/${deal.id}`}
                                        className="block aspect-video overflow-hidden bg-slate-100"
                                    >
                                        {deal.image_url ? (
                                            <img
                                                src={deal.image_url}
                                                alt={deal.product_name}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-slate-400">
                                                No image
                                            </div>
                                        )}
                                    </a>

                                    <div className="p-5">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                                    {retailerRecord.name}
                                                </span>

                                                {deal.is_featured && (
                                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>

                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                                Score {deal.deal_score ?? "N/A"}
                                            </span>
                                        </div>

                                        <a href={`/deal/${deal.id}`}>
                                            <h3 className="mb-2 line-clamp-2 text-lg font-black text-slate-950 hover:text-blue-700">
                                                {deal.product_name}
                                            </h3>
                                        </a>

                                        <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-600">
                                            {deal.deal_reason ?? deal.product_description}
                                        </p>

                                        <div className="mb-4 flex items-baseline gap-3">
                                            <span className="text-3xl font-black text-slate-950">
                                                ${Number(deal.current_price).toFixed(2)}
                                            </span>

                                            {deal.original_price !== null && (
                                                <span className="text-sm text-slate-400 line-through">
                                                    ${Number(deal.original_price).toFixed(2)}
                                                </span>
                                            )}

                                            {deal.discount_percent !== null && (
                                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                                                    {Number(deal.discount_percent).toFixed(0)}% off
                                                </span>
                                            )}
                                        </div>

                                        <div className="mb-4 space-y-1 text-xs text-slate-500">
                                            <p>Category: {category?.name ?? "General"}</p>
                                            <p>Status: {deal.availability_status ?? "unknown"}</p>
                                            <p>Price checked: {formatDate(deal.price_checked_at)}</p>
                                        </div>

                                        <a
                                            href={`/deal/${deal.id}/go`}
                                            target="_blank"
                                            rel="noopener noreferrer sponsored"
                                            className="block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white hover:bg-blue-600"
                                        >
                                            View Deal
                                        </a>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <div className="mt-10 rounded-3xl bg-white p-6 text-sm leading-6 text-slate-500 shadow-sm">
                    <strong className="text-slate-700">Disclosure:</strong> DealSeal may
                    earn a commission when you purchase through affiliate links, at no
                    additional cost to you. Prices and availability can change. Always
                    verify details on the retailer website.
                </div>
            </section>
        </main>
    );
}