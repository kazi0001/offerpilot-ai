import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type MetadataResponse = {
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    canonicalUrl: string | null;
    detectedRetailer: string;
    detectedRetailerSlug: string;
};

const retailerRules = [
    { domain: "walmart.com", name: "Walmart", slug: "walmart" },
    { domain: "target.com", name: "Target", slug: "target" },
    { domain: "amazon.com", name: "Amazon", slug: "amazon" },
    { domain: "bestbuy.com", name: "Best Buy", slug: "best-buy" },
    { domain: "ebay.com", name: "eBay", slug: "ebay" },
    { domain: "temu.com", name: "Temu", slug: "temu" },
    { domain: "aliexpress.com", name: "AliExpress", slug: "aliexpress" },
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

        const body = await request.json().catch(() => ({}));
        const productUrl = String(body.productUrl || "").trim();

        if (!productUrl || !isValidUrl(productUrl)) {
            return NextResponse.json(
                { error: "Please provide a valid product URL." },
                { status: 400 }
            );
        }

        const response = await fetch(productUrl, {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: "Could not fetch product page metadata.",
                    status: response.status,
                    note: "Some retailers block automated metadata requests. You can still enter the fields manually.",
                },
                { status: 500 }
            );
        }

        const html = await response.text();
        const retailer = detectRetailer(productUrl);

        const metadata: MetadataResponse = {
            title:
                getMetaContent(html, "property", "og:title") ||
                getMetaContent(html, "name", "twitter:title") ||
                getTitleTag(html),
            description:
                getMetaContent(html, "property", "og:description") ||
                getMetaContent(html, "name", "description") ||
                getMetaContent(html, "name", "twitter:description"),
            imageUrl:
                getMetaContent(html, "property", "og:image") ||
                getMetaContent(html, "name", "twitter:image"),
            canonicalUrl: getCanonicalUrl(html) || productUrl,
            detectedRetailer: retailer.name,
            detectedRetailerSlug: retailer.slug,
        };

        return NextResponse.json({
            message: "Metadata extracted successfully.",
            metadata,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Unexpected server error while extracting metadata.",
                details: error instanceof Error ? error.message : String(error),
                note: "Some retailers block metadata extraction. Manual entry will still work.",
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

function detectRetailer(productUrl: string) {
    const hostname = new URL(productUrl).hostname.replace(/^www\./, "");

    const matched = retailerRules.find((rule) =>
        hostname.toLowerCase().includes(rule.domain)
    );

    return (
        matched ?? {
            name: "Other Retailer",
            slug: "other-retailer",
        }
    );
}

function getMetaContent(
    html: string,
    attributeName: "property" | "name",
    attributeValue: string
) {
    const escapedAttributeValue = escapeRegex(attributeValue);

    const regex1 = new RegExp(
        `<meta[^>]*${attributeName}=["']${escapedAttributeValue}["'][^>]*content=["']([^"']*)["'][^>]*>`,
        "i"
    );

    const regex2 = new RegExp(
        `<meta[^>]*content=["']([^"']*)["'][^>]*${attributeName}=["']${escapedAttributeValue}["'][^>]*>`,
        "i"
    );

    const match = html.match(regex1) || html.match(regex2);

    return match?.[1] ? decodeHtml(match[1].trim()) : null;
}

function getTitleTag(html: string) {
    const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
    return match?.[1] ? cleanText(decodeHtml(match[1])) : null;
}

function getCanonicalUrl(html: string) {
    const match = html.match(
        /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i
    );

    return match?.[1] ? decodeHtml(match[1].trim()) : null;
}

function cleanText(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
    return value
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, " ");
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}