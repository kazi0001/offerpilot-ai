import crypto from "crypto";
import fs from "fs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WalmartItem = {
    itemId?: number | string;
    name?: string;
    salePrice?: number;
    msrp?: number;
    shortDescription?: string;
    longDescription?: string;
    brandName?: string;
    categoryPath?: string;
    thumbnailImage?: string;
    mediumImage?: string;
    largeImage?: string;
    productTrackingUrl?: string;
    affiliateAddToCartUrl?: string;
    stock?: string;
    availableOnline?: boolean;
    customerRating?: string;
    numReviews?: number;
    clearance?: boolean;
    rollBack?: boolean;
    limitedTimeDeal?: boolean;
    isDailyDeal?: boolean;
    extraSavings?: boolean;
};

type NormalizedWalmartDeal = {
    product_name: string;
    product_description: string | null;
    original_price: number | null;
    current_price: number;
    discount_percent: number;
    deal_score: number;
    deal_reason: string;
    product_url: string;
    affiliate_url: string | null;
    image_url: string | null;
    availability_status: string;
    category_slug: string;
};

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

        const body = await request.json().catch(() => ({}));

        const query = String(body.query || "paper towels").trim();
        const limit = Math.min(Math.max(Number(body.limit || 10), 1), 25);

        if (!query) {
            return NextResponse.json(
                { error: "Please provide a Walmart search query." },
                { status: 400 }
            );
        }

        const consumerId = process.env.WALMART_CONSUMER_ID;
        const keyVersion = process.env.WALMART_KEY_VERSION;
        const privateKeyPath = process.env.WALMART_PRIVATE_KEY_PATH;
        const privateKeyEnv = process.env.WALMART_PRIVATE_KEY;
        const publisherId = process.env.WALMART_PUBLISHER_ID;
        const baseUrl =
            process.env.WALMART_API_BASE_URL ||
            "https://developer.api.walmart.com/api-proxy/service/affil/product/v2";

        if (!consumerId || !keyVersion) {
            return NextResponse.json(
                {
                    error:
                        "Missing Walmart credentials. Check WALMART_CONSUMER_ID and WALMART_KEY_VERSION.",
                },
                { status: 500 }
            );
        }

        const privateKey = getPrivateKey({
            privateKeyPath,
            privateKeyEnv,
        });

        if (!privateKey) {
            return NextResponse.json(
                {
                    error:
                        "Could not read Walmart private key. Check WALMART_PRIVATE_KEY_PATH or WALMART_PRIVATE_KEY.",
                },
                { status: 500 }
            );
        }

        const endpoint = `${baseUrl}/search?query=${encodeURIComponent(
            query
        )}&numItems=${limit}`;

        const headers = generateWalmartHeaders({
            consumerId,
            keyVersion,
            privateKey,
        });

        const walmartResponse = await fetch(endpoint, {
            method: "GET",
            headers: {
                ...headers,
                Accept: "application/json",
            },
            cache: "no-store",
        });

        const responseText = await walmartResponse.text();

        let walmartData: any;

        try {
            walmartData = JSON.parse(responseText);
        } catch {
            return NextResponse.json(
                {
                    error: "Walmart returned a non-JSON response.",
                    details: responseText.slice(0, 1000),
                },
                { status: 500 }
            );
        }

        if (!walmartResponse.ok) {
            return NextResponse.json(
                {
                    error: "Walmart API request failed.",
                    status: walmartResponse.status,
                    walmart_response: walmartData,
                },
                { status: 500 }
            );
        }

        const items: WalmartItem[] = Array.isArray(walmartData.items)
            ? walmartData.items
            : [];

        if (items.length === 0) {
            return NextResponse.json(
                {
                    error: "No Walmart items found for this query.",
                    query,
                },
                { status: 400 }
            );
        }

        const { data: walmartRetailerRows, error: retailerError } = await supabase
            .from("retailers")
            .select("id")
            .eq("slug", "walmart")
            .limit(1);

        const walmartRetailer = walmartRetailerRows?.[0];

        if (retailerError || !walmartRetailer) {
            return NextResponse.json(
                {
                    error:
                        "Walmart retailer record not found. Please seed the Walmart retailer first.",
                    details: retailerError?.message,
                },
                { status: 500 }
            );
        }

        const normalizedDeals = items
            .map((item) =>
                normalizeWalmartItem({
                    item,
                    publisherId,
                })
            )
            .filter((deal): deal is NormalizedWalmartDeal => deal !== null);

        const insertedDeals = [];
        const skippedDeals = [];

        for (const deal of normalizedDeals) {
            const { data: categoryRows, error: categoryError } = await supabase
                .from("categories")
                .select("id")
                .eq("slug", deal.category_slug)
                .limit(1);

            const category = categoryRows?.[0];

            if (categoryError || !category) {
                skippedDeals.push(
                    `${deal.product_name}: category ${deal.category_slug} not found`
                );
                continue;
            }

            const { data: existingDeal } = await supabase
                .from("deals")
                .select("id")
                .eq("product_url", deal.product_url)
                .maybeSingle();

            if (existingDeal) {
                skippedDeals.push(`${deal.product_name}: already exists`);
                continue;
            }

            const { data: inserted, error: insertError } = await supabase
                .from("deals")
                .insert({
                    retailer_id: walmartRetailer.id,
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
                skippedDeals.push(`${deal.product_name}: ${insertError.message}`);
                continue;
            }

            insertedDeals.push(inserted);
        }

        return NextResponse.json({
            message: "Walmart Search Agent completed.",
            query,
            fetched_count: items.length,
            normalized_count: normalizedDeals.length,
            inserted_count: insertedDeals.length,
            skipped_count: skippedDeals.length,
            publisher_id_configured: Boolean(publisherId),
            inserted_deals: insertedDeals,
            skipped_deals: skippedDeals,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Unexpected server error in Walmart Search Agent.",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

function getPrivateKey({
    privateKeyPath,
    privateKeyEnv,
}: {
    privateKeyPath?: string;
    privateKeyEnv?: string;
}) {
    if (privateKeyEnv && privateKeyEnv.trim().length > 0) {
        return normalizePrivateKey(privateKeyEnv);
    }

    if (privateKeyPath && fs.existsSync(privateKeyPath)) {
        return normalizePrivateKey(fs.readFileSync(privateKeyPath, "utf8"));
    }

    return null;
}

function normalizePrivateKey(privateKey: string) {
    return privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n").trim();
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

    const keyObject = crypto.createPrivateKey({
        key: privateKey,
        format: "pem",
    });

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(stringToSign);
    signer.end();

    const signature = signer.sign(keyObject, "base64");

    return {
        "WM_CONSUMER.ID": consumerId,
        "WM_CONSUMER.INTIMESTAMP": timestamp,
        "WM_SEC.KEY_VERSION": keyVersion,
        "WM_SEC.AUTH_SIGNATURE": signature,
    };
}

function normalizeWalmartItem({
    item,
    publisherId,
}: {
    item: WalmartItem;
    publisherId?: string;
}): NormalizedWalmartDeal | null {
    const productName = item.name?.trim();
    const currentPrice = Number(item.salePrice || 0);

    if (!productName || !currentPrice || currentPrice <= 0 || !item.itemId) {
        return null;
    }

    const originalPrice =
        item.msrp && Number(item.msrp) > currentPrice
            ? Number(item.msrp)
            : null;

    const discountPercent = calculateDiscount(originalPrice, currentPrice);

    const productUrl = `https://www.walmart.com/ip/${item.itemId}`;

    const affiliateUrl = resolveWalmartAffiliateUrl({
        productTrackingUrl: item.productTrackingUrl,
        publisherId,
    });

    const imageUrl = item.largeImage || item.mediumImage || item.thumbnailImage || null;

    const availabilityStatus = normalizeAvailability(item);

    const categorySlug = inferCategorySlug(item);

    const dealScore = calculateDealScore({
        discountPercent,
        customerRating: item.customerRating,
        numReviews: item.numReviews,
        availabilityStatus,
        isRollback: Boolean(item.rollBack),
        isClearance: Boolean(item.clearance),
        isLimitedTimeDeal: Boolean(item.limitedTimeDeal),
        isDailyDeal: Boolean(item.isDailyDeal),
        extraSavings: Boolean(item.extraSavings),
        hasAffiliateUrl: Boolean(affiliateUrl),
    });

    const dealReason = generateDealReason({
        productName,
        brandName: item.brandName,
        categoryPath: item.categoryPath,
        discountPercent,
        currentPrice,
        originalPrice,
        customerRating: item.customerRating,
        numReviews: item.numReviews,
        availabilityStatus,
        isRollback: Boolean(item.rollBack),
        isClearance: Boolean(item.clearance),
        extraSavings: Boolean(item.extraSavings),
    });

    return {
        product_name: productName,
        product_description:
            cleanHtml(item.shortDescription || item.longDescription || item.categoryPath || "") ||
            null,
        original_price: originalPrice,
        current_price: currentPrice,
        discount_percent: discountPercent,
        deal_score: dealScore,
        deal_reason: dealReason,
        product_url: productUrl,
        affiliate_url: affiliateUrl,
        image_url: imageUrl,
        availability_status: availabilityStatus,
        category_slug: categorySlug,
    };
}

function resolveWalmartAffiliateUrl({
    productTrackingUrl,
    publisherId,
}: {
    productTrackingUrl?: string;
    publisherId?: string;
}) {
    if (!productTrackingUrl) return null;

    if (productTrackingUrl.includes("|PUBID|")) {
        if (!publisherId) return null;

        return productTrackingUrl.replace("|PUBID|", publisherId);
    }

    return productTrackingUrl;
}

function inferCategorySlug(item: WalmartItem) {
    const text = `${item.categoryPath || ""} ${item.name || ""}`.toLowerCase();

    if (item.clearance) return "clearance";

    if (
        text.includes("paper") ||
        text.includes("household") ||
        text.includes("cleaning") ||
        text.includes("laundry") ||
        text.includes("kitchen")
    ) {
        return "household-essentials";
    }

    if (
        text.includes("electronics") ||
        text.includes("phone") ||
        text.includes("laptop") ||
        text.includes("tablet") ||
        text.includes("tech")
    ) {
        return "electronics";
    }

    return "manual-imports";
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
    customerRating,
    numReviews,
    availabilityStatus,
    isRollback,
    isClearance,
    isLimitedTimeDeal,
    isDailyDeal,
    extraSavings,
    hasAffiliateUrl,
}: {
    discountPercent: number;
    customerRating?: string;
    numReviews?: number;
    availabilityStatus: string;
    isRollback: boolean;
    isClearance: boolean;
    isLimitedTimeDeal: boolean;
    isDailyDeal: boolean;
    extraSavings: boolean;
    hasAffiliateUrl: boolean;
}) {
    let score = 45;

    if (discountPercent >= 60) score += 38;
    else if (discountPercent >= 50) score += 35;
    else if (discountPercent >= 40) score += 30;
    else if (discountPercent >= 25) score += 22;
    else if (discountPercent >= 15) score += 15;
    else if (discountPercent > 0) score += 8;

    const rating = Number(customerRating || 0);

    if (rating >= 4.5) score += 8;
    else if (rating >= 4.0) score += 5;

    if (numReviews && numReviews >= 1000) score += 5;
    else if (numReviews && numReviews >= 100) score += 3;

    if (isClearance) score += 8;
    if (isRollback) score += 6;
    if (isLimitedTimeDeal) score += 6;
    if (isDailyDeal) score += 6;
    if (extraSavings) score += 4;
    if (hasAffiliateUrl) score += 5;

    if (availabilityStatus === "limited") score += 5;
    if (availabilityStatus === "out_of_stock") score -= 25;
    if (availabilityStatus === "unknown") score -= 5;

    return Math.max(0, Math.min(Math.round(score), 100));
}

function generateDealReason({
    productName,
    brandName,
    categoryPath,
    discountPercent,
    currentPrice,
    originalPrice,
    customerRating,
    numReviews,
    availabilityStatus,
    isRollback,
    isClearance,
    extraSavings,
}: {
    productName: string;
    brandName?: string;
    categoryPath?: string;
    discountPercent: number;
    currentPrice: number;
    originalPrice: number | null;
    customerRating?: string;
    numReviews?: number;
    availabilityStatus: string;
    isRollback: boolean;
    isClearance: boolean;
    extraSavings: boolean;
}) {
    const signals = [];

    if (isClearance) signals.push("clearance");
    if (isRollback) signals.push("rollback");
    if (extraSavings) signals.push("extra savings");

    const signalText =
        signals.length > 0
            ? ` It is marked with ${signals.join(", ")} signals.`
            : "";

    const priceText =
        originalPrice && originalPrice > currentPrice
            ? `The listed price is $${currentPrice.toFixed(
                2
            )}, down from $${originalPrice.toFixed(2)}.`
            : `The listed price is $${currentPrice.toFixed(2)}.`;

    const ratingText =
        customerRating && numReviews
            ? ` It has a Walmart customer rating of ${customerRating} from ${numReviews} reviews.`
            : "";

    const brandText = brandName ? `${brandName} ` : "";

    const categoryText = categoryPath
        ? ` This item appears under ${categoryPath}.`
        : "";

    const discountText =
        discountPercent > 0
            ? ` This represents an estimated ${discountPercent.toFixed(0)}% discount.`
            : "";

    const availabilityText =
        availabilityStatus === "available"
            ? " Availability is currently listed as available."
            : availabilityStatus === "limited"
                ? " Availability may be limited, so it should be checked soon."
                : availabilityStatus === "out_of_stock"
                    ? " This item may be out of stock and should be verified before publishing."
                    : " Availability should be verified before publishing.";

    return `${brandText}${productName} may be useful for shoppers comparing Walmart deals. ${priceText}${discountText}${ratingText}${signalText}${categoryText}${availabilityText}`;
}

function cleanHtml(value: string) {
    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}