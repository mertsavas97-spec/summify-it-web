import { Suspense } from "react";
import { UploadWorkspace } from "@/components/upload/UploadWorkspace";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageSeo } from "@/lib/page-metadata";
import { breadcrumbSchema, workspaceSoftwareApplicationSchema } from "@/lib/schema";

export const metadata = pageSeo.upload;

export default function UploadPage() {
  return (
    <>
      <ProductEventTracker event="upload_page_view" />
      <JsonLd
        data={[
          workspaceSoftwareApplicationSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "AI Summarizer", path: "/upload" },
          ]),
        ]}
      />
      <Suspense fallback={<div className="min-h-[40vh]" aria-hidden />}>
        <UploadWorkspace />
      </Suspense>
    </>
  );
}
