"use client";

import { useState } from "react";

export default function NewsletterSignup() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function subscribe(event: React.FormEvent) {
        event.preventDefault();

        setIsSubmitting(true);
        setMessage("Subscribing...");

        try {
            const response = await fetch("/api/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Subscription failed.");
                return;
            }

            setMessage(data.message || "Thanks for subscribing to DealSeal.");
            setEmail("");
        } catch {
            setMessage("Unexpected error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mt-12 rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
            <div className="grid gap-5 md:grid-cols-2 md:items-center">
                <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-300">
                        DealSeal Weekly
                    </p>

                    <h2 className="text-2xl font-bold">
                        Get useful deals in your inbox.
                    </h2>

                    <p className="mt-2 text-sm text-slate-300">
                        Join the DealSeal newsletter for curated Walmart, Target, Amazon,
                        and clearance deals.
                    </p>
                </div>

                <form onSubmit={subscribe} className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-slate-900"
                            required
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Joining..." : "Join Free"}
                        </button>
                    </div>

                    {message && <p className="text-sm text-slate-300">{message}</p>}

                    <p className="text-xs text-slate-400">
                        No spam. Unsubscribe anytime.
                    </p>
                </form>
            </div>
        </div>
    );
}