import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WalmartItem = {
    itemId?: number | string;
    name?: string;
    salePrice?: number;
    price?: number;
    msrp?: number;
    listPrice?: number;
    productUrl?: string;
    productTrackingUrl?: string;
    affiliateUrl?: string;
    thumbnailImage?: string;
    largeImage?: string;
    mediumImage?: string;
    stock?: string;
    availableOnline?: boolean;
    categoryPath?: string;
};

type NormalizedDeal = {
    product_name: string;
    product_description: string | null;
    original_price: number | null;
    current_price: number;
    discount_percent: number;
    deal_score: number;
    deal_reason: string;
    product_url: string | null;
    affiliate_url: string | null;
    image_url: string | null;
    availability_status: string;
};

export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({}));

    const query = String(body.query || "household essentials");
    const limit = Number(body.limit || 10);

    const consumerId = process.env.WALMART_CONSUMER_ID;
    const keyVersion = process.env.WALMART_KEY_VERSION;
    const privateKeyRaw = process.env.WALMART_PRIVATE_KEY;
    const baseUrl =
        process.env.WALMART_API_BASE_URL ||
        "https://developer.api.walmart.com/api-proxy/service/affil/product/v2";

    if (!consumerId || !keyVersion || !privateKeyRaw) {
        return NextResponse.json(
            {
                error:
                    "Missing Walmart credentials. Check WALMART_CONSUMER_ID, WALMART_KEY_VERSION, and WALMART_PRIVATE_KEY.",
            },
            { status: 500 }
        );
    }

    const walmartSearchUrl = `${baseUrl}/search?query=${encodeURIComponent(
        query
    )}&numItems=${limit}`;

    const headers = generateWalmartHeaders({
        consumerId,
        keyVersion,
        privateKey: normalizePrivateKey(privateKeyRaw),
    });

    const walmartResponse = await fetch(walmartSearchUrl, {
        method: "GET",
        headers: {
            ...headers,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    const responseText = await walmartResponse.text();

    if (!walmartResponse.ok) {
        return NextResponse.json(
            {
                error: "Walmart API request failed.",
                status: walmartResponse.status,
                details: responseText.slice(0, 1000),
            },
            { status: 500 }
        );
    }

    let walmartData: any;

    try {
        walmartData = JSON.parse(responseText);
    } catch {
        return NextResponse.json(
            {
                error: "Walmart API returned non-JSON response.",
                details: responseText.slice(0, 1000),
            },
            { status: 500 }
        );
    }

    const rawItems: WalmartItem[] = Array.isArray(walmartData.items)
        ? walmartData.items
        : Array.isArray(walmartData)
            ? walmartData
            : [];

    if (rawItems.length === 0) {
        return NextResponse.json(
            {
                error: "No Walmart items found for this query.",
                raw_response_keys: Object.keys(walmartData ?? {}),
            },
            { status: 400 }
        );
    }

    const { data: retailer, error: retailerError } = await supabase
        .from("retailers")
        .select("id")
        .eq("slug", "walmart")
        .single();

    if (retailerError || !retailer) {
        return NextResponse.json(
            { error: "Walmart retailer record not found in Supabase." },
            { status: 500 }
        );
    }

    const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "household-essentials")
        .single();

    if (categoryError || !category) {
        return NextResponse.json(
            { error: "Household Essentials category record not found in Supabase." },
            { status: 500 }
        );
    }

    const normalizedDeals = rawItems
        .map((item) => normalizeWalmartItem(item))
        .filter((deal): deal is NormalizedDeal => deal !== null);

    const insertedDeals = [];
    const skippedDeals = [];

    for (const deal of normalizedDeals) {
        if (deal.product_url) {
            const { data: existingDeal } = await supabase
                .from("deals")
                .select("id")
                .eq("product_url", deal.product_url)
                .maybeSingle();

            if (existingDeal) {
                skippedDeals.push(deal.product_name);
                continue;
            }
        }

        const { data: inserted, error: insertError } = await supabase
            .from("deals")
            .insert({
                retailer_id: retailer.id,
                category_id: category.id,
                product_name: deal.product_name,
                product_description: deal.product_description,
                original_price: deal.original_price,
                current_price: deal.current_price,
                discount_percent: deal.discount_percent,
                deal_score: deal.deal_score,
                deal_reason: deal.deal_reason,
                product_url: deal.product_url,
                affiliate_url: deal.affiliate_url,
                image_url: deal.image_url,
                availability_status: deal.availability_status,
                price_checked_at: new Date().toISOString(),
                is_approved: false,
                is_featured: false,
            })
            .select("id, product_name")
            .single();

        if (insertError) {
            skippedDeals.push(`${deal.product_name} (${insertError.message})`);
            continue;
        }

        insertedDeals.push(inserted);
    }

    return NextResponse.json({
        message: "Walmart fetch completed.",
        query,
        fetched_count: rawItems.length,
        normalized_count: normalizedDeals.length,
        inserted_count: insertedDeals.length,
        skipped_count: skippedDeals.length,
        inserted_deals: insertedDeals,
        skipped_deals: skippedDeals,
    });
}

function normalizePrivateKey(privateKey: string) {
    return privateKey.replace(/\\n/g, "\n").trim();
}

function generateWalmartHeaders({
    consumerId,
    keyVersion,
    privateKey,
}: {
    consumerId: string;
    keyVersion: string;
    privateKey: string;
}) {
    const timestamp = Date.now().toString();

    const stringToSign = `${consumerId}\n${timestamp}\n${keyVersion}\n`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(stringToSign);
    signer.end();

    const signature = signer.sign(privateKey, "base64");

    return {
        "WM_CONSUMER.ID": consumerId,
        "WM_CONSUMER.INTIMESTAMP": timestamp,
        "WM_SEC.KEY_VERSION": keyVersion,
        "WM_SEC.AUTH_SIGNATURE": signature,
    };
}

function normalizeWalmartItem(item: WalmartItem): NormalizedDeal | null {
    const productName = item.name?.trim();

    const currentPrice = Number(item.salePrice ?? item.price ?? 0);
    const originalPriceRaw = Number(item.msrp ?? item.listPrice ?? 0);

    if (!productName || !currentPrice || currentPrice <= 0) {
        return null;
    }

    const originalPrice =
        originalPriceRaw > currentPrice ? originalPriceRaw : null;

    const discountPercent = calculateDiscount(originalPrice, currentPrice);

    const productUrl =
        item.productUrl ||
        item.productTrackingUrl ||
        item.affiliateUrl ||
        null;

    const affiliateUrl =
        item.productTrackingUrl ||
        item.affiliateUrl ||
        item.productUrl ||
        null;

    const imageUrl =
        item.largeImage ||
        item.mediumImage ||
        item.thumbnailImage ||
        null;

    const availabilityStatus = normalizeAvailability(item);

    const dealScore = calculateDealScore({
        discountPercent,
        hasAffiliateLink: Boolean(affiliateUrl),
        availabilityStatus,
    });

    const dealReason = generateDealReason({
        productName,
        discountPercent,
        currentPrice,
        originalPrice,
        availabilityStatus,
    });

    return {
        product_name: productName,
        product_description: item.categoryPath || null,
        original_price: originalPrice,
        current_price: currentPrice,
        discount_percent: discountPercent,
        deal_score: dealScore,
        deal_reason: dealReason,
        product_url: productUrl,
        affiliate_url: affiliateUrl,
        image_url: imageUrl,
        availability_status: availabilityStatus,
    };
}

function normalizeAvailability(item: WalmartItem) {
    if (item.availableOnline === false) return "out_of_stock";

    const stock = String(item.stock || "").toLowerCase();

    if (stock.includes("available") || stock.includes("in stock")) {
        return "available";
    }

    if (stock.includes("limited")) {
        return "limited";
    }

    if (stock.includes("out")) {
        return "out_of_stock";
    }

    return "unknown";
}

function calculateDiscount(original: number | null, current: number) {
    if (!original || original <= 0 || current <= 0 || current >= original) {
        return 0;
    }

    return Number((((original - current) / original) * 100).toFixed(2));
}

function calculateDealScore({
    discountPercent,
    hasAffiliateLink,
    availabilityStatus,
}: {
    discountPercent: number;
    hasAffiliateLink: boolean;
    availabilityStatus: string;
}) {
    let score = 45;

    if (discountPercent >= 50) score += 35;
    else if (discountPercent >= 40) score += 30;
    else if (discountPercent >= 25) score += 22;
    else if (discountPercent >= 15) score += 15;
    else if (discountPercent > 0) score += 8;

    score += 10; // Walmart household/general deal relevance

    if (hasAffiliateLink) score += 5;

    if (availabilityStatus === "limited") score += 5;
    if (availabilityStatus === "out_of_stock") score -= 25;
    if (availabilityStatus === "unknown") score -= 5;

    return Math.max(0, Math.min(Math.round(score), 100));
}

function generateDealReason({
    productName,
    discountPercent,
    currentPrice,
    originalPrice,
    availabilityStatus,
}: {
    productName: string;
    discountPercent: number;
    currentPrice: number;
    originalPrice: number | null;
    availabilityStatus: string;
}) {
    let valuePhrase = "may be worth reviewing";
    if (discountPercent >= 40) {
        valuePhrase = "stands out as a strong Walmart discount";
    } else if (discountPercent >= 25) {
        valuePhrase = "appears to offer a meaningful Walmart discount";
    } else if (discountPercent >= 15) {
        valuePhrase = "offers a useful Walmart savings opportunity";
    } else if (discountPercent > 0) {
        valuePhrase = "offers a modest Walmart discount";
    }

    const pricePhrase =
        originalPrice && originalPrice > currentPrice
            ? `The listed price is $${currentPrice.toFixed(
                2
            )}, down from $${originalPrice.toFixed(2)}.`
            : `The listed price is $${currentPrice.toFixed(2)}.`;

    const availabilityPhrase =
        availabilityStatus === "limited"
            ? " Availability appears limited, so it may be worth checking soon."
            : availabilityStatus === "out_of_stock"
                ? " Availability may be out of stock and should be verified before publishing."
                : "";

    return `${productName} ${valuePhrase} for shoppers looking for practical savings. ${pricePhrase}${availabilityPhrase}`;
}