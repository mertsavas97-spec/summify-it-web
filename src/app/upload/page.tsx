import { UploadWorkspace } from "@/components/upload/UploadWorkspace";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageSeo } from "@/lib/page-metadata";
import { breadcrumbSchema, workspaceSoftwareApplicationSchema } from "@/lib/schema";

export const metadata = pageSeo.upload;

export default function UploadPage() {
  return (
    <>
      <JsonLd
        data={[
          workspaceSoftwareApplicationSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Workspace", path: "/upload" },
          ]),
        ]}
      />
      <UploadWorkspace />
    </>
  );
}
