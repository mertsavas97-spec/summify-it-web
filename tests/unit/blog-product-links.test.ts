import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BLOG_POSTS } from "../../src/data/blog-posts";
import { AUDIO_STUDY_BLOG_POSTS } from "../../src/data/audio-study-blog-registry";

/**
 * Systematic product-link coverage for blog bodies.
 *
 * Every published static post must route readers to at least one canonical
 * product page from its related links, so the archive does not drift into a
 * link-free silo as new posts are added.
 *
 * Canonical product pages:
 *   /summarize-pdf             — primary money page
 *   /summarize-powerpoint
 *   /summarize-youtube-video
 *   /audio-study
 *   /upload                    — workspace fallback (always acceptable)
 */
const CANONICAL_PRODUCT_PAGES = new Set([
  "/summarize-pdf",
  "/summarize-powerpoint",
  "/summarize-youtube-video",
  "/audio-study",
  "/upload",
]);

/** Cluster → the product page the post should point to. */
const CLUSTER_PRODUCT_PAGE: Record<string, string> = {
  "ai-pdf-summarizer": "/summarize-pdf",
  "pptx-summarizer": "/summarize-powerpoint",
  "ai-youtube-summarizer": "/summarize-youtube-video",
};

function productLinksOf(post: (typeof BLOG_POSTS)[number]): string[] {
  return (post.relatedLinks ?? [])
    .map((link) => link.href)
    .filter((href) => CANONICAL_PRODUCT_PAGES.has(href));
}

/** Cluster → product page required in the post *body* (rendered Content). */
const BODY_CLUSTER_PRODUCT_PAGE: Record<string, string> = {
  "ai-pdf-summarizer": "/summarize-pdf",
  "pptx-summarizer": "/summarize-powerpoint",
  "ai-youtube-summarizer": "/summarize-youtube-video",
  "audio-study": "/audio-study",
};

/**
 * Render the post body to markup and collect internal hrefs. Rendering (rather
 * than regexing source) catches links emitted by shared components such as
 * BlogInlineCta, and stays honest if a body is refactored into parts.
 */
function bodyLinksOf(post: (typeof BLOG_POSTS)[number]): string[] {
  const Content = post.Content;
  if (!Content) return [];
  let html: string;
  try {
    html = renderToStaticMarkup(createElement(Content));
  } catch (err) {
    throw new Error(`Body render failed for ${post.slug}: ${(err as Error).message}`);
  }
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
}

/**
 * BLOG_POSTS already spreads AUDIO_STUDY_BLOG_POSTS, so de-duplicate by slug
 * before body-level assertions.
 */
function uniquePosts(): (typeof BLOG_POSTS)[number][] {
  const seen = new Set<string>();
  const out: (typeof BLOG_POSTS)[number][] = [];
  for (const post of [...BLOG_POSTS, ...AUDIO_STUDY_BLOG_POSTS]) {
    if (seen.has(post.slug)) continue;
    seen.add(post.slug);
    out.push(post);
  }
  return out;
}

describe("blog product link coverage", () => {
  const allPosts = [...BLOG_POSTS, ...AUDIO_STUDY_BLOG_POSTS];

  it("every static blog post links at least one canonical product page", () => {
    const orphans = allPosts
      .filter((post) => productLinksOf(post).length === 0)
      .map((post) => post.slug);
    assert.deepEqual(
      orphans,
      [],
      `Posts missing a product link in relatedLinks: ${orphans.join(", ")}`,
    );
  });

  it("cluster posts link the product page matching their workflow cluster", () => {
    const mismatched: string[] = [];
    for (const post of allPosts) {
      const expected = CLUSTER_PRODUCT_PAGE[post.workflowCluster ?? ""];
      if (!expected) continue;
      const links = productLinksOf(post);
      if (!links.includes(expected)) {
        mismatched.push(`${post.slug} (cluster ${post.workflowCluster} → ${expected})`);
      }
    }
    assert.deepEqual(mismatched, [], `Cluster/product mismatches: ${mismatched.join(", ")}`);
  });

  it("audio study posts route to /audio-study or the workspace", () => {
    const missing = AUDIO_STUDY_BLOG_POSTS.filter((post) => {
      const links = productLinksOf(post);
      return !links.includes("/audio-study") && !links.includes("/upload");
    }).map((post) => post.slug);
    assert.deepEqual(
      missing,
      [],
      `Audio posts without an audio/workspace CTA: ${missing.join(", ")}`,
    );
  });

  it("no post links a canonical product page more than once", () => {
    const duplicated: string[] = [];
    for (const post of allPosts) {
      const links = productLinksOf(post);
      if (new Set(links).size !== links.length) duplicated.push(post.slug);
    }
    assert.deepEqual(duplicated, [], `Duplicate product links: ${duplicated.join(", ")}`);
  });
});

describe("blog body product link coverage", () => {
  const posts = uniquePosts();

  it("every static blog post body links at least one canonical product page", () => {
    const orphans = posts
      .filter((post) => bodyLinksOf(post).filter((href) => CANONICAL_PRODUCT_PAGES.has(href)).length === 0)
      .map((post) => post.slug);
    assert.deepEqual(
      orphans,
      [],
      `Post bodies without a product page link: ${orphans.join(", ")}`,
    );
  });

  it("cluster posts link their product page from the body", () => {
    const missing: string[] = [];
    for (const post of posts) {
      const expected = BODY_CLUSTER_PRODUCT_PAGE[post.workflowCluster ?? ""];
      if (!expected) continue;
      if (!bodyLinksOf(post).includes(expected)) {
        missing.push(`${post.slug} (cluster ${post.workflowCluster} → ${expected})`);
      }
    }
    assert.deepEqual(missing, [], `Body missing cluster product link: ${missing.join(", ")}`);
  });

  it("audio study posts link /audio-study from the body", () => {
    const missing = AUDIO_STUDY_BLOG_POSTS.filter((post) =>
      !bodyLinksOf(post).includes("/audio-study"),
    ).map((post) => post.slug);
    assert.deepEqual(
      missing,
      [],
      `Audio post bodies without an /audio-study link: ${missing.join(", ")}`,
    );
  });
});
