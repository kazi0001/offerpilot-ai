import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json().catch(() => ({}));
        const email = String(body.email || "").trim().toLowerCase();

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { error: "Please enter a valid email address." },
                { status: 400 }
            );
        }

        const { error } = await supabase.from("email_subscribers").insert({
            email,
            source: "homepage",
            is_active: true,
        });

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({
                    message: "You are already subscribed.",
                });
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: "Thanks for subscribing to DealSeal.",
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Unexpected error while subscribing.",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}