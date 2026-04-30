import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import AdminDealForm from "./AdminDealForm";
import AdminDealList from "./AdminDealList";
import AdminNewsletterGenerator from "./AdminNewsletterGenerator";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                            OfferPilot AI Admin
                        </p>

                        <h1 className="text-3xl font-bold text-slate-900">
                            Admin Dashboard
                        </h1>

                        <p className="mt-2 text-slate-600">
                            Signed in as {user.email}. Add deals, manage existing deals, and
                            generate newsletter drafts.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <a
                            href="/admin/newsletters"
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                        >
                            Newsletter Preview
                        </a>

                        <a
                            href="/"
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                        >
                            Homepage
                        </a>

                        <a
                            href="/logout"
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                            Logout
                        </a>
                    </div>
                </div>

                <AdminDealForm />

                <AdminDealList />

                <AdminNewsletterGenerator />
            </section>
        </main>
    );
}