import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllBlogSlugs, getBlogPostBySlug } from "@/lib/blog";
import { buildBlogPostMetadata } from "@/lib/seo";
import { BlogArticleLayout } from "@/components/blog/BlogArticleLayout";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};
  return buildBlogPostMetadata(post);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const { Content } = post;

  return (
    <BlogArticleLayout post={post}>
      <Content />
    </BlogArticleLayout>
  );
}
