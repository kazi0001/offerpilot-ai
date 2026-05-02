import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import AdminEditDealForm from "./AdminEditDealForm";

export const dynamic = "force-dynamic";

export default async function EditDealPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="mx-auto max-w-5xl px-6 py-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                            DealSeal Admin
                        </p>

                        <h1 className="text-3xl font-bold text-slate-900">Edit Deal</h1>

                        <p className="mt-2 text-slate-600">
                            Update deal details, prices, affiliate URL, approval status, and
                            homepage visibility.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <a
                            href="/admin"
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                        >
                            Back to Admin
                        </a>

                        <a
                            href="/"
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                            Homepage
                        </a>
                    </div>
                </div>

                <AdminEditDealForm dealId={id} />
            </section>
        </main>
    );
}