import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { BlogAdminList } from "@/components/admin/blog/BlogAdminList";
import { requireAdminPage } from "@/lib/admin/requireAdmin";
import { createPageMetadata } from "@/lib/metadata";
import { adminListBlogPosts } from "@/server/admin/blog/actions";
import { isCmsBlogConfigured } from "@/server/blog/cmsBlogRepository";

export const metadata = createPageMetadata({
  title: "Blog CMS",
  description: "Summify admin blog content management.",
  path: "/dashboard/admin/blog",
  noIndex: true,
});

export default async function AdminBlogListPage() {
  await requireAdminPage();

  const { posts, error } = await adminListBlogPosts({ sort: "updated_desc" });
  const cmsConfigured = isCmsBlogConfigured();

  const listPosts = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    categoryId: p.categoryId,
    status: p.status,
    seoScore: p.seoScore,
    updatedAt: p.updatedAt,
    publishedAt: p.publishedAt,
    source: p.source,
  }));

  return (
    <AdminShell
      title="Blog CMS"
      description="Create, edit, and publish markdown blog posts with live SEO scoring."
      actions={
        <Link
          href="/dashboard/admin/blog/new"
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
        >
          New post
        </Link>
      }
    >
      {!cmsConfigured ? (
        <p className="mb-4 text-sm text-amber-200/90">
          CMS storage unavailable — configure Supabase service role and run{" "}
          <code className="text-amber-100">docs/SUPABASE_MIGRATION_CMS_BLOG_POSTS.sql</code>.
        </p>
      ) : null}
      <BlogAdminList initialPosts={listPosts} initialError={error} />
    </AdminShell>
  );
}
