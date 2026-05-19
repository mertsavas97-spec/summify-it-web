type BlogProseProps = {
  children: React.ReactNode;
};

/** Editorial typography for blog article bodies. */
export function BlogProse({ children }: BlogProseProps) {
  return (
    <div
      className="prose-blog space-y-5 text-[15px] leading-relaxed text-zinc-400 [&_a]:font-medium [&_a]:text-violet-300/90 [&_a]:underline-offset-2 hover:[&_a]:text-violet-200 hover:[&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-zinc-200 [&_li]:text-zinc-400 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:text-zinc-400 [&_strong]:font-medium [&_strong]:text-zinc-200 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
    >
      {children}
    </div>
  );
}
