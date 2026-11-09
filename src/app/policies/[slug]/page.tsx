import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { legalPolicies } from "@/data/legal-policies";
import "./legal.css";

export function generateStaticParams() { return legalPolicies.map((policy) => ({ slug: policy.slug })); }

const policyDescriptions: Record<string, string> = {
 privacy: "Learn how Journey with Jesus handles community comments, website information, and privacy choices.",
 terms: "Review the terms for using Journey with Jesus, including community submissions, moderation, and creative rights.",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
 const { slug } = await params;
 const policy = legalPolicies.find((item) => item.slug === slug);
 if (!policy) return {};
 return {
  title: policy.title,
  description: policyDescriptions[slug] ?? `${policy.title} for Journey with Jesus.`,
 };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params;
 const policy = legalPolicies.find((item) => item.slug === slug);
 if (!policy) notFound();
 return (
  <main
   id="main-content"
   className="page-width legal-policy-page"
   style={{ padding: "5rem 1rem", maxWidth: "850px", lineHeight: 1.75 }}
  >
   <p><Link href="/">Journey with Jesus</Link> / Policies</p>
   <h1>{policy.title}</h1>
   <p className="legal-policy-date">Last updated: November 6, 2026</p>
   {policy.sections.map((section) => (
    <section key={section.heading} style={{ marginTop: "2rem" }}>
     <h2>{section.heading}</h2>
     <p>{section.body}</p>
    </section>
   ))}
  </main>
 );
}
