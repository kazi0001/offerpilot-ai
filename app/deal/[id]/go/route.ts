import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: deal, error: dealError } = await supabase
        .from("deals")
        .select(`
      id,
      retailer_id,
      product_url,
      affiliate_url,
      is_approved
    `)
        .eq("id", id)
        .single();

    if (dealError || !deal) {
        console.error("Deal lookup failed:", dealError?.message);
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (!deal.is_approved) {
        console.error("Deal is not approved:", id);
        return NextResponse.redirect(new URL("/", request.url));
    }

    const destinationUrl = deal.affiliate_url || deal.product_url || "/";

    const { error: clickError } = await supabase.from("clicks").insert({
        deal_id: deal.id,
        retailer_id: deal.retailer_id,
        source: "homepage",
        device_type: getDeviceType(request),
    });

    if (clickError) {
        console.error("Click insert failed:", clickError.message);
    } else {
        console.log("Click recorded for deal:", deal.id);
    }

    return NextResponse.redirect(destinationUrl);
}

function getDeviceType(request: Request) {
    const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";

    if (userAgent.includes("mobile")) return "mobile";
    if (userAgent.includes("tablet") || userAgent.includes("ipad")) return "tablet";

    return "desktop";
}