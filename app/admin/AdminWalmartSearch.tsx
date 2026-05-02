"use client";

import { useState } from "react";

type WalmartSearchResponse = {
    message?: string;
    query?: string;
    fetched_count?: number;
    normalized_count?: number;
    inserted_count?: number;
    skipped_count?: number;
    publisher_id_configured?: boolean;
    error?: string;
    details?: string;
    skipped_deals?: string[];
};

export default function AdminWalmartSearch() {
    const [query, setQuery] = useState("paper towels");
    const [limit, setLimit] = useState("10");
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<WalmartSearchResponse | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    async function fetchWalmartDeals() {
        setIsFetching(true);
        setMessage("Running Walmart Search Agent...");
        setResult(null);

        try {
            const response = await fetch("/api/agents/walmart-search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query,
                    limit: Number(limit),
                }),
            });

            const data: WalmartSearchResponse = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Walmart Search Agent failed.");
                setResult(data);
                return;
            }

            setMessage("Walmart Search Agent completed. Review pending deals below.");
            setResult(data);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? `Unexpected error: ${error.message}`
                    : "Unexpected error while running Walmart Search Agent."
            );
        } finally {
            setIsFetching(false);
        }
    }

    return (
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">
                    Walmart Search Agent
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Fetch real Walmart products using Walmart I/O, normalize them into
                    DealSeal deals, score them, and save them as pending items for review.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Walmart Search Query
                    </label>
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        placeholder="paper towels, solar lights, coffee maker..."
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        Try: paper towels, solar lights, coffee maker, laundry detergent,
                        laptop, air fryer.
                    </p>
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
                    {result.error ? (
                        <>
                            <p className="font-semibold text-red-700">Error: {result.error}</p>
                            {result.details && (
                                <p className="mt-1 text-red-700">Details: {result.details}</p>
                            )}
                        </>
                    ) : (
                        <>
                            <p>Query: {result.query ?? query}</p>
                            <p>Fetched: {result.fetched_count ?? 0}</p>
                            <p>Normalized: {result.normalized_count ?? 0}</p>
                            <p>Inserted pending deals: {result.inserted_count ?? 0}</p>
                            <p>Skipped: {result.skipped_count ?? 0}</p>
                            <p>
                                Publisher ID configured:{" "}
                                {result.publisher_id_configured ? "Yes" : "No"}
                            </p>

                            {!result.publisher_id_configured && (
                                <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-800">
                                    Walmart returned tracking URLs with a publisher placeholder.
                                    Add WALMART_PUBLISHER_ID to save monetized affiliate URLs
                                    automatically. Otherwise, these imported deals will appear in
                                    Missing Affiliate Links.
                                </p>
                            )}

                            {result.skipped_deals && result.skipped_deals.length > 0 && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer font-semibold">
                                        View skipped deals
                                    </summary>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        {result.skipped_deals.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </details>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}