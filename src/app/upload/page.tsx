import { UploadWorkspace } from "@/components/upload/UploadWorkspace";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageSeo } from "@/lib/page-metadata";
import { webApplicationSchema } from "@/lib/schema";

export const metadata = pageSeo.upload;

export default function UploadPage() {
  return (
    <>
      <JsonLd data={webApplicationSchema()} />
      <UploadWorkspace />
    </>
  );
}
