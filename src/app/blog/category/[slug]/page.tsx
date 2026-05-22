import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllBlogCategorySlugs,
  getBlogCategoryBySlug,
} from "@/data/blog-categories";
import { getPostsByCategory, buildBlogCategoryMetadata } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs";
import { BlogEndCta } from "@/components/blog/cta/BlogEndCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogCategoryPageJsonLd } from "@/lib/schema";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllBlogCategorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getBlogCategoryBySlug(slug);
  if (!category) return {};
  return buildBlogCategoryMetadata(category);
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getBlogCategoryBySlug(slug);
  if (!category) notFound();

  const posts = getPostsByCategory(category.id);

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: category.name, path: `/blog/category/${category.slug}` },
  ];

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLd data={blogCategoryPageJsonLd(category)} />
      <div className="mx-auto max-w-5xl">
        <BlogBreadcrumbs items={breadcrumbs} />
        <header className="mt-6 border-b border-white/[0.06] pb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
            {category.positioning}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{category.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
            {category.description}
          </p>
        </header>

        {posts.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-sm text-zinc-500">
            Articles in this category are coming soon.{" "}
            <Link href="/blog" className="text-violet-300 hover:text-violet-200">
              Browse all posts
            </Link>
            .
          </p>
        )}

        <footer className="mt-12">
          <BlogEndCta
            title={`Start your ${category.name.toLowerCase()} in Summify`}
            description="Upload sources, get structured analysis, complete Learn cards, and finish with a source-backed quiz."
          />
        </footer>
      </div>
    </div>
  );
}
