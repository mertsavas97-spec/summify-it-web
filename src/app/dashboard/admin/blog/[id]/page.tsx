import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { BlogPostEditor } from "@/components/admin/blog/BlogPostEditor";
import { BLOG_POSTS } from "@/data/blog-posts";
import { requireAdminPage } from "@/lib/admin/requireAdmin";
import { createPageMetadata } from "@/lib/metadata";
import {
  getCmsBlogPostById,
  isCmsBlogConfigured,
  listCmsBlogPosts,
} from "@/server/blog/cmsBlogRepository";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return createPageMetadata({
    title: `Edit post ${id}`,
    description: "Edit Summify blog post.",
    path: `/dashboard/admin/blog/${id}`,
    noIndex: true,
  });
}

export default async function AdminBlogEditPage({ params }: PageProps) {
  await requireAdminPage();
  const { id } = await params;
  const { post, error } = await getCmsBlogPostById(id);
  if (!post && !error) notFound();

  const staticSlugs = BLOG_POSTS.map((p) => p.slug);
  const { posts } = await listCmsBlogPosts();
  const existingSlugs = [...new Set([...staticSlugs, ...posts.map((p) => p.slug)])];
  const extraBlogSlugs = posts
    .filter((p) => p.id !== id)
    .map((p) => ({ slug: p.slug, title: p.title }));

  return (
    <AdminShell title="Edit blog post" description={post?.title ?? "Blog editor"}>
      {post ? (
        <BlogPostEditor
          post={post}
          cmsConfigured={isCmsBlogConfigured()}
          existingSlugs={existingSlugs}
          extraBlogSlugs={extraBlogSlugs}
        />
      ) : (
        <p className="text-sm text-rose-300/90">{error ?? "Post not found."}</p>
      )}
    </AdminShell>
  );
}
