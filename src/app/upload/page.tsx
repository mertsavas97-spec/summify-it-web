import type { Metadata } from "next";
import { UploadWorkspace } from "@/components/upload/UploadWorkspace";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Upload",
  description:
    "Upload PDFs, PowerPoint, YouTube links, web articles, or text. Choose an intelligence mode and run structured analysis in the Summify.it public beta workspace.",
  path: "/upload",
});

export default function UploadPage() {
  return <UploadWorkspace />;
}
