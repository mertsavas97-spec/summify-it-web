import { AdminShell } from "@/components/admin/AdminShell";
import { BlogPostEditor } from "@/components/admin/blog/BlogPostEditor";
import { BLOG_POSTS } from "@/data/blog-posts";
import { requireAdminPage } from "@/lib/admin/requireAdmin";
import { createPageMetadata } from "@/lib/metadata";
import { isCmsBlogConfigured, listCmsBlogPosts } from "@/server/blog/cmsBlogRepository";

export const metadata = createPageMetadata({
  title: "New blog post",
  description: "Create a new Summify blog post.",
  path: "/dashboard/admin/blog/new",
  noIndex: true,
});

export default async function AdminBlogNewPage() {
  await requireAdminPage();

  const staticSlugs = BLOG_POSTS.map((p) => p.slug);
  const { posts } = await listCmsBlogPosts();
  const existingSlugs = [...new Set([...staticSlugs, ...posts.map((p) => p.slug)])];
  const extraBlogSlugs = posts.map((p) => ({ slug: p.slug, title: p.title }));

  return (
    <AdminShell title="New blog post" description="Draft markdown content with SEO tooling.">
      <BlogPostEditor
        post={null}
        cmsConfigured={isCmsBlogConfigured()}
        existingSlugs={existingSlugs}
        extraBlogSlugs={extraBlogSlugs}
      />
    </AdminShell>
  );
}
