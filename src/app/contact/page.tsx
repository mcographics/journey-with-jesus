import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import "./contact.css";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Kerygma Path with questions, feedback, and collaboration inquiries.",
  alternates: { canonical: "/contact/" },
  openGraph: {
    title: "Contact Kerygma Path",
    description: "Get in touch with the Kerygma Path animation studio.",
    url: "/contact/",
  },
};

export default function ContactPage() {
  return (
    <main className="contact-page" id="main-content">
      <div className="contact-page-inner">
        <header className="contact-heading">
          <p className="contact-eyebrow">Kerygma Path · Stay connected</p>
          <h1>Contact <em>Us</em></h1>
          <p>Have a question about our work, a collaboration idea, or a message for the studio? We would love to hear from you.</p>
        </header>
        <div className="contact-layout">
          <section className="contact-card" aria-labelledby="contact-form-title">
            <h2 id="contact-form-title">Send a message</h2>
            <p className="contact-card-intro">Complete the form below and your message will be sent privately to the Kerygma Path team.</p>
            <ContactForm />
          </section>
          <aside className="contact-aside">
            <p className="contact-aside-eyebrow">A journey of faith</p>
            <h2>Faith. Hope. Love. Redemption.</h2>
            <p>Our mission is to bring Scripture to life through meaningful, cinematic storytelling.</p>
            <p>For information about how we handle contact inquiries, please read our <Link href="/policies/privacy/">Privacy Policy</Link>.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
