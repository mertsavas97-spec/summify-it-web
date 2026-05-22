type BlogProseProps = {
  children: React.ReactNode;
};

/** Editorial typography for blog article bodies. */
export function BlogProse({ children }: BlogProseProps) {
  return (
    <div
      className="prose-blog space-y-5 text-[15px] leading-relaxed text-zinc-400 [&_a]:font-medium [&_a]:text-violet-300/90 [&_a]:underline-offset-2 hover:[&_a]:text-violet-200 hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-violet-500/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-zinc-900 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-white [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-zinc-200 [&_h4]:mt-5 [&_h4]:font-medium [&_h4]:text-zinc-200 [&_hr]:border-white/[0.08] [&_img]:mt-6 [&_img]:w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-white/[0.06] [&_li]:text-zinc-400 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:text-zinc-400 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-white/[0.06] [&_pre]:bg-zinc-950/80 [&_pre]:p-4 [&_strong]:font-medium [&_strong]:text-zinc-200 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
    >
      {children}
    </div>
  );
}
