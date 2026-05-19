import { pageSeo } from "@/lib/page-metadata";
import { getAllBlogPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { PublicHero } from "@/components/public/PublicHero";

export const metadata = pageSeo.blog;

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <>
      <PublicHero
        badge="Blog"
        title="Guides on AI summarization and study workflows"
        description="Practical, editorial guides on PDF summarization, YouTube study notes, and exam prep — written for students and knowledge workers using Summify."
        primaryCta={{ href: "/upload", label: "Try Summify free" }}
        secondaryCta={{ href: "/faq", label: "FAQ" }}
      />
      <section className="border-t border-white/[0.06] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  );
}
