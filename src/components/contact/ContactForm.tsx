"use client";

import { useMemo, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

function createMathChallenge() {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  return {
    question: `${a} + ${b}`,
    answer: a + b,
  };
}

export function ContactForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState(() => createMathChallenge());

  const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_CONTACT_ENDPOINT;

  const buttonLabel = useMemo(() => {
    if (state === "submitting") return "Sending...";
    if (state === "success") return "Sent";
    return "Send message";
  }, [state]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const mathRaw = String(formData.get("mathAnswer") ?? "").trim();
    const mathAnswer = Number.parseInt(mathRaw, 10);

    if (!Number.isFinite(mathAnswer) || mathAnswer !== challenge.answer) {
      setState("error");
      setError("Please solve the math question correctly.");
      setChallenge(createMathChallenge());
      return;
    }

    if (!endpoint) {
      setState("error");
      setError("Message could not be sent right now. Please try again.");
      return;
    }

    setState("submitting");

    try {
      const payload = {
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        email: String(formData.get("email") ?? ""),
        subject: String(formData.get("subject") ?? ""),
        message: String(formData.get("message") ?? ""),
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("submit_failed");
      }

      setState("success");
      form.reset();
      setChallenge(createMathChallenge());
    } catch {
      setState("error");
      setError("Message could not be sent right now. Please try again.");
      setChallenge(createMathChallenge());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-300">First name *</span>
          <input
            name="firstName"
            required
            className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-400/45"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-300">Last name *</span>
          <input
            name="lastName"
            required
            className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-400/45"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-zinc-300">Email *</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-400/45"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-zinc-300">Subject</span>
        <input
          name="subject"
          className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-400/45"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-zinc-300">Message *</span>
        <textarea
          name="message"
          required
          rows={6}
          className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-400/45"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-zinc-300">
          Anti-bot: what is {challenge.question}? *
        </span>
        <input
          name="mathAnswer"
          inputMode="numeric"
          required
          className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-violet-400/45"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={state === "submitting"}
          className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {buttonLabel}
        </button>

        {state === "success" ? (
          <p className="text-sm text-emerald-300">Thanks — your message has been sent.</p>
        ) : null}
        {state === "error" ? (
          <p className="text-sm text-amber-200">
            {error ?? "Message could not be sent right now. Please try again."}
          </p>
        ) : null}
      </div>
    </form>
  );
}

