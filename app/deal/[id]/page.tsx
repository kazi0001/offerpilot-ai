import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

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
    is_approved: boolean;
    retailers:
    | {
        name: string;
        slug: string;
        website_url: string | null;
    }
    | {
        name: string;
        slug: string;
        website_url: string | null;
    }[]
    | null;
    categories:
    | {
        name: string;
        slug: string;
    }
    | {
        name: string;
        slug: string;
    }[]
    | null;
};

type Relation<T> = T | T[] | null | undefined;

function normalizeRelation<T>(relation: Relation<T>): T | null {
    if (Array.isArray(relation)) {
        return relation[0] ?? null;
    }

    return relation ?? null;
}

function formatDate(dateString: string | null) {
    if (!dateString) return "Not available";

    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(dateString));
}

export default async function DealDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

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
      is_approved,
      retailers (
        name,
        slug,
        website_url
      ),
      categories (
        name,
        slug
      )
    `)
        .eq("id", id)
        .eq("is_approved", true)
        .single();

    if (error || !data) {
        notFound();
    }

    const deal = data as Deal;

    const retailer = normalizeRelation(deal.retailers);
    const category = normalizeRelation(deal.categories);

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <a href="/" className="flex items-center gap-3">
                        <img
                            src="/images/dealsealusa-logo.png"
                            alt="DealSealUSA logo"
                            className="h-28 w-auto"
                        />
                    </a>

                    <a
                        href="/"
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                    >
                        Back to deals
                    </a>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <a href="/" className="font-semibold text-blue-700 hover:text-blue-900">
                        Deals
                    </a>
                    <span>/</span>
                    <span>{retailer?.name ?? "Retailer"}</span>
                    <span>/</span>
                    <span>{category?.name ?? "Category"}</span>
                </div>

                <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-3xl bg-white p-5 shadow-sm">
                        <div className="aspect-square overflow-hidden rounded-3xl bg-slate-100">
                            {deal.image_url ? (
                                <img
                                    src={deal.image_url}
                                    alt={deal.product_name}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-400">
                                    No image available
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <div className="mb-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                {retailer?.name ?? "Retailer"}
                            </span>

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                {category?.name ?? "Category"}
                            </span>

                            {deal.is_featured && (
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                    Featured
                                </span>
                            )}

                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                {deal.availability_status ?? "available"}
                            </span>
                        </div>

                        <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                            {deal.product_name}
                        </h1>

                        {deal.product_description && (
                            <p className="mt-4 text-base leading-7 text-slate-600">
                                {deal.product_description}
                            </p>
                        )}

                        <div className="mt-6 rounded-3xl bg-slate-50 p-5">
                            <div className="flex flex-wrap items-end gap-4">
                                <span className="text-5xl font-black text-slate-950">
                                    ${Number(deal.current_price).toFixed(2)}
                                </span>

                                {deal.original_price !== null && (
                                    <span className="pb-2 text-lg text-slate-400 line-through">
                                        ${Number(deal.original_price).toFixed(2)}
                                    </span>
                                )}

                                {deal.discount_percent !== null && (
                                    <span className="mb-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">
                                        {Number(deal.discount_percent).toFixed(0)}% off
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-white p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Deal Score
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-blue-700">
                                        {deal.deal_score ?? "N/A"}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Retailer
                                    </p>
                                    <p className="mt-1 text-lg font-black text-slate-950">
                                        {retailer?.name ?? "Unknown"}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Checked
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-950">
                                        {formatDate(deal.price_checked_at)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {deal.deal_reason && (
                            <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                                <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                                    Why this deal may be useful
                                </p>
                                <p className="mt-2 leading-7 text-slate-700">
                                    {deal.deal_reason}
                                </p>
                            </div>
                        )}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <a
                                href={`/deal/${deal.id}/go`}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="flex-1 rounded-2xl bg-slate-950 px-6 py-4 text-center text-sm font-black text-white hover:bg-blue-600"
                            >
                                View Deal at {retailer?.name ?? "Retailer"}
                            </a>

                            <a
                                href="/#deals"
                                className="rounded-2xl border border-slate-300 px-6 py-4 text-center text-sm font-black text-slate-700 hover:bg-slate-50"
                            >
                                Compare more deals
                            </a>
                        </div>

                        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                            Disclosure: DealSeal may earn a commission when you purchase
                            through affiliate links, at no additional cost to you. Prices,
                            availability, and product details can change. Always verify final
                            information on the retailer website.
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}