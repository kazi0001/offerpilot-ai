"use client";

import { useState } from "react";

type WalmartFetchResponse = {
    message?: string;
    query?: string;
    fetched_count?: number;
    normalized_count?: number;
    inserted_count?: number;
    skipped_count?: number;
    error?: string;
    details?: string;
};

export default function AdminWalmartFetch() {
    const [query, setQuery] = useState("household essentials");
    const [limit, setLimit] = useState("10");
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<WalmartFetchResponse | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    async function fetchWalmartDeals() {
        setIsFetching(true);
        setMessage("Fetching Walmart deals...");
        setResult(null);

        try {
            const response = await fetch("/api/agents/walmart-fetch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query,
                    limit: Number(limit),
                }),
            });

            const data: WalmartFetchResponse = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Walmart fetch failed.");
                setResult(data);
                return;
            }

            setMessage("Walmart fetch completed. Review pending deals below.");
            setResult(data);
        } catch {
            setMessage("Unexpected error while fetching Walmart deals.");
        } finally {
            setIsFetching(false);
        }
    }

    return (
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">
                    Walmart Fetch Agent
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Fetch Walmart affiliate products, score them, and save them as pending
                    deals for admin review.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Search Query
                    </label>
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        placeholder="household essentials"
                    />
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
                        max="25"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={fetchWalmartDeals}
                disabled={isFetching}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isFetching ? "Fetching..." : "Fetch Walmart Deals"}
            </button>

            {message && (
                <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {message}
                </p>
            )}

            {result && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p>Query: {result.query ?? query}</p>
                    <p>Fetched: {result.fetched_count ?? 0}</p>
                    <p>Normalized: {result.normalized_count ?? 0}</p>
                    <p>Inserted pending deals: {result.inserted_count ?? 0}</p>
                    <p>Skipped: {result.skipped_count ?? 0}</p>

                    {result.details && (
                        <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-white p-3 text-xs">
                            {result.details}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}