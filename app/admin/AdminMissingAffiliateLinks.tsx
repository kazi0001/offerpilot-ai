"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseBrowser";

type Deal = {
    id: string;
    product_name: string;
    current_price: number;
    deal_score: number | null;
    affiliate_url: string | null;
    product_url: string | null;
    is_approved: boolean;
    is_featured: boolean;
    created_at: string;
    retailers:
    | {
        name: string;
        slug: string;
    }
    | {
        name: string;
        slug: string;
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

function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
    if (Array.isArray(relation)) {
        return relation[0] ?? null;
    }

    return relation ?? null;
}

function isMissingAffiliateUrl(deal: Deal) {
    const affiliateUrl = deal.affiliate_url?.trim();
    const productUrl = deal.product_url?.trim();

    if (!affiliateUrl) return true;
    if (productUrl && affiliateUrl === productUrl) return true;

    return false;
}

export default function AdminMissingAffiliateLinks() {
    const supabase = useMemo(() => createClient(), []);

    const [deals, setDeals] = useState<Deal[]>([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    async function loadDeals() {
        setIsLoading(true);
        setMessage("");

        const { data, error } = await supabase
            .from("deals")
            .select(`
        id,
        product_name,
        current_price,
        deal_score,
        affiliate_url,
        product_url,
        is_approved,
        is_featured,
        created_at,
        retailers (
          name,
          slug
        ),
        categories (
          name,
          slug
        )
      `)
            .order("created_at", { ascending: false });

        if (error) {
            setMessage(`Error loading affiliate link gaps: ${error.message}`);
            setIsLoading(false);
            return;
        }

        setDeals((data ?? []) as Deal[]);
        setIsLoading(false);
    }

    useEffect(() => {
        loadDeals();
    }, []);

    const missingDeals = deals.filter(isMissingAffiliateUrl);
    const approvedMissingDeals = missingDeals.filter((deal) => deal.is_approved);

    return (
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        Missing Affiliate Links
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        These deals are visible or available in the database but may not be
                        monetization-ready. Add proper affiliate tracking URLs before
                        promoting them widely.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadDeals}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Refresh
                </button>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Total Deals
                    </p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                        {deals.length}
                    </p>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                        Missing / Non-tracking Links
                    </p>
                    <p className="mt-1 text-3xl font-bold text-red-800">
                        {missingDeals.length}
                    </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                        Approved but Not Monetized
                    </p>
                    <p className="mt-1 text-3xl font-bold text-amber-800">
                        {approvedMissingDeals.length}
                    </p>
                </div>
            </div>

            {message && (
                <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {message}
                </p>
            )}

            {isLoading ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                    Loading missing affiliate links...
                </p>
            ) : missingDeals.length === 0 ? (
                <div className="rounded-xl bg-green-50 p-5 text-sm text-green-800">
                    Great. All deals currently have affiliate URLs that differ from their
                    product URLs.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="py-3 pr-4 font-medium">Product</th>
                                <th className="py-3 pr-4 font-medium">Retailer</th>
                                <th className="py-3 pr-4 font-medium">Category</th>
                                <th className="py-3 pr-4 font-medium">Price</th>
                                <th className="py-3 pr-4 font-medium">Score</th>
                                <th className="py-3 pr-4 font-medium">Approved</th>
                                <th className="py-3 pr-4 font-medium">Issue</th>
                                <th className="py-3 pr-4 font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {missingDeals.map((deal) => {
                                const retailer = normalizeRelation(deal.retailers);
                                const category = normalizeRelation(deal.categories);

                                const affiliateUrl = deal.affiliate_url?.trim();
                                const productUrl = deal.product_url?.trim();

                                const issue = !affiliateUrl
                                    ? "Missing affiliate URL"
                                    : productUrl && affiliateUrl === productUrl
                                        ? "Affiliate URL equals product URL"
                                        : "Needs review";

                                return (
                                    <tr key={deal.id} className="border-b border-slate-100">
                                        <td className="max-w-xs py-3 pr-4">
                                            <p className="font-medium text-slate-900">
                                                {deal.product_name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                ID: {deal.id}
                                            </p>
                                        </td>

                                        <td className="py-3 pr-4 text-slate-700">
                                            {retailer?.name ?? "Unknown"}
                                        </td>

                                        <td className="py-3 pr-4 text-slate-700">
                                            {category?.name ?? "General"}
                                        </td>

                                        <td className="py-3 pr-4 text-slate-700">
                                            ${Number(deal.current_price).toFixed(2)}
                                        </td>

                                        <td className="py-3 pr-4 text-slate-700">
                                            {deal.deal_score ?? "N/A"}
                                        </td>

                                        <td className="py-3 pr-4">
                                            {deal.is_approved ? (
                                                <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                                    No
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3 pr-4">
                                            <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                                                {issue}
                                            </span>
                                        </td>

                                        <td className="py-3 pr-4">
                                            <div className="flex flex-wrap gap-2">
                                                <a
                                                    href={`/admin/deals/${deal.id}/edit`}
                                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Add Affiliate URL
                                                </a>

                                                {deal.product_url && (
                                                    <a
                                                        href={deal.product_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                                    >
                                                        Source
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}