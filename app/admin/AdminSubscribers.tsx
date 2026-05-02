"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseBrowser";

type Subscriber = {
    id: string;
    email: string;
    source: string | null;
    is_active: boolean;
    created_at: string;
};

export default function AdminSubscribers() {
    const supabase = useMemo(() => createClient(), []);

    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    async function loadSubscribers() {
        setIsLoading(true);

        const { data, error } = await supabase
            .from("email_subscribers")
            .select("id, email, source, is_active, created_at")
            .order("created_at", { ascending: false });

        if (error) {
            setMessage(`Error loading subscribers: ${error.message}`);
            setIsLoading(false);
            return;
        }

        setSubscribers(data ?? []);
        setIsLoading(false);
    }

    useEffect(() => {
        loadSubscribers();
    }, []);

    const activeSubscribers = subscribers.filter((sub) => sub.is_active);

    const emailList = activeSubscribers.map((sub) => sub.email).join(", ");

    async function copyEmails() {
        if (!emailList) {
            setMessage("No active subscriber emails to copy.");
            return;
        }

        await navigator.clipboard.writeText(emailList);
        setMessage("Active subscriber emails copied.");
    }

    return (
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        Newsletter Subscribers
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        View and copy emails collected from the DealSeal homepage.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={copyEmails}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Copy Emails
                    </button>

                    <button
                        type="button"
                        onClick={loadSubscribers}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {message && (
                <p className="mb-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {message}
                </p>
            )}

            {isLoading ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                    Loading subscribers...
                </p>
            ) : subscribers.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                    No subscribers yet.
                </p>
            ) : (
                <>
                    <div className="mb-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Total Subscribers
                            </p>
                            <p className="mt-1 text-3xl font-bold text-slate-900">
                                {subscribers.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Active Subscribers
                            </p>
                            <p className="mt-1 text-3xl font-bold text-slate-900">
                                {activeSubscribers.length}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Latest Signup
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {subscribers[0]?.email ?? "N/A"}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="py-3 pr-4 font-medium">Email</th>
                                    <th className="py-3 pr-4 font-medium">Source</th>
                                    <th className="py-3 pr-4 font-medium">Active</th>
                                    <th className="py-3 pr-4 font-medium">Signup Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {subscribers.map((subscriber) => (
                                    <tr key={subscriber.id} className="border-b border-slate-100">
                                        <td className="py-3 pr-4 font-medium text-slate-900">
                                            {subscriber.email}
                                        </td>

                                        <td className="py-3 pr-4 text-slate-700">
                                            {subscriber.source ?? "unknown"}
                                        </td>

                                        <td className="py-3 pr-4">
                                            {subscriber.is_active ? (
                                                <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                                    No
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3 pr-4 text-slate-700">
                                            {new Intl.DateTimeFormat("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "numeric",
                                                minute: "2-digit",
                                            }).format(new Date(subscriber.created_at))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}