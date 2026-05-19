import { GuideProse } from "@/components/guides/GuideProse";
import { InternalTextLink } from "@/components/public/InternalTextLink";

export function ContractSummaryGuideBody() {
  return (
    <GuideProse>
      <p>
        Freelancers and operators increasingly reach for <strong>contract summary AI</strong>{" "}
        before calling counsel. Used correctly, it accelerates first-pass reading. Used
        carelessly, it creates false confidence. This guide defines scope, limits, and a
        verification workflow — with Summify Contract Summary mode as one example.
      </p>

      <h2 id="scope">What AI contract summary can do</h2>
      <p>
        Contract Summary mode highlights obligations, dates, payment terms, termination rights,
        and language that reads ambiguous — grounded in extracted text from your upload. It
        produces informational structure: summary sections, risk callouts, and questions to
        ask a human reviewer.
      </p>
      <p>
        It does not know your jurisdiction, industry customs, or which clauses your company
        always rejects. It cannot predict litigation outcomes. Treat output as a labeled map,
        not a verdict.
      </p>

      <h2 id="limits">Limits and disclaimers</h2>
      <p>
        Summify is not a law firm and does not provide legal advice. See the product disclaimer
        on mode pages and{" "}
        <InternalTextLink href="/for-freelancers">freelancer workflows</InternalTextLink>.
        Upload only documents you may process on third-party AI providers. Confidential
        agreements deserve enterprise review processes, not casual beta uploads.
      </p>
      <p>
        Scanned PDFs with poor OCR produce unreliable extractions. Prefer digital PDF or{" "}
        <InternalTextLink href="/summarize-docx">DOCX</InternalTextLink> exports when possible.
      </p>

      <h2 id="workflow">Recommended workflow</h2>
      <ol>
        <li>Upload PDF or DOCX to the workspace.</li>
        <li>
          Select{" "}
          <InternalTextLink href="/modes/contract-analyzer">Contract Summary</InternalTextLink>.
        </li>
        <li>Read structured summary and risk sections.</li>
        <li>List every clause you will verify manually in the source.</li>
        <li>Send open questions to qualified counsel before signing.</li>
      </ol>
      <p>
        Compare versions by analyzing each draft separately and diffing your own notes — AI
        diff for legal text is not a substitute for redlines from counsel.
      </p>

      <h2 id="freelancers">Freelancer checklist</h2>
      <p>
        Scope of work, payment timing, IP assignment, indemnity, limitation of liability,
        termination, and non-compete language deserve line-by-line human review. AI helps you
        know where to look first. Use our{" "}
        <InternalTextLink href="/use-cases/contracts-freelancers">
          contracts use case
        </InternalTextLink>{" "}
        for related links.
      </p>

      <h2 id="teams">Team procurement use</h2>
      <p>
        Procurement teams can triage vendor packets faster — ranking which agreements need
        full legal hours. Pair with{" "}
        <InternalTextLink href="/for-teams">team workflows</InternalTextLink> and Executive
        Brief for commercial terms in MSAs. Maintain a human gate before execution.
      </p>
      <p>
        Contract summary AI is a scalpel for attention, not a replacement for judgment. Use
        it to read smarter, then verify every line that binds you.
      </p>
    </GuideProse>
  );
}
