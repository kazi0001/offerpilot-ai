export const metadata = {
    title: "About DealSealUSA",
    description:
        "Learn about DealSealUSA, an AI-assisted deal discovery website for curated retail deals.",
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <section className="mx-auto max-w-4xl px-6 py-14">
                <a href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                    ← Back to DealSealUSA
                </a>

                <h1 className="mt-6 text-4xl font-black tracking-tight">
                    About DealSealUSA
                </h1>

                <p className="mt-6 text-lg leading-8 text-slate-700">
                    DealSealUSA is an AI-assisted deal discovery website built to help
                    shoppers find, compare, and verify useful retail deals from major
                    stores. Our goal is to reduce deal clutter and make it easier for
                    users to identify practical offers across everyday categories such as
                    household essentials, electronics, clearance items, seasonal products,
                    and consumer goods.
                </p>

                <p className="mt-5 text-lg leading-8 text-slate-700">
                    We organize deals using product information, retailer details, pricing,
                    discount signals, and deal-quality scores. Deals may be reviewed before
                    publication, and users are encouraged to verify price, availability,
                    shipping terms, and product details on the retailer website before
                    purchasing.
                </p>

                <p className="mt-5 text-lg leading-8 text-slate-700">
                    DealSealUSA may earn commissions when users purchase through affiliate
                    links, at no additional cost to the shopper. Our aim is to build a
                    transparent and useful shopping resource with clear disclosures,
                    curated recommendations, and a simple weekly deal newsletter.
                </p>

                <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-bold">What we focus on</h2>

                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
                        <li>Curated deals from trusted retailers</li>
                        <li>Clear product and retailer attribution</li>
                        <li>Helpful deal comparison and scoring</li>
                        <li>Transparent affiliate disclosures</li>
                        <li>Practical shopping categories for everyday users</li>
                    </ul>
                </div>
            </section>
        </main>
    );
}