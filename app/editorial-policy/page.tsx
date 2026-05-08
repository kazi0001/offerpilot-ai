export const metadata = {
    title: "Editorial Policy | DealSealUSA",
    description: "Editorial and deal review policy for DealSealUSA.",
};

export default function EditorialPolicyPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <section className="mx-auto max-w-4xl px-6 py-14">
                <a href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                    ← Back to DealSealUSA
                </a>

                <h1 className="mt-6 text-4xl font-black tracking-tight">
                    Editorial Policy
                </h1>

                <p className="mt-4 text-sm text-slate-500">
                    Last updated: May 2026
                </p>

                <div className="mt-8 space-y-8 rounded-3xl bg-white p-6 leading-7 text-slate-700 shadow-sm">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Purpose
                        </h2>
                        <p className="mt-3">
                            DealSealUSA is designed to help shoppers discover and compare
                            useful retail deals. Our content focuses on practical product
                            categories, clear retailer attribution, and transparent affiliate
                            disclosure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Deal review process
                        </h2>
                        <p className="mt-3">
                            Deals may be collected through retailer feeds, manual research,
                            affiliate tools, or AI-assisted workflows. Before publication, we
                            may review deal details such as product name, retailer, image,
                            price, discount, rating, availability, and relevance to users.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Deal score
                        </h2>
                        <p className="mt-3">
                            DealSealUSA may use an internal deal-quality score based on
                            available signals such as discount depth, product relevance,
                            customer rating, review strength, price attractiveness, and
                            availability. This score is a helpful ranking signal, not a
                            guarantee of product quality or final savings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Accuracy
                        </h2>
                        <p className="mt-3">
                            We aim to keep deal information useful and accurate, but retail
                            prices and availability can change quickly. Users should always
                            confirm the final offer on the retailer website before purchasing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Affiliate compensation
                        </h2>
                        <p className="mt-3">
                            DealSealUSA may earn commissions from qualifying purchases made
                            through affiliate links. Affiliate relationships do not add extra
                            cost to users. We disclose this relationship clearly on the site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Corrections
                        </h2>
                        <p className="mt-3">
                            If users identify outdated or incorrect information, they can
                            contact us at{" "}
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