import { CollectionScreen } from "@/admin/components/CollectionScreen";
import { projectsConfig } from "@/admin/collections";

export const metadata = { title: "Admin · Projects" };

export default function Page() {
  return <CollectionScreen config={projectsConfig} />;
}
