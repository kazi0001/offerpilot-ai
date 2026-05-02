import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type NewsletterIssue = {
    id: string;
    title: string;
    issue_date: string | null;
    status: string | null;
    created_at: string;
};

export default async function NewsletterListPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: issues, error } = await supabase
        .from("newsletter_issues")
        .select("id, title, issue_date, status, created_at")
        .order("created_at", { ascending: false });

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="mx-auto max-w-5xl px-6 py-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                            DealSeal Admin
                        </p>

                        <h1 className="text-3xl font-bold text-slate-900">
                            Newsletter Drafts
                        </h1>

                        <p className="mt-2 text-slate-600">
                            View all generated newsletter drafts and open any issue for preview.
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
                            href="/logout"
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                            Logout
                        </a>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        Error loading newsletter drafts: {error.message}
                    </div>
                )}

                {!issues || issues.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                        <p className="text-slate-600">
                            No newsletter drafts found yet. Go back to the admin page and generate one.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                All Newsletter Issues
                            </h2>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                                {issues.length} drafts
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                        <th className="py-3 pr-4 font-medium">Title</th>
                                        <th className="py-3 pr-4 font-medium">Issue Date</th>
                                        <th className="py-3 pr-4 font-medium">Status</th>
                                        <th className="py-3 pr-4 font-medium">Created</th>
                                        <th className="py-3 pr-4 font-medium">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {(issues as NewsletterIssue[]).map((issue) => (
                                        <tr key={issue.id} className="border-b border-slate-100">
                                            <td className="py-3 pr-4 font-medium text-slate-900">
                                                {issue.title}
                                            </td>

                                            <td className="py-3 pr-4 text-slate-700">
                                                {issue.issue_date ?? "Not set"}
                                            </td>

                                            <td className="py-3 pr-4">
                                                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                                                    {issue.status ?? "draft"}
                                                </span>
                                            </td>

                                            <td className="py-3 pr-4 text-slate-700">
                                                {new Intl.DateTimeFormat("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                }).format(new Date(issue.created_at))}
                                            </td>

                                            <td className="py-3 pr-4">
                                                <a
                                                    href={`/admin/newsletters/${issue.id}`}
                                                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                                                >
                                                    View
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}