# Paddle Review Positioning

This pass softens public-facing Summify copy so the product is clearly positioned as an AI document intelligence workspace, not a regulated professional service.

## Why Labels Were Softened

Paddle review may classify language like "legal analysis", "contract review", or "policy interpreter" as regulated professional services. Summify can still support contract and policy documents, but the public positioning should emphasize summaries, structured notes, and informational overviews.

Internal mode IDs were not renamed. Routes, saved analyses, mode routing, and existing data continue to use IDs such as `contract-analyzer` and `policy-interpreter`.

## Current Disclaimer

"Summify provides AI-generated summaries and learning aids for informational purposes only. It does not provide legal, financial, medical, or other regulated professional advice."

## Safe Copy Rules

Use:

- document summary
- contract summary
- clause summary
- policy summary
- informational overview
- structured notes
- risk signals
- points to review
- qualified professional review when needed
- not a substitute for professional advice

Avoid:

- legal advice
- financial advice
- medical advice
- professional advice as a product promise
- contract review
- legal review
- risk review
- compliance advice
- professional decision-making
- legal analysis
- legal interpretation

## Examples

Allowed:

- "Contract Summary creates an informational overview of clauses, obligations, and points to review."
- "Policy Summary summarizes rules, scope, and policy notes stated in the source."
- "Risk signals and points to review are grounded in the uploaded document."

Not allowed:

- "Get legal advice on your contract."
- "Automated contract review for compliance."
- "Professional legal interpretation."
- "Use Summify for legal or financial decision-making."

## Implementation Notes

- Public labels changed from "Contract Analyzer" to "Contract Summary".
- Public labels changed from "Policy Interpreter" to "Policy Summary".
- Public category changed from "Legal & Technical" to "Documents & Technical".
- The shared disclaimer lives in `src/lib/product-disclaimer.ts`.
- The reusable component lives in `src/components/public/ProductDisclaimer.tsx`.
