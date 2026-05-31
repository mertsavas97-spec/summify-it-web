/** Shared public-facing copy for marketing and launch messaging. */

export const PUBLIC_BETA_LABEL = "Public beta";

/** Shown after the “Public beta” label in the site bar. */
export const PUBLIC_BETA_BANNER =
  "Turn PDFs, decks, videos, and articles into audio lessons and study cards — free during beta.";

export const PRICING_BETA_NOTE =
  "Billing provider review is pending. Pricing is visible for transparency, and current beta access remains unchanged.";

export const PRO_INTELLIGENCE_LABEL = "Pro Intelligence preview";

export const LOCKED_MODE_FOOTNOTE =
  "Preview only — select an active mode in the workspace to start learning.";

/** Trust and privacy messaging for upload, share, and footer surfaces. */
export const TRUST_SIGNALS = {
  publicBeta: PUBLIC_BETA_LABEL,
  uploadPrivacy:
    "Files are processed securely for your learning workflow. We do not use your private uploads to train AI models.",
  aiDisclaimer:
    "Outputs are AI-generated for learning — verify important facts before acting on them.",
  secureProcessing:
    "Encrypted in transit. Shared links include structured study outputs only — never your original files.",
  noTraining:
    "Your private documents are not used to train third-party foundation models.",
} as const;
