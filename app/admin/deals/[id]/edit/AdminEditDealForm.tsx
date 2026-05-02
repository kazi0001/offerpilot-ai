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

type DealFormData = {
    retailer_id: string;
    category_id: string;
    product_name: string;
    product_description: string;
    original_price: string;
    current_price: string;
    product_url: string;
    affiliate_url: string;
    image_url: string;
    deal_reason: string;
    availability_status: string;
    is_approved: boolean;
    is_featured: boolean;
};

export default function AdminEditDealForm({ dealId }: { dealId: string }) {
    const supabase = useMemo(() => createClient(), []);

    const [retailers, setRetailers] = useState<Retailer[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<DealFormData>({
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
        is_approved: false,
        is_featured: false,
    });

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);

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

            const { data: dealData, error: dealError } = await supabase
                .from("deals")
                .select(`
          id,
          retailer_id,
          category_id,
          product_name,
          product_description,
          original_price,
          current_price,
          product_url,
          affiliate_url,
          image_url,
          deal_reason,
          availability_status,
          is_approved,
          is_featured
        `)
                .eq("id", dealId)
                .single();

            if (retailerError || categoryError || dealError || !dealData) {
                setMessage(
                    retailerError?.message ||
                    categoryError?.message ||
                    dealError?.message ||
                    "Could not load deal."
                );
                setIsLoading(false);
                return;
            }

            setRetailers(retailerData ?? []);
            setCategories(categoryData ?? []);

            setFormData({
                retailer_id: dealData.retailer_id ?? "",
                category_id: dealData.category_id ?? "",
                product_name: dealData.product_name ?? "",
                product_description: dealData.product_description ?? "",
                original_price:
                    dealData.original_price !== null && dealData.original_price !== undefined
                        ? String(dealData.original_price)
                        : "",
                current_price:
                    dealData.current_price !== null && dealData.current_price !== undefined
                        ? String(dealData.current_price)
                        : "",
                product_url: dealData.product_url ?? "",
                affiliate_url: dealData.affiliate_url ?? "",
                image_url: dealData.image_url ?? "",
                deal_reason: dealData.deal_reason ?? "",
                availability_status: dealData.availability_status ?? "available",
                is_approved: Boolean(dealData.is_approved),
                is_featured: Boolean(dealData.is_featured),
            });

            setIsLoading(false);
        }

        loadData();
    }, [dealId, supabase]);

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

    function calculateDiscount(original: number | null, current: number) {
        if (!original || original <= 0 || current <= 0 || current >= original) {
            return 0;
        }

        return Number((((original - current) / original) * 100).toFixed(2));
    }

    function calculateDealScore({
        discountPercent,
        hasAffiliateUrl,
        isFeatured,
        availabilityStatus,
    }: {
        discountPercent: number;
        hasAffiliateUrl: boolean;
        isFeatured: boolean;
        availabilityStatus: string;
    }) {
        let score = 45;

        if (discountPercent >= 60) score += 38;
        else if (discountPercent >= 50) score += 35;
        else if (discountPercent >= 40) score += 30;
        else if (discountPercent >= 25) score += 22;
        else if (discountPercent >= 15) score += 15;
        else if (discountPercent > 0) score += 8;

        if (hasAffiliateUrl) score += 7;
        if (isFeatured) score += 5;

        if (availabilityStatus === "limited") score += 5;
        if (availabilityStatus === "out_of_stock") score -= 25;
        if (availabilityStatus === "unknown") score -= 5;

        return Math.max(0, Math.min(Math.round(score), 100));
    }

    async function saveDeal(event: React.FormEvent) {
        event.preventDefault();
        setIsSaving(true);
        setMessage("Saving deal...");

        const originalPriceNumber = Number(formData.original_price || 0);
        const currentPriceNumber = Number(formData.current_price || 0);

        if (!formData.product_name.trim()) {
            setMessage("Product name is required.");
            setIsSaving(false);
            return;
        }

        if (!currentPriceNumber || currentPriceNumber <= 0) {
            setMessage("Current price must be greater than zero.");
            setIsSaving(false);
            return;
        }

        if (!formData.retailer_id || !formData.category_id) {
            setMessage("Retailer and category are required.");
            setIsSaving(false);
            return;
        }

        const finalOriginalPrice =
            originalPriceNumber > currentPriceNumber ? originalPriceNumber : null;

        const discountPercent = calculateDiscount(
            finalOriginalPrice,
            currentPriceNumber
        );

        const dealScore = calculateDealScore({
            discountPercent,
            hasAffiliateUrl: Boolean(formData.affiliate_url.trim()),
            isFeatured: formData.is_featured,
            availabilityStatus: formData.availability_status,
        });

        const { error } = await supabase
            .from("deals")
            .update({
                retailer_id: formData.retailer_id,
                category_id: formData.category_id,
                product_name: formData.product_name.trim(),
                product_description: formData.product_description.trim() || null,
                original_price: finalOriginalPrice,
                current_price: currentPriceNumber,
                discount_percent: discountPercent,
                deal_score: dealScore,
                product_url: formData.product_url.trim() || null,
                affiliate_url: formData.affiliate_url.trim() || null,
                image_url: formData.image_url.trim() || null,
                deal_reason: formData.deal_reason.trim() || null,
                availability_status: formData.availability_status,
                is_approved: formData.is_approved,
                is_featured: formData.is_featured,
                price_checked_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", dealId);

        if (error) {
            setMessage(`Error saving deal: ${error.message}`);
            setIsSaving(false);
            return;
        }

        setMessage("Deal updated successfully.");
        setIsSaving(false);
    }

    if (isLoading) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-slate-600">Loading deal...</p>
            </div>
        );
    }

    const hasAffiliateUrl = Boolean(formData.affiliate_url.trim());

    return (
        <form onSubmit={saveDeal} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 rounded-2xl bg-slate-50 p-5">
                <h2 className="text-xl font-semibold text-slate-900">
                    Deal Quality Summary
                </h2>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Affiliate URL
                        </p>
                        <p
                            className={`mt-1 text-lg font-bold ${hasAffiliateUrl ? "text-green-700" : "text-red-700"
                                }`}
                        >
                            {hasAffiliateUrl ? "Yes" : "No"}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Approved
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                            {formData.is_approved ? "Yes" : "No"}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Featured
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                            {formData.is_featured ? "Yes" : "No"}
                        </p>
                    </div>
                </div>
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
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
                    />
                    <p className="mt-1 text-xs text-slate-500">
                        Use your Walmart, Target, Amazon, or affiliate network tracking URL
                        here when available.
                    </p>
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
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                        Deal Reason
                    </label>
                    <textarea
                        name="deal_reason"
                        value={formData.deal_reason}
                        onChange={handleChange}
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
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

            <div className="mt-6 flex flex-wrap gap-3">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                >
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>

                <a
                    href="/admin"
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Cancel
                </a>

                <a
                    href={`/deal/${dealId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                    View Public Page
                </a>
            </div>

            {message && (
                <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {message}
                </p>
            )}
        </form>
    );
}