import crypto from "crypto";
import fs from "fs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const consumerId = process.env.WALMART_CONSUMER_ID;
        const keyVersion = process.env.WALMART_KEY_VERSION;
        const privateKeyPath = process.env.WALMART_PRIVATE_KEY_PATH;
        const privateKeyEnv = process.env.WALMART_PRIVATE_KEY;
        const baseUrl =
            process.env.WALMART_API_BASE_URL ||
            "https://developer.api.walmart.com/api-proxy/service/affil/product/v2";

        if (!consumerId || !keyVersion) {
            return NextResponse.json(
                {
                    ok: false,
                    step: "env-check",
                    error:
                        "Missing WALMART_CONSUMER_ID or WALMART_KEY_VERSION in .env.local.",
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
                    ok: false,
                    step: "private-key-check",
                    error:
                        "Could not read Walmart private key. Check WALMART_PRIVATE_KEY_PATH or WALMART_PRIVATE_KEY.",
                    privateKeyPath,
                },
                { status: 500 }
            );
        }

        const testQuery =
            new URL(request.url).searchParams.get("q") || "paper towels";

        const endpoint = `${baseUrl}/search?query=${encodeURIComponent(
            testQuery
        )}&numItems=5`;

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

        let parsedResponse: unknown = null;

        try {
            parsedResponse = JSON.parse(responseText);
        } catch {
            parsedResponse = {
                nonJsonResponsePreview: responseText.slice(0, 1000),
            };
        }

        if (!walmartResponse.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    step: "walmart-api-call",
                    status: walmartResponse.status,
                    statusText: walmartResponse.statusText,
                    endpoint,
                    credential_summary: {
                        consumerIdPrefix: consumerId.slice(0, 8),
                        keyVersion,
                        privateKeyLoaded: privateKey.startsWith("-----BEGIN"),
                    },
                    walmart_response: parsedResponse,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            ok: true,
            step: "walmart-api-call",
            message: "Walmart API authentication and search request succeeded.",
            query: testQuery,
            endpoint,
            credential_summary: {
                consumerIdPrefix: consumerId.slice(0, 8),
                keyVersion,
                privateKeyLoaded: privateKey.startsWith("-----BEGIN"),
            },
            walmart_response: parsedResponse,
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                step: "unexpected-server-error",
                error: error instanceof Error ? error.message : String(error),
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