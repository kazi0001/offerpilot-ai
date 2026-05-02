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
    product_url?: string | null;
    image_url: string | null;
    availability_status: string | null;
    price_checked_at: string | null;
    is_featured: boolean;
    retailer: Retailer | null;
    category: Category | null;
};

type SortMode = "featured" | "score" | "discount" | "price-low" | "price-high";

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

function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
    if (Array.isArray(relation)) {
        return relation[0] ?? null;
    }

    return relation ?? null;
}

export default function DealBrowser() {
    const supabase = useMemo(() => createClient(), []);

    const [deals, setDeals] = useState<Deal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRetailer, setSelectedRetailer] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortMode, setSortMode] = useState<SortMode>("featured");
    const [quickFilter, setQuickFilter] = useState("all");

    const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);

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
          product_url,
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

            const normalizedDeals: Deal[] = (data ?? []).map((deal) => ({
                id: deal.id,
                product_name: deal.product_name,
                product_description: deal.product_description,
                original_price: deal.original_price,
                current_price: deal.current_price,
                discount_percent: deal.discount_percent,
                deal_score: deal.deal_score,
                deal_reason: deal.deal_reason,
                affiliate_url: deal.affiliate_url,
                product_url: deal.product_url,
                image_url: deal.image_url,
                availability_status: deal.availability_status,
                price_checked_at: deal.price_checked_at,
                is_featured: deal.is_featured,
                retailer: normalizeRelation<Retailer>(deal.retailer),
                category: normalizeRelation<Category>(deal.category),
            }));

            setDeals(normalizedDeals);
            setIsLoading(false);
        }

        loadDeals();
    }, [supabase]);

    const retailerOptions = useMemo(() => {
        const unique = new Map<string, string>();

        deals.forEach((deal) => {
            if (deal.retailer?.slug && deal.retailer?.name) {
                unique.set(deal.retailer.slug, deal.retailer.name);
            }
        });

        return Array.from(unique.entries()).map(([slug, name]) => ({
            slug,
            name,
        }));
    }, [deals]);

    const categoryOptions = useMemo(() => {
        const unique = new Map<string, string>();

        deals.forEach((deal) => {
            if (deal.category?.slug && deal.category?.name) {
                unique.set(deal.category.slug, deal.category.name);
            }
        });

        return Array.from(unique.entries()).map(([slug, name]) => ({
            slug,
            name,
        }));
    }, [deals]);

    const selectedCompareDeals = useMemo(() => {
        return selectedCompareIds
            .map((id) => deals.find((deal) => deal.id === id))
            .filter((deal): deal is Deal => Boolean(deal));
    }, [selectedCompareIds, deals]);

    const featuredDeals = useMemo(() => {
        return deals
            .filter((deal) => deal.is_featured || Number(deal.deal_score ?? 0) >= 80)
            .slice(0, 3);
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

                const discount = Number(deal.discount_percent ?? 0);
                const price = Number(deal.current_price ?? 0);
                const score = Number(deal.deal_score ?? 0);

                let matchesQuickFilter = true;

                if (quickFilter === "featured") {
                    matchesQuickFilter = deal.is_featured;
                } else if (quickFilter === "under-10") {
                    matchesQuickFilter = price <= 10;
                } else if (quickFilter === "under-25") {
                    matchesQuickFilter = price <= 25;
                } else if (quickFilter === "discount-25") {
                    matchesQuickFilter = discount >= 25;
                } else if (quickFilter === "discount-40") {
                    matchesQuickFilter = discount >= 40;
                } else if (quickFilter === "score-80") {
                    matchesQuickFilter = score >= 80;
                }

                return (
                    matchesRetailer &&
                    matchesCategory &&
                    matchesSearch &&
                    matchesQuickFilter
                );
            })
            .sort((a, b) => {
                if (sortMode === "featured") {
                    if (a.is_featured !== b.is_featured) {
                        return Number(b.is_featured) - Number(a.is_featured);
                    }

                    return Number(b.deal_score ?? 0) - Number(a.deal_score ?? 0);
                }

                if (sortMode === "score") {
                    return Number(b.deal_score ?? 0) - Number(a.deal_score ?? 0);
                }

                if (sortMode === "discount") {
                    return (
                        Number(b.discount_percent ?? 0) -
                        Number(a.discount_percent ?? 0)
                    );
                }

                if (sortMode === "price-low") {
                    return Number(a.current_price ?? 0) - Number(b.current_price ?? 0);
                }

                if (sortMode === "price-high") {
                    return Number(b.current_price ?? 0) - Number(a.current_price ?? 0);
                }

                return 0;
            });
    }, [
        deals,
        searchTerm,
        selectedRetailer,
        selectedCategory,
        quickFilter,
        sortMode,
    ]);

    function clearFilters() {
        setSearchTerm("");
        setSelectedRetailer("all");
        setSelectedCategory("all");
        setQuickFilter("all");
        setSortMode("featured");
    }

    function toggleCompare(dealId: string) {
        setSelectedCompareIds((prev) => {
            if (prev.includes(dealId)) {
                return prev.filter((id) => id !== dealId);
            }

            if (prev.length >= 4) {
                return prev;
            }

            return [...prev, dealId];
        });
    }

    function clearCompare() {
        setSelectedCompareIds([]);
    }

    return (
        <>
            {featuredDeals.length > 0 && (
                <div className="mb-8">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-black text-slate-950">
                                Today&apos;s Top Picks
                            </h3>
                            <p className="text-sm text-slate-500">
                                High-scoring or featured deals selected for quick review.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        {featuredDeals.map((deal, index) => (
                            <div
                                key={deal.id}
                                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                                        Pick #{index + 1}
                                    </span>
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                        Score {deal.deal_score ?? "N/A"}
                                    </span>
                                </div>

                                <h4 className="line-clamp-2 text-lg font-black text-slate-950">
                                    {deal.product_name}
                                </h4>

                                <p className="mt-2 text-sm text-slate-500">
                                    {deal.retailer?.name ?? "Retailer"} ·{" "}
                                    {deal.category?.name ?? "Category"}
                                </p>

                                <div className="mt-4 flex items-end gap-3">
                                    <span className="text-2xl font-black text-slate-950">
                                        ${Number(deal.current_price).toFixed(2)}
                                    </span>
                                    {deal.discount_percent !== null && (
                                        <span className="mb-1 text-sm font-bold text-emerald-700">
                                            {Number(deal.discount_percent).toFixed(0)}% off
                                        </span>
                                    )}
                                </div>

                                <a
                                    href={`/deal/${deal.id}/go`}
                                    target="_blank"
                                    rel="noopener noreferrer sponsored"
                                    className="mt-5 block rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-blue-700"
                                >
                                    View Deal
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-8 rounded-3xl bg-white p-5 shadow-sm">
                <div className="mb-5">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                        Search deals
                    </label>
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search Walmart clearance, paper towels, phones, laptops..."
                        className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                </div>

                <div className="mb-5">
                    <p className="mb-2 text-sm font-bold text-slate-700">Retailers</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedRetailer("all")}
                            className={`rounded-full px-4 py-2 text-sm font-bold ${selectedRetailer === "all"
                                    ? "bg-slate-950 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                        >
                            All
                        </button>

                        {retailerOptions.map((retailer) => (
                            <button
                                key={retailer.slug}
                                type="button"
                                onClick={() => setSelectedRetailer(retailer.slug)}
                                className={`rounded-full px-4 py-2 text-sm font-bold ${selectedRetailer === retailer.slug
                                        ? "bg-slate-950 text-white"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                            >
                                {retailer.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-5">
                    <p className="mb-2 text-sm font-bold text-slate-700">Categories</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory("all")}
                            className={`rounded-full px-4 py-2 text-sm font-bold ${selectedCategory === "all"
                                    ? "bg-blue-600 text-white"
                                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                }`}
                        >
                            All
                        </button>

                        {categoryOptions.map((category) => (
                            <button
                                key={category.slug}
                                type="button"
                                onClick={() => setSelectedCategory(category.slug)}
                                className={`rounded-full px-4 py-2 text-sm font-bold ${selectedCategory === category.slug
                                        ? "bg-blue-600 text-white"
                                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <p className="mb-2 text-sm font-bold text-slate-700">
                            Quick filters
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: "all", label: "All deals" },
                                { id: "featured", label: "Featured" },
                                { id: "under-10", label: "Under $10" },
                                { id: "under-25", label: "Under $25" },
                                { id: "discount-25", label: "25%+ off" },
                                { id: "discount-40", label: "40%+ off" },
                                { id: "score-80", label: "Score 80+" },
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() => setQuickFilter(filter.id)}
                                    className={`rounded-full px-4 py-2 text-sm font-bold ${quickFilter === filter.id
                                            ? "bg-amber-400 text-slate-950"
                                            : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">
                            Sort by
                        </label>
                        <select
                            value={sortMode}
                            onChange={(event) => setSortMode(event.target.value as SortMode)}
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            <option value="featured">Featured first</option>
                            <option value="score">Highest score</option>
                            <option value="discount">Highest discount</option>
                            <option value="price-low">Price: low to high</option>
                            <option value="price-high">Price: high to low</option>
                        </select>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                        Showing {filteredDeals.length} of {deals.length} approved deals.
                        Select up to 4 deals to compare.
                    </p>

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            {selectedCompareDeals.length > 0 && (
                <div id="compare" className="mb-8 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-black text-slate-950">
                                Compare Deals
                            </h3>
                            <p className="text-sm text-slate-600">
                                Select 2 to 4 deals for a quick side-by-side comparison.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={clearCompare}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                        >
                            Clear comparison
                        </button>
                    </div>

                    {selectedCompareDeals.length === 1 ? (
                        <p className="rounded-xl bg-white p-4 text-sm text-slate-600">
                            Select one more deal to compare.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] border-collapse rounded-2xl bg-white text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                        <th className="p-3 font-bold">Metric</th>
                                        {selectedCompareDeals.map((deal) => (
                                            <th key={deal.id} className="p-3 font-bold">
                                                {deal.product_name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    <ComparisonRow
                                        label="Retailer"
                                        deals={selectedCompareDeals}
                                        value={(deal) => deal.retailer?.name ?? "Unknown"}
                                    />
                                    <ComparisonRow
                                        label="Category"
                                        deals={selectedCompareDeals}
                                        value={(deal) => deal.category?.name ?? "General"}
                                    />
                                    <ComparisonRow
                                        label="Current price"
                                        deals={selectedCompareDeals}
                                        value={(deal) => `$${Number(deal.current_price).toFixed(2)}`}
                                    />
                                    <ComparisonRow
                                        label="Original price"
                                        deals={selectedCompareDeals}
                                        value={(deal) =>
                                            deal.original_price
                                                ? `$${Number(deal.original_price).toFixed(2)}`
                                                : "N/A"
                                        }
                                    />
                                    <ComparisonRow
                                        label="Discount"
                                        deals={selectedCompareDeals}
                                        value={(deal) =>
                                            deal.discount_percent !== null
                                                ? `${Number(deal.discount_percent).toFixed(0)}%`
                                                : "N/A"
                                        }
                                    />
                                    <ComparisonRow
                                        label="Deal score"
                                        deals={selectedCompareDeals}
                                        value={(deal) => String(deal.deal_score ?? "N/A")}
                                    />
                                    <ComparisonRow
                                        label="Status"
                                        deals={selectedCompareDeals}
                                        value={(deal) => deal.availability_status ?? "unknown"}
                                    />

                                    <tr className="border-b border-slate-100">
                                        <td className="p-3 font-bold text-slate-700">Action</td>
                                        {selectedCompareDeals.map((deal) => (
                                            <td key={deal.id} className="p-3">
                                                <a
                                                    href={`/deal/${deal.id}/go`}
                                                    target="_blank"
                                                    rel="noopener noreferrer sponsored"
                                                    className="inline-block rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                                                >
                                                    View deal
                                                </a>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {message && (
                <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {message}
                </p>
            )}

            {isLoading ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-slate-600">Loading deals...</p>
                </div>
            ) : filteredDeals.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-slate-600">
                        No deals match your current filters.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredDeals.map((deal) => {
                        const isSelected = selectedCompareIds.includes(deal.id);

                        return (
                            <article
                                key={deal.id}
                                className={`group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${isSelected
                                        ? "border-blue-400 ring-2 ring-blue-100"
                                        : "border-slate-200"
                                    }`}
                            >
                                <div className="aspect-video overflow-hidden bg-slate-100">
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
                                </div>

                                <div className="p-5">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                                {deal.retailer?.name ?? "Retailer"}
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

                                    <h3 className="mb-2 line-clamp-2 text-lg font-black text-slate-950">
                                        {deal.product_name}
                                    </h3>

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
                                        <p>Category: {deal.category?.name ?? "General"}</p>
                                        <p>Status: {deal.availability_status ?? "unknown"}</p>
                                        <p>Price checked: {formatDate(deal.price_checked_at)}</p>
                                    </div>

                                    <label className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleCompare(deal.id)}
                                        />
                                        Compare
                                    </label>

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
        </>
    );
}

function ComparisonRow({
    label,
    deals,
    value,
}: {
    label: string;
    deals: Deal[];
    value: (deal: Deal) => string;
}) {
    return (
        <tr className="border-b border-slate-100">
            <td className="p-3 font-bold text-slate-700">{label}</td>
            {deals.map((deal) => (
                <td key={deal.id} className="p-3 text-slate-700">
                    {value(deal)}
                </td>
            ))}
        </tr>
    );
}