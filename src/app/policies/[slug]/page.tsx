import Link from "next/link";
import { notFound } from "next/navigation";
import { legalPolicies } from "@/data/legal-policies";
export function generateStaticParams() { return legalPolicies.map((policy) => ({ slug: policy.slug })); }
export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params;
 const policy = legalPolicies.find((item) => item.slug === slug);
 if (!policy) notFound();
 return <main id="main-content" className="page-width" style={{padding:"5rem 1rem",maxWidth:"850px",lineHeight:1.75}}><p><Link href="/">Journey with Jesus</Link> / Policies</p><h1>{policy.title}</h1><p><strong>Draft for owner review — not yet a finalized legal notice.</strong></p>{policy.sections.map(section=><section key={section.heading} style={{marginTop:"2rem"}}><h2>{section.heading}</h2><p>{section.body}</p></section>)}</main>;
}
