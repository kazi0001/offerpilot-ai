export const metadata = {
    title: "Affiliate Disclosure | DealSealUSA",
    description: "Affiliate Disclosure for DealSealUSA.",
};

export default function AffiliateDisclosurePage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <section className="mx-auto max-w-4xl px-6 py-14">
                <a href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                    ← Back to DealSealUSA
                </a>

                <h1 className="mt-6 text-4xl font-black tracking-tight">
                    Affiliate Disclosure
                </h1>

                <p className="mt-4 text-sm text-slate-500">
                    Last updated: May 2026
                </p>

                <div className="mt-8 space-y-8 rounded-3xl bg-white p-6 leading-7 text-slate-700 shadow-sm">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Our affiliate relationship
                        </h2>
                        <p className="mt-3">
                            DealSealUSA may participate in affiliate marketing programs. This
                            means we may earn a commission when users click certain links on
                            our website and make a qualifying purchase from a retailer. This
                            does not add any extra cost to the user.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            How we select deals
                        </h2>
                        <p className="mt-3">
                            We aim to feature deals that appear useful, relevant, and
                            reasonably attractive based on available product information,
                            price signals, retailer details, discount information, and other
                            deal-quality indicators. Affiliate compensation may exist, but our
                            goal is to provide clear and useful shopping information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Verify before purchasing
                        </h2>
                        <p className="mt-3">
                            Product prices, availability, shipping costs, promotions, and
                            retailer terms can change quickly. Users should always confirm the
                            final price, product details, shipping terms, return policy, and
                            availability on the retailer website before making a purchase.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Contact
                        </h2>
                        <p className="mt-3">
                            For questions about our affiliate disclosure, contact us at{" "}
                            <a
                                href="mailto:support@dealsealusa.com"
                                className="font-semibold text-blue-700 hover:text-blue-900"
                            >
                                support@dealsealusa.com
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </section>
        </main>
    );
}