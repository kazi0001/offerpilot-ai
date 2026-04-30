"use client";

import { useState } from "react";

type NewsletterResponse = {
    issue?: {
        id: string;
        title: string;
        issue_date: string;
        status: string;
        created_at: string;
    };
    intro?: string;
    selected_deals?: number;
    message?: string;
    error?: string;
};

export default function AdminNewsletterGenerator() {
    const [message, setMessage] = useState("");
    const [newsletter, setNewsletter] = useState<NewsletterResponse | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    async function generateNewsletter() {
        setIsGenerating(true);
        setMessage("Generating newsletter draft...");
        setNewsletter(null);

        try {
            const response = await fetch("/api/generate-newsletter", {
                method: "POST",
            });

            const data: NewsletterResponse = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Failed to generate newsletter.");
                return;
            }

            setNewsletter(data);
            setMessage(data.message || "Newsletter draft generated.");
        } catch {
            setMessage("Unexpected error while generating newsletter.");
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        Newsletter Issue Generator
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Generate a weekly newsletter draft from the top approved deals.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={generateNewsletter}
                    disabled={isGenerating}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isGenerating ? "Generating..." : "Generate Newsletter"}
                </button>
            </div>

            {message && (
                <p className="mb-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {message}
                </p>
            )}

            {newsletter?.issue && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Draft Created
                    </p>

                    <h3 className="text-lg font-semibold text-slate-900">
                        {newsletter.issue.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                        Issue date: {newsletter.issue.issue_date} | Status:{" "}
                        {newsletter.issue.status} | Deals selected:{" "}
                        {newsletter.selected_deals}
                    </p>

                    {newsletter.intro && (
                        <p className="mt-4 text-sm text-slate-700">{newsletter.intro}</p>
                    )}
                </div>
            )}
        </div>
    );
}