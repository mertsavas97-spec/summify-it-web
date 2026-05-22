import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticleLayout } from "@/components/blog/BlogArticleLayout";
import { BlogMarkdownContent } from "@/components/blog/BlogMarkdownContent";
import { BlogProse } from "@/components/blog/BlogProse";
import { buildBlogPostMetadata } from "@/lib/seo";
import { getAllPublicBlogSlugs, getPublicBlogPostBySlug } from "@/lib/blog/resolvePost";
import type { PublicBlogPost } from "@/lib/blog/cmsToPublicPost";

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllPublicBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);
  if (!post) return {};
  return buildBlogPostMetadata(post);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);
  if (!post) notFound();

  const body =
    post.source === "cms" && post.markdownBody ? (
      <BlogProse>
        <BlogMarkdownContent markdown={post.markdownBody} />
      </BlogProse>
    ) : (
      <CmsStaticBody post={post} />
    );

  return <BlogArticleLayout post={post}>{body}</BlogArticleLayout>;
}

function CmsStaticBody({ post }: { post: PublicBlogPost }) {
  const { Content } = post;
  return <Content />;
}
