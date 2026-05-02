"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseBrowser";

type ClickRecord = {
    id: string;
    source: string | null;
    device_type: string | null;
    clicked_at: string;
    deals: {
        product_name: string;
        current_price: number;
        deal_score: number | null;
    } | null;
    retailers: {
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

export default function AdminAnalytics() {
    const supabase = useMemo(() => createClient(), []);

    const [clicks, setClicks] = useState<ClickRecord[]>([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    async function loadClicks() {
        setIsLoading(true);

        const { data, error } = await supabase
            .from("clicks")
            .select(`
        id,
        source,
        device_type,
        clicked_at,
        deals (
          product_name,
          current_price,
          deal_score
        ),
        retailers (
          name,
          slug
        )
      `)
            .order("clicked_at", { ascending: false })
            .limit(100);

        if (error) {
            setMessage(`Error loading analytics: ${error.message}`);
            setIsLoading(false);
            return;
        }

        const normalizedClicks: ClickRecord[] = (data ?? []).map((click) => ({
            id: click.id,
            source: click.source,
            device_type: click.device_type,
            clicked_at: click.clicked_at,
            deals: normalizeRelation(click.deals),
            retailers: normalizeRelation(click.retailers),
        }));

        setClicks(normalizedClicks);
        setIsLoading(false);
    }

    useEffect(() => {
        loadClicks();
    }, []);

    const totalClicks = clicks.length;

    const clicksByRetailer = useMemo(() => {
        const counts = new Map<string, number>();

        clicks.forEach((click) => {
            const retailerName = click.retailers?.name ?? "Unknown";
            counts.set(retailerName, (counts.get(retailerName) ?? 0) + 1);
        });

        return Array.from(counts.entries())
            .map(([retailer, count]) => ({ retailer, count }))
            .sort((a, b) => b.count - a.count);
    }, [clicks]);

    const topDeals = useMemo(() => {
        const counts = new Map<string, { productName: string; count: number }>();

        clicks.forEach((click) => {
            const productName = click.deals?.product_name ?? "Unknown product";
            const existing = counts.get(productName);

            counts.set(productName, {
                productName,
                count: existing ? existing.count + 1 : 1,
            });
        });

        return Array.from(counts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [clicks]);

    return (
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        Click Analytics
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Track which deals and retailers users click before going to affiliate links.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadClicks}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Refresh
                </button>
            </div>

            {message && (
                <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {message}
                </p>
            )}

            {isLoading ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                    Loading analytics...
                </p>
            ) : (
                <>
                    <div className="mb-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Total Clicks
                            </p>
                            <p className="mt-1 text-3xl font-bold text-slate-900">
                                {totalClicks}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Top Retailer
                            </p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {clicksByRetailer[0]?.retailer ?? "N/A"}
                            </p>
                            <p className="text-sm text-slate-500">
                                {clicksByRetailer[0]?.count ?? 0} clicks
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Top Deal
                            </p>
                            <p className="mt-1 line-clamp-1 text-xl font-bold text-slate-900">
                                {topDeals[0]?.productName ?? "N/A"}
                            </p>
                            <p className="text-sm text-slate-500">
                                {topDeals[0]?.count ?? 0} clicks
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="mb-3 font-semibold text-slate-900">
                                Clicks by Retailer
                            </h3>

                            {clicksByRetailer.length === 0 ? (
                                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                                    No retailer clicks yet.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {clicksByRetailer.map((item) => (
                                        <div
                                            key={item.retailer}
                                            className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"
                                        >
                                            <span className="font-medium text-slate-700">
                                                {item.retailer}
                                            </span>
                                            <span className="font-semibold text-slate-900">
                                                {item.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="mb-3 font-semibold text-slate-900">
                                Top Clicked Deals
                            </h3>

                            {topDeals.length === 0 ? (
                                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                                    No clicked deals yet.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {topDeals.map((deal) => (
                                        <div
                                            key={deal.productName}
                                            className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"
                                        >
                                            <span className="font-medium text-slate-700">
                                                {deal.productName}
                                            </span>
                                            <span className="font-semibold text-slate-900">
                                                {deal.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-3 font-semibold text-slate-900">
                            Recent Clicks
                        </h3>

                        {clicks.length === 0 ? (
                            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                                No clicks recorded yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500">
                                            <th className="py-3 pr-4 font-medium">Product</th>
                                            <th className="py-3 pr-4 font-medium">Retailer</th>
                                            <th className="py-3 pr-4 font-medium">Device</th>
                                            <th className="py-3 pr-4 font-medium">Source</th>
                                            <th className="py-3 pr-4 font-medium">Time</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {clicks.slice(0, 20).map((click) => (
                                            <tr key={click.id} className="border-b border-slate-100">
                                                <td className="py-3 pr-4 font-medium text-slate-900">
                                                    {click.deals?.product_name ?? "Unknown product"}
                                                </td>
                                                <td className="py-3 pr-4 text-slate-700">
                                                    {click.retailers?.name ?? "Unknown"}
                                                </td>
                                                <td className="py-3 pr-4 text-slate-700">
                                                    {click.device_type ?? "unknown"}
                                                </td>
                                                <td className="py-3 pr-4 text-slate-700">
                                                    {click.source ?? "unknown"}
                                                </td>
                                                <td className="py-3 pr-4 text-slate-700">
                                                    {new Intl.DateTimeFormat("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    }).format(new Date(click.clicked_at))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}