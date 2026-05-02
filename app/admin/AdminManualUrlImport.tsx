"use client";

import { useState } from "react";

type ManualImportResponse = {
    message?: string;
    detected_retailer?: string;
    category?: string;
    discount_percent?: number;
    deal_score?: number;
    deal_reason?: string;
    error?: string;
    details?: string;
};

type MetadataResponse = {
    message?: string;
    metadata?: {
        title: string | null;
        description: string | null;
        imageUrl: string | null;
        canonicalUrl: string | null;
        detectedRetailer: string;
        detectedRetailerSlug: string;
    };
    error?: string;
    details?: string;
    note?: string;
};

export default function AdminManualUrlImport() {
    const [productUrl, setProductUrl] = useState("");
    const [productName, setProductName] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const [originalPrice, setOriginalPrice] = useState("");
    const [currentPrice, setCurrentPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [categorySlug, setCategorySlug] = useState("manual-imports");

    const [message, setMessage] = useState("");
    const [result, setResult] = useState<ManualImportResponse | null>(null);
    const [metadataMessage, setMetadataMessage] = useState("");
    const [metadataResult, setMetadataResult] =
        useState<MetadataResponse | null>(null);

    const [isImporting, setIsImporting] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);

    async function extractDetails() {
        setIsExtracting(true);
        setMetadataMessage("Extracting details from URL...");
        setMetadataResult(null);

        try {
            const response = await fetch("/api/agents/url-metadata", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productUrl,
                }),
            });

            const data: MetadataResponse = await response.json();

            if (!response.ok) {
                setMetadataMessage(data.error || "Metadata extraction failed.");
                setMetadataResult(data);
                return;
            }

            const metadata = data.metadata;

            if (metadata?.title && !productName.trim()) {
                setProductName(metadata.title);
            }

            if (metadata?.description && !productDescription.trim()) {
                setProductDescription(metadata.description);
            }

            if (metadata?.imageUrl && !imageUrl.trim()) {
                setImageUrl(metadata.imageUrl);
            }

            if (metadata?.canonicalUrl) {
                setProductUrl(metadata.canonicalUrl);
            }

            setMetadataMessage(
                `Details extracted. Detected retailer: ${metadata?.detectedRetailer ?? "Unknown"
                }. Please verify price fields before importing.`
            );

            setMetadataResult(data);
        } catch (error) {
            setMetadataMessage(
                error instanceof Error
                    ? `Unexpected error: ${error.message}`
                    : "Unexpected error while extracting URL details."
            );
        } finally {
            setIsExtracting(false);
        }
    }

    async function importDeal() {
        setIsImporting(true);
        setMessage("Importing manual URL deal...");
        setResult(null);

        try {
            const response = await fetch("/api/agents/manual-url-import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productUrl,
                    productName,
                    productDescription,
                    originalPrice: Number(originalPrice || 0),
                    currentPrice: Number(currentPrice || 0),
                    imageUrl,
                    categorySlug,
                }),
            });

            const data: ManualImportResponse = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Manual URL import failed.");
                setResult(data);
                return;
            }

            setMessage(
                "Manual URL deal imported. Review it below and approve if useful."
            );
            setResult(data);

            setProductUrl("");
            setProductName("");
            setProductDescription("");
            setOriginalPrice("");
            setCurrentPrice("");
            setImageUrl("");
            setCategorySlug("manual-imports");
            setMetadataMessage("");
            setMetadataResult(null);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? `Unexpected error: ${error.message}`
                    : "Unexpected error while importing manual URL deal."
            );
        } finally {
            setIsImporting(false);
        }
    }

    return (
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">
                    Manual URL Deal Import Agent
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Paste a real product URL from Walmart, Target, Amazon, Best Buy, Temu,
                    eBay, or another retailer. DealSense can extract basic metadata,
                    score the deal, and save it as pending for review.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Product URL
                    </label>
                    <input
                        value={productUrl}
                        onChange={(event) => setProductUrl(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        placeholder="https://www.walmart.com/ip/..."
                    />

                    <button
                        type="button"
                        onClick={extractDetails}
                        disabled={isExtracting || !productUrl.trim()}
                        className="mt-3 rounded-xl border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isExtracting ? "Extracting..." : "Extract Details from URL"}
                    </button>
                </div>

                {metadataMessage && (
                    <div className="md:col-span-2 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                        {metadataMessage}
                    </div>
                )}

                {metadataResult?.error && (
                    <div className="md:col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                        <p>Error: {metadataResult.error}</p>
                        {metadataResult.details && <p>Details: {metadataResult.details}</p>}
                        {metadataResult.note && <p>Note: {metadataResult.note}</p>}
                    </div>
                )}

                {metadataResult?.metadata && (
                    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <p>Detected retailer: {metadataResult.metadata.detectedRetailer}</p>
                        <p>
                            Extracted title:{" "}
                            {metadataResult.metadata.title ?? "Not available"}
                        </p>
                        <p>
                            Extracted image:{" "}
                            {metadataResult.metadata.imageUrl ? "Available" : "Not available"}
                        </p>
                    </div>
                )}

                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Product Name
                    </label>
                    <input
                        value={productName}
                        onChange={(event) => setProductName(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        placeholder="Example: Bounty Paper Towels"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Product Description
                    </label>
                    <textarea
                        value={productDescription}
                        onChange={(event) => setProductDescription(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        rows={3}
                        placeholder="Optional short description"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Original Price
                    </label>
                    <input
                        value={originalPrice}
                        onChange={(event) => setOriginalPrice(event.target.value)}
                        type="number"
                        step="0.01"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        placeholder="29.99"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Current Price
                    </label>
                    <input
                        value={currentPrice}
                        onChange={(event) => setCurrentPrice(event.target.value)}
                        type="number"
                        step="0.01"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        placeholder="19.99"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Category
                    </label>
                    <select
                        value={categorySlug}
                        onChange={(event) => setCategorySlug(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    >
                        <option value="manual-imports">Manual Imports</option>
                        <option value="clearance">Clearance</option>
                        <option value="household-essentials">Household Essentials</option>
                        <option value="electronics">Electronics</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Image URL
                    </label>
                    <input
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                        placeholder="Optional image URL"
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={importDeal}
                disabled={isImporting}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isImporting ? "Importing..." : "Import URL Deal"}
            </button>

            {message && (
                <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {message}
                </p>
            )}

            {result && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {result.error ? (
                        <>
                            <p className="text-red-700">Error: {result.error}</p>
                            {result.details && (
                                <p className="mt-1 text-red-700">Details: {result.details}</p>
                            )}
                        </>
                    ) : (
                        <>
                            <p>Retailer: {result.detected_retailer}</p>
                            <p>Category: {result.category}</p>
                            <p>Discount: {result.discount_percent}%</p>
                            <p>Deal Score: {result.deal_score}</p>
                            <p className="mt-2">{result.deal_reason}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}