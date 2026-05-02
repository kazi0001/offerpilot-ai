"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseBrowser";

type Retailer = {
    id: string;
    name: string;
    slug: string;
};

type Category = {
    id: string;
    name: string;
    slug: string;
};

type DealIntelligence = {
    discount_percent: number;
    deal_score: number;
    deal_reason: string;
};

export default function AdminDealForm() {
    const supabase = useMemo(() => createClient(), []);

    const [retailers, setRetailers] = useState<Retailer[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [message, setMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const [aiOutput, setAiOutput] = useState<DealIntelligence | null>(null);

    const [formData, setFormData] = useState({
        retailer_id: "",
        category_id: "",
        product_name: "",
        product_description: "",
        original_price: "",
        current_price: "",
        product_url: "",
        affiliate_url: "",
        image_url: "",
        deal_reason: "",
        availability_status: "available",
        is_approved: true,
        is_featured: false,
    });

    useEffect(() => {
        async function loadOptions() {
            const { data: retailerData, error: retailerError } = await supabase
                .from("retailers")
                .select("id, name, slug")
                .eq("is_active", true)
                .order("name");

            const { data: categoryData, error: categoryError } = await supabase
                .from("categories")
                .select("id, name, slug")
                .eq("is_active", true)
                .order("name");

            if (retailerError || categoryError) {
                setMessage(
                    `Error loading options: ${retailerError?.message || categoryError?.message
                    }`
                );
                return;
            }

            setRetailers(retailerData ?? []);
            setCategories(categoryData ?? []);
        }

        loadOptions();
    }, [supabase]);

    const selectedRetailer = retailers.find(
        (retailer) => retailer.id === formData.retailer_id
    );

    const selectedCategory = categories.find(
        (category) => category.id === formData.category_id
    );

    function handleChange(
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) {
        const { name, value, type } = event.target;

        if (type === "checkbox") {
            const checked = (event.target as HTMLInputElement).checked;
            setFormData((prev) => ({
                ...prev,
                [name]: checked,
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function requestDealIntelligence(): Promise<DealIntelligence | null> {
        const originalPrice = Number(formData.original_price);
        const currentPrice = Number(formData.current_price);

        if (!formData.product_name.trim() || !currentPrice) {
            setMessage("Please enter product name and current price first.");
            return null;
        }

        if (!selectedRetailer || !selectedCategory) {
            setMessage("Please select a retailer and category first.");
            return null;
        }

        try {
            setIsGenerating(true);
            setMessage("Generating deal intelligence...");

            const response = await fetch("/api/deal-intelligence", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productName: formData.product_name.trim(),
                    retailerName: selectedRetailer.name,
                    categoryName: selectedCategory.name,
                    originalPrice,
                    currentPrice,
                    availabilityStatus: formData.availability_status,
                    hasAffiliateLink: Boolean(formData.affiliate_url.trim()),
                    isFeatured: formData.is_featured,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                setMessage(
                    errorData?.error || "Failed to generate deal intelligence."
                );
                return null;
            }

            const data: DealIntelligence = await response.json();
            setAiOutput(data);
            setMessage("Deal intelligence generated successfully.");
            return data;
        } catch (error) {
            setMessage("Unexpected error while generating deal intelligence.");
            return null;
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleGenerateAI() {
        const intelligence = await requestDealIntelligence();

        if (!intelligence) return;

        setFormData((prev) => ({
            ...prev,
            deal_reason: intelligence.deal_reason,
        }));

        setMessage(
            "AI-generated reason applied. You can still edit it before submitting."
        );
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setMessage("Submitting deal...");

        const originalPrice = Number(formData.original_price);
        const currentPrice = Number(formData.current_price);

        if (!formData.retailer_id || !formData.category_id) {
            setMessage("Please select a retailer and category.");
            return;
        }

        if (!formData.product_name.trim() || !currentPrice) {
            setMessage("Please enter product name and current price.");
            return;
        }

        // Always get fresh backend-generated intelligence before saving
        const intelligence = await requestDealIntelligence();

        if (!intelligence) {
            return;
        }

        const finalDealReason =
            formData.deal_reason.trim() || intelligence.deal_reason;

        const { error } = await supabase.from("deals").insert({
            retailer_id: formData.retailer_id,
            category_id: formData.category_id,
            product_name: formData.product_name.trim(),
            product_description: formData.product_description.trim() || null,
            original_price: originalPrice || null,
            current_price: currentPrice,
            discount_percent: intelligence.discount_percent,
            deal_score: intelligence.deal_score,
            deal_reason: finalDealReason,
            product_url: formData.product_url.trim() || null,
            affiliate_url: formData.affiliate_url.trim() || null,
            image_url: formData.image_url.trim() || null,
            availability_status: formData.availability_status,
            price_checked_at: new Date().toISOString(),
            is_approved: formData.is_approved,
            is_featured: formData.is_featured,
        });

        if (error) {
            setMessage(`Error adding deal: ${error.message}`);
            return;
        }

        setMessage("Deal added successfully. Refresh the homepage to see it.");
        setAiOutput(null);

        setFormData({
            retailer_id: "",
            category_id: "",
            product_name: "",
            product_description: "",
            original_price: "",
            current_price: "",
            product_url: "",
            affiliate_url: "",
            image_url: "",
            deal_reason: "",
            availability_status: "available",
            is_approved: true,
            is_featured: false,
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow-sm"
        >
            <div className="mb-6 rounded-2xl bg-blue-50 p-5">
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                    AI Deal Intelligence
                </h2>
                <p className="mb-4 text-sm text-slate-600">
                    DealSeal uses the backend intelligence route to estimate discount,
                    score the deal, and generate a suggested explanation.
                </p>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            AI Discount
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {aiOutput ? `${aiOutput.discount_percent.toFixed(0)}%` : "—"}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            AI Deal Score
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {aiOutput ? aiOutput.deal_score : "—"}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Selected Source
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {selectedRetailer?.name ?? "Retailer not selected"}
                        </p>
                        <p className="text-xs text-slate-500">
                            {selectedCategory?.name ?? "Category not selected"}
                        </p>
                    </div>
                </div>

                {aiOutput && (
                    <div className="mt-4 rounded-xl bg-white p-4">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                            AI Suggested Reason
                        </p>
                        <p className="text-sm text-slate-700">{aiOutput.deal_reason}</p>
                    </div>
                )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Retailer
                    </label>
                    <select
                        name="retailer_id"
                        value={formData.retailer_id}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    >
                        <option value="">Select retailer</option>
                        {retailers.map((retailer) => (
                            <option key={retailer.id} value={retailer.id}>
                                {retailer.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Category
                    </label>
                    <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Product Name
                    </label>
                    <input
                        name="product_name"
                        value={formData.product_name}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Example: Tide Laundry Detergent"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Product Description
                    </label>
                    <textarea
                        name="product_description"
                        value={formData.product_description}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        rows={3}
                        placeholder="Brief product description"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Original Price
                    </label>
                    <input
                        name="original_price"
                        type="number"
                        step="0.01"
                        value={formData.original_price}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="24.99"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Current Price
                    </label>
                    <input
                        name="current_price"
                        type="number"
                        step="0.01"
                        value={formData.current_price}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="18.99"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Product URL
                    </label>
                    <input
                        name="product_url"
                        value={formData.product_url}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="https://www.walmart.com/..."
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Affiliate URL
                    </label>
                    <input
                        name="affiliate_url"
                        value={formData.affiliate_url}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="Affiliate tracking link"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Image URL
                    </label>
                    <input
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        placeholder="https://placehold.co/400x300?text=OfferPilot+Deal"
                    />
                </div>

                <div className="md:col-span-2">
                    <div className="mb-1 flex items-center justify-between gap-3">
                        <label className="block text-sm font-medium text-slate-700">
                            Deal Reason
                        </label>

                        <button
                            type="button"
                            onClick={handleGenerateAI}
                            disabled={isGenerating}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isGenerating ? "Generating..." : "Generate AI Reason"}
                        </button>
                    </div>

                    <textarea
                        name="deal_reason"
                        value={formData.deal_reason}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        rows={4}
                        placeholder="Click Generate AI Reason or write your own explanation."
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Availability Status
                    </label>
                    <select
                        name="availability_status"
                        value={formData.availability_status}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    >
                        <option value="available">available</option>
                        <option value="limited">limited</option>
                        <option value="out_of_stock">out_of_stock</option>
                        <option value="unknown">unknown</option>
                    </select>
                </div>

                <div className="flex items-center gap-6 pt-6">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            name="is_approved"
                            checked={formData.is_approved}
                            onChange={handleChange}
                        />
                        Approved
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            name="is_featured"
                            checked={formData.is_featured}
                            onChange={handleChange}
                        />
                        Featured
                    </label>
                </div>
            </div>

            <button
                type="submit"
                className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
                Add Deal
            </button>

            {message && (
                <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {message}
                </p>
            )}
        </form>
    );
}