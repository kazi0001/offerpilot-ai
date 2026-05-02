import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type ManualImportInput = {
    productUrl: string;
    productName: string;
    productDescription?: string;
    originalPrice?: number;
    currentPrice: number;
    imageUrl?: string;
    categorySlug?: string;
};

type RetailerMatch = {
    name: string;
    slug: string;
};

const retailerRules: { domain: string; retailer: RetailerMatch }[] = [
    { domain: "walmart.com", retailer: { name: "Walmart", slug: "walmart" } },
    { domain: "target.com", retailer: { name: "Target", slug: "target" } },
    { domain: "amazon.com", retailer: { name: "Amazon", slug: "amazon" } },
    { domain: "bestbuy.com", retailer: { name: "Best Buy", slug: "best-buy" } },
    { domain: "ebay.com", retailer: { name: "eBay", slug: "ebay" } },
    { domain: "temu.com", retailer: { name: "Temu", slug: "temu" } },
    {
        domain: "aliexpress.com",
        retailer: { name: "AliExpress", slug: "aliexpress" },
    },
];

export async function POST(request: Request) {
    try {
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

        const body = (await request.json()) as ManualImportInput;

        const productUrl = body.productUrl?.trim();
        const productName = body.productName?.trim();
        const currentPrice = Number(body.currentPrice || 0);
        const originalPrice = Number(body.originalPrice || 0);
        const categorySlug = body.categorySlug || "manual-imports";

        if (!productUrl || !isValidUrl(productUrl)) {
            return NextResponse.json(
                { error: "Please provide a valid product URL." },
                { status: 400 }
            );
        }

        if (!productName) {
            return NextResponse.json(
                { error: "Please provide a product name." },
                { status: 400 }
            );
        }

        if (!currentPrice || currentPrice <= 0) {
            return NextResponse.json(
                { error: "Please provide a valid current price." },
                { status: 400 }
            );
        }

        const detectedRetailer = detectRetailer(productUrl);

        const { data: retailer, error: retailerError } = await supabase
            .from("retailers")
            .select("id, name, slug")
            .eq("slug", detectedRetailer.slug)
            .limit(1);

        const retailerRow = retailer?.[0];

        if (retailerError || !retailerRow) {
            return NextResponse.json(
                {
                    error: `Retailer ${detectedRetailer.slug} not found in Supabase. Please seed retailers first.`,
                    details: retailerError?.message,
                },
                { status: 500 }
            );
        }

        const { data: category, error: categoryError } = await supabase
            .from("categories")
            .select("id, name, slug")
            .eq("slug", categorySlug)
            .limit(1);

        const categoryRow = category?.[0];

        if (categoryError || !categoryRow) {
            return NextResponse.json(
                {
                    error: `Category ${categorySlug} not found in Supabase. Please seed categories first.`,
                    details: categoryError?.message,
                },
                { status: 500 }
            );
        }

        const { data: existingDeal } = await supabase
            .from("deals")
            .select("id")
            .eq("product_url", productUrl)
            .maybeSingle();

        if (existingDeal) {
            return NextResponse.json(
                {
                    error: "This product URL already exists in the deals database.",
                },
                { status: 409 }
            );
        }

        const finalOriginalPrice =
            originalPrice > currentPrice ? originalPrice : null;

        const discountPercent = calculateDiscount(
            finalOriginalPrice,
            currentPrice
        );

        const dealScore = calculateDealScore({
            discountPercent,
            retailerSlug: detectedRetailer.slug,
            categorySlug,
        });

        const dealReason = generateDealReason({
            productName,
            retailerName: retailerRow.name,
            categoryName: categoryRow.name,
            discountPercent,
            currentPrice,
            originalPrice: finalOriginalPrice,
        });

        const { data: inserted, error: insertError } = await supabase
            .from("deals")
            .insert({
                retailer_id: retailerRow.id,
                category_id: categoryRow.id,
                product_name: productName,
                product_description: body.productDescription?.trim() || null,
                original_price: finalOriginalPrice,
                current_price: currentPrice,
                discount_percent: discountPercent,
                deal_score: dealScore,
                deal_reason: dealReason,
                product_url: productUrl,
                affiliate_url: productUrl,
                image_url:
                    body.imageUrl?.trim() ||
                    "https://placehold.co/400x300?text=DealSense+Manual+Deal",
                availability_status: "available",
                price_checked_at: new Date().toISOString(),
                is_approved: false,
                is_featured: false,
            })
            .select("id, product_name")
            .single();

        if (insertError) {
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Manual URL deal imported successfully.",
            detected_retailer: retailerRow.name,
            category: categoryRow.name,
            discount_percent: discountPercent,
            deal_score: dealScore,
            deal_reason: dealReason,
            inserted_deal: inserted,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Unexpected server error in manual URL import agent.",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

function isValidUrl(value: string) {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

function detectRetailer(productUrl: string): RetailerMatch {
    const hostname = new URL(productUrl).hostname.replace(/^www\./, "");

    const matched = retailerRules.find((rule) =>
        hostname.toLowerCase().includes(rule.domain)
    );

    return matched?.retailer ?? { name: "Other Retailer", slug: "other-retailer" };
}

function calculateDiscount(original: number | null, current: number) {
    if (!original || original <= 0 || current <= 0 || current >= original) {
        return 0;
    }

    return Number((((original - current) / original) * 100).toFixed(2));
}

function calculateDealScore({
    discountPercent,
    retailerSlug,
    categorySlug,
}: {
    discountPercent: number;
    retailerSlug: string;
    categorySlug: string;
}) {
    let score = 45;

    if (discountPercent >= 60) score += 38;
    else if (discountPercent >= 50) score += 35;
    else if (discountPercent >= 40) score += 30;
    else if (discountPercent >= 25) score += 22;
    else if (discountPercent >= 15) score += 15;
    else if (discountPercent > 0) score += 8;

    const trustedRetailers = ["walmart", "target", "amazon", "best-buy", "ebay"];
    if (trustedRetailers.includes(retailerSlug)) {
        score += 8;
    }

    const highIntentCategories = [
        "clearance",
        "household-essentials",
        "electronics",
        "manual-imports",
    ];

    if (highIntentCategories.includes(categorySlug)) {
        score += 5;
    }

    return Math.max(0, Math.min(Math.round(score), 100));
}

function generateDealReason({
    productName,
    retailerName,
    categoryName,
    discountPercent,
    currentPrice,
    originalPrice,
}: {
    productName: string;
    retailerName: string;
    categoryName: string;
    discountPercent: number;
    currentPrice: number;
    originalPrice: number | null;
}) {
    let valuePhrase = "may be worth reviewing";

    if (discountPercent >= 50) {
        valuePhrase = "stands out as a high-discount deal";
    } else if (discountPercent >= 30) {
        valuePhrase = "appears to offer a strong savings opportunity";
    } else if (discountPercent >= 15) {
        valuePhrase = "offers a useful discount";
    } else if (discountPercent > 0) {
        valuePhrase = "offers a modest discount";
    }

    const pricePhrase =
        originalPrice && originalPrice > currentPrice
            ? `The listed price is $${currentPrice.toFixed(
                2
            )}, down from $${originalPrice.toFixed(2)}.`
            : `The listed price is $${currentPrice.toFixed(2)}.`;

    return `${productName} at ${retailerName} ${valuePhrase} for shoppers interested in ${categoryName.toLowerCase()}. ${pricePhrase}`;
}