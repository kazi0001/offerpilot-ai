export const metadata = {
    title: "Contact DealSealUSA",
    description: "Contact DealSealUSA for questions, corrections, or partnership inquiries.",
};

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <section className="mx-auto max-w-4xl px-6 py-14">
                <a href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                    ← Back to DealSealUSA
                </a>

                <h1 className="mt-6 text-4xl font-black tracking-tight">
                    Contact DealSealUSA
                </h1>

                <p className="mt-6 text-lg leading-8 text-slate-700">
                    Have a question, correction, partnership inquiry, or issue with a
                    listed deal? Please contact us using the email below.
                </p>

                <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-bold">Email</h2>

                    <p className="mt-4 text-lg text-slate-700">
                        General support:
                    </p>

                    <a
                        href="mailto:support@dealsealusa.com"
                        className="mt-2 inline-block text-lg font-bold text-blue-700 hover:text-blue-900"
                    >
                        support@dealsealusa.com
                    </a>

                    <p className="mt-6 text-sm leading-6 text-slate-500">
                        If your domain email is still being configured, messages may be
                        forwarded to our administrative inbox. We aim to respond as soon as
                        reasonably possible.
                    </p>
                </div>

                <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-bold">Deal corrections</h2>

                    <p className="mt-4 leading-7 text-slate-700">
                        Prices, availability, shipping details, and promotions can change
                        quickly. If you notice an outdated or incorrect listing, please send
                        us the product name, retailer, and page link so we can review it.
                    </p>
                </div>
            </section>
        </main>
    );
}