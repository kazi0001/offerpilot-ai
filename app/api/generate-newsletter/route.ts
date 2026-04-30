import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

type Deal = {
    id: string;
    product_name: string;
    current_price: number;
    original_price: number | null;
    discount_percent: number | null;
    deal_score: number | null;
    deal_reason: string | null;
    is_featured: boolean;
    retailer: {
        name: string;
    } | null;
    category: {
        name: string;
    } | null;
};

export async function POST() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized. Please log in first." },
            { status: 401 }
        );
    }

    const { data: deals, error: dealsError } = await supabase
        .from("deals")
        .select(`
      id,
      product_name,
      current_price,
      original_price,
      discount_percent,
      deal_score,
      deal_reason,
      is_featured,
      retailer:retailers (
        name
      ),
      category:categories (
        name
      )
    `)
        .eq("is_approved", true)
        .order("is_featured", { ascending: false })
        .order("deal_score", { ascending: false })
        .limit(10);

    if (dealsError) {
        return NextResponse.json(
            { error: dealsError.message },
            { status: 500 }
        );
    }

    if (!deals || deals.length === 0) {
        return NextResponse.json(
            { error: "No approved deals found for newsletter generation." },
            { status: 400 }
        );
    }

    const today = new Date();

    const title = generateNewsletterTitle(today);
    const intro = generateNewsletterIntro(deals as Deal[]);

    const { data: issue, error: issueError } = await supabase
        .from("newsletter_issues")
        .insert({
            title,
            issue_date: today.toISOString().slice(0, 10),
            status: "draft",
        })
        .select("id, title, issue_date, status, created_at")
        .single();

    if (issueError || !issue) {
        return NextResponse.json(
            { error: issueError?.message || "Failed to create newsletter issue." },
            { status: 500 }
        );
    }

    const newsletterItems = (deals as Deal[]).map((deal, index) => ({
        newsletter_issue_id: issue.id,
        deal_id: deal.id,
        rank_order: index + 1,
        custom_summary: generateDealNewsletterSummary(deal, index + 1),
    }));

    const { error: itemsError } = await supabase
        .from("newsletter_items")
        .insert(newsletterItems);

    if (itemsError) {
        return NextResponse.json(
            { error: itemsError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({
        issue,
        intro,
        selected_deals: deals.length,
        message: "Newsletter draft generated successfully.",
    });
}

function generateNewsletterTitle(date: Date) {
    const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(date);

    return `OfferPilot Weekly Deals, ${formattedDate}`;
}

function generateNewsletterIntro(deals: Deal[]) {
    const featuredCount = deals.filter((deal) => deal.is_featured).length;
    const topRetailers = Array.from(
        new Set(deals.map((deal) => deal.retailer?.name).filter(Boolean))
    ).join(", ");

    return `This issue highlights ${deals.length} useful deals from ${topRetailers || "major retailers"
        }. ${featuredCount} featured deal${featuredCount === 1 ? " is" : "s are"
        } included, with selections ranked by featured status and OfferPilot deal score.`;
}

function generateDealNewsletterSummary(deal: Deal, rank: number) {
    const retailer = deal.retailer?.name ?? "the retailer";
    const category = deal.category?.name ?? "general shopping";

    const priceText =
        deal.original_price && deal.original_price > deal.current_price
            ? `$${Number(deal.current_price).toFixed(2)}, down from $${Number(
                deal.original_price
            ).toFixed(2)}`
            : `$${Number(deal.current_price).toFixed(2)}`;

    const discountText =
        deal.discount_percent !== null
            ? ` (${Number(deal.discount_percent).toFixed(0)}% off)`
            : "";

    return `#${rank}: ${deal.product_name} at ${retailer} is listed at ${priceText}${discountText}. This ${category.toLowerCase()} deal has an OfferPilot score of ${deal.deal_score ?? "N/A"
        }. ${deal.deal_reason ?? ""}`.trim();
}