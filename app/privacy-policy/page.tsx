export const metadata = {
    title: "Privacy Policy | DealSealUSA",
    description: "Privacy Policy for DealSealUSA.",
};

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <section className="mx-auto max-w-4xl px-6 py-14">
                <a href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                    ← Back to DealSealUSA
                </a>

                <h1 className="mt-6 text-4xl font-black tracking-tight">
                    Privacy Policy
                </h1>

                <p className="mt-4 text-sm text-slate-500">
                    Last updated: May 2026
                </p>

                <div className="mt-8 space-y-8 rounded-3xl bg-white p-6 leading-7 text-slate-700 shadow-sm">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            1. Overview
                        </h2>
                        <p className="mt-3">
                            DealSealUSA operates a deal discovery website that helps users
                            find and compare retail offers. This Privacy Policy explains what
                            information we may collect, how we may use it, and how users can
                            contact us with privacy-related questions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            2. Information we may collect
                        </h2>
                        <p className="mt-3">
                            We may collect information that users voluntarily provide, such as
                            an email address submitted through a newsletter signup or contact
                            request. We may also collect basic website analytics, such as page
                            visits, device type, browser type, referral source, and general
                            usage patterns.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            3. How we use information
                        </h2>
                        <p className="mt-3">
                            We may use collected information to operate the website, improve
                            deal discovery, send newsletters if users subscribe, respond to
                            inquiries, monitor website performance, and protect the site from
                            abuse or technical issues.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            4. Affiliate links and third-party websites
                        </h2>
                        <p className="mt-3">
                            DealSealUSA may include affiliate links to third-party retailers.
                            When users click these links, they may be directed to external
                            websites with their own privacy policies, tracking practices, and
                            terms. We are not responsible for the privacy practices of third
                            party websites.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            5. Cookies and analytics
                        </h2>
                        <p className="mt-3">
                            The site may use cookies or similar technologies for analytics,
                            affiliate tracking, performance monitoring, and user experience
                            improvements. Users can manage cookie preferences through their
                            browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900">
                            6. Contact
                        </h2>
                        <p className="mt-3">
                            For privacy questions, contact us at{" "}
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