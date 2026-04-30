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

type NewsletterItem = {
    id: string;
    rank_order: number | null;
    custom_summary: string | null;
    deals: {
        product_name: string;
        current_price: number;
        original_price: number | null;
        discount_percent: number | null;
        deal_score: number | null;
        affiliate_url: string | null;
        retailer: {
            name: string;
        } | null;
        category: {
            name: string;
        } | null;
    } | null;
};

export default async function NewsletterIssuePage({
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

    const { data: issueData, error: issueError } = await supabase
        .from("newsletter_issues")
        .select("id, title, issue_date, status, created_at")
        .eq("id", id)
        .single();

    if (issueError || !issueData) {
        return (
            <main className="min-h-screen bg-slate-50">
                <section className="mx-auto max-w-5xl px-6 py-10">
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                        <p className="text-slate-600">
                            Newsletter issue not found.
                        </p>

                        <a
                            href="/admin/newsletters"
                            className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                            Back to Newsletter Drafts
                        </a>
                    </div>
                </section>
            </main>
        );
    }

    const issue = issueData as NewsletterIssue;

    const { data: itemsData, error: itemsError } = await supabase
        .from("newsletter_items")
        .select(`
      id,
      rank_order,
      custom_summary,
      deals (
        product_name,
        current_price,
        original_price,
        discount_percent,
        deal_score,
        affiliate_url,
        retailer:retailers (
          name
        ),
        category:categories (
          name
        )
      )
    `)
        .eq("newsletter_issue_id", issue.id)
        .order("rank_order", { ascending: true });

    const items = (itemsData ?? []) as NewsletterItem[];
    const emailBody = buildEmailBody(issue, items);

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="mx-auto max-w-5xl px-6 py-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                            OfferPilot AI Admin
                        </p>

                        <h1 className="text-3xl font-bold text-slate-900">
                            Newsletter Preview
                        </h1>

                        <p className="mt-2 text-slate-600">
                            Review this newsletter draft before copying or sending it.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <a
                            href="/admin/newsletters"
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                        >
                            All Drafts
                        </a>

                        <a
                            href="/admin"
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                        >
                            Admin
                        </a>

                        <a
                            href="/logout"
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                            Logout
                        </a>
                    </div>
                </div>

                {itemsError && (
                    <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        Error loading newsletter items: {itemsError.message}
                    </div>
                )}

                <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Newsletter Draft
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900">
                        {issue.title}
                    </h2>

                    <p className="mt-2 text-sm text-slate-600">
                        Issue date: {issue.issue_date ?? "Not set"} | Status:{" "}
                        {issue.status ?? "draft"} | Items: {items.length}
                    </p>
                </div>

                <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-slate-900">
                        Selected Deals
                    </h2>

                    {items.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                            No deals were saved for this newsletter issue.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-xl border border-slate-200 p-4"
                                >
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="font-semibold text-slate-900">
                                            #{item.rank_order ?? "-"}{" "}
                                            {item.deals?.product_name ?? "Unknown product"}
                                        </h3>

                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                            Score {item.deals?.deal_score ?? "N/A"}
                                        </span>
                                    </div>

                                    <p className="mb-2 text-sm text-slate-600">
                                        Retailer: {item.deals?.retailer?.name ?? "Unknown"} |
                                        Category: {item.deals?.category?.name ?? "General"} |
                                        Price: $
                                        {Number(item.deals?.current_price ?? 0).toFixed(2)}
                                        {item.deals?.discount_percent !== null &&
                                            item.deals?.discount_percent !== undefined &&
                                            ` | ${Number(item.deals.discount_percent).toFixed(0)}% off`}
                                    </p>

                                    <p className="text-sm text-slate-700">
                                        {item.custom_summary ?? "No summary available."}
                                    </p>

                                    {item.deals?.affiliate_url && (
                                        <a
                                            href={item.deals.affiliate_url}
                                            target="_blank"
                                            rel="noopener noreferrer sponsored"
                                            className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900"
                                        >
                                            View deal
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="mb-2 text-xl font-semibold text-slate-900">
                        Copy-Ready Email Body
                    </h2>

                    <p className="mb-4 text-sm text-slate-500">
                        Copy this draft into Beehiiv, ConvertKit, Mailchimp, Resend, or
                        another email platform.
                    </p>

                    <textarea
                        readOnly
                        value={emailBody}
                        className="h-96 w-full rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-sm text-slate-800"
                    />
                </div>
            </section>
        </main>
    );
}

function buildEmailBody(issue: NewsletterIssue, items: NewsletterItem[]) {
    const lines: string[] = [];

    lines.push(issue.title);
    lines.push("");
    lines.push(
        "Here are this week’s selected OfferPilot AI deals, ranked by featured status and deal score."
    );
    lines.push("");

    items.forEach((item) => {
        const deal = item.deals;

        if (!deal) return;

        const priceText =
            deal.original_price && deal.original_price > deal.current_price
                ? `$${Number(deal.current_price).toFixed(2)} was $${Number(
                    deal.original_price
                ).toFixed(2)}`
                : `$${Number(deal.current_price).toFixed(2)}`;

        lines.push(
            `${item.rank_order ?? "-"}. ${deal.product_name} | ${deal.retailer?.name ?? "Retailer"
            }`
        );
        lines.push(`Price: ${priceText}`);
        lines.push(`Score: ${deal.deal_score ?? "N/A"}`);

        if (item.custom_summary) {
            lines.push(item.custom_summary);
        }

        if (deal.affiliate_url) {
            lines.push(`View deal: ${deal.affiliate_url}`);
        }

        lines.push("");
    });

    lines.push(
        "Disclosure: OfferPilot AI may earn a commission when you purchase through affiliate links, at no additional cost to you. Prices and availability can change. Always verify details on the retailer website."
    );

    return lines.join("\n");
}