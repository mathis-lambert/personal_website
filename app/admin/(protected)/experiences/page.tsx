import { CollectionScreen } from "@/components/admin/shared/CollectionScreen";
import { experiencesConfig } from "@/components/admin/config/collections";

export const metadata = { title: "Admin · Experiences" };

export default function Page() {
  return <CollectionScreen config={experiencesConfig} />;
}
