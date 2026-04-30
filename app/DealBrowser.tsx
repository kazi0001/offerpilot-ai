"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseBrowser";

type Retailer = {
    name: string;
    slug: string;
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
    image_url: string | null;
    availability_status: string | null;
    price_checked_at: string | null;
    is_featured: boolean;
    retailer: Retailer | null;
    category: Category | null;
};

function formatDate(dateString: string | null) {
    if (!dateString) return "Not available";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(dateString));
}

export default function DealBrowser() {
    const supabase = useMemo(() => createClient(), []);

    const [deals, setDeals] = useState<Deal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRetailer, setSelectedRetailer] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");

    useEffect(() => {
        async function loadDeals() {
            setIsLoading(true);

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
          image_url,
          availability_status,
          price_checked_at,
          is_featured,
          retailer:retailers (
            name,
            slug
          ),
          category:categories (
            name,
            slug
          )
        `)
                .eq("is_approved", true)
                .order("is_featured", { ascending: false })
                .order("deal_score", { ascending: false })
                .order("created_at", { ascending: false });

            if (error) {
                setMessage(`Error loading deals: ${error.message}`);
                setIsLoading(false);
                return;
            }

            setDeals(data ?? []);
            setIsLoading(false);
        }

        loadDeals();
    }, [supabase]);

    const retailerOptions = useMemo(() => {
        const uniqueRetailers = new Map<string, string>();

        deals.forEach((deal) => {
            if (deal.retailer?.slug && deal.retailer?.name) {
                uniqueRetailers.set(deal.retailer.slug, deal.retailer.name);
            }
        });

        return Array.from(uniqueRetailers.entries()).map(([slug, name]) => ({
            slug,
            name,
        }));
    }, [deals]);

    const categoryOptions = useMemo(() => {
        const uniqueCategories = new Map<string, string>();

        deals.forEach((deal) => {
            if (deal.category?.slug && deal.category?.name) {
                uniqueCategories.set(deal.category.slug, deal.category.name);
            }
        });

        return Array.from(uniqueCategories.entries()).map(([slug, name]) => ({
            slug,
            name,
        }));
    }, [deals]);

    const filteredDeals = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return deals
            .filter((deal) => {
                const matchesRetailer =
                    selectedRetailer === "all" ||
                    deal.retailer?.slug === selectedRetailer;

                const matchesCategory =
                    selectedCategory === "all" ||
                    deal.category?.slug === selectedCategory;

                const searchableText = [
                    deal.product_name,
                    deal.product_description,
                    deal.deal_reason,
                    deal.retailer?.name,
                    deal.category?.name,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    normalizedSearch.length === 0 ||
                    searchableText.includes(normalizedSearch);

                return matchesRetailer && matchesCategory && matchesSearch;
            })
            .sort((a, b) => {
                if (a.is_featured !== b.is_featured) {
                    return Number(b.is_featured) - Number(a.is_featured);
                }

                return Number(b.deal_score ?? 0) - Number(a.deal_score ?? 0);
            });
    }, [deals, searchTerm, selectedRetailer, selectedCategory]);

    function clearFilters() {
        setSearchTerm("");
        setSelectedRetailer("all");
        setSelectedCategory("all");
    }

    return (
        <>
            <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Search deals
                        </label>
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search laundry, paper towels, electronics..."
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Retailer
                        </label>
                        <select
                            value={selectedRetailer}
                            onChange={(event) => setSelectedRetailer(event.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        >
                            <option value="all">All retailers</option>
                            {retailerOptions.map((retailer) => (
                                <option key={retailer.slug} value={retailer.slug}>
                                    {retailer.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Category
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(event) => setSelectedCategory(event.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        >
                            <option value="all">All categories</option>
                            {categoryOptions.map((category) => (
                                <option key={category.slug} value={category.slug}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                        Showing {filteredDeals.length} of {deals.length} approved deals.
                        Featured deals appear first.
                    </p>

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            {message && (
                <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {message}
                </p>
            )}

            {isLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-slate-600">Loading deals...</p>
                </div>
            ) : filteredDeals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-slate-600">
                        No deals match your current filters.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDeals.map((deal) => (
                        <article
                            key={deal.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        >
                            <div className="aspect-video bg-slate-100">
                                {deal.image_url ? (
                                    <img
                                        src={deal.image_url}
                                        alt={deal.product_name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-slate-400">
                                        No image
                                    </div>
                                )}
                            </div>

                            <div className="p-5">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                            {deal.retailer?.name ?? "Retailer"}
                                        </span>

                                        {deal.is_featured && (
                                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                Featured
                                            </span>
                                        )}
                                    </div>

                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                        Score {deal.deal_score ?? "N/A"}
                                    </span>
                                </div>

                                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                                    {deal.product_name}
                                </h3>

                                <p className="mb-4 line-clamp-3 text-sm text-slate-600">
                                    {deal.deal_reason ?? deal.product_description}
                                </p>

                                <div className="mb-4 flex items-baseline gap-3">
                                    <span className="text-2xl font-bold text-slate-900">
                                        ${Number(deal.current_price).toFixed(2)}
                                    </span>

                                    {deal.original_price !== null && (
                                        <span className="text-sm text-slate-400 line-through">
                                            ${Number(deal.original_price).toFixed(2)}
                                        </span>
                                    )}

                                    {deal.discount_percent !== null && (
                                        <span className="text-sm font-semibold text-green-700">
                                            {Number(deal.discount_percent).toFixed(0)}% off
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4 space-y-1 text-xs text-slate-500">
                                    <p>Category: {deal.category?.name ?? "General"}</p>
                                    <p>Status: {deal.availability_status ?? "unknown"}</p>
                                    <p>Price checked: {formatDate(deal.price_checked_at)}</p>
                                </div>

                                <a
                                    href={deal.affiliate_url ?? "#"}
                                    target="_blank"
                                    rel="noopener noreferrer sponsored"
                                    className="block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700"
                                >
                                    View Deal
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}