import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Summify | Support, Feedback & Partnerships",
  description:
    "Contact Summify for support, partnerships, product feedback, and questions about AI summaries, audio learning, and podcast study tools.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-950/30 via-zinc-950/90 to-zinc-950 p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/90">Contact</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Support, feedback, and partnerships
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Reach out for product questions, bug reports, feature requests, and partnership conversations.
        </p>

        <ContactForm />
      </section>
    </div>
  );
}
