"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseBrowser";

type Deal = {
    id: string;
    product_name: string;
    current_price: number;
    original_price: number | null;
    discount_percent: number | null;
    deal_score: number | null;
    affiliate_url: string | null;
    product_url: string | null;
    image_url: string | null;
    is_approved: boolean;
    is_featured: boolean;
    availability_status: string | null;
    created_at: string;
    retailer: {
        name: string;
        slug: string;
    } | null;
    category: {
        name: string;
        slug: string;
    } | null;
};

function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
    if (Array.isArray(relation)) {
        return relation[0] ?? null;
    }

    return relation ?? null;
}

export default function AdminDealList() {
    const supabase = useMemo(() => createClient(), []);

    const [deals, setDeals] = useState<Deal[]>([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function loadDeals() {
        setIsLoading(true);
        setMessage("");

        const { data, error } = await supabase
            .from("deals")
            .select(`
        id,
        product_name,
        current_price,
        original_price,
        discount_percent,
        deal_score,
        affiliate_url,
        product_url,
        image_url,
        is_approved,
        is_featured,
        availability_status,
        created_at,
        retailer:retailers (
          name,
          slug
        ),
        category:categories (
          name,
          slug
        )
      `)
            .order("created_at", { ascending: false });

        if (error) {
            setMessage(`Error loading deals: ${error.message}`);
            setIsLoading(false);
            return;
        }

        const normalizedDeals: Deal[] = (data ?? []).map((deal) => ({
            id: deal.id,
            product_name: deal.product_name,
            current_price: deal.current_price,
            original_price: deal.original_price,
            discount_percent: deal.discount_percent,
            deal_score: deal.deal_score,
            affiliate_url: deal.affiliate_url,
            product_url: deal.product_url,
            image_url: deal.image_url,
            is_approved: deal.is_approved,
            is_featured: deal.is_featured,
            availability_status: deal.availability_status,
            created_at: deal.created_at,
            retailer: normalizeRelation(deal.retailer),
            category: normalizeRelation(deal.category),
        }));

        setDeals(normalizedDeals);
        setIsLoading(false);
    }

    useEffect(() => {
        loadDeals();
    }, []);

    async function toggleApproved(deal: Deal) {
        setMessage("Updating approval status...");

        const { error } = await supabase
            .from("deals")
            .update({
                is_approved: !deal.is_approved,
                updated_at: new Date().toISOString(),
            })
            .eq("id", deal.id);

        if (error) {
            setMessage(`Error updating approval status: ${error.message}`);
            return;
        }

        setMessage("Approval status updated.");
        await loadDeals();
    }

    async function toggleFeatured(deal: Deal) {
        setMessage("Updating featured status...");

        const { error } = await supabase
            .from("deals")
            .update({
                is_featured: !deal.is_featured,
                updated_at: new Date().toISOString(),
            })
            .eq("id", deal.id);

        if (error) {
            setMessage(`Error updating featured status: ${error.message}`);
            return;
        }

        setMessage("Featured status updated.");
        await loadDeals();
    }

    async function deleteDeal(deal: Deal) {
        const confirmed = window.confirm(
            `Delete this deal?\n\n${deal.product_name}`
        );

        if (!confirmed) return;

        setMessage("Deleting deal...");

        const { error } = await supabase.from("deals").delete().eq("id", deal.id);

        if (error) {
            setMessage(`Error deleting deal: ${error.message}`);
            return;
        }

        setMessage("Deal deleted.");
        await loadDeals();
    }

    const approvedCount = deals.filter((deal) => deal.is_approved).length;
    const featuredCount = deals.filter((deal) => deal.is_featured).length;
    const affiliateReadyCount = deals.filter((deal) =>
        Boolean(deal.affiliate_url)
    ).length;

    return (
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        Existing Deals
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Review, approve, feature, edit, or delete deals stored in Supabase.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={loadDeals}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Refresh
                    </button>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        {deals.length} deals
                    </span>
                </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Total Deals
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {deals.length}
                    </p>
                </div>

                <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                        Approved
                    </p>
                    <p className="mt-1 text-2xl font-bold text-green-800">
                        {approvedCount}
                    </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                        Featured
                    </p>
                    <p className="mt-1 text-2xl font-bold text-blue-800">
                        {featuredCount}
                    </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                        Affiliate Ready
                    </p>
                    <p className="mt-1 text-2xl font-bold text-amber-800">
                        {affiliateReadyCount}
                    </p>
                </div>
            </div>

            {message && (
                <p className="mb-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {message}
                </p>
            )}

            {isLoading ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                    Loading deals...
                </p>
            ) : deals.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                    No deals found yet.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="py-3 pr-4 font-medium">Product</th>
                                <th className="py-3 pr-4 font-medium">Retailer</th>
                                <th className="py-3 pr-4 font-medium">Category</th>
                                <th className="py-3 pr-4 font-medium">Price</th>
                                <th className="py-3 pr-4 font-medium">Discount</th>
                                <th className="py-3 pr-4 font-medium">Score</th>
                                <th className="py-3 pr-4 font-medium">Affiliate</th>
                                <th className="py-3 pr-4 font-medium">Approved</th>
                                <th className="py-3 pr-4 font-medium">Featured</th>
                                <th className="py-3 pr-4 font-medium">Status</th>
                                <th className="py-3 pr-4 font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {deals.map((deal) => (
                                <tr key={deal.id} className="border-b border-slate-100">
                                    <td className="max-w-xs py-3 pr-4">
                                        <div className="font-medium text-slate-900">
                                            {deal.product_name}
                                        </div>

                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {deal.is_approved && (
                                                <a
                                                    href={`/deal/${deal.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                                                >
                                                    Public page
                                                </a>
                                            )}

                                            {deal.product_url && (
                                                <a
                                                    href={deal.product_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                                                >
                                                    Source URL
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    <td className="py-3 pr-4 text-slate-700">
                                        {deal.retailer?.name ?? "Unknown"}
                                    </td>

                                    <td className="py-3 pr-4 text-slate-700">
                                        {deal.category?.name ?? "General"}
                                    </td>

                                    <td className="py-3 pr-4 text-slate-700">
                                        ${Number(deal.current_price).toFixed(2)}
                                    </td>

                                    <td className="py-3 pr-4 text-slate-700">
                                        {deal.discount_percent !== null
                                            ? `${Number(deal.discount_percent).toFixed(0)}%`
                                            : "N/A"}
                                    </td>

                                    <td className="py-3 pr-4 text-slate-700">
                                        {deal.deal_score ?? "N/A"}
                                    </td>

                                    <td className="py-3 pr-4">
                                        {deal.affiliate_url ? (
                                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                                                No
                                            </span>
                                        )}
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
                                        {deal.is_featured ? (
                                            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                                No
                                            </span>
                                        )}
                                    </td>

                                    <td className="py-3 pr-4 text-slate-700">
                                        {deal.availability_status ?? "unknown"}
                                    </td>

                                    <td className="py-3 pr-4">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleApproved(deal)}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                {deal.is_approved ? "Unapprove" : "Approve"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => toggleFeatured(deal)}
                                                className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                            >
                                                {deal.is_featured ? "Unfeature" : "Feature"}
                                            </button>

                                            <a
                                                href={`/admin/deals/${deal.id}/edit`}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                Edit
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => deleteDeal(deal)}
                                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}