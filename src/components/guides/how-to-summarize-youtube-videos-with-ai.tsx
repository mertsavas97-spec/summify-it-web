import { GuideProse } from "@/components/guides/GuideProse";
import { InternalTextLink } from "@/components/public/InternalTextLink";

export function YoutubeSummarizeGuideBody() {
  return (
    <GuideProse>
      <p>
        YouTube is the world’s largest lecture hall and podcast network — but watching
        everything at 1× speed does not scale. This guide shows how to{" "}
        <strong>summarize YouTube videos with AI</strong> using transcripts, intelligence
        modes, and verification habits that keep outputs trustworthy for study and content
        planning.
      </p>

      <h2 id="prerequisites">Prerequisites: captions and transcripts</h2>
      <p>
        AI video summarization in Summify is transcript-first. The product fetches available
        captions or transcripts — it does not guess spoken content from audio alone. Before
        you paste a URL, confirm the video has captions (auto-generated is fine when accurate).
      </p>
      <p>
        Interviews with heavy accents, live streams with delay, and music-heavy uploads often
        produce weak captions. In those cases, upload a human transcript as TXT or choose a
        different source. Quality in equals quality out.
      </p>
      <p>
        Long videos benefit from mental chunking. Note chapter boundaries or topic shifts in
        the description, then analyze with those themes in mind when reviewing AI output.
      </p>

      <h2 id="workflow">Step-by-step workflow</h2>
      <ol>
        <li>Copy the public YouTube URL.</li>
        <li>
          Open the{" "}
          <InternalTextLink href="/upload">document analysis workspace</InternalTextLink> or
          start from the{" "}
          <InternalTextLink href="/summarize-youtube-video">YouTube summarizer page</InternalTextLink>.
        </li>
        <li>Paste the link and wait for transcript extraction.</li>
        <li>Select an intelligence mode aligned with your goal.</li>
        <li>Review structured summary, insights, and Learn cards.</li>
        <li>Verify critical quotes against the transcript before citing.</li>
      </ol>
      <p>
        Saved analyses can generate share links for teammates reviewing the same interview or
        webinar. Always remind recipients that summaries are starting points, not replacements
        for watching key sections when tone matters.
      </p>

      <h2 id="modes">Choosing an intelligence mode</h2>
      <p>
        <InternalTextLink href="/modes/the-student">The Student</InternalTextLink> suits
        lectures and explainers: concept cards, quizzes, and misconception prompts.{" "}
        <InternalTextLink href="/modes/executive-brief">Executive Brief</InternalTextLink>{" "}
        works for stakeholder interviews and earnings commentary.{" "}
        <InternalTextLink href="/modes/the-creator">The Creator</InternalTextLink> emphasizes
        hooks, beats, and repurposing angles for newsletters and short-form content.
      </p>
      <p>
        General Summary is ideal when you are exploring an unfamiliar channel before committing
        to a deeper workflow. Switch modes on a second pass if the first lens missed what you
        needed — compare emphasis side by side.
      </p>

      <h2 id="study-notes">Turning output into study notes</h2>
      <p>
        Exporting brain dumps is not studying. Convert AI output into an active review session:
        rewrite headings in your own words, star cards you miss in self-quiz, and link each
        concept back to a syllabus outcome. Pair video notes with{" "}
        <InternalTextLink href="/summarize-pdf">PDF readings</InternalTextLink> for courses that
        mix formats.
      </p>
      <p>
        Students should read our{" "}
        <InternalTextLink href="/guides/ai-study-notes-guide">AI study notes guide</InternalTextLink>{" "}
        for spaced review habits. Creators should cross-link to{" "}
        <InternalTextLink href="/for-creators">creator workflows</InternalTextLink> and{" "}
        <InternalTextLink href="/summarize-mp3">audio transcript flows</InternalTextLink> when
        episodes also ship as podcasts.
      </p>

      <h2 id="pitfalls">Common pitfalls</h2>
      <p>
        Trusting a summary of a summary — always spot-check primary sources for grades and
        publication. Assuming timestamps exist — Summify focuses on thematic transcript
        intelligence today. Uploading private or unlisted video you cannot share with AI
        providers. Ignoring caption errors — if the transcript garbles a term, the summary
        will too.
      </p>
      <p>
        Used with discipline, a YouTube summarizer saves hours orienting on long content while
        leaving judgment and verification where they belong — with you.
      </p>
    </GuideProse>
  );
}
