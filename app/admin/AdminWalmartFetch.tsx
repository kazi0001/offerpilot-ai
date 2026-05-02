"use client";

import { useState } from "react";

type DemoFetchResponse = {
    message?: string;
    source?: string;
    categorySlug?: string;
    fetched_count?: number;
    normalized_count?: number;
    inserted_count?: number;
    skipped_count?: number;
    error?: string;
    details?: string;
};

const demoCategories = [
    { slug: "all-demo-products", label: "All demo products" },
    { slug: "smartphones", label: "Smartphones" },
    { slug: "laptops", label: "Laptops" },
    { slug: "tablets", label: "Tablets" },
    { slug: "mobile-accessories", label: "Mobile Accessories" },
    { slug: "groceries", label: "Groceries" },
    { slug: "furniture", label: "Furniture" },
    { slug: "home-decoration", label: "Home Decoration" },
    { slug: "kitchen-accessories", label: "Kitchen Accessories" },
    { slug: "beauty", label: "Beauty" },
    { slug: "fragrances", label: "Fragrances" },
    { slug: "mens-shirts", label: "Mens Shirts" },
    { slug: "womens-dresses", label: "Womens Dresses" },
    { slug: "womens-bags", label: "Womens Bags" },
];

export default function AdminDemoFetch() {
    const [categorySlug, setCategorySlug] = useState("all-demo-products");
    const [limit, setLimit] = useState("10");
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<DemoFetchResponse | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    async function fetchDemoDeals() {
        setIsFetching(true);
        setMessage("Running demo fetch agent...");
        setResult(null);

        try {
            const response = await fetch("/api/agents/demo-fetch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    categorySlug,
                    limit: Number(limit),
                }),
            });

            const data: DemoFetchResponse = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Demo fetch failed.");
                setResult(data);
                return;
            }

            setMessage("Demo fetch completed. Review pending deals below.");
            setResult(data);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? `Unexpected error: ${error.message}`
                    : "Unexpected error while running demo fetch."
            );
        } finally {
            setIsFetching(false);
        }
    }

    return (
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">
                    Demo Fetch Agent
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Fetch sample e-commerce products from a public demo API, transform
                    them into DealSeal deals, and save them as pending items for review.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Demo Category
                    </label>
                    <select
                        value={categorySlug}
                        onChange={(event) => setCategorySlug(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                        {demoCategories.map((category) => (
                            <option key={category.slug} value={category.slug}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Limit
                    </label>
                    <input
                        value={limit}
                        onChange={(event) => setLimit(event.target.value)}
                        type="number"
                        min="1"
                        max="30"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={fetchDemoDeals}
                disabled={isFetching}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isFetching ? "Fetching..." : "Fetch Demo Deals"}
            </button>

            {message && (
                <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {message}
                </p>
            )}

            {result && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p>Source: {result.source ?? "Demo API"}</p>
                    <p>Category: {result.categorySlug ?? categorySlug}</p>
                    <p>Fetched: {result.fetched_count ?? 0}</p>
                    <p>Normalized: {result.normalized_count ?? 0}</p>
                    <p>Inserted pending deals: {result.inserted_count ?? 0}</p>
                    <p>Skipped: {result.skipped_count ?? 0}</p>

                    {result.error && (
                        <p className="mt-2 text-red-700">Error: {result.error}</p>
                    )}

                    {result.details && (
                        <p className="mt-1 text-red-700">Details: {result.details}</p>
                    )}
                </div>
            )}
        </div>
    );
}