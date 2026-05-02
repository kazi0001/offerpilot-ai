import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type DummyProduct = {
    id: number;
    title: string;
    description: string;
    category: string;
    price: number;
    discountPercentage?: number;
    thumbnail?: string;
    images?: string[];
    stock?: number;
};

type NormalizedDeal = {
    product_name: string;
    product_description: string | null;
    original_price: number | null;
    current_price: number;
    discount_percent: number;
    deal_score: number;
    deal_reason: string;
    product_url: string;
    affiliate_url: string;
    image_url: string | null;
    availability_status: string;
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
        const limit = Number(body.limit || 10);
        const searchTerm = String(body.categorySlug || "smartphone");

        const demoUrl = `https://dummyjson.com/products/search?q=${encodeURIComponent(
            searchTerm
        )}&limit=${limit}`;

        const response = await fetch(demoUrl, {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: "Demo product API request failed.",
                    status: response.status,
                },
                { status: 500 }
            );
        }

        const data = await response.json();

        const products: DummyProduct[] = Array.isArray(data.products)
            ? data.products
            : [];

        if (products.length === 0) {
            return NextResponse.json(
                {
                    error: "No demo products found for this search term.",
                    searchTerm,
                    demoUrl,
                },
                { status: 400 }
            );
        }

        const { data: retailer, error: retailerError } = await supabase
            .from("retailers")
            .select("id")
            .eq("slug", "demo-store")
            .single();

        if (retailerError || !retailer) {
            return NextResponse.json(
                {
                    error:
                        "Demo Store retailer not found. Please seed demo retailer in Supabase first.",
                    details: retailerError?.message,
                },
                { status: 500 }
            );
        }

        const { data: category, error: categoryError } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", "electronics")
            .single();

        if (categoryError || !category) {
            return NextResponse.json(
                {
                    error:
                        "Electronics category not found. Please seed demo categories in Supabase first.",
                    details: categoryError?.message,
                },
                { status: 500 }
            );
        }

        const normalizedDeals = products
            .map((product) => normalizeDummyProduct(product))
            .filter((deal): deal is NormalizedDeal => deal !== null);

        const insertedDeals = [];
        const skippedDeals = [];

        for (const deal of normalizedDeals) {
            const { data: existingDeal } = await supabase
                .from("deals")
                .select("id")
                .eq("product_url", deal.product_url)
                .maybeSingle();

            if (existingDeal) {
                skippedDeals.push(`${deal.product_name} already exists`);
                continue;
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
                skippedDeals.push(`${deal.product_name}: ${insertError.message}`);
                continue;
            }

            insertedDeals.push(inserted);
        }

        return NextResponse.json({
            message: "Demo fetch agent completed.",
            source: "DummyJSON Products API",
            searchTerm,
            fetched_count: products.length,
            normalized_count: normalizedDeals.length,
            inserted_count: insertedDeals.length,
            skipped_count: skippedDeals.length,
            inserted_deals: insertedDeals,
            skipped_deals: skippedDeals,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Unexpected server error in demo fetch route.",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

function normalizeDummyProduct(product: DummyProduct): NormalizedDeal | null {
    const productName = product.title?.trim();
    const currentPrice = Number(product.price ?? 0);
    const discountPercent = Number(product.discountPercentage ?? 0);

    if (!productName || !currentPrice || currentPrice <= 0) {
        return null;
    }

    const originalPrice =
        discountPercent > 0
            ? Number((currentPrice / (1 - discountPercent / 100)).toFixed(2))
            : null;

    const productUrl = `https://dummyjson.com/products/${product.id}`;

    const imageUrl =
        product.thumbnail ||
        product.images?.[0] ||
        "https://placehold.co/400x300?text=DealSeal+Demo";

    const availabilityStatus =
        product.stock !== undefined && product.stock <= 0
            ? "out_of_stock"
            : product.stock !== undefined && product.stock < 10
                ? "limited"
                : "available";

    const dealScore = calculateDealScore({
        discountPercent,
        availabilityStatus,
    });

    const dealReason = generateDealReason({
        productName,
        categoryName: product.category,
        discountPercent,
        currentPrice,
        originalPrice,
        availabilityStatus,
    });

    return {
        product_name: productName,
        product_description: product.description || null,
        original_price: originalPrice,
        current_price: currentPrice,
        discount_percent: Number(discountPercent.toFixed(2)),
        deal_score: dealScore,
        deal_reason: dealReason,
        product_url: productUrl,
        affiliate_url: productUrl,
        image_url: imageUrl,
        availability_status: availabilityStatus,
    };
}

function calculateDealScore({
    discountPercent,
    availabilityStatus,
}: {
    discountPercent: number;
    availabilityStatus: string;
}) {
    let score = 45;

    if (discountPercent >= 50) score += 35;
    else if (discountPercent >= 40) score += 30;
    else if (discountPercent >= 25) score += 22;
    else if (discountPercent >= 15) score += 15;
    else if (discountPercent > 0) score += 8;

    score += 5;

    if (availabilityStatus === "limited") score += 5;
    if (availabilityStatus === "out_of_stock") score -= 25;

    return Math.max(0, Math.min(Math.round(score), 100));
}

function generateDealReason({
    productName,
    categoryName,
    discountPercent,
    currentPrice,
    originalPrice,
    availabilityStatus,
}: {
    productName: string;
    categoryName: string;
    discountPercent: number;
    currentPrice: number;
    originalPrice: number | null;
    availabilityStatus: string;
}) {
    let valuePhrase = "may be worth reviewing";

    if (discountPercent >= 40) {
        valuePhrase = "stands out as a strong discount";
    } else if (discountPercent >= 25) {
        valuePhrase = "appears to offer a meaningful discount";
    } else if (discountPercent >= 15) {
        valuePhrase = "offers a useful savings opportunity";
    } else if (discountPercent > 0) {
        valuePhrase = "offers a modest discount";
    }

    const pricePhrase =
        originalPrice && originalPrice > currentPrice
            ? `The listed price is $${currentPrice.toFixed(
                2
            )}, compared with an estimated original price of $${originalPrice.toFixed(
                2
            )}.`
            : `The listed price is $${currentPrice.toFixed(2)}.`;

    const availabilityPhrase =
        availabilityStatus === "limited"
            ? " Availability appears limited, so it may be worth reviewing soon."
            : availabilityStatus === "out_of_stock"
                ? " Availability may be out of stock and should be verified before publishing."
                : "";

    return `${productName} ${valuePhrase} for shoppers interested in ${categoryName}. ${pricePhrase}${availabilityPhrase}`;
}