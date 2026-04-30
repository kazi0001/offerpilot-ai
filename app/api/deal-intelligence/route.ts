import { NextResponse } from "next/server";

type DealInput = {
    productName: string;
    retailerName: string;
    categoryName: string;
    originalPrice: number;
    currentPrice: number;
    availabilityStatus: string;
    hasAffiliateLink: boolean;
    isFeatured: boolean;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as DealInput;

        const discountPercent = calculateDiscount(
            body.originalPrice,
            body.currentPrice
        );

        const dealScore = calculateDealScore({
            discountPercent,
            categoryName: body.categoryName,
            hasAffiliateLink: body.hasAffiliateLink,
            isFeatured: body.isFeatured,
            availabilityStatus: body.availabilityStatus,
        });

        const dealReason = generateDealReason({
            productName: body.productName,
            retailerName: body.retailerName,
            categoryName: body.categoryName,
            discountPercent,
            currentPrice: body.currentPrice,
            originalPrice: body.originalPrice,
            availabilityStatus: body.availabilityStatus,
        });

        return NextResponse.json({
            discount_percent: discountPercent,
            deal_score: dealScore,
            deal_reason: dealReason,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Failed to generate deal intelligence.",
            },
            { status: 500 }
        );
    }
}

function calculateDiscount(original: number, current: number) {
    if (!original || original <= 0 || current <= 0 || current >= original) {
        return 0;
    }

    return Number((((original - current) / original) * 100).toFixed(2));
}

function calculateDealScore({
    discountPercent,
    categoryName,
    hasAffiliateLink,
    isFeatured,
    availabilityStatus,
}: {
    discountPercent: number;
    categoryName: string;
    hasAffiliateLink: boolean;
    isFeatured: boolean;
    availabilityStatus: string;
}) {
    let score = 45;

    if (discountPercent >= 50) score += 35;
    else if (discountPercent >= 40) score += 30;
    else if (discountPercent >= 25) score += 22;
    else if (discountPercent >= 15) score += 15;
    else if (discountPercent > 0) score += 8;

    const highUtilityCategories = [
        "Household Essentials",
        "Groceries",
        "Electronics",
        "Seasonal",
    ];

    if (highUtilityCategories.includes(categoryName)) {
        score += 10;
    }

    if (hasAffiliateLink) score += 5;
    if (isFeatured) score += 5;

    if (availabilityStatus === "limited") score += 5;
    if (availabilityStatus === "out_of_stock") score -= 25;
    if (availabilityStatus === "unknown") score -= 5;

    return Math.max(0, Math.min(Math.round(score), 100));
}

function generateDealReason({
    productName,
    retailerName,
    categoryName,
    discountPercent,
    currentPrice,
    originalPrice,
    availabilityStatus,
}: {
    productName: string;
    retailerName: string;
    categoryName: string;
    discountPercent: number;
    currentPrice: number;
    originalPrice: number;
    availabilityStatus: string;
}) {
    const cleanProductName = productName.trim() || "This product";

    let valuePhrase = "may be worth considering";
    if (discountPercent >= 40) {
        valuePhrase = "stands out as a strong discount";
    } else if (discountPercent >= 25) {
        valuePhrase = "appears to offer a meaningful discount";
    } else if (discountPercent >= 15) {
        valuePhrase = "offers a useful savings opportunity";
    } else if (discountPercent > 0) {
        valuePhrase = "offers a modest discount";
    }

    let urgencyPhrase = "";
    if (availabilityStatus === "limited") {
        urgencyPhrase =
            " Availability appears limited, so it may be worth checking soon.";
    } else if (availabilityStatus === "out_of_stock") {
        urgencyPhrase =
            " However, availability should be verified because it may be out of stock.";
    }

    const pricePhrase =
        originalPrice > currentPrice && currentPrice > 0
            ? `The listed price is $${currentPrice.toFixed(
                2
            )}, down from $${originalPrice.toFixed(2)}.`
            : currentPrice > 0
                ? `The listed price is $${currentPrice.toFixed(2)}.`
                : "The current price should be verified before publishing.";

    return `${cleanProductName} at ${retailerName} ${valuePhrase} for shoppers interested in ${categoryName.toLowerCase()}. ${pricePhrase}${urgencyPhrase}`;
}