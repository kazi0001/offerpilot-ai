"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleLogin(event: React.FormEvent) {
        event.preventDefault();
        setMessage("Signing in...");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setMessage(error.message);
            return;
        }

        router.push("/admin");
        router.refresh();
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="mx-auto max-w-md px-6 py-20">
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                        OfferPilot AI
                    </p>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Login</h1>
                    <p className="mt-2 text-slate-600">
                        Sign in to access the deal-entry dashboard.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="mb-5">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                        Sign In
                    </button>

                    {message && (
                        <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                            {message}
                        </p>
                    )}
                </form>
            </section>
        </main>
    );
}